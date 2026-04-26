/**
 * Sakha SSE Client
 *
 * Streams the backend `/api/voice-companion/message` endpoint via OkHttp +
 * a hand-rolled SSE parser. Why hand-rolled and not okhttp-sse? okhttp-sse
 * uses the EventSource RFC, which expects GETs. Our endpoint is POST + SSE
 * (the body carries the prompt), which EventSource cannot speak.
 *
 * The client emits a typed [SakhaStreamEvent] flow:
 *  - Token  — incremental text from the model
 *  - Verse  — verse citation metadata
 *  - Engine — engine-determined mood/intensity
 *  - Audio  — base64 audio chunk if the backend pre-synthesised TTS
 *  - Done   — stream finished cleanly
 *  - Error  — terminal error
 *
 * Behaviour:
 *  - One outstanding request per [SakhaSseClient] instance. [cancel] aborts.
 *  - Bearer token attached if the config supplies one.
 *  - On 401, attempts ONE silent refresh via the supplied [refreshToken] hook.
 *  - On 429, surfaces [SakhaVoiceError.QuotaExceeded].
 *  - On 5xx, retries with exponential backoff up to [SakhaVoiceConfig.maxRequestRetries].
 *  - Does not parse the model output for pause markers — that's the parser's
 *    job downstream.
 */

package com.mindvibe.kiaan.voice.sakha

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.ProducerScope
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.util.concurrent.TimeUnit

sealed class SakhaStreamEvent {
    data class Token(val text: String) : SakhaStreamEvent()
    data class Engine(val engine: SakhaEngine, val mood: SakhaMood, val intensity: Int) : SakhaStreamEvent()
    data class Verse(val reference: String, val sanskrit: String?, val translation: String?) : SakhaStreamEvent()
    data class Audio(val base64: String, val mimeType: String) : SakhaStreamEvent()
    data class Session(val sessionId: String) : SakhaStreamEvent()
    object Done : SakhaStreamEvent()
    data class Error(val error: SakhaVoiceError) : SakhaStreamEvent()
}

class SakhaSseClient(
    private val config: SakhaVoiceConfig,
    private val refreshToken: suspend () -> String? = { null },
) {

    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(config.requestTimeoutMs, TimeUnit.MILLISECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS) // SSE: never read-timeout
        .writeTimeout(config.requestTimeoutMs, TimeUnit.MILLISECONDS)
        .retryOnConnectionFailure(true)
        .build()

    @Volatile
    private var inflightCall: Call? = null

    /**
     * Open a Sakha streaming turn. The flow completes when the backend emits
     * [SakhaStreamEvent.Done] or a terminal error.
     */
    fun stream(
        userText: String,
        sessionId: String?,
        mood: SakhaMood? = null,
    ): Flow<SakhaStreamEvent> = callbackFlow {
        runRequest(userText, sessionId, mood)
        awaitClose {
            inflightCall?.cancel()
            inflightCall = null
        }
    }.flowOn(Dispatchers.IO)

    /** Cancel any in-flight request. Safe to call from any thread. */
    fun cancel() {
        inflightCall?.cancel()
        inflightCall = null
    }

    // ------------------------------------------------------------------------
    // Request driver
    // ------------------------------------------------------------------------

    /**
     * Drives the request lifecycle from inside the callbackFlow's
     * ProducerScope. We need the explicit receiver so [trySend] / [close]
     * resolve to the channel.
     */
    private suspend fun ProducerScope<SakhaStreamEvent>.runRequest(
        userText: String,
        sessionId: String?,
        mood: SakhaMood?,
    ) {
        var attempt = 0
        var token = config.authTokenProvider.invoke()
        var hasRetriedAuth = false

        while (true) {
            attempt++
            val url = "${config.backendBaseUrl.trimEnd('/')}${config.voiceCompanionPathPrefix}/message"
            val body = buildRequestBody(userText, sessionId, mood)

            val builder = Request.Builder()
                .url(url)
                .post(body.toRequestBody(JSON_MEDIA_TYPE))
                .header("Accept", "text/event-stream")
                .header("X-Client", "kiaanverse-android-sakha-voice")
                .header("X-Voice-Mode", "sakha")
            token?.let { builder.header("Authorization", "Bearer $it") }

            val call = httpClient.newCall(builder.build())
            inflightCall = call

            val outcome = try {
                executeOnce(call)
            } catch (io: IOException) {
                Outcome.NetworkFailure(io)
            } catch (t: Throwable) {
                Outcome.Unknown(t.message ?: "unknown")
            }

            when (outcome) {
                is Outcome.AuthExpired -> {
                    if (!hasRetriedAuth) {
                        hasRetriedAuth = true
                        val refreshed = refreshToken()
                        if (refreshed != null) {
                            token = refreshed
                            continue
                        }
                    }
                    trySend(SakhaStreamEvent.Error(SakhaVoiceError.AuthRequired))
                    close()
                    return
                }
                is Outcome.Quota -> {
                    trySend(SakhaStreamEvent.Error(SakhaVoiceError.QuotaExceeded))
                    close()
                    return
                }
                is Outcome.Server -> {
                    if (attempt <= config.maxRequestRetries) {
                        delay(backoff(attempt))
                        continue
                    }
                    trySend(SakhaStreamEvent.Error(SakhaVoiceError.HttpError(outcome.status, "Server error")))
                    close()
                    return
                }
                is Outcome.HttpFailure -> {
                    trySend(SakhaStreamEvent.Error(SakhaVoiceError.HttpError(outcome.status, outcome.detail ?: "Request failed")))
                    close()
                    return
                }
                is Outcome.NetworkFailure -> {
                    if (attempt <= config.maxRequestRetries) {
                        delay(backoff(attempt))
                        continue
                    }
                    trySend(SakhaStreamEvent.Error(SakhaVoiceError.NetworkError(outcome.cause.message ?: "io")))
                    close()
                    return
                }
                is Outcome.Unknown -> {
                    trySend(SakhaStreamEvent.Error(SakhaVoiceError.Unknown(outcome.detail)))
                    close()
                    return
                }
                is Outcome.Streamed -> {
                    consumeStream(outcome.response)
                    trySend(SakhaStreamEvent.Done)
                    close()
                    return
                }
            }
        }
    }

    private suspend fun executeOnce(call: Call): Outcome {
        val response = call.executeSuspending()
        val status = response.code

        if (status == 401 || status == 403) {
            response.closeQuietly()
            return Outcome.AuthExpired
        }
        if (status == 429) {
            response.closeQuietly()
            return Outcome.Quota
        }
        if (status >= 500) {
            response.closeQuietly()
            return Outcome.Server(status)
        }
        if (!response.isSuccessful) {
            val detail = try { response.body?.string()?.take(200) } catch (_: Exception) { null }
            response.closeQuietly()
            return Outcome.HttpFailure(status, detail)
        }
        return Outcome.Streamed(response)
    }

    private fun backoff(attempt: Int): Long = 500L * (1L shl (attempt - 1).coerceAtMost(4))

    // ------------------------------------------------------------------------
    // SSE consumption
    // ------------------------------------------------------------------------

    private suspend fun ProducerScope<SakhaStreamEvent>.consumeStream(response: Response) {
        val source = response.body?.charStream() ?: return
        val reader = BufferedReader(source)
        try {
            while (true) {
                ensureActive()
                val line = reader.readLine() ?: break
                val trimmed = line.trim()
                if (trimmed.isEmpty()) continue
                if (!trimmed.startsWith("data:")) continue
                val payload = trimmed.removePrefix("data:").trim()
                if (payload.isEmpty()) continue
                val event = parseFrame(payload) ?: continue
                trySend(event)
                if (event is SakhaStreamEvent.Done) return
            }
        } finally {
            try { reader.close() } catch (_: Exception) {}
            response.closeQuietly()
        }
    }

    /**
     * Parse a single SSE frame payload. The backend uses a few overlapping
     * shapes (see backend/routes/kiaan_voice_companion.py); we accept all of
     * them and normalise to [SakhaStreamEvent].
     */
    private fun parseFrame(payload: String): SakhaStreamEvent? {
        if (payload == "[DONE]") return SakhaStreamEvent.Done

        val json = try {
            JSONObject(payload)
        } catch (_: Exception) {
            // Legacy plain-text frame — treat as a token.
            return SakhaStreamEvent.Token(payload)
        }

        when (json.optString("type")) {
            "token" -> return SakhaStreamEvent.Token(json.optString("text", ""))
            "tts_chunk" -> return SakhaStreamEvent.Token(json.optString("text", ""))
            "voice_emotion" -> {
                val emotion = json.optString("emotion", "neutral")
                return SakhaStreamEvent.Engine(
                    engine = config.defaultEngine,
                    mood = SakhaMood.fromWire(emotion),
                    intensity = json.optInt("intensity", 5),
                )
            }
            "audio" -> return SakhaStreamEvent.Audio(
                base64 = json.optString("data", ""),
                mimeType = json.optString("mime", "audio/wav"),
            )
            "verse" -> return SakhaStreamEvent.Verse(
                reference = json.optString("ref", ""),
                sanskrit = json.optString("sanskrit").ifEmpty { null },
                translation = json.optString("translation").ifEmpty { null },
            )
            "session" -> return SakhaStreamEvent.Session(json.optString("session_id", ""))
            "done" -> return SakhaStreamEvent.Done
            "error" -> {
                val code = json.optString("code", "")
                val msg = json.optString("message", "Unknown")
                return SakhaStreamEvent.Error(when (code) {
                    "quota_exceeded" -> SakhaVoiceError.QuotaExceeded
                    "auth_required" -> SakhaVoiceError.AuthRequired
                    else -> SakhaVoiceError.Unknown(msg)
                })
            }
        }

        // Legacy `{"word": "...", "done": false}` shape used by /chat/message/stream
        if (json.has("word")) return SakhaStreamEvent.Token(json.optString("word", ""))
        if (json.optBoolean("done", false)) return SakhaStreamEvent.Done
        if (json.has("session_id")) return SakhaStreamEvent.Session(json.optString("session_id", ""))
        return null
    }

    // ------------------------------------------------------------------------
    // Request body
    // ------------------------------------------------------------------------

    private fun buildRequestBody(userText: String, sessionId: String?, mood: SakhaMood?): String {
        val payload = JSONObject().apply {
            put("message", userText)
            put("language", config.language.wire)
            put("voice_id", config.sakhaVoiceId)
            put("content_type", "voice")
            put("voice_mode", "sakha")
            put("stream", true)
            sessionId?.let { put("session_id", it) }
            mood?.let { put("mood_hint", it.wire) }
        }
        return payload.toString()
    }

    // ------------------------------------------------------------------------
    // OkHttp helpers
    // ------------------------------------------------------------------------

    private suspend fun Call.executeSuspending(): Response =
        suspendCancellableCoroutine { cont ->
            enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    if (cont.isActive) cont.resumeWith(Result.failure(e))
                }

                override fun onResponse(call: Call, response: Response) {
                    if (cont.isActive) cont.resumeWith(Result.success(response))
                }
            })
            cont.invokeOnCancellation { runCatching { cancel() } }
        }

    private fun Response.closeQuietly() {
        try { close() } catch (_: Exception) {}
    }

    // ------------------------------------------------------------------------
    // Outcome (internal)
    // ------------------------------------------------------------------------

    private sealed class Outcome {
        object AuthExpired : Outcome()
        object Quota : Outcome()
        data class Server(val status: Int) : Outcome()
        data class HttpFailure(val status: Int, val detail: String?) : Outcome()
        data class NetworkFailure(val cause: IOException) : Outcome()
        data class Unknown(val detail: String) : Outcome()
        data class Streamed(val response: Response) : Outcome()
    }

    companion object {
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}

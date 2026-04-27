/**
 * Sakha Voice Manager
 *
 * Top-level orchestrator for the native Android Sakha Voice mode.
 *
 * One turn of conversation:
 *
 *   IDLE
 *     │
 *     ▼ activate()
 *   LISTENING ──────► silence-timeout / stopListening()
 *     │
 *     ▼ STT delivers final transcript
 *   TRANSCRIBING
 *     │
 *     ▼ open SSE
 *   REQUESTING ──────► first text frame
 *     │
 *     ▼ parser yields first speakable segment
 *   SPEAKING ⇄ PAUSING (driven by parser events)
 *     │
 *     ▼ stream done & queue drained
 *   IDLE
 *
 * Barge-in: while SPEAKING, the wake-word/STT layer can still detect a new
 * user utterance. When [allowBargeIn] is true, we transition to INTERRUPTED,
 * stop the player, and start a new LISTENING turn immediately.
 *
 * Thread model: all listener callbacks fire on Dispatchers.Main. Internal
 * pipeline runs on Dispatchers.IO / Default.
 */

package com.mindvibe.kiaan.voice.sakha

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class SakhaVoiceManager private constructor(private val context: Context) {

    companion object {
        private const val TAG = "SakhaVoiceManager"

        @Volatile
        private var instance: SakhaVoiceManager? = null

        fun getInstance(context: Context): SakhaVoiceManager {
            return instance ?: synchronized(this) {
                instance ?: SakhaVoiceManager(context.applicationContext).also { instance = it }
            }
        }
    }

    private lateinit var config: SakhaVoiceConfig
    private var listener: SakhaVoiceListener = object : SakhaVoiceListener {}
    private var initialized = false

    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val turnMutex = Mutex()

    private val _state = MutableStateFlow(SakhaVoiceState.UNINITIALIZED)
    val state: StateFlow<SakhaVoiceState> = _state.asStateFlow()

    private val _partialTranscript = MutableStateFlow("")
    val partialTranscript: StateFlow<String> = _partialTranscript.asStateFlow()

    private var sessionId: String? = null
    private var turnCount: Int = 0
    private var lastFinalTranscript: String = ""
    private var currentEngine: SakhaEngine = SakhaEngine.FRIEND
    private var currentMood: SakhaMood = SakhaMood.NEUTRAL
    private var currentMoodIntensity: Int = 5

    private var speechRecognizer: SpeechRecognizer? = null
    private var sseClient: SakhaSseClient? = null
    private var ttsPlayer: SakhaTtsPlayer? = null
    private var parser: SakhaPauseParser = SakhaPauseParser()

    private var sttJob: Job? = null
    private var streamJob: Job? = null
    private var silenceJob: Job? = null
    private var maxResponseGuardJob: Job? = null

    // Per-turn metric counters
    private var turnStartedAtMs: Long = 0L
    private var sttStartedAtMs: Long = 0L
    private var firstByteMs: Long = 0L
    private var firstAudioMs: Long = 0L
    private var responseChars: Int = 0
    private var verseCited: String? = null
    private var personaGuardTriggered: Boolean = false
    private var filterFail: Boolean = false
    private var barged: Boolean = false

    // ========================================================================
    // Public API
    // ========================================================================

    /**
     * Initialise the manager with [SakhaVoiceConfig]. Idempotent — safe to
     * call again with a new config (e.g. when the user changes language).
     */
    fun initialize(config: SakhaVoiceConfig, listener: SakhaVoiceListener) {
        this.config = config
        this.listener = listener
        this.sseClient = SakhaSseClient(config = config, refreshToken = { config.authTokenProvider() })
        this.ttsPlayer = SakhaTtsPlayer(context, config, internalListener)
        initialized = true
        setState(SakhaVoiceState.IDLE)
    }

    fun hasRecordPermission(): Boolean = ContextCompat.checkSelfPermission(
        context, Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED

    /** Begin a new voice turn — opens the mic. */
    fun activate() {
        ensureInitialized()
        scope.launch {
            turnMutex.withLock {
                if (_state.value == SakhaVoiceState.SPEAKING ||
                    _state.value == SakhaVoiceState.PAUSING) {
                    if (config.allowBargeIn) {
                        barged = true
                        stopSpeakingInternal()
                    } else {
                        return@withLock
                    }
                }
                if (!hasRecordPermission()) {
                    listener.onError(SakhaVoiceError.PermissionDenied)
                    return@withLock
                }
                resetTurnMetrics()
                turnStartedAtMs = System.currentTimeMillis()
                startListening()
            }
        }
    }

    /** User explicitly stopped speaking — finalise transcript and request response. */
    fun stopListening() {
        scope.launch {
            speechRecognizer?.let {
                withContext(Dispatchers.Main) { it.stopListening() }
            }
        }
    }

    /** Cancel everything in flight and return to IDLE. */
    fun cancelTurn() {
        scope.launch {
            stopListeningInternal()
            stopRequestInternal()
            stopSpeakingInternal()
            setState(SakhaVoiceState.IDLE)
        }
    }

    /** Permanently release resources. Call from onDestroy. */
    fun shutdown() {
        cancelTurn()
        scope.launch {
            withContext(Dispatchers.Main) {
                speechRecognizer?.destroy()
                speechRecognizer = null
            }
            ttsPlayer?.shutdown()
            ttsPlayer = null
            sseClient?.cancel()
            sseClient = null
        }
        setState(SakhaVoiceState.SHUTDOWN)
        scope.cancel()
    }

    fun resetSession() {
        sessionId = null
        turnCount = 0
    }

    // ========================================================================
    // STT
    // ========================================================================

    private suspend fun startListening() {
        withContext(Dispatchers.Main) {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(context)) {
                    listener.onError(SakhaVoiceError.SpeechRecognitionUnavailable)
                    return@withContext
                }
                speechRecognizer?.destroy()
                val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
                recognizer.setRecognitionListener(recognitionListener)
                speechRecognizer = recognizer

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, config.language.sttLocale.toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                }
                sttStartedAtMs = System.currentTimeMillis()
                setState(SakhaVoiceState.LISTENING)
                recognizer.startListening(intent)
                armSilenceTimer()
            } catch (t: Throwable) {
                listener.onError(SakhaVoiceError.Unknown(t.message ?: "stt-init"))
                setState(SakhaVoiceState.ERROR)
            }
        }
    }

    private fun armSilenceTimer() {
        silenceJob?.cancel()
        silenceJob = scope.launch {
            delay(config.silenceTimeoutMs)
            withContext(Dispatchers.Main) { speechRecognizer?.stopListening() }
        }
    }

    private fun resetSilenceTimer() = armSilenceTimer()

    private suspend fun stopListeningInternal() {
        silenceJob?.cancel()
        withContext(Dispatchers.Main) {
            try { speechRecognizer?.cancel() } catch (_: Exception) {}
            try { speechRecognizer?.destroy() } catch (_: Exception) {}
            speechRecognizer = null
        }
    }

    private val recognitionListener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() { resetSilenceTimer() }
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}

        override fun onError(error: Int) {
            scope.launch {
                silenceJob?.cancel()
                if (error == SpeechRecognizer.ERROR_NO_MATCH ||
                    error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                    // No speech — return to IDLE softly.
                    setState(SakhaVoiceState.IDLE)
                    return@launch
                }
                val mapped = when (error) {
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> SakhaVoiceError.PermissionDenied
                    SpeechRecognizer.ERROR_NETWORK,
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> SakhaVoiceError.NetworkError("stt-$error")
                    SpeechRecognizer.ERROR_AUDIO -> SakhaVoiceError.MicrophoneUnavailable
                    else -> SakhaVoiceError.Unknown("stt-$error")
                }
                listener.onError(mapped)
                setState(SakhaVoiceState.ERROR)
            }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val text = matches?.firstOrNull() ?: return
            _partialTranscript.value = text
            scope.launch(Dispatchers.Main) { listener.onPartialTranscript(text) }
            resetSilenceTimer()
        }

        override fun onResults(results: Bundle?) {
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val text = matches?.firstOrNull()?.trim().orEmpty()
            scope.launch(Dispatchers.Main) {
                if (text.isEmpty()) {
                    setState(SakhaVoiceState.IDLE)
                    return@launch
                }
                lastFinalTranscript = text
                listener.onFinalTranscript(text)
                openTurn(text)
            }
        }
    }

    // ========================================================================
    // SSE turn
    // ========================================================================

    private fun openTurn(userText: String) {
        setState(SakhaVoiceState.TRANSCRIBING)
        parser.reset()
        ttsPlayer?.start()
        responseChars = 0
        verseCited = null
        personaGuardTriggered = false
        filterFail = false
        firstByteMs = 0L
        firstAudioMs = 0L
        turnCount += 1

        streamJob?.cancel()
        streamJob = scope.launch {
            armMaxResponseGuard()
            setState(SakhaVoiceState.REQUESTING)
            val client = sseClient ?: return@launch
            try {
                client.stream(userText, sessionId, currentMood, turnCount).collect { event ->
                    handleStreamEvent(event)
                }
                // Flow completed without explicit Done (e.g. server closed early)
                drainAndFinish()
            } catch (t: Throwable) {
                listener.onError(SakhaVoiceError.Unknown(t.message ?: "stream"))
                setState(SakhaVoiceState.ERROR)
            }
        }
    }

    private fun armMaxResponseGuard() {
        maxResponseGuardJob?.cancel()
        maxResponseGuardJob = scope.launch {
            delay(config.maxResponseSpokenMs)
            // If we are still speaking after this, cut it off gracefully.
            if (_state.value == SakhaVoiceState.SPEAKING ||
                _state.value == SakhaVoiceState.PAUSING) {
                stopSpeakingInternal()
                completeTurn()
            }
        }
    }

    private suspend fun handleStreamEvent(event: SakhaStreamEvent) {
        if (firstByteMs == 0L) firstByteMs = System.currentTimeMillis() - turnStartedAtMs
        when (event) {
            is SakhaStreamEvent.Token -> {
                responseChars += event.text.length
                listener.onSakhaText(event.text, isFinal = false)
                feedParser(event.text)
            }
            is SakhaStreamEvent.Engine -> {
                currentEngine = event.engine
                currentMood = event.mood
                currentMoodIntensity = event.intensity
                withContext(Dispatchers.Main) {
                    listener.onEngineSelected(event.engine, event.mood, event.intensity)
                }
            }
            is SakhaStreamEvent.Verse -> {
                verseCited = event.reference
                withContext(Dispatchers.Main) {
                    listener.onVerseCited(event.reference, event.sanskrit)
                }
            }
            is SakhaStreamEvent.Audio -> {
                // Backend pre-synthesised audio — we currently don't use this
                // path (we synthesise client-side via /synthesize for pause
                // control), but we keep the hook open for future tiers.
            }
            is SakhaStreamEvent.Session -> {
                sessionId = event.sessionId
            }
            SakhaStreamEvent.Done -> {
                drainAndFinish()
            }
            is SakhaStreamEvent.Error -> {
                listener.onError(event.error)
                setState(SakhaVoiceState.ERROR)
                completeTurn()
            }
        }
    }

    private suspend fun feedParser(text: String) {
        val events = parser.feed(text)
        if (events.isEmpty()) return
        if (_state.value != SakhaVoiceState.SPEAKING && _state.value != SakhaVoiceState.PAUSING) {
            setState(SakhaVoiceState.SPEAKING)
            if (firstAudioMs == 0L) firstAudioMs = System.currentTimeMillis() - turnStartedAtMs
        }
        for (e in events) handleParserEvent(e)
    }

    private suspend fun handleParserEvent(e: PauseEvent) {
        when (e) {
            is PauseEvent.Filter -> {
                filterFail = true
                if (config.speakOnFilterFail) {
                    val template = filterFailTemplate()
                    ttsPlayer?.enqueue(PauseEvent.Speak(template, isSanskrit = false))
                }
                ttsPlayer?.enqueue(PauseEvent.Filter)
            }
            else -> ttsPlayer?.enqueue(e)
        }
    }

    private suspend fun drainAndFinish() {
        // Final flush of buffered prose.
        for (ev in parser.finish()) handleParserEvent(ev)
        ttsPlayer?.finish()
        // Wait a tick for the playback queue to drain. We do not block on
        // playback completion — that's the player's responsibility — but we
        // do want to capture a final metric snapshot when the queue empties.
        delay(50L)
        completeTurn()
    }

    private fun completeTurn() {
        maxResponseGuardJob?.cancel()
        val player = ttsPlayer
        val totalSpoken = player?.statsTotalSpokenMs() ?: 0L
        val pauses = player?.statsPauseCount() ?: 0
        val sttMs = (System.currentTimeMillis() - sttStartedAtMs).coerceAtLeast(0L)

        val metrics = SakhaTurnMetrics(
            sessionId = sessionId,
            engine = currentEngine,
            mood = currentMood,
            moodIntensity = currentMoodIntensity,
            language = config.language,
            transcriptChars = lastFinalTranscript.length,
            responseChars = responseChars,
            sttDurationMs = sttMs,
            firstByteMs = firstByteMs,
            firstAudioMs = firstAudioMs,
            totalSpokenMs = totalSpoken,
            pauseCount = pauses,
            verseCited = verseCited,
            filterFail = filterFail,
            personaGuardTriggered = personaGuardTriggered,
            barged = barged,
        )
        scope.launch(Dispatchers.Main) { listener.onTurnComplete(metrics) }
        setState(SakhaVoiceState.IDLE)
    }

    private fun resetTurnMetrics() {
        firstByteMs = 0L
        firstAudioMs = 0L
        responseChars = 0
        verseCited = null
        personaGuardTriggered = false
        filterFail = false
        barged = false
    }

    private fun stopRequestInternal() {
        streamJob?.cancel()
        streamJob = null
        sseClient?.cancel()
    }

    private fun stopSpeakingInternal() {
        ttsPlayer?.stop()
        ttsPlayer?.start() // re-arm for next turn
    }

    // ========================================================================
    // Filter-fail template (per persona spec — soft, not a sign-off)
    // ========================================================================

    private fun filterFailTemplate(): String = when (config.language) {
        SakhaLanguage.HINDI, SakhaLanguage.HINGLISH -> "रहो… एक साँस। अभी मेरे पास सही श्लोक नहीं है — पर मैं यहाँ हूँ।"
        SakhaLanguage.TAMIL -> "ஒரு மூச்சு… நான் இங்கே இருக்கிறேன்."
        SakhaLanguage.TELUGU -> "ఒక శ్వాస… నేను ఇక్కడ ఉన్నాను."
        SakhaLanguage.BENGALI -> "এক নিঃশ্বাস… আমি এখানে আছি।"
        SakhaLanguage.MARATHI -> "एक श्वास… मी इथेच आहे।"
        else -> "Stay with me. One breath. I do not have the verse yet — but I am here."
    }

    // ========================================================================
    // State helpers
    // ========================================================================

    private fun setState(next: SakhaVoiceState) {
        val prev = _state.value
        if (next == prev) return
        _state.value = next
        if (config.debugMode) Log.d(TAG, "state $prev → $next")
        scope.launch(Dispatchers.Main) { listener.onStateChanged(next, prev) }
    }

    private fun ensureInitialized() {
        check(initialized) { "SakhaVoiceManager.initialize() must be called first" }
    }

    // ========================================================================
    // Internal listener used by the TTS player. We forward to the user's
    // listener and capture metrics here.
    // ========================================================================

    private val internalListener: SakhaVoiceListener = object : SakhaVoiceListener {
        override fun onSpokenSegment(text: String, isSanskrit: Boolean) {
            scope.launch(Dispatchers.Main) { listener.onSpokenSegment(text, isSanskrit) }
        }
        override fun onPause(durationMs: Long) {
            // Toggle PAUSING during the pause; the next Speak job flips us back.
            setState(SakhaVoiceState.PAUSING)
            scope.launch(Dispatchers.Main) { listener.onPause(durationMs) }
            scope.launch {
                delay(durationMs)
                if (_state.value == SakhaVoiceState.PAUSING) {
                    setState(SakhaVoiceState.SPEAKING)
                }
            }
        }
        override fun onFilterFail() {
            scope.launch(Dispatchers.Main) { listener.onFilterFail() }
        }
        override fun onError(error: SakhaVoiceError) {
            scope.launch(Dispatchers.Main) { listener.onError(error) }
        }
    }
}

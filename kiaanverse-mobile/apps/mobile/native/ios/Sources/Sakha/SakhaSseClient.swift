/**
 * Sakha SSE Client (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaSseClient.kt. Uses
 * URLSessionDataTask with a delegate to receive incremental chunks of
 * the POST→SSE response from `/api/voice-companion/sakha/stream`. The
 * backend speaks SSE-over-POST (not RFC EventSource) because the prompt
 * lives in the body — same constraint as Android.
 *
 * Emits typed `SakhaStreamEvent` values via a callback. Single in-flight
 * request per instance; `cancel()` aborts.
 *
 * Auth + retry policy matches Android exactly:
 *   - 401/403: one silent refreshToken attempt, then SakhaVoiceError.authRequired
 *   - 429:     SakhaVoiceError.quotaExceeded (no retry)
 *   - 5xx:     exponential backoff, up to config.maxRequestRetries
 *   - I/O:     same backoff, same cap
 */

import Foundation

public enum SakhaStreamEvent {
    case token(text: String)
    case engine(engine: SakhaEngine, mood: SakhaMood, intensity: Int)
    case verse(reference: String, sanskrit: String?, translation: String?)
    case audio(base64: String, mimeType: String)
    case session(sessionId: String)
    case done
    case error(SakhaVoiceError)
}

public final class SakhaSseClient {

    private let config: SakhaVoiceConfig
    /// Async closure that returns a refreshed bearer token, or nil to give up.
    private let refreshToken: () async -> String?
    /// Async closure that returns the current bearer token (or nil).
    private let authTokenProvider: () async -> String?

    private let session: URLSession
    private let delegate: SseDelegate
    private var task: URLSessionDataTask?
    private var isCancelled = false

    public init(
        config: SakhaVoiceConfig,
        authTokenProvider: @escaping () async -> String?,
        refreshToken: @escaping () async -> String? = { nil }
    ) {
        self.config = config
        self.authTokenProvider = authTokenProvider
        self.refreshToken = refreshToken

        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = TimeInterval(config.requestTimeoutMs) / 1000.0
        // SSE is open-ended — we never want a "read timeout" while the
        // server is happily streaming tokens.
        sessionConfig.timeoutIntervalForResource = .greatestFiniteMagnitude

        let delegate = SseDelegate()
        self.delegate = delegate
        self.session = URLSession(configuration: sessionConfig, delegate: delegate, delegateQueue: nil)
    }

    /// Open a Sakha streaming turn. The handler is invoked for each parsed
    /// SakhaStreamEvent in arrival order. After `.done` or `.error(...)`,
    /// the handler is not invoked again.
    public func stream(
        userText: String,
        sessionId: String?,
        mood: SakhaMood?,
        turnCount: Int,
        onEvent: @escaping (SakhaStreamEvent) -> Void
    ) {
        isCancelled = false
        Task { await self.runRequest(userText: userText, sessionId: sessionId, mood: mood, turnCount: turnCount, onEvent: onEvent) }
    }

    /// Cancel any in-flight request.
    public func cancel() {
        isCancelled = true
        task?.cancel()
        task = nil
    }

    // MARK: - Request driver

    private func runRequest(
        userText: String,
        sessionId: String?,
        mood: SakhaMood?,
        turnCount: Int,
        onEvent: @escaping (SakhaStreamEvent) -> Void
    ) async {
        var attempt = 0
        var token = await authTokenProvider()
        var hasRetriedAuth = false

        while !isCancelled {
            attempt += 1

            let url = "\(trimSlash(config.backendBaseUrl))\(config.voiceCompanionPathPrefix)/sakha/stream"
            guard let endpoint = URL(string: url) else {
                onEvent(.error(.unknown("invalid url: \(url)")))
                return
            }

            var request = URLRequest(url: endpoint)
            request.httpMethod = "POST"
            request.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
            request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
            request.setValue("kiaanverse-ios-sakha-voice", forHTTPHeaderField: "X-Client")
            request.setValue("sakha", forHTTPHeaderField: "X-Voice-Mode")
            if let token = token, !token.isEmpty {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            request.httpBody = buildRequestBody(userText: userText, sessionId: sessionId, mood: mood, turnCount: turnCount)

            // Wire delegate handlers for this attempt.
            delegate.reset(onLine: { [weak self] payload in
                guard let self = self, !self.isCancelled else { return }
                if let event = self.parseFrame(payload) {
                    onEvent(event)
                    if case .done = event {
                        self.task?.cancel()
                    }
                }
            })

            let outcome: AttemptOutcome = await withCheckedContinuation { continuation in
                let dataTask = session.dataTask(with: request)
                self.task = dataTask
                delegate.onCompletion = { status, error in
                    if let error = error as NSError?, error.domain == NSURLErrorDomain, error.code == NSURLErrorCancelled {
                        continuation.resume(returning: .cancelled)
                        return
                    }
                    if let error = error {
                        continuation.resume(returning: .networkFailure(error.localizedDescription))
                        return
                    }
                    if status == 401 || status == 403 {
                        continuation.resume(returning: .authExpired)
                        return
                    }
                    if status == 429 {
                        continuation.resume(returning: .quota)
                        return
                    }
                    if status >= 500 {
                        continuation.resume(returning: .server(status))
                        return
                    }
                    if status >= 400 {
                        continuation.resume(returning: .httpFailure(status))
                        return
                    }
                    continuation.resume(returning: .streamed)
                }
                dataTask.resume()
            }

            switch outcome {
            case .streamed:
                // delegate already streamed events including .done if backend sent it.
                onEvent(.done)
                return
            case .cancelled:
                return
            case .authExpired:
                if !hasRetriedAuth {
                    hasRetriedAuth = true
                    if let refreshed = await refreshToken() {
                        token = refreshed
                        continue
                    }
                }
                onEvent(.error(.authRequired))
                return
            case .quota:
                onEvent(.error(.quotaExceeded))
                return
            case .server(let status):
                if attempt <= config.maxRequestRetries {
                    try? await Task.sleep(nanoseconds: backoffNanos(attempt: attempt))
                    continue
                }
                onEvent(.error(.httpError(status, "Server error")))
                return
            case .httpFailure(let status):
                onEvent(.error(.httpError(status, "Request failed")))
                return
            case .networkFailure(let detail):
                if attempt <= config.maxRequestRetries {
                    try? await Task.sleep(nanoseconds: backoffNanos(attempt: attempt))
                    continue
                }
                onEvent(.error(.networkError(detail)))
                return
            }
        }
    }

    private func backoffNanos(attempt: Int) -> UInt64 {
        let shifted = min(attempt - 1, 4)
        let ms: UInt64 = 500 * (1 << shifted)
        return ms * 1_000_000
    }

    private func trimSlash(_ s: String) -> String {
        if s.hasSuffix("/") { return String(s.dropLast()) }
        return s
    }

    private func buildRequestBody(userText: String, sessionId: String?, mood: SakhaMood?, turnCount: Int) -> Data {
        var payload: [String: Any] = [
            "message": userText,
            "language": config.language.wire,
            "turn_count": max(turnCount, 1),
        ]
        if let sessionId = sessionId { payload["session_id"] = sessionId }
        if let mood = mood { payload["mood_hint"] = mood.wire }
        return (try? JSONSerialization.data(withJSONObject: payload, options: [])) ?? Data()
    }

    // MARK: - SSE frame parsing

    /// Parse a single SSE frame payload (the part after `data:`). Returns
    /// nil for frames the consumer should silently skip (e.g. tts_chunk
    /// repeats — already segmented by SakhaPauseParser).
    private func parseFrame(_ payload: String) -> SakhaStreamEvent? {
        if payload == "[DONE]" { return .done }

        guard let data = payload.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
        else {
            // Legacy plain-text frame — treat as a token.
            return .token(text: payload)
        }

        let type = (json["type"] as? String) ?? ""

        switch type {
        case "token":
            return .token(text: (json["text"] as? String) ?? "")
        case "tts_chunk":
            // Parser-side dedupe: tts_chunk repeats accumulated tokens that
            // we've already parsed via "token" frames. Ignore.
            return nil
        case "engine":
            return .engine(
                engine: SakhaEngine.fromWire(json["engine"] as? String),
                mood: SakhaMood.fromWire(json["mood"] as? String),
                intensity: (json["intensity"] as? Int) ?? 5
            )
        case "voice_emotion":
            return .engine(
                engine: config.defaultEngine,
                mood: SakhaMood.fromWire(json["emotion"] as? String),
                intensity: (json["intensity"] as? Int) ?? 5
            )
        case "audio":
            return .audio(
                base64: (json["data"] as? String) ?? "",
                mimeType: (json["mime"] as? String) ?? "audio/wav"
            )
        case "verse":
            let sanskrit = (json["sanskrit"] as? String).flatMap { $0.isEmpty ? nil : $0 }
            let translation = (json["translation"] as? String).flatMap { $0.isEmpty ? nil : $0 }
            return .verse(
                reference: (json["ref"] as? String) ?? "",
                sanskrit: sanskrit,
                translation: translation
            )
        case "session":
            return .session(sessionId: (json["session_id"] as? String) ?? "")
        case "done":
            return .done
        case "error":
            let code = (json["code"] as? String) ?? ""
            let msg = (json["message"] as? String) ?? "Unknown"
            switch code {
            case "quota_exceeded": return .error(.quotaExceeded)
            case "auth_required":  return .error(.authRequired)
            default:               return .error(.unknown(msg))
            }
        default:
            // Legacy `{"word": "..."}` and `{"done": true}` shapes from /chat/message/stream.
            if let word = json["word"] as? String { return .token(text: word) }
            if let done = json["done"] as? Bool, done { return .done }
            if let session = json["session_id"] as? String { return .session(sessionId: session) }
            return nil
        }
    }

    // MARK: - Outcome

    private enum AttemptOutcome {
        case streamed
        case cancelled
        case authExpired
        case quota
        case server(Int)
        case httpFailure(Int)
        case networkFailure(String)
    }
}

// MARK: - URLSessionDataDelegate

/// Delegate buffers incoming bytes and emits one SSE `data:` payload at
/// a time to its `onLine` handler. Lifecycle: configured per-attempt by
/// the client via `reset(onLine:)`. `onCompletion` fires once when the
/// task ends with the final HTTP status (or 0 + error).
private final class SseDelegate: NSObject, URLSessionDataDelegate {

    var onCompletion: ((Int, Error?) -> Void)?
    private var onLine: ((String) -> Void)?
    private var buffer = Data()
    private var status: Int = 0

    func reset(onLine: @escaping (String) -> Void) {
        self.onLine = onLine
        self.buffer = Data()
        self.status = 0
    }

    func urlSession(_ session: URLSession,
                    dataTask: URLSessionDataTask,
                    didReceive response: URLResponse,
                    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        if let http = response as? HTTPURLResponse {
            status = http.statusCode
        }
        completionHandler(.allow)
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        buffer.append(data)
        flushLines()
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        // Final flush in case the server closed without a trailing newline.
        flushLines()
        onCompletion?(status, error)
    }

    /// Walks `buffer`, emits each newline-terminated `data:` payload, and
    /// keeps the trailing partial line for the next chunk.
    private func flushLines() {
        while let nlRange = buffer.range(of: Data([0x0A])) {
            let lineData = buffer.subdata(in: 0..<nlRange.lowerBound)
            buffer.removeSubrange(0..<nlRange.upperBound)

            guard let line = String(data: lineData, encoding: .utf8) else { continue }
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty { continue }
            guard trimmed.hasPrefix("data:") else { continue }
            let payload = String(trimmed.dropFirst("data:".count)).trimmingCharacters(in: .whitespaces)
            if payload.isEmpty { continue }
            onLine?(payload)
        }
    }
}

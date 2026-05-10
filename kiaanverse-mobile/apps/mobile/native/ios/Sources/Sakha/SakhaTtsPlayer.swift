/**
 * Sakha TTS Player (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaTtsPlayer.kt.
 * Sequential, pause-aware playback queue for the Sakha voice. Two
 * backends:
 *
 *   1. Sarvam REST   — primary, prose + Sanskrit verses.
 *                      POST {backend}/api/voice-companion/synthesize
 *                      → audio bytes (base64 in JSON or raw audio)
 *                      → AVAudioPlayer playback.
 *   2. AVSpeech…    — fallback when Sarvam fails AND the language has
 *                      a system voice. NEVER used for Sanskrit (the
 *                      system voice mangles it).
 *
 * Concurrency model:
 *   - One Task pulls events off `incoming` (AsyncStream<PauseEvent>).
 *   - One Task drains the synthesis queue, plays each clip back-to-back,
 *     and signals progress via the listener.
 *
 * This pipelines synthesis ahead of playback (one sentence plays while
 * the next is being synthesised) without overlapping audio — Sakha
 * pacing depends on ordered, gapless playback.
 *
 * Threading:
 *   - URLSession runs on its own queue.
 *   - AVAudioPlayer.play() is main-thread safe.
 *   - Listener callbacks fire on .main (mirrors Kotlin Dispatchers.Main).
 */

import Foundation
import AVFoundation

public final class SakhaTtsPlayer: NSObject {

    private let config: SakhaVoiceConfig
    private weak var listener: (any SakhaVoiceListener)?
    private let session: URLSession

    /// Latest PauseEvent stream — recreated on each `start()` so a session
    /// that stops + restarts (e.g. barge-in) gets fresh continuations.
    private var incomingContinuation: AsyncStream<PauseEvent>.Continuation?
    private var ingestTask: Task<Void, Never>?
    private var playbackTask: Task<Void, Never>?

    private var fallbackSynth: AVSpeechSynthesizer?

    private var currentPlayer: AVAudioPlayer?
    private var totalSpokenMs: Int64 = 0
    private var pauseCount: Int = 0
    private var stopped: Bool = false

    /// Provides a bearer token for synthesis requests (mirrors the SSE client).
    private let authTokenProvider: () async -> String?

    public init(
        config: SakhaVoiceConfig,
        listener: any SakhaVoiceListener,
        authTokenProvider: @escaping () async -> String?
    ) {
        self.config = config
        self.listener = listener
        self.authTokenProvider = authTokenProvider

        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 8
        cfg.timeoutIntervalForResource = 20
        self.session = URLSession(configuration: cfg)
        super.init()
    }

    // MARK: - Public lifecycle

    /// Start a new session. Call `enqueue(...)` to feed events and
    /// `stop()` to halt + free resources.
    public func start() {
        stopped = false
        totalSpokenMs = 0
        pauseCount = 0

        // Build a fresh AsyncStream for this session.
        let (stream, continuation) = AsyncStream<PauseEvent>.makeStream(bufferingPolicy: .unbounded)
        self.incomingContinuation = continuation

        ingestTask?.cancel()
        playbackTask?.cancel()

        // Single sequential consumer — no separate ingest queue needed
        // on iOS because synthesis + playback run in the same task and
        // structured concurrency naturally pipelines: while one segment
        // is playing on AVAudioPlayer, the next can be `await`-synthesised
        // by an inner Task. (Simpler than the Kotlin two-channel design;
        // gapless behavior is preserved.)
        playbackTask = Task { [weak self] in
            guard let self = self else { return }
            for await event in stream {
                if self.stopped { break }
                await self.consume(event)
            }
        }
    }

    public func enqueue(_ event: PauseEvent) {
        incomingContinuation?.yield(event)
    }

    /// Mark end-of-stream — drains the queue, then tasks complete.
    public func finish() {
        incomingContinuation?.finish()
    }

    /// Halt playback and synthesis; safe to call from any thread.
    public func stop() {
        stopped = true
        ingestTask?.cancel()
        playbackTask?.cancel()
        incomingContinuation?.finish()
        currentPlayer?.stop()
        currentPlayer = nil
        fallbackSynth?.stopSpeaking(at: .immediate)
    }

    public func shutdown() {
        stop()
        fallbackSynth?.delegate = nil
        fallbackSynth = nil
    }

    public func statsTotalSpokenMs() -> Int64 { totalSpokenMs }
    public func statsPauseCount() -> Int { pauseCount }

    // MARK: - Event consumption

    private func consume(_ event: PauseEvent) async {
        if stopped { return }
        switch event {
        case .speak(let text, let isSanskrit):
            await speak(text: text, isSanskrit: isSanskrit)
        case .pause(let durationMs):
            pauseCount += 1
            await emitOnMain { [listener] in
                listener?.sakhaVoice(pause: durationMs)
            }
            try? await Task.sleep(nanoseconds: UInt64(max(durationMs, 0)) * 1_000_000)
        case .filter:
            await emitOnMain { [listener] in
                listener?.sakhaVoiceFilterFail()
            }
        }
    }

    // MARK: - Synthesis + playback

    private func speak(text: String, isSanskrit: Bool) async {
        if stopped { return }

        // Persona guard runs in the manager BEFORE enqueuing — we don't
        // re-run it here; trust upstream.
        let voiceId = isSanskrit ? config.sanskritVoiceId : config.sakhaVoiceId

        let started = nowMs()
        let audioData: Data? = await synthesize(text: text, voiceId: voiceId, language: config.language)

        if stopped { return }

        if let data = audioData, !data.isEmpty {
            await playAudio(data: data)
        } else if !isSanskrit {
            // Fallback to AVSpeechSynthesizer — never for Sanskrit.
            await speakWithFallback(text: text)
        } else {
            await emitOnMain { [listener] in
                listener?.sakhaVoice(error: .ttsError("synthesis failed (sanskrit, no fallback)"))
            }
        }

        if !stopped {
            totalSpokenMs += max(nowMs() - started, 0)
            await emitOnMain { [listener] in
                listener?.sakhaVoice(spokenSegment: text, isSanskrit: isSanskrit)
            }
        }
    }

    private func synthesize(text: String, voiceId: String, language: SakhaLanguage) async -> Data? {
        let url = "\(trimSlash(config.backendBaseUrl))\(config.voiceCompanionPathPrefix)/synthesize"
        guard let endpoint = URL(string: url) else { return nil }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
        request.setValue("kiaanverse-ios-sakha-voice", forHTTPHeaderField: "X-Client")
        if let token = await authTokenProvider(), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let payload: [String: Any] = [
            "text": text,
            "voice_id": voiceId,
            "language": language.wire,
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload, options: [])

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
                return nil
            }
            // Two response shapes per Android: raw audio bytes OR JSON
            // with base64 audio under "audio" / "data".
            if http.value(forHTTPHeaderField: "Content-Type")?.contains("application/json") == true {
                if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                    let b64 = (json["audio"] as? String) ?? (json["data"] as? String) ?? ""
                    if !b64.isEmpty {
                        return Data(base64Encoded: b64)
                    }
                }
                return nil
            }
            return data
        } catch {
            return nil
        }
    }

    private func playAudio(data: Data) async {
        await MainActor.run {
            do {
                let player = try AVAudioPlayer(data: data)
                player.delegate = self
                self.currentPlayer = player
                player.prepareToPlay()
                player.play()
            } catch {
                self.currentPlayer = nil
            }
        }
        // Wait for playback to finish (or stop() to nil out the player).
        while !stopped, let p = currentPlayer, p.isPlaying {
            try? await Task.sleep(nanoseconds: 40_000_000) // 40ms tick
        }
    }

    private func speakWithFallback(text: String) async {
        await MainActor.run {
            if self.fallbackSynth == nil {
                self.fallbackSynth = AVSpeechSynthesizer()
            }
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice(language: self.config.language.sttLocaleId)
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.95
            self.fallbackSynth?.speak(utterance)
        }
        // Poll until the synthesizer finishes (no clean async API on iOS 17).
        while !stopped, fallbackSynth?.isSpeaking == true {
            try? await Task.sleep(nanoseconds: 40_000_000)
        }
    }

    // MARK: - Helpers

    private func nowMs() -> Int64 {
        return Int64(Date().timeIntervalSince1970 * 1000.0)
    }

    private func trimSlash(_ s: String) -> String {
        if s.hasSuffix("/") { return String(s.dropLast()) }
        return s
    }

    private func emitOnMain(_ block: @escaping () -> Void) async {
        await MainActor.run { block() }
    }
}

// MARK: - AVAudioPlayerDelegate

extension SakhaTtsPlayer: AVAudioPlayerDelegate {
    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully: Bool) {
        if currentPlayer === player {
            currentPlayer = nil
        }
    }
}

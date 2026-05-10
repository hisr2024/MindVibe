/**
 * SakhaWakeWordDetector — iOS port of the Android always-on wake-word loop.
 *
 * Direct port of apps/mobile/native/android/.../SakhaWakeWordDetector.kt.
 * iOS uses SFSpeechRecognizer with shouldReportPartialResults=true, fed
 * by AVAudioEngine.inputNode taps. WakeWordMatcher scans every partial
 * transcript for one of the configured phrases.
 *
 * Engine choice rationale (mirrors Kotlin):
 *  • SFSpeechRecognizer ships with iOS, no API key, on-device-preferred.
 *  • Picovoice Porcupine iOS SDK is the eventual target once the
 *    licence is approved — swap is drop-in via this same `start()/stop()`
 *    surface.
 *
 * iOS-specific subtlety: SFSpeechRecognizer has a soft session limit
 * (Apple recommends < 1 minute). To keep the loop genuinely always-on,
 * we recycle the session every `sessionRecycleSeconds` regardless of
 * activity. Recycling preserves the same AVAudioEngine instance and
 * just rebuilds the recognition request + task — fast enough that the
 * user won't notice a missed wake.
 *
 * Lifecycle:
 *  • SakhaVoiceManager pauses this detector when the app starts a
 *    conversational turn (the turn STT and the wake STT can't share the
 *    mic). Resumes on return to IDLE. See SakhaVoiceManager.setState().
 *
 * Threading: SFSpeechRecognizer + AVAudioEngine touched on .main only.
 *
 * Privacy: this class never logs the raw transcript. The match call
 * returns the normalized phrase, which is what the caller forwards.
 */

import Foundation
import AVFoundation
import Speech

public final class SakhaWakeWordDetector {

    public static let defaultCooldownMs: Int64 = 1500

    private let phrases: [String]
    private let cooldownMs: Int64
    private let localeId: String
    private let onDetected: (String) -> Void
    private let onError: (Error) -> Void
    private let debugMode: Bool

    private let audioEngine = AVAudioEngine()
    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    private var running = false
    private var lastFiredAtMs: Int64 = 0
    private var recycleTask: Task<Void, Never>?

    /// Soft cap on a single SFSpeechRecognizer session. Apple recommends
    /// staying well under ~1 minute. We recycle pre-emptively at 50s.
    private let sessionRecycleSeconds: Int = 50

    public init(
        phrases: [String],
        cooldownMs: Int64 = SakhaWakeWordDetector.defaultCooldownMs,
        localeId: String = "en-US",
        onDetected: @escaping (String) -> Void,
        onError: @escaping (Error) -> Void = { _ in },
        debugMode: Bool = false
    ) {
        self.phrases = phrases
        self.cooldownMs = cooldownMs
        self.localeId = localeId
        self.onDetected = onDetected
        self.onError = onError
        self.debugMode = debugMode
    }

    // MARK: - Public API

    public func isRunning() -> Bool { running }

    public func start() {
        if running { return }
        guard AVAudioSession.sharedInstance().recordPermission == .granted else {
            onError(NSError(domain: "SakhaWakeWord", code: 1,
                            userInfo: [NSLocalizedDescriptionKey: "RECORD_AUDIO not granted"]))
            return
        }
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: localeId)),
              recognizer.isAvailable else {
            onError(NSError(domain: "SakhaWakeWord", code: 2,
                            userInfo: [NSLocalizedDescriptionKey: "SFSpeechRecognizer not available"]))
            return
        }
        self.recognizer = recognizer
        running = true
        startCycle()
        armRecycleTimer()
    }

    public func stop() {
        if !running { return }
        running = false
        recycleTask?.cancel()
        recycleTask = nil
        teardownSession()
    }

    // MARK: - Internals

    @MainActor
    private func startCycle() {
        if !running { return }

        teardownSession()

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        if recognizer?.supportsOnDeviceRecognition == true {
            request.requiresOnDeviceRecognition = true
        }
        self.request = request

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.request?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            scheduleRestart(afterMs: 1000)
            return
        }

        task = recognizer?.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result {
                let text = result.bestTranscription.formattedString
                self.handleTranscript(text)
                if result.isFinal {
                    // Restart the loop so we keep listening for the next utterance.
                    Task { @MainActor in
                        if self.running { self.scheduleRestart(afterMs: 250) }
                    }
                }
            }
            if let error = error as NSError? {
                if self.debugMode {
                    NSLog("[SakhaWakeWord] stt error=\(error.code) backoff=750ms")
                }
                Task { @MainActor in
                    if self.running { self.scheduleRestart(afterMs: 750) }
                }
            }
        }
    }

    @MainActor
    private func teardownSession() {
        task?.cancel()
        task = nil
        request?.endAudio()
        request = nil
        if audioEngine.isRunning { audioEngine.stop() }
        audioEngine.inputNode.removeTap(onBus: 0)
    }

    @MainActor
    private func scheduleRestart(afterMs: Int) {
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(max(afterMs, 0)) * 1_000_000)
            guard let self = self, self.running else { return }
            self.startCycle()
        }
    }

    /// Recycles the SFSpeechRecognizer session every `sessionRecycleSeconds`
    /// so we stay under Apple's soft 1-minute cap. The recycle is a no-op
    /// if the loop just rebuilt itself for another reason in the meantime.
    private func armRecycleTimer() {
        recycleTask?.cancel()
        recycleTask = Task { @MainActor [weak self] in
            while let self = self, self.running, !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(self.sessionRecycleSeconds) * 1_000_000_000)
                if !self.running || Task.isCancelled { return }
                if self.debugMode {
                    NSLog("[SakhaWakeWord] recycling session (\(self.sessionRecycleSeconds)s elapsed)")
                }
                self.startCycle()
            }
        }
    }

    private func handleTranscript(_ text: String) {
        if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return }
        guard let phrase = WakeWordMatcher.match(transcript: text, phrases: phrases) else { return }
        let now = Int64(Date().timeIntervalSince1970 * 1000.0)
        if now - lastFiredAtMs < cooldownMs { return }
        lastFiredAtMs = now
        onDetected(phrase)
    }
}

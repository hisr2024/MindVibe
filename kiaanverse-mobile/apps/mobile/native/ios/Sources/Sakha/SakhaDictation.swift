/**
 * SakhaDictation — iOS port of Android's one-shot SpeechRecognizer helper.
 *
 * Direct port of apps/mobile/native/android/.../SakhaDictation.kt.
 * Powers the Shankha voice-input button on every tool screen (Ardha,
 * Viyoga, Relationship Compass, Karma Reset, Emotional Reset, Sakha
 * Chat).
 *
 * Behaviour: opens an SFSpeechRecognizer session, captures one utterance
 * via AVAudioEngine.inputNode tap, returns the best transcript when the
 * recognizer emits a final result, then shuts everything down. No
 * persistent loop; no wake-word coupling — the bridge always uses a
 * fresh instance per call so back-to-back dictations can't share state.
 *
 * Threading: AVAudioEngine + SFSpeechRecognizer touched on .main.
 * Result delivery hops to .main before invoking onResult.
 *
 * Hard cap: 30 seconds per spec (matches Android's `MAX_RECORD_SECONDS`).
 * After 30s with no final result, the session stops and reports
 * NO_MATCH so the user always returns to a usable state.
 */

import Foundation
import AVFoundation
import Speech

public final class SakhaDictation {

    public enum DictationResult {
        case success(transcript: String)
        case failure(code: String, message: String)
    }

    public static let maxRecordSeconds: Int = 30

    private let audioEngine = AVAudioEngine()
    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var delivered = false
    private var hardStopTask: Task<Void, Never>?

    public init() {}

    /// Capture one utterance and call `onResult` exactly once on .main.
    /// `languageTag` is BCP-47 — e.g. "en-IN", "hi-IN", "en-US".
    public func dictateOnce(languageTag: String,
                            onResult: @escaping (DictationResult) -> Void) {
        let deliver: (DictationResult) -> Void = { [weak self] res in
            guard let self = self, !self.delivered else { return }
            self.delivered = true
            self.teardown()
            DispatchQueue.main.async { onResult(res) }
        }

        guard AVAudioSession.sharedInstance().recordPermission == .granted else {
            deliver(.failure(code: "PERMISSION_DENIED",
                             message: "RECORD_AUDIO permission not granted"))
            return
        }

        let locale = Locale(identifier: languageTag.isEmpty ? "en-US" : languageTag)
        guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
            deliver(.failure(code: "NOT_AVAILABLE",
                             message: "SFSpeechRecognizer not available for \(languageTag)"))
            return
        }
        self.recognizer = recognizer

        DispatchQueue.main.async { [weak self] in
            self?.startSession(languageTag: languageTag, deliver: deliver)
        }
    }

    // MARK: - Internals

    @MainActor
    private func startSession(languageTag: String,
                              deliver: @escaping (DictationResult) -> Void) {
        // Configure record-only audio session for the dictation cycle.
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
            try session.setActive(true, options: [])
        } catch {
            deliver(.failure(code: "AUDIO_ERROR",
                             message: "AVAudioSession setup failed: \(error.localizedDescription)"))
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = false
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
            deliver(.failure(code: "AUDIO_ERROR",
                             message: "AVAudioEngine.start failed: \(error.localizedDescription)"))
            return
        }

        // Hard 30s cap — spec'd, mirrors Android.
        hardStopTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(SakhaDictation.maxRecordSeconds) * 1_000_000_000)
            guard let self = self, !self.delivered else { return }
            self.request?.endAudio()
            // The recognition task will fire onResults shortly; if it
            // returns empty, the result handler below maps to NO_MATCH.
            // Belt-and-braces: if the recognizer never produces anything,
            // schedule a deliver in 1.5s.
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            if !self.delivered {
                deliver(.failure(code: "SPEECH_TIMEOUT", message: "No speech heard before timeout"))
            }
        }

        task = recognizer?.recognitionTask(with: request) { result, error in
            if let result = result, result.isFinal {
                let best = result.bestTranscription.formattedString
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                if best.isEmpty {
                    deliver(.failure(code: "NO_MATCH", message: "No speech recognized"))
                } else {
                    deliver(.success(transcript: best))
                }
                return
            }
            if let error = error as NSError? {
                let code: String
                let message: String
                if error.localizedDescription.lowercased().contains("no speech") {
                    code = "NO_MATCH"
                    message = "No speech recognized"
                } else if error.code == 203 {
                    code = "SPEECH_TIMEOUT"
                    message = "No speech heard before timeout"
                } else {
                    code = "UNKNOWN_ERROR_\(error.code)"
                    message = error.localizedDescription
                }
                deliver(.failure(code: code, message: message))
            }
        }
    }

    private func teardown() {
        hardStopTask?.cancel()
        hardStopTask = nil
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.task?.cancel()
            self.task = nil
            self.request = nil
            if self.audioEngine.isRunning { self.audioEngine.stop() }
            self.audioEngine.inputNode.removeTap(onBus: 0)
        }
    }
}

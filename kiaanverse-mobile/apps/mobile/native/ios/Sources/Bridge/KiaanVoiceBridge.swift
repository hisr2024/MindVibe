/**
 * KiaanVoiceBridge — React Native bridge for KiaanVoiceManager.
 *
 * Mirrors `apps/mobile/types/kiaanVoice.ts` (KiaanVoiceNativeModule) on iOS,
 * matching what the Android side exposes through `KiaanVoicePackage.kt`.
 *
 * Architecture:
 *   • Singleton `KiaanVoiceManager.shared` is the source of truth.
 *   • This class adopts `KiaanVoiceDelegate` and forwards manager events
 *     to JS as `RCTEventEmitter` events.
 *   • Async Swift APIs are bridged to JS Promise via `(resolve, reject)`
 *     blocks; errors are translated via `mapError(_:)`.
 *   • Method exports live in `KiaanVoiceBridge.m` (Objective-C macros are
 *     the only way to use `RCT_EXTERN_MODULE` from Swift in RN 0.74).
 *
 * Threading:
 *   • RN dispatches our `@objc` methods on `methodQueue` (configured below
 *     to be the main queue for AVAudioSession safety).
 *   • Manager calls into AVAudioEngine / SFSpeechRecognizer must run on
 *     the main thread; `KiaanVoiceManager` already enforces this, but we
 *     keep `methodQueue` on main to avoid a cross-thread hop on every call.
 */

import Foundation
import React
import AVFoundation
import Speech

@objc(KiaanVoiceBridge)
final class KiaanVoiceBridge: RCTEventEmitter {

    // MARK: - RCTEventEmitter required overrides

    private var hasListeners = false

    override init() {
        super.init()
        KiaanVoiceManager.shared.delegate = self
    }

    override static func requiresMainQueueSetup() -> Bool {
        // KiaanVoiceManager touches AVAudioSession at init via the
        // synthesizer delegate hook — main queue is required.
        return true
    }

    override var methodQueue: DispatchQueue {
        return DispatchQueue.main
    }

    override func supportedEvents() -> [String]! {
        return [
            "KiaanVoiceStateChange",
            "KiaanVoiceTranscript",
            "KiaanVoiceWakeWordDetected",
            "KiaanVoiceError",
            "KiaanVoiceReady",
            "KiaanVoiceSpeakingStart",
            "KiaanVoiceSpeakingEnd",
        ]
    }

    override func startObserving() { hasListeners = true }
    override func stopObserving()  { hasListeners = false }

    // MARK: - Bridge methods

    @objc(initialize:resolver:rejecter:)
    func initialize(
        _ config: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let cfg = mapConfig(config)
        Task {
            do {
                try await KiaanVoiceManager.shared.initialize(config: cfg)
                resolve(nil)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(requestPermissions:rejecter:)
    func requestPermissions(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            do {
                let granted = try await KiaanVoiceManager.shared.requestPermissions()
                resolve(granted)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(hasPermissions:rejecter:)
    func hasPermissions(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let mic = AVAudioSession.sharedInstance().recordPermission == .granted
        let speech = SFSpeechRecognizer.authorizationStatus() == .authorized
        resolve(mic && speech)
    }

    @objc(enableWakeWord:rejecter:)
    func enableWakeWord(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            do {
                try await KiaanVoiceManager.shared.enableWakeWord()
                resolve(nil)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(disableWakeWord:rejecter:)
    func disableWakeWord(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            do {
                try await KiaanVoiceManager.shared.disableWakeWord()
                resolve(nil)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(activate:rejecter:)
    func activate(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            do {
                try await KiaanVoiceManager.shared.activate()
                resolve(nil)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(stopListening:rejecter:)
    func stopListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            do {
                try await KiaanVoiceManager.shared.stopListening()
                resolve(nil)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(reset:rejecter:)
    func reset(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task {
            do {
                try await KiaanVoiceManager.shared.reset()
                resolve(nil)
            } catch {
                let mapped = mapError(error)
                reject(mapped.code, mapped.message, error)
            }
        }
    }

    @objc(destroy:rejecter:)
    func destroy(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanVoiceManager.shared.destroy()
        resolve(nil)
    }

    @objc(speak:resolver:rejecter:)
    func speak(
        _ text: NSString,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanVoiceManager.shared.speak(text as String)
        resolve(nil)
    }

    @objc(stopSpeaking:rejecter:)
    func stopSpeaking(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanVoiceManager.shared.stopSpeaking()
        resolve(nil)
    }

    @objc(getCurrentState:rejecter:)
    func getCurrentState(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(KiaanVoiceManager.shared.currentState.rawValue)
    }

    @objc(getTranscript:rejecter:)
    func getTranscript(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(KiaanVoiceManager.shared.transcript)
    }

    @objc(getInterimTranscript:rejecter:)
    func getInterimTranscript(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(KiaanVoiceManager.shared.interimTranscript)
    }

    @objc(isListening:rejecter:)
    func isListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(KiaanVoiceManager.shared.isListening)
    }

    @objc(isSpeaking:rejecter:)
    func isSpeaking(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(KiaanVoiceManager.shared.isSpeaking)
    }

    // MARK: - Helpers

    private func mapConfig(_ dict: NSDictionary) -> KiaanVoiceConfig {
        var cfg = KiaanVoiceConfig.default
        if let language = dict["language"] as? String {
            cfg.language = Locale(identifier: language)
        }
        if let v = dict["useOnDeviceRecognition"] as? Bool { cfg.useOnDeviceRecognition = v }
        if let v = dict["enableWakeWord"] as? Bool { cfg.enableWakeWord = v }
        if let v = dict["wakeWordPhrases"] as? [String] { cfg.wakeWordPhrases = v }
        if let v = dict["maxRetries"] as? Int { cfg.maxRetries = v }
        if let v = dict["retryBaseDelayMs"] as? Double { cfg.retryBaseDelay = v / 1000.0 }
        if let v = dict["silenceTimeoutMs"] as? Double { cfg.silenceTimeout = v / 1000.0 }
        if let v = dict["enableHaptics"] as? Bool { cfg.enableHaptics = v }
        if let v = dict["enableSoundEffects"] as? Bool { cfg.enableSoundEffects = v }
        if let v = dict["debugMode"] as? Bool { cfg.debugMode = v }
        return cfg
    }

    private struct MappedError {
        let code: String
        let message: String
    }

    private func mapError(_ error: Error) -> MappedError {
        if let e = error as? KiaanVoiceError {
            switch e {
            case .permissionDenied:                return .init(code: "permission_denied", message: e.errorDescription ?? "")
            case .permissionNotDetermined:         return .init(code: "permission_not_determined", message: e.errorDescription ?? "")
            case .microphoneUnavailable:           return .init(code: "microphone_unavailable", message: e.errorDescription ?? "")
            case .speechRecognitionUnavailable:    return .init(code: "speech_recognition_unavailable", message: e.errorDescription ?? "")
            case .onDeviceRecognitionUnavailable:  return .init(code: "on_device_recognition_unavailable", message: e.errorDescription ?? "")
            case .audioSessionError:               return .init(code: "audio_error", message: e.errorDescription ?? "")
            case .recognitionError:                return .init(code: "recognition_error", message: e.errorDescription ?? "")
            case .networkError:                    return .init(code: "network_error", message: e.errorDescription ?? "")
            case .timeout:                         return .init(code: "timeout", message: e.errorDescription ?? "")
            case .unknown:                         return .init(code: "unknown", message: e.errorDescription ?? "")
            }
        }
        return .init(code: "unknown", message: error.localizedDescription)
    }

    fileprivate func emit(_ name: String, body: Any?) {
        guard hasListeners else { return }
        sendEvent(withName: name, body: body)
    }
}

// MARK: - KiaanVoiceDelegate

extension KiaanVoiceBridge: KiaanVoiceDelegate {

    func voiceManager(_ manager: KiaanVoiceManager, didChangeState state: KiaanVoiceState, from previousState: KiaanVoiceState) {
        emit("KiaanVoiceStateChange", body: [
            "state": state.rawValue,
            "previousState": previousState.rawValue,
        ])
    }

    func voiceManager(_ manager: KiaanVoiceManager, didReceiveTranscript transcript: String, isFinal: Bool) {
        emit("KiaanVoiceTranscript", body: [
            "transcript": transcript,
            "isFinal": isFinal,
        ])
    }

    func voiceManager(_ manager: KiaanVoiceManager, didDetectWakeWord phrase: String) {
        emit("KiaanVoiceWakeWordDetected", body: ["phrase": phrase])
    }

    func voiceManager(_ manager: KiaanVoiceManager, didEncounterError error: KiaanVoiceError) {
        let mapped: (code: String, message: String, recoverable: Bool) = {
            switch error {
            case .permissionDenied:               return ("permission_denied", error.errorDescription ?? "", false)
            case .permissionNotDetermined:        return ("permission_not_determined", error.errorDescription ?? "", true)
            case .microphoneUnavailable:          return ("microphone_unavailable", error.errorDescription ?? "", false)
            case .speechRecognitionUnavailable:   return ("speech_recognition_unavailable", error.errorDescription ?? "", false)
            case .onDeviceRecognitionUnavailable: return ("on_device_recognition_unavailable", error.errorDescription ?? "", true)
            case .audioSessionError:              return ("audio_error", error.errorDescription ?? "", true)
            case .recognitionError:               return ("recognition_error", error.errorDescription ?? "", true)
            case .networkError:                   return ("network_error", error.errorDescription ?? "", true)
            case .timeout:                        return ("timeout", error.errorDescription ?? "", true)
            case .unknown:                        return ("unknown", error.errorDescription ?? "", true)
            }
        }()
        emit("KiaanVoiceError", body: [
            "type": mapped.code,
            "message": mapped.message,
            "isRecoverable": mapped.recoverable,
        ])
    }

    func voiceManagerDidBecomeReady(_ manager: KiaanVoiceManager) {
        emit("KiaanVoiceReady", body: nil)
    }

    func voiceManagerDidStartSpeaking(_ manager: KiaanVoiceManager) {
        emit("KiaanVoiceSpeakingStart", body: nil)
    }

    func voiceManagerDidStopSpeaking(_ manager: KiaanVoiceManager) {
        emit("KiaanVoiceSpeakingEnd", body: nil)
    }
}

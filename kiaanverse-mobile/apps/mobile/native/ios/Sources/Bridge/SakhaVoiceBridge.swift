/**
 * SakhaVoiceBridge — RN bridge for SakhaVoiceManager.
 *
 * Mirrors Android's SakhaVoiceModule.kt: same JS-facing module name
 * ("SakhaVoice"), same method signatures (initialize, setAuthToken,
 * hasRecordPermission, activate, stopListening, cancelTurn, resetSession,
 * shutdown, readVerse, enableWakeWord, disableWakeWord, dictateOnce),
 * same event names. The TS contract lives in
 * apps/mobile/types/sakhaVoice.ts.
 *
 * dictateOnce is M4 — for now the bridge accepts the call and rejects
 * with code "not_implemented" so the JS hook surfaces the error
 * cleanly instead of silently no-oping.
 */

import Foundation
import React
import AVFoundation

@objc(SakhaVoiceBridge)
final class SakhaVoiceBridge: RCTEventEmitter {

    private var hasListeners = false
    private var bearerToken: String?

    override init() {
        super.init()
    }

    override static func requiresMainQueueSetup() -> Bool { return true }

    override var methodQueue: DispatchQueue { return DispatchQueue.main }

    override func supportedEvents() -> [String]! {
        return [
            "SakhaVoiceState",
            "SakhaVoicePartialTranscript",
            "SakhaVoiceFinalTranscript",
            "SakhaVoiceEngineSelected",
            "SakhaVoiceText",
            "SakhaVoiceSpoken",
            "SakhaVoicePause",
            "SakhaVoiceVerseCited",
            "SakhaVoiceFilterFail",
            "SakhaVoiceTurnComplete",
            "SakhaVoiceError",
            "SakhaVoiceVerseReadStarted",
            "SakhaVoiceVerseSegmentRead",
            "SakhaVoiceVerseReadComplete",
            "SakhaVoiceWakeWord",
        ]
    }

    override func startObserving() { hasListeners = true }
    override func stopObserving()  { hasListeners = false }

    // MARK: - Bridge methods

    @objc(initialize:resolver:rejecter:)
    func initialize(
        _ configMap: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        do {
            let config = try buildConfig(from: configMap)
            // Capture token by closure — lets JS call setAuthToken(...) at any time
            // and the SSE/synthesize requests pick up the latest value.
            let provider: () async -> String? = { [weak self] in self?.bearerToken }
            SakhaVoiceManager.shared.initialize(
                config: config,
                listener: self,
                authTokenProvider: provider
            )
            resolve(nil)
        } catch {
            reject("init_failed", error.localizedDescription, error)
        }
    }

    @objc(setAuthToken:)
    func setAuthToken(_ token: NSString?) {
        let s = token as String?
        bearerToken = (s?.isEmpty == false) ? s : nil
    }

    @objc(hasRecordPermission:rejecter:)
    func hasRecordPermission(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(SakhaVoiceManager.shared.hasRecordPermission())
    }

    @objc(activate:rejecter:)
    func activate(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.activate()
        resolve(nil)
    }

    @objc(stopListening:rejecter:)
    func stopListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.stopListening()
        resolve(nil)
    }

    @objc(cancelTurn:rejecter:)
    func cancelTurn(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.cancelTurn()
        resolve(nil)
    }

    @objc(resetSession:rejecter:)
    func resetSession(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.resetSession()
        resolve(nil)
    }

    @objc(shutdown:rejecter:)
    func shutdown(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.shutdown()
        resolve(nil)
    }

    @objc(readVerse:resolver:rejecter:)
    func readVerse(
        _ payload: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        do {
            let recitation = try buildRecitation(from: payload)
            SakhaVoiceManager.shared.readVerse(recitation)
            resolve(nil)
        } catch let e as SakhaVoiceError {
            reject("read_verse_invalid", e.description, e)
        } catch {
            reject("read_verse_failed", error.localizedDescription, error)
        }
    }

    @objc(enableWakeWord:rejecter:)
    func enableWakeWord(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.enableWakeWord()
        resolve(nil)
    }

    @objc(disableWakeWord:rejecter:)
    func disableWakeWord(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaVoiceManager.shared.disableWakeWord()
        resolve(nil)
    }

    @objc(dictateOnce:resolver:rejecter:)
    func dictateOnce(
        _ languageTag: NSString,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let tag = (languageTag as String).isEmpty ? "en-US" : (languageTag as String)
        SakhaVoiceManager.shared.dictateOnce(languageTag: tag) { result in
            switch result {
            case .success(let transcript):
                resolve([
                    "transcript": transcript,
                    "language": tag,
                ])
            case .failure(let code, let message):
                reject(code, message, nil)
            }
        }
    }

    // MARK: - Helpers

    private func buildConfig(from map: NSDictionary) throws -> SakhaVoiceConfig {
        guard let backendBaseUrl = map["backendBaseUrl"] as? String, !backendBaseUrl.isEmpty else {
            throw SakhaVoiceError.unknown("backendBaseUrl is required")
        }
        return SakhaVoiceConfig(
            language: SakhaLanguage.fromWire(map["language"] as? String),
            backendBaseUrl: backendBaseUrl,
            voiceCompanionPathPrefix: (map["voiceCompanionPathPrefix"] as? String) ?? "/api/voice-companion",
            sakhaVoiceId: (map["sakhaVoiceId"] as? String) ?? "sarvam-aura",
            sanskritVoiceId: (map["sanskritVoiceId"] as? String) ?? "sarvam-meera",
            allowBargeIn: (map["allowBargeIn"] as? Bool) ?? true,
            silenceTimeoutMs: Int64((map["silenceTimeoutMs"] as? Double) ?? 1800),
            maxResponseSpokenMs: Int64((map["maxResponseSpokenMs"] as? Double) ?? 45_000),
            requestTimeoutMs: Int64((map["requestTimeoutMs"] as? Double) ?? 12_000),
            maxRequestRetries: (map["maxRequestRetries"] as? Int) ?? 2,
            enablePersonaGuard: (map["enablePersonaGuard"] as? Bool) ?? true,
            speakOnFilterFail: (map["speakOnFilterFail"] as? Bool) ?? true,
            debugMode: (map["debugMode"] as? Bool) ?? false,
            enableWakeWord: (map["enableWakeWord"] as? Bool) ?? false,
            wakeWordPhrases: (map["wakeWordPhrases"] as? [String]) ?? [
                "hey sakha", "namaste sakha", "ok sakha", "sakha", "हे सखा", "सखा",
            ],
            wakeWordCooldownMs: Int64((map["wakeWordCooldownMs"] as? Double) ?? 1500)
        )
    }

    private func buildRecitation(from payload: NSDictionary) throws -> VerseRecitation {
        guard let chapter = payload["chapter"] as? Int else {
            throw SakhaVoiceError.unknown("readVerse: 'chapter' is required")
        }
        guard let verse = payload["verse"] as? Int else {
            throw SakhaVoiceError.unknown("readVerse: 'verse' is required")
        }
        guard let segmentsArr = payload["segments"] as? [[String: Any]], !segmentsArr.isEmpty else {
            throw SakhaVoiceError.unknown("readVerse: 'segments' must be a non-empty array")
        }
        var segments: [VerseSegment] = []
        segments.reserveCapacity(segmentsArr.count)
        for (i, seg) in segmentsArr.enumerated() {
            guard let langWire = seg["language"] as? String else {
                throw SakhaVoiceError.unknown("readVerse: segments[\(i)].language is required")
            }
            guard let text = seg["text"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw SakhaVoiceError.unknown("readVerse: segments[\(i)].text is required and non-empty")
            }
            segments.append(VerseSegment(language: SakhaLanguage.fromWire(langWire), text: text))
        }
        let pauseMs = Int64((payload["betweenSegmentsPauseMs"] as? Double) ?? 700)
        return try VerseRecitation(chapter: chapter, verse: verse, segments: segments, betweenSegmentsPauseMs: pauseMs)
    }

    fileprivate func emit(_ name: String, body: Any?) {
        guard hasListeners else { return }
        sendEvent(withName: name, body: body)
    }
}

// MARK: - SakhaVoiceListener forwarding

extension SakhaVoiceBridge: SakhaVoiceListener {

    func sakhaVoice(stateChanged state: SakhaVoiceStateRaw, previousState: SakhaVoiceStateRaw) {
        emit("SakhaVoiceState", body: ["state": state.wire, "previousState": previousState.wire])
    }

    func sakhaVoice(partialTranscript text: String) {
        emit("SakhaVoicePartialTranscript", body: ["text": text])
    }

    func sakhaVoice(finalTranscript text: String) {
        emit("SakhaVoiceFinalTranscript", body: ["text": text])
    }

    func sakhaVoice(engineSelected engine: SakhaEngine, mood: SakhaMood, intensity: Int) {
        emit("SakhaVoiceEngineSelected", body: [
            "engine": engine.wire,
            "mood": mood.wire,
            "intensity": intensity,
        ])
    }

    func sakhaVoice(textDelta: String, isFinal: Bool) {
        emit("SakhaVoiceText", body: ["delta": textDelta, "isFinal": isFinal])
    }

    func sakhaVoice(spokenSegment text: String, isSanskrit: Bool) {
        emit("SakhaVoiceSpoken", body: ["text": text, "isSanskrit": isSanskrit])
    }

    func sakhaVoice(pause durationMs: Int64) {
        emit("SakhaVoicePause", body: ["durationMs": Double(durationMs)])
    }

    func sakhaVoice(verseCited reference: String, sanskrit: String?) {
        var body: [String: Any] = ["reference": reference]
        if let s = sanskrit { body["sanskrit"] = s }
        emit("SakhaVoiceVerseCited", body: body)
    }

    func sakhaVoiceFilterFail() {
        emit("SakhaVoiceFilterFail", body: [:])
    }

    func sakhaVoice(turnComplete metrics: SakhaTurnMetrics) {
        var body: [String: Any] = [
            "engine": metrics.engine.wire,
            "mood": metrics.mood.wire,
            "moodIntensity": metrics.moodIntensity,
            "language": metrics.language.wire,
            "transcriptChars": metrics.transcriptChars,
            "responseChars": metrics.responseChars,
            "sttDurationMs": Double(metrics.sttDurationMs),
            "firstByteMs": Double(metrics.firstByteMs),
            "firstAudioMs": Double(metrics.firstAudioMs),
            "totalSpokenMs": Double(metrics.totalSpokenMs),
            "pauseCount": metrics.pauseCount,
            "filterFail": metrics.filterFail,
            "personaGuardTriggered": metrics.personaGuardTriggered,
            "barged": metrics.barged,
        ]
        if let s = metrics.sessionId { body["sessionId"] = s }
        if let v = metrics.verseCited { body["verseCited"] = v }
        if let t = metrics.thermalState { body["thermalState"] = t }
        emit("SakhaVoiceTurnComplete", body: body)
    }

    func sakhaVoice(error: SakhaVoiceError) {
        emit("SakhaVoiceError", body: [
            "code": error.code,
            "message": error.description,
            "recoverable": error.isRecoverable,
        ])
    }

    func sakhaVoice(verseReadStarted citation: String) {
        emit("SakhaVoiceVerseReadStarted", body: ["citation": citation])
    }

    func sakhaVoice(verseSegmentRead citation: String, language: SakhaLanguage) {
        emit("SakhaVoiceVerseSegmentRead", body: ["citation": citation, "language": language.wire])
    }

    func sakhaVoice(verseReadComplete citation: String) {
        emit("SakhaVoiceVerseReadComplete", body: ["citation": citation])
    }

    func sakhaVoice(wakeWord phrase: String) {
        emit("SakhaVoiceWakeWord", body: ["phrase": phrase])
    }
}

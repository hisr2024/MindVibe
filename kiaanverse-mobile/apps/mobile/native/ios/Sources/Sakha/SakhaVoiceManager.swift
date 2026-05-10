/**
 * Sakha Voice Manager (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaVoiceManager.kt.
 * Top-level orchestrator for the iOS Sakha voice mode.
 *
 * One turn:
 *
 *   IDLE
 *     │ activate()
 *     ▼
 *   LISTENING ──► silence-timeout / stopListening()
 *     │
 *     ▼ STT delivers final transcript
 *   TRANSCRIBING
 *     │ open SSE
 *   REQUESTING ──► first text frame
 *     │ parser yields first speakable segment
 *   SPEAKING ⇄ PAUSING
 *     │ stream done & queue drained
 *   IDLE
 *
 * Barge-in: while SPEAKING, a tap on the Shankha calls activate(); if
 * allowBargeIn=true the manager stops the player, transitions to
 * LISTENING, and starts a new turn.
 *
 * Threading: listener callbacks fire on .main; internal pipeline lives
 * on Tasks. No DispatchQueue.global() — Swift Concurrency throughout.
 *
 * Wake-word: M4 — enableWakeWord/disableWakeWord are accepted by the
 * bridge but log a warning until the SakhaWakeWordDetector iOS port lands.
 */

import Foundation
import AVFoundation
import Speech

public final class SakhaVoiceManager: NSObject {

    // MARK: - Singleton

    public static let shared = SakhaVoiceManager()

    // MARK: - State

    private var config: SakhaVoiceConfig?
    private weak var listener: (any SakhaVoiceListener)?
    private var initialized = false

    public private(set) var currentState: SakhaVoiceStateRaw = .uninitialized {
        didSet {}
    }
    private var previousState: SakhaVoiceStateRaw = .uninitialized

    private var sessionId: String?
    private var turnCount: Int = 0
    private var lastFinalTranscript: String = ""
    private var currentEngine: SakhaEngine = .friend
    private var currentMood: SakhaMood = .neutral
    private var currentMoodIntensity: Int = 5

    // STT
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    // Pipeline collaborators
    private var sseClient: SakhaSseClient?
    private var ttsPlayer: SakhaTtsPlayer?
    private var parser = SakhaPauseParser()

    // Tasks
    private var streamTask: Task<Void, Never>?
    private var silenceTask: Task<Void, Never>?
    private var maxResponseGuardTask: Task<Void, Never>?

    // Per-turn metric counters
    private var turnStartedAtMs: Int64 = 0
    private var sttStartedAtMs: Int64 = 0
    private var firstByteMs: Int64 = 0
    private var firstAudioMs: Int64 = 0
    private var responseChars: Int = 0
    private var verseCited: String?
    private var personaGuardTriggered = false
    private var filterFail = false
    private var barged = false

    // Active recitation tracking
    private var currentVerseRecitation: VerseRecitation?
    private var verseSegmentIndex: Int = 0

    // Always-on wake-word detector. Non-nil when enableWakeWord() has been
    // called; auto-paused while the manager is in any non-IDLE state (so the
    // conversational STT and the wake STT never contend for the mic),
    // auto-resumed on return to IDLE — see setState(_:).
    private var wakeDetector: SakhaWakeWordDetector?

    // Auth provider supplied by the bridge.
    private var authTokenProvider: (() async -> String?) = { nil }

    private override init() { super.init() }

    // MARK: - Public API

    public func initialize(config: SakhaVoiceConfig, listener: any SakhaVoiceListener,
                           authTokenProvider: @escaping () async -> String?) {
        self.config = config
        self.listener = listener
        self.authTokenProvider = authTokenProvider

        self.sseClient = SakhaSseClient(
            config: config,
            authTokenProvider: authTokenProvider,
            refreshToken: { await authTokenProvider() }
        )
        self.ttsPlayer = SakhaTtsPlayer(
            config: config,
            listener: InternalTtsBridge(manager: self),
            authTokenProvider: authTokenProvider
        )
        self.initialized = true
        setState(.idle)
    }

    public func hasRecordPermission() -> Bool {
        return AVAudioSession.sharedInstance().recordPermission == .granted
    }

    public func activate() {
        guard ensureInitialized() else { return }
        Task { @MainActor [weak self] in
            guard let self = self else { return }
            // Barge-in handling.
            if self.currentState == .speaking || self.currentState == .pausing {
                if self.config?.allowBargeIn == true {
                    self.barged = true
                    self.stopSpeakingInternal()
                } else {
                    return
                }
            }
            guard self.hasRecordPermission() else {
                self.listener?.sakhaVoice(error: .permissionDenied)
                return
            }
            self.resetTurnMetrics()
            self.turnStartedAtMs = self.nowMs()
            self.startListening()
        }
    }

    public func stopListening() {
        // Stop the recognition task gracefully — SFSpeechRecognizer will
        // deliver its final result via the existing handler.
        recognitionRequest?.endAudio()
        if audioEngine.isRunning { audioEngine.stop() }
    }

    public func cancelTurn() {
        Task { @MainActor [weak self] in
            guard let self = self else { return }
            self.stopListeningInternal()
            self.stopRequestInternal()
            self.stopSpeakingInternal()
            self.currentVerseRecitation = nil
            self.verseSegmentIndex = 0
            self.setState(.idle)
        }
    }

    public func shutdown() {
        cancelTurn()
        ttsPlayer?.shutdown()
        ttsPlayer = nil
        sseClient?.cancel()
        sseClient = nil
        wakeDetector?.stop()
        wakeDetector = nil
        setState(.shutdown)
    }

    public func resetSession() {
        sessionId = nil
        turnCount = 0
    }

    /// Enable always-on wake-word detection. Lazy-creates a
    /// SakhaWakeWordDetector keyed off the current config and starts it
    /// if the manager is currently IDLE. If state is non-IDLE
    /// (mid-turn / mid-recitation), the detector is created but not
    /// started — `setState` will start it on the next return to IDLE so
    /// we never contend with the conversational STT for the mic.
    /// Idempotent — safe to call again.
    public func enableWakeWord() {
        guard ensureInitialized() else { return }
        guard hasRecordPermission() else {
            listener?.sakhaVoice(error: .permissionDenied)
            return
        }
        if wakeDetector == nil, let cfg = config {
            wakeDetector = SakhaWakeWordDetector(
                phrases: cfg.wakeWordPhrases,
                cooldownMs: cfg.wakeWordCooldownMs,
                localeId: cfg.language.sttLocaleId,
                onDetected: { [weak self] phrase in
                    self?.handleWakeWordDetected(phrase)
                },
                onError: { [weak self] error in
                    Task { @MainActor in
                        self?.listener?.sakhaVoice(error: .unknown("wake: \(error.localizedDescription)"))
                    }
                },
                debugMode: cfg.debugMode
            )
        }
        if currentState == .idle {
            wakeDetector?.start()
        }
    }

    /// Stop + release the wake-word detector. Idempotent.
    public func disableWakeWord() {
        wakeDetector?.stop()
        wakeDetector = nil
    }

    private func handleWakeWordDetected(_ phrase: String) {
        Task { @MainActor [weak self] in
            self?.listener?.sakhaVoice(wakeWord: phrase)
        }
        // Auto-activate so the user's next utterance lands in the same
        // turn — no extra tap needed. activate() is internally guarded
        // by the state machine so a simultaneous tap-to-begin doesn't
        // create a duplicate turn.
        activate()
    }

    /// One-shot dictation — captures a single utterance via SFSpeechRecognizer
    /// and returns its best transcript. Used by the Shankha voice-input
    /// button on tool screens. Each call uses a fresh SakhaDictation so
    /// back-to-back invocations can't share state. languageTag is BCP-47
    /// (e.g. "en-IN", "hi-IN").
    public func dictateOnce(languageTag: String,
                            completion: @escaping (SakhaDictation.DictationResult) -> Void) {
        let dict = SakhaDictation()
        dict.dictateOnce(languageTag: languageTag, onResult: completion)
    }

    public func readVerse(_ recitation: VerseRecitation) {
        guard ensureInitialized() else { return }
        Task { @MainActor [weak self] in
            guard let self = self, let player = self.ttsPlayer else { return }
            let st = self.currentState
            if st != .idle && st != .error {
                self.listener?.sakhaVoice(error: .unknown("readVerse refused: busy in state=\(st.wire)"))
                return
            }
            if self.currentVerseRecitation != nil {
                self.listener?.sakhaVoice(error: .unknown("readVerse refused: another recitation is in flight"))
                return
            }
            self.currentVerseRecitation = recitation
            self.verseSegmentIndex = 0

            self.listener?.sakhaVoice(verseReadStarted: recitation.citation)
            self.setState(.speaking)

            player.start()
            for event in SakhaVerseReader.plan(recitation) {
                player.enqueue(event)
            }
            player.finish()
            // Per-segment + completion notifications happen via the
            // internal TTS listener as the player drains the queue.
        }
    }

    // MARK: - STT (SFSpeechRecognizer + AVAudioEngine)

    private func startListening() {
        guard let config = self.config else { return }
        let locale = Locale(identifier: config.language.sttLocaleId)
        guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
            listener?.sakhaVoice(error: .speechRecognitionUnavailable)
            return
        }
        speechRecognizer = recognizer

        // Configure audio session for record + playback.
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.duckOthers, .allowBluetooth, .defaultToSpeaker])
            try session.setActive(true, options: [])
        } catch {
            listener?.sakhaVoice(error: .microphoneUnavailable)
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        if recognizer.supportsOnDeviceRecognition {
            request.requiresOnDeviceRecognition = true
        }
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            listener?.sakhaVoice(error: .microphoneUnavailable)
            return
        }

        sttStartedAtMs = nowMs()
        setState(.listening)
        armSilenceTimer()

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let error = error as NSError? {
                Task { @MainActor in
                    self.silenceTask?.cancel()
                    if self.audioEngine.isRunning { self.audioEngine.stop() }
                    self.audioEngine.inputNode.removeTap(onBus: 0)
                    if error.domain == "kAFAssistantErrorDomain" || error.localizedDescription.contains("No speech") {
                        self.setState(.idle)
                        return
                    }
                    self.listener?.sakhaVoice(error: .unknown("stt: \(error.localizedDescription)"))
                    self.setState(.error)
                }
                return
            }

            guard let result = result else { return }
            let text = result.bestTranscription.formattedString
            Task { @MainActor in
                if !result.isFinal {
                    self.listener?.sakhaVoice(partialTranscript: text)
                    self.armSilenceTimer()
                    return
                }
                self.silenceTask?.cancel()
                if self.audioEngine.isRunning { self.audioEngine.stop() }
                self.audioEngine.inputNode.removeTap(onBus: 0)
                let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.isEmpty {
                    self.setState(.idle)
                    return
                }
                self.lastFinalTranscript = trimmed
                self.listener?.sakhaVoice(finalTranscript: trimmed)
                self.openTurn(userText: trimmed)
            }
        }
    }

    private func armSilenceTimer() {
        silenceTask?.cancel()
        guard let timeoutMs = config?.silenceTimeoutMs else { return }
        silenceTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(max(timeoutMs, 0)) * 1_000_000)
            guard let self = self, !Task.isCancelled else { return }
            self.recognitionRequest?.endAudio()
            if self.audioEngine.isRunning { self.audioEngine.stop() }
        }
    }

    private func stopListeningInternal() {
        silenceTask?.cancel()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        if audioEngine.isRunning { audioEngine.stop() }
        audioEngine.inputNode.removeTap(onBus: 0)
    }

    // MARK: - SSE turn

    private func openTurn(userText: String) {
        setState(.transcribing)
        parser.reset()
        ttsPlayer?.start()
        responseChars = 0
        verseCited = nil
        personaGuardTriggered = false
        filterFail = false
        firstByteMs = 0
        firstAudioMs = 0
        turnCount += 1

        streamTask?.cancel()
        armMaxResponseGuard()
        setState(.requesting)

        guard let client = sseClient else { return }
        client.stream(
            userText: userText,
            sessionId: sessionId,
            mood: currentMood,
            turnCount: turnCount
        ) { [weak self] event in
            guard let self = self else { return }
            Task { @MainActor in self.handleStreamEvent(event) }
        }
    }

    private func armMaxResponseGuard() {
        maxResponseGuardTask?.cancel()
        guard let cap = config?.maxResponseSpokenMs else { return }
        maxResponseGuardTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(max(cap, 0)) * 1_000_000)
            guard let self = self, !Task.isCancelled else { return }
            if self.currentState == .speaking || self.currentState == .pausing {
                self.stopSpeakingInternal()
                self.completeTurn()
            }
        }
    }

    @MainActor
    private func handleStreamEvent(_ event: SakhaStreamEvent) {
        if firstByteMs == 0 { firstByteMs = nowMs() - turnStartedAtMs }
        switch event {
        case .token(let text):
            responseChars += text.count
            listener?.sakhaVoice(textDelta: text, isFinal: false)
            // Persona guard pre-pass before feeding the parser.
            let guardResult = config?.enablePersonaGuard == true
                ? SakhaPersonaGuard.softenInline(text)
                : SakhaPersonaGuard.GuardResult(text: text, triggered: false)
            if guardResult.triggered { personaGuardTriggered = true }
            feedParser(guardResult.text)
        case .engine(let e, let m, let i):
            currentEngine = e
            currentMood = m
            currentMoodIntensity = i
            listener?.sakhaVoice(engineSelected: e, mood: m, intensity: i)
        case .verse(let ref, let sanskrit, _):
            verseCited = ref
            listener?.sakhaVoice(verseCited: ref, sanskrit: sanskrit)
        case .audio:
            // Backend pre-synthesised path — unused on iOS today; the
            // client-side /synthesize call is the canonical path.
            break
        case .session(let id):
            sessionId = id
        case .done:
            drainAndFinish()
        case .error(let err):
            listener?.sakhaVoice(error: err)
            setState(.error)
            completeTurn()
        }
    }

    @MainActor
    private func feedParser(_ text: String) {
        let events = parser.feed(text)
        if events.isEmpty { return }
        if currentState != .speaking && currentState != .pausing {
            setState(.speaking)
            if firstAudioMs == 0 { firstAudioMs = nowMs() - turnStartedAtMs }
        }
        for e in events { handleParserEvent(e) }
    }

    @MainActor
    private func handleParserEvent(_ e: PauseEvent) {
        switch e {
        case .filter:
            filterFail = true
            if config?.speakOnFilterFail == true {
                let template = filterFailTemplate()
                ttsPlayer?.enqueue(.speak(text: template, isSanskrit: false))
            }
            ttsPlayer?.enqueue(.filter)
        default:
            ttsPlayer?.enqueue(e)
        }
    }

    @MainActor
    private func drainAndFinish() {
        for ev in parser.finish() { handleParserEvent(ev) }
        ttsPlayer?.finish()
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 50_000_000) // 50ms
            self?.completeTurn()
        }
    }

    @MainActor
    private func completeTurn() {
        maxResponseGuardTask?.cancel()
        let player = ttsPlayer
        let totalSpoken = player?.statsTotalSpokenMs() ?? 0
        let pauses = player?.statsPauseCount() ?? 0
        let sttMs = max(nowMs() - sttStartedAtMs, 0)

        let metrics = SakhaTurnMetrics(
            sessionId: sessionId,
            engine: currentEngine,
            mood: currentMood,
            moodIntensity: currentMoodIntensity,
            language: config?.language ?? .english,
            transcriptChars: lastFinalTranscript.count,
            responseChars: responseChars,
            sttDurationMs: sttMs,
            firstByteMs: firstByteMs,
            firstAudioMs: firstAudioMs,
            totalSpokenMs: totalSpoken,
            pauseCount: pauses,
            verseCited: verseCited,
            filterFail: filterFail,
            personaGuardTriggered: personaGuardTriggered,
            barged: barged,
            thermalState: thermalStateString()
        )
        listener?.sakhaVoice(turnComplete: metrics)
        setState(.idle)
    }

    private func resetTurnMetrics() {
        firstByteMs = 0
        firstAudioMs = 0
        responseChars = 0
        verseCited = nil
        personaGuardTriggered = false
        filterFail = false
        barged = false
    }

    private func stopRequestInternal() {
        streamTask?.cancel()
        streamTask = nil
        sseClient?.cancel()
    }

    private func stopSpeakingInternal() {
        ttsPlayer?.stop()
        ttsPlayer?.start()  // re-arm for next turn
    }

    // MARK: - Filter-fail template (per persona spec — soft, not a sign-off)

    private func filterFailTemplate() -> String {
        switch config?.language ?? .english {
        case .hindi, .hinglish: return "रहो… एक साँस। अभी मेरे पास सही श्लोक नहीं है — पर मैं यहाँ हूँ।"
        case .tamil:            return "ஒரு மூச்சு… நான் இங்கே இருக்கிறேன்."
        case .telugu:           return "ఒక శ్వాస… నేను ఇక్కడ ఉన్నాను."
        case .bengali:          return "এক নিঃশ্বাস… আমি এখানে আছি।"
        case .marathi:          return "एक श्वास… मी इथेच आहे।"
        default:                return "Stay with me. One breath. I do not have the verse yet — but I am here."
        }
    }

    // MARK: - Helpers

    private func setState(_ next: SakhaVoiceStateRaw) {
        let prev = currentState
        if next == prev { return }
        previousState = prev
        currentState = next
        if config?.debugMode == true {
            NSLog("[SakhaVoiceManager] state \(prev.wire) → \(next.wire)")
        }

        // Wake-detector contention management — mirrors Android exactly:
        //   • Leaving IDLE → pause the always-on recognizer so the turn
        //     STT (or verse TTS) has the mic to itself.
        //   • Returning to IDLE → resume so the user can wake Sakha
        //     again with "Hey Sakha".
        //   • SHUTDOWN: leave it stopped; shutdown() handles full release.
        if let detector = wakeDetector, next != .shutdown {
            if next == .idle && prev != .idle {
                detector.start()
            } else if next != .idle && detector.isRunning() {
                detector.stop()
            }
        }

        Task { @MainActor [weak self] in
            self?.listener?.sakhaVoice(stateChanged: next, previousState: prev)
        }
    }

    private func ensureInitialized() -> Bool {
        if !initialized {
            assertionFailure("SakhaVoiceManager.initialize() must be called first")
            return false
        }
        return true
    }

    private func nowMs() -> Int64 {
        Int64(Date().timeIntervalSince1970 * 1000.0)
    }

    private func thermalStateString() -> String? {
        switch ProcessInfo.processInfo.thermalState {
        case .nominal: return "nominal"
        case .fair: return "fair"
        case .serious: return "serious"
        case .critical: return "critical"
        @unknown default: return nil
        }
    }
}

// MARK: - Internal TTS listener bridge

/// Forwards player events back into the manager so we can update state
/// (PAUSING ↔ SPEAKING) and fire verse-completion notifications.
private final class InternalTtsBridge: SakhaVoiceListener {
    weak var manager: SakhaVoiceManager?
    init(manager: SakhaVoiceManager) { self.manager = manager }

    func sakhaVoice(spokenSegment text: String, isSanskrit: Bool) {
        guard let mgr = manager else { return }
        Task { @MainActor in
            mgr.listener?.sakhaVoice(spokenSegment: text, isSanskrit: isSanskrit)
            mgr.handleVerseProgress()
        }
    }

    func sakhaVoice(pause durationMs: Int64) {
        guard let mgr = manager else { return }
        Task { @MainActor in
            mgr.handlePause(durationMs: durationMs)
        }
    }

    func sakhaVoiceFilterFail() {
        guard let mgr = manager else { return }
        Task { @MainActor in
            mgr.listener?.sakhaVoiceFilterFail()
        }
    }

    func sakhaVoice(error: SakhaVoiceError) {
        guard let mgr = manager else { return }
        Task { @MainActor in
            mgr.listener?.sakhaVoice(error: error)
        }
    }
}

// MARK: - Verse + pause helpers (called by InternalTtsBridge)

extension SakhaVoiceManager {

    @MainActor
    fileprivate func handlePause(durationMs: Int64) {
        // Toggle PAUSING during the pause; the next Speak job flips us back.
        setState(.pausing)
        listener?.sakhaVoice(pause: durationMs)
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(max(durationMs, 0)) * 1_000_000)
            guard let self = self else { return }
            if self.currentState == .pausing {
                self.setState(.speaking)
            }
        }
    }

    @MainActor
    fileprivate func handleVerseProgress() {
        guard let rec = currentVerseRecitation else { return }
        let idx = verseSegmentIndex
        if idx >= rec.segments.count { return }
        let language = rec.segments[idx].language
        verseSegmentIndex = idx + 1
        listener?.sakhaVoice(verseSegmentRead: rec.citation, language: language)
        if idx == rec.segments.count - 1 {
            currentVerseRecitation = nil
            verseSegmentIndex = 0
            listener?.sakhaVoice(verseReadComplete: rec.citation)
            setState(.idle)
        }
    }
}

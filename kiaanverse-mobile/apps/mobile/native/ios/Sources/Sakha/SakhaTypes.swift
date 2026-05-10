/**
 * Sakha Voice — Shared Types (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaTypes.kt. Enum wire
 * formats, the SakhaVoiceConfig struct, error cases, and the listener
 * protocol must stay symmetric — JS event payloads on iOS and Android
 * MUST decode identically through apps/mobile/types/sakhaVoice.ts.
 */

import Foundation

// MARK: - Engine Selection

@objc public enum SakhaEngine: Int {
    case guidance, friend, assistant, voiceGuide

    public var wire: String {
        switch self {
        case .guidance: return "GUIDANCE"
        case .friend: return "FRIEND"
        case .assistant: return "ASSISTANT"
        case .voiceGuide: return "VOICE_GUIDE"
        }
    }

    public static func fromWire(_ value: String?) -> SakhaEngine {
        switch value?.uppercased() {
        case "GUIDANCE": return .guidance
        case "ASSISTANT": return .assistant
        case "VOICE_GUIDE": return .voiceGuide
        default: return .friend
        }
    }
}

// MARK: - Mood

@objc public enum SakhaMood: Int {
    case anxious, sad, angry, lonely, confused, grieving, joyful, seeking, guilty, numb, neutral

    public var wire: String {
        switch self {
        case .anxious: return "anxious"
        case .sad: return "sad"
        case .angry: return "angry"
        case .lonely: return "lonely"
        case .confused: return "confused"
        case .grieving: return "grieving"
        case .joyful: return "joyful"
        case .seeking: return "seeking"
        case .guilty: return "guilty"
        case .numb: return "numb"
        case .neutral: return "neutral"
        }
    }

    public static func fromWire(_ value: String?) -> SakhaMood {
        guard let v = value?.lowercased() else { return .neutral }
        switch v {
        case "anxious": return .anxious
        case "sad": return .sad
        case "angry": return .angry
        case "lonely": return .lonely
        case "confused": return .confused
        case "grieving": return .grieving
        case "joyful": return .joyful
        case "seeking": return .seeking
        case "guilty": return .guilty
        case "numb": return .numb
        default: return .neutral
        }
    }
}

// MARK: - Language

@objc public enum SakhaLanguage: Int {
    case english, hindi, hinglish, tamil, telugu, bengali, marathi, sanskrit

    public var wire: String {
        switch self {
        case .english: return "en"
        case .hindi: return "hi"
        case .hinglish: return "hinglish"
        case .tamil: return "ta"
        case .telugu: return "te"
        case .bengali: return "bn"
        case .marathi: return "mr"
        case .sanskrit: return "sa"
        }
    }

    public var sttLocaleId: String {
        switch self {
        case .english: return "en-US"
        case .hindi, .hinglish: return "hi-IN"
        case .tamil: return "ta-IN"
        case .telugu: return "te-IN"
        case .bengali: return "bn-IN"
        case .marathi: return "mr-IN"
        case .sanskrit: return "hi-IN"   // STT falls back to Hindi for Sanskrit
        }
    }

    public static func fromWire(_ value: String?) -> SakhaLanguage {
        guard let v = value?.lowercased() else { return .english }
        switch v {
        case "en": return .english
        case "hi": return .hindi
        case "hinglish": return .hinglish
        case "ta": return .tamil
        case "te": return .telugu
        case "bn": return .bengali
        case "mr": return .marathi
        case "sa": return .sanskrit
        default: return .english
        }
    }
}

// MARK: - State Machine

@objc public enum SakhaVoiceStateRaw: Int {
    case uninitialized, idle, listening, transcribing, requesting, speaking, pausing, interrupted, error, shutdown

    public var wire: String {
        switch self {
        case .uninitialized: return "UNINITIALIZED"
        case .idle: return "IDLE"
        case .listening: return "LISTENING"
        case .transcribing: return "TRANSCRIBING"
        case .requesting: return "REQUESTING"
        case .speaking: return "SPEAKING"
        case .pausing: return "PAUSING"
        case .interrupted: return "INTERRUPTED"
        case .error: return "ERROR"
        case .shutdown: return "SHUTDOWN"
        }
    }
}

// MARK: - Configuration

public struct SakhaVoiceConfig {
    public var language: SakhaLanguage
    public var backendBaseUrl: String
    public var voiceCompanionPathPrefix: String
    public var sakhaVoiceId: String
    public var sanskritVoiceId: String
    public var defaultEngine: SakhaEngine
    public var allowBargeIn: Bool
    public var silenceTimeoutMs: Int64
    public var maxResponseSpokenMs: Int64
    public var requestTimeoutMs: Int64
    public var maxRequestRetries: Int
    public var enablePersonaGuard: Bool
    public var speakOnFilterFail: Bool
    public var debugMode: Bool
    public var enableWakeWord: Bool
    public var wakeWordPhrases: [String]
    public var wakeWordCooldownMs: Int64

    public init(
        language: SakhaLanguage = .english,
        backendBaseUrl: String,
        voiceCompanionPathPrefix: String = "/api/voice-companion",
        sakhaVoiceId: String = "sarvam-aura",
        sanskritVoiceId: String = "sarvam-meera",
        defaultEngine: SakhaEngine = .friend,
        allowBargeIn: Bool = true,
        silenceTimeoutMs: Int64 = 1800,
        maxResponseSpokenMs: Int64 = 45_000,
        requestTimeoutMs: Int64 = 12_000,
        maxRequestRetries: Int = 2,
        enablePersonaGuard: Bool = true,
        speakOnFilterFail: Bool = true,
        debugMode: Bool = false,
        enableWakeWord: Bool = false,
        wakeWordPhrases: [String] = [
            "hey sakha", "namaste sakha", "ok sakha", "sakha", "हे सखा", "सखा",
        ],
        wakeWordCooldownMs: Int64 = 1500
    ) {
        self.language = language
        self.backendBaseUrl = backendBaseUrl
        self.voiceCompanionPathPrefix = voiceCompanionPathPrefix
        self.sakhaVoiceId = sakhaVoiceId
        self.sanskritVoiceId = sanskritVoiceId
        self.defaultEngine = defaultEngine
        self.allowBargeIn = allowBargeIn
        self.silenceTimeoutMs = silenceTimeoutMs
        self.maxResponseSpokenMs = maxResponseSpokenMs
        self.requestTimeoutMs = requestTimeoutMs
        self.maxRequestRetries = maxRequestRetries
        self.enablePersonaGuard = enablePersonaGuard
        self.speakOnFilterFail = speakOnFilterFail
        self.debugMode = debugMode
        self.enableWakeWord = enableWakeWord
        self.wakeWordPhrases = wakeWordPhrases
        self.wakeWordCooldownMs = wakeWordCooldownMs
    }
}

// MARK: - Errors

public enum SakhaVoiceError: Error, CustomStringConvertible {
    case permissionDenied
    case microphoneUnavailable
    case speechRecognitionUnavailable
    case networkError(String)
    case httpError(Int, String)
    case authRequired
    case quotaExceeded
    case filterFail
    case ttsError(String)
    case unknown(String)

    public var code: String {
        switch self {
        case .permissionDenied: return "PermissionDenied"
        case .microphoneUnavailable: return "MicrophoneUnavailable"
        case .speechRecognitionUnavailable: return "SpeechRecognitionUnavailable"
        case .networkError: return "NetworkError"
        case .httpError: return "HttpError"
        case .authRequired: return "AuthRequired"
        case .quotaExceeded: return "QuotaExceeded"
        case .filterFail: return "FilterFail"
        case .ttsError: return "TtsError"
        case .unknown: return "Unknown"
        }
    }

    public var description: String {
        switch self {
        case .permissionDenied: return "RECORD_AUDIO permission not granted"
        case .microphoneUnavailable: return "Microphone not available"
        case .speechRecognitionUnavailable: return "Speech recognition not available"
        case .networkError(let d): return "Network error: \(d)"
        case .httpError(let s, let d): return "HTTP \(s): \(d)"
        case .authRequired: return "Authentication required"
        case .quotaExceeded: return "Daily quota exceeded"
        case .filterFail: return "Sakha could not connect retrieved verses to the prompt"
        case .ttsError(let d): return "TTS error: \(d)"
        case .unknown(let d): return d
        }
    }

    public var isRecoverable: Bool {
        switch self {
        case .permissionDenied, .microphoneUnavailable, .speechRecognitionUnavailable,
             .authRequired, .quotaExceeded:
            return false
        default:
            return true
        }
    }
}

// MARK: - Verse recitation

public struct VerseSegment {
    public let language: SakhaLanguage
    public let text: String
    public init(language: SakhaLanguage, text: String) {
        self.language = language
        self.text = text
    }
}

public struct VerseRecitation {
    public let chapter: Int
    public let verse: Int
    public let segments: [VerseSegment]
    public let betweenSegmentsPauseMs: Int64

    public var citation: String { "BG \(chapter).\(verse)" }

    /// init throws on validation failure (mirrors Kotlin's `require(…)`).
    public init(chapter: Int, verse: Int, segments: [VerseSegment], betweenSegmentsPauseMs: Int64 = 700) throws {
        guard (1...18).contains(chapter) else {
            throw SakhaVoiceError.unknown("BG chapter must be 1..18, was \(chapter)")
        }
        guard (1...78).contains(verse) else {
            throw SakhaVoiceError.unknown("BG verse must be 1..78, was \(verse)")
        }
        guard !segments.isEmpty else {
            throw SakhaVoiceError.unknown("VerseRecitation requires at least one segment")
        }
        guard betweenSegmentsPauseMs >= 0 else {
            throw SakhaVoiceError.unknown("betweenSegmentsPauseMs must be non-negative")
        }
        self.chapter = chapter
        self.verse = verse
        self.segments = segments
        self.betweenSegmentsPauseMs = betweenSegmentsPauseMs
    }
}

// MARK: - Telemetry / Metrics

public struct SakhaTurnMetrics {
    public let sessionId: String?
    public let engine: SakhaEngine
    public let mood: SakhaMood
    public let moodIntensity: Int
    public let language: SakhaLanguage
    public let transcriptChars: Int
    public let responseChars: Int
    public let sttDurationMs: Int64
    public let firstByteMs: Int64
    public let firstAudioMs: Int64
    public let totalSpokenMs: Int64
    public let pauseCount: Int
    public let verseCited: String?
    public let filterFail: Bool
    public let personaGuardTriggered: Bool
    public let barged: Bool
    public let thermalState: String?
}

// MARK: - Pause-parser events (used by parser/player)

public enum PauseEvent: Equatable {
    case speak(text: String, isSanskrit: Bool)
    case pause(durationMs: Int64)
    case filter
}

// MARK: - Listener Protocol

public protocol SakhaVoiceListener: AnyObject {
    func sakhaVoice(stateChanged state: SakhaVoiceStateRaw, previousState: SakhaVoiceStateRaw)
    func sakhaVoice(partialTranscript text: String)
    func sakhaVoice(finalTranscript text: String)
    func sakhaVoice(engineSelected engine: SakhaEngine, mood: SakhaMood, intensity: Int)
    func sakhaVoice(textDelta: String, isFinal: Bool)
    func sakhaVoice(spokenSegment text: String, isSanskrit: Bool)
    func sakhaVoice(pause durationMs: Int64)
    func sakhaVoice(verseCited reference: String, sanskrit: String?)
    func sakhaVoiceFilterFail()
    func sakhaVoice(turnComplete metrics: SakhaTurnMetrics)
    func sakhaVoice(error: SakhaVoiceError)
    func sakhaVoice(verseReadStarted citation: String)
    func sakhaVoice(verseSegmentRead citation: String, language: SakhaLanguage)
    func sakhaVoice(verseReadComplete citation: String)
    func sakhaVoice(wakeWord phrase: String)
}

/// Default no-op implementations so adopters only override what they need.
public extension SakhaVoiceListener {
    func sakhaVoice(stateChanged state: SakhaVoiceStateRaw, previousState: SakhaVoiceStateRaw) {}
    func sakhaVoice(partialTranscript text: String) {}
    func sakhaVoice(finalTranscript text: String) {}
    func sakhaVoice(engineSelected engine: SakhaEngine, mood: SakhaMood, intensity: Int) {}
    func sakhaVoice(textDelta: String, isFinal: Bool) {}
    func sakhaVoice(spokenSegment text: String, isSanskrit: Bool) {}
    func sakhaVoice(pause durationMs: Int64) {}
    func sakhaVoice(verseCited reference: String, sanskrit: String?) {}
    func sakhaVoiceFilterFail() {}
    func sakhaVoice(turnComplete metrics: SakhaTurnMetrics) {}
    func sakhaVoice(error: SakhaVoiceError) {}
    func sakhaVoice(verseReadStarted citation: String) {}
    func sakhaVoice(verseSegmentRead citation: String, language: SakhaLanguage) {}
    func sakhaVoice(verseReadComplete citation: String) {}
    func sakhaVoice(wakeWord phrase: String) {}
}

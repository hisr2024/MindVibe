/**
 * KIAAN Engine Orchestrator - iOS Native Three-Engine Pipeline
 *
 * Runs Guidance, Friend, and Navigation engines in parallel using GCD.
 * Produces instant local responses (<100ms) then optionally enhances via backend.
 *
 * Engines:
 * 1. Friend Engine — mood detection + empathetic response (keyword-based)
 * 2. Guidance Engine — Gita verse matching + wisdom (from cached verse corpus)
 * 3. Navigation Engine — intent classification + tool suggestion
 *
 * Power-aware: ultra-low = Friend only; balanced/performance = all 3.
 * Thermal-aware: auto-switches to ultra-low on .serious/.critical thermal state.
 */

import Foundation

// MARK: - Types

public enum PowerMode: String {
    case ultraLow = "ultra-low"
    case balanced = "balanced"
    case performance = "performance"
}

public struct EngineResult {
    public let friendResponse: String
    public let detectedMood: String
    public let moodIntensity: Double
    public let verseRef: String?
    public let wisdomText: String?
    public let intent: String
    public let toolSuggestion: String?
    public let localResponse: String
    public let needsEnhancement: Bool
    public let processingTimeMs: Double
    public let powerMode: PowerMode
}

public struct CachedVerse {
    let ref: String
    let chapter: Int
    let verse: Int
    let sanskrit: String
    let translation: String
    let theme: String
    let emotions: [String]
    let modernInsight: String
}

// MARK: - Mood Detection (Keyword-Based)

private let moodKeywords: [String: [String]] = [
    "angry": ["angry", "furious", "rage", "mad", "frustrated", "annoyed", "irritated", "hate"],
    "sad": ["sad", "depressed", "lonely", "hopeless", "grief", "crying", "miserable", "heartbroken"],
    "anxious": ["anxious", "worried", "nervous", "scared", "panic", "fear", "stressed", "overwhelmed"],
    "confused": ["confused", "lost", "uncertain", "doubt", "don't know", "unsure", "stuck"],
    "jealous": ["jealous", "envious", "envy", "compare", "why them", "unfair"],
    "guilty": ["guilty", "shame", "regret", "sorry", "fault", "blame", "wrong"],
    "peaceful": ["peaceful", "calm", "grateful", "thankful", "happy", "joy", "blessed", "content"],
    "seeking": ["meaning", "purpose", "dharma", "path", "direction", "goal", "destiny"],
    "neutral": [],
]

// MARK: - Intent Classification

private let navigationKeywords: [String: String] = [
    "journal": "journal",
    "write": "journal",
    "meditate": "meditation",
    "meditation": "meditation",
    "breathe": "breathing",
    "breathing": "breathing",
    "mantra": "mantra",
    "chapter": "gita_navigator",
    "verse": "gita_navigator",
    "settings": "settings",
    "profile": "profile",
]

// MARK: - Main Orchestrator

public final class KiaanEngineOrchestrator {

    public static let shared = KiaanEngineOrchestrator()

    private var verseCache: [CachedVerse] = []
    private var turnCount: Int = 0
    private var recentVerseRefs: [String] = []
    private var lastMood: String = "neutral"

    private init() {
        loadVerseCache()
    }

    // MARK: - Public API

    /// Process user input through all three engines. Target: <100ms.
    public func orchestrate(
        userInput: String,
        language: String = "en"
    ) -> EngineResult {
        let startTime = CFAbsoluteTimeGetCurrent()
        let powerMode = detectPowerMode()
        turnCount += 1

        let input = userInput.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)

        // Ultra-low power: Friend Engine only
        if powerMode == .ultraLow {
            let (mood, intensity) = detectMood(input)
            let friendResponse = generateFriendResponse(input: input, mood: mood, language: language)
            let elapsed = (CFAbsoluteTimeGetCurrent() - startTime) * 1000

            return EngineResult(
                friendResponse: friendResponse,
                detectedMood: mood,
                moodIntensity: intensity,
                verseRef: nil,
                wisdomText: nil,
                intent: "query",
                toolSuggestion: nil,
                localResponse: friendResponse,
                needsEnhancement: false,
                processingTimeMs: elapsed,
                powerMode: powerMode
            )
        }

        // Balanced/Performance: All 3 engines in parallel via GCD
        var friendResponse = ""
        var mood = "neutral"
        var intensity = 0.5
        var intent = "query"
        var toolSuggestion: String? = nil
        var verseRef: String? = nil
        var wisdomText: String? = nil

        let group = DispatchGroup()
        let queue = DispatchQueue(label: "com.mindvibe.kiaan.orchestrator", attributes: .concurrent)

        // Engine 1: Friend
        group.enter()
        queue.async {
            let detected = self.detectMood(input)
            mood = detected.0
            intensity = detected.1
            friendResponse = self.generateFriendResponse(input: input, mood: mood, language: language)
            group.leave()
        }

        // Engine 3: Navigation
        group.enter()
        queue.async {
            let classified = self.classifyIntent(input)
            intent = classified.0
            toolSuggestion = classified.1
            group.leave()
        }

        group.wait()

        // Engine 2: Guidance (depends on mood from Engine 1)
        if shouldOfferGuidance(mood: mood) {
            let matched = matchVerse(mood: mood)
            verseRef = matched?.ref
            if let verse = matched {
                wisdomText = "\(verse.translation)\n— Bhagavad Gita \(verse.ref)\n\(verse.modernInsight)"
            }
        }

        // Merge responses
        var parts = [friendResponse]
        if let wisdom = wisdomText {
            parts.append(wisdom)
        }
        if let tool = toolSuggestion, intent == "navigate" {
            parts.append("Would you like me to open \(tool)?")
        }
        let localResponse = parts.joined(separator: "\n\n")
        let needsEnhancement = shouldEnhance(mood: mood, intent: intent)

        lastMood = mood
        if let ref = verseRef {
            recentVerseRefs.append(ref)
            if recentVerseRefs.count > 10 { recentVerseRefs.removeFirst() }
        }

        let elapsed = (CFAbsoluteTimeGetCurrent() - startTime) * 1000

        return EngineResult(
            friendResponse: friendResponse,
            detectedMood: mood,
            moodIntensity: intensity,
            verseRef: verseRef,
            wisdomText: wisdomText,
            intent: intent,
            toolSuggestion: toolSuggestion,
            localResponse: localResponse,
            needsEnhancement: needsEnhancement,
            processingTimeMs: elapsed,
            powerMode: powerMode
        )
    }

    // MARK: - Friend Engine

    private func detectMood(_ input: String) -> (String, Double) {
        var bestMood = "neutral"
        var bestScore = 0
        var matchCount = 0

        for (mood, keywords) in moodKeywords {
            var score = 0
            for keyword in keywords {
                if input.contains(keyword) {
                    score += 1
                }
            }
            if score > bestScore {
                bestScore = score
                bestMood = mood
                matchCount = score
            }
        }

        let intensity = matchCount > 0 ? min(Double(matchCount) / 3.0, 1.0) : 0.3
        return (bestMood, intensity)
    }

    private func generateFriendResponse(input: String, mood: String, language: String) -> String {
        switch mood {
        case "angry":
            return "I can feel that frustration. It's completely valid to feel this way. Take a breath — I'm here."
        case "sad":
            return "I hear you, and I want you to know that your feelings matter. You don't have to carry this alone."
        case "anxious":
            return "That sounds really overwhelming. Let's take this one step at a time. You're safe right now."
        case "confused":
            return "It's okay not to have all the answers right now. Sometimes clarity comes when we stop forcing it."
        case "jealous":
            return "Comparison can be so painful. Your journey is uniquely yours — and it has its own beauty."
        case "guilty":
            return "Everyone makes mistakes. What matters is that you're reflecting on it — that takes real courage."
        case "peaceful":
            return "That's beautiful. Hold onto that feeling — you've earned this moment of peace."
        case "seeking":
            return "Seeking purpose is itself a sign of growth. Let's explore what feels meaningful to you."
        default:
            return "I'm here with you. Tell me what's on your mind — no filters needed."
        }
    }

    // MARK: - Navigation Engine

    private func classifyIntent(_ input: String) -> (String, String?) {
        for (keyword, tool) in navigationKeywords {
            if input.contains(keyword) {
                return ("navigate", tool)
            }
        }
        return ("query", nil)
    }

    // MARK: - Guidance Engine

    private func shouldOfferGuidance(mood: String) -> Bool {
        // Phase-gated: only after 2+ turns (past CONNECT/LISTEN phases)
        guard turnCount >= 3 else { return false }
        // Strong emotions warrant guidance
        let guidanceMoods: Set<String> = ["angry", "sad", "anxious", "confused", "jealous", "guilty", "seeking"]
        return guidanceMoods.contains(mood)
    }

    private func matchVerse(mood: String) -> CachedVerse? {
        let candidates = verseCache.filter { verse in
            verse.emotions.contains(mood) && !recentVerseRefs.contains(verse.ref)
        }
        return candidates.randomElement() ?? verseCache.filter { $0.emotions.contains(mood) }.first
    }

    // MARK: - Enhancement Decision

    private func shouldEnhance(mood: String, intent: String) -> Bool {
        if intent == "navigate" { return false }
        let deepMoods: Set<String> = ["sad", "anxious", "guilty", "seeking"]
        return deepMoods.contains(mood) || turnCount <= 2
    }

    // MARK: - Power Management

    private func detectPowerMode() -> PowerMode {
        let thermalState = ProcessInfo.processInfo.thermalState
        if thermalState == .serious || thermalState == .critical {
            return .ultraLow
        }

        // Check if app is in background
        if !Thread.isMainThread {
            return .balanced
        }

        return ProcessInfo.processInfo.isLowPowerModeEnabled ? .ultraLow : .balanced
    }

    // MARK: - Verse Cache

    private func loadVerseCache() {
        // Core therapeutic verses loaded at init
        verseCache = [
            CachedVerse(ref: "2.47", chapter: 2, verse: 47,
                       sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
                       translation: "You have the right to action alone, never to its fruits.",
                       theme: "Detachment", emotions: ["anxious", "stressed", "seeking"],
                       modernInsight: "Focus on what you can control — your effort — not outcomes."),
            CachedVerse(ref: "2.14", chapter: 2, verse: 14,
                       sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः",
                       translation: "Sensory experiences are temporary — they come and go.",
                       theme: "Impermanence", emotions: ["sad", "anxious", "angry"],
                       modernInsight: "This feeling is real, but it's temporary. It will pass."),
            CachedVerse(ref: "6.5", chapter: 6, verse: 5,
                       sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्",
                       translation: "Elevate yourself through your own effort. You are your own friend and enemy.",
                       theme: "Self-mastery", emotions: ["confused", "sad", "guilty"],
                       modernInsight: "You have the power to lift yourself. Start with one small step."),
            CachedVerse(ref: "6.35", chapter: 6, verse: 35,
                       sanskrit: "असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
                       translation: "The mind is restless, but it can be trained through practice and detachment.",
                       theme: "Mind training", emotions: ["anxious", "confused", "angry"],
                       modernInsight: "A restless mind is normal. Meditation and consistent practice tame it."),
            CachedVerse(ref: "9.26", chapter: 9, verse: 26,
                       sanskrit: "पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति",
                       translation: "Whoever offers even a leaf with devotion — I accept that offering of love.",
                       theme: "Self-worth", emotions: ["guilty", "sad", "seeking"],
                       modernInsight: "Your small sincere efforts are enough. You don't need to be perfect."),
            CachedVerse(ref: "9.30", chapter: 9, verse: 30,
                       sanskrit: "अपि चेत्सुदुराचारो भजते मामनन्यभाक्",
                       translation: "Even the most imperfect person who turns with sincerity shall be regarded as righteous.",
                       theme: "Redemption", emotions: ["guilty", "sad", "confused"],
                       modernInsight: "Your past doesn't define you. The decision to change is what matters."),
            CachedVerse(ref: "2.62", chapter: 2, verse: 62,
                       sanskrit: "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते",
                       translation: "Dwelling on sense objects creates attachment, which leads to desire and anger.",
                       theme: "Chain of destruction", emotions: ["angry", "jealous"],
                       modernInsight: "When anger rises, notice what attachment is behind it."),
            CachedVerse(ref: "3.37", chapter: 3, verse: 37,
                       sanskrit: "काम एष क्रोध एष रजोगुणसमुद्भवः",
                       translation: "It is desire and anger, born of passion, that consume and corrupt.",
                       theme: "Anger source", emotions: ["angry", "jealous", "guilty"],
                       modernInsight: "Anger often masks a deeper desire or hurt. Look beneath the surface."),
            CachedVerse(ref: "18.47", chapter: 18, verse: 47,
                       sanskrit: "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्",
                       translation: "Better your own dharma imperfectly than another's dharma perfectly.",
                       theme: "Authenticity", emotions: ["jealous", "confused", "seeking"],
                       modernInsight: "Stop comparing your path to others. Your unique journey is valid."),
            CachedVerse(ref: "18.66", chapter: 18, verse: 66,
                       sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
                       translation: "Surrender unto me alone. I shall deliver you. Do not fear.",
                       theme: "Surrender", emotions: ["anxious", "sad", "seeking"],
                       modernInsight: "Sometimes letting go of control is the bravest act. Trust the process."),
            CachedVerse(ref: "12.13", chapter: 12, verse: 13,
                       sanskrit: "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
                       translation: "One who hates no being, who is friendly and compassionate to all.",
                       theme: "Compassion", emotions: ["angry", "jealous"],
                       modernInsight: "Compassion starts with yourself. Extend the kindness you give others inward."),
            CachedVerse(ref: "5.21", chapter: 5, verse: 21,
                       sanskrit: "बाह्यस्पर्शेष्वसक्तात्मा विन्दत्यात्मनि यत्सुखम्",
                       translation: "One whose self is unattached to external contacts finds happiness within.",
                       theme: "Inner peace", emotions: ["peaceful", "seeking"],
                       modernInsight: "True joy isn't found in external things. It's already within you."),
        ]
    }
}

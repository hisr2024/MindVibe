/**
 * Sakha Persona Guard (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaPersonaGuard.kt.
 * Defence-in-depth client-side filter for the "AI tells" the Sakha
 * persona spec forbids. Pure regex work — no I/O, no state.
 *
 * Replacement strings (the Hindi/Sanskrit fragments) are byte-identical
 * to the Android side so two clients on the same backend response speak
 * the same words.
 */

import Foundation

public enum SakhaPersonaGuard {

    public struct GuardResult {
        public let text: String
        public let triggered: Bool
    }

    /// Banned phrases → Sakha-shaped replacement. Empty string ⇒ excise.
    /// Order matters: longer / more specific phrases first.
    private static let replacements: [(NSRegularExpression, String)] = makeReplacements()

    /// Phrases that, if seen in the first sentence, justify a hard retry.
    private static let severeTells: [NSRegularExpression] = makeSevereTells()

    private static func makeReplacements() -> [(NSRegularExpression, String)] {
        let entries: [(String, String)] = [
            ("\\bremember,?\\s+you\\s+are\\s+not\\s+alone\\b",
             "तुम अकेले नहीं हो — मैं यहाँ बैठा हूँ"),
            ("\\bsending\\s+you\\s+love\\s+and\\s+light\\b", ""),
            ("\\btake\\s+care\\s+of\\s+yourself\\b", ""),
            ("\\byou(?:'ve|\\s+have)?\\s+got\\s+this\\b", ""),
            ("\\bon\\s+the\\s+bright\\s+side\\b", ""),
            ("\\bi'?m\\s+just\\s+an\\s+ai\\b", ""),
            ("\\bi\\s+understand\\b(?!\\s+now)", "मैं सुन रहा हूँ"),
            ("\\bit\\s+sounds\\s+like\\b", ""),
            ("\\bthat\\s+must\\s+be\\s+(?:difficult|hard|tough)\\b", ""),
            ("\\bi'?m\\s+here\\s+for\\s+you\\b", "मैं यहाँ हूँ"),
            ("\\bhave\\s+you\\s+tried\\b", ""),
            ("\\bmany\\s+people\\s+feel\\s+this\\s+way\\b", ""),
            ("\\blet'?s\\s+unpack\\s+that\\b", ""),
            ("\\byour\\s+feelings\\s+are\\s+valid\\b", ""),
            ("\\bjust\\s+breathe\\b", "साँस — एक, धीरे"),
        ]
        return entries.map { (pattern, replacement) in
            // .caseInsensitive matches the Kotlin (?i) flag.
            (try! NSRegularExpression(pattern: pattern, options: [.caseInsensitive]), replacement)
        }
    }

    private static func makeSevereTells() -> [NSRegularExpression] {
        let patterns: [String] = [
            "\\bi'?m\\s+just\\s+an\\s+ai\\b",
            "\\bas\\s+an\\s+ai\\s+(?:language\\s+)?model\\b",
            "\\bi\\s+do\\s+not\\s+have\\s+(?:feelings|emotions|the\\s+ability)\\b",
        ]
        return patterns.map { try! NSRegularExpression(pattern: $0, options: [.caseInsensitive]) }
    }

    /// Inline-rewrite a streaming chunk. Idempotent.
    public static func softenInline(_ chunk: String) -> GuardResult {
        if chunk.isEmpty { return GuardResult(text: chunk, triggered: false) }
        var working = chunk
        var triggered = false

        for (pattern, replacement) in replacements {
            let nsRange = NSRange(working.startIndex..., in: working)
            if pattern.firstMatch(in: working, range: nsRange) == nil { continue }
            let updated = pattern.stringByReplacingMatches(
                in: working,
                range: NSRange(working.startIndex..., in: working),
                withTemplate: replacement
            )
            working = updated
            triggered = true
        }

        if triggered {
            // Collapse double-spaces and stray space-before-punct.
            working = working.replacingOccurrences(of: "[ \\t]{2,}", with: " ", options: .regularExpression)
            working = working.replacingOccurrences(of: "\\s+([,.!?।॥])", with: "$1", options: .regularExpression)
            working = working.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return GuardResult(text: working, triggered: triggered)
    }

    /// Should the response be retried (FILTER_FAIL) based on the first sentence?
    public static func shouldRetry(_ firstSentence: String) -> Bool {
        if firstSentence.isEmpty { return false }
        let sample = String(firstSentence.prefix(240))
        let nsRange = NSRange(sample.startIndex..., in: sample)
        return severeTells.contains { $0.firstMatch(in: sample, range: nsRange) != nil }
    }
}

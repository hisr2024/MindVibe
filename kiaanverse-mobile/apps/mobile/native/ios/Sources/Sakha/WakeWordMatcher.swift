/**
 * WakeWordMatcher (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../WakeWordMatcher.kt. Used
 * by the (M4) wake-word detector to match wake phrases inside transcripts
 * from SFSpeechRecognizer's partial results.
 *
 * Match contract:
 *   - case-insensitive (Devanagari has no case so no-op for "हे सखा")
 *   - punctuation-tolerant (ASCII + Devanagari danda U+0964/U+0965)
 *   - whitespace-tolerant
 *   - word-boundary aware (haystack and needle padded with spaces so a
 *     successful contains() match implies a token boundary)
 *
 * Returns the matched (normalized) phrase, never the raw transcript.
 *
 * O(P × N) — P phrases, N transcript length. Both small in practice
 * (≤6 phrases, ≤200 chars). Comfortable under the 5ms budget the M4
 * always-on detector loop allows per partial result.
 */

import Foundation

public enum WakeWordMatcher {

    private static let punctuationRe = try! NSRegularExpression(
        pattern: "[\\p{Punct}—–•…।॥]+"
    )
    private static let whitespaceRe = try! NSRegularExpression(pattern: "\\s+")

    /// Lowercase + strip punctuation + collapse whitespace. Idempotent.
    public static func normalize(_ text: String) -> String {
        if text.isEmpty { return "" }
        let lowered = text.lowercased()
        let unpunct = punctuationRe.stringByReplacingMatches(
            in: lowered,
            range: NSRange(lowered.startIndex..., in: lowered),
            withTemplate: " "
        )
        let collapsed = whitespaceRe.stringByReplacingMatches(
            in: unpunct,
            range: NSRange(unpunct.startIndex..., in: unpunct),
            withTemplate: " "
        )
        return collapsed.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Return the first phrase from `phrases` (in normalized form) that
    /// appears as a complete word-aligned phrase in `transcript`. Returns
    /// nil if none match. Phrases are tested in the order given.
    public static func match(transcript: String, phrases: [String]) -> String? {
        if transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return nil }
        if phrases.isEmpty { return nil }
        let haystack = " " + normalize(transcript) + " "
        for phrase in phrases {
            let needle = normalize(phrase)
            if needle.isEmpty { continue }
            let padded = " \(needle) "
            if haystack.contains(padded) { return needle }
        }
        return nil
    }
}

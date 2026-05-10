/**
 * Sakha Pause Parser (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaPauseParser.kt. Pure
 * single-threaded streaming parser. The output PauseEvent is a struct
 * defined in SakhaTypes.swift so SakhaVoiceManager + SakhaTtsPlayer share
 * a single type — same as Android.
 *
 * Behaviour:
 * - Accepts partial chunks: an SSE frame like "<pau" + "se:short>" buffers
 *   the incomplete tail and flushes once the next frame completes the
 *   marker.
 * - Greedy speakable flush at sentence ends so TTS can start as early as
 *   the first natural break.
 * - Detects Devanagari (the Unicode block U+0900–U+097F) so the player
 *   routes Sanskrit segments to the reverent voice (sanskritVoiceId).
 * - FILTER_FAIL sentinel is hard-stop — drops everything before/after.
 */

import Foundation

public final class SakhaPauseParser {

    private static let pauseShortMs: Int64 = 300
    private static let pauseMediumMs: Int64 = 600
    private static let pauseLongMs: Int64 = 1200

    /// Conservative Devanagari range — Sanskrit + Hindi.
    private static let devanagariRegex = try! NSRegularExpression(pattern: "[\\u0900-\\u097F]")

    /// Longest token a partial chunk could not yet form. Keep buffer < this
    /// to decide between "wait for next frame" and "treat as unknown tag".
    private static let longestPartialMarker: Int = "<pause:medium>".count

    /// Sentence-end characters across English + Indian scripts.
    /// Includes the Devanagari danda (U+0964) and double-danda (U+0965).
    private static let sentenceEnds: Set<Character> = [".", "!", "?", "।", "॥"]

    /// FILTER_FAIL sentinel — must match the persona spec exactly.
    private static let filterFailToken = "FILTER_FAIL: no_retrieval"

    private var buffer = ""
    private var filterFailEmitted = false

    public init() {}

    /// Feed a streaming text chunk. Returns the events that can be safely
    /// emitted right now; any incomplete tail stays buffered.
    public func feed(_ chunk: String) -> [PauseEvent] {
        if filterFailEmitted { return [] }
        if chunk.isEmpty { return [] }
        buffer.append(chunk)
        return drain(force: false)
    }

    /// Signal end-of-stream. Flushes any buffered prose as a final Speak.
    public func finish() -> [PauseEvent] {
        if filterFailEmitted { return [] }
        return drain(force: true)
    }

    public func reset() {
        buffer = ""
        filterFailEmitted = false
    }

    // MARK: - Internals

    private func drain(force: Bool) -> [PauseEvent] {
        var events: [PauseEvent] = []

        // Hard stop on FILTER_FAIL.
        if let range = buffer.range(of: Self.filterFailToken) {
            _ = range
            buffer = ""
            filterFailEmitted = true
            events.append(.filter)
            return events
        }

        while true {
            guard let markerStart = buffer.firstIndex(of: "<") else {
                if let flushed = flushSpeakable(force: force) {
                    events.append(flushed)
                    continue
                }
                break
            }

            let parsed = parsePauseMarker(at: markerStart)
            if parsed == nil {
                // Could be incomplete: wait for next chunk.
                let closeIdx = buffer.range(of: ">", range: markerStart..<buffer.endIndex)?.lowerBound
                let tailLen = buffer.distance(from: markerStart, to: buffer.endIndex)
                if !force && closeIdx == nil && tailLen <= Self.longestPartialMarker {
                    if markerStart > buffer.startIndex {
                        let pre = String(buffer[buffer.startIndex..<markerStart])
                        buffer.removeSubrange(buffer.startIndex..<markerStart)
                        emitSpeakable(into: &events, raw: pre)
                    }
                    break
                }
                // Drop unknown tag inline; preserve surrounding prose.
                guard let closeIdx2 = closeIdx else {
                    // Forced flush, no closer ever — treat tail as literal.
                    let pre = buffer
                    buffer = ""
                    emitSpeakable(into: &events, raw: pre)
                    break
                }
                let before = String(buffer[buffer.startIndex..<markerStart])
                let after = String(buffer[buffer.index(after: closeIdx2)..<buffer.endIndex])
                buffer = before + after
                continue
            }

            let (durationMs, markerEnd) = parsed!
            // Flush prose before the marker.
            if markerStart > buffer.startIndex {
                let pre = String(buffer[buffer.startIndex..<markerStart])
                buffer.removeSubrange(buffer.startIndex..<markerEnd)
                emitSpeakable(into: &events, raw: pre)
            } else {
                buffer.removeSubrange(buffer.startIndex..<markerEnd)
            }
            events.append(.pause(durationMs: durationMs))
        }

        return events
    }

    /// Try to parse a pause marker starting at `start`. Returns (durationMs,
    /// indexAfterMarker) on success, nil if incomplete or malformed.
    private func parsePauseMarker(at start: String.Index) -> (Int64, String.Index)? {
        guard let close = buffer.range(of: ">", range: start..<buffer.endIndex)?.lowerBound else {
            return nil
        }
        let token = String(buffer[start...close]).lowercased()
        let durationMs: Int64
        switch token {
        case "<pause:short>": durationMs = Self.pauseShortMs
        case "<pause:medium>": durationMs = Self.pauseMediumMs
        case "<pause:long>": durationMs = Self.pauseLongMs
        default: return nil
        }
        return (durationMs, buffer.index(after: close))
    }

    private func flushSpeakable(force: Boolean) -> PauseEvent? {
        if buffer.isEmpty { return nil }

        let sliceEnd: String.Index
        if force {
            sliceEnd = buffer.endIndex
        } else if let boundary = lastSentenceBoundary() {
            sliceEnd = boundary
        } else {
            return nil
        }

        let raw = String(buffer[buffer.startIndex..<sliceEnd])
        buffer.removeSubrange(buffer.startIndex..<sliceEnd)
        let cleaned = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.isEmpty { return nil }
        return .speak(text: cleaned, isSanskrit: containsDevanagari(cleaned))
    }

    private func lastSentenceBoundary() -> String.Index? {
        var lastBoundary: String.Index? = nil
        var i = buffer.startIndex
        while i < buffer.endIndex {
            if Self.sentenceEnds.contains(buffer[i]) {
                lastBoundary = buffer.index(after: i)
            }
            i = buffer.index(after: i)
        }
        return lastBoundary
    }

    private func emitSpeakable(into events: inout [PauseEvent], raw: String) {
        let cleaned = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.isEmpty { return }
        events.append(.speak(text: cleaned, isSanskrit: containsDevanagari(cleaned)))
    }

    private func containsDevanagari(_ text: String) -> Bool {
        let range = NSRange(text.startIndex..., in: text)
        return Self.devanagariRegex.firstMatch(in: text, range: range) != nil
    }
}

/// Swift type alias so `Boolean` reads naturally to Kotlin readers.
private typealias Boolean = Bool

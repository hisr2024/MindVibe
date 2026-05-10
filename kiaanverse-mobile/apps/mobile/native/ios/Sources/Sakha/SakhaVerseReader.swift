/**
 * Sakha Verse Reader (iOS port)
 *
 * Direct port of apps/mobile/native/android/.../SakhaVerseReader.kt.
 * Pure recitation planner: VerseRecitation → ordered [PauseEvent].
 *
 * The planner alternates Speak / Pause / Speak / … and never trails with
 * a Pause. Sanskrit segments carry isSanskrit=true so SakhaTtsPlayer can
 * route them to sanskritVoiceId (reverent prosody).
 */

import Foundation

public enum SakhaVerseReader {

    /// Plan a verse recitation into the ordered PauseEvent queue
    /// SakhaTtsPlayer.enqueue accepts. Throws nothing — VerseRecitation's
    /// init enforces invariants.
    public static func plan(_ recitation: VerseRecitation) -> [PauseEvent] {
        var out: [PauseEvent] = []
        out.reserveCapacity(recitation.segments.count * 2 - 1)

        for (index, segment) in recitation.segments.enumerated() {
            out.append(.speak(text: segment.text, isSanskrit: segment.language == .sanskrit))
            let isLast = index == recitation.segments.count - 1
            if !isLast && recitation.betweenSegmentsPauseMs > 0 {
                out.append(.pause(durationMs: recitation.betweenSegmentsPauseMs))
            }
        }
        return out
    }
}

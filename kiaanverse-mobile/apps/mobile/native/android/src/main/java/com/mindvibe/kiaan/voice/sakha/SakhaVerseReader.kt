/**
 * Sakha Verse Reader — pure recitation planner.
 *
 * Turns a [VerseRecitation] into the exact ordered sequence of
 * [PauseEvent]s that [SakhaTtsPlayer] knows how to consume:
 *
 *   verse 1 segment 1 (text, isSanskrit)         → PauseEvent.Speak
 *   pause                                         → PauseEvent.Pause
 *   verse 1 segment 2 (text, isSanskrit)         → PauseEvent.Speak
 *   pause                                         → PauseEvent.Pause
 *   …
 *   verse 1 last segment                          → PauseEvent.Speak
 *
 * No leading or trailing pause — the player's natural prosody opens
 * and closes the recitation.
 *
 * This is intentionally a **pure** function: no I/O, no coroutines, no
 * mutable state. The [SakhaVoiceManager.readVerse] method that drives
 * the player calls [plan] to compute the queue, then enqueues each
 * event via the existing [SakhaTtsPlayer.enqueue] API. The player
 * already routes [PauseEvent.Speak.isSanskrit] to the reverent voice
 * (`sanskritVoiceId`) — so the reader gets multi-language voice
 * routing for free, without duplicating Sanskrit detection logic.
 *
 * Keeping the planner pure lets us JVM-unit-test the recitation order
 * and pause insertion without an Android emulator or a TTS provider.
 *
 * Example:
 *
 *   val rec = VerseRecitation(
 *       chapter = 2, verse = 47,
 *       segments = listOf(
 *           VerseSegment(SakhaLanguage.SANSKRIT,
 *               "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन..."),
 *           VerseSegment(SakhaLanguage.HINDI,
 *               "तुम्हारा अधिकार केवल कर्म पर है..."),
 *           VerseSegment(SakhaLanguage.ENGLISH,
 *               "You have a right to the action alone..."),
 *       ),
 *   )
 *   val events = SakhaVerseReader.plan(rec)
 *   //  events = [
 *   //    Speak(SA text, isSanskrit=true),
 *   //    Pause(700ms),
 *   //    Speak(HI text, isSanskrit=false),
 *   //    Pause(700ms),
 *   //    Speak(EN text, isSanskrit=false),
 *   //  ]
 */

package com.mindvibe.kiaan.voice.sakha

object SakhaVerseReader {

    /**
     * Plan a verse recitation. Returns a list of [PauseEvent]s the
     * caller can hand to [SakhaTtsPlayer.enqueue] in order. The list
     * always alternates Speak / Pause / Speak / … and never ends with
     * a Pause.
     *
     * Throws no exceptions — [VerseRecitation]'s init block already
     * validated the inputs.
     */
    fun plan(recitation: VerseRecitation): List<PauseEvent> {
        val out = ArrayList<PauseEvent>(recitation.segments.size * 2 - 1)
        recitation.segments.forEachIndexed { index, segment ->
            out.add(
                PauseEvent.Speak(
                    text = segment.text,
                    isSanskrit = segment.language == SakhaLanguage.SANSKRIT,
                )
            )
            // Inter-segment pause only between segments — never trailing.
            val isLast = index == recitation.segments.lastIndex
            if (!isLast && recitation.betweenSegmentsPauseMs > 0L) {
                out.add(PauseEvent.Pause(recitation.betweenSegmentsPauseMs))
            }
        }
        return out
    }
}

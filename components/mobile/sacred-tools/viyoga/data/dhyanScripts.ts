/**
 * Viyoga Sacred Journey — Dhyan (Meditation) Scripts
 *
 * Guided meditation scripts for each separation type. These are read aloud
 * or displayed line-by-line during the dhyan phase of the Viyoga ritual.
 *
 * {name} is a placeholder replaced at runtime with the name of
 * the person, place, or concept the user is separated from.
 *
 * Each script embodies Gita philosophy without quoting directly —
 * the wisdom is woven into the meditation itself.
 */

export const DHYAN_SCRIPTS: Record<string, string[]> = {
  death: [
    'Close your eyes gently. Feel the earth beneath you.',
    'Breathe. You are safe here, in this sacred space.',
    'See in your inner eye — a vast, luminous sky.',
    'Not night, not day — the eternal twilight between worlds.',
    'Somewhere in that light... {name} is present.',
    'Not gone. Transformed. Light meeting light.',
    'Can you feel their presence — not in memory, but now, here?',
    'The Gita says: the soul was never born, never dies.',
    '{name} has not left you. They have become everywhere.',
    'Place your right hand on your heart.',
    'They live here now — in the heart that loved them.',
    'This is not grief. This is sacred proximity.',
    'Stay here as long as you need. You are not alone.',
    'When you are ready, breathe three times. Slowly.',
    'You carry them with you. Always. Always.',
  ],

  estrangement: [
    'Settle into stillness. Let the silence hold you.',
    'There is a door between you and {name}. You know this door.',
    'You have knocked on it. Waited beside it. Wept against it.',
    'But silence is not absence. Silence has its own voice.',
    'Breathe into the ache. Do not push it away.',
    'The Gita teaches: hatred never resolves hatred — only compassion dissolves it.',
    'Imagine {name} sitting in their own silence, carrying their own weight.',
    'You do not need to forgive today. You only need to breathe.',
    'With each exhale, release one thread of bitterness. Just one.',
    'What remains when resentment loosens? Feel that space.',
    'It is tender. It is yours. No one can take it from you.',
    'You are whole — even with this wound open.',
    '{name} walks their path. You walk yours. Both paths are sacred.',
    'Place your hand on your chest. This heart still knows how to love.',
    'When you are ready, open your eyes. The world is still here for you.',
  ],

  heartbreak: [
    'Be still. Let the trembling in your chest simply be.',
    'You loved {name}. That is not a mistake. That is courage.',
    'Love does not fail when it changes form. Rivers do not fail when they reach the sea.',
    'Close your eyes. See the two of you in a field of light.',
    'Not as you were at the end — as you were when love was true.',
    'That moment was real. Nothing can un-make what was real.',
    'The Gita whispers: you were never the doer. Love moved through you.',
    'You offered yourself fully. That is the highest offering.',
    'Now breathe — and with this breath, begin to gather yourself back.',
    'Every piece of your heart you gave to {name} — it was never lost.',
    'It is returning to you now, changed, deepened, still beating.',
    'You will love again. Not the same way. A wider way.',
    'Place both hands over your heart. Feel its stubborn, beautiful rhythm.',
    'This heart broke open — not apart. There is more room inside now.',
    'Rise gently. You are not less. You are more.',
  ],

  self: [
    'Sit quietly. You do not need to perform anything here.',
    'Somewhere along the way, you lost the thread of yourself.',
    'The voice that was yours became quieter. Someone else\'s grew louder.',
    'But {name} — the truest you — has not vanished. Only gone inward.',
    'Breathe deeply. Each breath is a lantern lowered into the well.',
    'The Gita reveals: within every being dwells an unchanging witness.',
    'Beneath the roles, the masks, the exhaustion — you are still there.',
    'Can you feel it? That faint pulse of recognition?',
    'Say inwardly: I have not abandoned myself. I am finding my way back.',
    'You are not broken. You are a river that forgot it was moving.',
    'Place your hand on your belly. Feel the ancient rhythm of breath.',
    'This body has carried you through every storm. Thank it.',
    '{name} is not someone you must become. You already are.',
    'When you open your eyes, look at the world as if seeing it for the first time.',
    'You are here. That is enough. That has always been enough.',
  ],

  homeland: [
    'Close your eyes. Let the ground beneath you become the ground you remember.',
    'See it now — {name}. The light there. The air. The sounds of morning.',
    'Feel the dust of its roads on your feet. The warmth of its sun on your arms.',
    'You carry this place in your body. It lives in your bones.',
    'Breathe in — and smell what you remember. Rain on dry earth. Cooking fires. Blossoms.',
    'The Gita promises: the one who remembers the divine at every moment is never lost.',
    'And you have remembered. Every single day, you have remembered {name}.',
    'That remembering is not weakness. It is devotion. It is rootedness.',
    'You are not uprooted. You are a tree whose roots stretch across oceans.',
    'Place your palms together. In this gesture, two distant shores meet.',
    'You belong to {name}. And {name} belongs to you. Distance cannot sever this.',
    'One day you may return. Or you may not. Either way, the bond holds.',
    'Breathe out slowly. You are exactly where you are meant to be.',
    'Open your eyes. Carry your homeland forward. It travels with you.',
  ],

  divine: [
    'Be still. Become the silence that is reaching toward the sacred.',
    'You feel it — the vast absence. The sky where {name} should be.',
    'You have prayed. You have called out. And the silence answered with more silence.',
    'But listen deeper. Beneath the silence, there is a hum.',
    'The Gita sings: I am never absent to the one who sees me in all things.',
    'What if {name} has not withdrawn — but drawn closer than closeness?',
    'So close that your eyes, made for distance, cannot perceive it.',
    'Breathe. Feel the breath itself. Who is breathing you?',
    'This longing you carry — it is not emptiness. It is the shape of the beloved.',
    'A cup is defined by its hollow. Your ache is the sacred vessel.',
    'Place your hands open on your knees. Palms up. Receiving.',
    'You are not abandoned. You are being drawn inward, toward the source.',
    '{name} waits — not beyond you, but within you. In the cave of the heart.',
    'Rest here. The dark night is not punishment. It is initiation.',
    'When you open your eyes, know this: the seeker is already the found.',
  ],
}

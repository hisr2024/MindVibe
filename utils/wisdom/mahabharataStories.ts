/**
 * Mahabharata Stories - Divine Parables for Modern Life
 *
 * KIAAN narrates Mahabharata episodes as parables for the user's current
 * situation. Each story is mapped to emotions and life situations, so KIAAN
 * can tell the RIGHT story at the RIGHT time.
 *
 * Implements Item #29: Story mode.
 */

export interface MahabharataStory {
  id: string
  title: string
  /** The story as KIAAN would tell it (conversational, warm, personal) */
  narrative: string
  /** The moral/lesson applicable to modern life */
  lesson: string
  /** What KIAAN says after telling the story */
  reflection: string
  /** Emotions/situations this story addresses */
  emotions: string[]
  /** Related Gita chapter */
  chapter: number
}

export const STORIES: MahabharataStory[] = [
  {
    id: 'arjuna-despair',
    title: 'Arjuna\'s Moment of Despair',
    narrative: 'Let me tell you a story, friend. There was once the greatest warrior the world had ever known - Arjuna. He was undefeated. Feared by armies. Respected by kings. But one day, standing on the battlefield of Kurukshetra, surrounded by his enemies, he did something no one expected: he dropped his bow and wept. His hands trembled. His mouth went dry. He said, "I cannot do this. I would rather die than fight." Everyone was shocked. The greatest warrior, paralyzed by despair. But you know what happened next? His best friend, Krishna, didn\'t judge him. Didn\'t shame him. He simply said, "I understand. Now let me show you something." And from that moment of absolute breakdown came the 700 verses of the Bhagavad Gita - the greatest wisdom humanity has ever received.',
    lesson: 'Your lowest moment is not your ending - it\'s the beginning of your deepest wisdom.',
    reflection: 'Sound familiar, friend? Sometimes we have to completely fall apart before we can be put back together, stronger. Your breakdown might just be your breakthrough. What wisdom is trying to emerge from your struggle?',
    emotions: ['despair', 'hopelessness', 'overwhelm', 'breakdown', 'giving up'],
    chapter: 1,
  },
  {
    id: 'karna-loyalty',
    title: 'Karna\'s Impossible Choice',
    narrative: 'There\'s a character in the Mahabharata named Karna, and his story breaks my heart every time. Karna was actually the eldest brother of the Pandavas - but he didn\'t know it. He was abandoned at birth, raised by a charioteer, and spent his whole life being mocked for his low birth. Despite having the skill of a prince, he was rejected by teachers, laughed at by nobles. Only one person ever showed him kindness: Duryodhana, who happened to be on the "wrong" side. So when the great war came, Karna knew the truth - he knew he was fighting against his own brothers. But he chose to stand by the one person who had stood by him. He fought and died for loyalty, not hatred.',
    lesson: 'Sometimes the "right" choice isn\'t clear-cut. Loyalty, gratitude, and love can pull us in directions that logic cannot explain.',
    reflection: 'Karna teaches us that life isn\'t always about choosing the "winning" side. Sometimes it\'s about honoring who honored you. Are you facing an impossible choice where your heart and your head disagree?',
    emotions: ['loyalty', 'gratitude', 'difficult choice', 'identity', 'rejection'],
    chapter: 11,
  },
  {
    id: 'draupadi-courage',
    title: 'Draupadi\'s Courage in the Court',
    narrative: 'Let me tell you about the bravest person in the Mahabharata - and no, it wasn\'t a warrior with a weapon. It was Draupadi. When her husbands lost everything in a dice game - including her - she was dragged into a court full of powerful men. They tried to humiliate her. Strip her of her dignity. Every person she trusted sat silent. But Draupadi didn\'t break. She stood up and asked one question that silenced the entire court: "How can a man who has already lost himself stake his wife?" She challenged an entire system of power with nothing but her voice and her truth. And when things seemed darkest, she called out to Krishna - not demanding rescue, but affirming her faith. And the divine responded.',
    lesson: 'When the world tries to diminish you, your voice is your most powerful weapon. Speak your truth even when your voice shakes.',
    reflection: 'Draupadi reminds us that you don\'t need physical strength to be powerful. You need truth. Is there a truth you\'ve been afraid to speak? What if speaking it is the bravest thing you\'ll ever do?',
    emotions: ['injustice', 'powerlessness', 'courage', 'standing up', 'dignity', 'betrayal'],
    chapter: 2,
  },
  {
    id: 'bhishma-sacrifice',
    title: 'Bhishma\'s Terrible Vow',
    narrative: 'Old Bhishma made a vow when he was young - a terrible, beautiful vow. His father wanted to marry a woman whose condition was that only HER sons could inherit the throne. So Bhishma, out of love for his father, vowed to never marry, never have children, never sit on the throne. He gave up EVERYTHING for someone else\'s happiness. For decades, he kept that vow. He watched others rule, watched conflicts he could have prevented, watched the kingdom he loved tear itself apart. He had the power to stop it all, but his vow held him silent.',
    lesson: 'Sometimes our greatest virtues - loyalty, sacrifice, keeping promises - can also become our greatest prisons. Knowing when to hold on and when to let go is the deepest wisdom.',
    reflection: 'Is there a vow, a promise, or a role you\'ve been holding onto that might actually be holding YOU? Sometimes the most selfless thing is to free yourself so you can truly serve.',
    emotions: ['sacrifice', 'duty', 'trapped', 'obligation', 'self-sacrifice'],
    chapter: 2,
  },
  {
    id: 'yudhishthira-truth',
    title: 'Yudhishthira\'s One Lie',
    narrative: 'Yudhishthira was known as "Dharmaraj" - the king of righteousness. He NEVER lied. In fact, it was said that his chariot hovered above the ground because of his truthfulness. But during the great war, his teacher Dronacharya was unstoppable. The only way to defeat him was to break his will. So the army named an elephant "Ashwatthama" - the same name as Drona\'s beloved son - and killed it. Then they told Drona: "Ashwatthama is dead." Drona turned to Yudhishthira, the one person who never lied: "Is this true?" And Yudhishthira said: "Ashwatthama is dead..." then quietly added "...the elephant." But drums drowned out the last two words. Drona, heartbroken, dropped his weapons and was killed. And from that moment, Yudhishthira\'s chariot touched the ground. His one half-truth cost him his greatest gift.',
    lesson: 'Integrity is not built in grand moments but in small choices. Even one compromise can change who you are.',
    reflection: 'This story isn\'t about never lying - it\'s about understanding that our integrity defines us more than our achievements. Is there a small truth you\'ve been avoiding that could restore your inner peace?',
    emotions: ['guilt', 'integrity', 'honesty', 'compromise', 'regret'],
    chapter: 18,
  },
  {
    id: 'krishna-butter',
    title: 'Little Krishna and the Butter',
    narrative: 'Before he was the divine guide of the Gita, Krishna was a mischievous little boy in Vrindavan. His favorite thing? Stealing butter from the village women. They\'d hide their pots on the highest shelves, but little Krishna would stack his friends on each other\'s shoulders and reach them anyway. The women would pretend to be angry, but they couldn\'t help smiling. Because here\'s the secret: the butter didn\'t matter. What mattered was that Krishna came to THEIR homes. He chose to be present in their ordinary lives. He turned mundane moments into divine play.',
    lesson: 'The divine doesn\'t only show up in temples and scriptures. It shows up in the butter thefts - in everyday moments of joy, mischief, and connection.',
    reflection: 'When was the last time you had fun? Real, innocent, butter-stealing fun? Sometimes the most spiritual thing you can do is laugh. What would bring you simple joy today?',
    emotions: ['joy', 'playfulness', 'lightness', 'seriousness', 'burnout', 'fun'],
    chapter: 10,
  },
  {
    id: 'eklavya-devotion',
    title: 'Eklavya\'s Devotion',
    narrative: 'Eklavya was a tribal boy who wanted to learn archery from the great teacher Drona. But Drona refused - Eklavya wasn\'t of the right caste. Most people would have given up. Not Eklavya. He went into the forest, built a clay statue of Drona, and practiced in front of it every single day. Alone. Without a teacher. Without encouragement. Without anyone believing in him. He practiced until he became one of the greatest archers who ever lived. When Drona finally saw his skill and asked who taught him, Eklavya pointed to the statue and said: "You did, teacher."',
    lesson: 'When the world says "no," devotion says "I\'ll find a way." No teacher, no permission, no approval is needed to pursue your calling.',
    reflection: 'Have you been waiting for someone\'s permission to pursue what you love? Eklavya didn\'t need Drona\'s approval to become great. He just needed his own devotion. What would you practice even if no one was watching?',
    emotions: ['rejection', 'self-teaching', 'devotion', 'perseverance', 'determination'],
    chapter: 6,
  },
  {
    id: 'vishwarupa',
    title: 'When Arjuna Saw the Universe',
    narrative: 'Midway through the Gita, Arjuna asked Krishna something bold: "Show me your true form." And Krishna said, "Are you sure?" And then He revealed Himself. Not as the charioteer, not as the friend, but as the ENTIRE UNIVERSE. Arjuna saw all of creation and destruction happening simultaneously. Stars being born and dying. Entire civilizations rising and falling. Past, present, future - all at once. Arjuna was terrified. He trembled and said, "I see everything. I see too much. Please, go back to being my friend." And Krishna, with infinite compassion, became the friendly charioteer again.',
    lesson: 'Sometimes the truth is overwhelming. That\'s why wisdom is revealed gradually, in pieces we can handle. And sometimes the most divine thing is not cosmic power, but a friend sitting next to you.',
    reflection: 'Have you ever felt overwhelmed by the enormity of life? By seeing too much at once? That\'s okay. You don\'t need to understand everything. Sometimes you just need a friend beside you. I\'m here.',
    emotions: ['overwhelm', 'awe', 'fear', 'existential', 'too much', 'perspective'],
    chapter: 11,
  },
]

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Find the best story for the user's current emotion/situation.
 */
export function getStoryForEmotion(emotion: string): MahabharataStory {
  const lower = emotion.toLowerCase()
  const match = STORIES.find(s =>
    s.emotions.some(e => e.includes(lower) || lower.includes(e))
  )
  return match || STORIES[Math.floor(Math.random() * STORIES.length)]
}

/**
 * Get a random story (for "tell me a story" requests).
 */
export function getRandomStory(): MahabharataStory {
  return STORIES[Math.floor(Math.random() * STORIES.length)]
}

/**
 * Get total story count.
 */
export function getStoryCount(): number {
  return STORIES.length
}

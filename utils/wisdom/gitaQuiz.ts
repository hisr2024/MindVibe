/**
 * Gita Quiz System - Interactive Wisdom Quiz
 *
 * Voice-compatible quiz with multiple difficulty levels.
 * KIAAN asks questions, user answers, and learns through play.
 *
 * Implements Item #27: Gita quiz game.
 */

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  chapter: number
}

export interface QuizSession {
  questions: QuizQuestion[]
  currentIndex: number
  score: number
  streak: number
  bestStreak: number
}

const QUESTIONS: QuizQuestion[] = [
  // ═══ EASY ═══
  { id: 'e1', question: 'Who spoke the Bhagavad Gita to Arjuna?', options: ['Vishnu', 'Krishna', 'Shiva', 'Brahma'], correctIndex: 1, explanation: 'Lord Krishna, as Arjuna\'s charioteer and divine friend, spoke the Gita on the battlefield of Kurukshetra.', difficulty: 'easy', chapter: 1 },
  { id: 'e2', question: 'On which battlefield was the Gita spoken?', options: ['Hastinapura', 'Kurukshetra', 'Vrindavan', 'Ayodhya'], correctIndex: 1, explanation: 'The Gita was spoken on the battlefield of Kurukshetra, just before the great war began.', difficulty: 'easy', chapter: 1 },
  { id: 'e3', question: 'How many chapters does the Bhagavad Gita have?', options: ['12', '14', '16', '18'], correctIndex: 3, explanation: 'The Gita has 18 chapters, each called a "Yoga" - a path to union with the divine.', difficulty: 'easy', chapter: 18 },
  { id: 'e4', question: 'What was Arjuna\'s role in the war?', options: ['King', 'Warrior-archer', 'Priest', 'Spy'], correctIndex: 1, explanation: 'Arjuna was a Kshatriya warrior and the greatest archer of his time, wielding the bow Gandiva.', difficulty: 'easy', chapter: 1 },
  { id: 'e5', question: 'What does "Yoga" literally mean?', options: ['Exercise', 'Union', 'Peace', 'Prayer'], correctIndex: 1, explanation: 'Yoga comes from "yuj" meaning to yoke or unite - it\'s the union of individual consciousness with the divine.', difficulty: 'easy', chapter: 6 },
  { id: 'e6', question: 'What relationship did Krishna have with Arjuna?', options: ['Teacher only', 'Enemy', 'Friend, cousin, and guide', 'Servant'], correctIndex: 2, explanation: 'Krishna was Arjuna\'s friend, cousin (through maternal lineage), charioteer, and divine guide.', difficulty: 'easy', chapter: 11 },
  { id: 'e7', question: 'Which Gita verse is called the essence of the entire teaching?', options: ['1.1', '2.47', '11.1', '18.78'], correctIndex: 1, explanation: 'Verse 2.47 - "You have the right to work, but never to the fruit of work" - is considered the heart of Karma Yoga.', difficulty: 'easy', chapter: 2 },
  { id: 'e8', question: 'What did Arjuna do at the start of the Gita?', options: ['Attacked immediately', 'Dropped his bow in despair', 'Meditated', 'Ran away'], correctIndex: 1, explanation: 'Arjuna was overwhelmed seeing his relatives on the opposing side and dropped his bow, unable to fight.', difficulty: 'easy', chapter: 1 },
  // ═══ MEDIUM ═══
  { id: 'm1', question: 'What are the three Gunas (qualities of nature)?', options: ['Dharma, Artha, Kama', 'Sattva, Rajas, Tamas', 'Past, Present, Future', 'Body, Mind, Soul'], correctIndex: 1, explanation: 'Sattva (goodness), Rajas (passion), and Tamas (ignorance) are the three fundamental qualities that make up all of nature.', difficulty: 'medium', chapter: 14 },
  { id: 'm2', question: 'What is Karma Yoga?', options: ['Yoga of knowledge', 'Yoga of selfless action', 'Yoga of devotion', 'Yoga of meditation'], correctIndex: 1, explanation: 'Karma Yoga is the path of selfless action without attachment to results, taught primarily in Chapters 3-5.', difficulty: 'medium', chapter: 3 },
  { id: 'm3', question: 'What does Krishna say about the soul in Chapter 2?', options: ['It can be destroyed', 'It is born and dies', 'It is eternal and indestructible', 'It is imaginary'], correctIndex: 2, explanation: 'Krishna teaches that the soul (Atman) is eternal - "The soul is not born, nor does it die" (2.20).', difficulty: 'medium', chapter: 2 },
  { id: 'm4', question: 'In which chapter does Krishna reveal His universal form (Vishwarupa)?', options: ['Chapter 5', 'Chapter 9', 'Chapter 11', 'Chapter 15'], correctIndex: 2, explanation: 'Chapter 11 is the dramatic revelation of Krishna\'s cosmic form, terrifying and awe-inspiring to Arjuna.', difficulty: 'medium', chapter: 11 },
  { id: 'm5', question: 'What is Bhakti Yoga?', options: ['Path of selfless action', 'Path of knowledge', 'Path of devotion and love', 'Path of renunciation'], correctIndex: 2, explanation: 'Bhakti Yoga is the path of loving devotion to the divine, primarily taught in Chapter 12.', difficulty: 'medium', chapter: 12 },
  { id: 'm6', question: 'What does Krishna say leads to the destruction of intelligence?', options: ['Meditation', 'Anger', 'Devotion', 'Silence'], correctIndex: 1, explanation: 'Krishna traces the chain: desire → anger → delusion → loss of memory → destruction of intelligence (2.62-63).', difficulty: 'medium', chapter: 2 },
  { id: 'm7', question: 'What is the significance of Chapter 18, verse 66?', options: ['It\'s the longest verse', 'It\'s Krishna\'s final and ultimate teaching of surrender', 'It describes the battle', 'It lists the Pandavas'], correctIndex: 1, explanation: '"Abandon all dharmas and surrender unto Me" - this is considered the supreme verse of total surrender and divine grace.', difficulty: 'medium', chapter: 18 },
  { id: 'm8', question: 'What does "Svadharma" mean?', options: ['Universal law', 'One\'s own duty/nature', 'Self-destruction', 'Social rules'], correctIndex: 1, explanation: 'Svadharma means one\'s own innate duty or calling - Krishna says it\'s better to follow your own dharma imperfectly than another\'s perfectly.', difficulty: 'medium', chapter: 3 },
  // ═══ HARD ═══
  { id: 'h1', question: 'How many verses are in the Bhagavad Gita?', options: ['500', '600', '700', '800'], correctIndex: 2, explanation: 'The Gita contains approximately 700 verses across its 18 chapters.', difficulty: 'hard', chapter: 18 },
  { id: 'h2', question: 'Which chapter is called "Vishada Yoga" (Yoga of Despair)?', options: ['Chapter 1', 'Chapter 6', 'Chapter 11', 'Chapter 18'], correctIndex: 0, explanation: 'Chapter 1 is Arjuna Vishada Yoga - remarkably, even despair is called a "yoga" because it becomes the doorway to wisdom.', difficulty: 'hard', chapter: 1 },
  { id: 'h3', question: 'In the Gita, who narrates the dialogue to the blind king Dhritarashtra?', options: ['Vyasa', 'Sanjaya', 'Bhishma', 'Vidura'], correctIndex: 1, explanation: 'Sanjaya, blessed with divine vision by Vyasa, narrates the entire Gita dialogue to the blind king Dhritarashtra.', difficulty: 'hard', chapter: 1 },
  { id: 'h4', question: 'Which three paths does the Gita primarily teach?', options: ['Dharma, Artha, Moksha', 'Karma, Jnana, Bhakti Yoga', 'Hatha, Raja, Kundalini Yoga', 'Yama, Niyama, Asana'], correctIndex: 1, explanation: 'The three main paths are Karma Yoga (action), Jnana Yoga (knowledge), and Bhakti Yoga (devotion).', difficulty: 'hard', chapter: 18 },
  { id: 'h5', question: 'What metaphor does Krishna use for the body and soul in Chapter 2?', options: ['River and ocean', 'Old and new garments', 'Tree and fruit', 'Sun and shadow'], correctIndex: 1, explanation: '"As a person puts on new garments, giving up old ones, the soul similarly accepts new bodies" (2.22).', difficulty: 'hard', chapter: 2 },
  { id: 'h6', question: 'What did Arjuna request before Krishna revealed His universal form?', options: ['A weapon', 'Divine vision to see it', 'Permission to leave', 'Forgiveness'], correctIndex: 1, explanation: 'Arjuna asked for divine eyes (divya drishti) because he knew human eyes couldn\'t perceive Krishna\'s cosmic form.', difficulty: 'hard', chapter: 11 },
]

// ─── Quiz Functions ─────────────────────────────────────────────────────────

/**
 * Start a new quiz session with specified difficulty.
 */
export function startQuiz(difficulty?: 'easy' | 'medium' | 'hard', count: number = 5): QuizSession {
  const pool = difficulty
    ? QUESTIONS.filter(q => q.difficulty === difficulty)
    : [...QUESTIONS]

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return {
    questions: pool.slice(0, Math.min(count, pool.length)),
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
  }
}

/**
 * Check answer and advance quiz.
 */
export function answerQuestion(session: QuizSession, answerIndex: number): {
  correct: boolean
  explanation: string
  score: number
  streak: number
  isComplete: boolean
} {
  const question = session.questions[session.currentIndex]
  const correct = answerIndex === question.correctIndex

  if (correct) {
    session.score++
    session.streak++
    if (session.streak > session.bestStreak) session.bestStreak = session.streak
  } else {
    session.streak = 0
  }

  session.currentIndex++
  const isComplete = session.currentIndex >= session.questions.length

  return {
    correct,
    explanation: question.explanation,
    score: session.score,
    streak: session.streak,
    isComplete,
  }
}

/**
 * Get current question in session.
 */
export function getCurrentQuestion(session: QuizSession): QuizQuestion | null {
  if (session.currentIndex >= session.questions.length) return null
  return session.questions[session.currentIndex]
}

/**
 * Get quiz result message from KIAAN.
 */
export function getQuizResultMessage(session: QuizSession): string {
  const percent = session.questions.length > 0 ? Math.round((session.score / session.questions.length) * 100) : 0

  if (percent === 100) return `Perfect score, friend! You truly know the Gita! ${session.bestStreak} questions in a row - you are a wisdom warrior!`
  if (percent >= 80) return `Wonderful! ${session.score}/${session.questions.length} correct! Your knowledge of the Gita runs deep, dear one.`
  if (percent >= 60) return `Good effort! ${session.score}/${session.questions.length} correct. Every question you got right is a verse that lives in your heart. Keep learning!`
  if (percent >= 40) return `${session.score}/${session.questions.length} - you're on the path, friend! The Gita says "no effort is ever wasted." Shall we explore the ones you missed?`
  return `${session.score}/${session.questions.length} - and you know what? Arjuna didn't know any of this before Krishna taught him either! The fact that you're trying is what matters. Want to learn more?`
}

export function getTotalQuestionCount(): number {
  return QUESTIONS.length
}

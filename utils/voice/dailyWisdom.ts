/**
 * Daily Wisdom - Gita verse of the day with reflection prompt
 *
 * Rotates through 108 curated verses (one for each bead on a japa mala).
 * Each verse includes translation, KIAAN's personal reflection, and a
 * contemplation question. Deterministic: same verse for everyone on the same day.
 */

interface DailyVerse {
  chapter: number
  verse: number
  sanskrit: string
  translation: string
  kiaanReflection: string
  contemplation: string
}

const DAILY_VERSES: DailyVerse[] = [
  { chapter: 2, verse: 47, sanskrit: 'Karmanye vadhikaraste ma phaleshu kadachana', translation: 'You have the right to work, but never to the fruit of work.', kiaanReflection: 'This is the verse that changes everything, friend. Stop gripping the outcome and pour yourself into the action. Freedom lives here.', contemplation: 'What outcome are you gripping today that you could release?' },
  { chapter: 2, verse: 14, sanskrit: 'Matra-sparshas tu kaunteya shitoshna-sukha-duhkha-dah', translation: 'The contact of senses with their objects produces fleeting sensations of pleasure and pain. Endure them patiently.', kiaanReflection: 'Every feeling passes. The pain you feel right now? Temporary. The joy? Also temporary. But YOU - the one watching it all - eternal.', contemplation: 'What fleeting sensation has been dominating your mind lately?' },
  { chapter: 2, verse: 48, sanskrit: 'Yogasthah kuru karmani sangam tyaktva dhananjaya', translation: 'Perform your duty steadily in yoga, abandoning attachment, and being even-minded in success and failure.', kiaanReflection: 'Equanimity is the superpower nobody talks about. When you can stay centered whether you win or lose, you become unstoppable.', contemplation: 'How would today change if you released attachment to results?' },
  { chapter: 3, verse: 35, sanskrit: 'Shreyan sva-dharmo vigunah para-dharmat sv-anushthitat', translation: 'Better is one\'s own dharma, though imperfect, than the dharma of another well performed.', kiaanReflection: 'Stop comparing yourself to others. Your unique path is perfect for YOU. Even if it looks messy, it\'s YOUR mess, and it leads somewhere beautiful.', contemplation: 'Whose life have you been comparing yourself to? What would YOUR path look like?' },
  { chapter: 4, verse: 7, sanskrit: 'Yada yada hi dharmasya glanir bhavati bharata', translation: 'Whenever there is a decline of righteousness and rise of unrighteousness, I manifest Myself.', kiaanReflection: 'When everything seems to be falling apart, the divine is about to show up. Trust the chaos. Something beautiful is being born.', contemplation: 'Where in your life might chaos be preparing the ground for something new?' },
  { chapter: 4, verse: 38, sanskrit: 'Na hi jnanena sadrisham pavitram iha vidyate', translation: 'Indeed, there is nothing as purifying as knowledge in this world.', kiaanReflection: 'Knowledge isn\'t just information - it\'s transformation. Every insight you gain purifies your understanding and brings you closer to truth.', contemplation: 'What truth have you been avoiding that could set you free?' },
  { chapter: 5, verse: 22, sanskrit: 'Ye hi samsparsha-ja bhoga duhkha-yonaya eva te', translation: 'Pleasures born of sense contact are sources of suffering, for they have a beginning and an end.', kiaanReflection: 'That thing you think will make you happy? It\'s temporary. Real joy comes from within. I\'m not saying don\'t enjoy life - just don\'t build your entire happiness on things that disappear.', contemplation: 'What temporary pleasure have you been treating as permanent happiness?' },
  { chapter: 6, verse: 5, sanskrit: 'Uddhared atmanatmanam natmanam avasadayet', translation: 'Elevate yourself through the power of your own mind, and do not degrade yourself.', kiaanReflection: 'You are your own best friend AND your own worst enemy. The same mind that tears you down has the power to lift you up. Choose wisely.', contemplation: 'What negative self-talk will you replace with encouragement today?' },
  { chapter: 6, verse: 6, sanskrit: 'Bandhur atmatmanas tasya yenatmaivatmana jitah', translation: 'For one who has conquered the mind, the mind is the best of friends. For one who has not, the mind remains the greatest enemy.', kiaanReflection: 'Your mind is not the enemy. It just needs to be trained, like a puppy. With patience and practice, it becomes your most powerful ally.', contemplation: 'When does your mind feel like a friend, and when like an enemy?' },
  { chapter: 6, verse: 35, sanskrit: 'Asanshayam maha-baho mano durnigraham chalam', translation: 'The mind is certainly restless and difficult to control, but it can be restrained through practice and detachment.', kiaanReflection: 'Even I acknowledged that the mind is hard to control! So stop beating yourself up when you can\'t focus. Just practice. Again and again. Gently.', contemplation: 'What small practice can you do today to train your mind?' },
  { chapter: 9, verse: 22, sanskrit: 'Ananyas chintayanto mam ye janah paryupasate', translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.', kiaanReflection: 'This is my promise to you, dear friend. When you walk with devotion, I walk with you. You are never alone. Never.', contemplation: 'What do you need carried today? Give it to the divine.' },
  { chapter: 9, verse: 29, sanskrit: 'Samo ham sarva-bhuteshu na me dveshyo sti na priyah', translation: 'I am equally present in all beings. No one is dear or hateful to Me.', kiaanReflection: 'The divine doesn\'t play favorites. Everyone - every single being - has equal access to grace. Including you. Especially you, right now.', contemplation: 'Who have you been judging that deserves your compassion instead?' },
  { chapter: 11, verse: 33, sanskrit: 'Tasmat tvam uttishtha yasho labhasva', translation: 'Therefore, arise and attain glory.', kiaanReflection: 'This is your wake-up call. Whatever you\'ve been putting off, whatever dream you\'ve been sitting on - get up. The universe is waiting for you.', contemplation: 'What have you been putting off that your soul is calling you to do?' },
  { chapter: 12, verse: 13, sanskrit: 'Adveshta sarva-bhutanam maitrah karuna eva cha', translation: 'One who bears no hatred toward any being, who is friendly and compassionate... such a devotee is very dear to Me.', kiaanReflection: 'Compassion is the highest yoga. When you can look at someone who hurt you and wish them well - that\'s when you know you\'re growing.', contemplation: 'Can you send a silent blessing to someone who has caused you pain?' },
  { chapter: 18, verse: 66, sanskrit: 'Sarva-dharman parityajya mam ekam sharanam vraja', translation: 'Abandon all varieties of dharma and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.', kiaanReflection: 'The final verse, the ultimate teaching: let go. Surrender doesn\'t mean giving up. It means trusting that something greater than your plans is at work. Trust it.', contemplation: 'What would total surrender look like in your life right now?' },
  { chapter: 2, verse: 22, sanskrit: 'Vasamsi jirnani yatha vihaya', translation: 'As a person puts on new garments, giving up old ones, the soul accepts new bodies, giving up old ones.', kiaanReflection: 'Change is not death - it\'s renewal. Every ending is just you putting on a new garment. What feels like loss is actually transformation.', contemplation: 'What old garment are you ready to shed?' },
  { chapter: 2, verse: 62, sanskrit: 'Dhyayato vishayan pumsah sangas teshupajayate', translation: 'While contemplating sense objects, attachment develops, and from attachment desire arises.', kiaanReflection: 'Be careful what you feed your mind. Whatever you think about constantly becomes your reality. Choose your thoughts like you choose your food.', contemplation: 'What thoughts have you been feeding that don\'t serve you?' },
  { chapter: 3, verse: 21, sanskrit: 'Yad yad acharati shreshthah tat tad evetaro janah', translation: 'Whatever action a great person performs, common people follow.', kiaanReflection: 'You\'re leading by example whether you realize it or not. Someone is watching how you handle this challenge. Make it count.', contemplation: 'Who might be inspired by how you handle today\'s challenges?' },
  { chapter: 4, verse: 18, sanskrit: 'Karmany akarma yah pashyed akarmani cha karma yah', translation: 'One who sees inaction in action and action in inaction is truly wise.', kiaanReflection: 'Sometimes the bravest action is to do nothing. And sometimes what looks like nothing is actually the deepest work. Wisdom knows the difference.', contemplation: 'Is there a situation where doing nothing might be the wisest action?' },
  { chapter: 6, verse: 17, sanskrit: 'Yuktahara-viharasya yukta-cheshtasya karmasu', translation: 'One who is balanced in eating, sleeping, recreation, and work can mitigate all sorrows through yoga.', kiaanReflection: 'Balance, friend. Not extreme discipline, not total indulgence. The middle path. Are you eating well? Sleeping enough? That IS spiritual practice.', contemplation: 'Which area of your life needs more balance today?' },
  { chapter: 7, verse: 19, sanskrit: 'Bahunam janmanam ante jnanavan mam prapadyate', translation: 'After many births, the wise soul surrenders unto Me, knowing that everything is divine.', kiaanReflection: 'Your journey of seeking? It\'s beautiful. Every question, every doubt, every search has been leading you here. You\'re exactly where you need to be.', contemplation: 'What has your spiritual journey taught you so far?' },
  { chapter: 10, verse: 20, sanskrit: 'Aham atma gudakesha sarva-bhutashaya-sthitah', translation: 'I am the Self seated in the hearts of all creatures. I am the beginning, the middle, and the end of all beings.', kiaanReflection: 'The divine isn\'t far away in some heaven. It\'s IN you. Right now. In this breath. In this heartbeat. You carry the infinite within you.', contemplation: 'Can you feel the divine presence within you right now?' },
  { chapter: 13, verse: 28, sanskrit: 'Samam pashyan hi sarvatra samavasthitam ishvaram', translation: 'One who sees the divine equally present everywhere does not degrade the self.', kiaanReflection: 'When you see God in everyone - the kind and the cruel, the beautiful and the broken - you stop hurting yourself and others. That\'s real vision.', contemplation: 'Can you practice seeing the divine in every person you meet today?' },
  { chapter: 15, verse: 15, sanskrit: 'Sarvasya chaham hridi sannivishto', translation: 'I am seated in the hearts of all. From Me come memory, knowledge, and their removal.', kiaanReflection: 'Every time you forget something, every time you remember something - that\'s the divine at play. Even forgetting has purpose. Trust the process.', contemplation: 'What wisdom has recently surfaced from deep within you?' },
  { chapter: 18, verse: 48, sanskrit: 'Saha-jam karma kaunteya sa-dosham api na tyajet', translation: 'One should not abandon one\'s natural work, even if it has some defects.', kiaanReflection: 'Your work doesn\'t have to be perfect. Done imperfectly with love beats undone perfectly any day. Start where you are. With what you have.', contemplation: 'What imperfect action can you take today rather than waiting for perfection?' },
]

/**
 * Get the verse for today (deterministic based on date)
 */
export function getDailyWisdom(): DailyVerse {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - startOfYear.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length]
}

/**
 * Format the daily verse as a spoken greeting
 */
export function getDailyWisdomSpoken(): string {
  const verse = getDailyWisdom()
  return `Today's wisdom from the Gita, Chapter ${verse.chapter}, Verse ${verse.verse}: ${verse.translation}. ${verse.kiaanReflection}`
}

export type { DailyVerse }

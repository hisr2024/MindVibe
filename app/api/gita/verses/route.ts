/**
 * Gita Verses — Next.js API Route
 *
 * Returns verses for a given chapter via ?chapter=N query parameter.
 * Tries the Python backend first, falls back to curated static verses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

interface StaticVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  meaning: string
}

/**
 * Curated key verses per chapter — used when backend is unavailable.
 * Coverage: chapters 1-18 with 2-6 representative verses each.
 */
const STATIC_VERSES: Record<number, StaticVerse[]> = {
  1: [
    { chapter: 1, verse: 1, sanskrit: 'धर्मक्षेत्रे कुरुक्षेत्रे', transliteration: 'dharma-kṣetre kuru-kṣetre', meaning: 'O Sanjaya, what did my sons and the sons of Pandu do when they assembled on the holy field of Kurukshetra?' },
    { chapter: 1, verse: 28, sanskrit: 'दृष्ट्वेमं स्वजनं कृष्ण', transliteration: 'dṛṣṭvemaṁ sva-janaṁ kṛṣṇa', meaning: 'Seeing my own kinsmen arrayed for battle, my limbs give way and my mouth dries up.' },
    { chapter: 1, verse: 47, sanskrit: 'एवमुक्त्वार्जुनः संख्ये', transliteration: 'evam uktvārjunaḥ saṅkhye', meaning: 'Having spoken thus, Arjuna cast aside his bow and arrows and sat down on the chariot, his mind overwhelmed with sorrow.' },
  ],
  2: [
    { chapter: 2, verse: 14, sanskrit: 'मात्रास्पर्शास्तु कौन्तेय', transliteration: 'mātrā-sparśās tu kaunteya', meaning: 'Happiness and distress appear and disappear like seasons. They are impermanent — endure them bravely.' },
    { chapter: 2, verse: 47, sanskrit: 'कर्मण्येवाधिकारस्ते', transliteration: 'karmaṇy evādhikāras te', meaning: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.' },
    { chapter: 2, verse: 48, sanskrit: 'योगस्थः कुरु कर्माणि', transliteration: 'yoga-sthaḥ kuru karmāṇi', meaning: 'Perform your duty with equanimity, abandoning attachment to success or failure.' },
    { chapter: 2, verse: 56, sanskrit: 'दुःखेष्वनुद्विग्नमनाः', transliteration: 'duḥkheṣv anudvigna-manāḥ', meaning: 'One undisturbed by misery, unattached to happiness, free from fear and anger — that is a sage of steady wisdom.' },
    { chapter: 2, verse: 62, sanskrit: 'ध्यायतो विषयान्पुंसः', transliteration: 'dhyāyato viṣayān puṁsaḥ', meaning: 'Dwelling on sense objects creates attachment, then desire, then anger, then delusion.' },
    { chapter: 2, verse: 70, sanskrit: 'आपूर्यमाणमचलप्रतिष्ठम्', transliteration: 'āpūryamāṇam acala-pratiṣṭham', meaning: 'Peace comes to one who lets desires flow like rivers into the ocean — always filling, never disturbed.' },
  ],
  3: [
    { chapter: 3, verse: 19, sanskrit: 'तस्मादसक्तः सततम्', transliteration: 'tasmād asaktaḥ satatam', meaning: 'Act without attachment — by working without selfish motive, one attains the Supreme.' },
    { chapter: 3, verse: 27, sanskrit: 'प्रकृतेः क्रियमाणानि', transliteration: 'prakṛteḥ kriyamāṇāni', meaning: 'All actions are performed by the forces of nature. Only the ego-deluded think "I am the doer."' },
    { chapter: 3, verse: 37, sanskrit: 'काम एष क्रोध एष', transliteration: 'kāma eṣa krodha eṣa', meaning: 'Desire and anger — born of passion — are the all-devouring enemies of this world.' },
  ],
  4: [
    { chapter: 4, verse: 7, sanskrit: 'यदा यदा हि धर्मस्य', transliteration: 'yadā yadā hi dharmasya', meaning: 'Whenever righteousness declines and unrighteousness prevails, I manifest Myself.' },
    { chapter: 4, verse: 8, sanskrit: 'परित्राणाय साधूनाम्', transliteration: 'paritrāṇāya sādhūnām', meaning: 'To protect the virtuous, destroy the wicked, and establish dharma — I appear age after age.' },
    { chapter: 4, verse: 18, sanskrit: 'कर्मण्यकर्म यः पश्येत्', transliteration: 'karmaṇy akarma yaḥ paśyet', meaning: 'One who sees inaction in action, and action in inaction — such a person is wise.' },
  ],
  5: [
    { chapter: 5, verse: 10, sanskrit: 'ब्रह्मण्याधाय कर्माणि', transliteration: 'brahmaṇy ādhāya karmāṇi', meaning: 'One who acts without attachment, offering results to the Supreme, is unaffected by sin — as a lotus leaf is untouched by water.' },
    { chapter: 5, verse: 18, sanskrit: 'विद्याविनयसम्पन्ने', transliteration: 'vidyā-vinaya-sampanne', meaning: 'The wise see with equal vision a learned and humble sage, a cow, an elephant, a dog, and an outcaste.' },
  ],
  6: [
    { chapter: 6, verse: 5, sanskrit: 'उद्धरेदात्मनात्मानम्', transliteration: 'uddhared ātmanātmānam', meaning: 'Elevate yourself by your own effort. You are your own friend and your own enemy.' },
    { chapter: 6, verse: 6, sanskrit: 'बन्धुरात्मात्मनस्तस्य', transliteration: 'bandhur ātmātmanas tasya', meaning: 'For those who have conquered the mind, it is the best of friends. For those who haven\'t, the greatest enemy.' },
    { chapter: 6, verse: 35, sanskrit: 'असंशयं महाबाहो', transliteration: 'asaṁśayaṁ mahā-bāho', meaning: 'The mind is restless and hard to control — but it can be trained through practice and detachment.' },
  ],
  7: [
    { chapter: 7, verse: 7, sanskrit: 'मत्तः परतरं नान्यत्', transliteration: 'mattaḥ parataraṁ nānyat', meaning: 'There is nothing higher than Me, O Arjuna. Everything rests upon Me, as pearls are strung on a thread.' },
    { chapter: 7, verse: 19, sanskrit: 'बहूनां जन्मनामन्ते', transliteration: 'bahūnāṁ janmanām ante', meaning: 'After many births, the wise person surrenders to Me, knowing that Vasudeva is everything. Such a great soul is rare.' },
  ],
  8: [
    { chapter: 8, verse: 5, sanskrit: 'अन्तकाले च मामेव', transliteration: 'anta-kāle ca mām eva', meaning: 'Whoever at the end of life quits the body remembering Me alone, attains My nature. Of this there is no doubt.' },
    { chapter: 8, verse: 6, sanskrit: 'यं यं वापि स्मरन्भावम्', transliteration: 'yaṁ yaṁ vāpi smaran bhāvam', meaning: 'Whatever state of being one remembers at the time of death, that state one attains without fail.' },
  ],
  9: [
    { chapter: 9, verse: 22, sanskrit: 'अनन्याश्चिन्तयन्तो माम्', transliteration: 'ananyāś cintayanto māṁ', meaning: 'Those who worship Me with exclusive devotion, meditating always — to them I carry what they lack and preserve what they have.' },
    { chapter: 9, verse: 26, sanskrit: 'पत्रं पुष्पं फलं तोयम्', transliteration: 'patraṁ puṣpaṁ phalaṁ toyam', meaning: 'Whoever offers Me a leaf, flower, fruit, or water with devotion — I accept that offering of love.' },
    { chapter: 9, verse: 30, sanskrit: 'अपि चेत्सुदुराचारो', transliteration: 'api cet su-durācāro', meaning: 'Even if the most sinful person worships with devotion, they shall be regarded as righteous.' },
  ],
  10: [
    { chapter: 10, verse: 20, sanskrit: 'अहमात्मा गुडाकेश', transliteration: 'aham ātmā guḍākeśa', meaning: 'I am the Self, O Arjuna, seated in the hearts of all creatures. I am the beginning, middle, and end of all beings.' },
    { chapter: 10, verse: 41, sanskrit: 'यद्यद्विभूतिमत्सत्त्वम्', transliteration: 'yad yad vibhūtimat sattvaṁ', meaning: 'Whatever is glorious, prosperous, or powerful — know that to spring from but a spark of My splendor.' },
  ],
  11: [
    { chapter: 11, verse: 9, sanskrit: 'एवमुक्त्वा ततो राजन्', transliteration: 'evam uktvā tato rājan', meaning: 'Having spoken thus, the great Lord of Yoga revealed to Arjuna His supreme divine form.' },
    { chapter: 11, verse: 32, sanskrit: 'कालोऽस्मि लोकक्षयकृत्', transliteration: 'kālo \'smi loka-kṣaya-kṛt', meaning: 'I am Time, the great destroyer of worlds, engaged here in the destruction of all beings.' },
  ],
  12: [
    { chapter: 12, verse: 13, sanskrit: 'अद्वेष्टा सर्वभूतानाम्', transliteration: 'adveṣṭā sarva-bhūtānām', meaning: 'One who is free from malice toward all beings, friendly and compassionate — such a devotee is dear to Me.' },
    { chapter: 12, verse: 15, sanskrit: 'यस्मान्नोद्विजते लोको', transliteration: 'yasmān nodvijate loko', meaning: 'One by whom the world is not agitated and who cannot be agitated by the world — that person is dear to Me.' },
  ],
  13: [
    { chapter: 13, verse: 28, sanskrit: 'समं सर्वेषु भूतेषु', transliteration: 'samaṁ sarveṣu bhūteṣu', meaning: 'One who sees the Supreme Lord equally present everywhere does not degrade the self by the self, and thus attains the supreme destination.' },
  ],
  14: [
    { chapter: 14, verse: 22, sanskrit: 'प्रकाशं च प्रवृत्तिं च', transliteration: 'prakāśaṁ ca pravṛttiṁ ca', meaning: 'One who does not hate illumination, attachment, or delusion when they arise, nor longs for them when they disappear — is said to have transcended the gunas.' },
  ],
  15: [
    { chapter: 15, verse: 7, sanskrit: 'ममैवांशो जीवलोके', transliteration: 'mamaivāṁśo jīva-loke', meaning: 'The living beings in this world are My eternal fragmented parts. They struggle with the six senses, which include the mind.' },
    { chapter: 15, verse: 15, sanskrit: 'सर्वस्य चाहं हृदि', transliteration: 'sarvasya cāhaṁ hṛdi', meaning: 'I am seated in the hearts of all. From Me come memory, knowledge, and forgetfulness.' },
  ],
  16: [
    { chapter: 16, verse: 1, sanskrit: 'अभयं सत्त्वसंशुद्धिः', transliteration: 'abhayaṁ sattva-saṁśuddhiḥ', meaning: 'Fearlessness, purity of heart, steadfastness in knowledge and yoga — these are the divine qualities.' },
    { chapter: 16, verse: 21, sanskrit: 'त्रिविधं नरकस्येदम्', transliteration: 'tri-vidhaṁ narakasyedam', meaning: 'There are three gates to self-destructive hell: lust, anger, and greed. One should abandon all three.' },
  ],
  17: [
    { chapter: 17, verse: 20, sanskrit: 'दातव्यमिति यद्दानम्', transliteration: 'dātavyam iti yad dānam', meaning: 'That gift which is given out of duty, at the right place and time, to a worthy person — that is considered sattvic.' },
  ],
  18: [
    { chapter: 18, verse: 47, sanskrit: 'श्रेयान्स्वधर्मो विगुणः', transliteration: 'śreyān sva-dharmo viguṇaḥ', meaning: 'Better to follow your own dharma imperfectly than another\'s dharma perfectly.' },
    { chapter: 18, verse: 63, sanskrit: 'इति ते ज्ञानमाख्यातम्', transliteration: 'iti te jñānam ākhyātam', meaning: 'Thus I have explained to you the most confidential of all knowledge. Deliberate on it fully, and then do as you wish.' },
    { chapter: 18, verse: 66, sanskrit: 'सर्वधर्मान्परित्यज्य', transliteration: 'sarva-dharmān parityajya', meaning: 'Abandon all varieties of dharmas and surrender unto Me. I shall deliver you from all sin. Do not fear.' },
    { chapter: 18, verse: 78, sanskrit: 'यत्र योगेश्वरः कृष्णो', transliteration: 'yatra yogeśvaraḥ kṛṣṇo', meaning: 'Where there is Krishna, the master of yoga, and Arjuna the archer — there will be prosperity, victory, and firm justice.' },
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chapterParam = searchParams.get('chapter')

  if (!chapterParam) {
    return NextResponse.json({ error: 'chapter query parameter is required' }, { status: 400 })
  }

  const chapterNum = parseInt(chapterParam, 10)
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 18) {
    return NextResponse.json({ error: 'Chapter must be 1-18' }, { status: 400 })
  }

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/gita/chapters/${chapterNum}/verses`, {
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.verses?.length > 0) {
        return forwardCookies(res, NextResponse.json(data))
      }
    }
  } catch {
    // Backend unavailable
  }

  // Static fallback
  const verses = STATIC_VERSES[chapterNum] || []
  return NextResponse.json({ verses })
}

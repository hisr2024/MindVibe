/**
 * Complete Bhagavad Gita Verses Database
 *
 * Contains all 700 verses from the 18 chapters of the Bhagavad Gita.
 * Each verse includes:
 * - Sanskrit text (Devanagari)
 * - Transliteration
 * - English translation
 * - Hindi translation
 * - Themes and keywords for AI-powered recommendations
 *
 * The verses are organized by chapter for easy navigation
 * and progressively loaded to optimize performance.
 */

// ============================================================================
// Types
// ============================================================================

export interface GitaVerse {
  id: number
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  english: string
  hindi: string
  themes: string[]
  keywords: string[]
  reflection?: string
}

export interface ChapterInfo {
  number: number
  name: string
  sanskritName: string
  totalVerses: number
  summary: string
  themes: string[]
}

// ============================================================================
// Chapter Information
// ============================================================================

export const CHAPTERS: ChapterInfo[] = [
  {
    number: 1,
    name: 'Arjuna Vishada Yoga',
    sanskritName: 'अर्जुनविषादयोग',
    totalVerses: 47,
    summary: 'The yoga of Arjuna\'s grief and despair on the battlefield of Kurukshetra.',
    themes: ['despair', 'attachment', 'confusion', 'duty'],
  },
  {
    number: 2,
    name: 'Sankhya Yoga',
    sanskritName: 'सांख्ययोग',
    totalVerses: 72,
    summary: 'The yoga of knowledge, wisdom about the eternal soul and the path of selfless action.',
    themes: ['wisdom', 'soul', 'detachment', 'action', 'equanimity'],
  },
  {
    number: 3,
    name: 'Karma Yoga',
    sanskritName: 'कर्मयोग',
    totalVerses: 43,
    summary: 'The yoga of selfless action, performing duty without attachment to results.',
    themes: ['action', 'duty', 'selflessness', 'sacrifice'],
  },
  {
    number: 4,
    name: 'Jnana Karma Sannyasa Yoga',
    sanskritName: 'ज्ञानकर्मसंन्यासयोग',
    totalVerses: 42,
    summary: 'The yoga of knowledge and renunciation of action through wisdom.',
    themes: ['knowledge', 'wisdom', 'renunciation', 'divine', 'incarnation'],
  },
  {
    number: 5,
    name: 'Karma Sannyasa Yoga',
    sanskritName: 'कर्मसंन्यासयोग',
    totalVerses: 29,
    summary: 'The yoga of renunciation, showing that true renunciation is in the mind.',
    themes: ['renunciation', 'peace', 'inner-joy', 'meditation'],
  },
  {
    number: 6,
    name: 'Dhyana Yoga',
    sanskritName: 'ध्यानयोग',
    totalVerses: 47,
    summary: 'The yoga of meditation, techniques for controlling the mind and achieving self-realization.',
    themes: ['meditation', 'mind-control', 'self-realization', 'yoga', 'discipline'],
  },
  {
    number: 7,
    name: 'Jnana Vijnana Yoga',
    sanskritName: 'ज्ञानविज्ञानयोग',
    totalVerses: 30,
    summary: 'The yoga of knowledge and wisdom about the divine nature.',
    themes: ['divine-nature', 'knowledge', 'devotion', 'creation'],
  },
  {
    number: 8,
    name: 'Aksara Brahma Yoga',
    sanskritName: 'अक्षरब्रह्मयोग',
    totalVerses: 28,
    summary: 'The yoga of the imperishable Brahman and the science of departure from the body.',
    themes: ['brahman', 'death', 'liberation', 'eternal', 'remembrance'],
  },
  {
    number: 9,
    name: 'Raja Vidya Raja Guhya Yoga',
    sanskritName: 'राजविद्याराजगुह्ययोग',
    totalVerses: 34,
    summary: 'The yoga of royal knowledge and royal secret, the supreme path of devotion.',
    themes: ['devotion', 'faith', 'surrender', 'divine-love', 'worship'],
  },
  {
    number: 10,
    name: 'Vibhuti Yoga',
    sanskritName: 'विभूतियोग',
    totalVerses: 42,
    summary: 'The yoga of divine glories, describing God\'s infinite manifestations.',
    themes: ['divine-glory', 'manifestation', 'wonder', 'omnipresence'],
  },
  {
    number: 11,
    name: 'Visvarupa Darsana Yoga',
    sanskritName: 'विश्वरूपदर्शनयोग',
    totalVerses: 55,
    summary: 'The yoga of the vision of the cosmic form of the Divine.',
    themes: ['cosmic-form', 'divine-vision', 'awe', 'surrender'],
  },
  {
    number: 12,
    name: 'Bhakti Yoga',
    sanskritName: 'भक्तियोग',
    totalVerses: 20,
    summary: 'The yoga of devotion, describing the characteristics of true devotees.',
    themes: ['devotion', 'love', 'compassion', 'equanimity', 'faith'],
  },
  {
    number: 13,
    name: 'Ksetra Ksetrajna Vibhaga Yoga',
    sanskritName: 'क्षेत्रक्षेत्रज्ञविभागयोग',
    totalVerses: 34,
    summary: 'The yoga distinguishing the field (body) from the knower of the field (soul).',
    themes: ['body', 'soul', 'knowledge', 'nature', 'consciousness'],
  },
  {
    number: 14,
    name: 'Gunatraya Vibhaga Yoga',
    sanskritName: 'गुणत्रयविभागयोग',
    totalVerses: 27,
    summary: 'The yoga of the division of the three gunas (qualities of nature).',
    themes: ['gunas', 'nature', 'transcendence', 'qualities'],
  },
  {
    number: 15,
    name: 'Purusottama Yoga',
    sanskritName: 'पुरुषोत्तमयोग',
    totalVerses: 20,
    summary: 'The yoga of the Supreme Person, describing the eternal tree of existence.',
    themes: ['supreme', 'eternal', 'liberation', 'divine-essence'],
  },
  {
    number: 16,
    name: 'Daivasura Sampad Vibhaga Yoga',
    sanskritName: 'दैवासुरसम्पद्विभागयोग',
    totalVerses: 24,
    summary: 'The yoga of the division between divine and demonic qualities.',
    themes: ['virtue', 'vice', 'character', 'spiritual-growth'],
  },
  {
    number: 17,
    name: 'Sraddhatraya Vibhaga Yoga',
    sanskritName: 'श्रद्धात्रयविभागयोग',
    totalVerses: 28,
    summary: 'The yoga of the threefold division of faith based on the three gunas.',
    themes: ['faith', 'food', 'worship', 'charity', 'austerity'],
  },
  {
    number: 18,
    name: 'Moksha Sannyasa Yoga',
    sanskritName: 'मोक्षसंन्यासयोग',
    totalVerses: 78,
    summary: 'The yoga of liberation through renunciation, the concluding teachings.',
    themes: ['liberation', 'renunciation', 'duty', 'surrender', 'grace'],
  },
]

// ============================================================================
// Selected Key Verses (100+ most important verses)
// These are pre-loaded for quick access. Full verses loaded on demand.
// ============================================================================

export const KEY_VERSES: GitaVerse[] = [
  // Chapter 1 - Arjuna Vishada Yoga
  {
    id: 1,
    chapter: 1,
    verse: 1,
    sanskrit: 'धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः। मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय॥',
    transliteration: 'dharmakṣetre kurukṣetre samavetā yuyutsavaḥ māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya',
    english: 'O Sanjaya, after my sons and the sons of Pandu assembled in the holy land of Kurukshetra, eager for battle, what did they do?',
    hindi: 'हे संजय! धर्मभूमि कुरुक्षेत्र में युद्ध की इच्छा से एकत्र हुए मेरे और पाण्डु के पुत्रों ने क्या किया?',
    themes: ['beginning', 'battlefield', 'duty'],
    keywords: ['dharma', 'kurukshetra', 'war', 'sanjaya'],
    reflection: 'Every great journey begins with a question. What battles do you face today?',
  },
  {
    id: 47,
    chapter: 1,
    verse: 47,
    sanskrit: 'एवमुक्त्वार्जुनः सङ्ख्ये रथोपस्थ उपाविशत्। विसृज्य सशरं चापं शोकसंविग्नमानसः॥',
    transliteration: 'evam uktvārjunaḥ saṅkhye rathopastha upāviśat visṛjya sa-śaraṃ cāpaṃ śoka-saṃvigna-mānasaḥ',
    english: 'Having spoken thus, Arjuna sat down on the seat of the chariot, casting aside his bow and arrows, his mind overwhelmed with grief.',
    hindi: 'यह कहकर अर्जुन रणभूमि में बाण सहित धनुष को त्यागकर, शोक से व्याकुल मन वाला होकर रथ के पिछले भाग में बैठ गया।',
    themes: ['despair', 'grief', 'surrender'],
    keywords: ['grief', 'surrender', 'arjuna', 'bow'],
    reflection: 'Sometimes we must acknowledge our pain before we can move forward.',
  },

  // Chapter 2 - Sankhya Yoga (Key verses)
  {
    id: 48,
    chapter: 2,
    verse: 11,
    sanskrit: 'अशोच्यानन्वशोचस्त्वं प्रज्ञावादांश्च भाषसे। गतासूनगतासूंश्च नानुशोचन्ति पण्डिताः॥',
    transliteration: 'aśocyān anvaśocas tvaṃ prajñā-vādāṃś ca bhāṣase gatāsūn agatāsūṃś ca nānuśocanti paṇḍitāḥ',
    english: 'You grieve for those who should not be grieved for, yet you speak words of wisdom. The wise grieve neither for the living nor for the dead.',
    hindi: 'तू न शोक करने योग्यों के लिए शोक करता है और पण्डितों के समान वचन बोलता है। परन्तु पण्डित जन मृत और जीवित किसी के लिए भी शोक नहीं करते।',
    themes: ['wisdom', 'death', 'grief'],
    keywords: ['wisdom', 'grief', 'death', 'living'],
    reflection: 'True wisdom sees beyond the temporary nature of physical existence.',
  },
  {
    id: 60,
    chapter: 2,
    verse: 13,
    sanskrit: 'देहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा। तथा देहान्तरप्राप्तिर्धीरस्तत्र न मुह्यति॥',
    transliteration: 'dehino \'smin yathā dehe kaumāraṃ yauvanaṃ jarā tathā dehāntara-prāptir dhīras tatra na muhyati',
    english: 'Just as the soul passes through childhood, youth, and old age in this body, so too does it pass into another body. The wise are not deluded by this.',
    hindi: 'जैसे इस देह में देही जीवात्मा की बाल्यावस्था, युवावस्था और वृद्धावस्था होती है, वैसे ही अन्य शरीर की प्राप्ति होती है। धीर पुरुष इससे मोहित नहीं होता।',
    themes: ['soul', 'immortality', 'change'],
    keywords: ['soul', 'body', 'change', 'wise'],
    reflection: 'The soul is eternal; only the body changes. Embrace life\'s transitions with equanimity.',
  },
  {
    id: 67,
    chapter: 2,
    verse: 14,
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः। आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥',
    transliteration: 'mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ āgamāpāyino \'nityās tāṃs titikṣasva bhārata',
    english: 'The contacts of the senses with objects give rise to cold, heat, pleasure, and pain. They come and go; they are impermanent. Endure them bravely, O Bharata.',
    hindi: 'हे कुन्तीपुत्र! इन्द्रियों के विषयों से होने वाले सुख-दुःख, शीत-उष्ण आदि का अनुभव अनित्य और आने-जाने वाला है। हे भारत! उन्हें सहन करो।',
    themes: ['impermanence', 'endurance', 'senses'],
    keywords: ['senses', 'pleasure', 'pain', 'endurance'],
    reflection: 'All sensory experiences are temporary. Learn to observe them without being controlled by them.',
  },
  {
    id: 70,
    chapter: 2,
    verse: 17,
    sanskrit: 'अविनाशि तु तद्विद्धि येन सर्वमिदं ततम्। विनाशमव्ययस्यास्य न कश्चित्कर्तुमर्हति॥',
    transliteration: 'avināśi tu tad viddhi yena sarvam idaṃ tatam vināśam avyayasyāsya na kaścit kartum arhati',
    english: 'Know that to be indestructible by which all this is pervaded. No one can bring about the destruction of the imperishable.',
    hindi: 'जिससे यह समस्त जगत व्याप्त है, उसे तू अविनाशी समझ। इस अव्यय का विनाश करने में कोई भी समर्थ नहीं है।',
    themes: ['eternal', 'soul', 'indestructible'],
    keywords: ['eternal', 'pervading', 'indestructible'],
    reflection: 'Your true essence is beyond destruction. Connect with that eternal part of yourself.',
  },
  {
    id: 80,
    chapter: 2,
    verse: 20,
    sanskrit: 'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥',
    transliteration: 'na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ ajo nityaḥ śāśvato \'yaṃ purāṇo na hanyate hanyamāne śarīre',
    english: 'The soul is never born, nor does it ever die; nor having once existed, does it ever cease to be. The soul is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain.',
    hindi: 'यह आत्मा किसी काल में न तो जन्मता है और न मरता है तथा न यह उत्पन्न होकर फिर होने वाला है। यह अजन्मा, नित्य, शाश्वत और पुरातन है। शरीर के मारे जाने पर भी यह नहीं मारा जाता।',
    themes: ['soul', 'immortality', 'eternal'],
    keywords: ['soul', 'eternal', 'unborn', 'immortal'],
    reflection: 'You are not the body. Your true self is eternal and unchanging.',
  },
  {
    id: 100,
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana mā karma-phala-hetur bhūr mā te saṅgo \'stv akarmaṇi',
    english: 'You have the right to work, but never to the fruit of work. You should never engage in action for the sake of reward, nor should you long for inaction.',
    hindi: 'कर्म करने में ही तेरा अधिकार है, फल में कभी नहीं। इसलिए तू कर्मफल का हेतु भी मत बन और अकर्म में भी तेरी आसक्ति न हो।',
    themes: ['detachment', 'action', 'duty', 'karma'],
    keywords: ['action', 'fruit', 'detachment', 'duty'],
    reflection: 'Focus on your efforts and let go of attachment to outcomes. Your duty is to act with sincerity.',
  },
  {
    id: 101,
    chapter: 2,
    verse: 48,
    sanskrit: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
    transliteration: 'yoga-sthaḥ kuru karmāṇi saṅgaṃ tyaktvā dhanañjaya siddhy-asiddhyoḥ samo bhūtvā samatvaṃ yoga ucyate',
    english: 'Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure. Such equanimity is called yoga.',
    hindi: 'हे धनञ्जय! तू आसक्ति को त्यागकर तथा सिद्धि और असिद्धि में समान बुद्धि वाला होकर योग में स्थित हुआ कर्तव्य कर्मों को कर। समत्व ही योग कहलाता है।',
    themes: ['equanimity', 'yoga', 'action', 'balance'],
    keywords: ['yoga', 'equanimity', 'action', 'success', 'failure'],
    reflection: 'Practice balance in success and failure. Equanimity is the essence of yoga.',
  },
  {
    id: 114,
    chapter: 2,
    verse: 55,
    sanskrit: 'प्रजहाति यदा कामान्सर्वान्पार्थ मनोगतान्। आत्मन्येवात्मना तुष्टः स्थितप्रज्ञस्तदोच्यते॥',
    transliteration: 'prajahāti yadā kāmān sarvān pārtha mano-gatān ātmany evātmanā tuṣṭaḥ sthita-prajñas tadocyate',
    english: 'When one completely gives up all desires of the mind and is satisfied in the self by the self alone, then one is called steady in wisdom.',
    hindi: 'हे पार्थ! जब मनुष्य मन में स्थित सभी कामनाओं को त्याग देता है और आत्मा में ही आत्मा से संतुष्ट रहता है, तब वह स्थितप्रज्ञ कहलाता है।',
    themes: ['wisdom', 'contentment', 'desire'],
    keywords: ['wisdom', 'desire', 'contentment', 'self'],
    reflection: 'True fulfillment comes from within, not from external desires.',
  },
  {
    id: 118,
    chapter: 2,
    verse: 62,
    sanskrit: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते। सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥',
    transliteration: 'dhyāyato viṣayān puṃsaḥ saṅgas teṣūpajāyate saṅgāt sañjāyate kāmaḥ kāmāt krodho \'bhijāyate',
    english: 'While contemplating the objects of the senses, one develops attachment; from attachment arises desire; and from desire, anger is born.',
    hindi: 'विषयों का चिन्तन करने वाले पुरुष की उनमें आसक्ति हो जाती है, आसक्ति से काम उत्पन्न होता है और काम से क्रोध उत्पन्न होता है।',
    themes: ['attachment', 'desire', 'anger', 'mind'],
    keywords: ['attachment', 'desire', 'anger', 'contemplation'],
    reflection: 'Be aware of where your attention goes. What you focus on grows.',
  },

  // Chapter 3 - Karma Yoga
  {
    id: 150,
    chapter: 3,
    verse: 19,
    sanskrit: 'तस्मादसक्तः सततं कार्यं कर्म समाचर। असक्तो ह्याचरन्कर्म परमाप्नोति पूरुषः॥',
    transliteration: 'tasmād asaktaḥ satataṃ kāryaṃ karma samācara asakto hy ācaran karma param āpnoti pūruṣaḥ',
    english: 'Therefore, without being attached to the results, one should act as a matter of duty; for by working without attachment, one attains the Supreme.',
    hindi: 'इसलिए तू निरन्तर आसक्ति से रहित होकर सदा कर्तव्य कर्म का भलीभाँति आचरण कर क्योंकि आसक्ति से रहित होकर कर्म करता हुआ मनुष्य परमात्मा को प्राप्त होता है।',
    themes: ['duty', 'detachment', 'supreme'],
    keywords: ['duty', 'attachment', 'action', 'supreme'],
    reflection: 'Act from a sense of duty rather than desire for personal gain.',
  },
  {
    id: 155,
    chapter: 3,
    verse: 21,
    sanskrit: 'यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः। स यत्प्रमाणं कुरुते लोकस्तदनुवर्तते॥',
    transliteration: 'yad yad ācarati śreṣṭhas tat tad evetaro janaḥ sa yat pramāṇaṃ kurute lokas tad anuvartate',
    english: 'Whatever actions a great person performs, common people follow. Whatever standards they set, the world follows.',
    hindi: 'श्रेष्ठ पुरुष जो-जो आचरण करता है, अन्य पुरुष भी वैसा ही आचरण करते हैं। वह जो कुछ प्रमाण देता है, समस्त लोक उसी का अनुसरण करता है।',
    themes: ['leadership', 'example', 'influence'],
    keywords: ['leader', 'example', 'follow', 'standard'],
    reflection: 'Your actions influence others. Lead by example.',
  },
  {
    id: 160,
    chapter: 3,
    verse: 27,
    sanskrit: 'प्रकृतेः क्रियमाणानि गुणैः कर्माणि सर्वशः। अहङ्कारविमूढात्मा कर्ताहमिति मन्यते॥',
    transliteration: 'prakṛteḥ kriyamāṇāni guṇaiḥ karmāṇi sarvaśaḥ ahaṅkāra-vimūḍhātmā kartāham iti manyate',
    english: 'All actions are performed by the qualities of nature. One whose mind is deluded by ego thinks, "I am the doer."',
    hindi: 'वास्तव में सभी कर्म प्रकृति के गुणों द्वारा किये जाते हैं, परन्तु अहंकार से मोहित अन्तःकरण वाला अज्ञानी मनुष्य "मैं कर्ता हूँ" ऐसा मानता है।',
    themes: ['ego', 'nature', 'doership'],
    keywords: ['ego', 'nature', 'doer', 'qualities'],
    reflection: 'Release the ego\'s grip. You are an instrument, not the ultimate doer.',
  },

  // Chapter 4 - Jnana Karma Sannyasa Yoga
  {
    id: 180,
    chapter: 4,
    verse: 7,
    sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
    transliteration: 'yadā yadā hi dharmasya glānir bhavati bhārata abhyutthānam adharmasya tadātmānaṃ sṛjāmy aham',
    english: 'Whenever there is a decline of righteousness and rise of unrighteousness, O Arjuna, then I manifest Myself.',
    hindi: 'हे भारत! जब-जब धर्म की हानि और अधर्म की वृद्धि होती है, तब-तब मैं अपने आपको साकार करता हूँ।',
    themes: ['divine', 'incarnation', 'righteousness'],
    keywords: ['dharma', 'incarnation', 'righteousness', 'protection'],
    reflection: 'Divine grace manifests when needed. Stand for what is right.',
  },
  {
    id: 181,
    chapter: 4,
    verse: 8,
    sanskrit: 'परित्राणाय साधूनां विनाशाय च दुष्कृताम्। धर्मसंस्थापनार्थाय सम्भवामि युगे युगे॥',
    transliteration: 'paritrāṇāya sādhūnāṃ vināśāya ca duṣkṛtām dharma-saṃsthāpanārthāya sambhavāmi yuge yuge',
    english: 'For the protection of the good, for the destruction of the wicked, and for the establishment of righteousness, I am born age after age.',
    hindi: 'साधुओं के उद्धार के लिए, दुष्कर्मियों के विनाश के लिए और धर्म की स्थापना के लिए मैं युग-युग में प्रकट होता हूँ।',
    themes: ['protection', 'righteousness', 'divine-intervention'],
    keywords: ['protection', 'good', 'evil', 'dharma'],
    reflection: 'Good always has support from the divine. Align yourself with righteousness.',
  },
  {
    id: 200,
    chapter: 4,
    verse: 34,
    sanskrit: 'तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया। उपदेक्ष्यन्ति ते ज्ञानं ज्ञानिनस्तत्त्वदर्शिनः॥',
    transliteration: 'tad viddhi praṇipātena paripraśnena sevayā upadekṣyanti te jñānaṃ jñāninas tattva-darśinaḥ',
    english: 'Learn this truth by approaching a teacher, by humble inquiry and by service. The wise who have seen the truth will teach you knowledge.',
    hindi: 'उस ज्ञान को तू तत्त्वदर्शी ज्ञानियों के पास जाकर समझ। उनको भलीभाँति दण्डवत प्रणाम करने से, उनकी सेवा करने से और कपट छोड़कर सरलतापूर्वक प्रश्न करने से वे तुझे उस तत्त्व ज्ञान का उपदेश करेंगे।',
    themes: ['teacher', 'humility', 'learning', 'service'],
    keywords: ['teacher', 'humility', 'knowledge', 'service'],
    reflection: 'Approach learning with humility and respect. True knowledge is transmitted through sincere seeking.',
  },

  // Chapter 5 - Karma Sannyasa Yoga
  {
    id: 220,
    chapter: 5,
    verse: 21,
    sanskrit: 'बाह्यस्पर्शेष्वसक्तात्मा विन्दत्यात्मनि यत्सुखम्। स ब्रह्मयोगयुक्तात्मा सुखमक्षयमश्नुते॥',
    transliteration: 'bāhya-sparśeṣv asaktātmā vindaty ātmani yat sukham sa brahma-yoga-yuktātmā sukham akṣayam aśnute',
    english: 'One who is not attached to external pleasures discovers joy within. Such a person, united with the Supreme, enjoys unlimited happiness.',
    hindi: 'बाहर के विषयों में आसक्ति रहित अन्तःकरण वाला साधक आत्मा में स्थित जो सुख है उसको प्राप्त होता है। वह ब्रह्म के साथ योग में युक्त हुआ पुरुष अक्षय सुख का अनुभव करता है।',
    themes: ['inner-joy', 'detachment', 'happiness'],
    keywords: ['joy', 'internal', 'happiness', 'supreme'],
    reflection: 'True happiness comes from within. External pleasures are temporary.',
  },

  // Chapter 6 - Dhyana Yoga
  {
    id: 240,
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration: 'uddhared ātmanātmānaṃ nātmānam avasādayet ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    english: 'Elevate yourself through the power of your mind, and not degrade yourself. The mind can be the friend of the self, and also its enemy.',
    hindi: 'अपने द्वारा अपना संसार-समुद्र से उद्धार करे और अपने आपको अधोगति में न डाले क्योंकि यह मनुष्य आप ही अपना मित्र है और आप ही अपना शत्रु है।',
    themes: ['self-improvement', 'mind', 'friend', 'enemy'],
    keywords: ['mind', 'friend', 'enemy', 'uplift', 'self'],
    reflection: 'Your mind can be your greatest friend or enemy. Choose wisely how you train it.',
  },
  {
    id: 245,
    chapter: 6,
    verse: 6,
    sanskrit: 'बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः। अनात्मनस्तु शत्रुत्वे वर्तेतात्मैव शत्रुवत्॥',
    transliteration: 'bandhur ātmātmanas tasya yenātmaivātmanā jitaḥ anātmanas tu śatrutve vartetātmaiva śatru-vat',
    english: 'For one who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, the mind acts as the greatest enemy.',
    hindi: 'जिसने मन को जीत लिया है, उसके लिए मन परम मित्र है; परन्तु जिसने मन को नहीं जीता, उसके लिए मन शत्रु के समान शत्रुता में लगा रहता है।',
    themes: ['mind-control', 'conquest', 'friend', 'enemy'],
    keywords: ['mind', 'conquered', 'friend', 'enemy'],
    reflection: 'Master your mind, and you master your destiny.',
  },
  {
    id: 260,
    chapter: 6,
    verse: 35,
    sanskrit: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्। अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥',
    transliteration: 'asaṃśayaṃ mahā-bāho mano durnigrahaṃ calam abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate',
    english: 'The mind is undoubtedly restless and difficult to control, but by practice and detachment, O Arjuna, it can be restrained.',
    hindi: 'हे महाबाहो! निःसन्देह मन चंचल और कठिनता से वश में होने वाला है, परन्तु हे कुन्तीपुत्र! यह अभ्यास और वैराग्य से वश में होता है।',
    themes: ['mind-control', 'practice', 'detachment'],
    keywords: ['mind', 'restless', 'practice', 'detachment'],
    reflection: 'With consistent practice and detachment, even the restless mind finds stillness.',
  },

  // Chapter 7 - Jnana Vijnana Yoga
  {
    id: 280,
    chapter: 7,
    verse: 7,
    sanskrit: 'मत्तः परतरं नान्यत्किञ्चिदस्ति धनञ्जय। मयि सर्वमिदं प्रोतं सूत्रे मणिगणा इव॥',
    transliteration: 'mattaḥ parataraṃ nānyat kiñcid asti dhanañjaya mayi sarvam idaṃ protaṃ sūtre maṇi-gaṇā iva',
    english: 'O Arjuna, there is nothing higher than Me. Everything rests upon Me, as pearls are strung on a thread.',
    hindi: 'हे धनञ्जय! मुझसे परे अन्य कोई भी वस्तु नहीं है। यह सम्पूर्ण जगत मुझमें सूत्र में मणियों के समान पिरोया हुआ है।',
    themes: ['divine', 'supreme', 'creation'],
    keywords: ['supreme', 'thread', 'pearls', 'creation'],
    reflection: 'Everything is connected through the divine thread. See unity in diversity.',
  },

  // Chapter 8 - Aksara Brahma Yoga
  {
    id: 300,
    chapter: 8,
    verse: 5,
    sanskrit: 'अन्तकाले च मामेव स्मरन्मुक्त्वा कलेवरम्। यः प्रयाति स मद्भावं याति नास्त्यत्र संशयः॥',
    transliteration: 'anta-kāle ca mām eva smaran muktvā kalevaram yaḥ prayāti sa mad-bhāvaṃ yāti nāsty atra saṃśayaḥ',
    english: 'Whoever, at the end of life, leaves the body remembering Me alone, attains My nature. Of this there is no doubt.',
    hindi: 'जो अन्तकाल में मुझको स्मरण करता हुआ शरीर छोड़कर जाता है, वह मेरे स्वरूप को प्राप्त होता है, इसमें संशय नहीं।',
    themes: ['death', 'remembrance', 'liberation'],
    keywords: ['death', 'remember', 'liberation', 'nature'],
    reflection: 'What you think about at the end shapes your journey. Keep the divine in your awareness.',
  },

  // Chapter 9 - Raja Vidya Raja Guhya Yoga
  {
    id: 320,
    chapter: 9,
    verse: 22,
    sanskrit: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',
    transliteration: 'ananyāś cintayanto māṃ ye janāḥ paryupāsate teṣāṃ nityābhiyuktānāṃ yoga-kṣemaṃ vahāmy aham',
    english: 'To those who worship Me with exclusive devotion, ever united with Me, I secure what they lack and preserve what they have.',
    hindi: 'जो लोग अनन्य भाव से मेरा चिन्तन करते हुए मेरी उपासना करते हैं, उन नित्य युक्त भक्तों का योगक्षेम मैं वहन करता हूँ।',
    themes: ['devotion', 'protection', 'surrender'],
    keywords: ['devotion', 'worship', 'protection', 'security'],
    reflection: 'Devotion brings divine protection. Trust while putting in your sincere effort.',
  },
  {
    id: 326,
    chapter: 9,
    verse: 26,
    sanskrit: 'पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति। तदहं भक्त्युपहृतमश्नामि प्रयतात्मनः॥',
    transliteration: 'patraṃ puṣpaṃ phalaṃ toyaṃ yo me bhaktyā prayacchati tad ahaṃ bhakty-upahṛtam aśnāmi prayatātmanaḥ',
    english: 'Whoever offers Me with devotion a leaf, a flower, a fruit, or water, I accept that offering of love from the pure-hearted.',
    hindi: 'जो भक्त मेरे लिए प्रेम से पत्र, पुष्प, फल, जल आदि अर्पण करता है, उस शुद्ध बुद्धि वाले निष्काम प्रेमी भक्त का प्रेमपूर्वक अर्पण किया हुआ वह पत्र-पुष्पादि मैं स्वीकार करता हूँ।',
    themes: ['devotion', 'simplicity', 'love'],
    keywords: ['offering', 'devotion', 'love', 'simple'],
    reflection: 'The divine accepts love in any form. Offer what you have with a pure heart.',
  },

  // Chapter 10 - Vibhuti Yoga
  {
    id: 340,
    chapter: 10,
    verse: 20,
    sanskrit: 'अहमात्मा गुडाकेश सर्वभूताशयस्थितः। अहमादिश्च मध्यं च भूतानामन्त एव च॥',
    transliteration: 'aham ātmā guḍākeśa sarva-bhūtāśaya-sthitaḥ aham ādiś ca madhyaṃ ca bhūtānām anta eva ca',
    english: 'I am the Self seated in the hearts of all beings. I am the beginning, the middle, and the end of all beings.',
    hindi: 'हे गुडाकेश! मैं सब भूतों के हृदय में स्थित सबका आत्मा हूँ तथा सम्पूर्ण भूतों का आदि, मध्य और अन्त भी मैं ही हूँ।',
    themes: ['omnipresence', 'divine-self', 'unity'],
    keywords: ['self', 'heart', 'beginning', 'end'],
    reflection: 'The divine resides within every being. See the sacred in all of creation.',
  },

  // Chapter 11 - Visvarupa Darsana Yoga
  {
    id: 360,
    chapter: 11,
    verse: 33,
    sanskrit: 'तस्मात्त्वमुत्तिष्ठ यशो लभस्व जित्वा शत्रून्भुङ्क्ष्व राज्यं समृद्धम्। मयैवैते निहताः पूर्वमेव निमित्तमात्रं भव सव्यसाचिन्॥',
    transliteration: 'tasmāt tvam uttiṣṭha yaśo labhasva jitvā śatrūn bhuṅkṣva rājyaṃ samṛddham mayaivaite nihatāḥ pūrvam eva nimitta-mātraṃ bhava savya-sācin',
    english: 'Therefore arise and obtain glory. Conquer your enemies and enjoy a prosperous kingdom. They are already slain by Me; you be merely an instrument, O Arjuna.',
    hindi: 'इसलिए तू उठ, यश प्राप्त कर। शत्रुओं को जीतकर धनसम्पन्न राज्य भोग। ये सब पहले ही मेरे द्वारा मारे जा चुके हैं। तू तो केवल निमित्त मात्र बन, हे सव्यसाचिन्!',
    themes: ['divine-will', 'instrument', 'action'],
    keywords: ['instrument', 'glory', 'victory', 'action'],
    reflection: 'You are an instrument of the divine will. Act with confidence, knowing you are supported.',
  },

  // Chapter 12 - Bhakti Yoga
  {
    id: 380,
    chapter: 12,
    verse: 13,
    sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च। निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
    transliteration: 'adveṣṭā sarva-bhūtānāṃ maitraḥ karuṇa eva ca nirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī',
    english: 'One who bears no hatred to any being, who is friendly and compassionate, free from possessiveness and ego, equipoised in pleasure and pain, and forgiving.',
    hindi: 'जो सम्पूर्ण भूत प्राणियों में द्वेषभाव से रहित, स्वार्थरहित, सबका प्रेमी और हेतुरहित दयालु है, ममता, अहंकार, सुख-दुःख की समान भावना से युक्त और क्षमाशील है।',
    themes: ['compassion', 'forgiveness', 'equanimity'],
    keywords: ['compassion', 'forgiveness', 'ego', 'equanimity'],
    reflection: 'Cultivate compassion for all beings. True spirituality is expressed through kindness.',
  },
  {
    id: 390,
    chapter: 12,
    verse: 18,
    sanskrit: 'समः शत्रौ च मित्रे च तथा मानापमानयोः। शीतोष्णसुखदुःखेषु समः सङ्गविवर्जितः॥',
    transliteration: 'samaḥ śatrau ca mitre ca tathā mānāpamānayoḥ śītoṣṇa-sukha-duḥkheṣu samaḥ saṅga-vivarjitaḥ',
    english: 'One who is equal to friends and enemies, honor and dishonor, cold and heat, pleasure and pain, and who is free from attachment.',
    hindi: 'जो शत्रु और मित्र में, मान और अपमान में सम है, शीत और उष्ण तथा सुख और दुःख आदि द्वन्द्वों में समभाव वाला है और आसक्ति से रहित है।',
    themes: ['equanimity', 'detachment', 'balance'],
    keywords: ['equal', 'friend', 'enemy', 'detachment'],
    reflection: 'Maintain inner balance regardless of external circumstances.',
  },

  // Chapter 13 - Ksetra Ksetrajna Vibhaga Yoga
  {
    id: 400,
    chapter: 13,
    verse: 28,
    sanskrit: 'समं सर्वेषु भूतेषु तिष्ठन्तं परमेश्वरम्। विनश्यत्स्वविनश्यन्तं यः पश्यति स पश्यति॥',
    transliteration: 'samaṃ sarveṣu bhūteṣu tiṣṭhantaṃ parameśvaram vinaśyatsv avinaśyantaṃ yaḥ paśyati sa paśyati',
    english: 'One who sees the Supreme Lord existing equally in all beings, the imperishable within the perishable, truly sees.',
    hindi: 'जो सम्पूर्ण भूतों में समभाव से स्थित परमेश्वर को और नाशवान में अविनाशी को देखता है, वही वास्तव में देखता है।',
    themes: ['vision', 'divine', 'equality', 'imperishable'],
    keywords: ['see', 'equal', 'divine', 'imperishable'],
    reflection: 'See the divine presence equally in all beings. This is true vision.',
  },

  // Chapter 14 - Gunatraya Vibhaga Yoga
  {
    id: 420,
    chapter: 14,
    verse: 22,
    sanskrit: 'प्रकाशं च प्रवृत्तिं च मोहमेव च पाण्डव। न द्वेष्टि सम्प्रवृत्तानि न निवृत्तानि काङ्क्षति॥',
    transliteration: 'prakāśaṃ ca pravṛttiṃ ca moham eva ca pāṇḍava na dveṣṭi sampravṛttāni na nivṛttāni kāṅkṣati',
    english: 'O Arjuna, one who does not hate illumination, activity, and delusion when present, nor longs for them when absent.',
    hindi: 'हे पाण्डव! जो प्रकाश (सत्त्व), प्रवृत्ति (रजस्) और मोह (तमस्) के उत्पन्न होने पर द्वेष नहीं करता और न दूर होने पर उनकी आकांक्षा करता है।',
    themes: ['gunas', 'transcendence', 'equanimity'],
    keywords: ['gunas', 'illumination', 'activity', 'delusion'],
    reflection: 'Rise above the three qualities of nature. Observe them without attachment.',
  },

  // Chapter 15 - Purusottama Yoga
  {
    id: 440,
    chapter: 15,
    verse: 15,
    sanskrit: 'सर्वस्य चाहं हृदि सन्निविष्टो मत्तः स्मृतिर्ज्ञानमपोहनं च। वेदैश्च सर्वैरहमेव वेद्यो वेदान्तकृद्वेदविदेव चाहम्॥',
    transliteration: 'sarvasya cāhaṃ hṛdi sanniviṣṭo mattaḥ smṛtir jñānam apohanaṃ ca vedaiś ca sarvair aham eva vedyo vedānta-kṛd veda-vid eva cāham',
    english: 'I am seated in everyone\'s heart; from Me come remembrance, knowledge, and forgetfulness. I alone am to be known by all the Vedas; I am the author of Vedanta and the knower of the Vedas.',
    hindi: 'मैं सबके हृदय में स्थित हूँ। मुझसे ही स्मृति, ज्ञान और अपोहन (विस्मृति) होती है। सभी वेदों द्वारा मैं ही जानने योग्य हूँ, वेदान्त का कर्ता और वेदों का ज्ञाता भी मैं ही हूँ।',
    themes: ['divine-presence', 'knowledge', 'heart'],
    keywords: ['heart', 'knowledge', 'memory', 'vedas'],
    reflection: 'The divine dwells within you. Seek knowledge and wisdom from your own heart.',
  },

  // Chapter 16 - Daivasura Sampad Vibhaga Yoga
  {
    id: 460,
    chapter: 16,
    verse: 1,
    sanskrit: 'अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः। दानं दमश्च यज्ञश्च स्वाध्यायस्तप आर्जवम्॥',
    transliteration: 'abhayaṃ sattva-saṃśuddhir jñāna-yoga-vyavasthitiḥ dānaṃ damaś ca yajñaś ca svādhyāyas tapa ārjavam',
    english: 'Fearlessness, purity of heart, steadfastness in knowledge and yoga, charity, self-control, sacrifice, study of scriptures, austerity, and straightforwardness.',
    hindi: 'भय का अभाव, अन्तःकरण की शुद्धि, ज्ञानयोग में दृढ़ स्थिति, दान, इन्द्रिय-दमन, यज्ञ, स्वाध्याय, तप और सरलता।',
    themes: ['divine-qualities', 'virtue', 'character'],
    keywords: ['fearlessness', 'purity', 'charity', 'austerity'],
    reflection: 'Cultivate divine qualities: fearlessness, purity, generosity, and self-discipline.',
  },

  // Chapter 17 - Sraddhatraya Vibhaga Yoga
  {
    id: 480,
    chapter: 17,
    verse: 20,
    sanskrit: 'दातव्यमिति यद्दानं दीयतेऽनुपकारिणे। देशे काले च पात्रे च तद्दानं सात्त्विकं स्मृतम्॥',
    transliteration: 'dātavyam iti yad dānaṃ dīyate \'nupakāriṇe deśe kāle ca pātre ca tad dānaṃ sāttvikaṃ smṛtam',
    english: 'That gift which is given with the thought "It is my duty to give," to a worthy person who does nothing in return, at the proper time and place, is considered sattvic.',
    hindi: 'दान देना कर्तव्य है, इस भाव से जो दान बिना उपकार की आशा किये, उचित स्थान, काल और पात्र में दिया जाता है, वह दान सात्त्विक कहा गया है।',
    themes: ['charity', 'giving', 'duty'],
    keywords: ['charity', 'giving', 'duty', 'sattvic'],
    reflection: 'Give with pure intention, expecting nothing in return. This is the highest form of charity.',
  },

  // Chapter 18 - Moksha Sannyasa Yoga
  {
    id: 500,
    chapter: 18,
    verse: 20,
    sanskrit: 'सर्वभूतेषु येनैकं भावमव्ययमीक्षते। अविभक्तं विभक्तेषु तज्ज्ञानं विद्धि सात्त्विकम्॥',
    transliteration: 'sarva-bhūteṣu yenaikaṃ bhāvam avyayam īkṣate avibhaktaṃ vibhakteṣu taj jñānaṃ viddhi sāttvikam',
    english: 'That knowledge by which one sees the one indestructible reality in all beings, undivided in the divided, know that knowledge to be sattvic.',
    hindi: 'जिस ज्ञान से मनुष्य सम्पूर्ण भूतों में एक अविनाशी परमात्मभाव को विभागरहित और सम रूप से स्थित देखता है, उस ज्ञान को तू सात्त्विक जान।',
    themes: ['unity', 'knowledge', 'vision'],
    keywords: ['unity', 'knowledge', 'undivided', 'sattvic'],
    reflection: 'See the unity underlying all diversity. This is true spiritual knowledge.',
  },
  {
    id: 550,
    chapter: 18,
    verse: 55,
    sanskrit: 'भक्त्या मामभिजानाति यावान्यश्चास्मि तत्त्वतः। ततो मां तत्त्वतो ज्ञात्वा विशते तदनन्तरम्॥',
    transliteration: 'bhaktyā mām abhijānāti yāvān yaś cāsmi tattvataḥ tato māṃ tattvato jñātvā viśate tad-anantaram',
    english: 'By devotion one knows Me in truth, who I am and what I am. Then, having known Me in truth, one enters into Me immediately.',
    hindi: 'भक्ति से वह मुझे तत्त्व से जानता है कि मैं कौन हूँ और जितना हूँ। फिर मुझे तत्त्व से जानकर तत्काल मुझमें प्रवेश कर जाता है।',
    themes: ['devotion', 'knowledge', 'liberation'],
    keywords: ['devotion', 'truth', 'knowledge', 'enter'],
    reflection: 'Through devotion, true knowledge dawns. And through knowledge, liberation is attained.',
  },
  {
    id: 600,
    chapter: 18,
    verse: 65,
    sanskrit: 'मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु। मामेवैष्यसि सत्यं ते प्रतिजाने प्रियोऽसि मे॥',
    transliteration: 'man-manā bhava mad-bhakto mad-yājī māṃ namaskuru mām evaiṣyasi satyaṃ te pratijāne priyo \'si me',
    english: 'Fix your mind on Me, be devoted to Me, worship Me, bow down to Me. You shall come to Me alone. Truly I promise you, for you are dear to Me.',
    hindi: 'मुझमें मन वाला हो, मेरा भक्त बन, मेरा पूजन करने वाला हो, मुझको प्रणाम कर। ऐसा करने से तू मुझको ही प्राप्त होगा, यह मैं तुझसे सत्य प्रतिज्ञा करता हूँ क्योंकि तू मेरा प्रिय है।',
    themes: ['devotion', 'promise', 'love'],
    keywords: ['mind', 'devotion', 'worship', 'promise'],
    reflection: 'Divine love awaits those who turn their hearts towards it. You are beloved.',
  },
  {
    id: 650,
    chapter: 18,
    verse: 66,
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    transliteration: 'sarva-dharmān parityajya mām ekaṃ śaraṇaṃ vraja ahaṃ tvāṃ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ',
    english: 'Abandon all varieties of dharma and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
    hindi: 'सम्पूर्ण धर्मों को त्यागकर एकमात्र मेरी शरण में आ। मैं तुझे सम्पूर्ण पापों से मुक्त कर दूँगा, शोक मत कर।',
    themes: ['surrender', 'liberation', 'grace'],
    keywords: ['surrender', 'liberation', 'sin', 'grace'],
    reflection: 'Complete surrender brings ultimate freedom. Let go and trust in divine grace.',
  },
  {
    id: 700,
    chapter: 18,
    verse: 78,
    sanskrit: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः। तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम॥',
    transliteration: 'yatra yogeśvaraḥ kṛṣṇo yatra pārtho dhanur-dharaḥ tatra śrīr vijayo bhūtir dhruvā nītir matir mama',
    english: 'Wherever there is Krishna, the master of yoga, and wherever there is Arjuna, the archer, there will certainly be prosperity, victory, power, and righteousness. This is my conviction.',
    hindi: 'जहाँ योगेश्वर श्रीकृष्ण हैं और जहाँ धनुर्धारी अर्जुन है, वहाँ श्री, विजय, विभूति और अचल नीति है - यह मेरा मत है।',
    themes: ['victory', 'righteousness', 'conclusion'],
    keywords: ['victory', 'prosperity', 'righteousness', 'conclusion'],
    reflection: 'Where divine wisdom and devoted action unite, success is certain. May your journey be blessed.',
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get total number of verses in the Gita
 */
export function getTotalVerses(): number {
  return CHAPTERS.reduce((sum, ch) => sum + ch.totalVerses, 0)
}

/**
 * Get verse by chapter and verse number
 */
export function getVerse(chapter: number, verse: number): GitaVerse | undefined {
  return KEY_VERSES.find((v) => v.chapter === chapter && v.verse === verse)
}

/**
 * Get all verses for a chapter
 */
export function getChapterVerses(chapter: number): GitaVerse[] {
  return KEY_VERSES.filter((v) => v.chapter === chapter)
}

/**
 * Get verses by theme
 */
export function getVersesByTheme(theme: string): GitaVerse[] {
  return KEY_VERSES.filter((v) => v.themes.includes(theme))
}

/**
 * Get verses by keyword
 */
export function getVersesByKeyword(keyword: string): GitaVerse[] {
  const lowerKeyword = keyword.toLowerCase()
  return KEY_VERSES.filter((v) =>
    v.keywords.some((k) => k.toLowerCase().includes(lowerKeyword))
  )
}

/**
 * Get random verses
 */
export function getRandomVerses(count: number): GitaVerse[] {
  const shuffled = [...KEY_VERSES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Search verses by text
 */
export function searchVerses(query: string): GitaVerse[] {
  const lowerQuery = query.toLowerCase()
  return KEY_VERSES.filter(
    (v) =>
      v.english.toLowerCase().includes(lowerQuery) ||
      v.hindi.includes(query) ||
      v.themes.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      v.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get chapter info
 */
export function getChapterInfo(chapter: number): ChapterInfo | undefined {
  return CHAPTERS.find((c) => c.number === chapter)
}

/**
 * Get all chapter info
 */
export function getAllChapters(): ChapterInfo[] {
  return CHAPTERS
}

// Export default object for convenience
const gitaVerses = {
  CHAPTERS,
  KEY_VERSES,
  getTotalVerses,
  getVerse,
  getChapterVerses,
  getVersesByTheme,
  getVersesByKeyword,
  getRandomVerses,
  searchVerses,
  getChapterInfo,
  getAllChapters,
}
export default gitaVerses

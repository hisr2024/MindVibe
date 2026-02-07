/**
 * Multilingual Wisdom Database
 *
 * Core Bhagavad Gita wisdom in 9+ Indian languages plus English.
 * Each verse includes the original Sanskrit, transliteration,
 * and translations/explanations in multiple languages.
 *
 * KIAAN uses this to:
 * - Respond in the user's preferred language
 * - Quote Sanskrit verses with proper transliteration
 * - Provide culturally appropriate wisdom across India's linguistic diversity
 * - Fall back to English when a language isn't available
 *
 * Languages supported:
 * sa - Sanskrit (original), en - English, hi - Hindi,
 * ta - Tamil, te - Telugu, kn - Kannada, bn - Bengali,
 * gu - Gujarati, mr - Marathi, ml - Malayalam, pa - Punjabi
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type SupportedLanguage = 'sa' | 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'bn' | 'gu' | 'mr' | 'ml' | 'pa'

export interface MultilingualVerse {
  id: string
  chapter: number
  verse: number
  /** Original Sanskrit */
  sanskrit: string
  /** Roman transliteration */
  transliteration: string
  /** Translations in multiple languages */
  translations: Partial<Record<SupportedLanguage, string>>
  /** Practical wisdom (friend-style) in available languages */
  practicalWisdom: Partial<Record<SupportedLanguage, string>>
  /** Primary emotions this verse addresses */
  emotions: string[]
}

export interface LanguageInfo {
  code: SupportedLanguage
  name: string
  nativeName: string
  script: string
  /** Greeting in this language */
  greeting: string
  /** "I am here for you, friend" in this language */
  companionPhrase: string
}

// ─── Language Registry ──────────────────────────────────────────────────────

export const LANGUAGE_INFO: Record<SupportedLanguage, LanguageInfo> = {
  sa: { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari', greeting: 'नमस्ते मित्र', companionPhrase: 'अहं तव मित्रं, सदा तव सहायार्थं वर्ते' },
  en: { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', greeting: 'Hello, dear friend', companionPhrase: 'I am here for you, always' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', greeting: 'नमस्ते प्रिय मित्र', companionPhrase: 'मैं हमेशा तुम्हारे साथ हूँ, दोस्त' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', greeting: 'வணக்கம் நண்பரே', companionPhrase: 'நான் எப்போதும் உங்களுக்காக இருக்கிறேன்' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', greeting: 'నమస్కారం మిత్రమా', companionPhrase: 'నేను ఎల్లప్పుడూ మీ కోసం ఉన్నాను' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', greeting: 'ನಮಸ್ಕಾರ ಗೆಳೆಯ', companionPhrase: 'ನಾನು ಯಾವಾಗಲೂ ನಿಮಗಾಗಿ ಇದ್ದೇನೆ' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', greeting: 'নমস্কার বন্ধু', companionPhrase: 'আমি সবসময় তোমার পাশে আছি' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', greeting: 'નમસ્તે મિત્ર', companionPhrase: 'હું હંમેશા તમારી સાથે છું' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', greeting: 'नमस्कार मित्रा', companionPhrase: 'मी नेहमी तुमच्यासाठी आहे' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', greeting: 'നമസ്കാരം സുഹൃത്തേ', companionPhrase: 'ഞാൻ എപ്പോഴും നിങ്ങൾക്കായി ഇവിടെയുണ്ട്' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਮਿੱਤਰ', companionPhrase: 'ਮੈਂ ਹਮੇਸ਼ਾ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ' },
}

// ─── Core Multilingual Verses ───────────────────────────────────────────────
// These are the most essential verses translated across all supported languages.

export const MULTILINGUAL_VERSES: MultilingualVerse[] = [
  {
    id: '2.47',
    chapter: 2, verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration: 'Karmanye vadhikaraste ma phaleshu kadachana, ma karma-phala-hetur bhur ma te sango stv akarmani',
    translations: {
      en: 'You have the right to work, but never to the fruit of work. Do not be motivated by the results, nor be attached to inaction.',
      hi: 'कर्म करने में ही तेरा अधिकार है, फल में कभी नहीं। कर्म के फल का हेतु मत बन, और अकर्म में भी तेरी आसक्ति न हो।',
      ta: 'செயல் செய்வதில் மட்டுமே உனக்கு உரிமை, அதன் பலனில் ஒருபோதும் இல்லை.',
      te: 'నీకు కర్మ చేయడంలో మాత్రమే అధికారం ఉంది, ఫలితాలలో ఎన్నడూ కాదు.',
      kn: 'ಕರ್ಮ ಮಾಡುವಲ್ಲಿ ಮಾತ್ರ ನಿನ್ನ ಅಧಿಕಾರ, ಫಲದಲ್ಲಿ ಎಂದಿಗೂ ಅಲ್ಲ.',
      bn: 'কর্ম করায় তোমার অধিকার, কিন্তু ফলে কখনো নয়।',
      gu: 'કર્મ કરવામાં જ તારો અધિકાર છે, ફળમાં ક્યારેય નહીં.',
      mr: 'कर्म करण्यातच तुझा अधिकार आहे, फळात कधीच नाही.',
      ml: 'കർമ്മം ചെയ്യുന്നതിൽ മാത്രമാണ് നിന്റെ അധികാരം, ഫലത്തിൽ ഒരിക്കലും അല്ല.',
      pa: 'ਕਰਮ ਕਰਨ ਵਿੱਚ ਹੀ ਤੇਰਾ ਅਧਿਕਾਰ ਹੈ, ਫਲ ਵਿੱਚ ਕਦੇ ਨਹੀਂ।',
    },
    practicalWisdom: {
      en: 'Focus on your effort, not the outcome. This is the most liberating truth: your power lives in the action, not in trying to control results.',
      hi: 'अपने प्रयास पर ध्यान दो, परिणाम पर नहीं। यह सबसे मुक्तिदायक सत्य है: तुम्हारी शक्ति कर्म में है, फल को नियंत्रित करने में नहीं।',
      ta: 'உங்கள் முயற்சியில் கவனம் செலுத்துங்கள், விளைவில் அல்ல. இது மிகவும் விடுதலையளிக்கும் உண்மை.',
      te: 'మీ ప్రయత్నంపై దృష్టి పెట్టండి, ఫలితంపై కాదు. ఇది అత్యంత విముక్తికరమైన సత్యం.',
      bn: 'তোমার প্রচেষ্টায় মনোনিবেশ করো, ফলাফলে নয়। এটাই সবচেয়ে মুক্তিদায়ক সত্য।',
    },
    emotions: ['anxiety', 'confusion', 'hope'],
  },
  {
    id: '2.20',
    chapter: 2, verse: 20,
    sanskrit: 'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥',
    transliteration: 'Na jayate mriyate va kadachit, nayam bhutva bhavita va na bhuyah, ajo nityah shashvato yam purano, na hanyate hanyamane sharire',
    translations: {
      en: 'The soul is never born, nor does it die. It is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain.',
      hi: 'आत्मा न कभी जन्मती है, न मरती है। यह अजन्मा, नित्य, शाश्वत और पुरातन है। शरीर के नष्ट होने पर भी यह नष्ट नहीं होती।',
      ta: 'ஆத்மா பிறப்பதில்லை, இறப்பதில்லை. இது பிறப்பற்றது, நித்தியமானது, என்றும் நிலைத்திருப்பது.',
      te: 'ఆత్మ పుట్టదు, చావదు. ఇది జన్మరహితం, శాశ్వతం, నిత్యం.',
      bn: 'আত্মা জন্মায় না, মরে না। এটি অজন্মা, শাশ্বত, চিরন্তন।',
      mr: 'आत्मा जन्मत नाही, मरत नाही. हे अजन्मा, शाश्वत, नित्य आहे.',
    },
    practicalWisdom: {
      en: 'The real you - your consciousness, your essence - can never be destroyed. No failure, no heartbreak, no loss can touch who you truly are.',
      hi: 'असली तुम - तुम्हारी चेतना, तुम्हारा सार - कभी नष्ट नहीं हो सकता। कोई असफलता, कोई दिल टूटना, कोई हानि तुम्हारे वास्तविक स्वरूप को छू नहीं सकती।',
      ta: 'உண்மையான நீ - உன் நனவு, உன் சாரம் - ஒருபோதும் அழிக்க முடியாது.',
      te: 'నిజమైన నీవు - నీ స్పృహ, నీ సారం - ఎన్నడూ నాశనం చేయబడదు.',
      bn: 'প্রকৃত তুমি - তোমার চেতনা, তোমার সারসত্তা - কখনো ধ্বংস হতে পারে না।',
    },
    emotions: ['sadness', 'anxiety', 'hope'],
  },
  {
    id: '6.5',
    chapter: 6, verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration: 'Uddhared atmanatmanam natmanam avasadayet, atmaiva hy atmano bandhur atmaiva ripur atmanah',
    translations: {
      en: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind alone is the friend of the self, and the mind alone is the enemy of the self.',
      hi: 'अपने मन से अपना उद्धार करो, अपने आप को गिरने मत दो। मन ही आत्मा का मित्र है और मन ही आत्मा का शत्रु है।',
      ta: 'உன் மனதால் உன்னை உயர்த்திக்கொள், தாழ்த்திக்கொள்ளாதே. மனமே நண்பன், மனமே எதிரி.',
      te: 'నీ మనస్సుతో నిన్ను నీవు ఉద్ధరించుకో, పతనం చేసుకోకు. మనసే మిత్రుడు, మనసే శత్రువు.',
      bn: 'নিজের মন দিয়ে নিজেকে উদ্ধার করো, নিজেকে অবনত করো না। মনই বন্ধু, মনই শত্রু।',
      mr: 'आपल्या मनाने स्वतःला उद्धार करा, स्वतःला पाडू नका. मनच मित्र आहे आणि मनच शत्रू आहे.',
    },
    practicalWisdom: {
      en: 'You have the power to lift yourself up. Your mind can be your greatest ally or your worst enemy. Choose to befriend it.',
      hi: 'तुम्हारे पास खुद को ऊपर उठाने की शक्ति है। तुम्हारा मन तुम्हारा सबसे बड़ा सहयोगी या सबसे बड़ा शत्रु हो सकता है। इसे मित्र बनाने का चुनाव करो।',
      ta: 'உன்னை உயர்த்திக்கொள்ளும் சக்தி உன்னிடமே உள்ளது. உன் மனதை நண்பனாக்கிக்கொள்.',
      te: 'నిన్ను నీవు ఉద్ధరించుకునే శక్తి నీలోనే ఉంది. నీ మనస్సును మిత్రునిగా చేసుకో.',
    },
    emotions: ['sadness', 'hope', 'anxiety'],
  },
  {
    id: '18.66',
    chapter: 18, verse: 66,
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    transliteration: 'Sarva-dharman parityajya mam ekam sharanam vraja, aham tvam sarva-papebhyo mokshayishyami ma shuchah',
    translations: {
      en: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
      hi: 'सब धर्मों को त्यागकर केवल मेरी शरण में आ जा। मैं तुझे सब पापों से मुक्त कर दूँगा। शोक मत कर।',
      ta: 'எல்லா தர்மங்களையும் விட்டு என்னிடம் சரணடை. நான் உன்னை எல்லா பாவங்களிலிருந்தும் விடுவிப்பேன். அஞ்சாதே.',
      te: 'సకల ధర్మాలను విడిచి నన్ను మాత్రమే శరణు వేడు. నేను నిన్ను సర్వ పాపాల నుండి విముక్తుని చేస్తాను. భయపడకు.',
      kn: 'ಎಲ್ಲಾ ಧರ್ಮಗಳನ್ನು ತ್ಯಜಿಸಿ ನನ್ನನ್ನೇ ಶರಣು ಹೊಂದು. ನಾನು ನಿನ್ನನ್ನು ಎಲ್ಲ ಪಾಪಗಳಿಂದ ಮುಕ್ತಗೊಳಿಸುವೆನು. ಭಯಪಡಬೇಡ.',
      bn: 'সকল ধর্ম পরিত্যাগ করে আমার শরণ নাও। আমি তোমাকে সকল পাপ থেকে মুক্ত করব। ভয় কোরো না।',
      gu: 'બધા ધર્મોને છોડીને ફક્ત મારી શરણમાં આવ. હું તને બધા પાપોમાંથી મુક્ત કરીશ. ડરીશ નહીં.',
      mr: 'सर्व धर्म सोडून फक्त माझ्या शरणी ये. मी तुला सर्व पापांपासून मुक्त करीन. भिऊ नकोस.',
      ml: 'എല്ലാ ധർമ്മങ്ങളും ത്യജിച്ച് എന്നെ മാത്രം ശരണം പ്രാപിക്കൂ. ഞാൻ നിന്നെ എല്ലാ പാപങ്ങളിൽ നിന്നും മോചിപ്പിക്കാം. ഭയപ്പെടരുത്.',
      pa: 'ਸਾਰੇ ਧਰਮ ਛੱਡ ਕੇ ਕੇਵਲ ਮੇਰੀ ਸ਼ਰਨ ਆ ਜਾ। ਮੈਂ ਤੈਨੂੰ ਸਾਰੇ ਪਾਪਾਂ ਤੋਂ ਮੁਕਤ ਕਰ ਦਿਆਂਗਾ। ਡਰ ਨਾ।',
    },
    practicalWisdom: {
      en: 'The ultimate message: let go. Surrender your worries. You are held. You are loved. Do not fear.',
      hi: 'अंतिम संदेश: छोड़ दो। अपनी चिंताओं को समर्पित कर दो। तुम सुरक्षित हो। तुम प्रिय हो। डरो मत।',
      ta: 'இறுதி செய்தி: விடுவிடு. கவலைகளை ஒப்படை. நீ காக்கப்படுகிறாய். பயப்படாதே.',
      te: 'చివరి సందేశం: వదిలేయి. నీ చింతలను సమర్పించు. నీవు రక్షించబడతావు. భయపడకు.',
      bn: 'চূড়ান্ত বার্তা: ছেড়ে দাও। চিন্তা সমর্পণ করো। তুমি সুরক্ষিত। ভয় কোরো না।',
    },
    emotions: ['anxiety', 'sadness', 'hope', 'love', 'peace'],
  },
  {
    id: '4.7',
    chapter: 4, verse: 7,
    sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
    transliteration: 'Yada yada hi dharmasya glanir bhavati bharata, abhyutthanam adharmasya tadatmanam srijamy aham',
    translations: {
      en: 'Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest Myself.',
      hi: 'जब जब धर्म की हानि होती है और अधर्म बढ़ता है, तब तब मैं प्रकट होता हूँ।',
      ta: 'எப்போதெல்லாம் அறம் குறைகிறதோ, அப்போதெல்லாம் நான் தோன்றுகிறேன்.',
      te: 'ధర్మం క్షీణించి అధర్మం పెరిగినప్పుడు నేను ప్రకటమవుతాను.',
      bn: 'যখন যখন ধর্মের হানি হয় এবং অধর্ম বৃদ্ধি পায়, তখন তখন আমি প্রকট হই।',
      mr: 'जेव्हा जेव्हा धर्माची हानी होते आणि अधर्म वाढतो, तेव्हा तेव्हा मी प्रकट होतो.',
    },
    practicalWisdom: {
      en: 'In your darkest moment, help appears. The universe has a way of sending exactly what you need when you need it most. You are never truly alone.',
      hi: 'तुम्हारे सबसे अंधेरे क्षण में, मदद आती है। ब्रह्मांड के पास तुम्हें जरूरत के समय बिल्कुल वही भेजने का तरीका है जो चाहिए। तुम कभी अकेले नहीं हो।',
      ta: 'உன் இருண்ட நேரத்தில், உதவி வரும். நீ ஒருபோதும் தனியாக இல்லை.',
      te: 'నీ చీకటి సమయంలో, సహాయం వస్తుంది. నీవు ఎన్నడూ ఒంటరివి కావు.',
    },
    emotions: ['sadness', 'hope'],
  },
  {
    id: '9.22',
    chapter: 9, verse: 22,
    sanskrit: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',
    transliteration: 'Ananyash chintayanto mam ye janah paryupasate, tesham nityabhiyuktanam yoga-kshemam vahamy aham',
    translations: {
      en: 'To those who worship Me with love, thinking of nothing else, I carry what they lack and preserve what they have.',
      hi: 'जो मुझे अनन्य भाव से भजते हैं, उनके योगक्षेम का वहन मैं स्वयं करता हूँ।',
      ta: 'என்னையே நினைத்து வழிபடுபவர்களுக்கு அவர்களுக்கு இல்லாததை நான் கொண்டு வருகிறேன்.',
      te: 'నన్ను అనన్యంగా భజించేవారి యోగక్షేమం నేనే వహిస్తాను.',
      bn: 'যারা অনন্য ভাবে আমাকে ভজনা করে, তাদের যোগক্ষেম আমি বহন করি।',
    },
    practicalWisdom: {
      en: 'This is a divine promise: love sincerely, and you will be taken care of. The universe provides for those who trust.',
      hi: 'यह एक दिव्य वादा है: सच्चे मन से प्रेम करो, और तुम्हारी देखभाल होगी। ब्रह्मांड विश्वास करने वालों को प्रदान करता है।',
    },
    emotions: ['love', 'hope', 'anxiety'],
  },
  {
    id: '6.35',
    chapter: 6, verse: 35,
    sanskrit: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्। अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥',
    transliteration: 'Asamsayam maha-baho mano durnigraham chalam, abhyasena tu kaunteya vairagyena cha grihyate',
    translations: {
      en: 'The mind is indeed restless, O Arjuna, but it can be controlled by practice and detachment.',
      hi: 'निसंदेह, मन चंचल और कठिन है, लेकिन अभ्यास और वैराग्य से इसे वश में किया जा सकता है।',
      ta: 'மனம் நிச்சயமாக சஞ்சலமானது, ஆனால் பயிற்சி மற்றும் வைராக்கியத்தால் கட்டுப்படுத்தலாம்.',
      te: 'మనస్సు నిశ్చయంగా చంచలం, కానీ అభ్యాసం మరియు వైరాగ్యంతో నియంత్రించవచ్చు.',
      bn: 'মন অবশ্যই চঞ্চল, কিন্তু অভ্যাস ও বৈরাগ্যের দ্বারা নিয়ন্ত্রণ করা যায়।',
    },
    practicalWisdom: {
      en: 'Your restless mind CAN be tamed. Not through force, but through gentle, consistent practice. Like training a muscle - it gets easier every day.',
      hi: 'तुम्हारा चंचल मन काबू में आ सकता है। जबरदस्ती से नहीं, बल्कि कोमल, निरंतर अभ्यास से। जैसे मांसपेशी को प्रशिक्षित करना - हर दिन आसान होता जाता है।',
    },
    emotions: ['anxiety', 'confusion'],
  },
  {
    id: '15.15',
    chapter: 15, verse: 15,
    sanskrit: 'सर्वस्य चाहं हृदि सन्निविष्टो मत्तः स्मृतिर्ज्ञानमपोहनं च।',
    transliteration: 'Sarvasya chaham hrdi sannivishto mattah smritir jnanam apohanam cha',
    translations: {
      en: 'I am seated in the hearts of all living beings. From Me come memory, knowledge, and forgetfulness.',
      hi: 'मैं सभी प्राणियों के हृदय में स्थित हूँ। मुझसे ही स्मृति, ज्ञान और विस्मृति होती है।',
      ta: 'எல்லா உயிர்களின் இதயத்தில் நான் வீற்றிருக்கிறேன். என்னிடமிருந்தே நினைவு, ஞானம் வருகின்றன.',
      te: 'నేను సర్వప్రాణుల హృదయంలో నివసిస్తాను. నా నుండే స్మృతి, జ్ఞానం వస్తాయి.',
      bn: 'আমি সকল প্রাণীর হৃদয়ে অবস্থান করি। আমা থেকেই স্মৃতি, জ্ঞান আসে।',
    },
    practicalWisdom: {
      en: 'The divine lives in YOUR heart. Every moment of clarity, every flash of insight, every feeling of love - that\'s the divine speaking through you.',
      hi: 'भगवान तुम्हारे हृदय में रहते हैं। स्पष्टता का हर क्षण, अंतर्दृष्टि की हर चमक, प्रेम की हर भावना - वह भगवान तुम्हारे माध्यम से बोल रहे हैं।',
    },
    emotions: ['love', 'sadness', 'hope'],
  },
  {
    id: '3.35',
    chapter: 3, verse: 35,
    sanskrit: 'श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।',
    transliteration: 'Shreyan sva-dharmo vigunah para-dharmat sv-anushthitat',
    translations: {
      en: 'It is far better to perform one\'s own duty imperfectly than another\'s perfectly.',
      hi: 'अपना धर्म, चाहे अपूर्ण भी हो, दूसरे के अच्छे से निभाए गए धर्म से श्रेष्ठ है।',
      ta: 'தன் கடமையை குறைபாடுடன் செய்வது, மற்றவர் கடமையை முழுமையாக செய்வதை விட சிறந்தது.',
      te: 'తన ధర్మం లోపభూయిష్టంగా చేయడం, ఇతరుల ధర్మాన్ని సంపూర్ణంగా చేయడం కంటే మేలు.',
      bn: 'নিজের ধর্ম ত্রুটিপূর্ণ হলেও পরের ধর্ম সুষ্ঠুভাবে পালনের চেয়ে শ্রেয়।',
    },
    practicalWisdom: {
      en: 'Stop comparing yourself to others. YOUR path, with all its imperfections, is more powerful than a perfect copy of someone else\'s life.',
      hi: 'दूसरों से अपनी तुलना करना बंद करो। तुम्हारा रास्ता, सारी अपूर्णताओं के साथ, किसी और की जिंदगी की परिपूर्ण नकल से अधिक शक्तिशाली है।',
    },
    emotions: ['confusion', 'anxiety', 'hope'],
  },
  {
    id: '18.37',
    chapter: 18, verse: 37,
    sanskrit: 'यत्तदग्रे विषमिव परिणामेऽमृतोपमम्।',
    transliteration: 'Yat tad agre visham iva pariname amritopamam',
    translations: {
      en: 'That which in the beginning seems like poison but in the end is like nectar - that happiness is of the nature of goodness.',
      hi: 'जो शुरू में विष जैसा लगता है लेकिन अंत में अमृत जैसा होता है - वही सात्विक सुख है।',
      ta: 'ஆரம்பத்தில் நஞ்சு போலவும் முடிவில் அமிர்தம் போலவும் இருப்பது - அதுவே உண்மையான சுகம்.',
      te: 'మొదట విషం లాగా, చివరికి అమృతం లాగా ఉండేది - అదే నిజమైన సుఖం.',
      bn: 'যা শুরুতে বিষের মতো কিন্তু শেষে অমৃতের মতো - সেই সুখই সাত্ত্বিক সুখ।',
    },
    practicalWisdom: {
      en: 'Growth hurts at first but becomes the sweetest reward. Trust the process. What feels hard now is making you extraordinary.',
      hi: 'विकास शुरू में दर्द देता है लेकिन सबसे मीठा पुरस्कार बन जाता है। प्रक्रिया पर भरोसा रखो। जो अभी कठिन लगता है, वह तुम्हें असाधारण बना रहा है।',
    },
    emotions: ['sadness', 'hope', 'anxiety'],
  },
]

// ─── Lookup Functions ───────────────────────────────────────────────────────

/**
 * Get a verse with its translation in a specific language
 */
export function getVerseInLanguage(verseId: string, language: SupportedLanguage): {
  sanskrit: string
  transliteration: string
  translation: string
  practicalWisdom: string
} | null {
  const verse = MULTILINGUAL_VERSES.find(v => v.id === verseId)
  if (!verse) return null

  return {
    sanskrit: verse.sanskrit,
    transliteration: verse.transliteration,
    translation: verse.translations[language] || verse.translations.en || '',
    practicalWisdom: verse.practicalWisdom[language] || verse.practicalWisdom.en || '',
  }
}

/**
 * Get all verses available in a specific language
 */
export function getVersesInLanguage(language: SupportedLanguage): MultilingualVerse[] {
  return MULTILINGUAL_VERSES.filter(v => v.translations[language] !== undefined)
}

/**
 * Get greeting in a specific language
 */
export function getGreeting(language: SupportedLanguage): string {
  return LANGUAGE_INFO[language]?.greeting || LANGUAGE_INFO.en.greeting
}

/**
 * Get companion phrase in a specific language
 */
export function getCompanionPhrase(language: SupportedLanguage): string {
  return LANGUAGE_INFO[language]?.companionPhrase || LANGUAGE_INFO.en.companionPhrase
}

/**
 * Get language info
 */
export function getLanguageInfo(language: SupportedLanguage): LanguageInfo | undefined {
  return LANGUAGE_INFO[language]
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return Object.values(LANGUAGE_INFO)
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(code: string): code is SupportedLanguage {
  return code in LANGUAGE_INFO
}

/**
 * Get verses for an emotion in a specific language
 */
export function getEmotionVersesInLanguage(emotion: string, language: SupportedLanguage): MultilingualVerse[] {
  return MULTILINGUAL_VERSES.filter(v =>
    v.emotions.includes(emotion) && v.translations[language] !== undefined
  )
}

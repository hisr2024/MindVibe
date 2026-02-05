-- Migration: Update Journey Verses with Actual Sanskrit Content
-- Date: 2026-02-05
-- Description: Updates gita_verses with proper Sanskrit, transliteration, Hindi, and English for verses used in journeys
-- Using UPDATE statements (verses already exist in table)

-- =============================================================================
-- CHAPTER 14, VERSE 17 - Used for Lobha (Greed) Journeys
-- Three Modes of Nature (Gunas)
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'सत्त्वात्सञ्जायते ज्ञानं रजसो लोभ एव च।
प्रमादमोहौ तमसो भवतोऽज्ञानमेव च॥',
    transliteration = 'sattvāt sañjāyate jñānaṁ rajaso lobha eva ca
pramāda-mohau tamaso bhavato jñānam eva ca',
    hindi = 'सत्त्वगुण से ज्ञान उत्पन्न होता है, रजोगुण से लोभ उत्पन्न होता है, और तमोगुण से प्रमाद, मोह तथा अज्ञान उत्पन्न होते हैं।',
    english = 'From the mode of goodness (sattva), knowledge arises; from the mode of passion (rajas), greed develops; and from the mode of ignorance (tamas) come negligence, delusion, and ignorance.',
    theme = 'three_gunas',
    updated_at = NOW()
WHERE chapter = 14 AND verse = 17;

-- =============================================================================
-- CHAPTER 16, VERSE 4 - Used for Mada (Pride) Journeys
-- Demoniac Qualities
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'दम्भो दर्पोऽभिमानश्च क्रोधः पारुष्यमेव च।
अज्ञानं चाभिजातस्य पार्थ सम्पदमासुरीम्॥',
    transliteration = 'dambho darpo abhimānash ca krodhaḥ pāruṣyam eva ca
ajñānaṁ cābhijātasya pārtha sampadam āsurīm',
    hindi = 'हे पार्थ! दम्भ, घमण्ड, अभिमान, क्रोध, कठोरता और अज्ञान - ये सब आसुरी सम्पदा को प्राप्त हुए मनुष्य के लक्षण हैं।',
    english = 'O Partha, hypocrisy, arrogance, conceit, anger, harshness, and ignorance - these are the qualities belonging to those of demoniac nature.',
    theme = 'divine_demoniac_natures',
    updated_at = NOW()
WHERE chapter = 16 AND verse = 4;

-- =============================================================================
-- CHAPTER 2, VERSE 62 - Kama (Desire/Lust) - Chain of Destruction
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।
सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥',
    transliteration = 'dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate
saṅgāt sañjāyate kāmaḥ kāmāt krodho abhijāyate',
    hindi = 'विषयों का चिंतन करने वाले पुरुष की उनमें आसक्ति हो जाती है, आसक्ति से काम उत्पन्न होता है और काम से क्रोध उत्पन्न होता है।',
    english = 'While contemplating the objects of the senses, a person develops attachment for them; from attachment arises desire, and from desire anger is born.',
    theme = 'desire_attachment',
    updated_at = NOW()
WHERE chapter = 2 AND verse = 62;

-- =============================================================================
-- CHAPTER 2, VERSE 63 - Krodha (Anger) - Destruction of Wisdom
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।
स्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥',
    transliteration = 'krodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ
smṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati',
    hindi = 'क्रोध से मोह उत्पन्न होता है, मोह से स्मृति भ्रष्ट हो जाती है, स्मृति भ्रष्ट होने से बुद्धि का नाश होता है और बुद्धि नष्ट होने से मनुष्य का पतन हो जाता है।',
    english = 'From anger, delusion arises; from delusion, confusion of memory; from confusion of memory, destruction of intelligence; and from destruction of intelligence, one perishes.',
    theme = 'anger_destruction',
    updated_at = NOW()
WHERE chapter = 2 AND verse = 63;

-- =============================================================================
-- CHAPTER 3, VERSE 37 - Origin of Sin (Kama & Krodha)
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'श्रीभगवानुवाच।
काम एष क्रोध एष रजोगुणसमुद्भवः।
महाशनो महापाप्मा विद्ध्येनमिह वैरिणम्॥',
    transliteration = 'śrī-bhagavān uvāca
kāma eṣa krodha eṣa rajo-guṇa-samudbhavaḥ
mahāśano mahā-pāpmā viddhy enam iha vairiṇam',
    hindi = 'श्री भगवान ने कहा - रजोगुण से उत्पन्न यह काम ही क्रोध है। यह बहुत खाने वाला और महापापी है। इसे ही तू इस विषय में वैरी जान।',
    english = 'The Supreme Lord said: It is desire, it is anger, born of the mode of passion, all-devouring and most sinful. Know this to be the enemy here.',
    theme = 'enemy_within',
    updated_at = NOW()
WHERE chapter = 3 AND verse = 37;

-- =============================================================================
-- CHAPTER 7, VERSE 14 - Maya and Liberation (Moha - Delusion)
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'दैवी ह्येषा गुणमयी मम माया दुरत्यया।
मामेव ये प्रपद्यन्ते मायामेतां तरन्ति ते॥',
    transliteration = 'daivī hy eṣā guṇa-mayī mama māyā duratyayā
mām eva ye prapadyante māyām etāṁ taranti te',
    hindi = 'यह मेरी दैवी त्रिगुणमयी माया बड़ी दुस्तर है, परन्तु जो मेरी शरण में आते हैं, वे इस माया को पार कर जाते हैं।',
    english = 'This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who surrender unto Me can easily cross beyond it.',
    theme = 'divine_maya',
    updated_at = NOW()
WHERE chapter = 7 AND verse = 14;

-- =============================================================================
-- CHAPTER 16, VERSE 21 - Three Gates to Hell (Kama, Krodha, Lobha)
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'त्रिविधं नरकस्येदं द्वारं नाशनमात्मनः।
कामः क्रोधस्तथा लोभस्तस्मादेतत्त्रयं त्यजेत्॥',
    transliteration = 'tri-vidhaṁ narakasyedaṁ dvāraṁ nāśanam ātmanaḥ
kāmaḥ krodhas tathā lobhas tasmād etat trayaṁ tyajet',
    hindi = 'काम, क्रोध और लोभ - ये तीन प्रकार के नरक के द्वार आत्मा का नाश करने वाले हैं। इसलिए इन तीनों को त्याग देना चाहिए।',
    english = 'There are three gates leading to hell — desire, anger, and greed. Every sane person should give these up, for they lead to the degradation of the soul.',
    theme = 'three_gates_hell',
    updated_at = NOW()
WHERE chapter = 16 AND verse = 21;

-- =============================================================================
-- CHAPTER 17, VERSE 4 - Matsarya (Envy/Jealousy)
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'यजन्ते सात्त्विका देवान्यक्षरक्षांसि राजसाः।
प्रेतान्भूतगणांश्चान्ये यजन्ते तामसा जनाः॥',
    transliteration = 'yajante sāttvikā devān yakṣa-rakṣāṁsi rājasāḥ
pretān bhūta-gaṇāṁś cānye yajante tāmasā janāḥ',
    hindi = 'सात्त्विक पुरुष देवताओं को पूजते हैं, राजस पुरुष यक्ष और राक्षसों को, और तामस पुरुष प्रेत और भूतगणों को पूजते हैं।',
    english = 'Those in the mode of goodness worship the demigods; those in the mode of passion worship the demons; and those in the mode of ignorance worship ghosts and spirits.',
    theme = 'three_modes_worship',
    updated_at = NOW()
WHERE chapter = 17 AND verse = 4;

-- =============================================================================
-- CHAPTER 12, VERSE 13 - Qualities of a Devotee (Free from Matsarya)
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।
निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
    transliteration = 'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca
nirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī',
    hindi = 'जो किसी से द्वेष नहीं करता, सब प्राणियों का मित्र और करुणामय है, ममता और अहंकार से रहित है, सुख-दुःख में समान रहता है और क्षमाशील है।',
    english = 'One who is free from hatred towards all beings, friendly and compassionate, free from possessiveness and ego, equal in happiness and distress, and forgiving.',
    theme = 'devotee_qualities',
    updated_at = NOW()
WHERE chapter = 12 AND verse = 13;

-- =============================================================================
-- CHAPTER 6, VERSE 5 - Self as Friend or Enemy
-- =============================================================================

UPDATE gita_verses SET
    sanskrit = 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।
आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration = 'uddhared ātmanātmānaṁ nātmānam avasādayet
ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    hindi = 'अपने आप को अपने द्वारा ऊपर उठाना चाहिए, अपने को गिराना नहीं चाहिए। आत्मा ही आत्मा का मित्र है और आत्मा ही आत्मा का शत्रु है।',
    english = 'One must elevate oneself by ones own mind, not degrade oneself. The mind is the friend of the conditioned soul, and the mind can also be its enemy.',
    theme = 'self_elevation',
    updated_at = NOW()
WHERE chapter = 6 AND verse = 5;

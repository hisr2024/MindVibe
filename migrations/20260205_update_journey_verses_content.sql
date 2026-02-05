-- Migration: Update Journey Verses with Actual Sanskrit Content
-- Date: 2026-02-05
-- Description: Updates gita_verses with proper Sanskrit, transliteration, Hindi, and English for verses used in journeys

-- =============================================================================
-- STEP 1: Create unique constraint on (chapter, verse) if it doesn't exist
-- This is required for ON CONFLICT to work
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'gita_verses_chapter_verse_unique'
    ) THEN
        ALTER TABLE gita_verses
        ADD CONSTRAINT gita_verses_chapter_verse_unique
        UNIQUE (chapter, verse);
    END IF;
END $$;

-- =============================================================================
-- CHAPTER 14, VERSE 17 - Used for Lobha (Greed) Journeys
-- Three Modes of Nature (Gunas)
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    14,
    17,
    'सत्त्वात्सञ्जायते ज्ञानं रजसो लोभ एव च।
प्रमादमोहौ तमसो भवतोऽज्ञानमेव च॥',
    'sattvāt sañjāyate jñānaṁ rajaso lobha eva ca
pramāda-mohau tamaso bhavato ''jñānam eva ca',
    'सत्त्वगुण से ज्ञान उत्पन्न होता है, रजोगुण से लोभ उत्पन्न होता है, और तमोगुण से प्रमाद, मोह तथा अज्ञान उत्पन्न होते हैं।',
    'From the mode of goodness (sattva), knowledge arises; from the mode of passion (rajas), greed develops; and from the mode of ignorance (tamas) come negligence, delusion, and ignorance.',
    'three_gunas',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 16, VERSE 4 - Used for Mada (Pride) Journeys
-- Demoniac Qualities
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    16,
    4,
    'दम्भो दर्पोऽभिमानश्च क्रोधः पारुष्यमेव च।
अज्ञानं चाभिजातस्य पार्थ सम्पदमासुरीम्॥',
    'dambho darpo ''bhimānaś ca krodhaḥ pāruṣyam eva ca
ajñānaṁ cābhijātasya pārtha sampadam āsurīm',
    'हे पार्थ! दम्भ, घमण्ड, अभिमान, क्रोध, कठोरता और अज्ञान - ये सब आसुरी सम्पदा को प्राप्त हुए मनुष्य के लक्षण हैं।',
    'O Partha, hypocrisy, arrogance, conceit, anger, harshness, and ignorance - these are the qualities belonging to those of demoniac nature.',
    'divine_demoniac_natures',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 2, VERSE 62 - Kama (Desire/Lust) - Chain of Destruction
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    2,
    62,
    'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।
सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥',
    'dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate
saṅgāt sañjāyate kāmaḥ kāmāt krodho ''bhijāyate',
    'विषयों का चिंतन करने वाले पुरुष की उनमें आसक्ति हो जाती है, आसक्ति से काम उत्पन्न होता है और काम से क्रोध उत्पन्न होता है।',
    'While contemplating the objects of the senses, a person develops attachment for them; from attachment arises desire, and from desire anger is born.',
    'desire_attachment',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 2, VERSE 63 - Krodha (Anger) - Destruction of Wisdom
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    2,
    63,
    'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।
स्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥',
    'krodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ
smṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati',
    'क्रोध से मोह उत्पन्न होता है, मोह से स्मृति भ्रष्ट हो जाती है, स्मृति भ्रष्ट होने से बुद्धि का नाश होता है और बुद्धि नष्ट होने से मनुष्य का पतन हो जाता है।',
    'From anger, delusion arises; from delusion, confusion of memory; from confusion of memory, destruction of intelligence; and from destruction of intelligence, one perishes.',
    'anger_destruction',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 3, VERSE 37 - Origin of Sin (Kama & Krodha)
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    3,
    37,
    'श्रीभगवानुवाच।
काम एष क्रोध एष रजोगुणसमुद्भवः।
महाशनो महापाप्मा विद्ध्येनमिह वैरिणम्॥',
    'śrī-bhagavān uvāca
kāma eṣa krodha eṣa rajo-guṇa-samudbhavaḥ
mahāśano mahā-pāpmā viddhy enam iha vairiṇam',
    'श्री भगवान ने कहा - रजोगुण से उत्पन्न यह काम ही क्रोध है। यह बहुत खाने वाला और महापापी है। इसे ही तू इस विषय में वैरी जान।',
    'The Supreme Lord said: It is desire, it is anger, born of the mode of passion, all-devouring and most sinful. Know this to be the enemy here.',
    'enemy_within',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 7, VERSE 14 - Maya and Liberation (Moha - Delusion)
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    7,
    14,
    'दैवी ह्येषा गुणमयी मम माया दुरत्यया।
मामेव ये प्रपद्यन्ते मायामेतां तरन्ति ते॥',
    'daivī hy eṣā guṇa-mayī mama māyā duratyayā
mām eva ye prapadyante māyām etāṁ taranti te',
    'यह मेरी दैवी त्रिगुणमयी माया बड़ी दुस्तर है, परन्तु जो मेरी शरण में आते हैं, वे इस माया को पार कर जाते हैं।',
    'This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who surrender unto Me can easily cross beyond it.',
    'divine_maya',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 16, VERSE 21 - Three Gates to Hell (Kama, Krodha, Lobha)
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    16,
    21,
    'त्रिविधं नरकस्येदं द्वारं नाशनमात्मनः।
कामः क्रोधस्तथा लोभस्तस्मादेतत्त्रयं त्यजेत्॥',
    'tri-vidhaṁ narakasyedaṁ dvāraṁ nāśanam ātmanaḥ
kāmaḥ krodhas tathā lobhas tasmād etat trayaṁ tyajet',
    'काम, क्रोध और लोभ - ये तीन प्रकार के नरक के द्वार आत्मा का नाश करने वाले हैं। इसलिए इन तीनों को त्याग देना चाहिए।',
    'There are three gates leading to hell — desire, anger, and greed. Every sane person should give these up, for they lead to the degradation of the soul.',
    'three_gates_hell',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 17, VERSE 4 - Matsarya (Envy/Jealousy)
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    17,
    4,
    'यजन्ते सात्त्विका देवान्यक्षरक्षांसि राजसाः।
प्रेतान्भूतगणांश्चान्ये यजन्ते तामसा जनाः॥',
    'yajante sāttvikā devān yakṣa-rakṣāṁsi rājasāḥ
pretān bhūta-gaṇāṁś cānye yajante tāmasā janāḥ',
    'सात्त्विक पुरुष देवताओं को पूजते हैं, राजस पुरुष यक्ष और राक्षसों को, और तामस पुरुष प्रेत और भूतगणों को पूजते हैं।',
    'Those in the mode of goodness worship the demigods; those in the mode of passion worship the demons; and those in the mode of ignorance worship ghosts and spirits.',
    'three_modes_worship',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 12, VERSE 13-14 - Qualities of a Devotee (Free from Matsarya)
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    12,
    13,
    'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।
निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
    'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca
nirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī',
    'जो किसी से द्वेष नहीं करता, सब प्राणियों का मित्र और करुणामय है, ममता और अहंकार से रहित है, सुख-दुःख में समान रहता है और क्षमाशील है।',
    'One who is free from hatred towards all beings, friendly and compassionate, free from possessiveness and ego, equal in happiness and distress, and forgiving.',
    'devotee_qualities',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- =============================================================================
-- CHAPTER 6, VERSE 5 - Self as Friend or Enemy
-- =============================================================================

INSERT INTO gita_verses (chapter, verse, sanskrit, transliteration, hindi, english, theme, created_at, updated_at)
VALUES (
    6,
    5,
    'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।
आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    'uddhared ātmanātmānaṁ nātmānam avasādayet
ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    'अपने आप को अपने द्वारा ऊपर उठाना चाहिए, अपने को गिराना नहीं चाहिए। आत्मा ही आत्मा का मित्र है और आत्मा ही आत्मा का शत्रु है।',
    'One must elevate oneself by one''s own mind, not degrade oneself. The mind is the friend of the conditioned soul, and the mind can also be its enemy.',
    'self_elevation',
    NOW(),
    NOW()
)
ON CONFLICT (chapter, verse)
DO UPDATE SET
    sanskrit = EXCLUDED.sanskrit,
    transliteration = EXCLUDED.transliteration,
    hindi = EXCLUDED.hindi,
    english = EXCLUDED.english,
    theme = EXCLUDED.theme,
    updated_at = NOW();

-- Verify the updates
SELECT chapter, verse,
       LEFT(sanskrit, 50) as sanskrit_preview,
       LEFT(english, 50) as english_preview,
       theme
FROM gita_verses
WHERE (chapter = 14 AND verse = 17)
   OR (chapter = 16 AND verse = 4)
   OR (chapter = 2 AND verse IN (62, 63))
   OR (chapter = 3 AND verse = 37)
ORDER BY chapter, verse;

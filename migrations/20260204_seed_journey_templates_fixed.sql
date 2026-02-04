-- Seed Journey Templates for Six Inner Enemies (Shadripu)
-- Migration: 20260204_seed_journey_templates_fixed.sql
--
-- FIXED: Added ::jsonb casts to all JSON columns
--
-- This migration seeds 13 comprehensive journey templates with all steps:
-- - 2 Kama (Desire) journeys: 14-day and 21-day
-- - 2 Krodha (Anger) journeys: 7-day and 14-day
-- - 2 Lobha (Greed) journeys: 14-day and 21-day
-- - 2 Moha (Delusion) journeys: 14-day and 28-day
-- - 2 Mada (Pride) journeys: 14-day and 21-day
-- - 2 Matsarya (Envy) journeys: 7-day and 14-day
-- - 1 Combined (All Six) journey: 42-day

-- Add is_free column if not exists
ALTER TABLE journey_templates ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- KAMA (Desire) - 14 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-kama-14d',
    'master-desires-14d',
    'Master Your Desires - Finding True Contentment',
    'A 14-day journey to understand and transform unhealthy desires through the wisdom of the Bhagavad Gita. Learn to find lasting contentment beyond fleeting pleasures.',
    '["kama"]'::jsonb,
    14,
    3,
    true,
    true,
    true,
    'flame',
    '#EF4444'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Kama 14-day steps
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
VALUES
    ('jts-kama-14d-01', 'jt-kama-14d', 1, 'Day 1: Recognizing Desire''s Pull', 'Today we recognize how desire arises in the mind without judgment. The Gita teaches that desire is the root cause of suffering when uncontrolled.', 'What desires arose today? What would remain if they were fulfilled?', 'When desire arises, take 3 breaths and ask: "Is this a true need or a passing want?"', '{"tags": ["desire", "craving", "detachment"], "max_verses": 2}'::jsonb, '[{"chapter": 3, "verse": 37}]'::jsonb, NULL),
    ('jts-kama-14d-02', 'jt-kama-14d', 2, 'Day 2: Recognizing Desire''s Pull', 'Continue observing how desire manifests in thoughts, speech, and action.', 'Notice which desires feel urgent vs. which feel calm. What patterns do you see?', 'Before acting on any desire today, pause and count to 10.', '{"tags": ["desire", "awareness", "mindfulness"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-03', 'jt-kama-14d', 3, 'Day 3: Recognizing Desire''s Pull', 'Observe desire without suppression or indulgence - the middle path of awareness.', 'What desires did you observe today? Did any surprise you?', 'Practice naming desires as they arise: "This is desire for pleasure/comfort/validation."', '{"tags": ["desire", "equanimity"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-04', 'jt-kama-14d', 4, 'Day 4: The Root of Craving', 'Explore what underlying needs your desires are trying to fulfill. Often desire masks deeper needs.', 'Behind your strongest desire, what deeper need exists? Security? Love? Recognition?', 'Journal about one recurring desire and its possible root cause.', '{"tags": ["desire", "craving", "self-knowledge"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 62}]'::jsonb, NULL),
    ('jts-kama-14d-05', 'jt-kama-14d', 5, 'Day 5: The Root of Craving', 'The Gita teaches that attachment to sense objects creates a chain: attachment → desire → anger → delusion.', 'Trace a recent desire back to its origin. What triggered it?', 'When desire arises, ask: "What am I really seeking?"', '{"tags": ["desire", "attachment", "wisdom"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 63}]'::jsonb, NULL),
    ('jts-kama-14d-06', 'jt-kama-14d', 6, 'Day 6: The Root of Craving', 'Understanding the impermanent nature of sense pleasures helps release their grip.', 'Has fulfilling a desire ever brought lasting satisfaction? Reflect honestly.', 'Notice one fulfilled desire today and observe how quickly the satisfaction fades.', '{"tags": ["desire", "impermanence", "contentment"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-07', 'jt-kama-14d', 7, 'Day 7: Cultivating Contentment', 'Practice pausing between desire and action, creating space for wisdom to arise.', 'How does it feel to pause before acting on desire? What do you notice in the gap?', 'Today, delay gratification of one small desire by 1 hour. Observe what happens.', '{"tags": ["contentment", "patience", "self-control"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 55}]'::jsonb, NULL),
    ('jts-kama-14d-08', 'jt-kama-14d', 8, 'Day 8: Cultivating Contentment', 'Santosha (contentment) is finding fullness in the present moment without needing more.', 'What do you already have that brings genuine contentment?', 'Spend 10 minutes appreciating something you already possess.', '{"tags": ["contentment", "gratitude", "peace"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-09', 'jt-kama-14d', 9, 'Day 9: Cultivating Contentment', 'True contentment comes from within, not from external acquisitions.', 'If you had nothing external, what would remain? What is your unchanging essence?', 'Practice gratitude for 5 non-material blessings in your life.', '{"tags": ["contentment", "inner-peace", "detachment"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-10', 'jt-kama-14d', 10, 'Day 10: Freedom from Attachment', 'Notice how contentment feels different from satisfaction of desire - one is lasting, one is fleeting.', 'Compare the feeling of contentment vs. satisfied desire. What differences do you notice?', 'When desire arises, consciously choose contentment instead. Notice the freedom.', '{"tags": ["detachment", "freedom", "contentment"], "max_verses": 2}'::jsonb, '[{"chapter": 5, "verse": 22}]'::jsonb, NULL),
    ('jts-kama-14d-11', 'jt-kama-14d', 11, 'Day 11: Freedom from Attachment', 'Vairagya (detachment) is not suppression but a natural falling away of unnecessary desires.', 'What desires have naturally fallen away as you''ve grown? What made them release?', 'Identify one attachment you''re ready to loosen. Take one small step toward release.', '{"tags": ["detachment", "vairagya", "freedom"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-12', 'jt-kama-14d', 12, 'Day 12: Freedom from Attachment', 'The wise act without attachment to results, finding freedom in action itself.', 'Can you act today without attachment to the outcome? What would that feel like?', 'Complete one task today purely for its own sake, without concern for results.', '{"tags": ["karma-yoga", "detachment", "action"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 47}]'::jsonb, NULL),
    ('jts-kama-14d-13', 'jt-kama-14d', 13, 'Day 13: Living in Sufficiency', 'Embody the teaching that true happiness comes from within, not from objects.', 'What would your life look like if you lived from sufficiency rather than scarcity?', 'Today, whenever you think "I need...", replace it with "I have enough."', '{"tags": ["sufficiency", "contentment", "peace"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-kama-14d-14', 'jt-kama-14d', 14, 'Day 14: Living in Sufficiency', 'Integration day: Carry forward the wisdom of contentment into your daily life.', 'What is the most valuable insight you''ve gained about desire in these 14 days?', 'Write a commitment to yourself about how you will relate to desire going forward.', '{"tags": ["integration", "wisdom", "contentment"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 70}]'::jsonb, NULL)
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    reflection_prompt = EXCLUDED.reflection_prompt,
    practice_prompt = EXCLUDED.practice_prompt,
    updated_at = NOW();

-- =============================================================================
-- KAMA (Desire) - 21 Day Journey (Premium)
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-kama-21d',
    'beyond-craving-21d',
    'Beyond Craving - The Path to Inner Peace',
    'A deeper 21-day exploration into the nature of desire. Discover how attachment to outcomes creates suffering and learn practices for cultivating vairagya (detachment).',
    '["kama"]'::jsonb,
    21,
    4,
    true,
    false,
    false,
    'lotus',
    '#DC2626'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 21 steps for Kama 21-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-kama-21d-' || LPAD(day::text, 2, '0'),
    'jt-kama-21d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 4 THEN 'Awakening to Desire'
        WHEN day <= 8 THEN 'Understanding Craving''s Nature'
        WHEN day <= 13 THEN 'Practicing Detachment'
        WHEN day <= 17 THEN 'Integrating Wisdom'
        ELSE 'Mastering Contentment'
    END,
    CASE
        WHEN day <= 4 THEN 'Today we deepen our awareness of how desire operates in subtle ways.'
        WHEN day <= 8 THEN 'Explore the mechanics of craving and its effects on peace of mind.'
        WHEN day <= 13 THEN 'Practice vairagya through conscious non-attachment.'
        WHEN day <= 17 THEN 'Integrate the wisdom of desirelessness into daily activities.'
        ELSE 'Embody the state of one who is content, requiring nothing external for happiness.'
    END,
    'What patterns of desire have you noticed today? How do they affect your inner peace?',
    'Take 5 minutes of silent meditation, observing desires without engaging them.',
    '{"tags": ["desire", "craving", "detachment", "contentment"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 3, "verse": 37}]'::jsonb ELSE NULL END,
    NULL
FROM generate_series(1, 21) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- KRODHA (Anger) - 7 Day Journey (Quick Start)
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-krodha-7d',
    'patient-heart-7d',
    'The Patient Heart - 7 Days to Calm',
    'A quick but powerful 7-day journey for those seeking immediate relief from anger patterns. Build foundational practices for emotional regulation.',
    '["krodha"]'::jsonb,
    7,
    2,
    true,
    false,
    true,
    'heart',
    '#EA580C'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Krodha 7-day steps
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
VALUES
    ('jts-krodha-7d-01', 'jt-krodha-7d', 1, 'Day 1: The Fire Within', 'Today we observe anger as energy, without suppressing or acting on it. The Gita teaches that anger clouds judgment.', 'When did anger arise today? What was it trying to protect?', 'When anger arises, ground through your feet and take 5 slow breaths before speaking.', '{"tags": ["anger", "peace", "patience"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 63}]'::jsonb, 'If experiencing intense anger, practice grounding before reflection.'),
    ('jts-krodha-7d-02', 'jt-krodha-7d', 2, 'Day 2: The Fire Within', 'Notice the physical sensations of anger - heat, tension, rapid heartbeat. These are signals, not commands.', 'Where do you feel anger in your body? What does it feel like physically?', 'When you feel anger rising, place your hand on your heart and breathe deeply.', '{"tags": ["anger", "awareness", "body"], "max_verses": 2}'::jsonb, NULL, 'If experiencing intense anger, practice grounding before reflection.'),
    ('jts-krodha-7d-03', 'jt-krodha-7d', 3, 'Day 3: Anger''s Hidden Message', 'Explore what underlying hurt or fear triggers your anger responses. Anger often protects vulnerability.', 'Beneath your anger, what feeling is being protected? Fear? Hurt? Shame?', 'Journal about a recent anger episode. What was the deeper feeling beneath it?', '{"tags": ["anger", "fear", "vulnerability"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 56}]'::jsonb, NULL),
    ('jts-krodha-7d-04', 'jt-krodha-7d', 4, 'Day 4: The Pause Before Response', 'Practice the sacred pause - the space between stimulus and response where wisdom lives.', 'How does it feel to pause before reacting? What possibilities open up in that space?', 'Today, count to 10 before responding to anything that triggers frustration.', '{"tags": ["patience", "self-control", "wisdom"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-krodha-7d-05', 'jt-krodha-7d', 5, 'Day 5: Transforming Fire to Light', 'Learn to express boundaries firmly but without the fire of anger. Assertiveness without aggression.', 'Can you imagine expressing a boundary calmly and clearly? How would that feel?', 'Practice saying "No" to something today with firmness but without anger.', '{"tags": ["boundaries", "peace", "strength"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-krodha-7d-06', 'jt-krodha-7d', 6, 'Day 6: Cultivating Patience', 'Kshama (patience/forgiveness) is the antidote to anger. It creates space for understanding.', 'Who or what situation requires your patience right now?', 'Choose one frustrating situation and practice patience with it today.', '{"tags": ["patience", "forgiveness", "peace"], "max_verses": 2}'::jsonb, '[{"chapter": 16, "verse": 3}]'::jsonb, NULL),
    ('jts-krodha-7d-07', 'jt-krodha-7d', 7, 'Day 7: Equanimity in Action', 'Embody equanimity - responding wisely to all situations with clarity rather than reactivity.', 'What is the most valuable insight you''ve gained about anger in these 7 days?', 'Write a commitment to yourself about how you will respond to anger triggers going forward.', '{"tags": ["equanimity", "wisdom", "peace"], "max_verses": 2}'::jsonb, '[{"chapter": 2, "verse": 64}]'::jsonb, NULL)
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    reflection_prompt = EXCLUDED.reflection_prompt,
    practice_prompt = EXCLUDED.practice_prompt,
    updated_at = NOW();

-- =============================================================================
-- KRODHA (Anger) - 14 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-krodha-14d',
    'transform-anger-14d',
    'Transform Your Anger - Cultivating Peace',
    'A transformative 14-day journey from reactive anger to responsive wisdom. Learn to recognize anger''s roots and transmute it into clarity and compassion.',
    '["krodha"]'::jsonb,
    14,
    3,
    true,
    true,
    true,
    'peace',
    '#F97316'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 14 steps for Krodha 14-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-krodha-14d-' || LPAD(day::text, 2, '0'),
    'jt-krodha-14d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 3 THEN 'The Fire Within'
        WHEN day <= 6 THEN 'Anger''s Hidden Message'
        WHEN day <= 9 THEN 'The Pause Before Response'
        WHEN day <= 12 THEN 'Transforming Fire to Light'
        ELSE 'Equanimity in Action'
    END,
    CASE
        WHEN day <= 3 THEN 'Today we observe anger as energy, without suppressing or acting on it.'
        WHEN day <= 6 THEN 'Explore what underlying hurt or fear triggers your anger responses.'
        WHEN day <= 9 THEN 'Practice the sacred pause - the space between stimulus and response.'
        WHEN day <= 12 THEN 'Learn to express boundaries firmly but without the fire of anger.'
        ELSE 'Embody equanimity - responding wisely to all situations with clarity.'
    END,
    'When did anger arise today? What was it trying to protect?',
    'When anger arises, ground through your feet and take 5 slow breaths before speaking.',
    '{"tags": ["anger", "peace", "patience", "equanimity"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 2, "verse": 63}]'::jsonb ELSE NULL END,
    CASE WHEN day <= 3 THEN 'If experiencing intense anger, practice grounding before reflection.' ELSE NULL END
FROM generate_series(1, 14) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- LOBHA (Greed) - 14 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-lobha-14d',
    'greed-to-generosity-14d',
    'From Greed to Generosity - The Giving Path',
    'Transform the energy of wanting into the joy of giving. This 14-day journey helps you discover that true abundance comes from sharing, not hoarding.',
    '["lobha"]'::jsonb,
    14,
    3,
    true,
    true,
    true,
    'gift',
    '#22C55E'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 14 steps for Lobha 14-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-lobha-14d-' || LPAD(day::text, 2, '0'),
    'jt-lobha-14d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 3 THEN 'The Hunger for More'
        WHEN day <= 6 THEN 'Why Enough is Never Enough'
        WHEN day <= 9 THEN 'The Art of Appreciation'
        WHEN day <= 12 THEN 'Giving as Liberation'
        ELSE 'Abundance in Simplicity'
    END,
    CASE
        WHEN day <= 3 THEN 'Today we observe the mind''s tendency to accumulate and hold.'
        WHEN day <= 6 THEN 'Explore what insecurity or fear drives the need for more.'
        WHEN day <= 9 THEN 'Practice gratitude for what you have before seeking what you don''t.'
        WHEN day <= 12 THEN 'Experience the joy of giving without expectation of return.'
        ELSE 'Embody the truth that richness comes from appreciation, not accumulation.'
    END,
    'What felt like "not enough" today? What would truly satisfy you?',
    'List 10 things you''re grateful for. Give something away today without keeping score.',
    '{"tags": ["greed", "contentment", "generosity", "giving"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 14, "verse": 17}]'::jsonb ELSE NULL END,
    NULL
FROM generate_series(1, 14) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- LOBHA (Greed) - 21 Day Journey (Premium)
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-lobha-21d',
    'cultivating-contentment-21d',
    'Cultivating Contentment - Enough is Abundance',
    'A 21-day deep dive into santosha (contentment). Learn why the mind''s "more" never satisfies and discover the freedom of appreciating what you already have.',
    '["lobha"]'::jsonb,
    21,
    4,
    true,
    false,
    false,
    'balance',
    '#16A34A'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 21 steps for Lobha 21-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-lobha-21d-' || LPAD(day::text, 2, '0'),
    'jt-lobha-21d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 4 THEN 'Recognizing Scarcity Mindset'
        WHEN day <= 8 THEN 'The Fear Behind Accumulation'
        WHEN day <= 13 THEN 'Practicing Gratitude'
        WHEN day <= 17 THEN 'The Joy of Giving'
        ELSE 'Living in Abundance'
    END,
    CASE
        WHEN day <= 4 THEN 'Observe how the mind creates feelings of lack and insufficiency.'
        WHEN day <= 8 THEN 'Explore what fears drive the compulsion to accumulate and hold.'
        WHEN day <= 13 THEN 'Cultivate deep appreciation for what is already present.'
        WHEN day <= 17 THEN 'Discover liberation through generous giving without attachment.'
        ELSE 'Embody the wisdom that true wealth is contentment with what is.'
    END,
    'Where did scarcity thinking arise today? What triggered the feeling of "not enough"?',
    'Give something away today - time, attention, or a material item - without expectation.',
    '{"tags": ["greed", "contentment", "generosity", "abundance"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 14, "verse": 17}]'::jsonb ELSE NULL END,
    NULL
FROM generate_series(1, 21) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- MOHA (Delusion) - 14 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-moha-14d',
    'clarity-wisdom-14d',
    'Clarity Through Wisdom - Dispelling Illusion',
    'A 14-day journey from confusion to clarity. Learn to see through the fog of attachment and make decisions from a place of wisdom rather than emotional reactivity.',
    '["moha"]'::jsonb,
    14,
    3,
    true,
    true,
    true,
    'eye',
    '#8B5CF6'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 14 steps for Moha 14-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-moha-14d-' || LPAD(day::text, 2, '0'),
    'jt-moha-14d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 3 THEN 'The Fog of Confusion'
        WHEN day <= 6 THEN 'What We Mistake for Truth'
        WHEN day <= 9 THEN 'Cultivating Discernment'
        WHEN day <= 12 THEN 'Seeing Clearly'
        ELSE 'Wisdom in Action'
    END,
    CASE
        WHEN day <= 3 THEN 'Today we recognize where attachment clouds our perception.'
        WHEN day <= 6 THEN 'Explore what beliefs you hold that may not serve your highest good.'
        WHEN day <= 9 THEN 'Practice viveka - distinguishing the real from the unreal.'
        WHEN day <= 12 THEN 'Learn to see situations clearly, free from personal desire.'
        ELSE 'Embody wisdom that sees beyond surface appearances to underlying truth.'
    END,
    'Where did confusion arise today? What clarity might you be avoiding?',
    'Before making a decision, ask: "Am I seeing this clearly, or through the lens of attachment?"',
    '{"tags": ["delusion", "clarity", "wisdom", "discernment"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 2, "verse": 52}]'::jsonb ELSE NULL END,
    CASE WHEN day >= 10 THEN 'This work can bring up challenging emotions. Be gentle with yourself.' ELSE NULL END
FROM generate_series(1, 14) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- MOHA (Delusion) - 28 Day Journey (Advanced)
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-moha-28d',
    'breaking-free-illusion-28d',
    'Breaking Free from Illusion - The Awakening',
    'A comprehensive 28-day journey for those ready to examine their deepest attachments and self-deceptions. This advanced path requires courage and commitment.',
    '["moha"]'::jsonb,
    28,
    5,
    true,
    false,
    false,
    'sun',
    '#7C3AED'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 28 steps for Moha 28-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-moha-28d-' || LPAD(day::text, 2, '0'),
    'jt-moha-28d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 6 THEN 'Recognizing Illusion'
        WHEN day <= 11 THEN 'Questioning Beliefs'
        WHEN day <= 17 THEN 'Developing Viveka'
        WHEN day <= 23 THEN 'Integrating Clarity'
        ELSE 'Awakened Living'
    END,
    CASE
        WHEN day <= 6 THEN 'Begin to see how the mind creates narratives that obscure truth.'
        WHEN day <= 11 THEN 'Question long-held beliefs with compassionate curiosity.'
        WHEN day <= 17 THEN 'Strengthen the faculty of discernment between real and unreal.'
        WHEN day <= 23 THEN 'Apply clarity to relationships, decisions, and daily living.'
        ELSE 'Live from awakened awareness, free from the fog of delusion.'
    END,
    'What illusion did you become aware of today? What truth was it hiding?',
    'Spend 15 minutes in silent inquiry: "What is really true here?"',
    '{"tags": ["delusion", "clarity", "wisdom", "awakening"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 2, "verse": 52}]'::jsonb ELSE NULL END,
    'This advanced work may surface deep patterns. Seek support if needed.'
FROM generate_series(1, 28) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- MADA (Pride/Ego) - 14 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-mada-14d',
    'humble-path-14d',
    'The Humble Path - Releasing Ego',
    'A 14-day journey into authentic humility. Learn to recognize ego''s subtle defenses and discover the strength that comes from surrendering the need to be right.',
    '["mada"]'::jsonb,
    14,
    3,
    true,
    true,
    true,
    'bow',
    '#06B6D4'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 14 steps for Mada 14-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-mada-14d-' || LPAD(day::text, 2, '0'),
    'jt-mada-14d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 3 THEN 'The Shield of Pride'
        WHEN day <= 6 THEN 'What Ego Protects'
        WHEN day <= 9 THEN 'The Strength in Humility'
        WHEN day <= 12 THEN 'Service as Medicine'
        ELSE 'Confident Surrender'
    END,
    CASE
        WHEN day <= 3 THEN 'Today we observe how ego defends its sense of superiority or specialness.'
        WHEN day <= 6 THEN 'Explore what vulnerability ego is protecting you from feeling.'
        WHEN day <= 9 THEN 'Practice asking for help and admitting "I don''t know" without shame.'
        WHEN day <= 12 THEN 'Discover that serving others dissolves the isolation of self-centeredness.'
        ELSE 'Embody the paradox: true confidence comes from surrender, not assertion.'
    END,
    'Where did ego show up today? What would happen if you let go of being right?',
    'Today, ask for help with something. Notice the discomfort and stay with it.',
    '{"tags": ["pride", "ego", "humility", "surrender"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 16, "verse": 4}]'::jsonb ELSE NULL END,
    NULL
FROM generate_series(1, 14) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- MADA (Pride/Ego) - 21 Day Journey (Premium)
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-mada-21d',
    'ego-to-service-21d',
    'From Ego to Service - The Selfless Way',
    'A 21-day transformation from self-centered living to service-oriented purpose. Discover how helping others dissolves the suffering caused by excessive ego.',
    '["mada"]'::jsonb,
    21,
    4,
    true,
    false,
    false,
    'hands',
    '#0891B2'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 21 steps for Mada 21-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-mada-21d-' || LPAD(day::text, 2, '0'),
    'jt-mada-21d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 4 THEN 'Recognizing Ego''s Patterns'
        WHEN day <= 8 THEN 'The Vulnerability Beneath'
        WHEN day <= 13 THEN 'Practicing Humility'
        WHEN day <= 17 THEN 'Discovering Service'
        ELSE 'Selfless Living'
    END,
    CASE
        WHEN day <= 4 THEN 'Observe how ego operates through comparison, defense, and seeking validation.'
        WHEN day <= 8 THEN 'Gently explore the fears and wounds that ego tries to protect.'
        WHEN day <= 13 THEN 'Build the muscle of humility through intentional practice.'
        WHEN day <= 17 THEN 'Experience how serving others naturally dissolves self-centeredness.'
        ELSE 'Integrate selfless living as a natural expression of your true nature.'
    END,
    'How did ego create separation today? What connection was lost?',
    'Perform one act of service today without anyone knowing. Notice how it feels.',
    '{"tags": ["pride", "ego", "humility", "service"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 16, "verse": 4}]'::jsonb ELSE NULL END,
    NULL
FROM generate_series(1, 21) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- MATSARYA (Jealousy/Envy) - 7 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-matsarya-7d',
    'envy-to-empathy-7d',
    'From Envy to Empathy - The Compassionate Heart',
    'A focused 7-day journey for quick relief from the pain of envy. Build the foundational practices of compassion and appreciation that transform comparison into connection.',
    '["matsarya"]'::jsonb,
    7,
    2,
    true,
    false,
    true,
    'heart-hands',
    '#DB2777'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Matsarya 7-day steps
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
VALUES
    ('jts-matsarya-7d-01', 'jt-matsarya-7d', 1, 'Day 1: The Pain of Comparison', 'Today we recognize envy as information about our own unfulfilled desires.', 'Whose success triggered discomfort today? What does this teach you about your own desires?', 'When you feel envy, say: "Their success shows what''s possible. May they flourish."', '{"tags": ["envy", "jealousy", "comparison"], "max_verses": 2}'::jsonb, '[{"chapter": 12, "verse": 13}]'::jsonb, NULL),
    ('jts-matsarya-7d-02', 'jt-matsarya-7d', 2, 'Day 2: The Pain of Comparison', 'Notice how comparison steals joy from the present moment.', 'How does comparison affect your peace of mind? What gets lost?', 'Each time you compare yourself to someone, pause and appreciate one of your own gifts.', '{"tags": ["envy", "peace", "gratitude"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-matsarya-7d-03', 'jt-matsarya-7d', 3, 'Day 3: What Envy Reveals', 'Explore what you truly want that you see in others'' success.', 'What do you really want that you see reflected in others? Is it achievable for you too?', 'Journal about a desire that envy has revealed. How might you pursue it yourself?', '{"tags": ["envy", "self-knowledge", "desire"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-matsarya-7d-04', 'jt-matsarya-7d', 4, 'Day 4: Mudita - Sympathetic Joy', 'Practice mudita - genuinely celebrating others'' joy and success.', 'Can you feel happy for someone else''s good fortune today? What does that feel like?', 'Consciously celebrate three people''s successes today, even small ones.', '{"tags": ["joy", "mudita", "celebration"], "max_verses": 2}'::jsonb, '[{"chapter": 12, "verse": 17}]'::jsonb, NULL),
    ('jts-matsarya-7d-05', 'jt-matsarya-7d', 5, 'Day 5: Celebrating Others', 'Learn that another''s gain doesn''t diminish your own possibilities.', 'Does someone else''s success actually take anything from you?', 'Send a genuine congratulations to someone whose success you''ve envied.', '{"tags": ["celebration", "abundance", "connection"], "max_verses": 2}'::jsonb, NULL, NULL),
    ('jts-matsarya-7d-06', 'jt-matsarya-7d', 6, 'Day 6: Your Unique Path', 'Recognize that your journey is incomparable - you are walking your own dharma.', 'What is unique about your path that no one else can walk?', 'List 10 things that make your journey uniquely yours.', '{"tags": ["dharma", "uniqueness", "purpose"], "max_verses": 2}'::jsonb, '[{"chapter": 3, "verse": 35}]'::jsonb, NULL),
    ('jts-matsarya-7d-07', 'jt-matsarya-7d', 7, 'Day 7: One in All', 'Embody the understanding that we are all connected; their success is our success.', 'What is the most valuable insight you''ve gained about envy in these 7 days?', 'Write a commitment to yourself about how you will respond to envy going forward.', '{"tags": ["unity", "connection", "compassion"], "max_verses": 2}'::jsonb, '[{"chapter": 6, "verse": 29}]'::jsonb, NULL)
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    reflection_prompt = EXCLUDED.reflection_prompt,
    practice_prompt = EXCLUDED.practice_prompt,
    updated_at = NOW();

-- =============================================================================
-- MATSARYA (Jealousy/Envy) - 14 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-matsarya-14d',
    'celebrating-joy-14d',
    'Celebrating Others'' Joy - Beyond Envy',
    'A 14-day journey from comparison to celebration. Learn the practice of mudita (sympathetic joy) and discover that others'' success doesn''t diminish your own.',
    '["matsarya"]'::jsonb,
    14,
    3,
    true,
    true,
    true,
    'celebrate',
    '#EC4899'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 14 steps for Matsarya 14-day journey
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-matsarya-14d-' || LPAD(day::text, 2, '0'),
    'jt-matsarya-14d',
    day,
    'Day ' || day || ': ' || CASE
        WHEN day <= 3 THEN 'The Pain of Comparison'
        WHEN day <= 6 THEN 'What Envy Reveals'
        WHEN day <= 9 THEN 'Mudita - Sympathetic Joy'
        WHEN day <= 12 THEN 'Celebrating Others'
        ELSE 'One in All'
    END,
    CASE
        WHEN day <= 3 THEN 'Today we recognize envy as information about our own unfulfilled desires.'
        WHEN day <= 6 THEN 'Explore what you truly want that you see in others'' success.'
        WHEN day <= 9 THEN 'Practice mudita - genuinely celebrating others'' joy and success.'
        WHEN day <= 12 THEN 'Learn that another''s gain doesn''t diminish your own possibilities.'
        ELSE 'Embody the understanding that we are all connected; their success is our success.'
    END,
    'Whose success triggered discomfort today? What does this teach you about your own desires?',
    'When you feel envy, say: "Their success shows what''s possible. May they flourish."',
    '{"tags": ["envy", "jealousy", "joy", "compassion"], "max_verses": 2}'::jsonb,
    CASE WHEN day = 1 THEN '[{"chapter": 12, "verse": 13}]'::jsonb ELSE NULL END,
    NULL
FROM generate_series(1, 14) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    updated_at = NOW();

-- =============================================================================
-- COMBINED (All Six Enemies) - 42 Day Journey
-- =============================================================================
INSERT INTO journey_templates (id, slug, title, description, primary_enemy_tags, duration_days, difficulty, is_active, is_featured, is_free, icon_name, color_theme)
VALUES (
    'jt-combined-42d',
    'conquer-all-six-enemies-42d',
    'Conquer All Six Enemies - The Complete Transformation',
    'The ultimate 42-day journey through all six inner enemies. Spend one week on each Shadripu, building comprehensive mastery over desire, anger, greed, delusion, pride, and envy.',
    '["kama", "krodha", "lobha", "moha", "mada", "matsarya"]'::jsonb,
    42,
    5,
    true,
    true,
    false,
    'crown',
    '#6366F1'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Generate 42 steps for Combined journey (7 days per enemy)
INSERT INTO journey_template_steps (id, journey_template_id, day_index, step_title, teaching_hint, reflection_prompt, practice_prompt, verse_selector, static_verse_refs, safety_notes)
SELECT
    'jts-combined-42d-' || LPAD(day::text, 2, '0'),
    'jt-combined-42d',
    day,
    'Day ' || day || ' (' || CASE
        WHEN day <= 7 THEN 'Kama'
        WHEN day <= 14 THEN 'Krodha'
        WHEN day <= 21 THEN 'Lobha'
        WHEN day <= 28 THEN 'Moha'
        WHEN day <= 35 THEN 'Mada'
        ELSE 'Matsarya'
    END || '): ' || CASE
        WHEN day <= 7 THEN 'Mastering Desire'
        WHEN day <= 14 THEN 'Transforming Anger'
        WHEN day <= 21 THEN 'Releasing Greed'
        WHEN day <= 28 THEN 'Dispelling Delusion'
        WHEN day <= 35 THEN 'Humbling Pride'
        ELSE 'Transcending Envy'
    END,
    CASE
        WHEN day <= 7 THEN 'This week we work with Kama (desire). Observe how wanting drives the mind.'
        WHEN day <= 14 THEN 'This week we work with Krodha (anger). Notice reactive patterns without judgment.'
        WHEN day <= 21 THEN 'This week we work with Lobha (greed). Explore the mind''s hunger for more.'
        WHEN day <= 28 THEN 'This week we work with Moha (delusion). Seek clarity beyond confusion.'
        WHEN day <= 35 THEN 'This week we work with Mada (pride). Practice authentic humility.'
        ELSE 'This week we work with Matsarya (envy). Celebrate others'' joy as your own.'
    END,
    CASE
        WHEN day <= 7 THEN 'What desires arose today? What would remain if they were fulfilled?'
        WHEN day <= 14 THEN 'When did anger arise today? What was it trying to protect?'
        WHEN day <= 21 THEN 'What felt like "not enough" today? What would truly satisfy you?'
        WHEN day <= 28 THEN 'Where did confusion arise today? What clarity might you be avoiding?'
        WHEN day <= 35 THEN 'Where did ego show up today? What would happen if you let go of being right?'
        ELSE 'Whose success triggered discomfort today? What does this teach you about your desires?'
    END,
    CASE
        WHEN day <= 7 THEN 'When desire arises, take 3 breaths and ask: "Is this a true need or a passing want?"'
        WHEN day <= 14 THEN 'When anger arises, ground through your feet and take 5 slow breaths.'
        WHEN day <= 21 THEN 'List 10 things you''re grateful for. Give something away today.'
        WHEN day <= 28 THEN 'Before making a decision, ask: "Am I seeing this clearly?"'
        WHEN day <= 35 THEN 'Ask for help with something today. Notice the discomfort and stay with it.'
        ELSE 'When you feel envy, say: "Their success shows what''s possible. May they flourish."'
    END,
    CASE
        WHEN day <= 7 THEN '{"tags": ["desire", "craving", "detachment"], "max_verses": 2}'::jsonb
        WHEN day <= 14 THEN '{"tags": ["anger", "peace", "patience"], "max_verses": 2}'::jsonb
        WHEN day <= 21 THEN '{"tags": ["greed", "contentment", "generosity"], "max_verses": 2}'::jsonb
        WHEN day <= 28 THEN '{"tags": ["delusion", "clarity", "wisdom"], "max_verses": 2}'::jsonb
        WHEN day <= 35 THEN '{"tags": ["pride", "humility", "surrender"], "max_verses": 2}'::jsonb
        ELSE '{"tags": ["envy", "joy", "compassion"], "max_verses": 2}'::jsonb
    END,
    CASE
        WHEN day = 1 THEN '[{"chapter": 3, "verse": 37}]'::jsonb
        WHEN day = 8 THEN '[{"chapter": 2, "verse": 63}]'::jsonb
        WHEN day = 15 THEN '[{"chapter": 14, "verse": 17}]'::jsonb
        WHEN day = 22 THEN '[{"chapter": 2, "verse": 52}]'::jsonb
        WHEN day = 29 THEN '[{"chapter": 16, "verse": 4}]'::jsonb
        WHEN day = 36 THEN '[{"chapter": 12, "verse": 13}]'::jsonb
        ELSE NULL
    END,
    NULL
FROM generate_series(1, 42) AS day
ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
    step_title = EXCLUDED.step_title,
    teaching_hint = EXCLUDED.teaching_hint,
    reflection_prompt = EXCLUDED.reflection_prompt,
    practice_prompt = EXCLUDED.practice_prompt,
    updated_at = NOW();

-- =============================================================================
-- Verify seeding
-- =============================================================================
DO $$
DECLARE
    template_count INTEGER;
    step_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM journey_templates;
    SELECT COUNT(*) INTO step_count FROM journey_template_steps;

    RAISE NOTICE 'Journey Templates seeded: % templates, % steps', template_count, step_count;
END $$;

-- Add helpful comments
COMMENT ON TABLE journey_templates IS 'Guided journey templates based on the Six Inner Enemies (Shadripu) from Bhagavad Gita wisdom';

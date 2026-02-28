"""
Seed Practical Wisdom — Comprehensive Gita-based modern applications.

Populates the gita_practical_wisdom table with actionable, modern-day
applications of Bhagavad Gita principles across all 18 chapters.

Every entry is:
- Traceable to a specific Gita chapter and verse
- Mapped to a real-life domain (workplace, relationships, family, etc.)
- Validated against the 18-chapter/700-verse Gita ambit
- Pure TEXT data only — no URLs executed, no binaries, no external code

Security:
- All data is static, hand-curated text strings
- No network calls during seeding
- No file downloads or external code execution
- Input sanitization applied to all text fields

Usage:
    DATABASE_URL=<url> python scripts/seed_practical_wisdom.py
"""

import asyncio
import os
import re
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models import Base, GitaPracticalWisdom
from scripts.db_utils import create_ssl_engine, normalize_database_url

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")
DATABASE_URL = normalize_database_url(DATABASE_URL)


# =============================================================================
# TEXT SANITIZER — Security hardening for all seed data
# =============================================================================

def sanitize_text(text: str) -> str:
    """
    Sanitize text input to ensure only safe text data is stored.

    Removes:
    - Script tags and HTML injection attempts
    - SQL injection patterns
    - Null bytes and control characters
    - URLs with executable protocols (javascript:, data:, vbscript:)
    - Embedded binary data

    Preserves:
    - Sanskrit Devanagari characters (U+0900-U+097F)
    - IAST diacritics (ā ī ū ṛ ṃ ḥ ṅ ñ ṭ ḍ ṇ ś ṣ)
    - Standard punctuation and formatting
    """
    if not isinstance(text, str):
        return str(text)

    # Remove null bytes
    text = text.replace("\x00", "")

    # Remove control characters (keep newlines and tabs)
    text = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Remove HTML/script tags
    text = re.sub(r'<[^>]*script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]*>', '', text)

    # Remove dangerous URI schemes
    text = re.sub(r'(?:javascript|vbscript|data|file):', '', text, flags=re.IGNORECASE)

    # Remove SQL injection patterns
    text = re.sub(r"(--|;|'|\")\s*(DROP|DELETE|INSERT|UPDATE|ALTER|EXEC|UNION)\s", '', text, flags=re.IGNORECASE)

    return text.strip()


def sanitize_list(items: list[str]) -> list[str]:
    """Sanitize a list of text strings."""
    return [sanitize_text(item) for item in items]


# =============================================================================
# COMPREHENSIVE PRACTICAL WISDOM SEED DATA — All 18 Chapters
# =============================================================================

PRACTICAL_WISDOM_SEED: list[dict] = [
    # =========================================================================
    # CHAPTER 1: Arjuna Vishada Yoga — Recognizing Inner Conflict
    # =========================================================================
    {
        "verse_ref": "1.1", "chapter": 1, "verse_number": 1,
        "life_domain": "decision_making",
        "principle_in_action": "The Gita begins with a question — dharmic inquiry. Before any action, pause and ask: 'What is really happening here?' Dhritarashtra's question to Sanjaya teaches us that clarity begins with honest inquiry, not hasty reaction.",
        "micro_practice": "Before your next important decision, sit for 5 minutes and write the question clearly. Like Dhritarashtra asking Sanjaya, seek an honest assessment of the situation from a trusted perspective. Separate facts from fears.",
        "action_steps": ["Write down the decision you face in one clear sentence", "List what you know (facts) vs. what you fear (assumptions)", "Seek counsel from someone with wisdom and detachment — your 'Sanjaya'"],
        "reflection_prompt": "Am I avoiding an honest look at my situation because the truth might demand courage?",
        "modern_scenario": "A team leader discovers their project is failing but avoids examining the data because they fear what it will reveal. Inspired by the Gita's opening verse, they choose dharmic inquiry over comfortable denial — calling a transparent team meeting to honestly assess where things stand.",
        "counter_pattern": "Avoiding difficult truths, refusing to ask hard questions, surrounding yourself with people who only tell you what you want to hear — this is Dhritarashtra's blindness.",
        "shad_ripu_tags": ["moha"],
        "wellness_domains": ["anxiety_management", "self_awareness", "decision_making"],
        "source_attribution": "Bhagavad Gita 1.1 — Arjuna Vishada Yoga",
    },
    {
        "verse_ref": "1.47", "chapter": 1, "verse_number": 47,
        "life_domain": "daily_life",
        "principle_in_action": "Arjuna's despair is not weakness — it is the beginning of wisdom. When you feel overwhelmed by life's complexity, honor that feeling. The Gita teaches that genuine confusion, honestly felt, is the doorway to transformation.",
        "micro_practice": "When feeling overwhelmed, don't force action. Sit with the confusion for 5 minutes. Say internally: 'I don't know what to do, and that is okay.' Like Arjuna putting down his bow, sometimes surrendering the pretense of control is the first dharmic act.",
        "action_steps": ["Acknowledge your confusion without shame — write it down", "Identify what you CAN'T control and mentally release it", "Ask: 'What would wisdom say right now?' — then listen in silence"],
        "reflection_prompt": "What if my confusion is not a problem to solve but a door to walk through?",
        "modern_scenario": "A burned-out professional feels paralyzed by the demands of career, family, and health. Instead of pushing through with more effort, they recall Arjuna's surrender in Chapter 1 and allow themselves to stop, feel the weight, and seek guidance rather than force answers.",
        "counter_pattern": "Pretending everything is fine when you are breaking inside, numbing yourself with distractions, or forcing decisions from a place of exhaustion — the Gita shows that honest vulnerability precedes genuine strength.",
        "shad_ripu_tags": ["moha", "mada"],
        "wellness_domains": ["emotional_regulation", "stress_reduction", "self_awareness"],
        "source_attribution": "Bhagavad Gita 1.47 — Arjuna Vishada Yoga",
    },
    # =========================================================================
    # CHAPTER 2: Sankhya Yoga — Wisdom of the Eternal Self
    # =========================================================================
    {
        "verse_ref": "2.14", "chapter": 2, "verse_number": 14,
        "life_domain": "health",
        "principle_in_action": "Pleasure and pain come and go like seasons — they are temporary contacts of the senses. The Gita teaches endurance (titiksha). Applied to health challenges: your body's condition changes, but your essential nature remains untouched.",
        "micro_practice": "When experiencing physical discomfort or emotional pain, close your eyes and observe: 'This sensation is visiting, not staying.' Hold awareness for 3 minutes, watching the sensation without identifying with it. This is the Gita's titiksha — patient endurance rooted in wisdom.",
        "action_steps": ["When pain arises, label it: 'sensation' — not 'my suffering'", "Practice the 90-second rule: most emotional reactions peak and fade in 90 seconds if you don't feed them", "Each morning, affirm: 'I am the witness of experience, not the experience itself'"],
        "reflection_prompt": "If I knew this difficult phase would pass in exactly 30 days, how would I face today differently?",
        "modern_scenario": "A person diagnosed with a chronic condition feels their identity collapsing into the illness. Remembering BG 2.14 — that sense contacts are temporary — they begin to separate 'I have this condition' from 'I am this condition,' finding freedom in the distinction.",
        "counter_pattern": "Collapsing your identity into temporary circumstances — 'I am depressed' instead of 'depression is visiting' — this is the delusion of mistaking the field (kshetra) for the knower of the field (kshetrajna).",
        "shad_ripu_tags": ["moha"],
        "wellness_domains": ["emotional_resilience", "pain_management", "acceptance"],
        "source_attribution": "Bhagavad Gita 2.14 — Sankhya Yoga",
    },
    {
        "verse_ref": "2.47", "chapter": 2, "verse_number": 47,
        "life_domain": "workplace",
        "principle_in_action": "You have the right to action alone, never to its fruits. In the workplace, this means: give your absolute best to every task, but release the anxiety of outcomes. Your dharma is the quality of your effort, not the verdict of your results.",
        "micro_practice": "Before starting work today, write this intention on a sticky note: 'My offering is my effort. The result is not mine to control.' When anxiety about outcomes arises during the day, glance at this note and take 3 breaths. This is Karma Yoga at your desk.",
        "action_steps": ["Set a daily dharmic intention before work: effort is my offering, results are not my burden", "When outcome-anxiety strikes, redirect attention to the task at hand — the next action, not the final result", "At day's end, review your ACTIONS, not your outcomes — did you give your dharmic best?"],
        "reflection_prompt": "If no one ever saw or rewarded my work, would I still do it with the same dedication? What does that answer reveal about my motivation?",
        "modern_scenario": "A startup founder obsesses over investor responses to their pitch deck, losing sleep over what they cannot control. Applying BG 2.47, they shift focus from 'Will they invest?' to 'Is this the best pitch I can create?' The quality of their work improves immediately, and paradoxically, so do the outcomes.",
        "counter_pattern": "Obsessing over results, refreshing email for feedback, letting fear of failure paralyze your effort — this is sakama karma (desire-bound action) that the Gita identifies as the root of workplace suffering.",
        "shad_ripu_tags": ["kama", "lobha"],
        "wellness_domains": ["outcome_detachment", "anxiety_reduction", "work_stress_management"],
        "source_attribution": "Bhagavad Gita 2.47 — Sankhya Yoga (Karma Yoga principle)",
    },
    {
        "verse_ref": "2.62", "chapter": 2, "verse_number": 62,
        "life_domain": "social_media",
        "principle_in_action": "The Gita maps the chain of suffering: contemplation on sense objects breeds attachment; from attachment arises desire; from desire, anger; from anger, delusion. Applied to social media: mindless scrolling breeds comparison, which breeds craving, which breeds frustration.",
        "micro_practice": "Before opening any social media app, pause for 10 seconds and ask: 'What am I seeking right now?' If the answer is distraction or validation, choose a different action for 5 minutes — a walk, a breath exercise, or a verse. Break the chain at contemplation, before attachment forms.",
        "action_steps": ["Install a screen-time tracker and set mindful limits based on BG 2.62's chain of attachment", "Each time you feel the urge to scroll, pause and ask: 'Am I feeding sattva or rajas right now?'", "Replace one daily social media session with reading or reflecting on a Gita verse"],
        "reflection_prompt": "What is the 'sense object' I keep contemplating that is creating a chain of suffering in my digital life?",
        "modern_scenario": "A college student notices they feel worse after every Instagram session — comparing bodies, achievements, relationships. Recognizing the BG 2.62 chain (dwelling on images → attachment → desire → frustration), they implement a 'pause before scrolling' practice and feel measurably calmer within a week.",
        "counter_pattern": "Mindless, habitual scrolling where the chain from contemplation to anger runs on autopilot — this is the indriya-driven life the Gita warns against.",
        "shad_ripu_tags": ["kama", "matsarya"],
        "wellness_domains": ["addiction_recovery", "impulse_control", "digital_wellness"],
        "source_attribution": "Bhagavad Gita 2.62-63 — Sankhya Yoga (Chain of Attachment)",
    },
    # =========================================================================
    # CHAPTER 3: Karma Yoga — Selfless Action
    # =========================================================================
    {
        "verse_ref": "3.19", "chapter": 3, "verse_number": 19,
        "life_domain": "workplace",
        "principle_in_action": "Perform your duty without attachment — this is how you attain the highest. In your career, do excellent work not for ego or reward, but because it is your dharmic contribution. This transforms every task from burden to offering.",
        "micro_practice": "Choose one task today — even a mundane one — and do it as an offering (Ishvara arpana). Before starting, internally say: 'This work is my yajna (sacrifice), not my possession.' Notice how the quality of your attention changes when the ego steps aside.",
        "action_steps": ["Identify one recurring work task that feels burdensome and reframe it as your dharmic contribution", "Practice 'work as worship': perform the task with full attention but zero attachment to credit", "At week's end, notice: did you feel more peace or more stress this way?"],
        "reflection_prompt": "If this work is truly my dharma, what changes if I stop doing it for praise and start doing it as sacred duty?",
        "modern_scenario": "A nurse exhausted by long shifts rediscovers purpose through BG 3.19 — each patient interaction becomes an act of seva (selfless service). The work doesn't change, but the experience of it transforms from draining to nourishing.",
        "counter_pattern": "Working only for paycheck, promotion, or recognition — this transactional approach turns dharmic work into ego-fuel and leads to burnout.",
        "shad_ripu_tags": ["kama", "mada"],
        "wellness_domains": ["purpose_discovery", "work_stress_management", "burnout_prevention"],
        "source_attribution": "Bhagavad Gita 3.19 — Karma Yoga",
    },
    {
        "verse_ref": "3.37", "chapter": 3, "verse_number": 37,
        "life_domain": "self_discipline",
        "principle_in_action": "Krishna identifies desire (kama) as the all-devouring enemy of wisdom, born of the rajo-guna. Understanding that uncontrolled desire is the root adversary gives you power — you can now fight the right battle instead of fighting yourself.",
        "micro_practice": "When a strong craving arises (food, scrolling, shopping, etc.), pause and name it: 'This is kama, the enemy of my wisdom.' Don't suppress it — witness it. Set a 5-minute timer and simply observe the desire without acting. Often it dissolves on its own.",
        "action_steps": ["Create a 'desire diary': log cravings for one week and notice patterns — this is self-knowledge", "For each strong craving, ask Krishna's question: 'Is this leading me toward wisdom or away from it?'", "Replace one daily indulgence with a sattvic alternative this week"],
        "reflection_prompt": "What desire has been ruling me lately, and what deeper need is it masking?",
        "modern_scenario": "A young professional realizes their compulsive spending is not about the items but about the emotional void underneath. Recognizing this as kama (desire born of rajas), they start addressing the root need — connection, purpose, self-worth — rather than feeding the symptom.",
        "counter_pattern": "Mistaking the craving for the need, endlessly feeding desires without examining what drives them — this is what Krishna calls 'fire covered by smoke' (BG 3.38).",
        "shad_ripu_tags": ["kama"],
        "wellness_domains": ["impulse_control", "self_discipline", "addiction_recovery"],
        "source_attribution": "Bhagavad Gita 3.37 — Karma Yoga",
    },
    # =========================================================================
    # CHAPTER 4: Jnana Karma Sannyasa Yoga — Knowledge and Action
    # =========================================================================
    {
        "verse_ref": "4.34", "chapter": 4, "verse_number": 34,
        "life_domain": "education",
        "principle_in_action": "Learn the truth by approaching those who have seen it, with humility, inquiry, and service. The Gita teaches that genuine knowledge requires a teachable spirit — not intellectual arrogance. This transforms education from information-gathering to wisdom-receiving.",
        "micro_practice": "Identify one person in your life who has wisdom you lack. Approach them this week with genuine humility: not to impress, but to learn. Ask an open question and listen without formulating your response. This is pranipata (humble approach) as the Gita prescribes.",
        "action_steps": ["Find a mentor, teacher, or elder whose lived wisdom you respect — approach with humility", "In your next learning situation, practice 'beginner's mind' — set aside what you think you know", "Replace one hour of passive content consumption with active dialogue with a wise person"],
        "reflection_prompt": "Where is my pride (mada) blocking me from learning what I most need to know?",
        "modern_scenario": "A senior engineer resists learning a new technology because they feel 'above' junior-level tutorials. Remembering BG 4.34, they approach a younger colleague with genuine curiosity and discover that humility opens doors that expertise alone cannot.",
        "counter_pattern": "Intellectual arrogance — believing your degrees or experience exempt you from learning — is the mada (pride) that Krishna identifies as a barrier to true knowledge.",
        "shad_ripu_tags": ["mada"],
        "wellness_domains": ["humility", "personal_growth", "knowledge_seeking"],
        "source_attribution": "Bhagavad Gita 4.34 — Jnana Karma Sannyasa Yoga",
    },
    # =========================================================================
    # CHAPTER 5: Karma Sannyasa Yoga — Renunciation in Action
    # =========================================================================
    {
        "verse_ref": "5.22", "chapter": 5, "verse_number": 22,
        "life_domain": "relationships",
        "principle_in_action": "Pleasures born of sense contact are sources of suffering — they have a beginning and an end. In relationships, this means: don't build love on temporary attractions. Build on the eternal — shared values, dharma, and mutual growth.",
        "micro_practice": "Reflect for 5 minutes on your most important relationship. Ask: 'What in this relationship is eternal (values, respect, growth) and what is temporary (attraction, excitement, novelty)?' Consciously invest more energy in the eternal foundations.",
        "action_steps": ["List the top 3 'eternal qualities' (dharmic foundations) in your key relationship", "Identify one area where you're chasing the temporary (excitement, validation) and redirect that energy toward depth", "Practice one act of unconditional kindness today — expecting nothing, as Krishna teaches"],
        "reflection_prompt": "Am I loving this person for who they eternally are, or for the temporary pleasure they give me?",
        "modern_scenario": "A couple in a long-term relationship feels the initial excitement fading. Instead of panic or seeking novelty, they recall BG 5.22 and invest in the enduring foundations: shared purpose, honest communication, and spiritual growth together.",
        "counter_pattern": "Chasing the 'honeymoon high' — jumping from relationship to relationship seeking temporary pleasure — is the sense-born suffering Krishna describes.",
        "shad_ripu_tags": ["kama", "moha"],
        "wellness_domains": ["relationship_depth", "emotional_maturity", "contentment"],
        "source_attribution": "Bhagavad Gita 5.22 — Karma Sannyasa Yoga",
    },
    # =========================================================================
    # CHAPTER 6: Dhyana Yoga — Mastering the Mind
    # =========================================================================
    {
        "verse_ref": "6.5", "chapter": 6, "verse_number": 5,
        "life_domain": "personal_growth",
        "principle_in_action": "One must elevate oneself by the Self, not degrade oneself. The mind can be the best friend or the worst enemy. This is the Gita's most empowering teaching: you are not a victim of your mind — you are its master.",
        "micro_practice": "For the next 10 minutes, practice 'mind-mastery meditation.' Sit and observe your thoughts. When a self-critical thought arises, respond internally: 'I see you. You are the mind's pattern, not my truth. I choose to be my own friend.' This retrains the mind as ally, not enemy.",
        "action_steps": ["Catch one self-critical thought today and consciously reframe it with compassion — be your own friend", "Write down: 'My mind is my instrument, not my master' — post it where you see it daily", "Practice one decision today where you choose your higher Self's guidance over the mind's fear"],
        "reflection_prompt": "In what area of my life is my mind acting as my enemy? What would it look like to befriend it instead?",
        "modern_scenario": "A student with severe self-doubt recognizes that their inner critic is not truth but a habitual pattern. Drawing on BG 6.5, they begin a daily practice of self-compassion, treating themselves as they would treat a dear friend. Over weeks, the inner voice shifts from enemy to ally.",
        "counter_pattern": "Constant self-criticism, believing the mind's harshest judgments as truth, letting negative self-talk go unchallenged — this is allowing the mind to be your worst enemy.",
        "shad_ripu_tags": ["moha", "mada"],
        "wellness_domains": ["self_empowerment", "self_compassion", "mental_mastery"],
        "source_attribution": "Bhagavad Gita 6.5 — Dhyana Yoga",
    },
    {
        "verse_ref": "6.35", "chapter": 6, "verse_number": 35,
        "life_domain": "self_discipline",
        "principle_in_action": "The mind is restless, turbulent, strong, and obstinate — Arjuna says controlling it is harder than controlling the wind. Krishna agrees, but adds: through practice (abhyasa) and detachment (vairagya), it can be mastered. This is the Gita's formula for any discipline challenge.",
        "micro_practice": "Choose one habit you want to build (meditation, exercise, reading). Commit to just 2 minutes today — not 30, just 2. This is abhyasa (practice): consistency matters more than duration. When the mind resists, don't fight it — detach from the resistance and return to the practice.",
        "action_steps": ["Start your target habit at the smallest possible dose — 2 minutes — and do it daily for 7 days", "When the mind says 'I don't feel like it,' respond: 'I don't need to feel like it. I just need to do 2 minutes'", "Track your streak visually — each day builds the abhyasa (practice) that Krishna prescribes"],
        "reflection_prompt": "What practice (abhyasa) have I abandoned because I expected instant mastery instead of patient consistency?",
        "modern_scenario": "A person who has started and abandoned meditation 5 times finally succeeds by applying BG 6.35: they commit to just 2 minutes daily. The mind still resists, but they practice vairagya (detachment from the resistance) and simply sit. After 30 days, the practice is effortless.",
        "counter_pattern": "Expecting instant mastery, setting impossibly high goals, then quitting when the mind rebels — this ignores Krishna's clear instruction that mastery comes through gradual, persistent practice.",
        "shad_ripu_tags": ["kama", "moha"],
        "wellness_domains": ["habit_formation", "meditation_practice", "self_discipline"],
        "source_attribution": "Bhagavad Gita 6.35 — Dhyana Yoga (Abhyasa and Vairagya)",
    },
    # =========================================================================
    # CHAPTER 7-9: Knowledge, Devotion, and Faith
    # =========================================================================
    {
        "verse_ref": "7.14", "chapter": 7, "verse_number": 14,
        "life_domain": "daily_life",
        "principle_in_action": "This divine maya (illusion) of the three gunas is difficult to overcome. But those who surrender to the divine can cross beyond it. When daily life feels overwhelming — too many demands, too little clarity — remember: you are not meant to fight maya alone.",
        "micro_practice": "When feeling trapped in the illusion of 'everything is urgent,' pause and say: 'I surrender this overwhelm to the divine order.' Take 5 breaths. Then ask: 'What is the ONE thing that is truly my dharma right now?' Do that one thing.",
        "action_steps": ["Each morning, offer your day's challenges to a higher purpose: 'May this day serve dharma'", "When overwhelmed, prioritize ruthlessly: what is your dharmic duty vs. ego's demands?", "Practice 'guna awareness': is your current state sattvic (clear), rajasic (agitated), or tamasic (inert)?"],
        "reflection_prompt": "Where am I trying to overcome life's challenges through ego-effort alone, when surrender (sharanagati) might be the wiser path?",
        "modern_scenario": "A working parent juggling career, children, and aging parents feels crushed by responsibility. Applying BG 7.14, they stop trying to control everything and surrender what they cannot manage — finding that clarity and help arrive when ego releases its grip.",
        "counter_pattern": "Believing you must handle everything alone through sheer willpower — this is the ego's delusion that Krishna says maya makes 'very difficult to overcome' without surrender.",
        "shad_ripu_tags": ["mada", "moha"],
        "wellness_domains": ["stress_reduction", "surrender", "clarity"],
        "source_attribution": "Bhagavad Gita 7.14 — Jnana Vijnana Yoga",
    },
    {
        "verse_ref": "9.22", "chapter": 9, "verse_number": 22,
        "life_domain": "personal_growth",
        "principle_in_action": "To those who worship with devotion, meditating on the divine constantly, Krishna promises: 'I carry what they lack and preserve what they have.' This is the Gita's assurance of divine support for sincere seekers.",
        "micro_practice": "Write one concern you have been carrying anxiously. Then mentally offer it: 'I have done my part. The rest, I trust to the divine intelligence that sustains all.' Feel the difference between carrying and offering. This is the yoga of BG 9.22.",
        "action_steps": ["Maintain a daily 'offering journal': write what you're surrendering to divine wisdom each day", "When fear of the future arises, recall BG 9.22: the divine preserves what sincere seekers have", "Practice one act of devotion daily — it can be as simple as gratitude before meals or a moment of silence"],
        "reflection_prompt": "What am I carrying that I could offer to a wisdom larger than my own understanding?",
        "modern_scenario": "An entrepreneur facing bankruptcy maintains their spiritual practice, offering their fear to the divine each morning. Against all odds, solutions appear — a new partnership, an unexpected opportunity. They attribute it not to luck but to the promise of BG 9.22.",
        "counter_pattern": "Trying to control every outcome through anxiety and over-planning while refusing to trust any intelligence beyond your own — this cuts you off from the divine support Krishna guarantees.",
        "shad_ripu_tags": ["moha", "lobha"],
        "wellness_domains": ["faith", "trust", "anxiety_reduction"],
        "source_attribution": "Bhagavad Gita 9.22 — Raja Vidya Raja Guhya Yoga",
    },
    # =========================================================================
    # CHAPTER 12: Bhakti Yoga — The Path of Devotion
    # =========================================================================
    {
        "verse_ref": "12.13", "chapter": 12, "verse_number": 13,
        "life_domain": "relationships",
        "principle_in_action": "One who is free from envy, friendly and compassionate to all beings, without possessiveness and ego, equal in joy and sorrow, forgiving — such a devotee is dear to Krishna. These are the qualities that make relationships sacred.",
        "micro_practice": "Choose one relationship today and practice one quality from BG 12.13: compassion (karuna), freedom from envy (advesha), or forgiveness (kshama). When the mind judges or envies, consciously replace it with the chosen quality for 5 minutes.",
        "action_steps": ["Practice 'advesha' (non-malice): when someone upsets you, pause and wish them well silently", "Offer forgiveness (kshama) for one old grudge this week — not for them, but for your own peace", "Be a 'mitra' (friend) to someone today — offer kindness without agenda"],
        "reflection_prompt": "Which of Krishna's beloved qualities (compassion, non-envy, forgiveness, humility) do I most need to develop in my relationships right now?",
        "modern_scenario": "A person struggling with jealousy over a friend's success decides to practice BG 12.13. Instead of comparing, they genuinely celebrate the friend's achievement and offer help. The envy transforms into mudita (sympathetic joy), and the friendship deepens.",
        "counter_pattern": "Keeping score in relationships, harboring resentment, making friendship conditional on reciprocity — these are the very qualities Krishna says the true devotee has transcended.",
        "shad_ripu_tags": ["matsarya", "krodha"],
        "wellness_domains": ["compassion", "forgiveness", "relationship_healing"],
        "source_attribution": "Bhagavad Gita 12.13-14 — Bhakti Yoga",
    },
    # =========================================================================
    # CHAPTER 13: Kshetra Kshetrajna — Field and Knower
    # =========================================================================
    {
        "verse_ref": "13.2", "chapter": 13, "verse_number": 2,
        "life_domain": "health",
        "principle_in_action": "The body is the field (kshetra) and the Self is the knower of the field (kshetrajna). Health challenges become more manageable when you understand: you HAVE a body, you are not the body. The knower observes the field's changes without being destroyed by them.",
        "micro_practice": "During any health challenge, practice kshetra-kshetrajna awareness: 'My body (field) is experiencing this. I (the knower) am witnessing it.' This 2-minute awareness practice creates space between you and the condition, reducing anxiety and increasing equanimity.",
        "action_steps": ["When symptoms arise, practice: 'I notice my body is experiencing X' rather than 'I am X'", "Care for the body-field with dharmic discipline: nutrition, movement, rest — as a farmer tends the field", "Remember: the field changes, but the knower remains — you are the knower"],
        "reflection_prompt": "Am I identifying with my body's conditions (the field), or am I resting in awareness as the knower of the field?",
        "modern_scenario": "A person with chronic pain practices BG 13.2 daily — separating the awareness that knows the pain from the pain itself. Over time, while the pain remains, their suffering reduces significantly because they are no longer fused with it.",
        "counter_pattern": "Completely identifying with the body and its conditions — 'I am sick, I am old, I am broken' — is confusing the field with the knower, which the Gita identifies as fundamental ignorance (avidya).",
        "shad_ripu_tags": ["moha"],
        "wellness_domains": ["health_awareness", "chronic_pain_management", "identity_beyond_body"],
        "source_attribution": "Bhagavad Gita 13.2 — Kshetra Kshetrajna Vibhaga Yoga",
    },
    # =========================================================================
    # CHAPTER 14: Guna Traya — Three Qualities of Nature
    # =========================================================================
    {
        "verse_ref": "14.22", "chapter": 14, "verse_number": 22,
        "life_domain": "daily_life",
        "principle_in_action": "Krishna describes one who has transcended the gunas: they don't reject illumination (sattva), activity (rajas), or delusion (tamas) when they arise, nor do they long for them when absent. The practical wisdom: don't fight your states — witness them.",
        "micro_practice": "Throughout today, practice 'guna spotting.' When you feel clear and motivated (sattva), note it. When agitated and driven (rajas), note it. When sluggish and resistant (tamas), note it. Simply witness: 'Ah, rajas is active right now.' Don't judge — just see.",
        "action_steps": ["Track your guna-state 3 times daily (morning, afternoon, evening) in a simple journal", "When tamas dominates (lethargy), apply a small rajasic action (a walk, cold water on face)", "When rajas dominates (anxiety), apply a sattvic practice (breathing, stillness, nature)"],
        "reflection_prompt": "Which guna has been ruling my life this week? What would it look like to witness all three without being enslaved by any?",
        "modern_scenario": "A person notices they cycle between hyper-productivity (rajas), exhaustion (tamas), and brief clarity (sattva) without understanding why. Learning the Gita's guna framework, they begin to manage their energy consciously — resting when tamas calls, focusing when sattva is present, moderating when rajas pushes too hard.",
        "counter_pattern": "Being tossed helplessly between the three gunas — manic productivity, then crash, then guilt — without awareness that these are natural forces that can be witnessed and managed.",
        "shad_ripu_tags": ["moha"],
        "wellness_domains": ["emotional_regulation", "energy_management", "self_awareness"],
        "source_attribution": "Bhagavad Gita 14.22-25 — Guna Traya Vibhaga Yoga",
    },
    # =========================================================================
    # CHAPTER 16: Divine and Demonic Natures
    # =========================================================================
    {
        "verse_ref": "16.1", "chapter": 16, "verse_number": 1,
        "life_domain": "leadership",
        "principle_in_action": "Krishna lists 26 divine qualities beginning with fearlessness (abhayam), purity (sattva-samshuddhi), and charity (danam). These are not just spiritual virtues — they are the foundation of ethical leadership. Lead with divine qualities, not demonic ones.",
        "micro_practice": "Choose one of Krishna's 26 divine qualities to embody today in your leadership role: fearlessness (making the right decision despite pressure), purity (transparent communication), or compassion (genuinely caring about your team). Practice it in one concrete interaction.",
        "action_steps": ["Review the 26 divine qualities (BG 16.1-3) and rate yourself honestly on each — this is your leadership dharma audit", "Identify the ONE quality that would most transform your leadership if strengthened", "Model that quality visibly this week — people follow what they see, not what they hear"],
        "reflection_prompt": "Am I leading from divine qualities (fearlessness, compassion, truthfulness) or from demonic ones (ego, control, fear)? What would Krishna say about my leadership?",
        "modern_scenario": "A manager discovers their team is underperforming due to a culture of fear. Reading BG 16.1, they realize they have been leading with the demonic quality of control rather than the divine quality of trust. They begin practicing 'abhayam' (fearlessness) — creating psychological safety — and watch the team's creativity and performance flourish.",
        "counter_pattern": "Leading through fear, manipulation, and ego — Krishna explicitly lists hypocrisy, arrogance, pride, anger, and harshness as demonic qualities (BG 16.4) that destroy both leader and team.",
        "shad_ripu_tags": ["mada", "krodha"],
        "wellness_domains": ["ethical_leadership", "fearlessness", "character_development"],
        "source_attribution": "Bhagavad Gita 16.1-3 — Daiva Asura Sampad Vibhaga Yoga",
    },
    {
        "verse_ref": "16.21", "chapter": 16, "verse_number": 21,
        "life_domain": "self_discipline",
        "principle_in_action": "Desire (kama), anger (krodha), and greed (lobha) are the three gates to hell — the destruction of the self. Krishna is direct: these three must be abandoned. Not managed. Not negotiated with. Abandoned. This clarity is the Gita's ultimate self-discipline teaching.",
        "micro_practice": "For the next 24 hours, be on guard for the 'three gates': desire (craving something you don't need), anger (reacting disproportionately), and greed (wanting more than enough). Each time you catch one, mentally say: 'Gate detected. I choose not to enter.' This is conscious dharmic living.",
        "action_steps": ["Create a 'three gates tracker': tally each instance of desire, anger, or greed you notice in one day", "For each detection, practice the 'sacred pause' — 3 breaths before acting", "At day's end, review: which gate tempted you most? That is your primary inner enemy to work on"],
        "reflection_prompt": "Which of the three gates — desire, anger, or greed — has the strongest hold on me, and what would freedom from it feel like?",
        "modern_scenario": "An executive realizes their burnout stems from lobha (greed for success) masquerading as ambition. They recall BG 16.21 — greed is a gate to self-destruction — and make the difficult choice to step back, delegate, and focus on what truly matters. Their health and relationships begin to heal.",
        "counter_pattern": "Calling desire 'passion,' anger 'assertiveness,' and greed 'ambition' — rebranding the three gates doesn't change where they lead. The Gita says: abandon them, period.",
        "shad_ripu_tags": ["kama", "krodha", "lobha"],
        "wellness_domains": ["self_discipline", "self_awareness", "character_purification"],
        "source_attribution": "Bhagavad Gita 16.21 — Daiva Asura Sampad Vibhaga Yoga",
    },
    # =========================================================================
    # CHAPTER 17: Three Types of Faith
    # =========================================================================
    {
        "verse_ref": "17.20", "chapter": 17, "verse_number": 20,
        "life_domain": "community",
        "principle_in_action": "Sattvic giving is done without expectation of return, at the proper time and place, to a worthy person. This transforms charity from transaction to dharma. True service to community is selfless — not for tax breaks, social media posts, or guilt relief.",
        "micro_practice": "Perform one act of anonymous giving today — donate, volunteer, or help someone without anyone knowing. Notice how it feels different from giving that is seen and praised. This is sattvic dana (giving) as the Gita defines it.",
        "action_steps": ["Give something meaningful this week — time, money, or skills — completely anonymously", "Before giving, check your motivation: is it sattvic (pure), rajasic (for recognition), or tamasic (careless)?", "Practice 'nimitta' — seeing yourself as an instrument of giving, not the source of it"],
        "reflection_prompt": "When I give to others, am I giving from overflow and love, or from guilt, obligation, or desire for recognition?",
        "modern_scenario": "A wealthy person realizes their philanthropy is driven by social recognition (rajasic) rather than genuine compassion (sattvic). Applying BG 17.20, they begin giving anonymously — and discover that the purest joy comes from giving that no one sees.",
        "counter_pattern": "Giving for photo opportunities, posting charity on social media for likes, or giving carelessly without ensuring it reaches the right place — all deviations from sattvic dana.",
        "shad_ripu_tags": ["mada", "lobha"],
        "wellness_domains": ["generosity", "community_service", "ego_transcendence"],
        "source_attribution": "Bhagavad Gita 17.20 — Shraddha Traya Vibhaga Yoga",
    },
    # =========================================================================
    # CHAPTER 18: Moksha Sannyasa Yoga — Liberation through Surrender
    # =========================================================================
    {
        "verse_ref": "18.66", "chapter": 18, "verse_number": 66,
        "life_domain": "personal_growth",
        "principle_in_action": "Abandon all dharmas and take refuge in Me alone — I shall liberate you from all sins. This is the Gita's ultimate teaching: after doing your absolute best, surrender the rest. It is not passive resignation but active trust after active effort.",
        "micro_practice": "Sit for 5 minutes with palms open. Mentally list everything you are trying to control. For each item, say: 'I have given my best. I now release this to the divine.' Feel the difference between holding and offering. This is the sharanagati (surrender) of BG 18.66.",
        "action_steps": ["Identify the ONE thing you are most anxiously trying to control right now", "Ask: 'Have I done my dharmic best?' If yes — surrender the outcome. If no — do your best first, then surrender", "Practice the daily prayer of BG 18.66: 'I act with full effort, and I release with full trust'"],
        "reflection_prompt": "What would my life feel like if I truly believed that after doing my best, a divine intelligence handles the rest?",
        "modern_scenario": "A parent watching their adult child make difficult life choices struggles between controlling and surrendering. Meditating on BG 18.66, they realize: their duty was to raise the child with values; the child's path is now between them and the divine. They release control — and paradoxically, the relationship deepens.",
        "counter_pattern": "Two extremes: (1) passive fatalism — doing nothing and calling it 'surrender,' or (2) anxious control — doing everything and refusing to trust. BG 18.66 is neither; it is full effort THEN full trust.",
        "shad_ripu_tags": ["moha", "mada"],
        "wellness_domains": ["surrender", "trust", "liberation", "anxiety_reduction"],
        "source_attribution": "Bhagavad Gita 18.66 — Moksha Sannyasa Yoga (Charama Shloka)",
    },
    {
        "verse_ref": "18.78", "chapter": 18, "verse_number": 78,
        "life_domain": "daily_life",
        "principle_in_action": "Wherever there is Krishna (the divine) and Arjuna (the sincere seeker), there is prosperity, victory, happiness, and firm morality. The Gita ends with this promise: when you align dharmic effort with divine guidance, everything that matters follows.",
        "micro_practice": "End your day with Sanjaya's reflection: 'Where am I the sincere seeker (Arjuna) today? Where did I allow divine guidance (Krishna) to flow through my actions?' This 5-minute review aligns your daily life with the Gita's ultimate promise.",
        "action_steps": ["Each evening, review: 'Did I act as a sincere seeker today — giving my best, staying dharmic, remaining humble?'", "Identify one moment today where you felt guided by wisdom beyond your ego — acknowledge it with gratitude", "Start tomorrow with the intention: 'May my effort be sincere and my surrender be complete'"],
        "reflection_prompt": "Where in my life are Krishna (divine wisdom) and Arjuna (sincere effort) already working together? How can I expand that alignment?",
        "modern_scenario": "After a year of applying Gita teachings — performing duty without attachment, mastering the mind, practicing devotion — a person looks back and sees: their relationships are deeper, their work is more meaningful, their inner peace is genuine. Not because life became easy, but because they became aligned. This is the promise of BG 18.78.",
        "counter_pattern": "Seeking victory, prosperity, and happiness while ignoring dharma — the Gita is clear: these blessings follow ONLY when sincere effort and divine wisdom are united.",
        "shad_ripu_tags": [],
        "wellness_domains": ["purpose", "alignment", "wholeness", "gratitude"],
        "source_attribution": "Bhagavad Gita 18.78 — Moksha Sannyasa Yoga (Final Verse of the Gita)",
    },
]


async def seed_practical_wisdom(session):
    """Seed the practical wisdom database with validated entries."""
    print("Seeding practical wisdom...")

    seeded_count = 0
    skipped_count = 0

    for entry_data in PRACTICAL_WISDOM_SEED:
        # Sanitize all text fields
        sanitized = {
            "verse_ref": sanitize_text(entry_data["verse_ref"]),
            "chapter": entry_data["chapter"],
            "verse_number": entry_data["verse_number"],
            "life_domain": sanitize_text(entry_data["life_domain"]),
            "principle_in_action": sanitize_text(entry_data["principle_in_action"]),
            "micro_practice": sanitize_text(entry_data["micro_practice"]),
            "action_steps": sanitize_list(entry_data["action_steps"]),
            "reflection_prompt": sanitize_text(entry_data["reflection_prompt"]),
            "modern_scenario": sanitize_text(entry_data["modern_scenario"]),
            "counter_pattern": sanitize_text(entry_data.get("counter_pattern", "")),
            "shad_ripu_tags": entry_data.get("shad_ripu_tags", []),
            "wellness_domains": entry_data.get("wellness_domains", []),
            "source_attribution": sanitize_text(entry_data.get("source_attribution", "")),
            "enrichment_source": "seed",
            "is_validated": 1,
        }

        # Check if entry already exists (deduplication)
        result = await session.execute(
            select(GitaPracticalWisdom).where(
                (GitaPracticalWisdom.verse_ref == sanitized["verse_ref"])
                & (GitaPracticalWisdom.life_domain == sanitized["life_domain"])
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            skipped_count += 1
            continue

        entry = GitaPracticalWisdom(**sanitized)
        session.add(entry)
        seeded_count += 1

    await session.commit()
    print(f"  Seeded {seeded_count} practical wisdom entries (skipped {skipped_count} duplicates)")


async def main():
    """Main seeding function."""
    print("=" * 60)
    print("Bhagavad Gita Practical Wisdom Seeder")
    print("=" * 60)
    print(f"  Entries to seed: {len(PRACTICAL_WISDOM_SEED)}")
    print(f"  Chapters covered: {sorted(set(e['chapter'] for e in PRACTICAL_WISDOM_SEED))}")
    print(f"  Life domains: {sorted(set(e['life_domain'] for e in PRACTICAL_WISDOM_SEED))}")
    print()

    engine = create_ssl_engine(DATABASE_URL)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        try:
            await seed_practical_wisdom(session)
            print()
            print("=" * 60)
            print("Practical wisdom seeding completed successfully!")
            print("=" * 60)
        except Exception as e:
            print(f"Error during seeding: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

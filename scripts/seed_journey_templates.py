"""
Seed Journey Templates - Ṣaḍ-Ripu (Six Inner Enemies)

Comprehensive templates for KIAAN AI-powered Wisdom Journeys.
Each journey has full day-by-day guidance for personalized content generation.

Usage:
    python scripts/seed_journey_templates.py           # Validate data
    python scripts/seed_journey_templates.py --seed    # Seed database
"""

import asyncio
import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://navi:navi@db:5432/navi")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


# =============================================================================
# JOURNEY TEMPLATES
# =============================================================================

JOURNEY_TEMPLATES = [
    {
        "slug": "transform-anger-krodha",
        "title": "Transform Anger (Krodha)",
        "description": "A 14-day journey to understand, manage, and transform anger into patient strength. Learn to respond rather than react, finding peace even in challenging situations.",
        "primary_enemy_tags": ["krodha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": True,
        "is_free": True,  # FREE for all users - allows everyone to try the feature
        "icon_name": "flame",
        "color_theme": "red",
    },
    {
        "slug": "clarity-over-attachment-moha",
        "title": "Clarity Over Attachment (Moha)",
        "description": "A 21-day journey through the mist of delusion to clarity and discernment. Learn to see reality as it is and make decisions from wisdom rather than confusion.",
        "primary_enemy_tags": ["moha"],
        "duration_days": 21,
        "difficulty": 4,
        "is_featured": True,
        "is_free": False,
        "icon_name": "cloud",
        "color_theme": "purple",
    },
    {
        "slug": "humility-over-ego-mada",
        "title": "Humility Over Ego (Mada)",
        "description": "A 14-day path to transform pride into humble confidence. Discover the strength in service and the wisdom in acknowledging our interconnectedness.",
        "primary_enemy_tags": ["mada"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": True,
        "is_free": False,
        "icon_name": "crown",
        "color_theme": "orange",
    },
    {
        "slug": "mastering-desire-kama",
        "title": "Mastering Desire (Kama)",
        "description": "A 21-day journey to understand and channel desire constructively. Learn the art of contentment and restraint without suppression.",
        "primary_enemy_tags": ["kama"],
        "duration_days": 21,
        "difficulty": 4,
        "is_featured": True,
        "is_free": False,
        "icon_name": "heart",
        "color_theme": "rose",
    },
    {
        "slug": "contentment-over-greed-lobha",
        "title": "Contentment Over Greed (Lobha)",
        "description": "A 14-day exploration of true wealth and satisfaction. Discover the freedom that comes from wanting less and appreciating more.",
        "primary_enemy_tags": ["lobha"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": True,
        "is_free": False,
        "icon_name": "coins",
        "color_theme": "amber",
    },
    {
        "slug": "joy-over-envy-matsarya",
        "title": "Joy Over Envy (Matsarya)",
        "description": "A 14-day path to transform jealousy into appreciation and mudita (joy in others' success). Learn to celebrate others and find your own unique path.",
        "primary_enemy_tags": ["matsarya"],
        "duration_days": 14,
        "difficulty": 3,
        "is_featured": True,
        "is_free": False,
        "icon_name": "eye",
        "color_theme": "emerald",
    },
    {
        "slug": "complete-inner-transformation",
        "title": "Complete Inner Transformation",
        "description": "A comprehensive 30-day journey addressing all six inner enemies. For those ready for deep, holistic transformation.",
        "primary_enemy_tags": ["kama", "krodha", "lobha", "moha", "mada", "matsarya"],
        "duration_days": 30,
        "difficulty": 5,
        "is_featured": True,
        "is_free": False,
        "icon_name": "sparkles",
        "color_theme": "indigo",
    },
]


# =============================================================================
# COMPREHENSIVE 14-DAY KRODHA (ANGER) JOURNEY
# =============================================================================

KRODHA_STEPS = [
    {"day_index": 1, "step_title": "Understanding Your Anger",
     "teaching_hint": "Explore what anger truly is - its origins, triggers, and the underlying needs it represents. Apply to modern triggers: traffic, work emails, social media comments.",
     "reflection_prompt": "When did anger last arise in you? What was the trigger beneath the trigger?",
     "practice_prompt": "The Pause Practice: When you feel anger arising, take 3 deep breaths before responding.",
     "verse_selector": {"tags": ["krodha", "anger", "patience", "kshama", "shanti"], "chapters": [2, 3, 16], "max_verses": 2},
     "static_verse_refs": [{"chapter": 2, "verse": 63}]},
    {"day_index": 2, "step_title": "The Chain of Destruction",
     "teaching_hint": "Study the chain: desire → anger → delusion → memory loss → discrimination loss → destruction. Modern example: angry email sent, relationship damaged.",
     "reflection_prompt": "Have you witnessed this chain in your own life? What was the cost?",
     "practice_prompt": "Anger Journaling: Write about a recent anger incident without judgment.",
     "verse_selector": {"tags": ["krodha", "desire", "delusion", "viveka", "buddhi"], "chapters": [2, 3, 14], "max_verses": 2},
     "static_verse_refs": [{"chapter": 2, "verse": 62}, {"chapter": 2, "verse": 63}]},
    {"day_index": 3, "step_title": "The Gift of Patience",
     "teaching_hint": "Patience (kshama) is not weakness but strength. It's the ability to hold space for transformation. In meetings, in queues, in relationships.",
     "reflection_prompt": "Where in your life does patience feel most difficult? What makes it so?",
     "practice_prompt": "5-minute patience meditation: Sit and notice any urge to move. Simply observe.",
     "verse_selector": {"tags": ["patience", "peace", "equanimity", "forbearance", "tranquility"], "chapters": [2, 6, 12], "max_verses": 2}},
    {"day_index": 4, "step_title": "The Anger Within Anger",
     "teaching_hint": "Beneath anger often lies hurt, fear, or unmet needs. Look deeper. What fear drives the anger at your colleague? Your partner?",
     "reflection_prompt": "What emotion hides beneath your anger? What need is unmet?",
     "practice_prompt": "When anger arises today, pause and ask: 'What am I really feeling?'",
     "verse_selector": {"tags": ["self-knowledge", "wisdom", "introspection", "jnana", "atman"], "chapters": [2, 4, 13], "max_verses": 2}},
    {"day_index": 5, "step_title": "Righteous vs Destructive Anger",
     "teaching_hint": "Not all anger is harmful. Discern between righteous anger that drives change and destructive anger that harms. Standing up vs lashing out.",
     "reflection_prompt": "When has anger served a righteous purpose in your life? When has it been destructive?",
     "practice_prompt": "Reflect on a situation where anger could serve justice vs cause harm.",
     "verse_selector": {"tags": ["dharma", "righteousness", "discrimination", "viveka", "duty"], "chapters": [2, 3, 16, 18], "max_verses": 2}},
    {"day_index": 6, "step_title": "The Witness of Anger",
     "teaching_hint": "Practice being the witness. Observe anger without becoming it. Like watching waves from the shore, not drowning in them.",
     "reflection_prompt": "Can you observe your anger as a wave passing through, rather than who you are?",
     "practice_prompt": "Witness meditation: When anger arises, mentally say 'Anger is arising' and observe.",
     "verse_selector": {"tags": ["witness", "consciousness", "detachment", "purusha", "sakshi"], "chapters": [2, 6, 13], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on your journey so far. What patterns have emerged? How has awareness changed your reactions at work and home?",
     "reflection_prompt": "What have you learned about your relationship with anger this week?",
     "practice_prompt": "Journal synthesis: Write a letter to your anger, acknowledging what you've learned.",
     "verse_selector": {"tags": ["wisdom", "self-knowledge", "reflection", "prajna", "jnana"], "chapters": [2, 4, 18], "max_verses": 2}},
    {"day_index": 8, "step_title": "The Body of Anger",
     "teaching_hint": "Anger lives in the body. Learn to recognize its physical signatures. Notice the tension before you send that text, before you respond.",
     "reflection_prompt": "Where do you feel anger in your body? Jaw? Chest? Stomach? Hands?",
     "practice_prompt": "Body scan: Throughout the day, notice physical tension and breathe into it.",
     "verse_selector": {"tags": ["body", "awareness", "presence", "deha", "sharira"], "chapters": [5, 6, 13], "max_verses": 2}},
    {"day_index": 9, "step_title": "Responding vs Reacting",
     "teaching_hint": "A reaction is automatic; a response is chosen. Build the gap between stimulus and response. Before the reply-all, before the doorslam.",
     "reflection_prompt": "In what situations do you react rather than respond? What would change if you paused?",
     "practice_prompt": "Create a 10-second rule: Wait 10 seconds before responding to triggers.",
     "verse_selector": {"tags": ["action", "restraint", "wisdom", "karma", "viveka"], "chapters": [2, 3, 6, 18], "max_verses": 2}},
    {"day_index": 10, "step_title": "Forgiveness as Freedom",
     "teaching_hint": "Holding anger is like holding hot coal. Forgiveness sets you free. Release the resentment toward that ex, that former boss, that family member.",
     "reflection_prompt": "Who are you still holding anger toward? What would it take to release it?",
     "practice_prompt": "Forgiveness meditation: Send compassion to someone who has wronged you.",
     "verse_selector": {"tags": ["forgiveness", "compassion", "liberation", "kshama", "karuna"], "chapters": [12, 16, 18], "max_verses": 2}},
    {"day_index": 11, "step_title": "Communicating Without Anger",
     "teaching_hint": "Learn to express needs clearly without the charge of anger. In difficult conversations, in feedback sessions, in family discussions.",
     "reflection_prompt": "How can you communicate your needs without blame or accusation?",
     "practice_prompt": "Practice 'I feel... when... because...' statements today.",
     "verse_selector": {"tags": ["communication", "truth", "non-violence", "ahimsa", "satya"], "chapters": [16, 17], "max_verses": 2}},
    {"day_index": 12, "step_title": "Transforming Anger to Strength",
     "teaching_hint": "Anger's energy can be channeled into determination and righteous action. Channel it into your workout, your advocacy, your creativity.",
     "reflection_prompt": "How can you transform your anger into positive, constructive energy?",
     "practice_prompt": "Channel practice: Use anger's energy for exercise or creative work.",
     "verse_selector": {"tags": ["strength", "action", "transformation", "karma", "shakti"], "chapters": [2, 3, 11, 18], "max_verses": 2}},
    {"day_index": 13, "step_title": "Cultivating Inner Peace",
     "teaching_hint": "Peace is not the absence of triggers but the presence of equanimity. Find calm amid the chaos of notifications, deadlines, and demands.",
     "reflection_prompt": "What does inner peace mean to you? What conditions do you place on it?",
     "practice_prompt": "Peace meditation: Visualize a lake - calm surface, undisturbed by winds.",
     "verse_selector": {"tags": ["peace", "equanimity", "serenity", "shanti", "prasada"], "chapters": [2, 5, 6, 12], "max_verses": 2}},
    {"day_index": 14, "step_title": "The Mastery of Krodha",
     "teaching_hint": "You have walked the path. Now embody patient strength as your natural state. Carry this into every meeting, every message, every moment.",
     "reflection_prompt": "How has your relationship with anger transformed? What will you carry forward?",
     "practice_prompt": "Write a commitment: How will you continue practicing patient strength?",
     "verse_selector": {"tags": ["mastery", "liberation", "wisdom", "moksha", "siddhi"], "chapters": [2, 6, 18], "max_verses": 2}},
]


# =============================================================================
# COMPREHENSIVE 21-DAY MOHA (DELUSION/ATTACHMENT) JOURNEY
# =============================================================================

MOHA_STEPS = [
    {"day_index": 1, "step_title": "The Nature of Delusion",
     "teaching_hint": "Moha is not seeing reality clearly - it's the fog that obscures our true nature. In modern life: mistaking social media for reality, job title for identity.",
     "reflection_prompt": "What beliefs do you hold that you've never questioned?",
     "practice_prompt": "Reality Check: Write down 3 beliefs you hold. For each, ask: 'How do I know this is true?'",
     "verse_selector": {"tags": ["moha", "clarity", "wisdom", "viveka", "jnana", "maya"], "chapters": [2, 7, 13, 14], "max_verses": 2}},
    {"day_index": 2, "step_title": "Attachment and Identity",
     "teaching_hint": "We confuse who we are with what we have, what we do, and what others think of us. Your LinkedIn profile is not you. Your follower count is not you.",
     "reflection_prompt": "If you lost your role, possessions, or reputation, who would remain?",
     "practice_prompt": "Identity Inventory: List 5 things you identify with. Imagine life without each.",
     "verse_selector": {"tags": ["attachment", "identity", "self", "atman", "ahamkara"], "chapters": [2, 13, 15], "max_verses": 2}},
    {"day_index": 3, "step_title": "The Light of Discrimination",
     "teaching_hint": "Viveka (discrimination) is the ability to discern the real from the unreal. Distinguishing news from opinion, need from want, love from attachment.",
     "reflection_prompt": "What helps you see more clearly in moments of confusion?",
     "practice_prompt": "Morning clarity ritual: Start each day asking 'What is most true today?'",
     "verse_selector": {"tags": ["viveka", "wisdom", "knowledge", "buddhi", "jnana"], "chapters": [2, 4, 7, 18], "max_verses": 2}},
    {"day_index": 4, "step_title": "The Stories We Tell",
     "teaching_hint": "We live in stories about reality, not reality itself. Notice the narrative.",
     "reflection_prompt": "What stories do you tell yourself about your life? Are they true?",
     "practice_prompt": "Story awareness: Notice when you're adding narrative to neutral events.",
     "verse_selector": {"tags": ["mind", "illusion", "truth"], "max_verses": 2}},
    {"day_index": 5, "step_title": "Attachment to Outcomes",
     "teaching_hint": "We suffer not from events but from our attachment to specific outcomes.",
     "reflection_prompt": "What outcome are you clinging to? What if you released that grip?",
     "practice_prompt": "Outcome release: Do one task today with no attachment to the result.",
     "verse_selector": {"tags": ["detachment", "action", "surrender"], "max_verses": 2}},
    {"day_index": 6, "step_title": "The Impermanence of All Things",
     "teaching_hint": "Everything changes. Attachment to permanence creates suffering.",
     "reflection_prompt": "What are you trying to hold onto that is naturally changing?",
     "practice_prompt": "Impermanence meditation: Contemplate the changing nature of all things.",
     "verse_selector": {"tags": ["impermanence", "change", "acceptance"], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on the fog lifting. What clarity has emerged?",
     "reflection_prompt": "What delusions have you begun to see through this week?",
     "practice_prompt": "Clarity journal: Document moments of clear seeing.",
     "verse_selector": {"tags": ["wisdom", "clarity", "reflection"], "max_verses": 2}},
    {"day_index": 8, "step_title": "The Three Gunas",
     "teaching_hint": "Understand sattva (clarity), rajas (activity), and tamas (inertia).",
     "reflection_prompt": "Which guna dominates your current state? How does it affect clarity?",
     "practice_prompt": "Guna awareness: Notice which quality predominates at different times today.",
     "verse_selector": {"tags": ["gunas", "sattva", "clarity"], "max_verses": 2}},
    {"day_index": 9, "step_title": "Attachment to People",
     "teaching_hint": "We can love without clinging. Attachment is not love.",
     "reflection_prompt": "How does your attachment to loved ones create suffering for you or them?",
     "practice_prompt": "Love without clinging: Practice appreciation without possessiveness.",
     "verse_selector": {"tags": ["love", "attachment", "freedom"], "max_verses": 2}},
    {"day_index": 10, "step_title": "Attachment to Ideas",
     "teaching_hint": "We cling to beliefs as if they were our identity. Question everything.",
     "reflection_prompt": "What beliefs would be hardest for you to release? Why?",
     "practice_prompt": "Belief flexibility: Hold one strong opinion lightly today.",
     "verse_selector": {"tags": ["knowledge", "truth", "openness"], "max_verses": 2}},
    {"day_index": 11, "step_title": "The Witness Consciousness",
     "teaching_hint": "Behind all experiences is the unchanging witness. You are That.",
     "reflection_prompt": "Can you observe your thoughts and emotions as passing phenomena?",
     "practice_prompt": "Witness meditation: Rest as the awareness behind all experiences.",
     "verse_selector": {"tags": ["witness", "consciousness", "self"], "max_verses": 2}},
    {"day_index": 12, "step_title": "Maya - The Divine Play",
     "teaching_hint": "The world is Maya - not unreal, but not what it appears to be.",
     "reflection_prompt": "How would you live if you saw life as a divine play?",
     "practice_prompt": "Lila practice: Approach one challenge today as a cosmic game.",
     "verse_selector": {"tags": ["maya", "illusion", "divine"], "max_verses": 2}},
    {"day_index": 13, "step_title": "Letting Go of Control",
     "teaching_hint": "The illusion of control creates suffering. Surrender to what is.",
     "reflection_prompt": "What are you trying to control that is beyond your control?",
     "practice_prompt": "Surrender practice: Release one thing you've been trying to control.",
     "verse_selector": {"tags": ["surrender", "acceptance", "peace"], "max_verses": 2}},
    {"day_index": 14, "step_title": "Week Two Integration",
     "teaching_hint": "The fog continues to lift. Notice the expanding clarity.",
     "reflection_prompt": "How has your perception of reality shifted?",
     "practice_prompt": "Write about three moments of clarity this week.",
     "verse_selector": {"tags": ["wisdom", "insight", "clarity"], "max_verses": 2}},
    {"day_index": 15, "step_title": "The Self Beyond Attachment",
     "teaching_hint": "Your true Self is untouched by loss or gain, pleasure or pain.",
     "reflection_prompt": "What remains constant regardless of your circumstances?",
     "practice_prompt": "Self-inquiry: Ask 'Who am I?' and rest in the question.",
     "verse_selector": {"tags": ["atman", "self", "eternal"], "max_verses": 2}},
    {"day_index": 16, "step_title": "Detachment is Not Indifference",
     "teaching_hint": "Detachment means full engagement without clinging, not cold distance.",
     "reflection_prompt": "How can you be fully present while remaining unattached?",
     "practice_prompt": "Engaged detachment: Give 100% to a task with 0% attachment to outcome.",
     "verse_selector": {"tags": ["detachment", "action", "presence"], "max_verses": 2}},
    {"day_index": 17, "step_title": "The Root of All Suffering",
     "teaching_hint": "Moha is the root from which the other enemies grow. Address it, and all soften.",
     "reflection_prompt": "How has delusion fed your anger, desire, or pride?",
     "practice_prompt": "Root work: When another enemy arises, look for the delusion beneath it.",
     "verse_selector": {"tags": ["suffering", "liberation", "wisdom"], "max_verses": 2}},
    {"day_index": 18, "step_title": "Clear Seeing in Relationships",
     "teaching_hint": "See others as they are, not as your projections of them.",
     "reflection_prompt": "Who have you been seeing through the fog of your own projections?",
     "practice_prompt": "Fresh eyes: See a familiar person today as if for the first time.",
     "verse_selector": {"tags": ["relationships", "clarity", "truth"], "max_verses": 2}},
    {"day_index": 19, "step_title": "The Wisdom of Uncertainty",
     "teaching_hint": "Certainty is often delusion. Wisdom rests in 'I don't know.'",
     "reflection_prompt": "Where has false certainty led you astray?",
     "practice_prompt": "Uncertainty practice: Say 'I don't know' genuinely three times today.",
     "verse_selector": {"tags": ["wisdom", "humility", "openness"], "max_verses": 2}},
    {"day_index": 20, "step_title": "Living in Clarity",
     "teaching_hint": "Clarity is not a destination but a way of being. Live it moment to moment.",
     "reflection_prompt": "What practices help you maintain clarity in daily life?",
     "practice_prompt": "Clarity anchors: Identify 3 practices that restore your clear seeing.",
     "verse_selector": {"tags": ["clarity", "practice", "awareness"], "max_verses": 2}},
    {"day_index": 21, "step_title": "The Mastery of Moha",
     "teaching_hint": "The fog has lifted. Walk in clarity, knowing delusion may return.",
     "reflection_prompt": "How has your relationship with reality transformed?",
     "practice_prompt": "Write a commitment: How will you continue cultivating clarity?",
     "verse_selector": {"tags": ["mastery", "liberation", "wisdom"], "max_verses": 2}},
]


# =============================================================================
# COMPREHENSIVE 14-DAY MADA (PRIDE/EGO) JOURNEY
# =============================================================================

MADA_STEPS = [
    {"day_index": 1, "step_title": "The Weight of Pride",
     "teaching_hint": "Pride is a burden we carry that separates us from genuine connection and learning.",
     "reflection_prompt": "When has your pride prevented you from learning or connecting?",
     "practice_prompt": "Humility experiment: Genuinely ask for help with something today.",
     "verse_selector": {"tags": ["pride", "humility", "service"], "max_verses": 2}},
    {"day_index": 2, "step_title": "The Illusion of Separation",
     "teaching_hint": "Ego creates the illusion that we are separate and superior. In truth, we are interconnected.",
     "reflection_prompt": "Who have you been comparing yourself to? Why?",
     "practice_prompt": "Connection practice: Notice 5 ways you're connected to others today.",
     "verse_selector": {"tags": ["unity", "oneness", "connection"], "max_verses": 2}},
    {"day_index": 3, "step_title": "Strength in Service",
     "teaching_hint": "True strength is not dominance but the ability to serve and uplift others.",
     "reflection_prompt": "How might serving others enrich your life?",
     "practice_prompt": "Secret service: Do something helpful for someone without seeking recognition.",
     "verse_selector": {"tags": ["service", "karma", "selflessness"], "max_verses": 2}},
    {"day_index": 4, "step_title": "The Many Faces of Pride",
     "teaching_hint": "Pride takes many forms: intellectual, spiritual, physical, social. Recognize them all.",
     "reflection_prompt": "Which type of pride is most active in you?",
     "practice_prompt": "Pride inventory: Notice subtle forms of pride throughout the day.",
     "verse_selector": {"tags": ["ego", "awareness", "humility"], "max_verses": 2}},
    {"day_index": 5, "step_title": "Spiritual Bypassing",
     "teaching_hint": "Spiritual pride is the subtlest form - thinking you're 'more evolved.'",
     "reflection_prompt": "Have you used spirituality to feel superior to others?",
     "practice_prompt": "Humility check: Notice any spiritual pride arising in practice.",
     "verse_selector": {"tags": ["spirituality", "humility", "authenticity"], "max_verses": 2}},
    {"day_index": 6, "step_title": "The Gift of Not Knowing",
     "teaching_hint": "The beginner's mind is open to learning. Pride closes us off.",
     "reflection_prompt": "What would you learn if you admitted you didn't know?",
     "practice_prompt": "Beginner's mind: Approach a familiar activity as a complete beginner.",
     "verse_selector": {"tags": ["learning", "openness", "wisdom"], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on the journey so far. Where has pride softened?",
     "reflection_prompt": "What has humility revealed to you this week?",
     "practice_prompt": "Write about a moment when letting go of pride felt freeing.",
     "verse_selector": {"tags": ["reflection", "growth", "integration"], "max_verses": 2}},
    {"day_index": 8, "step_title": "Healthy Self-Worth",
     "teaching_hint": "Humility is not self-deprecation. Know your worth without inflation.",
     "reflection_prompt": "Can you acknowledge your gifts without pride or false modesty?",
     "practice_prompt": "Balanced self-view: List your strengths and limitations equally.",
     "verse_selector": {"tags": ["self-worth", "balance", "truth"], "max_verses": 2}},
    {"day_index": 9, "step_title": "Pride in Disguise",
     "teaching_hint": "False humility is pride in disguise. True humility doesn't think about itself.",
     "reflection_prompt": "When does your humility become performance?",
     "practice_prompt": "Authenticity practice: Notice any performance in your humility.",
     "verse_selector": {"tags": ["authenticity", "truth", "awareness"], "max_verses": 2}},
    {"day_index": 10, "step_title": "The Dust of the Devotee's Feet",
     "teaching_hint": "Great sages sought the dust of others' feet. What can we learn from below?",
     "reflection_prompt": "Who have you dismissed that might have something to teach you?",
     "practice_prompt": "Learning from all: Seek wisdom from someone you usually overlook.",
     "verse_selector": {"tags": ["devotion", "humility", "learning"], "max_verses": 2}},
    {"day_index": 11, "step_title": "Pride and Defensiveness",
     "teaching_hint": "Defensiveness is pride protecting itself. Notice when you become defensive.",
     "reflection_prompt": "What criticism triggers your defensiveness? What is it protecting?",
     "practice_prompt": "Receive feedback today without defending or explaining.",
     "verse_selector": {"tags": ["acceptance", "growth", "vulnerability"], "max_verses": 2}},
    {"day_index": 12, "step_title": "Celebrating Others",
     "teaching_hint": "Pride competes; humility celebrates. Find joy in others' success.",
     "reflection_prompt": "Whose success has been hard for you to celebrate? Why?",
     "practice_prompt": "Mudita practice: Genuinely celebrate someone's success today.",
     "verse_selector": {"tags": ["joy", "celebration", "compassion"], "max_verses": 2}},
    {"day_index": 13, "step_title": "The Lightness of Humility",
     "teaching_hint": "Without the burden of maintaining an image, life becomes lighter.",
     "reflection_prompt": "What image are you exhausting yourself to maintain?",
     "practice_prompt": "Image release: Drop one aspect of your 'image' today.",
     "verse_selector": {"tags": ["freedom", "lightness", "authenticity"], "max_verses": 2}},
    {"day_index": 14, "step_title": "The Mastery of Mada",
     "teaching_hint": "Walk with quiet confidence - neither inflated nor deflated.",
     "reflection_prompt": "How has your relationship with pride transformed?",
     "practice_prompt": "Write a commitment: How will you continue cultivating humility?",
     "verse_selector": {"tags": ["mastery", "balance", "wisdom"], "max_verses": 2}},
]


# =============================================================================
# COMPREHENSIVE 21-DAY KAMA (DESIRE) JOURNEY
# =============================================================================

KAMA_STEPS = [
    {"day_index": 1, "step_title": "Understanding Desire",
     "teaching_hint": "Desire itself is not the enemy - it's unconscious, compulsive desire that causes suffering.",
     "reflection_prompt": "What are the desires that feel most compelling in your life right now?",
     "practice_prompt": "Desire mapping: List your top 5 desires. What need does each represent?",
     "verse_selector": {"tags": ["kama", "desire", "senses"], "max_verses": 2}},
    {"day_index": 2, "step_title": "The Senses and the Self",
     "teaching_hint": "The senses are instruments - we must learn to use them wisely rather than be used by them.",
     "reflection_prompt": "Which sense dominates your experience? How does it influence your choices?",
     "practice_prompt": "Sensory fasting: Choose one sense pleasure to abstain from for 24 hours.",
     "verse_selector": {"tags": ["senses", "control", "restraint"], "max_verses": 2}},
    {"day_index": 3, "step_title": "The Art of Contentment",
     "teaching_hint": "Santosha (contentment) is not resignation but a deep appreciation of the present moment.",
     "reflection_prompt": "What would you need to feel truly content? Is it really about having more?",
     "practice_prompt": "Gratitude inventory: List 10 things you have that you once wished for.",
     "verse_selector": {"tags": ["contentment", "satisfaction", "peace"], "max_verses": 2}},
    {"day_index": 4, "step_title": "The Pursuit of Pleasure",
     "teaching_hint": "Pleasure pursued directly often leads to suffering. Joy arises naturally from dharma.",
     "reflection_prompt": "When has pursuing pleasure led to suffering?",
     "practice_prompt": "Notice the difference between pleasure and joy today.",
     "verse_selector": {"tags": ["pleasure", "joy", "dharma"], "max_verses": 2}},
    {"day_index": 5, "step_title": "Desire and Attachment",
     "teaching_hint": "It's not the desire but the attachment to fulfillment that binds us.",
     "reflection_prompt": "What desire are you most attached to fulfilling? What if it never happened?",
     "practice_prompt": "Attachment release: Hold one desire lightly today.",
     "verse_selector": {"tags": ["attachment", "freedom", "detachment"], "max_verses": 2}},
    {"day_index": 6, "step_title": "The Fire of Desire",
     "teaching_hint": "Desire is like fire - it can warm or destroy. Learn to channel its energy.",
     "reflection_prompt": "When has desire energized you positively? When has it consumed you?",
     "practice_prompt": "Fire direction: Channel a strong desire into creative or productive energy.",
     "verse_selector": {"tags": ["energy", "transformation", "power"], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on your relationship with desire. What patterns emerge?",
     "reflection_prompt": "What have you learned about your desires this week?",
     "practice_prompt": "Write about your most significant insight about desire.",
     "verse_selector": {"tags": ["wisdom", "reflection", "integration"], "max_verses": 2}},
    {"day_index": 8, "step_title": "The Three Types of Desire",
     "teaching_hint": "Sattvic desires uplift, rajasic desires agitate, tamasic desires degrade.",
     "reflection_prompt": "What quality do your strongest desires have?",
     "practice_prompt": "Desire quality: Notice which type of desire arises most frequently.",
     "verse_selector": {"tags": ["gunas", "desire", "discrimination"], "max_verses": 2}},
    {"day_index": 9, "step_title": "The Gap Before Action",
     "teaching_hint": "Between desire and action is a gap. Expand that gap with awareness.",
     "reflection_prompt": "How quickly do you act on desire? Can you create more space?",
     "practice_prompt": "Gap practice: When desire arises, wait 10 breaths before acting.",
     "verse_selector": {"tags": ["awareness", "restraint", "consciousness"], "max_verses": 2}},
    {"day_index": 10, "step_title": "Desire for Connection",
     "teaching_hint": "The deepest desire is for connection - with self, others, and the Divine.",
     "reflection_prompt": "How do your surface desires mask a deeper longing for connection?",
     "practice_prompt": "Connection practice: Seek genuine connection rather than satisfaction.",
     "verse_selector": {"tags": ["connection", "love", "unity"], "max_verses": 2}},
    {"day_index": 11, "step_title": "The Infinite in the Finite",
     "teaching_hint": "We seek infinity in finite objects. Only the infinite satisfies.",
     "reflection_prompt": "What infinite need are you trying to fill with finite things?",
     "practice_prompt": "Infinite meditation: Connect with something larger than yourself.",
     "verse_selector": {"tags": ["infinity", "divine", "fulfillment"], "max_verses": 2}},
    {"day_index": 12, "step_title": "Healthy Boundaries with Desire",
     "teaching_hint": "Neither indulgence nor suppression - find the middle path.",
     "reflection_prompt": "Where do you tend toward indulgence? Where toward suppression?",
     "practice_prompt": "Middle path: Practice moderation in one area today.",
     "verse_selector": {"tags": ["balance", "moderation", "wisdom"], "max_verses": 2}},
    {"day_index": 13, "step_title": "Desire and Identity",
     "teaching_hint": "We define ourselves by our desires. Who would you be without them?",
     "reflection_prompt": "How much of your identity is built around your desires?",
     "practice_prompt": "Identity inquiry: Who am I beyond my desires?",
     "verse_selector": {"tags": ["identity", "self", "freedom"], "max_verses": 2}},
    {"day_index": 14, "step_title": "Week Two Integration",
     "teaching_hint": "Notice how your relationship with desire has shifted.",
     "reflection_prompt": "How has your understanding of desire evolved?",
     "practice_prompt": "Write about a desire you now hold more lightly.",
     "verse_selector": {"tags": ["growth", "transformation", "insight"], "max_verses": 2}},
    {"day_index": 15, "step_title": "The Desire for Liberation",
     "teaching_hint": "Even the desire for moksha is desire - but it burns up all others.",
     "reflection_prompt": "Do you desire freedom? What does freedom mean to you?",
     "practice_prompt": "Liberation meditation: Contemplate what true freedom feels like.",
     "verse_selector": {"tags": ["moksha", "liberation", "freedom"], "max_verses": 2}},
    {"day_index": 16, "step_title": "Acting Without Desire",
     "teaching_hint": "Nishkama karma - action without desire for fruit. The highest teaching.",
     "reflection_prompt": "Can you act fully while releasing attachment to outcome?",
     "practice_prompt": "Nishkama practice: Do one task today with no thought of reward.",
     "verse_selector": {"tags": ["karma", "action", "detachment"], "max_verses": 2}},
    {"day_index": 17, "step_title": "Transcending vs Suppressing",
     "teaching_hint": "Suppressed desire returns stronger. Transcendence happens through understanding.",
     "reflection_prompt": "What desires have you suppressed that keep returning?",
     "practice_prompt": "Understanding practice: Sit with a recurring desire compassionately.",
     "verse_selector": {"tags": ["transcendence", "understanding", "compassion"], "max_verses": 2}},
    {"day_index": 18, "step_title": "Divine Desire",
     "teaching_hint": "When desire aligns with dharma, it becomes divine will moving through us.",
     "reflection_prompt": "What desires feel aligned with your highest purpose?",
     "practice_prompt": "Alignment check: Which desires serve your dharma?",
     "verse_selector": {"tags": ["dharma", "divine", "purpose"], "max_verses": 2}},
    {"day_index": 19, "step_title": "The Fulfilled State",
     "teaching_hint": "What if you were already fulfilled? Act from wholeness, not lack.",
     "reflection_prompt": "How would you live if you were already complete?",
     "practice_prompt": "Wholeness practice: Move through the day as if already fulfilled.",
     "verse_selector": {"tags": ["fulfillment", "wholeness", "completeness"], "max_verses": 2}},
    {"day_index": 20, "step_title": "Living with Desire",
     "teaching_hint": "Desire will always arise. The question is: who is in charge?",
     "reflection_prompt": "How can you live with desire without being ruled by it?",
     "practice_prompt": "Mastery practice: Notice desire without being moved by it.",
     "verse_selector": {"tags": ["mastery", "awareness", "freedom"], "max_verses": 2}},
    {"day_index": 21, "step_title": "The Mastery of Kama",
     "teaching_hint": "You have learned to ride the tiger of desire. Now walk with ease.",
     "reflection_prompt": "How has your relationship with desire transformed?",
     "practice_prompt": "Write a commitment: How will you continue mastering desire?",
     "verse_selector": {"tags": ["mastery", "liberation", "wisdom"], "max_verses": 2}},
]


# =============================================================================
# COMPREHENSIVE 14-DAY LOBHA (GREED) JOURNEY
# =============================================================================

LOBHA_STEPS = [
    {"day_index": 1, "step_title": "The Nature of Greed",
     "teaching_hint": "Greed is the fear of scarcity dressed as ambition. It can never be satisfied.",
     "reflection_prompt": "What are you accumulating that you don't truly need?",
     "practice_prompt": "Release practice: Give away one thing you've been holding onto unnecessarily.",
     "verse_selector": {"tags": ["lobha", "greed", "contentment"], "max_verses": 2}},
    {"day_index": 2, "step_title": "Enough is Enough",
     "teaching_hint": "There is a point of 'enough' - recognizing it is the beginning of freedom.",
     "reflection_prompt": "What does 'enough' look like for you in different areas of life?",
     "practice_prompt": "Enough audit: Review one area of your life and define what 'enough' means.",
     "verse_selector": {"tags": ["contentment", "satisfaction", "wealth"], "max_verses": 2}},
    {"day_index": 3, "step_title": "The Joy of Generosity",
     "teaching_hint": "Generosity is the antidote to greed. It opens the heart and creates abundance.",
     "reflection_prompt": "When have you experienced the joy of giving freely?",
     "practice_prompt": "Generosity practice: Give something valuable (time, resources, attention) today.",
     "verse_selector": {"tags": ["charity", "giving", "generosity"], "max_verses": 2}},
    {"day_index": 4, "step_title": "True Wealth",
     "teaching_hint": "True wealth is not what you have but what you don't need.",
     "reflection_prompt": "What do you have that you could happily live without?",
     "practice_prompt": "Wealth meditation: Contemplate what truly makes you rich.",
     "verse_selector": {"tags": ["wealth", "contentment", "freedom"], "max_verses": 2}},
    {"day_index": 5, "step_title": "The Scarcity Mindset",
     "teaching_hint": "Greed operates from scarcity. What if there was always enough?",
     "reflection_prompt": "Where does scarcity thinking drive your behavior?",
     "practice_prompt": "Abundance awareness: Notice moments of 'enough' throughout the day.",
     "verse_selector": {"tags": ["abundance", "trust", "faith"], "max_verses": 2}},
    {"day_index": 6, "step_title": "Letting Go",
     "teaching_hint": "What you cling to, clings to you. Freedom comes from open hands.",
     "reflection_prompt": "What would you gain by letting go of what you're hoarding?",
     "practice_prompt": "Open hands: Practice physically and emotionally releasing grip.",
     "verse_selector": {"tags": ["detachment", "freedom", "release"], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on your relationship with accumulation. What has shifted?",
     "reflection_prompt": "What have you learned about greed and contentment this week?",
     "practice_prompt": "Write about a moment when less felt like more.",
     "verse_selector": {"tags": ["reflection", "growth", "wisdom"], "max_verses": 2}},
    {"day_index": 8, "step_title": "Time and Attention",
     "teaching_hint": "Greed isn't just for things - we hoard time and attention too.",
     "reflection_prompt": "How do you hoard your time and attention? With what effect?",
     "practice_prompt": "Attention generosity: Give your full attention freely today.",
     "verse_selector": {"tags": ["attention", "presence", "generosity"], "max_verses": 2}},
    {"day_index": 9, "step_title": "The Appetite That Grows",
     "teaching_hint": "Feeding greed makes it grow. Contentment starves it.",
     "reflection_prompt": "What appetite grows larger the more you feed it?",
     "practice_prompt": "Appetite awareness: Notice when 'more' doesn't satisfy.",
     "verse_selector": {"tags": ["desire", "satisfaction", "peace"], "max_verses": 2}},
    {"day_index": 10, "step_title": "Stewardship Over Ownership",
     "teaching_hint": "We own nothing truly. We are stewards of what passes through our hands.",
     "reflection_prompt": "How would you treat your possessions if you were their steward, not owner?",
     "practice_prompt": "Steward practice: Care for something as if borrowed.",
     "verse_selector": {"tags": ["stewardship", "dharma", "responsibility"], "max_verses": 2}},
    {"day_index": 11, "step_title": "Sharing vs Giving Up",
     "teaching_hint": "Generosity isn't sacrifice - it's recognition of abundance.",
     "reflection_prompt": "When does giving feel like losing vs sharing?",
     "practice_prompt": "Share something today from a sense of abundance.",
     "verse_selector": {"tags": ["sharing", "abundance", "joy"], "max_verses": 2}},
    {"day_index": 12, "step_title": "The Freedom of Simplicity",
     "teaching_hint": "Simplicity is not poverty - it's the wealth of space.",
     "reflection_prompt": "What would simplicity look like in your life?",
     "practice_prompt": "Simplify one area: Remove excess from one space or schedule.",
     "verse_selector": {"tags": ["simplicity", "freedom", "peace"], "max_verses": 2}},
    {"day_index": 13, "step_title": "Grateful for What Is",
     "teaching_hint": "Gratitude transforms what we have into enough.",
     "reflection_prompt": "What do you already have that you've stopped appreciating?",
     "practice_prompt": "Deep gratitude: Spend 10 minutes appreciating one thing fully.",
     "verse_selector": {"tags": ["gratitude", "contentment", "presence"], "max_verses": 2}},
    {"day_index": 14, "step_title": "The Mastery of Lobha",
     "teaching_hint": "Walk with open hands and a content heart. Abundance flows through, not to.",
     "reflection_prompt": "How has your relationship with greed and contentment transformed?",
     "practice_prompt": "Write a commitment: How will you continue cultivating contentment?",
     "verse_selector": {"tags": ["mastery", "contentment", "freedom"], "max_verses": 2}},
]


# =============================================================================
# COMPREHENSIVE 14-DAY MATSARYA (ENVY) JOURNEY
# =============================================================================

MATSARYA_STEPS = [
    {"day_index": 1, "step_title": "The Poison of Comparison",
     "teaching_hint": "Envy compares our insides to others' outsides. It's a race we can never win.",
     "reflection_prompt": "Whose success or possessions trigger envy in you? What does that reveal?",
     "practice_prompt": "Comparison fast: Avoid social media for 24 hours. Notice how you feel.",
     "verse_selector": {"tags": ["matsarya", "envy", "contentment"], "max_verses": 2}},
    {"day_index": 2, "step_title": "Your Unique Path",
     "teaching_hint": "Everyone has their own dharma. Comparing paths leads us away from our own.",
     "reflection_prompt": "What is unique about your path that no one else can walk?",
     "practice_prompt": "Path reflection: Write about your unique gifts and circumstances.",
     "verse_selector": {"tags": ["dharma", "purpose", "path"], "max_verses": 2}},
    {"day_index": 3, "step_title": "Mudita - Joy in Others' Success",
     "teaching_hint": "Mudita is the practice of finding joy in others' happiness and success.",
     "reflection_prompt": "Can you genuinely celebrate someone's success that you previously envied?",
     "practice_prompt": "Mudita practice: Congratulate someone today on something you wish you had.",
     "verse_selector": {"tags": ["compassion", "joy", "celebration"], "max_verses": 2}},
    {"day_index": 4, "step_title": "Envy as Teacher",
     "teaching_hint": "Envy points to our deepest desires. What is it trying to tell you?",
     "reflection_prompt": "What does your envy reveal about what you truly want?",
     "practice_prompt": "Envy inquiry: When envy arises, ask 'What do I really want?'",
     "verse_selector": {"tags": ["self-knowledge", "desire", "wisdom"], "max_verses": 2}},
    {"day_index": 5, "step_title": "The Illusion of Having It All",
     "teaching_hint": "We envy others' highlight reels. Everyone has struggles we can't see.",
     "reflection_prompt": "Who have you envied without knowing their full story?",
     "practice_prompt": "Whole picture: Consider the hidden struggles of someone you envy.",
     "verse_selector": {"tags": ["compassion", "understanding", "reality"], "max_verses": 2}},
    {"day_index": 6, "step_title": "From Scarcity to Abundance",
     "teaching_hint": "Envy operates from scarcity - as if someone else's success diminishes yours.",
     "reflection_prompt": "How does someone else's gain feel like your loss?",
     "practice_prompt": "Abundance reminder: Their success doesn't reduce your possibilities.",
     "verse_selector": {"tags": ["abundance", "possibility", "faith"], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on envy's grip loosening. What freedom have you found?",
     "reflection_prompt": "What have you learned about envy and contentment this week?",
     "practice_prompt": "Write about a moment of genuine joy in another's success.",
     "verse_selector": {"tags": ["reflection", "growth", "joy"], "max_verses": 2}},
    {"day_index": 8, "step_title": "Inspiration Over Comparison",
     "teaching_hint": "Others' success can inspire rather than diminish us. Choose the lens.",
     "reflection_prompt": "How can someone's achievement inspire rather than threaten you?",
     "practice_prompt": "Inspiration shift: Transform envy into inspiration today.",
     "verse_selector": {"tags": ["inspiration", "growth", "possibility"], "max_verses": 2}},
    {"day_index": 9, "step_title": "Your Enough",
     "teaching_hint": "When you know your 'enough,' others' 'more' doesn't trigger envy.",
     "reflection_prompt": "What is 'enough' for you? Have you defined it clearly?",
     "practice_prompt": "Define your enough: Write clear boundaries of what satisfies you.",
     "verse_selector": {"tags": ["contentment", "boundaries", "satisfaction"], "max_verses": 2}},
    {"day_index": 10, "step_title": "The Gift of Your Limitations",
     "teaching_hint": "Your limitations are as much your dharma as your gifts.",
     "reflection_prompt": "What limitations have secretly served your growth?",
     "practice_prompt": "Limitation gratitude: Thank a limitation for what it taught you.",
     "verse_selector": {"tags": ["acceptance", "growth", "dharma"], "max_verses": 2}},
    {"day_index": 11, "step_title": "Building Your Own Fire",
     "teaching_hint": "Time spent envying others' flames is time not spent building your own.",
     "reflection_prompt": "What have you neglected in yourself while watching others?",
     "practice_prompt": "Your fire: Dedicate time to developing something uniquely yours.",
     "verse_selector": {"tags": ["action", "purpose", "creation"], "max_verses": 2}},
    {"day_index": 12, "step_title": "The Wisdom of Admiration",
     "teaching_hint": "Admiration uplifts both giver and receiver. Envy diminishes both.",
     "reflection_prompt": "Can you transform envy into genuine admiration?",
     "practice_prompt": "Admiration practice: Express genuine admiration to someone today.",
     "verse_selector": {"tags": ["admiration", "connection", "generosity"], "max_verses": 2}},
    {"day_index": 13, "step_title": "Your Timing, Your Journey",
     "teaching_hint": "Everyone blooms in their own season. Trust your timing.",
     "reflection_prompt": "What are you impatient for that may simply not be time for yet?",
     "practice_prompt": "Timing trust: Affirm 'My journey unfolds in perfect timing.'",
     "verse_selector": {"tags": ["patience", "trust", "timing"], "max_verses": 2}},
    {"day_index": 14, "step_title": "The Mastery of Matsarya",
     "teaching_hint": "Walk your unique path with joy, celebrating all others on theirs.",
     "reflection_prompt": "How has your relationship with envy and joy transformed?",
     "practice_prompt": "Write a commitment: How will you continue cultivating mudita?",
     "verse_selector": {"tags": ["mastery", "joy", "freedom"], "max_verses": 2}},
]


# =============================================================================
# COMPREHENSIVE 30-DAY MIXED (COMPLETE TRANSFORMATION) JOURNEY
# =============================================================================

MIXED_STEPS = [
    # Week 1: Foundation & Kama
    {"day_index": 1, "step_title": "The Six Gates of Suffering",
     "teaching_hint": "Introduction to the six inner enemies and how they interrelate.",
     "reflection_prompt": "Which of the six enemies feels most present in your life right now?",
     "practice_prompt": "Self-assessment: Rate each enemy's influence in your life (1-10).",
     "verse_selector": {"tags": ["wisdom", "self-knowledge"], "max_verses": 2}},
    {"day_index": 2, "step_title": "The Observer Within",
     "teaching_hint": "Before we can transform, we must observe. The witness consciousness is key.",
     "reflection_prompt": "Can you watch your thoughts without becoming them?",
     "practice_prompt": "10-minute observer meditation: Simply watch thoughts arise and pass.",
     "verse_selector": {"tags": ["meditation", "witness", "consciousness"], "max_verses": 2}},
    {"day_index": 3, "step_title": "Understanding Desire (Kama)",
     "teaching_hint": "Desire itself is not the enemy - it's unconscious, compulsive desire that causes suffering.",
     "reflection_prompt": "What desires feel most compelling in your life?",
     "practice_prompt": "Desire mapping: Identify your top 5 desires and what need each represents.",
     "verse_selector": {"tags": ["kama", "desire", "awareness"], "max_verses": 2}},
    {"day_index": 4, "step_title": "The Fire of Desire",
     "teaching_hint": "Desire can warm or destroy. Learn to direct its energy.",
     "reflection_prompt": "When has desire energized you positively? When destructively?",
     "practice_prompt": "Channel desire's energy into creative or productive work.",
     "verse_selector": {"tags": ["energy", "transformation", "kama"], "max_verses": 2}},
    {"day_index": 5, "step_title": "Contentment (Santosha)",
     "teaching_hint": "Contentment is not resignation but deep appreciation of what is.",
     "reflection_prompt": "What do you already have that you once wished for?",
     "practice_prompt": "Gratitude inventory: List 10 blessings you've stopped noticing.",
     "verse_selector": {"tags": ["contentment", "gratitude", "peace"], "max_verses": 2}},

    # Week 2: Krodha (Anger)
    {"day_index": 6, "step_title": "Understanding Anger (Krodha)",
     "teaching_hint": "Anger's chain: desire → frustration → anger → delusion → destruction.",
     "reflection_prompt": "What unmet desire underlies your recent anger?",
     "practice_prompt": "The Pause: Take 3 breaths before responding to any trigger today.",
     "verse_selector": {"tags": ["krodha", "anger", "patience"], "max_verses": 2}},
    {"day_index": 7, "step_title": "Week One Integration",
     "teaching_hint": "Reflect on Kama and the beginning of Krodha work.",
     "reflection_prompt": "What connections do you see between desire and anger?",
     "practice_prompt": "Journal synthesis of Week 1 insights.",
     "verse_selector": {"tags": ["reflection", "integration", "wisdom"], "max_verses": 2}},
    {"day_index": 8, "step_title": "Beneath the Anger",
     "teaching_hint": "Under anger often lies hurt, fear, or unmet needs.",
     "reflection_prompt": "What emotion hides beneath your anger?",
     "practice_prompt": "When anger arises, ask: 'What am I really feeling?'",
     "verse_selector": {"tags": ["self-knowledge", "emotion", "healing"], "max_verses": 2}},
    {"day_index": 9, "step_title": "Patience (Kshama)",
     "teaching_hint": "Patience is strength, not weakness. It creates space for wisdom.",
     "reflection_prompt": "Where is patience most difficult for you?",
     "practice_prompt": "Patience meditation: Sit still for 10 minutes, observing impatience.",
     "verse_selector": {"tags": ["patience", "strength", "peace"], "max_verses": 2}},
    {"day_index": 10, "step_title": "Forgiveness as Freedom",
     "teaching_hint": "Holding anger is like holding hot coal. Forgiveness sets you free.",
     "reflection_prompt": "Who are you still holding anger toward?",
     "practice_prompt": "Forgiveness meditation: Send compassion to someone who wronged you.",
     "verse_selector": {"tags": ["forgiveness", "compassion", "freedom"], "max_verses": 2}},

    # Week 3: Lobha (Greed)
    {"day_index": 11, "step_title": "Understanding Greed (Lobha)",
     "teaching_hint": "Greed is fear of scarcity dressed as ambition.",
     "reflection_prompt": "What are you accumulating beyond need?",
     "practice_prompt": "Release: Give away one thing you've been hoarding.",
     "verse_selector": {"tags": ["lobha", "greed", "contentment"], "max_verses": 2}},
    {"day_index": 12, "step_title": "Enough",
     "teaching_hint": "Recognizing 'enough' is the beginning of freedom.",
     "reflection_prompt": "What does 'enough' look like in your life?",
     "practice_prompt": "Define 'enough' in three areas of your life.",
     "verse_selector": {"tags": ["contentment", "freedom", "peace"], "max_verses": 2}},
    {"day_index": 13, "step_title": "Generosity (Dana)",
     "teaching_hint": "Generosity is the antidote to greed. It opens the heart.",
     "reflection_prompt": "When did giving freely bring you joy?",
     "practice_prompt": "Give something valuable (time, resources, attention) today.",
     "verse_selector": {"tags": ["generosity", "charity", "joy"], "max_verses": 2}},
    {"day_index": 14, "step_title": "Week Two Integration",
     "teaching_hint": "Reflect on Krodha and Lobha work.",
     "reflection_prompt": "How do anger and greed relate in your experience?",
     "practice_prompt": "Journal synthesis of Week 2 insights.",
     "verse_selector": {"tags": ["reflection", "integration", "wisdom"], "max_verses": 2}},
    {"day_index": 15, "step_title": "True Wealth",
     "teaching_hint": "True wealth is not what you have but what you don't need.",
     "reflection_prompt": "What could you happily live without?",
     "practice_prompt": "Simplify one area of your life today.",
     "verse_selector": {"tags": ["simplicity", "freedom", "wealth"], "max_verses": 2}},

    # Week 4: Moha (Delusion)
    {"day_index": 16, "step_title": "Understanding Delusion (Moha)",
     "teaching_hint": "Moha is the fog that obscures reality. It's the root of all enemies.",
     "reflection_prompt": "What beliefs have you never questioned?",
     "practice_prompt": "Reality check: Question one assumption about your life.",
     "verse_selector": {"tags": ["moha", "clarity", "wisdom"], "max_verses": 2}},
    {"day_index": 17, "step_title": "Attachment and Identity",
     "teaching_hint": "We confuse who we are with what we have and do.",
     "reflection_prompt": "Who would you be without your roles and possessions?",
     "practice_prompt": "Identity inquiry: List 5 things you identify with. Question each.",
     "verse_selector": {"tags": ["attachment", "identity", "self"], "max_verses": 2}},
    {"day_index": 18, "step_title": "Discrimination (Viveka)",
     "teaching_hint": "Viveka is the ability to discern real from unreal.",
     "reflection_prompt": "What helps you see clearly in moments of confusion?",
     "practice_prompt": "Morning clarity: Start the day asking 'What is most true?'",
     "verse_selector": {"tags": ["viveka", "discrimination", "clarity"], "max_verses": 2}},
    {"day_index": 19, "step_title": "Letting Go of Control",
     "teaching_hint": "The illusion of control creates suffering. Surrender to what is.",
     "reflection_prompt": "What are you trying to control that's beyond your control?",
     "practice_prompt": "Release one thing you've been trying to control.",
     "verse_selector": {"tags": ["surrender", "acceptance", "peace"], "max_verses": 2}},
    {"day_index": 20, "step_title": "The Witness",
     "teaching_hint": "Behind all experiences is the unchanging witness. You are That.",
     "reflection_prompt": "Can you observe thoughts and emotions as passing phenomena?",
     "practice_prompt": "Witness meditation: Rest as awareness behind experience.",
     "verse_selector": {"tags": ["witness", "consciousness", "self"], "max_verses": 2}},

    # Week 5: Mada (Pride) & Matsarya (Envy)
    {"day_index": 21, "step_title": "Week Three Integration",
     "teaching_hint": "Reflect on Lobha and Moha work.",
     "reflection_prompt": "How do greed and delusion feed each other?",
     "practice_prompt": "Journal synthesis of Week 3 insights.",
     "verse_selector": {"tags": ["reflection", "integration", "wisdom"], "max_verses": 2}},
    {"day_index": 22, "step_title": "Understanding Pride (Mada)",
     "teaching_hint": "Pride separates us from connection and learning.",
     "reflection_prompt": "When has pride prevented you from learning or connecting?",
     "practice_prompt": "Humility: Ask for help with something today.",
     "verse_selector": {"tags": ["mada", "pride", "humility"], "max_verses": 2}},
    {"day_index": 23, "step_title": "Interconnection",
     "teaching_hint": "Ego creates the illusion of separation. We are all connected.",
     "reflection_prompt": "Who have you placed yourself above?",
     "practice_prompt": "Notice 5 ways you're connected to others today.",
     "verse_selector": {"tags": ["unity", "connection", "oneness"], "max_verses": 2}},
    {"day_index": 24, "step_title": "Service (Seva)",
     "teaching_hint": "True strength is the ability to serve and uplift others.",
     "reflection_prompt": "How might serving others enrich your life?",
     "practice_prompt": "Secret service: Help someone without seeking recognition.",
     "verse_selector": {"tags": ["service", "karma", "selflessness"], "max_verses": 2}},
    {"day_index": 25, "step_title": "Understanding Envy (Matsarya)",
     "teaching_hint": "Envy compares our insides to others' outsides.",
     "reflection_prompt": "Whose success triggers envy? What does that reveal?",
     "practice_prompt": "Comparison fast: Avoid social media for 24 hours.",
     "verse_selector": {"tags": ["matsarya", "envy", "contentment"], "max_verses": 2}},

    # Week 6: Integration & Mastery
    {"day_index": 26, "step_title": "Mudita - Sympathetic Joy",
     "teaching_hint": "Find joy in others' happiness and success.",
     "reflection_prompt": "Can you genuinely celebrate someone's success?",
     "practice_prompt": "Congratulate someone on something you wish you had.",
     "verse_selector": {"tags": ["mudita", "joy", "compassion"], "max_verses": 2}},
    {"day_index": 27, "step_title": "Your Unique Dharma",
     "teaching_hint": "Everyone has their own path. Walk yours fully.",
     "reflection_prompt": "What is unique about your path?",
     "practice_prompt": "Write about your unique gifts and purpose.",
     "verse_selector": {"tags": ["dharma", "purpose", "path"], "max_verses": 2}},
    {"day_index": 28, "step_title": "Week Four Integration",
     "teaching_hint": "Reflect on Mada and Matsarya work.",
     "reflection_prompt": "How do pride and envy relate in your experience?",
     "practice_prompt": "Journal synthesis of Week 4 insights.",
     "verse_selector": {"tags": ["reflection", "integration", "wisdom"], "max_verses": 2}},
    {"day_index": 29, "step_title": "The Integrated Self",
     "teaching_hint": "All enemies are aspects of one ignorance. See them as one.",
     "reflection_prompt": "How do the six enemies work together in you?",
     "practice_prompt": "Integration meditation: See all enemies as one pattern.",
     "verse_selector": {"tags": ["integration", "wholeness", "self"], "max_verses": 2}},
    {"day_index": 30, "step_title": "The Complete Transformation",
     "teaching_hint": "You have walked the full path. Now live as the transformed being.",
     "reflection_prompt": "How has your inner world transformed over these 30 days?",
     "practice_prompt": "Write a commitment: How will you continue this transformation?",
     "verse_selector": {"tags": ["mastery", "liberation", "transformation"], "max_verses": 2}},
]


# =============================================================================
# MAPPING TEMPLATES TO STEPS
# =============================================================================

TEMPLATE_STEPS = {
    "krodha": KRODHA_STEPS,
    "moha": MOHA_STEPS,
    "mada": MADA_STEPS,
    "kama": KAMA_STEPS,
    "lobha": LOBHA_STEPS,
    "matsarya": MATSARYA_STEPS,
    "mixed": MIXED_STEPS,
}


# =============================================================================
# SEEDING FUNCTIONS
# =============================================================================

async def seed_journey_templates():
    """Seed journey templates and their steps."""
    engine = create_async_engine(DATABASE_URL, echo=True)

    # First, ensure all tables exist
    from backend.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Ensured all tables exist")

    async with engine.begin() as conn:
        for template in JOURNEY_TEMPLATES:
            template_id = str(uuid.uuid4())

            await conn.execute(
                text("""
                    INSERT INTO journey_templates (
                        id, slug, title, description, primary_enemy_tags,
                        duration_days, difficulty, is_active, is_featured, is_free,
                        icon_name, color_theme, created_at, updated_at
                    )
                    VALUES (
                        :id, :slug, :title, :description, CAST(:primary_enemy_tags AS jsonb),
                        :duration_days, :difficulty, true, :is_featured, :is_free,
                        :icon_name, :color_theme, NOW(), NOW()
                    )
                    ON CONFLICT (slug) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        primary_enemy_tags = CAST(EXCLUDED.primary_enemy_tags AS jsonb),
                        duration_days = EXCLUDED.duration_days,
                        difficulty = EXCLUDED.difficulty,
                        is_featured = EXCLUDED.is_featured,
                        is_free = EXCLUDED.is_free,
                        icon_name = EXCLUDED.icon_name,
                        color_theme = EXCLUDED.color_theme,
                        is_active = true,
                        updated_at = NOW()
                    RETURNING id
                """),
                {
                    "id": template_id,
                    "slug": template["slug"],
                    "title": template["title"],
                    "description": template["description"],
                    "primary_enemy_tags": json.dumps(template["primary_enemy_tags"]),
                    "duration_days": template["duration_days"],
                    "difficulty": template["difficulty"],
                    "is_featured": template["is_featured"],
                    "is_free": template.get("is_free", False),
                    "icon_name": template.get("icon_name"),
                    "color_theme": template.get("color_theme"),
                },
            )

            result = await conn.execute(
                text("SELECT id FROM journey_templates WHERE slug = :slug"),
                {"slug": template["slug"]},
            )
            row = result.fetchone()
            actual_template_id = row[0] if row else template_id

            print(f"Created template: {template['title']} ({actual_template_id})")

            # Get steps for this template's primary enemy
            primary_enemy = template["primary_enemy_tags"][0]
            steps = TEMPLATE_STEPS.get(primary_enemy, TEMPLATE_STEPS["mixed"])

            # Only create steps up to the template's duration
            steps_to_create = [s for s in steps if s["day_index"] <= template["duration_days"]]

            for step in steps_to_create:
                step_id = str(uuid.uuid4())

                await conn.execute(
                    text("""
                        INSERT INTO journey_template_steps (
                            id, journey_template_id, day_index,
                            step_title, teaching_hint, reflection_prompt, practice_prompt,
                            verse_selector, static_verse_refs, safety_notes,
                            created_at, updated_at
                        )
                        VALUES (
                            :id, :journey_template_id, :day_index,
                            :step_title, :teaching_hint, :reflection_prompt, :practice_prompt,
                            CAST(:verse_selector AS jsonb), CAST(:static_verse_refs AS jsonb), :safety_notes,
                            NOW(), NOW()
                        )
                        ON CONFLICT (journey_template_id, day_index) DO UPDATE SET
                            step_title = EXCLUDED.step_title,
                            teaching_hint = EXCLUDED.teaching_hint,
                            reflection_prompt = EXCLUDED.reflection_prompt,
                            practice_prompt = EXCLUDED.practice_prompt,
                            verse_selector = EXCLUDED.verse_selector,
                            static_verse_refs = EXCLUDED.static_verse_refs,
                            updated_at = NOW()
                    """),
                    {
                        "id": step_id,
                        "journey_template_id": actual_template_id,
                        "day_index": step["day_index"],
                        "step_title": step.get("step_title"),
                        "teaching_hint": step.get("teaching_hint"),
                        "reflection_prompt": step.get("reflection_prompt"),
                        "practice_prompt": step.get("practice_prompt"),
                        "verse_selector": json.dumps(step.get("verse_selector", {})),
                        "static_verse_refs": json.dumps(step.get("static_verse_refs")) if step.get("static_verse_refs") else None,
                        "safety_notes": step.get("safety_notes"),
                    },
                )

            print(f"  - Created {len(steps_to_create)} steps")

    await engine.dispose()
    print("\n✅ Seeding complete!")


def validate_data():
    """Validate seed data structure."""
    print("=" * 60)
    print("Validating Journey Templates Data")
    print("=" * 60)

    print(f"\n[Templates] Found {len(JOURNEY_TEMPLATES)} journey templates:")
    for t in JOURNEY_TEMPLATES:
        enemies = ", ".join(t["primary_enemy_tags"])
        print(f"  - {t['title']} ({t['duration_days']} days, focus: {enemies})")

    print(f"\n[Steps] Found {len(TEMPLATE_STEPS)} enemy step sets:")
    for enemy, steps in TEMPLATE_STEPS.items():
        print(f"  - {enemy}: {len(steps)} days defined")

    errors = []
    for t in JOURNEY_TEMPLATES:
        required = ["slug", "title", "description", "primary_enemy_tags", "duration_days", "difficulty"]
        for field in required:
            if field not in t:
                errors.append(f"Template '{t.get('slug', 'unknown')}' missing field: {field}")

        # Check if steps cover the template duration
        primary_enemy = t["primary_enemy_tags"][0]
        steps = TEMPLATE_STEPS.get(primary_enemy, TEMPLATE_STEPS["mixed"])
        max_step_day = max(s["day_index"] for s in steps) if steps else 0
        if max_step_day < t["duration_days"]:
            print(f"  ⚠️  {t['slug']}: Only {max_step_day} steps for {t['duration_days']}-day journey")

    if errors:
        print(f"\n[ERRORS] Found {len(errors)} validation errors:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print("\n✅ All data structures are valid!")
        print("\nTo seed the database:")
        print("  python scripts/seed_journey_templates.py --seed")
        return True


if __name__ == "__main__":
    if "--dry-run" in sys.argv or len(sys.argv) == 1:
        success = validate_data()
        sys.exit(0 if success else 1)
    elif "--seed" in sys.argv:
        asyncio.run(seed_journey_templates())
    else:
        print("Usage:")
        print("  python scripts/seed_journey_templates.py           # Validate data")
        print("  python scripts/seed_journey_templates.py --seed    # Seed database")
        sys.exit(1)

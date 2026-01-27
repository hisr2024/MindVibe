"""
Indian Data Sources Service - Bhagavad Gita Focused Wisdom Engine

This service provides integration with authentic Indian government and institutional
data sources, specifically focused on Bhagavad Gita teachings and related dharmic wisdom.

The service extends KIAAN's existing 700+ Gita verse database with:
1. Authentic commentaries from recognized scholars (Gita Press, Swami Sivananda, etc.)
2. Yoga paths as taught in the Gita (Karma, Bhakti, Jnana, Dhyana)
3. Mental health applications rooted in Gita philosophy
4. Government wellness resources aligned with Gita principles
5. Traditional practices referenced in the Gita

Data Sources:
- Gita Press, Gorakhpur - Authentic Gita translations and commentaries
- Ministry of AYUSH - Yoga as taught in ancient texts including Gita
- National Health Portal - Mental wellness through traditional wisdom
- ICMR - Research on meditation and yoga practices from Gita tradition

All content maintains the sanctity of Gita teachings while providing
practical mental health applications.
"""

import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class GitaWisdomSource(str, Enum):
    """Sources for authentic Bhagavad Gita wisdom."""

    GITA_PRESS = "gita_press"  # Gita Press, Gorakhpur - most authentic
    SWAMI_SIVANANDA = "swami_sivananda"  # Divine Life Society
    SWAMI_CHINMAYANANDA = "swami_chinmayananda"  # Chinmaya Mission
    RAMAKRISHNA_MISSION = "ramakrishna_mission"  # Ramakrishna Math
    AYUSH_YOGA = "ministry_ayush"  # Ministry of AYUSH
    NHP_WELLNESS = "national_health_portal"  # Government wellness
    ICMR_RESEARCH = "icmr"  # Research studies


class GitaYogaPath(str, Enum):
    """The four main yoga paths taught in the Bhagavad Gita."""

    KARMA_YOGA = "karma_yoga"  # Path of selfless action (Chapters 3, 5)
    BHAKTI_YOGA = "bhakti_yoga"  # Path of devotion (Chapter 12)
    JNANA_YOGA = "jnana_yoga"  # Path of knowledge (Chapter 2, 4)
    DHYANA_YOGA = "dhyana_yoga"  # Path of meditation (Chapter 6)
    RAJA_YOGA = "raja_yoga"  # Royal path (synthesis of above)


class GitaMentalHealthTheme(str, Enum):
    """Mental health themes derived from Bhagavad Gita teachings."""

    EQUANIMITY = "equanimity"  # Samatva - Chapter 2
    DETACHMENT = "detachment"  # Vairagya - Chapter 2, 6
    SELF_MASTERY = "self_mastery"  # Atma Samyama - Chapter 6
    ANXIETY_RELIEF = "anxiety_relief"  # Shanti - Chapter 2
    STEADY_WISDOM = "steady_wisdom"  # Sthitaprajna - Chapter 2
    DUTY_FULFILLMENT = "duty_fulfillment"  # Svadharma - Chapter 3
    FEARLESSNESS = "fearlessness"  # Abhaya - Chapter 16
    PEACE_OF_MIND = "peace_of_mind"  # Shanti - Chapter 5
    EMOTIONAL_BALANCE = "emotional_balance"  # Yoga - Chapter 6
    STRESS_RESILIENCE = "stress_resilience"  # Yoga Kshema - Chapter 9


@dataclass
class GitaTeaching:
    """Represents a teaching derived from Bhagavad Gita."""

    id: str
    source: GitaWisdomSource
    yoga_path: GitaYogaPath | None
    theme: GitaMentalHealthTheme
    title: str
    teaching: str
    sanskrit_verse: str | None = None  # Original Sanskrit reference
    verse_reference: str | None = None  # e.g., "2.47" for Chapter 2, Verse 47
    hindi_translation: str | None = None
    practical_application: str | None = None
    mental_health_benefit: str | None = None
    keywords: list[str] = field(default_factory=list)


@dataclass
class GitaYogaPractice:
    """Yoga practice as taught in the Bhagavad Gita."""

    id: str
    yoga_path: GitaYogaPath
    sanskrit_name: str
    english_name: str
    gita_reference: str  # Verse references
    description: str
    instructions: list[str] = field(default_factory=list)
    mental_benefits: list[str] = field(default_factory=list)
    gita_verses_related: list[str] = field(default_factory=list)
    duration_minutes: int = 15


@dataclass
class GitaMeditationTechnique:
    """Meditation techniques from Bhagavad Gita Chapter 6 (Dhyana Yoga)."""

    id: str
    sanskrit_name: str
    english_name: str
    gita_reference: str
    description: str
    instructions: list[str] = field(default_factory=list)
    mental_benefits: list[str] = field(default_factory=list)
    verse_guidance: str | None = None  # Specific verse teaching
    duration_minutes: int = 20


@dataclass
class SthitaprajnaQuality:
    """
    Qualities of the Sthitaprajna (person of steady wisdom) from Gita 2.54-72.

    These verses form the foundation of mental health in Gita philosophy.
    """

    id: str
    quality: str
    sanskrit_term: str
    verse_reference: str
    description: str
    mental_health_application: str
    practical_steps: list[str] = field(default_factory=list)


class IndianGitaSourcesService:
    """
    Service for authentic Bhagavad Gita wisdom and related Indian sources.

    This service extends KIAAN's Gita verse database with:
    - Authentic commentaries from recognized scholars
    - Yoga paths as taught in the Gita
    - Mental health applications rooted in Gita philosophy
    - Practical exercises based on Gita teachings
    """

    def __init__(self):
        """Initialize the Gita-focused Indian data sources service."""
        # Pre-load curated content from authentic Gita sources
        self._gita_teachings = self._load_gita_teachings()
        self._yoga_practices = self._load_gita_yoga_practices()
        self._meditation_techniques = self._load_gita_meditation()
        self._sthitaprajna_qualities = self._load_sthitaprajna_qualities()
        self._karma_yoga_principles = self._load_karma_yoga_principles()

        logger.info("IndianGitaSourcesService initialized with authentic Bhagavad Gita content")

    def _generate_id(self, prefix: str, title: str) -> str:
        """Generate a unique content ID."""
        # SECURITY: Use sha256 instead of md5 for consistency
        content_hash = hashlib.sha256(f"{prefix}:{title}".encode()).hexdigest()[:12]
        return f"{prefix}_{content_hash}"

    # ==================== GITA TEACHINGS ====================

    def _load_gita_teachings(self) -> list[GitaTeaching]:
        """
        Load core Bhagavad Gita teachings for mental health.

        Based on authentic sources:
        - Gita Press translations
        - Swami Sivananda's commentary
        - Traditional interpretations
        """
        return [
            GitaTeaching(
                id=self._generate_id("teaching", "karma_yoga_core"),
                source=GitaWisdomSource.GITA_PRESS,
                yoga_path=GitaYogaPath.KARMA_YOGA,
                theme=GitaMentalHealthTheme.DETACHMENT,
                title="The Core Teaching of Karma Yoga",
                teaching="""The essence of Karma Yoga is performing one's duty without attachment
to the fruits of action. This teaching (Gita 2.47) is the foundation of mental peace:

'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन'

You have the right to work only, but never to its fruits. Let not the fruits
of action be your motive, nor let your attachment be to inaction.

This principle liberates the mind from anxiety about outcomes, stress about
results, and fear of failure. When we focus purely on doing our best in the
present moment, the mind finds natural peace.""",
                sanskrit_verse="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
                verse_reference="2.47",
                hindi_translation="कर्म करने में ही तेरा अधिकार है, फल में कभी नहीं। कर्मफल में तेरी आसक्ति न हो और कर्म न करने में भी आसक्ति न हो।",
                practical_application="Focus entirely on the quality of your effort, not the outcome. When anxiety arises about results, gently return attention to the present action.",
                mental_health_benefit="Reduces performance anxiety, fear of failure, and outcome-related stress",
                keywords=["karma", "action", "detachment", "duty", "anxiety", "stress"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "equanimity"),
                source=GitaWisdomSource.GITA_PRESS,
                yoga_path=GitaYogaPath.KARMA_YOGA,
                theme=GitaMentalHealthTheme.EQUANIMITY,
                title="Samatva - The Yoga of Equanimity",
                teaching="""Equanimity (Samatva) is defined as yoga itself in the Gita (2.48):

'समत्वं योग उच्यते'

Perform action being steadfast in yoga, abandoning attachment, and balanced
in success and failure. Equanimity is called yoga.

This teaching addresses the emotional turbulence caused by life's inevitable
ups and downs. When we develop equanimity, we remain stable whether praised
or criticized, whether succeeding or failing. This is the essence of
mental health - not the absence of challenges, but stability amidst them.""",
                sanskrit_verse="योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
                verse_reference="2.48",
                hindi_translation="योग में स्थित होकर कर्म कर, आसक्ति त्यागकर और सिद्धि-असिद्धि में समान रहकर। यह समत्व ही योग कहलाता है।",
                practical_application="When facing success or failure, pause and breathe. Remind yourself: 'My worth is not defined by outcomes.' Return to your center.",
                mental_health_benefit="Emotional stability, resilience to setbacks, reduced mood swings",
                keywords=["equanimity", "balance", "stability", "yoga", "emotional"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "sthitaprajna"),
                source=GitaWisdomSource.SWAMI_SIVANANDA,
                yoga_path=GitaYogaPath.JNANA_YOGA,
                theme=GitaMentalHealthTheme.STEADY_WISDOM,
                title="Sthitaprajna - The Person of Steady Wisdom",
                teaching="""Arjuna asks Krishna (2.54): 'What are the marks of one whose wisdom is
steady, who is absorbed in the Self? How does one of steady wisdom speak,
sit, and walk?'

Krishna's response (2.55-72) provides the most complete description of
mental health in any ancient text. The Sthitaprajna:

- Is satisfied in the Self alone (2.55)
- Is unshaken by sorrows (2.56)
- Has withdrawn senses like a tortoise (2.58)
- Has conquered desire and anger (2.62-63)
- Attains peace through self-control (2.64)

This is the Gita's model of optimal mental functioning - not suppression
of emotions, but transcendence through wisdom.""",
                sanskrit_verse="दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः। वीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते॥",
                verse_reference="2.56",
                hindi_translation="जिसका मन दुःखों में उद्विग्न नहीं होता, सुखों में जो स्पृहारहित है, राग, भय और क्रोध से रहित है, वह स्थितप्रज्ञ मुनि कहलाता है।",
                practical_application="Practice observing your reactions without immediately acting on them. Like the tortoise withdrawing limbs, learn to withdraw from reactive impulses.",
                mental_health_benefit="Emotional regulation, reduced reactivity, inner stability",
                keywords=["sthitaprajna", "wisdom", "stability", "self-control", "peace"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "anxiety_chain"),
                source=GitaWisdomSource.GITA_PRESS,
                yoga_path=GitaYogaPath.JNANA_YOGA,
                theme=GitaMentalHealthTheme.ANXIETY_RELIEF,
                title="The Chain of Mental Disturbance",
                teaching="""The Gita (2.62-63) provides a precise psychological analysis of how
mental disturbance arises:

ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।
सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥

क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।
स्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥

The chain: Dwelling on objects → Attachment → Desire → Anger (when
desire is frustrated) → Delusion → Memory loss → Loss of discrimination
→ Complete destruction.

Understanding this chain allows us to intervene early. The moment we notice
excessive dwelling on desires or objects, we can redirect attention.""",
                sanskrit_verse="ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते। सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥",
                verse_reference="2.62-63",
                hindi_translation="विषयों का चिंतन करने से उनमें आसक्ति होती है, आसक्ति से काम उत्पन्न होता है, काम से क्रोध, क्रोध से मोह, मोह से स्मृति भ्रष्ट होती है।",
                practical_application="When you notice rumination or obsessive thinking about something, consciously redirect attention to breath or present-moment awareness.",
                mental_health_benefit="Breaks cycles of rumination, prevents anxiety escalation, reduces anger",
                keywords=["rumination", "anxiety", "anger", "awareness", "prevention"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "peace_attainment"),
                source=GitaWisdomSource.SWAMI_SIVANANDA,
                yoga_path=GitaYogaPath.DHYANA_YOGA,
                theme=GitaMentalHealthTheme.PEACE_OF_MIND,
                title="The Path to Lasting Peace",
                teaching="""The Gita (2.64-66) describes how peace is attained:

'रागद्वेषवियुक्तैस्तु विषयानिन्द्रियैश्चरन्। आत्मवश्यैर्विधेयात्मा प्रसादमधिगच्छति॥'

But the self-controlled person, moving among objects with senses free
from attraction and repulsion, attains serenity (prasada).

From serenity comes the end of all sorrows. The intellect of the tranquil
becomes firmly established.

There is no wisdom for the unsteady, no meditation for the unsteady,
no peace for one without meditation - and for one without peace,
how can there be happiness?

This creates a positive cycle: self-control → serenity → wisdom →
deeper peace → greater happiness.""",
                sanskrit_verse="प्रसादे सर्वदुःखानां हानिरस्योपजायते। प्रसन्नचेतसो ह्याशु बुद्धिः पर्यवतिष्ठते॥",
                verse_reference="2.65",
                hindi_translation="प्रसन्नता में सब दुःखों का नाश हो जाता है और प्रसन्नचित्त का बुद्धि शीघ्र ही स्थिर हो जाता है।",
                practical_application="Practice moving through your day without strong attraction or aversion. When you notice craving or resistance, pause and breathe, returning to neutral awareness.",
                mental_health_benefit="Reduces emotional reactivity, promotes lasting peace, builds resilience",
                keywords=["peace", "serenity", "prasada", "happiness", "self-control"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "fear_freedom"),
                source=GitaWisdomSource.GITA_PRESS,
                yoga_path=GitaYogaPath.BHAKTI_YOGA,
                theme=GitaMentalHealthTheme.FEARLESSNESS,
                title="Abhaya - Freedom from Fear",
                teaching="""Fearlessness (Abhaya) is listed first among the divine qualities (Gita 16.1):

'अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः।'

Fearlessness, purity of heart, steadfastness in knowledge and yoga...

Fear is the root of many mental health challenges - anxiety, phobias,
avoidance, paralysis. The Gita teaches that fearlessness comes from:

1. Knowledge of the eternal nature of the Self (2.19-20)
2. Surrender to the divine (18.66)
3. Recognition that the Self cannot be harmed (2.23-24)
4. Living in alignment with dharma (18.30-31)

When we understand that our essential nature is beyond harm, fear
naturally diminishes.""",
                sanskrit_verse="अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः। दानं दमश्च यज्ञश्च स्वाध्यायस्तप आर्जवम्॥",
                verse_reference="16.1",
                hindi_translation="भय का अभाव, अंतःकरण की शुद्धि, ज्ञान और योग में स्थिति, दान, संयम, यज्ञ, स्वाध्याय, तप और सरलता।",
                practical_application="When fear arises, remind yourself: 'My true Self is beyond harm. This fear is of the temporary, not the eternal.' Take refuge in this understanding.",
                mental_health_benefit="Reduces anxiety and phobic responses, builds courage, promotes confidence",
                keywords=["fearlessness", "courage", "abhaya", "security", "confidence"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "mind_control"),
                source=GitaWisdomSource.SWAMI_CHINMAYANANDA,
                yoga_path=GitaYogaPath.DHYANA_YOGA,
                theme=GitaMentalHealthTheme.SELF_MASTERY,
                title="Mastery Over the Restless Mind",
                teaching="""Arjuna's lament (6.34) expresses what many feel:

'चञ्चलं हि मनः कृष्ण प्रमाथि बलवद्दृढम्। तस्याहं निग्रहं मन्ये वायोरिव सुदुष्करम्॥'

The mind is restless, turbulent, strong, and obstinate, O Krishna.
I consider it as difficult to control as the wind.

Krishna's response (6.35) offers hope:

'असंशयं महाबाहो मनो दुर्निग्रहं चलम्। अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥'

Undoubtedly, the mind is difficult to control and restless.
But through practice (abhyasa) and dispassion (vairagya), it can be controlled.

This is the essence of meditation: persistent practice combined with
non-attachment to results.""",
                sanskrit_verse="अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते",
                verse_reference="6.35",
                hindi_translation="निःसंदेह मन को वश में करना कठिन है, परन्तु अभ्यास और वैराग्य से यह वश में हो जाता है।",
                practical_application="Accept that the mind is naturally restless. Don't fight it. Through consistent, gentle practice of returning attention to your chosen focus, mastery gradually develops.",
                mental_health_benefit="Builds concentration, reduces mental restlessness, develops inner discipline",
                keywords=["mind", "control", "practice", "vairagya", "meditation"],
            ),
            GitaTeaching(
                id=self._generate_id("teaching", "self_friend"),
                source=GitaWisdomSource.GITA_PRESS,
                yoga_path=GitaYogaPath.DHYANA_YOGA,
                theme=GitaMentalHealthTheme.SELF_MASTERY,
                title="The Self as Friend or Enemy",
                teaching="""One of the most psychologically profound verses (6.5-6):

'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥'

Let a person lift himself by his own Self; let him not degrade himself.
For the Self alone is the friend of the self, and the Self alone is
the enemy of the self.

To him who has conquered himself by the Self, the Self is a friend.
But to him who has not conquered himself, the Self remains hostile
like an enemy.

This teaching is the foundation of self-compassion and self-improvement.
We have the power to be our own greatest ally or worst enemy.""",
                sanskrit_verse="उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
                verse_reference="6.5",
                hindi_translation="अपने द्वारा अपना उद्धार करे, अपने को नीचे न गिराए। आत्मा ही आत्मा का मित्र है और आत्मा ही आत्मा का शत्रु है।",
                practical_application="When self-criticism arises, ask: 'Am I being my own friend or enemy right now?' Choose to uplift yourself through compassionate self-talk.",
                mental_health_benefit="Develops self-compassion, reduces self-criticism, promotes self-improvement",
                keywords=["self", "friend", "enemy", "compassion", "improvement"],
            ),
        ]

    # ==================== YOGA PRACTICES FROM GITA ====================

    def _load_gita_yoga_practices(self) -> list[GitaYogaPractice]:
        """
        Load the four yoga paths as taught in the Bhagavad Gita.
        """
        return [
            GitaYogaPractice(
                id="yoga_karma_001",
                yoga_path=GitaYogaPath.KARMA_YOGA,
                sanskrit_name="Nishkama Karma",
                english_name="Selfless Action Practice",
                gita_reference="Chapters 2, 3, 5",
                description="""Karma Yoga is the path of selfless action taught extensively in the Gita.
It is performing one's duties without attachment to results, offering all actions
to the divine. This is not inaction, but action performed with complete presence
and detachment from outcomes.""",
                instructions=[
                    "Choose any daily task or duty",
                    "Before beginning, set the intention: 'I offer this action without attachment to results'",
                    "Focus completely on the quality of your effort",
                    "When thoughts of results arise, gently return to the present action",
                    "Upon completion, release the action: 'The outcome is not in my hands'",
                    "Practice this with increasingly challenging situations",
                ],
                mental_benefits=[
                    "Reduces performance anxiety",
                    "Eliminates fear of failure",
                    "Promotes presence and mindfulness",
                    "Develops equanimity",
                    "Reduces stress related to outcomes",
                ],
                gita_verses_related=["2.47", "2.48", "3.19", "5.10", "18.49"],
                duration_minutes=0,  # Integrated into daily life
            ),
            GitaYogaPractice(
                id="yoga_jnana_001",
                yoga_path=GitaYogaPath.JNANA_YOGA,
                sanskrit_name="Atma Vichara",
                english_name="Self-Inquiry Practice",
                gita_reference="Chapter 2, 13, 15",
                description="""Jnana Yoga is the path of knowledge and discrimination taught in the Gita.
It involves distinguishing the eternal Self (Atman) from the temporary body-mind
complex. This practice develops the understanding that 'I am not this body,
not these thoughts, not these emotions - I am the witness of all these.'""",
                instructions=[
                    "Sit quietly in meditation",
                    "Observe thoughts, emotions, and sensations as they arise",
                    "Ask: 'Who is the one observing these?'",
                    "Recognize: 'I am not these thoughts - I am aware of them'",
                    "Rest in the awareness that remains when thoughts subside",
                    "Contemplate: 'The Self is never born, never dies' (2.20)",
                    "Return to this awareness throughout the day",
                ],
                mental_benefits=[
                    "Creates distance from distressing thoughts",
                    "Reduces identification with negative emotions",
                    "Develops witness consciousness",
                    "Promotes perspective on life challenges",
                    "Reduces fear of death and loss",
                ],
                gita_verses_related=["2.13", "2.19", "2.20", "2.23", "13.31", "15.7"],
                duration_minutes=20,
            ),
            GitaYogaPractice(
                id="yoga_bhakti_001",
                yoga_path=GitaYogaPath.BHAKTI_YOGA,
                sanskrit_name="Sharanagati",
                english_name="Devotional Surrender Practice",
                gita_reference="Chapter 9, 12, 18",
                description="""Bhakti Yoga is the path of devotion and surrender taught beautifully in
Chapter 12 of the Gita. It is the offering of all actions, thoughts, and
emotions to the divine, and accepting whatever comes as divine grace.
The Gita (18.66) promises: 'Surrender to Me alone; I will liberate you
from all sins. Do not grieve.'""",
                instructions=[
                    "Begin with grateful remembrance of blessings in your life",
                    "Offer your worries: 'I surrender these concerns to the divine'",
                    "Offer your actions: 'May all I do today be an offering'",
                    "Accept whatever comes: 'This too is divine grace'",
                    "When troubled, remember: 'I am held by something greater'",
                    "End with: 'Thy will be done, not mine'",
                ],
                mental_benefits=[
                    "Profound anxiety relief through surrender",
                    "Reduces the burden of control",
                    "Creates sense of being supported",
                    "Develops trust and faith",
                    "Promotes acceptance of life circumstances",
                ],
                gita_verses_related=["9.22", "12.6-7", "18.66", "7.14", "9.34"],
                duration_minutes=15,
            ),
            GitaYogaPractice(
                id="yoga_dhyana_001",
                yoga_path=GitaYogaPath.DHYANA_YOGA,
                sanskrit_name="Gita Dhyana",
                english_name="Gita Meditation Practice",
                gita_reference="Chapter 6",
                description="""Dhyana Yoga, the path of meditation, is taught in Chapter 6 of the Gita.
Krishna provides precise instructions for meditation: the posture, the
environment, the method of withdrawing the senses, and the state of
equipoise to be attained. The goal is to still the restless mind and
rest in the peace of the Self.""",
                instructions=[
                    "Find a clean, quiet place (6.11)",
                    "Sit with spine erect but comfortable (6.13)",
                    "Close eyes, withdraw senses from external objects (6.12)",
                    "Focus attention on the heart or between the eyebrows",
                    "When the mind wanders, gently bring it back (6.26)",
                    "Maintain this practice with patience and consistency",
                    "Do not be discouraged by wandering - this is natural (6.35)",
                    "With practice and dispassion, mastery comes (6.35)",
                ],
                mental_benefits=[
                    "Develops concentration and focus",
                    "Calms the restless mind",
                    "Reduces anxiety and mental agitation",
                    "Creates inner peace and stability",
                    "Develops self-awareness",
                ],
                gita_verses_related=["6.10-15", "6.19", "6.25-26", "6.35"],
                duration_minutes=20,
            ),
        ]

    # ==================== MEDITATION FROM CHAPTER 6 ====================

    def _load_gita_meditation(self) -> list[GitaMeditationTechnique]:
        """
        Load meditation techniques based on Bhagavad Gita Chapter 6 (Dhyana Yoga).
        """
        return [
            GitaMeditationTechnique(
                id="meditation_gita_001",
                sanskrit_name="Antaratma Dhyana",
                english_name="Inner Self Meditation",
                gita_reference="6.10-15",
                description="""This meditation follows Krishna's precise instructions in Chapter 6.
The yogi should constantly engage the mind in the Self, remaining in solitude,
with body and mind controlled, free from expectations and possessiveness.""",
                instructions=[
                    "Find a solitary, clean space",
                    "Sit on a firm seat, neither too high nor too low",
                    "Keep head, neck, and spine aligned and still",
                    "Fix the gaze gently, as if looking at the tip of the nose",
                    "Let the mind become peaceful and fearless",
                    "With mind controlled, think on the Self",
                    "Rest in the awareness that observes all",
                    "When mind wanders, gently return without judgment",
                ],
                mental_benefits=[
                    "Deep inner peace",
                    "Freedom from mental disturbances",
                    "Clarity of mind",
                    "Reduced anxiety and fear",
                    "Connection to deeper self",
                ],
                verse_guidance="समं कायशिरोग्रीवं धारयन्नचलं स्थिरः। सम्प्रेक्ष्य नासिकाग्रं स्वं दिशश्चानवलोकयन्॥ (6.13)",
                duration_minutes=20,
            ),
            GitaMeditationTechnique(
                id="meditation_gita_002",
                sanskrit_name="Prasadaja Dhyana",
                english_name="Serenity Meditation",
                gita_reference="6.27-28",
                description="""Based on verses 6.27-28, this meditation cultivates prasada (serenity)
and the supreme happiness that comes to the yogi whose mind is peaceful,
whose passions are quieted, and who is free from impurity.""",
                instructions=[
                    "Settle into a comfortable seated position",
                    "Take several deep breaths, releasing tension",
                    "Allow the mind to become quiet like a still lake",
                    "Release all agitation, let passions subside",
                    "Rest in the natural peace that remains",
                    "Feel the supreme bliss that arises from stillness",
                    "Recognize this peace as your natural state",
                    "Allow this serenity to permeate your being",
                ],
                mental_benefits=[
                    "Profound serenity and peace",
                    "Release of mental agitation",
                    "Experience of natural happiness",
                    "Freedom from turbulent emotions",
                    "Deep relaxation and rest",
                ],
                verse_guidance="प्रशान्तमनसं ह्येनं योगिनं सुखमुत्तमम्। उपैति शान्तरजसं ब्रह्मभूतमकल्मषम्॥ (6.27)",
                duration_minutes=25,
            ),
            GitaMeditationTechnique(
                id="meditation_gita_003",
                sanskrit_name="Sarva Bhuta Hite Dhyana",
                english_name="Universal Compassion Meditation",
                gita_reference="5.25, 6.29, 12.13",
                description="""This meditation develops the vision of unity taught in the Gita -
seeing the Self in all beings and all beings in the Self. It cultivates
compassion and freedom from hostility toward any creature.""",
                instructions=[
                    "Begin with awareness of your own inner peace",
                    "Extend this awareness to those close to you",
                    "Feel: 'The same Self dwells in them'",
                    "Extend to neutral people: 'The same Self'",
                    "Extend even to difficult people: 'The same Self'",
                    "Extend to all beings everywhere",
                    "Rest in the vision of unity",
                    "Recognize: 'There is no other'",
                ],
                mental_benefits=[
                    "Reduces feelings of isolation",
                    "Develops compassion and empathy",
                    "Releases hostility and resentment",
                    "Creates sense of connection",
                    "Promotes forgiveness",
                ],
                verse_guidance="सर्वभूतस्थमात्मानं सर्वभूतानि चात्मनि। ईक्षते योगयुक्तात्मा सर्वत्र समदर्शनः॥ (6.29)",
                duration_minutes=20,
            ),
        ]

    # ==================== STHITAPRAJNA QUALITIES (2.54-72) ====================

    def _load_sthitaprajna_qualities(self) -> list[SthitaprajnaQuality]:
        """
        Load the qualities of the Sthitaprajna (person of steady wisdom)
        from Bhagavad Gita 2.54-72 - the Gita's model of mental health.
        """
        return [
            SthitaprajnaQuality(
                id="sthita_001",
                quality="Self-Satisfaction",
                sanskrit_term="Atma Tushti",
                verse_reference="2.55",
                description="When one completely casts off all desires of the mind and is satisfied in the Self by the Self alone, then one is said to be of steady wisdom.",
                mental_health_application="The ability to find contentment from within, not depending on external circumstances for happiness. This is the foundation of lasting mental wellness.",
                practical_steps=[
                    "Notice moments of contentment that don't depend on external things",
                    "Cultivate gratitude for your own being, not just possessions",
                    "Spend time in quiet self-reflection daily",
                    "When craving arises, ask: 'Can I be content without this?'",
                ],
            ),
            SthitaprajnaQuality(
                id="sthita_002",
                quality="Unshaken by Sorrow",
                sanskrit_term="Dukheshu Anudvigna Manah",
                verse_reference="2.56",
                description="One whose mind is not shaken by adversity, who is free from craving for pleasures, and who is free from attachment, fear, and anger - such a person is called a sage of steady wisdom.",
                mental_health_application="Emotional resilience - the capacity to face difficulties without being overwhelmed. Not suppression of emotions, but stability that allows appropriate response.",
                practical_steps=[
                    "When facing difficulty, take three deep breaths before reacting",
                    "Remind yourself: 'This too shall pass'",
                    "Practice: 'I can observe this difficulty without being destroyed by it'",
                    "Build resilience through small challenges faced mindfully",
                ],
            ),
            SthitaprajnaQuality(
                id="sthita_003",
                quality="Freedom from Attachment",
                sanskrit_term="Vita Raga",
                verse_reference="2.56-57",
                description="One who is without attachment anywhere, who neither rejoices nor hates when obtaining good or evil - their wisdom is established.",
                mental_health_application="Healthy detachment - engaging fully with life while not clinging to outcomes. This prevents the suffering that comes from excessive attachment.",
                practical_steps=[
                    "Enjoy pleasures fully while knowing they are temporary",
                    "When something good happens, appreciate it without clinging",
                    "When something unwanted occurs, accept it without despair",
                    "Practice holding all experiences lightly",
                ],
            ),
            SthitaprajnaQuality(
                id="sthita_004",
                quality="Sense Control",
                sanskrit_term="Indriya Samyama",
                verse_reference="2.58",
                description="When one can withdraw the senses from sense objects, as a tortoise withdraws its limbs, their wisdom is firmly established.",
                mental_health_application="The ability to not be compulsively driven by sensory desires. This creates freedom from addiction, compulsion, and reactive behavior.",
                practical_steps=[
                    "Practice brief periods of sensory withdrawal (closing eyes, silence)",
                    "Notice impulses to check phone/seek stimulation - pause before acting",
                    "Create spaces of simplicity in your environment",
                    "Fast from stimulation periodically (media, social media, etc.)",
                ],
            ),
            SthitaprajnaQuality(
                id="sthita_005",
                quality="Freedom from Anger",
                sanskrit_term="Krodha Mukti",
                verse_reference="2.56, 2.62-63",
                description="Free from attachment, fear, and anger. The Gita explains how anger arises from frustrated desire and leads to delusion, memory loss, and destruction.",
                mental_health_application="Understanding and managing anger through addressing its root cause (attachment) rather than just suppressing the symptom.",
                practical_steps=[
                    "When angry, identify the underlying desire that was frustrated",
                    "Ask: 'What am I attached to that created this anger?'",
                    "Practice the pause between stimulus and response",
                    "Use anger as information, not as a guide for action",
                ],
            ),
            SthitaprajnaQuality(
                id="sthita_006",
                quality="Inner Peace",
                sanskrit_term="Shanti",
                verse_reference="2.64-66",
                description="Moving among sense objects with senses free from attraction and repulsion, the self-controlled person attains serenity. From serenity, all sorrows end.",
                mental_health_application="The cultivation of lasting peace that does not depend on controlling external circumstances but on one's own equanimity.",
                practical_steps=[
                    "Move through your day without strong likes and dislikes",
                    "Practice equanimity with small irritations",
                    "Let go of the need to control everything",
                    "Create a daily practice of intentional stillness",
                ],
            ),
        ]

    # ==================== KARMA YOGA PRINCIPLES ====================

    def _load_karma_yoga_principles(self) -> list[dict]:
        """
        Load practical Karma Yoga principles for daily life.
        """
        return [
            {
                "id": "karma_001",
                "principle": "Nishkama Karma",
                "meaning": "Action without attachment to fruits",
                "verse": "2.47",
                "application": "Focus entirely on the quality of your effort, releasing anxiety about outcomes",
                "mental_health_benefit": "Reduces performance anxiety and fear of failure",
            },
            {
                "id": "karma_002",
                "principle": "Samatva",
                "meaning": "Equanimity in success and failure",
                "verse": "2.48",
                "application": "Maintain inner balance regardless of results",
                "mental_health_benefit": "Emotional stability and resilience",
            },
            {
                "id": "karma_003",
                "principle": "Yoga Karmasu Kaushalam",
                "meaning": "Yoga is skill in action",
                "verse": "2.50",
                "application": "Act with full attention and excellence, not carelessly",
                "mental_health_benefit": "Promotes flow states and engagement",
            },
            {
                "id": "karma_004",
                "principle": "Svadharma",
                "meaning": "One's own duty/nature",
                "verse": "3.35, 18.47",
                "application": "Perform your own duty imperfectly rather than another's perfectly",
                "mental_health_benefit": "Reduces comparison and promotes authenticity",
            },
            {
                "id": "karma_005",
                "principle": "Ishvara Arpana",
                "meaning": "Offering actions to the divine",
                "verse": "9.27",
                "application": "Whatever you do, offer it as a sacred act",
                "mental_health_benefit": "Infuses daily life with meaning and purpose",
            },
        ]

    # ==================== SEARCH AND RETRIEVAL ====================

    async def search_teachings(
        self,
        query: str,
        theme: GitaMentalHealthTheme | None = None,
        yoga_path: GitaYogaPath | None = None,
        limit: int = 5,
    ) -> list[GitaTeaching]:
        """
        Search Gita teachings based on query and filters.

        Args:
            query: Search query text
            theme: Optional mental health theme filter
            yoga_path: Optional yoga path filter
            limit: Maximum results

        Returns:
            List of matching GitaTeaching objects
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())

        results = []
        for teaching in self._gita_teachings:
            # Apply filters
            if theme and teaching.theme != theme:
                continue
            if yoga_path and teaching.yoga_path != yoga_path:
                continue

            # Calculate relevance score
            score = 0.0

            # Title match
            if query_lower in teaching.title.lower():
                score += 0.5

            # Teaching content match
            if query_lower in teaching.teaching.lower():
                score += 0.3

            # Keyword match
            keyword_matches = sum(1 for kw in teaching.keywords if kw.lower() in query_lower)
            score += keyword_matches * 0.15

            # Mental health benefit match
            if teaching.mental_health_benefit and query_lower in teaching.mental_health_benefit.lower():
                score += 0.2

            if score > 0:
                results.append((teaching, score))

        # Sort by relevance
        results.sort(key=lambda x: x[1], reverse=True)
        return [t[0] for t in results[:limit]]

    async def get_practice_for_issue(
        self,
        issue: str,
    ) -> dict[str, Any]:
        """
        Get recommended Gita-based practice for a mental health issue.

        Args:
            issue: The mental health issue (anxiety, stress, depression, etc.)

        Returns:
            Recommended practices from Gita teachings
        """
        issue_lower = issue.lower()

        # Map issues to Gita-based recommendations
        if any(word in issue_lower for word in ["anxiety", "worried", "nervous", "fear"]):
            return {
                "primary_teaching": await self.search_teachings("karma yoga", limit=1),
                "meditation": self._meditation_techniques[0],  # Inner Self Meditation
                "yoga_path": self._yoga_practices[0],  # Karma Yoga - reduces anxiety about outcomes
                "sthitaprajna_quality": self._sthitaprajna_qualities[1],  # Unshaken by sorrow
                "key_verse": "2.47 - Focus on action, not results",
                "immediate_practice": "Take three deep breaths and release attachment to the outcome",
            }

        elif any(word in issue_lower for word in ["sad", "depressed", "hopeless", "low"]):
            return {
                "primary_teaching": await self.search_teachings("self friend enemy", limit=1),
                "meditation": self._meditation_techniques[2],  # Universal Compassion
                "yoga_path": self._yoga_practices[2],  # Bhakti Yoga - surrender and support
                "sthitaprajna_quality": self._sthitaprajna_qualities[0],  # Self-satisfaction
                "key_verse": "6.5 - Be your own friend, uplift yourself",
                "immediate_practice": "Place hand on heart, remember you have the power to be your own friend",
            }

        elif any(word in issue_lower for word in ["angry", "frustrated", "irritated", "rage"]):
            return {
                "primary_teaching": await self.search_teachings("anxiety chain anger", limit=1),
                "meditation": self._meditation_techniques[1],  # Serenity Meditation
                "yoga_path": self._yoga_practices[3],  # Dhyana Yoga - calming the mind
                "sthitaprajna_quality": self._sthitaprajna_qualities[4],  # Freedom from anger
                "key_verse": "2.62-63 - Understanding the chain from desire to anger",
                "immediate_practice": "Pause, breathe, identify the frustrated desire underneath the anger",
            }

        elif any(word in issue_lower for word in ["stress", "overwhelmed", "pressure", "burned"]):
            return {
                "primary_teaching": await self.search_teachings("equanimity samatva", limit=1),
                "meditation": self._meditation_techniques[1],  # Serenity Meditation
                "yoga_path": self._yoga_practices[0],  # Karma Yoga - balanced action
                "sthitaprajna_quality": self._sthitaprajna_qualities[5],  # Inner Peace
                "key_verse": "2.48 - Equanimity is yoga",
                "immediate_practice": "Release the weight of outcomes, focus only on this present moment",
            }

        elif any(word in issue_lower for word in ["restless", "distracted", "unfocused", "scattered"]):
            return {
                "primary_teaching": await self.search_teachings("mind control restless", limit=1),
                "meditation": self._meditation_techniques[0],  # Inner Self Meditation
                "yoga_path": self._yoga_practices[3],  # Dhyana Yoga
                "sthitaprajna_quality": self._sthitaprajna_qualities[3],  # Sense control
                "key_verse": "6.35 - Through practice and dispassion, the mind is controlled",
                "immediate_practice": "Gently return attention to breath, without judgment, again and again",
            }

        else:
            # Default: General peace and equanimity
            return {
                "primary_teaching": await self.search_teachings("peace", limit=1),
                "meditation": self._meditation_techniques[1],  # Serenity Meditation
                "yoga_path": self._yoga_practices[3],  # Dhyana Yoga
                "sthitaprajna_quality": self._sthitaprajna_qualities[5],  # Inner Peace
                "key_verse": "2.65 - From serenity comes the end of all sorrows",
                "immediate_practice": "Take a moment of stillness, breathing in peace, breathing out tension",
            }

    async def get_wisdom_for_kiaan(
        self,
        query: str,
        context: str = "general",
        limit: int = 3,
    ) -> dict[str, Any]:
        """
        Get Gita wisdom formatted for KIAAN integration.

        This method provides authentic Gita-based content to enhance
        KIAAN responses with deeper philosophical grounding.

        Args:
            query: User query or emotional context
            context: KIAAN context type
            limit: Maximum items per category

        Returns:
            Dict with teachings, practices, and recommendations
        """
        # Search relevant teachings
        teachings = await self.search_teachings(query, limit=limit)

        # Get practice recommendation based on query
        practice_recommendation = await self.get_practice_for_issue(query)

        # Find relevant Sthitaprajna quality
        relevant_quality = None
        query_lower = query.lower()
        for quality in self._sthitaprajna_qualities:
            if any(word in quality.mental_health_application.lower() for word in query_lower.split()):
                relevant_quality = quality
                break

        return {
            "teachings": [
                {
                    "title": t.title,
                    "teaching": t.teaching[:500] + "..." if len(t.teaching) > 500 else t.teaching,
                    "verse_reference": t.verse_reference,
                    "practical_application": t.practical_application,
                    "mental_health_benefit": t.mental_health_benefit,
                }
                for t in teachings
            ],
            "recommended_practice": {
                "name": practice_recommendation.get("yoga_path", {}).sanskrit_name if practice_recommendation.get("yoga_path") else None,
                "key_verse": practice_recommendation.get("key_verse"),
                "immediate_practice": practice_recommendation.get("immediate_practice"),
            },
            "sthitaprajna_quality": {
                "quality": relevant_quality.quality if relevant_quality else None,
                "sanskrit": relevant_quality.sanskrit_term if relevant_quality else None,
                "application": relevant_quality.mental_health_application if relevant_quality else None,
            } if relevant_quality else None,
            "karma_yoga_principle": self._karma_yoga_principles[0],  # Core principle
            "context": context,
        }

    def get_quick_gita_wisdom(self, mood: str) -> dict[str, Any]:
        """
        Get quick Gita wisdom based on current mood/emotion.

        Args:
            mood: User's current mood/emotion

        Returns:
            Quick Gita-based wisdom and practice
        """
        mood_lower = mood.lower()

        if any(word in mood_lower for word in ["anxious", "worried", "nervous"]):
            return {
                "verse": "2.47",
                "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
                "meaning": "You have the right to work only, never to its fruits",
                "practice": "Release the weight of outcomes. Focus only on this present action.",
                "affirmation": "I do my best and release the rest.",
            }

        elif any(word in mood_lower for word in ["sad", "hopeless", "down"]):
            return {
                "verse": "6.5",
                "sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्",
                "meaning": "Lift yourself by your Self; do not let yourself sink",
                "practice": "Be your own friend. Speak to yourself with compassion.",
                "affirmation": "I have the power to uplift myself.",
            }

        elif any(word in mood_lower for word in ["angry", "frustrated"]):
            return {
                "verse": "2.56",
                "sanskrit": "वीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते",
                "meaning": "Free from attachment, fear, and anger - this is steady wisdom",
                "practice": "Pause. Identify the frustrated desire beneath the anger.",
                "affirmation": "I choose peace over reaction.",
            }

        elif any(word in mood_lower for word in ["stressed", "overwhelmed"]):
            return {
                "verse": "2.48",
                "sanskrit": "समत्वं योग उच्यते",
                "meaning": "Equanimity is yoga",
                "practice": "Whatever comes, meet it with balance. This too shall pass.",
                "affirmation": "I remain centered in the midst of change.",
            }

        elif any(word in mood_lower for word in ["peaceful", "content", "grateful"]):
            return {
                "verse": "2.65",
                "sanskrit": "प्रसादे सर्वदुःखानां हानिरस्योपजायते",
                "meaning": "In serenity, all sorrows end",
                "practice": "Rest in this peace. It is your natural state.",
                "affirmation": "Peace is my true nature.",
            }

        else:
            return {
                "verse": "2.71",
                "sanskrit": "विहाय कामान्यः सर्वान्पुमांश्चरति निःस्पृहः",
                "meaning": "One who moves without craving attains peace",
                "practice": "Let go of excessive wanting. Find contentment in this moment.",
                "affirmation": "I am complete as I am.",
            }


# Global instance
indian_gita_sources = IndianGitaSourcesService()

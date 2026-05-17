"""ARDHA Knowledge Base — Atma-Reframing through Dharma and Higher Awareness.

This module provides the complete ARDHA reframing framework, mapping each of the
5 ARDHA pillars to specific Bhagavad Gita verses from the 701-verse repository.

ARDHA Pillars:
  A - Atma Distinction (Right Identity) — BG 2.16, 2.20, 2.13, 13.33, etc.
  R - Raga-Dvesha Diagnosis (Attachment Scan) — BG 2.62-63, 3.37, 5.3, etc.
  D - Dharma Alignment (Right Action) — BG 2.47, 3.35, 18.47, etc.
  H - Hrdaya Samatvam (Equanimity of Heart) — BG 2.38, 2.48, 6.7, etc.
  A - Arpana (Offering & Surrender) — BG 18.66, 9.27, 12.6-7, etc.

Strict Gita Compliance:
  - All verse references are from the authenticated 701-verse corpus
  - No invented or paraphrased verses
  - Every pillar is grounded in specific chapter:verse citations
  - Both static (fixed verse mappings) and dynamic (search-based) wisdom supported
"""

from __future__ import annotations

from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class ArdhaVerse:
    """A Gita verse mapped to an ARDHA pillar."""
    chapter: int
    verse: int
    sanskrit_key: str
    english: str
    principle: str
    pillar: str
    reframe_guidance: str
    mental_health_tags: list[str] = field(default_factory=list)

    @property
    def reference(self) -> str:
        return f"BG {self.chapter}.{self.verse}"


@dataclass
class ArdhaPillar:
    """One of the 5 ARDHA pillars with its core teaching and verses."""
    code: str
    name: str
    sanskrit_name: str
    core_teaching: str
    description: str
    diagnostic_questions: list[str]
    reframe_template: str
    key_verses: list[ArdhaVerse]
    compliance_test: str


# ---------------------------------------------------------------------------
# PILLAR A1: Atma Distinction — Right Identity
# ---------------------------------------------------------------------------

ATMA_DISTINCTION = ArdhaPillar(
    code="A",
    name="Atma Distinction",
    sanskrit_name="Atma Viveka",
    core_teaching=(
        "Before correcting thoughts, correct identity. You are the witnessing "
        "consciousness, not the mind, intellect, or ego. The Self remains "
        "untouched by the fluctuations of the instrument (mind-body)."
    ),
    description=(
        "Separate the witnessing Self (Atma) from the experiencing instrument "
        "(mind-body-ego). The mind experiences frustration, the intellect evaluates "
        "skill, the ego claims ownership — but the Self remains untouched."
    ),
    diagnostic_questions=[
        "Am I identifying with the role rather than the Self?",
        "Is the ego claiming ownership of this experience?",
        "Can I observe this thought without becoming it?",
        "Am I confusing a temporary state with my permanent nature?",
    ],
    reframe_template=(
        'Not — "I am failing." '
        'But — "A limitation is appearing in this instrument." '
        "This dissolves ego-identification and restores witness awareness."
    ),
    key_verses=[
        ArdhaVerse(
            chapter=2, verse=16,
            sanskrit_key="nasato vidyate bhavo",
            english=(
                "The unreal has no existence, and the real never ceases to be. "
                "The truth about both has been realized by the seers of Truth."
            ),
            principle="The Self (sat) is permanent; mental states (asat) are impermanent.",
            pillar="atma_distinction",
            reframe_guidance=(
                "This thought/feeling is asat (impermanent). Your true nature "
                "(sat) is untouched. Separate what is real from what is temporary."
            ),
            mental_health_tags=["identity_clarity", "self_knowledge", "impermanence"],
        ),
        ArdhaVerse(
            chapter=2, verse=20,
            sanskrit_key="na jayate mriyate va kadacin",
            english=(
                "The soul is never born, nor does it ever die. It is unborn, "
                "eternal, ever-existing, and primeval. It is not slain when the "
                "body is slain."
            ),
            principle="Your essential nature is beyond birth, death, and change.",
            pillar="atma_distinction",
            reframe_guidance=(
                "Your core Self is not defined by this experience. Roles change, "
                "situations change, but YOU (the witness) remain constant."
            ),
            mental_health_tags=["resilience", "self_knowledge", "identity_clarity"],
        ),
        ArdhaVerse(
            chapter=2, verse=13,
            sanskrit_key="dehino smin yatha dehe",
            english=(
                "Just as the soul passes through childhood, youth, and old age "
                "in this body, so too does it pass into another body. The wise "
                "are not deluded by this."
            ),
            principle="Phases and states change; the Self witnessing them does not.",
            pillar="atma_distinction",
            reframe_guidance=(
                "This phase of struggle is like childhood passing to youth — "
                "a transition, not a definition. The witness remains steady."
            ),
            mental_health_tags=["impermanence", "acceptance", "self_awareness"],
        ),
        ArdhaVerse(
            chapter=13, verse=33,
            sanskrit_key="yatha sarva-gatam sauksmyad",
            english=(
                "As the all-pervading ether is not tainted because of its "
                "subtlety, similarly the Self seated everywhere in the body "
                "does not mix with it."
            ),
            principle="The Self is untainted by bodily/mental experiences.",
            pillar="atma_distinction",
            reframe_guidance=(
                "Like space is unaffected by what moves through it, your Self "
                "is unaffected by this mental turbulence. Observe without merging."
            ),
            mental_health_tags=["detachment", "witness_consciousness", "inner_peace"],
        ),
        ArdhaVerse(
            chapter=5, verse=8,
            sanskrit_key="naiva kincit karomiti",
            english=(
                "A person in the divine consciousness, although engaged in "
                "seeing, hearing, touching, smelling, eating, moving, sleeping, "
                "and breathing, always knows within that he actually does nothing."
            ),
            principle="The Self is the witness, not the doer.",
            pillar="atma_distinction",
            reframe_guidance=(
                "Recognize: actions happen through the instrument. "
                "The Self witnesses. This removes ego-burden from performance."
            ),
            mental_health_tags=["stress_reduction", "letting_go", "self_awareness"],
        ),
    ],
    compliance_test="Is identity detached from role?",
)


# ---------------------------------------------------------------------------
# PILLAR R: Raga-Dvesha Diagnosis — Attachment Scan
# ---------------------------------------------------------------------------

RAGA_DVESHA_DIAGNOSIS = ArdhaPillar(
    code="R",
    name="Raga-Dvesha Diagnosis",
    sanskrit_name="Raga-Dvesha Pariksha",
    core_teaching=(
        "Disturbance arises from attachment (raga) and aversion (dvesha). "
        "From attachment springs desire; from desire, frustration. "
        "The issue is not skill deficiency — it is fruit-attachment. "
        "Detach first. Improve second."
    ),
    description=(
        "Scan for the hidden attachment or aversion driving the disturbance. "
        "Ask: What result am I attached to? What recognition am I craving? "
        "What fear of loss is driving this agitation?"
    ),
    diagnostic_questions=[
        "What result am I attached to?",
        "What recognition am I craving?",
        "What fear of loss is driving this agitation?",
        "Is this disturbance arising from raga (desire) or dvesha (aversion)?",
    ],
    reframe_template=(
        "The issue is not the external situation. The issue is the "
        "attachment/aversion operating underneath. Identify the raga or dvesha, "
        "then release the grip it has on your equanimity."
    ),
    key_verses=[
        ArdhaVerse(
            chapter=2, verse=62,
            sanskrit_key="dhyayato visayan pumsah",
            english=(
                "While contemplating the objects of the senses, a person "
                "develops attachment for them. From attachment, desire is born. "
                "From desire, anger arises."
            ),
            principle="The chain: contemplation -> attachment -> desire -> anger.",
            pillar="raga_dvesha",
            reframe_guidance=(
                "Trace your disturbance backwards: anger comes from frustrated "
                "desire, desire from attachment, attachment from repeated "
                "contemplation. Break the chain at contemplation."
            ),
            mental_health_tags=["anger_management", "attachment_release", "self_awareness"],
        ),
        ArdhaVerse(
            chapter=2, verse=63,
            sanskrit_key="krodhad bhavati sammohah",
            english=(
                "From anger arises delusion; from delusion, bewilderment of "
                "memory; from loss of memory, the destruction of intelligence; "
                "and from loss of intelligence, one perishes."
            ),
            principle="The cascade: anger -> delusion -> memory loss -> destruction.",
            pillar="raga_dvesha",
            reframe_guidance=(
                "This verse maps the exact cascade of suffering. "
                "If you are angry or confused, trace it back to the original "
                "attachment. Awareness of this chain breaks it."
            ),
            mental_health_tags=["impulse_control", "cognitive_clarity", "emotional_regulation"],
        ),
        ArdhaVerse(
            chapter=3, verse=37,
            sanskrit_key="kama esha krodha esha",
            english=(
                "The Supreme Lord said: It is desire alone, which is born of "
                "contact with the mode of passion, and later transforms into "
                "anger. Know this as the sinful, all-devouring enemy."
            ),
            principle="Desire (kama) is the root enemy that transforms into anger (krodha).",
            pillar="raga_dvesha",
            reframe_guidance=(
                "The real enemy is not the person or situation — it is the "
                "desire underneath. Name the desire. By naming it, you begin "
                "to loosen its grip."
            ),
            mental_health_tags=["anger_management", "self_discipline", "discernment"],
        ),
        ArdhaVerse(
            chapter=5, verse=3,
            sanskrit_key="jneya sa nitya-sannyasi",
            english=(
                "One who neither hates nor desires the fruits of activities "
                "is always renounced. Free from all dualities, such a person "
                "is easily liberated from bondage."
            ),
            principle="Freedom from raga-dvesha (desire-aversion) is true renunciation.",
            pillar="raga_dvesha",
            reframe_guidance=(
                "Check: are you pulled by desire for a specific outcome, "
                "or pushed by aversion to a feared one? Neither pull nor push "
                "— stand steady in the middle."
            ),
            mental_health_tags=["equanimity", "letting_go", "inner_freedom"],
        ),
        ArdhaVerse(
            chapter=3, verse=34,
            sanskrit_key="indriyasyendriyasyarthe",
            english=(
                "Attachment and aversion for the objects of the senses are "
                "seated in the senses. One should not come under the control "
                "of these two, for they are obstacles on the path."
            ),
            principle="Raga and dvesha are natural but must not control you.",
            pillar="raga_dvesha",
            reframe_guidance=(
                "Attachment and aversion are natural tendencies of the senses. "
                "Acknowledge them without being controlled by them. "
                "They are obstacles, not truths."
            ),
            mental_health_tags=["emotional_regulation", "self_discipline", "mindfulness"],
        ),
    ],
    compliance_test="Is action performed without craving?",
)


# ---------------------------------------------------------------------------
# PILLAR D: Dharma Alignment — Right Action
# ---------------------------------------------------------------------------

DHARMA_ALIGNMENT = ArdhaPillar(
    code="D",
    name="Dharma Alignment",
    sanskrit_name="Dharma Nishtha",
    core_teaching=(
        "Your duty is not to guarantee success, secure praise, or outperform "
        "everyone. Your duty is to act sincerely, refine skill diligently, "
        "and perform your role without negligence. You have control over "
        "action alone, never its fruits (BG 2.47)."
    ),
    description=(
        "Align your action with dharma (right duty in this context). "
        "Stop trying to control outcomes. Focus entirely on the quality "
        "of your effort. Action purified of attachment becomes Yoga."
    ),
    diagnostic_questions=[
        "What is my actual duty in this situation?",
        "Am I trying to control the outcome instead of the effort?",
        "Am I performing my dharma or someone else's?",
        "Is my action driven by duty or by anxiety about results?",
    ],
    reframe_template=(
        "Your dharma is sincere effort, not guaranteed results. "
        "Perform your role with full attention and skill. "
        "Release the outcome. Action purified of attachment becomes Yoga."
    ),
    key_verses=[
        ArdhaVerse(
            chapter=2, verse=47,
            sanskrit_key="karmany evadhikaras te",
            english=(
                "You have a right to perform your prescribed duty, but you "
                "are not entitled to the fruits of action. Never consider "
                "yourself the cause of the results, and never be attached "
                "to not doing your duty."
            ),
            principle=(
                "You control action alone, never its fruits. "
                "This is the foundational teaching of Karma Yoga."
            ),
            pillar="dharma_alignment",
            reframe_guidance=(
                "Focus on what you can control: the quality of your effort. "
                "Release what you cannot control: the specific outcome. "
                "This is not passivity — it is disciplined action."
            ),
            mental_health_tags=["stress_reduction", "letting_go", "action", "duty"],
        ),
        ArdhaVerse(
            chapter=3, verse=35,
            sanskrit_key="sreyan sva-dharmo vigunah",
            english=(
                "It is far better to discharge one's prescribed duty, even "
                "though faultily, than another's duty perfectly. Destruction "
                "in the course of performing one's own duty is better than "
                "engaging in another's duty."
            ),
            principle="Honor your unique path. Comparison breeds suffering.",
            pillar="dharma_alignment",
            reframe_guidance=(
                "Stop comparing your path to others. Your dharma is uniquely "
                "yours. Imperfect performance of YOUR duty is superior to "
                "perfect imitation of someone else's."
            ),
            mental_health_tags=["self_acceptance", "identity_clarity", "purpose_and_meaning"],
        ),
        ArdhaVerse(
            chapter=18, verse=47,
            sanskrit_key="sreyan sva-dharmo vigunah para",
            english=(
                "It is better to engage in one's own occupation, even though "
                "one may perform it imperfectly, than to accept another's "
                "occupation and perform it perfectly."
            ),
            principle="Chapter 18 reaffirms: svadharma over para-dharma.",
            pillar="dharma_alignment",
            reframe_guidance=(
                "The Gita emphasizes this twice (3.35 and 18.47). "
                "Your unique contribution matters more than perfect conformity. "
                "Do YOUR work with full sincerity."
            ),
            mental_health_tags=["purpose_and_meaning", "self_acceptance", "action"],
        ),
        ArdhaVerse(
            chapter=3, verse=8,
            sanskrit_key="niyatam kuru karma tvam",
            english=(
                "Perform your prescribed duty, for action is better than "
                "inaction. Even the maintenance of your body would not be "
                "possible by inaction."
            ),
            principle="Action is always superior to inaction.",
            pillar="dharma_alignment",
            reframe_guidance=(
                "Even imperfect action is better than paralysis. "
                "Do not let fear of failure freeze you. Move forward "
                "with whatever capacity you have right now."
            ),
            mental_health_tags=["motivation", "action", "resilience"],
        ),
        ArdhaVerse(
            chapter=3, verse=19,
            sanskrit_key="tasmad asaktah satatam",
            english=(
                "Therefore, without being attached to the fruits of "
                "activities, one should act as a matter of duty. By working "
                "without attachment, one attains the Supreme."
            ),
            principle="Detached duty-performance leads to highest realization.",
            pillar="dharma_alignment",
            reframe_guidance=(
                "Perform your duty as an offering, not as a transaction. "
                "When you stop bargaining with outcomes, anxiety drops "
                "and performance improves naturally."
            ),
            mental_health_tags=["letting_go", "duty", "detachment", "inner_peace"],
        ),
    ],
    compliance_test="Is outcome mentally released?",
)


# ---------------------------------------------------------------------------
# PILLAR H: Hrdaya Samatvam — Equanimity of Heart
# ---------------------------------------------------------------------------

HRDAYA_SAMATVAM = ArdhaPillar(
    code="H",
    name="Hrdaya Samatvam",
    sanskrit_name="Hrdaya Samatvam",
    core_teaching=(
        "Equal vision in gain and loss, success and failure, praise and "
        "criticism (BG 2.38, 2.48). Equanimity is higher than achievement. "
        "Without samatvam, action binds. With samatvam, action liberates."
    ),
    description=(
        "Before acting, affirm: 'If improvement comes, I remain steady. "
        "If delay comes, I remain steady. If criticism comes, I remain steady.' "
        "Equanimity does not mean indifference — it means stability of heart "
        "regardless of external fluctuations."
    ),
    diagnostic_questions=[
        "Am I disturbed because the outcome didn't match my expectation?",
        "Can I remain equally steady in praise and criticism?",
        "Is my inner stability dependent on external validation?",
        "Am I swinging between elation and despair based on results?",
    ],
    reframe_template=(
        "If improvement comes, I remain steady. "
        "If delay comes, I remain steady. "
        "If criticism comes, I remain steady. "
        "Equanimity is the foundation of lasting peace."
    ),
    key_verses=[
        ArdhaVerse(
            chapter=2, verse=38,
            sanskrit_key="sukha-duhkhe same krtva",
            english=(
                "Treating alike pleasure and pain, gain and loss, victory "
                "and defeat, engage in battle. You will not incur sin."
            ),
            principle="Equal vision in all dualities is the prerequisite for right action.",
            pillar="hrdaya_samatvam",
            reframe_guidance=(
                "Before you act, establish inner balance. Treat success "
                "and failure as equally informative, not as judgments "
                "of your worth."
            ),
            mental_health_tags=["equanimity", "emotional_regulation", "resilience"],
        ),
        ArdhaVerse(
            chapter=2, verse=48,
            sanskrit_key="yoga-sthah kuru karmani",
            english=(
                "Perform action, O Arjuna, being steadfast in Yoga, "
                "abandoning attachment and balanced in success and failure. "
                "Equanimity is called Yoga."
            ),
            principle="Samatvam (equanimity) IS Yoga. This is the definition.",
            pillar="hrdaya_samatvam",
            reframe_guidance=(
                "Yoga is not a posture — it is equanimity in action. "
                "When you maintain balance regardless of outcome, "
                "you are practicing the highest yoga."
            ),
            mental_health_tags=["equanimity", "balance", "inner_peace", "action"],
        ),
        ArdhaVerse(
            chapter=6, verse=7,
            sanskrit_key="jitatmanah prasantasya",
            english=(
                "For one who has conquered the mind, the Supreme Self is "
                "already reached. Such a person is equipoised in cold and "
                "heat, happiness and distress, honor and dishonor."
            ),
            principle="The conquered mind achieves natural equanimity.",
            pillar="hrdaya_samatvam",
            reframe_guidance=(
                "Mastery is not about controlling circumstances — "
                "it is about steadying your response. When the mind "
                "is conquered, external turbulence cannot disturb you."
            ),
            mental_health_tags=["self_discipline", "inner_peace", "resilience"],
        ),
        ArdhaVerse(
            chapter=2, verse=56,
            sanskrit_key="duhkhesv anudvigna-manah",
            english=(
                "One whose mind is not disturbed by misery, who does not "
                "crave pleasure, who is free from attachment, fear, and anger "
                "— such a person is called a sage of steady wisdom."
            ),
            principle="Sthitaprajna: the person of steady wisdom is undisturbed.",
            pillar="hrdaya_samatvam",
            reframe_guidance=(
                "The ideal is not to never feel pain, but to not be "
                "disturbed by it. Pain is information. Disturbance is "
                "optional. Cultivate steady wisdom (sthitaprajna)."
            ),
            mental_health_tags=["emotional_regulation", "equanimity", "wisdom"],
        ),
        ArdhaVerse(
            chapter=12, verse=18,
            sanskrit_key="samah shatrau cha mitre cha",
            english=(
                "One who is equal to friend and foe, equipoised in honor and "
                "dishonor, cold and heat, joy and sorrow, free from attachment "
                "— such a person is very dear to Me."
            ),
            principle="Equal vision in all opposites is the mark of the devotee.",
            pillar="hrdaya_samatvam",
            reframe_guidance=(
                "Practice equal response to praise and criticism, "
                "success and failure, comfort and discomfort. This "
                "does not mean apathy — it means unshakeable stability."
            ),
            mental_health_tags=["equanimity", "emotional_balance", "inner_peace"],
        ),
    ],
    compliance_test="Is equanimity maintained?",
)


# ---------------------------------------------------------------------------
# PILLAR A2: Arpana — Offering & Surrender
# ---------------------------------------------------------------------------

ARPANA_SURRENDER = ArdhaPillar(
    code="A2",
    name="Arpana",
    sanskrit_name="Ishvara Arpana",
    core_teaching=(
        "Offer the action. Mentally dedicate: 'This effort is not for ego. "
        "It is an offering.' Release the result to the larger order (Ishvara). "
        "When action is offered, anxiety decreases, ego softens, fear loses force. "
        "Surrender completes Karma Yoga (BG 18.66)."
    ),
    description=(
        "The final step: offer your action and its results to the larger order. "
        "This is not passive resignation — it is active surrender. You do your "
        "best, then release the outcome to Ishvara (the cosmic order). "
        "This completes the cycle of Karma Yoga."
    ),
    diagnostic_questions=[
        "Am I holding onto the result with a clenched fist?",
        "Can I offer this action as a dedication rather than a demand?",
        "Is my ego the primary beneficiary of this action?",
        "Can I trust the larger order with what I cannot control?",
    ],
    reframe_template=(
        "This effort is not for ego. It is an offering. "
        "I have done my part with sincerity. "
        "The result belongs to the larger order. "
        "I release it now."
    ),
    key_verses=[
        ArdhaVerse(
            chapter=18, verse=66,
            sanskrit_key="sarva-dharman parityajya",
            english=(
                "Abandon all varieties of dharma and just surrender unto Me. "
                "I shall deliver you from all sinful reactions. Do not fear."
            ),
            principle=(
                "Ultimate surrender: let go of all anxiety. "
                "Trust in the larger order of existence."
            ),
            pillar="arpana",
            reframe_guidance=(
                "This is the Gita's final teaching: complete surrender. "
                "You have done everything you can. Now release. "
                "Trust that the larger order holds what you cannot."
            ),
            mental_health_tags=["surrender", "letting_go", "faith", "anxiety_management"],
        ),
        ArdhaVerse(
            chapter=9, verse=27,
            sanskrit_key="yat karosi yad asnasi",
            english=(
                "Whatever you do, whatever you eat, whatever you offer in "
                "sacrifice, whatever you give away, whatever austerity you "
                "practice — do it as an offering to Me."
            ),
            principle="Every action becomes sacred when offered.",
            pillar="arpana",
            reframe_guidance=(
                "Transform ordinary action into sacred offering. "
                "Your work, your effort, your struggle — offer it all. "
                "This removes the burden of personal ownership."
            ),
            mental_health_tags=["purpose_and_meaning", "devotion", "letting_go"],
        ),
        ArdhaVerse(
            chapter=12, verse=6,
            sanskrit_key="ye tu sarvani karmani",
            english=(
                "But those who worship Me, dedicating all their actions to "
                "Me, regarding Me as the supreme goal, meditating on Me with "
                "undivided devotion..."
            ),
            principle="Dedicated action with devotion is the path of offering.",
            pillar="arpana",
            reframe_guidance=(
                "Dedicate your action to something larger than yourself. "
                "This shifts the center of gravity from ego to offering, "
                "from demand to devotion."
            ),
            mental_health_tags=["devotion", "purpose_and_meaning", "surrender"],
        ),
        ArdhaVerse(
            chapter=12, verse=7,
            sanskrit_key="tesam aham samuddharta",
            english=(
                "For those whose minds are fixed on Me, I swiftly become "
                "the deliverer from the ocean of birth and death."
            ),
            principle="Surrender is met with deliverance.",
            pillar="arpana",
            reframe_guidance=(
                "When you truly let go, support arrives. "
                "This is not magical thinking — it is the natural consequence "
                "of releasing the ego's stranglehold on outcomes."
            ),
            mental_health_tags=["faith", "trust", "surrender", "inner_peace"],
        ),
        ArdhaVerse(
            chapter=18, verse=57,
            sanskrit_key="cetasa sarva-karmani",
            english=(
                "Mentally renouncing all actions in Me, having Me as the "
                "highest goal, resorting to the yoga of discrimination, "
                "fix your mind on Me always."
            ),
            principle="Mental renunciation of results while maintaining focus.",
            pillar="arpana",
            reframe_guidance=(
                "You can be fully engaged in action while mentally "
                "renouncing the results. This is the art of Arpana: "
                "full effort, zero ownership of outcome."
            ),
            mental_health_tags=["letting_go", "focus", "detachment", "mindfulness"],
        ),
    ],
    compliance_test="Is action offered beyond ego?",
)


# ---------------------------------------------------------------------------
# Complete ARDHA Framework
# ---------------------------------------------------------------------------

ARDHA_PILLARS: list[ArdhaPillar] = [
    ATMA_DISTINCTION,
    RAGA_DVESHA_DIAGNOSIS,
    DHARMA_ALIGNMENT,
    HRDAYA_SAMATVAM,
    ARPANA_SURRENDER,
]

ARDHA_PILLAR_MAP: dict[str, ArdhaPillar] = {
    "A": ATMA_DISTINCTION,
    "R": RAGA_DVESHA_DIAGNOSIS,
    "D": DHARMA_ALIGNMENT,
    "H": HRDAYA_SAMATVAM,
    "A2": ARPANA_SURRENDER,
}


# ---------------------------------------------------------------------------
# Additional verse mappings: emotional states -> ARDHA pillars
# ---------------------------------------------------------------------------

EMOTION_TO_PILLAR_MAP: dict[str, list[str]] = {
    # Identity confusion -> Atma Distinction
    "identity_crisis": ["A"],
    "self_doubt": ["A", "D"],
    "imposter_syndrome": ["A", "D"],
    "worthlessness": ["A", "H"],
    "shame": ["A", "R"],

    # Attachment-driven disturbance -> Raga-Dvesha
    "anxiety": ["R", "D"],
    "anger": ["R", "H"],
    "jealousy": ["R", "A2"],
    "craving": ["R", "D"],
    "resentment": ["R", "H"],
    "possessiveness": ["R", "A2"],

    # Action paralysis -> Dharma Alignment
    "procrastination": ["D", "R"],
    "overwhelm": ["D", "H"],
    "perfectionism": ["D", "R"],
    "comparison": ["D", "A"],
    "career_confusion": ["D", "A"],

    # Emotional turbulence -> Hrdaya Samatvam
    "mood_swings": ["H", "R"],
    "frustration": ["H", "D"],
    "disappointment": ["H", "A2"],
    "rejection": ["H", "A"],
    "criticism_sensitivity": ["H", "A"],

    # Control anxiety -> Arpana
    "fear_of_failure": ["A2", "D"],
    "need_for_control": ["A2", "R"],
    "grief": ["A2", "A"],
    "hopelessness": ["A2", "H"],
    "burnout": ["A2", "D"],
    "existential_dread": ["A2", "A"],
}


# ---------------------------------------------------------------------------
# ARDHA Compliance Tests (The 5 Tests of True Gita Compliance)
# ---------------------------------------------------------------------------

ARDHA_COMPLIANCE_TESTS: list[dict[str, str]] = [
    {
        "test": "Is identity detached from role?",
        "pillar": "A",
        "fail_indicator": "User still identifies self with the problem/role.",
        "correction": "Apply Atma Distinction: separate Self from instrument.",
    },
    {
        "test": "Is action performed without craving?",
        "pillar": "R",
        "fail_indicator": "User is still driven by raga (desire) or dvesha (aversion).",
        "correction": "Apply Raga-Dvesha Diagnosis: name the attachment.",
    },
    {
        "test": "Is outcome mentally released?",
        "pillar": "D",
        "fail_indicator": "User is still fixated on a specific outcome.",
        "correction": "Apply Dharma Alignment: focus on effort, release outcome.",
    },
    {
        "test": "Is equanimity maintained?",
        "pillar": "H",
        "fail_indicator": "User's emotional state depends on external results.",
        "correction": "Apply Hrdaya Samatvam: affirm steadiness in all outcomes.",
    },
    {
        "test": "Is action offered beyond ego?",
        "pillar": "A2",
        "fail_indicator": "User's action is ego-driven, not offered.",
        "correction": "Apply Arpana: dedicate action as offering, release to Ishvara.",
    },
]


# ---------------------------------------------------------------------------
# Dynamic verse retrieval helpers
# ---------------------------------------------------------------------------

# Key verse references for quick lookup against the 701-verse corpus
ARDHA_KEY_VERSE_REFS: list[tuple[int, int]] = [
    # Atma Distinction
    (2, 16), (2, 20), (2, 13), (13, 33), (5, 8),
    # Raga-Dvesha Diagnosis
    (2, 62), (2, 63), (3, 37), (5, 3), (3, 34),
    # Dharma Alignment
    (2, 47), (3, 35), (18, 47), (3, 8), (3, 19),
    # Hrdaya Samatvam
    (2, 38), (2, 48), (6, 7), (2, 56), (12, 18),
    # Arpana
    (18, 66), (9, 27), (12, 6), (12, 7), (18, 57),
]

# Extended verse references for deeper analysis
ARDHA_EXTENDED_VERSE_REFS: list[tuple[int, int]] = [
    # Additional Atma Distinction verses
    (2, 11), (2, 12), (2, 17), (2, 18), (2, 19), (2, 22), (2, 25),
    (13, 1), (13, 2), (13, 31), (13, 32),
    # Additional Raga-Dvesha verses
    (2, 64), (2, 67), (2, 68), (3, 36), (3, 39), (3, 40), (3, 41), (3, 43),
    (5, 22), (14, 7), (14, 12),
    # Additional Dharma verses
    (2, 31), (2, 33), (3, 4), (3, 5), (3, 7), (3, 9), (4, 18),
    (18, 45), (18, 46), (18, 48),
    # Additional Samatvam verses
    (2, 14), (2, 15), (2, 55), (2, 57), (2, 58), (2, 70), (2, 71),
    (6, 8), (6, 9), (6, 29), (6, 32), (12, 13), (12, 15), (12, 17),
    # Additional Arpana verses
    (4, 24), (9, 26), (9, 28), (11, 55), (18, 55), (18, 56), (18, 58),
    (18, 62), (18, 65), (18, 78),
]


def get_all_ardha_verses() -> list[ArdhaVerse]:
    """Return all key verses across all ARDHA pillars."""
    all_verses: list[ArdhaVerse] = []
    for pillar in ARDHA_PILLARS:
        all_verses.extend(pillar.key_verses)
    return all_verses


def get_pillar_for_emotion(emotion: str) -> list[ArdhaPillar]:
    """Get recommended ARDHA pillars for a given emotional state.

    Args:
        emotion: Detected emotional state (e.g., 'anxiety', 'anger')

    Returns:
        List of ArdhaPillar objects in order of relevance
    """
    emotion_lower = emotion.lower().replace(" ", "_").replace("-", "_")
    pillar_codes = EMOTION_TO_PILLAR_MAP.get(emotion_lower, ["A", "R", "D", "H", "A2"])
    return [ARDHA_PILLAR_MAP[code] for code in pillar_codes if code in ARDHA_PILLAR_MAP]


def build_ardha_context_for_prompt(
    pillars: list[ArdhaPillar] | None = None,
) -> str:
    """Build a formatted ARDHA context string for the AI system prompt.

    Args:
        pillars: Specific pillars to include (all if None)

    Returns:
        Formatted context string with pillar teachings and verse references
    """
    target_pillars = pillars or ARDHA_PILLARS
    lines = ["[ARDHA_FRAMEWORK_CONTEXT]"]
    lines.append("ARDHA: Atma-Reframing through Dharma and Higher Awareness\n")

    for pillar in target_pillars:
        lines.append(f"--- {pillar.code}: {pillar.name} ({pillar.sanskrit_name}) ---")
        lines.append(f"Core Teaching: {pillar.core_teaching}")
        lines.append(f"Reframe Template: {pillar.reframe_template}")
        lines.append("Key Verses:")
        for verse in pillar.key_verses:
            lines.append(f"  - {verse.reference}: {verse.english[:120]}...")
            lines.append(f"    Principle: {verse.principle}")
            lines.append(f"    Reframe: {verse.reframe_guidance}")
        lines.append(f"Compliance Test: {pillar.compliance_test}")
        lines.append("")

    lines.append("[/ARDHA_FRAMEWORK_CONTEXT]")
    return "\n".join(lines)


def get_ardha_compliance_summary() -> str:
    """Return the 5 Tests of True Gita Compliance as formatted text."""
    lines = ["The 5 Tests of True Gita Compliance (ARDHA):"]
    for i, test in enumerate(ARDHA_COMPLIANCE_TESTS, 1):
        lines.append(f"  {i}. {test['test']} (Pillar {test['pillar']})")
    return "\n".join(lines)

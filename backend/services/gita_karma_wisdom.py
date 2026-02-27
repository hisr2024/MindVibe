"""
Gita Karma Wisdom Engine - Deep Karmic Transformation System.

This engine provides the philosophical foundation for deep karma reset,
strictly grounded in Bhagavad Gita teachings. It contains:

1. STATIC WISDOM: Pre-mapped verses, teachings, and practices for each karmic path
2. DYNAMIC WISDOM: AI-enhanced guidance that builds on the static foundation
3. KARMIC PATH DEFINITIONS: 10 Gita-aligned paths for karmic repair
4. SEVEN-PHASE PROCESS: Deep multi-step karmic transformation ritual
5. FIVE PILLAR COMPLIANCE: Ensures every reset meets Gita's core standards

The Gita teaches (BG 4.17): "The intricacies of action are very hard to understand.
Therefore one should know properly what action is, what forbidden action is,
and what inaction is."

This engine helps users understand, acknowledge, and transform their karmic patterns.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


# ============================================================================
# KARMIC PATHS - 10 Gita-Aligned Repair Paths
# ============================================================================
# Each path is grounded in specific Gita chapters and verses,
# mapping ancient wisdom to modern relational repair.

KARMIC_PATHS: dict[str, dict[str, Any]] = {
    "kshama": {
        "name": "Kshama - The Path of Forgiveness",
        "sanskrit_name": "क्षमा मार्ग",
        "description": "Sincere acknowledgment and heartfelt apology through the Gita's teaching on forgiveness as divine quality",
        "gita_principle": "Kshama (forgiveness) is listed among the divine qualities (Daivi Sampada) in BG 16.3. The Gita teaches that forgiveness is not weakness but the strength of the spiritually evolved.",
        "core_verse": {
            "chapter": 16,
            "verse": 3,
            "sanskrit": "तेजः क्षमा धृतिः शौचमद्रोहो नातिमानिता। भवन्ति सम्पदं दैवीमभिजातस्य भारत॥",
            "transliteration": "tejaḥ kṣamā dhṛtiḥ śaucam adroho nāti-mānitā, bhavanti sampadaṁ daivīm abhijātasya bhārata",
            "english": "Vigor, forgiveness, fortitude, purity, absence of hatred, absence of pride — these belong to one born of divine nature, O Bharata.",
            "hindi": "तेज, क्षमा, धैर्य, शुद्धि, अद्रोह और अभिमान का अभाव — ये दैवी सम्पत् को प्राप्त हुए मनुष्य के लक्षण हैं।"
        },
        "supporting_verses": [
            {"chapter": 12, "verse": 13, "key_teaching": "One who bears no ill-will to any being, who is friendly and compassionate"},
            {"chapter": 11, "verse": 44, "key_teaching": "As a father forgives a son, a friend forgives a friend, so should one forgive"},
            {"chapter": 6, "verse": 9, "key_teaching": "The wise see with equal eye the learned, the outcaste, the friend and the foe"}
        ],
        "karmic_teaching": "When we harm another, a karmic debt is created. The Gita teaches that kshama (forgiveness) is the sacred fire that burns away this debt — not by erasing the action, but by transforming the doer. True apology requires seeing the atman in the other person and recognizing that when we hurt them, we hurt the universal Self.",
        "sadhana": [
            "Before approaching the other person, sit in stillness and invoke the witness (sakshi). Recognize that the ego (ahamkara) acted, not your true Self.",
            "Recite mentally: 'The Self in me honors the Self in you. My actions caused suffering. I seek to restore dharma between us.'",
            "Offer your apology as a sacred offering (ishvara arpana), without expectation of being forgiven. The act of sincere apology itself is the purification.",
            "Practice kshama meditation daily for 7 days: visualize the person, send them peace, and release the karmic knot."
        ],
        "themes": ["forgiveness", "humility", "compassion", "divine_qualities"],
        "guna_analysis": "Harm through harsh words or thoughtless action often arises from rajas (passion/agitation) or tamas (ignorance/carelessness). The path of kshama cultivates sattva (purity/goodness).",
        "repair_type_legacy": "apology"
    },

    "satya": {
        "name": "Satya - The Path of Truth",
        "sanskrit_name": "सत्य मार्ग",
        "description": "Gentle clarification through truthful, compassionate communication as taught by the Gita",
        "gita_principle": "Satya (truth) is one of the foundational qualities. BG 17.15 teaches that speech should be truthful, pleasant, beneficial, and not agitating — the four-fold test of right speech.",
        "core_verse": {
            "chapter": 17,
            "verse": 15,
            "sanskrit": "अनुद्वेगकरं वाक्यं सत्यं प्रियहितं च यत्। स्वाध्यायाभ्यसनं चैव वाङ्मयं तप उच्यते॥",
            "transliteration": "anudvega-karaṁ vākyaṁ satyaṁ priya-hitaṁ ca yat, svādhyāyābhyasanaṁ caiva vāṅ-mayaṁ tapa ucyate",
            "english": "Speech that causes no distress, that is truthful, pleasant and beneficial, along with the practice of self-study — this is called austerity of speech.",
            "hindi": "जो वाणी उद्वेग न करने वाली, सत्य, प्रिय और हितकारी हो तथा स्वाध्याय का अभ्यास — यह वाणी का तप कहा जाता है।"
        },
        "supporting_verses": [
            {"chapter": 10, "verse": 4, "key_teaching": "Truthfulness (satyam) flows from the Lord as a quality of being"},
            {"chapter": 16, "verse": 2, "key_teaching": "Ahimsa, satya, absence of anger — divine qualities of the evolved soul"},
            {"chapter": 18, "verse": 65, "key_teaching": "Speak truth with love, for truth without love is cruelty"}
        ],
        "karmic_teaching": "Misunderstandings create karmic entanglement because they distort reality (maya). The Gita teaches that satya is not merely stating facts — it is aligning speech with dharma. When we clarify with compassion, we dissolve the maya between two beings and restore the natural flow of understanding. BG 17.15 gives us the four-fold test: Is it true? Is it pleasant? Is it beneficial? Does it not cause distress?",
        "sadhana": [
            "Before speaking, apply the Gita's four-fold test (BG 17.15): Is what I will say true (satya), pleasant (priya), beneficial (hita), and non-agitating (anudvega-kara)?",
            "Meditate on the difference between your intention and how it was received. The gap is where maya (illusion) lives.",
            "Approach clarification not to 'win' or 'be right' — approach it as an offering of truth (satya-dana). Release attachment to being understood.",
            "Practice active listening as a form of dhyana (meditation) — give your full presence to the other person's perspective."
        ],
        "themes": ["truth", "communication", "clarity", "speech_austerity"],
        "guna_analysis": "Miscommunication often arises from rajasic urgency (speaking without thinking) or tamasic neglect (not communicating at all). Sattvic communication is clear, kind, and purposeful.",
        "repair_type_legacy": "clarification"
    },

    "shanti": {
        "name": "Shanti - The Path of Peace",
        "sanskrit_name": "शान्ति मार्ग",
        "description": "Restoring calm through the Gita's teachings on equanimity and inner peace",
        "gita_principle": "The Gita's entire teaching leads to shanti. BG 2.66 declares there is no peace for the uncontrolled mind, while BG 2.71 describes the peace that comes from desireless living.",
        "core_verse": {
            "chapter": 2,
            "verse": 66,
            "sanskrit": "नास्ति बुद्धिरयुक्तस्य न चायुक्तस्य भावना। न चाभावयतः शान्तिरशान्तस्य कुतः सुखम्॥",
            "transliteration": "nāsti buddhir ayuktasya na cāyuktasya bhāvanā, na cābhāvayataḥ śāntir aśāntasya kutaḥ sukham",
            "english": "There is no wisdom for the unsteady, and no meditation for the unsteady; and for the un-meditative there is no peace — and for the peaceless, how can there be happiness?",
            "hindi": "जो मनुष्य योग-रहित है उसमें निश्चयात्मिका बुद्धि नहीं होती और भावना भी नहीं होती; भावनाहीन को शान्ति नहीं मिलती और अशान्त को सुख कैसे मिले?"
        },
        "supporting_verses": [
            {"chapter": 2, "verse": 71, "key_teaching": "One who has given up all desires attains peace"},
            {"chapter": 5, "verse": 29, "key_teaching": "Knowing Me as the enjoyer of sacrifice and austerity, the friend of all, one attains peace"},
            {"chapter": 6, "verse": 7, "key_teaching": "For one who has conquered the mind, the mind is the best of friends"}
        ],
        "karmic_teaching": "Tension in relationships creates karmic disturbance that ripples through both lives. The Gita teaches that true shanti is not the absence of conflict but the presence of equanimity (samatva). When we approach a tense situation with inner peace, we become an instrument of divine harmony. The Sthitaprajna (person of steady wisdom, BG 2.55-72) remains unmoved by praise or blame, and this steadiness itself heals.",
        "sadhana": [
            "Practice the Sthitaprajna meditation: Sit quietly and observe your agitation as a witness. You are not the anger or hurt — you are the awareness watching it.",
            "Before reconnecting, achieve inner equilibrium first. The Gita warns (BG 2.66): without inner peace, there can be no outer peace.",
            "Return to the person with warmth, not to resolve the conflict, but to restore the dharmic bond between you. Release the need to revisit the tension.",
            "Chant 'Om Shanti Shanti Shanti' three times — peace for body, mind, and spirit — before and after the reconnection."
        ],
        "themes": ["equanimity", "peace", "emotional_balance", "sthitaprajna"],
        "guna_analysis": "Tension typically comes from rajasic reactivity — the mind caught in stimulus-response loops. The shanti path cultivates the sattvic quality of peaceful awareness that responds rather than reacts.",
        "repair_type_legacy": "calm_followup"
    },

    "atma_kshama": {
        "name": "Atma Kshama - The Path of Self-Forgiveness",
        "sanskrit_name": "आत्म क्षमा मार्ग",
        "description": "Releasing self-blame through the Gita's teaching that you are not the doer and the Self is ever-pure",
        "gita_principle": "BG 6.5 declares: 'Let one lift oneself by one's own Self; let not one degrade oneself.' Self-forgiveness is recognizing that the atman is untouched by karmic action — only prakriti (nature) acts.",
        "core_verse": {
            "chapter": 6,
            "verse": 5,
            "sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
            "transliteration": "uddhared ātmanātmānaṁ nātmānam avasādayet, ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ",
            "english": "Let one raise oneself by one's own Self, let not one degrade oneself; for the Self alone is the friend of oneself, and the Self alone is the enemy of oneself.",
            "hindi": "अपने द्वारा अपना उद्धार करे और अपने को अधोगति में न डाले; क्योंकि आत्मा ही अपना मित्र है और आत्मा ही अपना शत्रु है।"
        },
        "supporting_verses": [
            {"chapter": 3, "verse": 27, "key_teaching": "All actions are performed by the gunas of prakriti; the Self deluded by ego thinks 'I am the doer'"},
            {"chapter": 5, "verse": 14, "key_teaching": "The Lord does not create doership or actions; it is nature that acts"},
            {"chapter": 13, "verse": 31, "key_teaching": "The imperishable Self, dwelling in the body, neither acts nor is tainted"}
        ],
        "karmic_teaching": "Self-blame is ahamkara (ego) claiming ownership of actions that were performed by prakriti (nature) through the gunas. The Gita's deepest teaching on karma (BG 3.27) reveals: 'All actions are performed by the gunas of material nature; the self, deluded by ego, thinks I am the doer.' Self-forgiveness is not excusing the action — it is recognizing the difference between the eternal atman and the temporary mind-body instrument. You correct the instrument; you do not condemn the Self.",
        "sadhana": [
            "Sit in meditation and practice sakshi bhava (witness consciousness): Watch the self-blame as something arising in the mind, not as truth about who you are.",
            "Recite BG 3.27 mentally: 'The gunas of prakriti perform all actions. The self, deluded by ahamkara, thinks I am the doer.' Understand that your mistake arose from rajas or tamas, not from your true nature.",
            "Write a letter to yourself from the perspective of the atman — the eternal witness. What would your highest Self say to the suffering ego?",
            "Commit to corrective action (prayaschitta) as dharmic duty, not as punishment. The Gita teaches action without attachment — perform the repair, release the guilt."
        ],
        "themes": ["self_compassion", "acceptance", "inner_peace", "witness_consciousness"],
        "guna_analysis": "Self-blame is tamasic when it leads to paralysis and despair, and rajasic when it creates anxious self-punishment. The sattvic response is clear-eyed acknowledgment with compassionate correction.",
        "repair_type_legacy": "self-forgive"
    },

    "seva": {
        "name": "Seva - The Path of Selfless Amends",
        "sanskrit_name": "सेवा मार्ग",
        "description": "Making amends through selfless action, as the Gita teaches that nishkama karma purifies the heart",
        "gita_principle": "BG 3.19 teaches that by performing duty without attachment, one attains the Supreme. Seva (selfless service) directed toward the person we harmed is the most powerful form of karmic repair.",
        "core_verse": {
            "chapter": 3,
            "verse": 19,
            "sanskrit": "तस्मादसक्तः सततं कार्यं कर्म समाचर। असक्तो ह्याचरन्कर्म परमाप्नोति पूरुषः॥",
            "transliteration": "tasmād asaktaḥ satataṁ kāryaṁ karma samācara, asakto hy ācaran karma param āpnoti pūruṣaḥ",
            "english": "Therefore, without attachment, always perform the action that should be done; for by performing action without attachment, one attains the Supreme.",
            "hindi": "इसलिए तू निरन्तर आसक्ति-रहित होकर कर्तव्य-कर्म कर; क्योंकि आसक्ति-रहित होकर कर्म करने से मनुष्य परमात्मा को प्राप्त होता है।"
        },
        "supporting_verses": [
            {"chapter": 3, "verse": 9, "key_teaching": "Action done as sacrifice frees one from bondage; perform action as offering"},
            {"chapter": 18, "verse": 46, "key_teaching": "By worshipping the Lord through one's own duty, one attains perfection"},
            {"chapter": 5, "verse": 10, "key_teaching": "One who acts offering all to Brahman, abandoning attachment, is untouched by sin"}
        ],
        "karmic_teaching": "The Gita teaches that karma yoga — selfless action — is the most direct path to purification. When we have caused harm, the deepest repair is not words but actions. Seva (service) directed toward the one we harmed transforms the karmic energy from negative to positive. But the Gita's key insight is that this seva must be nishkama — without desire for forgiveness, recognition, or relief from guilt. The action itself is the purification.",
        "sadhana": [
            "Identify one concrete action you can take to serve or help the person you harmed. This is your prayaschitta (atonement through action).",
            "Perform this action as yajna (sacred offering) — without expectation of recognition or forgiveness. BG 3.9 teaches that action done as sacrifice liberates.",
            "Continue small acts of kindness toward this person for at least 21 days. Consistency transforms the karmic pattern.",
            "Each night, mentally offer the day's seva to the divine: 'I offer these actions as my repair. The result is not mine.' This is ishvara arpana."
        ],
        "themes": ["selfless_action", "nishkama_karma", "service", "atonement"],
        "guna_analysis": "The desire to 'fix things quickly' or 'make it up' is rajasic. True seva is sattvic — steady, unattached, done because it is right, not because it relieves your guilt.",
        "repair_type_legacy": "amends"
    },

    "ahimsa": {
        "name": "Ahimsa - The Path of Non-Harm",
        "sanskrit_name": "अहिंसा मार्ग",
        "description": "Gentle repair through the Gita's supreme teaching of non-violence in thought, word, and deed",
        "gita_principle": "Ahimsa is listed first among divine qualities (BG 16.2) and is called the highest dharma. When we have caused harm through violence of word or thought, ahimsa is both the medicine and the path.",
        "core_verse": {
            "chapter": 16,
            "verse": 2,
            "sanskrit": "अहिंसा सत्यमक्रोधस्त्यागः शान्तिरपैशुनम्। दया भूतेष्वलोलुप्त्वं मार्दवं ह्रीरचापलम्॥",
            "transliteration": "ahiṁsā satyam akrodhas tyāgaḥ śāntir apaiśunam, dayā bhūteṣv aloluptvaṁ mārdavaṁ hrīr acāpalam",
            "english": "Non-violence, truthfulness, absence of anger, renunciation, tranquility, absence of calumny, compassion to beings, non-covetousness, gentleness, modesty, absence of fickleness.",
            "hindi": "अहिंसा, सत्य, अक्रोध, त्याग, शान्ति, निन्दा न करना, भूतों में दया, अलोलुपता, कोमलता, लज्जा और अचपलता।"
        },
        "supporting_verses": [
            {"chapter": 12, "verse": 13, "key_teaching": "One who is not hateful to any being, who is friendly and compassionate — dear to Me"},
            {"chapter": 6, "verse": 32, "key_teaching": "One who sees equality everywhere, in pleasure and pain, is the highest yogi"},
            {"chapter": 13, "verse": 7, "key_teaching": "Humility, non-violence, patience — these constitute true knowledge"}
        ],
        "karmic_teaching": "Every act of himsa (violence) — whether physical, verbal, or mental — creates a karmic ripple. The Gita teaches that ahimsa is not passive avoidance of harm but the active cultivation of compassion. When you repair through the ahimsa path, you are not merely stopping harm — you are transforming the violent energy into its opposite: daya (compassion) and maitri (friendship). The deepest ahimsa begins with stopping violence toward yourself.",
        "sadhana": [
            "Examine the harm you caused: Was it in word (vak-himsa), in action (karma-himsa), or in thought (manas-himsa)? Each requires a different repair.",
            "For verbal harm: Practice mauna (silence) for a period, then re-approach with words that pass the satya test (BG 17.15).",
            "For action-based harm: Replace the harmful action with its opposite — daya (compassion). This is pratipaksha bhavana, cultivating the opposite quality.",
            "Practice the ahimsa meditation: Visualize the person you harmed. Send them thoughts of safety, well-being, and freedom from suffering. Do this daily until the karmic residue dissolves."
        ],
        "themes": ["non_violence", "compassion", "gentleness", "divine_qualities"],
        "guna_analysis": "Violence arises from rajas (aggression, anger) and tamas (cruelty, callousness). Ahimsa is the purest expression of sattva — the quality of light, harmony, and goodness.",
        "repair_type_legacy": "gentle_repair"
    },

    "daya": {
        "name": "Daya - The Path of Compassion",
        "sanskrit_name": "दया मार्ग",
        "description": "Empathetic reconnection through the Gita's teaching on seeing the divine in all beings",
        "gita_principle": "BG 6.29 teaches the yogi who sees the Self in all beings and all beings in the Self. Daya (compassion) arises naturally from this vision of universal oneness.",
        "core_verse": {
            "chapter": 6,
            "verse": 29,
            "sanskrit": "सर्वभूतस्थमात्मानं सर्वभूतानि चात्मनि। ईक्षते योगयुक्तात्मा सर्वत्र समदर्शनः॥",
            "transliteration": "sarva-bhūta-stham ātmānaṁ sarva-bhūtāni cātmani, īkṣate yoga-yuktātmā sarvatra sama-darśanaḥ",
            "english": "One whose self is established in yoga sees the Self abiding in all beings and all beings in the Self; one sees the same everywhere.",
            "hindi": "जिसका मन योग में स्थित है वह सब भूतों में आत्मा को और आत्मा में सब भूतों को देखता है; वह सर्वत्र समदर्शी होता है।"
        },
        "supporting_verses": [
            {"chapter": 12, "verse": 15, "key_teaching": "One by whom the world is not agitated and who is not agitated by the world — dear to Me"},
            {"chapter": 5, "verse": 18, "key_teaching": "The wise see equally the learned, the cow, the elephant, the dog, and the outcaste"},
            {"chapter": 16, "verse": 3, "key_teaching": "Compassion for creatures (daya bhuteshu) is a divine quality"}
        ],
        "karmic_teaching": "The Gita reveals that all beings are manifestations of one consciousness (BG 6.29). When we harm another, we harm ourselves — not metaphorically, but literally. The path of daya asks us to reconnect by seeing past the surface personality to the atman within the other person. When you see the divine in the one you harmed, compassion flows naturally and the karmic wound begins to heal from both sides.",
        "sadhana": [
            "Practice sama-darshana (equal vision): Before reconnecting, meditate on the truth that the same atman dwells in you and in the person you harmed.",
            "Listen to their pain with your full being — not to respond, defend, or explain, but simply to witness their experience. This is the highest form of daya.",
            "Ask: 'How did my action affect your heart?' Then listen without interruption. This creates a sacred space for healing.",
            "After reconnecting, maintain the practice of seeing them as a divine being (not as someone who wronged you or whom you wronged). This transforms the relationship at the karmic level."
        ],
        "themes": ["compassion", "empathy", "universal_vision", "oneness"],
        "guna_analysis": "Disconnection from another's suffering is tamasic (dullness/ignorance). Selective compassion (only for those who are kind to us) is rajasic. Universal daya — compassion for all beings regardless — is sattvic.",
        "repair_type_legacy": "empathetic_reconnection"
    },

    "tyaga": {
        "name": "Tyaga - The Path of Letting Go",
        "sanskrit_name": "त्याग मार्ग",
        "description": "Releasing attachment to outcomes through the Gita's teaching on surrender and fruit-renunciation",
        "gita_principle": "BG 18.66 is the supreme verse of surrender: 'Abandon all dharmas and take refuge in Me alone.' Tyaga is letting go of the need to control outcomes and trusting in the larger cosmic order.",
        "core_verse": {
            "chapter": 18,
            "verse": 66,
            "sanskrit": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
            "transliteration": "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja, ahaṁ tvā sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ",
            "english": "Abandoning all dharmas, take refuge in Me alone. I shall liberate you from all sins; do not grieve.",
            "hindi": "सब धर्मों को त्याग कर केवल मेरी शरण में आ जा। मैं तुझे सब पापों से मुक्त कर दूँगा; शोक मत कर।"
        },
        "supporting_verses": [
            {"chapter": 2, "verse": 47, "key_teaching": "Your right is to action alone, never to its fruits. Do not be the cause of the fruit of action."},
            {"chapter": 12, "verse": 11, "key_teaching": "If even this you cannot do, take refuge in Me and renounce the fruit of all action"},
            {"chapter": 18, "verse": 6, "key_teaching": "These actions should be performed abandoning attachment and the fruits — this is My definite supreme view"}
        ],
        "karmic_teaching": "Sometimes the deepest karmic repair is not doing more, but letting go. The Gita teaches (BG 2.47) that we have a right to action but never to its results. When a relationship cannot be repaired through effort, the path of tyaga teaches us to release our attachment to the outcome. This is not giving up — it is the supreme spiritual act of offering the situation to the divine order and trusting that prakriti will resolve what the ego cannot.",
        "sadhana": [
            "Identify what you are holding onto: Is it the desire to be forgiven? The need to fix things? The fear of consequences? Name the attachment clearly.",
            "Practice phala-tyaga: 'I have done what I could. I release the fruit of this action. The outcome belongs to the larger order, not to me.'",
            "If the relationship cannot be repaired directly, write a letter you will not send. Pour out your heart, then offer it to fire (symbolically or literally) as a yajna (sacred offering).",
            "Recite BG 18.66 daily as your surrender mantra. Let go of the guilt, the shame, the need to control. Trust that the cosmic dharma will restore balance in its own time."
        ],
        "themes": ["letting_go", "surrender", "fruit_renunciation", "trust"],
        "guna_analysis": "Clinging to outcomes is rajasic (desire-driven). Giving up out of despair is tamasic. True tyaga is sattvic — a clear-eyed release born from wisdom, not from weakness or exhaustion.",
        "repair_type_legacy": "letting_go"
    },

    "tapas": {
        "name": "Tapas - The Path of Committed Transformation",
        "sanskrit_name": "तपस् मार्ग",
        "description": "Deep behavioral change through the Gita's teaching on austerity as purification of body, speech, and mind",
        "gita_principle": "BG 17.14-16 teaches three forms of tapas: bodily (kayika), verbal (vachika), and mental (manasika). True karmic repair often requires committed inner transformation — not just a one-time apology but a sustained practice of self-discipline.",
        "core_verse": {
            "chapter": 17,
            "verse": 14,
            "sanskrit": "देवद्विजगुरुप्राज्ञपूजनं शौचमार्जवम्। ब्रह्मचर्यमहिंसा च शारीरं तप उच्यते॥",
            "transliteration": "deva-dvija-guru-prājña-pūjanaṁ śaucam ārjavam, brahmacaryam ahiṁsā ca śārīraṁ tapa ucyate",
            "english": "Worship of the devas, the wise, the teachers and the learned; purity, straightforwardness, celibacy and non-violence — this is called austerity of the body.",
            "hindi": "देवता, द्विज, गुरु और ज्ञानियों का पूजन, शुद्धि, सरलता, ब्रह्मचर्य और अहिंसा — यह शारीरिक तप कहा जाता है।"
        },
        "supporting_verses": [
            {"chapter": 17, "verse": 15, "key_teaching": "Speech that is non-agitating, truthful, pleasant and beneficial is austerity of speech"},
            {"chapter": 17, "verse": 16, "key_teaching": "Serenity of mind, gentleness, silence, self-control, purity of heart — this is austerity of mind"},
            {"chapter": 4, "verse": 10, "key_teaching": "Many purified by the austerity of knowledge have attained My being"}
        ],
        "karmic_teaching": "When the same harmful pattern keeps repeating, surface-level apologies are insufficient. The Gita prescribes tapas — not as punishment, but as purification. BG 17.14-16 lays out a complete system: purify the body (actions), purify speech (words), and purify the mind (thoughts). This is the deepest form of karma reset — not resetting a single action, but transforming the pattern that produced it.",
        "sadhana": [
            "Identify the pattern, not just the incident. What recurring karma (samskara) led to this harm? Anger? Carelessness? Selfishness? Name the root.",
            "Commit to kayika tapas (bodily austerity): For 21 days, practice one concrete behavioral change that addresses the root pattern.",
            "Commit to vachika tapas (speech austerity): Before speaking in any emotionally charged situation, pause for 3 breaths. Apply the BG 17.15 test.",
            "Commit to manasika tapas (mental austerity): Practice daily meditation focused on cultivating the opposite quality (pratipaksha bhavana). If the pattern is anger, cultivate patience. If carelessness, cultivate mindfulness."
        ],
        "themes": ["self_discipline", "purification", "committed_change", "austerity"],
        "guna_analysis": "Repeated harmful patterns indicate deep-seated rajasic or tamasic samskaras (impressions). Tapas is the fire that burns away these impressions and creates new sattvic pathways in consciousness.",
        "repair_type_legacy": "committed_change"
    },

    "shraddha": {
        "name": "Shraddha - The Path of Trust Rebuilding",
        "sanskrit_name": "श्रद्धा मार्ग",
        "description": "Rebuilding trust through consistent, faith-based action as the Gita teaches that shraddha shapes destiny",
        "gita_principle": "BG 17.3 teaches: 'The faith of each is according to one's own nature. A person is made of faith. Whatever faith one has, that one becomes.' Rebuilding trust requires embodying shraddha through consistent, trustworthy action.",
        "core_verse": {
            "chapter": 17,
            "verse": 3,
            "sanskrit": "सत्त्वानुरूपा सर्वस्य श्रद्धा भवति भारत। श्रद्धामयोऽयं पुरुषो यो यच्छ्रद्धः स एव सः॥",
            "transliteration": "sattvānurūpā sarvasya śraddhā bhavati bhārata, śraddhā-mayo 'yaṁ puruṣo yo yac-chraddhaḥ sa eva saḥ",
            "english": "The faith of each is in accordance with one's nature, O Bharata. A person consists of faith. Whatever is one's faith, that indeed one is.",
            "hindi": "हे भारत! सब मनुष्यों की श्रद्धा उनके स्वभाव के अनुसार होती है। यह पुरुष श्रद्धामय है; जो जैसी श्रद्धा वाला है वह वैसा ही है।"
        },
        "supporting_verses": [
            {"chapter": 4, "verse": 39, "key_teaching": "The one who has faith and devotion and has controlled the senses attains knowledge"},
            {"chapter": 6, "verse": 47, "key_teaching": "With inner self merged in Me, full of faith — such a yogi is the most devoted"},
            {"chapter": 9, "verse": 3, "key_teaching": "Those without faith in this dharma return to the path of death and rebirth"}
        ],
        "karmic_teaching": "Trust, once broken, creates one of the deepest karmic wounds. The Gita teaches that shraddha is not blind faith — it is the deep conviction that shapes who we become. When you have broken someone's trust, rebuilding requires not grand gestures but consistent, faithful action over time. BG 17.3 reveals that we literally become what we practice with faith. If you practice trustworthiness with shraddha, you become trustworthy — and this transformation is felt by others at a karmic level.",
        "sadhana": [
            "Acknowledge the broken trust without minimizing it. Say: 'I understand that my actions damaged the trust between us. I take full responsibility.'",
            "Do not ask for trust — earn it. The Gita teaches that shraddha grows from consistent experience, not from promises. Commit to specific trustworthy actions.",
            "Practice transparency as tapas: Share your intentions openly, follow through on every commitment no matter how small, and admit immediately when you fall short.",
            "Have patience with the process. Trust rebuilds slowly — the Gita's teaching on gradual progress (BG 6.25) applies: 'Little by little, with patience, let the mind be stilled.' Similarly, trust is rebuilt little by little."
        ],
        "themes": ["trust", "faith", "consistency", "gradual_progress"],
        "guna_analysis": "Breaking trust often comes from rajasic impulsivity or tamasic dishonesty. Sattvic shraddha is built through consistent, truthful, patient action over time.",
        "repair_type_legacy": "trust_rebuilding"
    },
}


# ============================================================================
# SEVEN-PHASE KARMA RESET PROCESS
# ============================================================================
# Each phase is grounded in Gita wisdom, creating a deep transformative journey
# rather than a superficial 4-step guidance.

SEVEN_PHASES = [
    {
        "phase": 1,
        "name": "Sthiti Pariksha",
        "sanskrit_name": "स्थिति परीक्षा",
        "english_name": "Witness Awareness",
        "description": "Step back from the situation and observe it as the witness (sakshi). The Gita teaches (BG 13.22): the Supreme Self in the body is the witness, the consenter, the sustainer.",
        "icon": "eye",
        "purpose": "Shift from reactive ego to witnessing consciousness before any repair begins"
    },
    {
        "phase": 2,
        "name": "Karma Darshan",
        "sanskrit_name": "कर्म दर्शन",
        "english_name": "Karmic Insight",
        "description": "See the karmic pattern clearly. The Gita teaches (BG 4.17): 'The nature of action is very difficult to understand.' Identify which guna drove the action and what samskara was activated.",
        "icon": "sparkles",
        "purpose": "Understand the root karmic pattern, not just the surface incident"
    },
    {
        "phase": 3,
        "name": "Pranayama Shuddhi",
        "sanskrit_name": "प्राणायाम शुद्धि",
        "english_name": "Sacred Breath Purification",
        "description": "Use breath to purify the agitated prana. The Gita teaches (BG 4.29): some offer the outgoing breath into the incoming, and the incoming into the outgoing, restraining the movement of both.",
        "icon": "wind",
        "purpose": "Calm the nervous system and create inner equilibrium before repair"
    },
    {
        "phase": 4,
        "name": "Pashchataap",
        "sanskrit_name": "पश्चाताप",
        "english_name": "Deep Acknowledgment",
        "description": "Sincere, unflinching acknowledgment of the ripple caused. Not guilt (which is tamasic) but dharmic recognition of impact. The Gita teaches honest self-assessment.",
        "icon": "droplets",
        "purpose": "Fully acknowledge the harm without self-punishment or minimization"
    },
    {
        "phase": 5,
        "name": "Prayaschitta",
        "sanskrit_name": "प्रायश्चित्त",
        "english_name": "Sacred Repair Action",
        "description": "The actual repair action — performed as nishkama karma (desireless action). The Gita teaches (BG 3.19): perform duty without attachment, for by unattached action one attains the Supreme.",
        "icon": "heart",
        "purpose": "Execute the repair as sacred duty, without attachment to being forgiven"
    },
    {
        "phase": 6,
        "name": "Sankalpa",
        "sanskrit_name": "संकल्प",
        "english_name": "Sacred Intention",
        "description": "Set a dharmic intention for transformation. The Gita teaches (BG 6.5): let one lift oneself by one's own Self. Sankalpa is the conscious commitment to transform the pattern.",
        "icon": "flame",
        "purpose": "Commit to behavioral transformation, not just this one repair"
    },
    {
        "phase": 7,
        "name": "Gita Darshan",
        "sanskrit_name": "गीता दर्शन",
        "english_name": "Wisdom Integration",
        "description": "Receive the Gita's teaching on your specific situation. The verse speaks directly to your karma, providing both comfort and direction for the path ahead.",
        "icon": "book_open",
        "purpose": "Integrate timeless wisdom into your understanding of this experience"
    }
]


# ============================================================================
# GITA CORE WISDOM: Static Verse Mappings for Karma Reset
# ============================================================================
# These are the foundational verses that every karma reset draws from,
# organized by the karmic themes they address.

KARMA_RESET_CORE_VERSES = {
    "action_without_attachment": {
        "verse": {"chapter": 2, "verse": 47},
        "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        "transliteration": "karmaṇy evādhikāras te mā phaleṣu kadācana, mā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
        "english": "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results, and never be attached to inaction.",
        "application_to_karma_reset": "When repairing a relationship, perform the repair as your dharmic duty. Do not attach to whether you will be forgiven. The repair itself is your right; the response is not."
    },
    "equanimity_in_duality": {
        "verse": {"chapter": 2, "verse": 48},
        "sanskrit": "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
        "transliteration": "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya, siddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate",
        "english": "Perform action, O Dhananjaya, established in yoga, abandoning attachment, remaining equal in success and failure. This equanimity is called yoga.",
        "application_to_karma_reset": "Approach the repair with equanimity. Whether the person forgives you or not, whether the relationship heals or not — your inner state remains balanced. This balance IS yoga."
    },
    "the_self_is_untouched": {
        "verse": {"chapter": 2, "verse": 20},
        "sanskrit": "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥",
        "transliteration": "na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ, ajo nityaḥ śāśvato 'yaṁ purāṇo na hanyate hanyamāne śarīre",
        "english": "The Self is never born, nor does it die. It has not come into being, does not come into being, and will not come into being. It is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain.",
        "application_to_karma_reset": "Your mistakes do not define your essence. The atman — your true Self — is untouched by karma. This understanding is not an excuse for harm, but the foundation for self-forgiveness and genuine transformation."
    },
    "nature_performs_action": {
        "verse": {"chapter": 3, "verse": 27},
        "sanskrit": "प्रकृतेः क्रियमाणानि गुणैः कर्माणि सर्वशः। अहंकारविमूढात्मा कर्ताहमिति मन्यते॥",
        "transliteration": "prakṛteḥ kriyamāṇāni guṇaiḥ karmāṇi sarvaśaḥ, ahaṁkāra-vimūḍhātmā kartāham iti manyate",
        "english": "All actions are performed by the gunas of prakriti. The self, deluded by ahamkara (ego), thinks: 'I am the doer.'",
        "application_to_karma_reset": "Understanding this is liberation. Your harmful action arose from the gunas (rajas/tamas), not from your true Self. Correct the instrument (mind-body), but do not condemn the atman. This is the key to genuine self-forgiveness."
    },
    "supreme_surrender": {
        "verse": {"chapter": 18, "verse": 66},
        "sanskrit": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
        "transliteration": "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja, ahaṁ tvā sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ",
        "english": "Abandoning all dharmas, take refuge in Me alone. I shall liberate you from all sins; do not grieve.",
        "application_to_karma_reset": "The ultimate promise: when all other paths feel insufficient, surrender completely. Offer your mistake, your guilt, your desire to repair — offer everything to the divine. You will be freed from all karmic debt. Do not grieve."
    },
    "steady_wisdom": {
        "verse": {"chapter": 2, "verse": 56},
        "sanskrit": "दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः। वीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते॥",
        "transliteration": "duḥkheṣv anudvigna-manāḥ sukheṣu vigata-spṛhaḥ, vīta-rāga-bhaya-krodhaḥ sthita-dhīr munir ucyate",
        "english": "One whose mind is not shaken by adversity, who does not hanker after pleasures, who is free from attachment, fear and anger, is called a sage of steady wisdom.",
        "hindi": "जिसका मन दुःखों में उद्विग्न नहीं होता, सुखों में जिसकी स्पृहा नहीं है, जो राग, भय और क्रोध से रहित है — वह स्थितधी मुनि कहलाता है।",
        "application_to_karma_reset": "The goal of karma reset is not to eliminate all conflict, but to develop sthitaprajna — steady wisdom that remains unshaken regardless of whether the repair succeeds or fails."
    }
}


# ============================================================================
# GUNA ANALYSIS FRAMEWORK
# ============================================================================
# The Gita teaches that all actions arise from the three gunas.
# Understanding which guna drove the harmful action is essential for deep repair.

GUNA_ANALYSIS = {
    "rajasic_harm": {
        "name": "Rajasic Harm",
        "sanskrit": "राजसिक",
        "description": "Harm arising from passion, agitation, restlessness, or selfish desire",
        "indicators": [
            "You acted in the heat of the moment",
            "You were driven by anger, jealousy, or competition",
            "You spoke or acted impulsively without thinking",
            "You were pursuing a selfish goal at someone's expense",
            "You were reactive, not responsive"
        ],
        "gita_reference": "BG 14.12: Greed, activity, undertaking of actions, restlessness, desire — these arise when rajas predominates.",
        "antidote": "Cultivate sattva through: pause before action, practice equanimity, and perform nishkama karma (desireless action)."
    },
    "tamasic_harm": {
        "name": "Tamasic Harm",
        "sanskrit": "तामसिक",
        "description": "Harm arising from ignorance, negligence, laziness, or carelessness",
        "indicators": [
            "You failed to act when action was needed",
            "You were careless or negligent",
            "You ignored someone's needs or feelings",
            "You were too lazy or complacent to show up",
            "You caused harm through omission, not commission"
        ],
        "gita_reference": "BG 14.13: Darkness, inactivity, heedlessness, and delusion — these arise when tamas predominates.",
        "antidote": "Cultivate rajas first (get moving, take action), then elevate to sattva through: mindfulness, accountability, and proactive care."
    },
    "sattvic_correction": {
        "name": "Sattvic Correction",
        "sanskrit": "सात्विक",
        "description": "The target state — repair through wisdom, clarity, and genuine goodness",
        "indicators": [
            "You take responsibility clearly and honestly",
            "You act from genuine care, not guilt or fear",
            "You are patient with the healing process",
            "You seek to understand, not just to be understood",
            "You maintain inner peace while addressing the harm"
        ],
        "gita_reference": "BG 14.11: When light and understanding arise in all the gates of the body, then sattva is predominant.",
        "antidote": "Maintain sattva through: daily meditation, truthful speech, selfless action, and regular self-reflection."
    }
}


def get_karmic_path(path_key: str) -> dict[str, Any] | None:
    """
    Retrieve a karmic path by its key.

    Args:
        path_key: Key identifier for the karmic path (e.g., 'kshama', 'satya')

    Returns:
        Complete karmic path data or None if not found
    """
    return KARMIC_PATHS.get(path_key)


def get_karmic_path_by_legacy_type(repair_type: str) -> dict[str, Any] | None:
    """
    Find a karmic path by its legacy repair_type mapping.

    Supports backward compatibility with the old 3-type system.

    Args:
        repair_type: Legacy repair type (e.g., 'apology', 'clarification')

    Returns:
        Matching karmic path data or None
    """
    normalized = repair_type.lower().strip().replace(" ", "_").replace("-", "_")

    for path_key, path_data in KARMIC_PATHS.items():
        legacy = path_data.get("repair_type_legacy", "")
        legacy_normalized = legacy.lower().replace(" ", "_").replace("-", "_")
        if legacy_normalized == normalized:
            return path_data
        if path_key == normalized:
            return path_data

    return None


def get_all_karmic_paths_summary() -> list[dict[str, str]]:
    """
    Get a summary list of all available karmic paths.

    Returns:
        List of path summaries with key, name, sanskrit_name, and description
    """
    return [
        {
            "key": key,
            "name": path["name"],
            "sanskrit_name": path["sanskrit_name"],
            "description": path["description"],
            "repair_type_legacy": path.get("repair_type_legacy", key),
        }
        for key, path in KARMIC_PATHS.items()
    ]


def get_seven_phases() -> list[dict[str, Any]]:
    """
    Get the seven-phase karma reset process definition.

    Returns:
        List of phase definitions with names, descriptions, and icons
    """
    return SEVEN_PHASES


def get_core_verse(theme: str) -> dict[str, Any] | None:
    """
    Get a core verse by its theme key.

    Args:
        theme: Theme identifier (e.g., 'action_without_attachment')

    Returns:
        Complete verse data or None
    """
    return KARMA_RESET_CORE_VERSES.get(theme)


def get_guna_analysis(guna_type: str) -> dict[str, Any] | None:
    """
    Get guna analysis data for a specific guna type.

    Args:
        guna_type: One of 'rajasic_harm', 'tamasic_harm', 'sattvic_correction'

    Returns:
        Guna analysis data or None
    """
    return GUNA_ANALYSIS.get(guna_type)


def build_deep_wisdom_context(
    karmic_path: dict[str, Any],
    situation: str = "",
) -> str:
    """
    Build a comprehensive Gita wisdom context for AI guidance generation.

    This creates the deep philosophical foundation that the AI uses to generate
    personalized guidance. It includes the karmic path's core verse, teaching,
    sadhana, guna analysis, and relevant core verses.

    Args:
        karmic_path: Full karmic path data from KARMIC_PATHS
        situation: User's description of the situation

    Returns:
        Rich wisdom context string for AI prompt injection
    """
    parts = []

    # Core identity and teaching
    path_name = karmic_path.get("name", "Unknown Path")
    parts.append(f"KARMIC PATH: {path_name}")
    parts.append(f"GITA PRINCIPLE: {karmic_path.get('gita_principle', '')}")
    parts.append("")

    # Core verse with full text
    core_verse = karmic_path.get("core_verse", {})
    if core_verse:
        parts.append("PRIMARY VERSE:")
        parts.append(f"  Sanskrit: {core_verse.get('sanskrit', '')}")
        parts.append(f"  Translation: {core_verse.get('english', '')}")
        parts.append("")

    # Deep karmic teaching
    parts.append(f"KARMIC TEACHING: {karmic_path.get('karmic_teaching', '')}")
    parts.append("")

    # Guna analysis
    parts.append(f"GUNA ANALYSIS: {karmic_path.get('guna_analysis', '')}")
    parts.append("")

    # Sadhana (practices)
    sadhana = karmic_path.get("sadhana", [])
    if sadhana:
        parts.append("PRESCRIBED SADHANA:")
        for i, practice in enumerate(sadhana, 1):
            parts.append(f"  {i}. {practice}")
        parts.append("")

    # Supporting verses
    supporting = karmic_path.get("supporting_verses", [])
    if supporting:
        parts.append("SUPPORTING VERSES:")
        for sv in supporting:
            parts.append(f"  BG {sv['chapter']}.{sv['verse']}: {sv['key_teaching']}")
        parts.append("")

    # Core karma verses for universal grounding
    parts.append("UNIVERSAL KARMA TEACHINGS:")
    for theme_key in ["action_without_attachment", "equanimity_in_duality", "supreme_surrender"]:
        core = KARMA_RESET_CORE_VERSES.get(theme_key, {})
        if core:
            parts.append(f"  {core.get('english', '')}")
            parts.append(f"  Application: {core.get('application_to_karma_reset', '')}")
            parts.append("")

    return "\n".join(parts)

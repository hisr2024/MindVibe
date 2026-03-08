"""
Karma Problem Resolver - Intelligent Problem-to-Karmic Path Mapping Engine.

This service maps real-life problems, issues, and situations to the most
appropriate karmic path for transformation through the Karma Reset system.

The Gita teaches (BG 2.47): "You have a right to perform your prescribed
duties, but you are not entitled to the fruits of your actions."

Every human problem has a karmic root — this engine identifies it and
routes the seeker to the right path of healing.

Problem Categories (Shad-Ripu aligned):
- Relationship conflicts (Krodha/Moha)
- Work/career struggles (Lobha/Mada)
- Self-worth issues (Matsarya/Moha)
- Family tensions (Krodha/Moha)
- Health/anxiety (Kama/Moha)
- Loss/grief (Moha/Matsarya)
- Betrayal/trust (Krodha/Matsarya)
- Purpose/meaning (Moha/Mada)
"""

import logging
from typing import Any

from backend.services.gita_karma_wisdom import KARMIC_PATHS

logger = logging.getLogger(__name__)


# ============================================================================
# LIFE PROBLEM CATEGORIES - Mapped to Karmic Paths + Gita Wisdom
# ============================================================================
# Each category contains:
# - Common real-life problems/situations
# - Primary and secondary karmic paths for resolution
# - Shad-Ripu (six inner enemies) that fuel the problem
# - Gita verse references for direct wisdom
# - Healing approach grounded in Gita philosophy

LIFE_PROBLEM_CATEGORIES: dict[str, dict[str, Any]] = {
    "relationship_conflict": {
        "name": "Relationship Conflicts",
        "sanskrit_name": "Sambandha Sangharsha",
        "sanskrit_label": "सम्बन्ध संघर्ष",
        "icon": "heart_crack",
        "description": "Arguments, misunderstandings, hurt feelings with loved ones",
        "color": "from-rose-500/20 to-pink-600/20",
        "problems": [
            {
                "id": "hurt_partner",
                "label": "I hurt my partner with my words",
                "situation_template": "I said something hurtful to my partner during an argument and now they are deeply hurt.",
                "feeling_template": "My partner",
                "shad_ripu": "krodha",
                "primary_path": "kshama",
                "secondary_path": "ahimsa",
                "gita_ref": "BG 16.3",
                "healing_insight": "Kshama (forgiveness) is listed among divine qualities. Your words arose from krodha (anger) — a rajasic force. The path of forgiveness begins with acknowledging the wound you caused.",
            },
            {
                "id": "trust_broken",
                "label": "I broke someone's trust",
                "situation_template": "I broke the trust of someone who believed in me, and the relationship feels damaged.",
                "feeling_template": "Someone who trusted me deeply",
                "shad_ripu": "moha",
                "primary_path": "shraddha",
                "secondary_path": "satya",
                "gita_ref": "BG 17.3",
                "healing_insight": "Shraddha (faith) must be rebuilt through consistent, truthful action. The Gita teaches that one's faith reflects one's nature — rebuild yours through sattvic commitment.",
            },
            {
                "id": "neglected_loved_one",
                "label": "I neglected someone who needed me",
                "situation_template": "I was so consumed by my own life that I neglected someone who genuinely needed my presence and care.",
                "feeling_template": "A loved one who needed my presence",
                "shad_ripu": "moha",
                "primary_path": "seva",
                "secondary_path": "daya",
                "gita_ref": "BG 3.19",
                "healing_insight": "Seva (selfless service) is the remedy for self-absorption. The Gita teaches that performing duty for others without attachment purifies the heart and restores bonds.",
            },
            {
                "id": "constant_arguing",
                "label": "We keep fighting about the same things",
                "situation_template": "My relationship is caught in a cycle of repeated arguments about the same issues, creating distance and resentment.",
                "feeling_template": "Both of us in the relationship",
                "shad_ripu": "krodha",
                "primary_path": "shanti",
                "secondary_path": "satya",
                "gita_ref": "BG 2.66",
                "healing_insight": "Shanti (peace) comes from equanimity — samatva. The Gita teaches that without peace, there is no happiness. Break the cycle by becoming the one who chooses peace first.",
            },
            {
                "id": "jealousy_in_relationship",
                "label": "Jealousy is destroying my relationship",
                "situation_template": "I feel intense jealousy that is pushing my partner away and poisoning our relationship.",
                "feeling_template": "My partner and our relationship",
                "shad_ripu": "matsarya",
                "primary_path": "tyaga",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 18.66",
                "healing_insight": "Tyaga (letting go) teaches surrender of possessiveness. Jealousy is matsarya — one of the six inner enemies. The Gita's path of surrender frees you from the prison of comparison.",
            },
        ],
    },
    "work_career": {
        "name": "Work & Career Struggles",
        "sanskrit_name": "Karma Kshetra",
        "sanskrit_label": "कर्म क्षेत्र",
        "icon": "briefcase",
        "description": "Workplace conflicts, career anxiety, professional setbacks",
        "color": "from-blue-500/20 to-indigo-600/20",
        "problems": [
            {
                "id": "unfair_treatment_work",
                "label": "I'm being treated unfairly at work",
                "situation_template": "I feel I'm being treated unfairly at my workplace — overlooked for promotions, given unequal treatment, or not recognized for my contributions.",
                "feeling_template": "Myself and my sense of professional worth",
                "shad_ripu": "krodha",
                "primary_path": "shanti",
                "secondary_path": "tapas",
                "gita_ref": "BG 2.48",
                "healing_insight": "The Gita's teaching on samatva (equanimity) is your shield. Perform your duty with excellence without attachment to recognition. Your dharma is your work itself, not its rewards.",
            },
            {
                "id": "failed_project",
                "label": "My project or business failed",
                "situation_template": "Something I invested significant time and effort into has failed, and I feel devastated and lost.",
                "feeling_template": "Myself and those who depended on the project",
                "shad_ripu": "moha",
                "primary_path": "tyaga",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 2.47",
                "healing_insight": "The Gita's most powerful teaching: your right is to action alone, never to its fruits. Release attachment to the outcome. The failure teaches what success never could.",
            },
            {
                "id": "toxic_workplace",
                "label": "Toxic work environment draining me",
                "situation_template": "My workplace is toxic — negativity, politics, and conflict are draining my energy and affecting my mental health.",
                "feeling_template": "My wellbeing and those around me",
                "shad_ripu": "krodha",
                "primary_path": "ahimsa",
                "secondary_path": "shanti",
                "gita_ref": "BG 6.32",
                "healing_insight": "Ahimsa (non-harm) protects both you and others. The Gita teaches that the highest yogi sees the same Self in all beings. Protect your inner peace while practicing compassion even in difficult environments.",
            },
            {
                "id": "work_life_imbalance",
                "label": "Work is consuming my entire life",
                "situation_template": "I'm so consumed by work that I've lost connection with family, health, and my own inner life.",
                "feeling_template": "My family and my own wellbeing",
                "shad_ripu": "lobha",
                "primary_path": "tapas",
                "secondary_path": "seva",
                "gita_ref": "BG 17.14",
                "healing_insight": "Tapas (disciplined transformation) brings balance. The Gita teaches that austerity of body includes regularity and discipline. Transform your relationship with work through conscious boundaries.",
            },
            {
                "id": "betrayed_by_colleague",
                "label": "A colleague betrayed my trust",
                "situation_template": "Someone I trusted at work betrayed my confidence, took credit for my work, or undermined me behind my back.",
                "feeling_template": "My professional reputation and trust",
                "shad_ripu": "krodha",
                "primary_path": "kshama",
                "secondary_path": "shraddha",
                "gita_ref": "BG 16.3",
                "healing_insight": "Kshama (forgiveness) frees you from the chains of resentment. The Gita teaches that the divine qualities include forgiveness. Your character is not defined by their actions, but by your response.",
            },
        ],
    },
    "self_worth": {
        "name": "Self-Worth & Identity",
        "sanskrit_name": "Atma Gaurava",
        "sanskrit_label": "आत्म गौरव",
        "icon": "mirror",
        "description": "Self-doubt, imposter syndrome, low confidence, self-criticism",
        "color": "from-amber-500/20 to-yellow-600/20",
        "problems": [
            {
                "id": "not_good_enough",
                "label": "I feel I'm not good enough",
                "situation_template": "No matter what I achieve, I feel like I'm not good enough. Self-doubt and imposter syndrome haunt me constantly.",
                "feeling_template": "Myself — my inner self",
                "shad_ripu": "moha",
                "primary_path": "atma_kshama",
                "secondary_path": "tapas",
                "gita_ref": "BG 6.5",
                "healing_insight": "Atma Kshama begins with the Gita's teaching: 'Let one lift oneself by one's own Self; let not one degrade oneself.' You are the eternal atman — infinitely worthy beyond any worldly measure.",
            },
            {
                "id": "comparing_to_others",
                "label": "I constantly compare myself to others",
                "situation_template": "I can't stop comparing myself to others — their success, their relationships, their life seems better than mine, and it makes me miserable.",
                "feeling_template": "My own peace of mind",
                "shad_ripu": "matsarya",
                "primary_path": "daya",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 6.29",
                "healing_insight": "Daya (compassion) includes compassion for yourself. The Gita teaches that one who sees the same Self in all beings transcends comparison. Your path is unique — comparison is the thief of inner peace.",
            },
            {
                "id": "past_mistakes_haunting",
                "label": "Past mistakes keep haunting me",
                "situation_template": "I cannot forgive myself for mistakes I made in the past. The guilt and shame follow me everywhere.",
                "feeling_template": "Myself — trapped by my own past",
                "shad_ripu": "moha",
                "primary_path": "atma_kshama",
                "secondary_path": "tyaga",
                "gita_ref": "BG 18.66",
                "healing_insight": "The Gita's ultimate teaching of surrender: 'Abandon all dharmas and take refuge in Me alone. I shall liberate you from all sins; do not grieve.' Release the past — you are not your mistakes.",
            },
            {
                "id": "fear_of_failure",
                "label": "Fear of failure paralyzes me",
                "situation_template": "I'm so afraid of failing that I can't take action. The fear keeps me stuck and unable to move forward in life.",
                "feeling_template": "My potential and growth",
                "shad_ripu": "moha",
                "primary_path": "tapas",
                "secondary_path": "shraddha",
                "gita_ref": "BG 2.47",
                "healing_insight": "Tapas (committed transformation) builds inner strength. The Gita teaches: your right is to action alone, never to the fruits. When you detach from outcomes, fear of failure dissolves.",
            },
            {
                "id": "lost_identity",
                "label": "I've lost my sense of who I am",
                "situation_template": "After major life changes, I feel like I've lost my identity. I don't know who I am anymore or what I stand for.",
                "feeling_template": "My sense of self",
                "shad_ripu": "moha",
                "primary_path": "satya",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 2.20",
                "healing_insight": "Satya (truth) reveals the eternal Self. The Gita teaches: the atman is never born and never dies. Your true identity is beyond roles and labels — it is the unchanging awareness within.",
            },
        ],
    },
    "family_tensions": {
        "name": "Family & Parent Issues",
        "sanskrit_name": "Kutumba Kashta",
        "sanskrit_label": "कुटुम्ब कष्ट",
        "icon": "home",
        "description": "Parent-child conflicts, family expectations, generational wounds",
        "color": "from-orange-500/20 to-amber-600/20",
        "problems": [
            {
                "id": "disappointed_parents",
                "label": "I've disappointed my parents",
                "situation_template": "My life choices have disappointed my parents. They expected something different from me, and our relationship is strained.",
                "feeling_template": "My parents who love me",
                "shad_ripu": "moha",
                "primary_path": "satya",
                "secondary_path": "kshama",
                "gita_ref": "BG 17.15",
                "healing_insight": "Satya (truth) means speaking what is true, beneficial, and not agitating. Honor your parents while honoring your own dharma — the Gita teaches that one must follow one's own nature.",
            },
            {
                "id": "family_expectations",
                "label": "Family expectations are crushing me",
                "situation_template": "The weight of family expectations — career, marriage, lifestyle — is crushing my spirit and preventing me from living authentically.",
                "feeling_template": "Myself and my authentic expression",
                "shad_ripu": "moha",
                "primary_path": "tyaga",
                "secondary_path": "tapas",
                "gita_ref": "BG 3.35",
                "healing_insight": "The Gita teaches: 'Better is one's own dharma, though imperfect, than the dharma of another well performed.' Release expectations that are not your own — walk your authentic path with courage.",
            },
            {
                "id": "sibling_rivalry",
                "label": "Conflict with my sibling(s)",
                "situation_template": "There's ongoing conflict and rivalry with my sibling(s). Jealousy, resentment, or unresolved childhood wounds are creating distance.",
                "feeling_template": "My sibling(s) and family unity",
                "shad_ripu": "matsarya",
                "primary_path": "daya",
                "secondary_path": "kshama",
                "gita_ref": "BG 6.29",
                "healing_insight": "Daya (compassion) bridges the gap. The Gita teaches that one who sees the Self in all beings and all beings in the Self — never turns away from love. See the shared atman in your sibling.",
            },
            {
                "id": "absent_parent",
                "label": "Healing from an absent or toxic parent",
                "situation_template": "I'm carrying deep wounds from a parent who was absent, neglectful, or toxic. The pain affects my relationships and self-worth.",
                "feeling_template": "My inner child and current relationships",
                "shad_ripu": "krodha",
                "primary_path": "atma_kshama",
                "secondary_path": "ahimsa",
                "gita_ref": "BG 6.5",
                "healing_insight": "Atma Kshama (self-forgiveness) extends to forgiving the child within who deserved better. The Gita teaches: lift yourself by yourself. Your healing is your own sacred journey.",
            },
            {
                "id": "aging_parents",
                "label": "Struggling with aging parents' care",
                "situation_template": "The responsibility of caring for aging parents while managing my own life is overwhelming. I feel guilty for not doing enough.",
                "feeling_template": "My parents and my own wellbeing",
                "shad_ripu": "moha",
                "primary_path": "seva",
                "secondary_path": "shanti",
                "gita_ref": "BG 3.19",
                "healing_insight": "Seva (selfless service) is the highest form of love. The Gita teaches that performing duty without attachment purifies the heart. Your care is sacred karma — honor it without guilt.",
            },
        ],
    },
    "anxiety_health": {
        "name": "Anxiety & Mental Health",
        "sanskrit_name": "Chinta Roga",
        "sanskrit_label": "चिन्ता रोग",
        "icon": "brain",
        "description": "Anxiety, depression, overthinking, sleep issues, burnout",
        "color": "from-violet-500/20 to-purple-600/20",
        "problems": [
            {
                "id": "constant_anxiety",
                "label": "Constant anxiety won't let me breathe",
                "situation_template": "I live with constant anxiety — racing thoughts, restlessness, and a feeling of impending doom that won't let me find peace.",
                "feeling_template": "My mind, body, and daily life",
                "shad_ripu": "moha",
                "primary_path": "shanti",
                "secondary_path": "tyaga",
                "gita_ref": "BG 2.66",
                "healing_insight": "Shanti (peace) is the Gita's antidote to anxiety. 'For one who has no peace, how can there be happiness?' Equanimity (samatva) is the foundation — practice witnessing your thoughts without becoming them.",
            },
            {
                "id": "burnout",
                "label": "I'm completely burned out",
                "situation_template": "I've pushed myself so hard that I'm completely depleted — physically, emotionally, and spiritually. I have nothing left to give.",
                "feeling_template": "My whole being — body, mind, spirit",
                "shad_ripu": "lobha",
                "primary_path": "tyaga",
                "secondary_path": "seva",
                "gita_ref": "BG 6.16",
                "healing_insight": "The Gita teaches balance: 'Yoga is not for one who eats too much or too little, or sleeps too much or too little.' Tyaga means releasing the compulsion to do more. Rest is sacred too.",
            },
            {
                "id": "overthinking",
                "label": "I can't stop overthinking everything",
                "situation_template": "My mind is trapped in endless loops of overthinking. Every decision, every conversation, every situation gets analyzed to exhaustion.",
                "feeling_template": "My mental peace and decision-making",
                "shad_ripu": "moha",
                "primary_path": "shanti",
                "secondary_path": "tapas",
                "gita_ref": "BG 6.35",
                "healing_insight": "The Gita acknowledges the restless mind: 'The mind is indeed restless, O Arjuna. But it can be restrained by practice (abhyasa) and detachment (vairagya).' This is your path to stillness.",
            },
            {
                "id": "depression_darkness",
                "label": "I'm in a dark place emotionally",
                "situation_template": "I feel stuck in darkness — a heaviness that makes it hard to see meaning or purpose. Getting through each day feels like a battle.",
                "feeling_template": "My will to live and find joy",
                "shad_ripu": "moha",
                "primary_path": "daya",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 2.14",
                "healing_insight": "Daya (compassion) begins with self. The Gita teaches: 'Pleasures and pains are transient — they come and go. Bear them patiently.' You are the eternal light temporarily obscured by clouds. The light never dies.",
            },
            {
                "id": "addiction_struggle",
                "label": "Struggling with addiction or compulsive habits",
                "situation_template": "I'm trapped in addictive patterns or compulsive behaviors that I know are harmful, but I can't seem to break free.",
                "feeling_template": "My health, relationships, and self-respect",
                "shad_ripu": "kama",
                "primary_path": "tapas",
                "secondary_path": "shraddha",
                "gita_ref": "BG 3.43",
                "healing_insight": "Tapas (committed transformation) is the Gita's answer to kama (desire). 'Knowing the Self to be superior to the intellect, steady the mind by the Self and conquer the formidable enemy of desire.'",
            },
        ],
    },
    "loss_grief": {
        "name": "Loss & Grief",
        "sanskrit_name": "Shoka Vishada",
        "sanskrit_label": "शोक विषाद",
        "icon": "rain",
        "description": "Death, separation, end of relationships, loss of purpose",
        "color": "from-slate-500/20 to-gray-600/20",
        "problems": [
            {
                "id": "lost_loved_one",
                "label": "I lost someone I love",
                "situation_template": "Someone I loved deeply has passed away or left my life permanently. The grief feels unbearable and all-consuming.",
                "feeling_template": "My heart and everyone who loved them",
                "shad_ripu": "moha",
                "primary_path": "daya",
                "secondary_path": "tyaga",
                "gita_ref": "BG 2.20",
                "healing_insight": "The Gita's most profound comfort: 'The atman is never born and never dies. It has no origin and no end. It is unborn, eternal, ever-existing, and primeval.' Love transcends the physical form.",
            },
            {
                "id": "breakup_divorce",
                "label": "Going through a breakup or divorce",
                "situation_template": "My relationship has ended. The person I built a life with is no longer in my life, and I feel shattered and lost.",
                "feeling_template": "Both of us and everyone connected to our relationship",
                "shad_ripu": "moha",
                "primary_path": "tyaga",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 18.66",
                "healing_insight": "Tyaga (letting go) is the sacred act of releasing what no longer serves your growth. The Gita's teaching of surrender: release attachment while keeping love. Love is eternal; forms are temporary.",
            },
            {
                "id": "lost_friendship",
                "label": "A meaningful friendship ended",
                "situation_template": "A friendship that meant the world to me has ended or faded. I feel the absence deeply and question what went wrong.",
                "feeling_template": "Both of us who once shared a deep bond",
                "shad_ripu": "moha",
                "primary_path": "kshama",
                "secondary_path": "daya",
                "gita_ref": "BG 16.3",
                "healing_insight": "Kshama (forgiveness) heals both the forgiver and the forgiven. The Gita teaches that forgiveness is a divine quality. Release the friend with love and gratitude for what you shared.",
            },
            {
                "id": "lost_purpose",
                "label": "I've lost my sense of purpose",
                "situation_template": "I feel purposeless — like my life has no direction or meaning anymore. The passion and drive I once had seem to have disappeared.",
                "feeling_template": "My spirit and will to thrive",
                "shad_ripu": "moha",
                "primary_path": "satya",
                "secondary_path": "tapas",
                "gita_ref": "BG 3.35",
                "healing_insight": "Satya (truth) helps you find your swadharma — your unique purpose. The Gita teaches: 'Better is one's own dharma, though imperfect.' Your purpose is not lost — it awaits rediscovery through truth.",
            },
            {
                "id": "financial_loss",
                "label": "Severe financial loss or setback",
                "situation_template": "I've experienced a devastating financial loss — savings depleted, investments lost, or business collapsed. The security I worked for is gone.",
                "feeling_template": "My family's security and my self-worth",
                "shad_ripu": "lobha",
                "primary_path": "tyaga",
                "secondary_path": "shraddha",
                "gita_ref": "BG 2.47",
                "healing_insight": "Tyaga (letting go) releases attachment to material outcomes. The Gita teaches: 'Your right is to action alone, never to its fruits.' Wealth comes and goes; your true richness is the atman within.",
            },
        ],
    },
    "betrayal_injustice": {
        "name": "Betrayal & Injustice",
        "sanskrit_name": "Vishvasaghata",
        "sanskrit_label": "विश्वासघात",
        "icon": "shield_broken",
        "description": "Being betrayed, cheated, wronged, or facing injustice",
        "color": "from-red-500/20 to-rose-600/20",
        "problems": [
            {
                "id": "cheated_by_partner",
                "label": "My partner cheated on me",
                "situation_template": "The person I loved and trusted has been unfaithful. The betrayal has shattered my trust and sense of self.",
                "feeling_template": "My trust, self-worth, and capacity to love",
                "shad_ripu": "krodha",
                "primary_path": "ahimsa",
                "secondary_path": "atma_kshama",
                "gita_ref": "BG 2.56",
                "healing_insight": "Ahimsa (non-harm) means not harming yourself through prolonged bitterness. The Gita's teaching on the sthitaprajna (one of steady wisdom): 'One whose mind is undisturbed by suffering, without desire for pleasure, free from attachment, fear, and anger — they are called a sage of steady wisdom.'",
            },
            {
                "id": "falsely_accused",
                "label": "I was falsely accused or blamed",
                "situation_template": "I've been wrongly accused or blamed for something I didn't do. The injustice burns, and I feel powerless to prove my truth.",
                "feeling_template": "My reputation and sense of justice",
                "shad_ripu": "krodha",
                "primary_path": "satya",
                "secondary_path": "shanti",
                "gita_ref": "BG 17.15",
                "healing_insight": "Satya (truth) prevails in the end. The Gita teaches that truth-based speech is gentle and beneficial. Stand in your truth without aggression — dharma protects those who protect dharma.",
            },
            {
                "id": "taken_advantage_of",
                "label": "Someone took advantage of my kindness",
                "situation_template": "Someone I helped and trusted exploited my kindness and generosity for their own gain. I feel used and foolish.",
                "feeling_template": "My trust in others and willingness to help",
                "shad_ripu": "krodha",
                "primary_path": "daya",
                "secondary_path": "kshama",
                "gita_ref": "BG 6.29",
                "healing_insight": "Daya (compassion) does not mean being naive — it means seeing clearly while still choosing love. The Gita teaches discernment (viveka). Your kindness was dharmic; their exploitation was theirs to resolve.",
            },
            {
                "id": "systemic_injustice",
                "label": "Facing discrimination or systemic injustice",
                "situation_template": "I'm facing discrimination, bias, or systemic injustice that makes me feel powerless and unseen. The world seems fundamentally unfair.",
                "feeling_template": "My dignity and those who face similar struggles",
                "shad_ripu": "krodha",
                "primary_path": "tapas",
                "secondary_path": "seva",
                "gita_ref": "BG 4.7-8",
                "healing_insight": "Tapas (committed transformation) channels righteous anger into sacred action. The Gita teaches that whenever dharma declines, divine energy manifests to restore balance. Be that force of restoration.",
            },
        ],
    },
    "spiritual_crisis": {
        "name": "Spiritual & Existential Crisis",
        "sanskrit_name": "Adhyatmika Sankata",
        "sanskrit_label": "आध्यात्मिक संकट",
        "icon": "compass",
        "description": "Questioning faith, existential dread, feeling disconnected from the divine",
        "color": "from-indigo-500/20 to-violet-600/20",
        "problems": [
            {
                "id": "lost_faith",
                "label": "I've lost faith in everything",
                "situation_template": "I've lost faith — in God, in the universe, in goodness, in myself. Nothing seems to make sense anymore and I feel spiritually empty.",
                "feeling_template": "My spirit and connection to meaning",
                "shad_ripu": "moha",
                "primary_path": "shraddha",
                "secondary_path": "satya",
                "gita_ref": "BG 17.3",
                "healing_insight": "Shraddha (faith) is the Gita's foundation. 'A person is made of their faith. What they believe, they become.' Even questioning faith is a form of seeking — the seeker is never truly lost.",
            },
            {
                "id": "why_suffering",
                "label": "Why is there so much suffering?",
                "situation_template": "I'm overwhelmed by the suffering in the world and in my own life. I can't understand why good people suffer and evil seems to prosper.",
                "feeling_template": "My belief in justice and divine order",
                "shad_ripu": "moha",
                "primary_path": "daya",
                "secondary_path": "shanti",
                "gita_ref": "BG 2.14",
                "healing_insight": "The Gita addresses suffering directly: 'Contacts with sense objects give rise to cold/heat, pleasure/pain — they are transient. Bear them patiently.' Suffering has karmic roots and sacred purpose — it is the fire that purifies.",
            },
            {
                "id": "feeling_disconnected",
                "label": "I feel completely disconnected from life",
                "situation_template": "I feel numb and disconnected from everything — from people, from nature, from myself. Like I'm watching life through a glass wall.",
                "feeling_template": "My ability to feel and connect",
                "shad_ripu": "moha",
                "primary_path": "seva",
                "secondary_path": "daya",
                "gita_ref": "BG 6.29",
                "healing_insight": "Seva (selfless service) reconnects you to life. The Gita teaches that one who sees the Self in all beings breaks through the isolation of ego. Service to others is the bridge back to feeling alive.",
            },
            {
                "id": "fear_of_death",
                "label": "I'm afraid of death and impermanence",
                "situation_template": "The fear of death — my own or of those I love — haunts me. The impermanence of everything fills me with existential dread.",
                "feeling_template": "My peace and ability to live fully",
                "shad_ripu": "moha",
                "primary_path": "satya",
                "secondary_path": "tyaga",
                "gita_ref": "BG 2.20",
                "healing_insight": "The Gita's ultimate truth about death: 'The atman is never born and never dies. Having come into existence, it never ceases to be. Unborn, eternal, permanent, and primeval — it is not killed when the body is killed.'",
            },
        ],
    },
}


# ============================================================================
# KEYWORD-TO-PROBLEM MAPPING for intelligent text analysis
# ============================================================================
# Maps keywords found in user's situation description to problem categories
# and specific karmic paths. Used for auto-detection.

PROBLEM_KEYWORDS: dict[str, dict[str, Any]] = {
    # Relationship keywords
    "partner": {"category": "relationship_conflict", "path": "kshama", "weight": 0.8},
    "spouse": {"category": "relationship_conflict", "path": "kshama", "weight": 0.8},
    "husband": {"category": "relationship_conflict", "path": "kshama", "weight": 0.8},
    "wife": {"category": "relationship_conflict", "path": "kshama", "weight": 0.8},
    "boyfriend": {"category": "relationship_conflict", "path": "kshama", "weight": 0.7},
    "girlfriend": {"category": "relationship_conflict", "path": "kshama", "weight": 0.7},
    "argument": {"category": "relationship_conflict", "path": "shanti", "weight": 0.7},
    "fight": {"category": "relationship_conflict", "path": "shanti", "weight": 0.6},
    "breakup": {"category": "loss_grief", "path": "tyaga", "weight": 0.9},
    "divorce": {"category": "loss_grief", "path": "tyaga", "weight": 0.9},
    "cheated": {"category": "betrayal_injustice", "path": "ahimsa", "weight": 0.9},
    "unfaithful": {"category": "betrayal_injustice", "path": "ahimsa", "weight": 0.9},
    "jealous": {"category": "relationship_conflict", "path": "tyaga", "weight": 0.8},

    # Work keywords
    "work": {"category": "work_career", "path": "shanti", "weight": 0.5},
    "job": {"category": "work_career", "path": "shanti", "weight": 0.5},
    "boss": {"category": "work_career", "path": "shanti", "weight": 0.6},
    "career": {"category": "work_career", "path": "tapas", "weight": 0.6},
    "promotion": {"category": "work_career", "path": "shanti", "weight": 0.7},
    "fired": {"category": "work_career", "path": "tyaga", "weight": 0.8},
    "colleagues": {"category": "work_career", "path": "shanti", "weight": 0.5},
    "burnout": {"category": "anxiety_health", "path": "tyaga", "weight": 0.9},
    "project": {"category": "work_career", "path": "tapas", "weight": 0.5},
    "business": {"category": "work_career", "path": "tapas", "weight": 0.5},

    # Family keywords
    "parent": {"category": "family_tensions", "path": "satya", "weight": 0.7},
    "mother": {"category": "family_tensions", "path": "seva", "weight": 0.7},
    "father": {"category": "family_tensions", "path": "satya", "weight": 0.7},
    "sibling": {"category": "family_tensions", "path": "daya", "weight": 0.7},
    "brother": {"category": "family_tensions", "path": "daya", "weight": 0.6},
    "sister": {"category": "family_tensions", "path": "daya", "weight": 0.6},
    "family": {"category": "family_tensions", "path": "seva", "weight": 0.5},
    "expectations": {"category": "family_tensions", "path": "tyaga", "weight": 0.6},

    # Mental health keywords
    "anxiety": {"category": "anxiety_health", "path": "shanti", "weight": 0.9},
    "anxious": {"category": "anxiety_health", "path": "shanti", "weight": 0.8},
    "depressed": {"category": "anxiety_health", "path": "daya", "weight": 0.9},
    "depression": {"category": "anxiety_health", "path": "daya", "weight": 0.9},
    "overwhelm": {"category": "anxiety_health", "path": "shanti", "weight": 0.8},
    "stressed": {"category": "anxiety_health", "path": "shanti", "weight": 0.7},
    "overthink": {"category": "anxiety_health", "path": "shanti", "weight": 0.8},
    "sleep": {"category": "anxiety_health", "path": "shanti", "weight": 0.6},
    "insomnia": {"category": "anxiety_health", "path": "shanti", "weight": 0.7},
    "panic": {"category": "anxiety_health", "path": "shanti", "weight": 0.9},
    "addiction": {"category": "anxiety_health", "path": "tapas", "weight": 0.9},

    # Loss/grief keywords
    "died": {"category": "loss_grief", "path": "daya", "weight": 0.95},
    "death": {"category": "loss_grief", "path": "daya", "weight": 0.9},
    "lost": {"category": "loss_grief", "path": "daya", "weight": 0.5},
    "grief": {"category": "loss_grief", "path": "daya", "weight": 0.9},
    "mourning": {"category": "loss_grief", "path": "daya", "weight": 0.9},
    "gone": {"category": "loss_grief", "path": "tyaga", "weight": 0.4},
    "passed away": {"category": "loss_grief", "path": "daya", "weight": 0.95},
    "funeral": {"category": "loss_grief", "path": "daya", "weight": 0.9},

    # Betrayal/injustice keywords
    "betrayed": {"category": "betrayal_injustice", "path": "ahimsa", "weight": 0.9},
    "lied": {"category": "betrayal_injustice", "path": "satya", "weight": 0.8},
    "stolen": {"category": "betrayal_injustice", "path": "kshama", "weight": 0.7},
    "unfair": {"category": "betrayal_injustice", "path": "shanti", "weight": 0.7},
    "injustice": {"category": "betrayal_injustice", "path": "tapas", "weight": 0.8},
    "discriminat": {"category": "betrayal_injustice", "path": "tapas", "weight": 0.8},
    "blamed": {"category": "betrayal_injustice", "path": "satya", "weight": 0.8},
    "accused": {"category": "betrayal_injustice", "path": "satya", "weight": 0.8},

    # Self-worth keywords
    "not good enough": {"category": "self_worth", "path": "atma_kshama", "weight": 0.9},
    "imposter": {"category": "self_worth", "path": "atma_kshama", "weight": 0.9},
    "worthless": {"category": "self_worth", "path": "atma_kshama", "weight": 0.9},
    "failure": {"category": "self_worth", "path": "tapas", "weight": 0.7},
    "shame": {"category": "self_worth", "path": "atma_kshama", "weight": 0.8},
    "guilt": {"category": "self_worth", "path": "atma_kshama", "weight": 0.8},
    "comparing": {"category": "self_worth", "path": "daya", "weight": 0.7},
    "confident": {"category": "self_worth", "path": "tapas", "weight": 0.5},

    # Spiritual keywords
    "faith": {"category": "spiritual_crisis", "path": "shraddha", "weight": 0.7},
    "god": {"category": "spiritual_crisis", "path": "shraddha", "weight": 0.5},
    "meaning": {"category": "spiritual_crisis", "path": "satya", "weight": 0.5},
    "purpose": {"category": "spiritual_crisis", "path": "satya", "weight": 0.6},
    "disconnected": {"category": "spiritual_crisis", "path": "seva", "weight": 0.6},
    "empty": {"category": "spiritual_crisis", "path": "shraddha", "weight": 0.5},
    "numb": {"category": "spiritual_crisis", "path": "seva", "weight": 0.7},
    "suffering": {"category": "spiritual_crisis", "path": "daya", "weight": 0.6},

    # Anger/emotion keywords
    "angry": {"category": "relationship_conflict", "path": "shanti", "weight": 0.7},
    "rage": {"category": "relationship_conflict", "path": "ahimsa", "weight": 0.8},
    "resentment": {"category": "relationship_conflict", "path": "kshama", "weight": 0.8},
    "hurt": {"category": "relationship_conflict", "path": "kshama", "weight": 0.6},
    "forgive": {"category": "relationship_conflict", "path": "kshama", "weight": 0.8},
    "sorry": {"category": "relationship_conflict", "path": "kshama", "weight": 0.6},
    "regret": {"category": "self_worth", "path": "atma_kshama", "weight": 0.7},
    "mistake": {"category": "self_worth", "path": "atma_kshama", "weight": 0.6},
}


class KarmaProblemResolver:
    """
    Intelligent resolver that maps real-life problems to karmic paths.

    Analyzes user's situation description, identifies the problem category,
    and recommends the most appropriate karmic path for transformation
    through the Karma Reset system.
    """

    def get_problem_categories(self) -> list[dict[str, Any]]:
        """
        Get all problem categories with their display data.

        Returns:
            List of category summaries for frontend display
        """
        categories = []
        for key, cat in LIFE_PROBLEM_CATEGORIES.items():
            categories.append({
                "key": key,
                "name": cat["name"],
                "sanskrit_name": cat["sanskrit_name"],
                "sanskrit_label": cat["sanskrit_label"],
                "icon": cat["icon"],
                "description": cat["description"],
                "color": cat["color"],
                "problem_count": len(cat["problems"]),
            })
        return categories

    def get_problems_for_category(self, category_key: str) -> list[dict[str, Any]]:
        """
        Get all problems for a specific category.

        Args:
            category_key: Category identifier (e.g., 'relationship_conflict')

        Returns:
            List of problem templates with karmic path recommendations
        """
        category = LIFE_PROBLEM_CATEGORIES.get(category_key, {})
        return category.get("problems", [])

    def get_all_problems_flat(self) -> list[dict[str, Any]]:
        """
        Get all problems across all categories in a flat list.

        Returns:
            Flat list of all problem templates with category info
        """
        problems = []
        for cat_key, cat in LIFE_PROBLEM_CATEGORIES.items():
            for problem in cat["problems"]:
                problems.append({
                    **problem,
                    "category_key": cat_key,
                    "category_name": cat["name"],
                    "category_icon": cat["icon"],
                })
        return problems

    def analyze_situation(self, situation_text: str) -> dict[str, Any]:
        """
        Analyze a user's situation description and recommend the best karmic path.

        Uses keyword matching with weighted scoring to identify:
        1. The most likely problem category
        2. The recommended primary karmic path
        3. A secondary (alternative) karmic path
        4. Matching confidence score
        5. Relevant Gita reference

        Args:
            situation_text: User's description of their problem/situation

        Returns:
            Analysis result with recommended path and confidence
        """
        if not situation_text or len(situation_text.strip()) < 5:
            return self._default_analysis()

        text_lower = situation_text.lower()

        # Score each category and path
        category_scores: dict[str, float] = {}
        path_scores: dict[str, float] = {}
        matched_keywords: list[str] = []

        for keyword, mapping in PROBLEM_KEYWORDS.items():
            if keyword in text_lower:
                cat = mapping["category"]
                path = mapping["path"]
                weight = mapping["weight"]

                category_scores[cat] = category_scores.get(cat, 0) + weight
                path_scores[path] = path_scores.get(path, 0) + weight
                matched_keywords.append(keyword)

        if not category_scores:
            return self._default_analysis()

        # Find best category
        best_category = max(category_scores, key=category_scores.get)  # type: ignore[arg-type]
        category_data = LIFE_PROBLEM_CATEGORIES[best_category]

        # Find best path
        best_path = max(path_scores, key=path_scores.get)  # type: ignore[arg-type]
        path_data = KARMIC_PATHS.get(best_path, KARMIC_PATHS["kshama"])

        # Find secondary path
        sorted_paths = sorted(path_scores.items(), key=lambda x: x[1], reverse=True)
        secondary_path = sorted_paths[1][0] if len(sorted_paths) > 1 else "kshama"

        # Calculate confidence (0.0 to 1.0)
        max_score = max(category_scores.values())
        confidence = min(max_score / 3.0, 1.0)

        # Find the best matching problem template in the category
        best_problem = self._find_best_matching_problem(
            text_lower, category_data["problems"]
        )

        # Get healing insight
        healing_insight = ""
        gita_ref = ""
        if best_problem:
            healing_insight = best_problem.get("healing_insight", "")
            gita_ref = best_problem.get("gita_ref", "")

        logger.info(
            f"Problem analysis: category={best_category}, "
            f"path={best_path}, confidence={confidence:.2f}, "
            f"keywords={len(matched_keywords)}"
        )

        return {
            "recommended_category": best_category,
            "category_name": category_data["name"],
            "category_sanskrit": category_data["sanskrit_label"],
            "recommended_path": best_path,
            "path_name": path_data.get("name", ""),
            "path_sanskrit": path_data.get("sanskrit_name", ""),
            "secondary_path": secondary_path,
            "confidence": round(confidence, 2),
            "matched_keywords": matched_keywords[:10],
            "healing_insight": healing_insight,
            "gita_ref": gita_ref,
            "matched_problem": best_problem,
            "shad_ripu": best_problem.get("shad_ripu", "moha") if best_problem else "moha",
        }

    def _find_best_matching_problem(
        self,
        text_lower: str,
        problems: list[dict[str, Any]]
    ) -> dict[str, Any] | None:
        """
        Find the best matching problem template from a category.

        Scores each problem by how many of its label words appear
        in the user's situation text.
        """
        best_score = 0
        best_problem = None

        for problem in problems:
            label_words = problem["label"].lower().split()
            score = sum(1 for word in label_words if word in text_lower)
            if score > best_score:
                best_score = score
                best_problem = problem

        return best_problem

    def get_problem_by_id(self, problem_id: str) -> dict[str, Any] | None:
        """
        Get a specific problem template by its unique ID.

        Args:
            problem_id: Problem identifier (e.g., 'hurt_partner')

        Returns:
            Problem data with karmic path recommendation, or None
        """
        for cat_key, cat in LIFE_PROBLEM_CATEGORIES.items():
            for problem in cat["problems"]:
                if problem["id"] == problem_id:
                    return {
                        **problem,
                        "category_key": cat_key,
                        "category_name": cat["name"],
                    }
        return None

    def _default_analysis(self) -> dict[str, Any]:
        """Return default analysis when text is insufficient for analysis."""
        return {
            "recommended_category": "self_worth",
            "category_name": "Self-Worth & Identity",
            "category_sanskrit": "आत्म गौरव",
            "recommended_path": "kshama",
            "path_name": "Kshama - The Path of Forgiveness",
            "path_sanskrit": "क्षमा मार्ग",
            "secondary_path": "daya",
            "confidence": 0.0,
            "matched_keywords": [],
            "healing_insight": "Every situation carries the seed of transformation. The Gita teaches that through awareness and right action, all karma can be resolved.",
            "gita_ref": "BG 4.17",
            "matched_problem": None,
            "shad_ripu": "moha",
        }

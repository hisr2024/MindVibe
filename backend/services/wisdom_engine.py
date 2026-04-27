"""Wisdom Engine - Intelligent response generation using Bhagavad Gita philosophy

This module generates responses strictly based on Bhagavad Gita principles.
All responses follow the mandatory structure:
- Ancient Wisdom Principle (from Gita)
- Modern Application
- Practical Steps (Gita-based)
- Deeper Understanding (Gita philosophy)
"""



def validate_gita_response(response: str) -> bool:
    """Validate that response follows Gita-based structure.

    Checks for:
    - Reference to Gita principles
    - Structured format with required sections
    - No generic advice without Gita foundation

    Returns:
        bool: True if response is valid Gita-based response
    """
    required_markers = [
        "**Ancient Wisdom Principle:**",
        "**Modern Application:**",
        "**Practical Steps:**",
        "**Deeper Understanding:**"
    ]

    # Check all required sections are present
    if not all(marker in response for marker in required_markers):
        return False

    # Check for Gita references (should mention Gita, Bhagavad, or specific concepts)
    gita_indicators = [
        "Gita", "Bhagavad", "Karma Yoga", "Dharma", "Atman",
        "Samatvam", "Abhyasa", "Vairagya", "Nishkama", "Krishna",
        "Chapter", "Verse"
    ]

    if not any(indicator in response for indicator in gita_indicators):
        return False

    return True


class WisdomEngine:
    """Generate intelligent responses using Bhagavad Gita principles"""

    def __init__(self):
        """Initialize wisdom mappings based on Bhagavad Gita principles"""
        self.wisdom_principles = {
            "duty": "Bhagavad Gita teaches Svadharma - focus on your own duties without worrying about results (Karma Yoga)",
            "detachment": "Gita teaches Vairagya - do your best with detachment from outcomes (Nishkama Karma)",
            "balance": "Gita teaches Samatvam - equanimity between action and acceptance, success and failure",
            "self_knowledge": "Gita teaches Atma-Jnana - understanding your true Self (Atman) is the path to peace",
            "action": "Gita teaches right action (Dharma) with right intention (Bhavana) brings inner peace",
            "acceptance": "Gita teaches to accept what you cannot control with equanimity (Samatvam) and endurance (Titiksha)",
            "growth": "Gita teaches every challenge is opportunity for spiritual growth (Sadhana) and self-realization",
            "purpose": "Gita teaches living with purpose through Svadharma - performing your unique duty",
            "discipline": "Gita teaches Abhyasa (disciplined practice) creates inner strength and steadiness (Sthita-prajna)",
            "compassion": "Gita teaches Daya (compassion) to yourself and others as expression of seeing the Self in all",
        }

        self.coping_strategies = {
            "breathing": "Practice Pranayama (breath control) as taught in Gita Chapter 4: breathe with awareness",
            "grounding": "Practice Sthiti (steadiness) - ground yourself in the present moment as the witness (Sakshi)",
            "movement": "Gita teaches Karma Yoga - transform physical action into spiritual practice through awareness",
            "mindfulness": "Practice Sakshi Bhava - observe thoughts without judgment as the eternal witness",
            "journaling": "Practice Svadhyaya (self-study) - reflect on Gita teachings and your experiences",
            "connection": "Gita teaches we are all manifestations of the same Self - connect with this understanding",
            "rest": "Honor your body-mind complex (Kshetra) with proper rest as taught in Gita, while knowing you are the eternal Self (Atman)",
            "nature": "Gita teaches seeing the Divine in all of nature - spend time in natural contemplation",
            "creativity": "Express the Self through creativity, offering it as Karma Yoga (selfless action)",
            "meditation": "Practice Dhyana (meditation) as taught extensively in Gita Chapter 6 - sit in stillness",
        }

        self.wisdom_themes = {
            "anxiety": {
                "principle": "detachment",
                "message": "The Gita teaches you are not your worries. Practice Vairagya (detachment) and focus on what you can control (Karma Yoga).",
                "strategies": ["breathing", "grounding", "mindfulness"],
            },
            "depression": {
                "principle": "action",
                "message": "The Gita teaches that even small right actions (Dharma) create momentum. Start with one step in your Svadharma (duty).",
                "strategies": ["movement", "connection", "nature"],
            },
            "loneliness": {
                "principle": "compassion",
                "message": "The Gita reveals the same Self (Atman) dwells in all. Connection begins with seeing this unity and practicing Daya (compassion).",
                "strategies": ["connection", "creativity", "journaling"],
            },
            "self_doubt": {
                "principle": "self_knowledge",
                "message": "The Gita teaches your true worth is the eternal Atman, not performance. You are inherently valuable as the Self.",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "stress": {
                "principle": "balance",
                "message": "The Gita teaches Samatvam - balance action with rest. You don't have to do everything at once.",
                "strategies": ["breathing", "rest", "nature"],
            },
            "overwhelm": {
                "principle": "duty",
                "message": "The Gita teaches to focus on your immediate Svadharma (duty). One thing at a time, with full presence.",
                "strategies": ["grounding", "movement", "breathing"],
            },
            "conflict": {
                "principle": "compassion",
                "message": "The Gita teaches everyone is fighting their inner battle. Approach with Daya (compassion) and see the Self in all.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "failure": {
                "principle": "growth",
                "message": "The Gita teaches failure is feedback for spiritual growth (Sadhana), not identity. What is the lesson (Viveka)?",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "purpose": {
                "principle": "purpose",
                "message": "The Gita teaches purpose comes from Svadharma - alignment between your unique nature and actions.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "uncertainty": {
                "principle": "acceptance",
                "message": "The Gita teaches certainty isn't possible in the changing world. Trust in your ability to adapt through Yukti (wisdom).",
                "strategies": ["meditation", "breathing", "grounding"],
            },
        }

    def analyze_concern(self, user_message: str) -> str:
        """Detect user's primary concern"""
        message_lower = user_message.lower()

        # Crisis detection (highest priority)
        crisis_keywords = [
            "suicide", "kill myself", "end it", "harm myself",
            "cut myself", "overdose", "better off dead", "no reason to live"
        ]
        if any(keyword in message_lower for keyword in crisis_keywords):
            return "crisis"

        # Map concerns to themes
        concern_map = {
            "anxiety": ["anxious", "anxiety", "worried", "nervous", "panic", "afraid", "scared"],
            "depression": ["depressed", "depression", "sad", "hopeless", "empty", "nothing matters", "tired", "exhausted"],
            "loneliness": ["alone", "lonely", "isolated", "nobody understands", "disconnected"],
            "self_doubt": ["not good enough", "failure", "worthless", "shame", "useless", "stupid", "ugly", "loser"],
            "stress": ["stressed", "pressure", "overwhelmed", "tense", "anxious", "tight"],
            "overwhelm": ["overwhelmed", "too much", "can't handle", "drowning", "too many"],
            "conflict": ["argument", "fighting", "conflict", "angry", "frustrated", "betrayed"],
            "failure": ["failed", "failure", "didn't work", "couldn't do it", "messed up"],
            "purpose": ["purpose", "meaning", "direction", "lost", "what's the point"],
            "uncertainty": ["uncertain", "unsure", "don't know", "confused", "lost"],
        }

        for concern, keywords in concern_map.items():
            if any(keyword in message_lower for keyword in keywords):
                return concern

        return "general"

    def get_crisis_response(self) -> str:
        """Generate crisis response"""
        return """🆘 YOUR SAFETY IS MY PRIORITY

I can see you're in significant pain right now. Professional help is available immediately:

**CALL NOW:**
🚨 National Suicide Prevention Lifeline: 988 (US)
🚨 Crisis Text Line: Text HOME to 741741
🚨 International Crisis Lines: findahelpline.com

**YOU ARE NOT ALONE:**
• Millions experience these feelings
• Help works. People recover.
• Your pain is temporary. Professional support can help.

**RIGHT NOW:**
1. Call 988 or text 741741
2. Tell someone you trust immediately
3. Go to nearest emergency room if in immediate danger

Your life has value. Please reach out for professional support right now. 💙"""

    def generate_response(
        self,
        user_message: str,
        *,
        render_mode: str = "text",
    ) -> str:
        """Generate intelligent, personalized response based on Bhagavad Gita principles.

        Args:
            user_message: The user's message.
            render_mode: "text" (default, full 4-Part structure) or "voice"
                (conversational arc — same wisdom, different delivery shape).
                Voice mode produces a 30–45s spoken response: Sanskrit verbatim,
                medium pause, English/Hindi translation, single conversational
                sentence connecting verse to feeling, ONE practical suggestion
                (not three), optional breath cue or soft question. No section
                labels, no sign-off.

        All text-mode responses follow the mandatory structure:
        - Ancient Wisdom Principle (from Gita)
        - Modern Application
        - Practical Steps (Gita-based)
        - Deeper Understanding (Gita philosophy)
        """
        if render_mode not in ("text", "voice"):
            raise ValueError(
                f"render_mode must be 'text' or 'voice', got {render_mode!r}"
            )

        # Detect concern
        concern = self.analyze_concern(user_message)

        # Crisis handling
        if concern == "crisis":
            if render_mode == "voice":
                return self._get_crisis_response_voice()
            return self.get_crisis_response()

        # Get wisdom framework for concern
        theme = self.wisdom_themes.get(concern, self.wisdom_themes.get("general", {}))
        if concern not in self.wisdom_themes:
            theme = {
                "principle": "self_knowledge",
                "message": "The Gita teaches Atma-Jnana (self-knowledge). Let's explore what's happening through the lens of Gita wisdom.",
                "strategies": ["journaling", "meditation", "breathing"],
            }

        principle_key = theme.get("principle")
        if principle_key and isinstance(principle_key, str):
            principle_wisdom = self.wisdom_principles.get(principle_key, "")
        else:
            principle_wisdom = ""

        # Get strategies
        strategy_keys_raw = theme.get("strategies", ["breathing", "meditation"])
        strategy_keys = list(strategy_keys_raw) if strategy_keys_raw else []
        strategies_text = self._format_strategies(strategy_keys)

        # Voice mode: same wisdom, different delivery shape (~30–45s spoken arc)
        if render_mode == "voice":
            return self._render_voice(
                concern=concern,
                principle_wisdom=principle_wisdom,
                theme=theme,
                strategy_keys=strategy_keys,
            )

        # Build Gita-based structured response
        response = f"""**Ancient Wisdom Principle:** {principle_wisdom}

**Modern Application:** {theme.get('message', '')}

**Practical Steps:**
{strategies_text}

**Deeper Understanding:** The Bhagavad Gita teaches that all challenges are opportunities for spiritual growth (Sadhana). Your true nature is the eternal Self (Atman), which remains peaceful and complete beyond all circumstances. Through understanding and applying Gita wisdom, you transform difficulty into a pathway to Self-realization.

**Remember:**
• Your feelings are valid - the Gita acknowledges life's challenges
• You have inner strength (Shakti) beyond what you realize
• This moment doesn't define your eternal nature (Atman)
• Reaching out for guidance is wise (Viveka) and shows spiritual readiness

What feels most important to focus on first? 💙"""

        return response

    def _render_voice(
        self,
        *,
        concern: str,
        principle_wisdom: str,
        theme: dict,
        strategy_keys: list,
    ) -> str:
        """Render the same wisdom as a 30–45s spoken arc.

        Voice rendering rules (per Sakha Voice Companion spec, persona-version 1.0.0):
          • No section labels — flowing speech, not headings.
          • Sanskrit verbatim, then `<pause:medium>` SSML hint, then translation.
          • One practical suggestion only (others surface as on-screen tap-options).
          • Optional breath cue or soft question — never a sign-off.
          • `<pause:short|medium|long>` markers are honored by the TTS adapter.
          • Hard cap 60s (the WSS handler trims if needed).

        The output is plain text with `<pause:*>` SSML hints. The WSS TTS layer
        converts these to provider-specific break tags.
        """
        modern = theme.get("message", "").strip()
        first_strategy = (
            self.coping_strategies.get(strategy_keys[0], "")
            if strategy_keys
            else ""
        )

        # Voice-specific opener for each concern. Conversational, not labeled.
        # We keep Sanskrit grounded in canonical verses — see prompts/sakha.voice.openai.md
        # for the production system prompt that drives the LLM in WSS mode.
        opener_by_concern = {
            "anxiety": (
                "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।"
                " <pause:medium> Krishna says — be steadfast in yoga, perform action,"
                " let go of attachment to its fruit."
            ),
            "depression": (
                "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।"
                " <pause:medium> Lift yourself by your own self — do not let the self sink."
            ),
            "loneliness": (
                "सर्वभूतस्थमात्मानं सर्वभूतानि चात्मनि।"
                " <pause:medium> The Self in all beings, all beings in the Self — you are never alone."
            ),
            "self_doubt": (
                "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।"
                " <pause:medium> Better your own dharma, even imperfect, than another's perfectly performed."
            ),
            "stress": (
                "समत्वं योग उच्यते।"
                " <pause:medium> Equanimity — that is yoga."
            ),
            "overwhelm": (
                "स्वकर्मणा तमभ्यर्च्य सिद्धिं विन्दति मानवः।"
                " <pause:medium> Through your own work, offered with reverence, you find perfection."
            ),
            "conflict": (
                "अहिंसा सत्यमक्रोधस्त्यागः शान्तिरपैशुनम्।"
                " <pause:medium> Non-harm, truth, freedom from anger, letting go, peace, no slander."
            ),
            "failure": (
                "नेहाभिक्रमनाशोऽस्ति प्रत्यवायो न विद्यते।"
                " <pause:medium> On this path no effort is wasted, no progress is lost."
            ),
            "purpose": (
                "स्वधर्मे निधनं श्रेयः परधर्मो भयावहः।"
                " <pause:medium> Even falling in your own dharma is a blessing — another's path brings only fear."
            ),
            "uncertainty": (
                "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।"
                " <pause:medium> Surrender all paths — and walk forward in trust."
            ),
        }
        opener = opener_by_concern.get(
            concern,
            (
                "तस्मात्सर्वेषु कालेषु मामनुस्मर युध्य च।"
                " <pause:medium> At all times, remember the Self — and act."
            ),
        )

        modern_part = modern or principle_wisdom or ""
        suggestion = first_strategy or "Take one breath. <pause:short> That is enough for this moment."

        # Soft closer — a breath cue or a question, never a sign-off.
        closer_by_concern = {
            "anxiety": "<pause:long>",
            "depression": "What is one small thing your body is asking for?",
            "loneliness": "<pause:medium> I am here.",
            "self_doubt": "What feels truest, when the noise quiets?",
            "stress": "<pause:long>",
            "overwhelm": "What is the one next thing — only the next?",
            "conflict": "What would compassion look like, just for the next minute?",
            "failure": "<pause:medium> Nothing is lost.",
            "purpose": "What is yours to do today, however small?",
            "uncertainty": "<pause:long>",
        }
        closer = closer_by_concern.get(concern, "<pause:medium>")

        # Composed arc — readable as plain text, with TTS pause hints inline.
        arc = (
            f"{opener} <pause:short> "
            f"{modern_part} <pause:short> "
            f"Right now — {suggestion} <pause:short> "
            f"{closer}"
        ).strip()
        return arc

    def _get_crisis_response_voice(self) -> str:
        """20-second voice arc that routes the user to a helpline.

        The actual helpline audio is pre-rendered (see backend/services/
        crisis_partial_scanner.py for the audio path lookup). This text is the
        spoken-arc fallback when no pre-rendered clip is available."""
        return (
            "मैं तुम्हारे साथ हूँ। <pause:short> "
            "I am right here with you. <pause:medium> "
            "What you are feeling is real, and there is help — right now, on this phone. "
            "<pause:short> "
            "Please call the number on your screen. <pause:medium> "
            "I will wait."
        )

    def _format_strategies(self, strategy_keys: list) -> str:
        """Format coping strategies"""
        strategies_text = ""
        for i, key in enumerate(strategy_keys[:3], 1):
            strategy = self.coping_strategies.get(key, "Take time for yourself")
            strategies_text += f"{i}. {strategy}\n"
        return strategies_text

    def get_follow_up_guidance(self, user_concern: str, follow_up_message: str) -> str:
        """Generate follow-up responses for deeper conversations"""
        message_lower = follow_up_message.lower()

        # Check for specific requests
        if any(w in message_lower for w in ["help", "what should", "how can", "can you"]):
            return self._provide_specific_guidance(user_concern)

        if any(w in message_lower for w in ["tried", "already", "doesn't work"]):
            return self._validate_and_deepen(user_concern)

        if any(w in message_lower for w in ["better", "good", "working"]):
            return self._reinforce_progress(user_concern)

        return self.generate_response(follow_up_message)

    def _provide_specific_guidance(self, concern: str) -> str:
        """Provide specific Gita-based guidance for the concern"""
        guidance = {
            "anxiety": """**Ancient Wisdom Principle:** The Gita (Chapter 2, Verse 62-63) teaches that anxiety arises from attachment and dwelling on sense objects. Chapter 6 teaches Abhyasa (practice) and Vairagya (detachment) as the cure.

**Modern Application:** Your anxiety stems from attachment to outcomes and dwelling on fears. The Gita offers a clear path to freedom.

**Practical Steps:**

*Immediate relief (Gita-based):*
• Pranayama (breath control): Practice steady breathing as taught in Gita 4.29
• Sakshi Bhava: Witness your anxious thoughts without identifying with them
• Nama Japa: Repeat a mantra to steady the mind (Gita 6.26)

*Deeper practice (Sadhana):*
• Practice Viveka: Discriminate between what you control (your effort) and what you don't (results)
• Karma Yoga: Act without attachment to fruits (Gita 2.47)
• Daily meditation (Dhyana) to establish yourself in the peaceful Self

*Prevention through Gita wisdom:*
• Regular spiritual practice (Abhyasa) - Gita 6.35
• Study of Gita to reinforce wisdom (Svadhyaya)
• Seva (selfless service) to shift focus from ego-concerns

**Deeper Understanding:** Gita 2.48 teaches that Yoga is equanimity (Samatvam). Anxiety dissolves when you perform duties without attachment to outcomes. What's one duty you can focus on today? 💙""",

            "depression": """**Ancient Wisdom Principle:** The Gita (Chapter 3) teaches that action (Karma Yoga) is the cure for inertia and darkness (Tamas). Even small righteous actions (Dharma) create light and momentum.

**Modern Application:** Depression often involves Tamas (inertia). The Gita prescribes action as medicine - start small with your Svadharma (natural duty).

**Practical Steps:**

*When feeling heavy (Gita-based):*
• Karma Yoga: One small action as service, not for results
• Movement as Yoga: Walk mindfully, seeing it as spiritual practice
• Satsang: Connect with those who uplift you spiritually

*Building momentum (Abhyasa):*
• Small Dharmic actions compound (Gita 2.40 - no effort is wasted)
• Connection to nature to witness the Divine in creation
• Creative expression as Karma Yoga - offering without attachment

*Getting Gita-based support:*
• Study Gita Chapter 3 on action conquering inertia
• Seek guidance from spiritually wise people (Guru)
• Professional help is Dharmic - honoring the body-mind complex

**Deeper Understanding:** Gita 3.4 teaches you cannot achieve freedom through inaction. Even the smallest Dharmic action moves you toward light. The Self (Atman) within you is eternally joyful - depression is a cloud, not your nature. What's one tiny Dharmic action for the next 10 minutes? 💙""",

            "loneliness": """**Ancient Wisdom Principle:** The Gita (Chapter 6, Verse 29-30) teaches that the yogi sees the Self in all beings and all beings in the Self. True connection comes from this vision of unity.

**Modern Application:** Loneliness dissolves when you recognize the same Atman (Self) in yourself and all beings. This is not philosophy but direct experience through practice.

**Practical Steps:**

*Immediate Gita-based connection:*
• Practice seeing the Divine in others (Ishvara Drishti)
• Seva (selfless service) creates genuine connection
• Satsang: Seek community aligned with spiritual growth

*Building relationships through Gita wisdom:*
• Daya (compassion): Give what you seek - be the friend first
• Authentic sharing from the heart (Bhakti)
• Quality over quantity - one real Satsang friend transforms life

*Self-connection first:*
• Atma-Vichara: Be your own best friend (Gita 6.5)
• Meditation to know yourself as complete (Purna)
• Study Gita to keep company with eternal wisdom

**Deeper Understanding:** Gita 6.30 promises: "One who sees Me everywhere and sees everything in Me, I am never lost to them, nor are they ever lost to Me." You are never truly alone - the Divine Self dwells within. Cultivate this connection first. Who could you reach out to or serve today? 💙""",
        }

        return guidance.get(concern, """**Ancient Wisdom Principle:** The Bhagavad Gita offers complete guidance for every life challenge through understanding the Self, performing Dharma, and cultivating wisdom.

**Modern Application:** Your specific concern can be addressed through Gita wisdom - let's apply the appropriate teaching.

**Practical Steps:**
1. Study relevant Gita verses for your situation
2. Practice daily meditation (Dhyana) for clarity
3. Apply Karma Yoga - right action without attachment
4. Seek guidance from those learned in Gita wisdom

**Deeper Understanding:** Every challenge is an opportunity for spiritual growth (Sadhana). The Gita provides the complete map. I'm here to help you apply it. What specific help do you need? 💙""")

    def _validate_and_deepen(self, _concern: str) -> str:
        """Validate struggle and deepen understanding through Gita wisdom"""
        return """**Ancient Wisdom Principle:** The Gita (Chapter 6, Verse 24) teaches to practice without despondency (Asanshayam). Even great yogis face challenges in practice.

**Modern Application:** Your effort itself shows strength and spiritual readiness. The Gita acknowledges that the path requires persistent practice (Abhyasa).

**Important Gita teachings:**
• Struggling doesn't mean failing - it means growing (Sadhana)
• Gita 2.40: No sincere effort on this path is ever wasted
• Different approaches work for different temperaments (Guna)
• Sometimes we need guidance from the wise (Guru/teacher)

**Practical Steps:**
• Study Gita's teaching on perseverance (6.23-24)
• Seek guidance from those learned in Gita wisdom
• Try a different Gita-based approach (Karma/Bhakti/Jnana Yoga)
• Practice self-compassion (Daya) while maintaining effort

**Deeper Understanding:** Gita 6.40 promises: "Neither in this world nor in the next is there destruction for one who does good." Your sincere efforts are never wasted - they're building spiritual strength. Professional support combined with Gita wisdom is ideal. Would you like to explore what that might look like? 💙"""

    def _reinforce_progress(self, _concern: str) -> str:
        """Reinforce and build on progress using Gita wisdom"""
        return """**Ancient Wisdom Principle:** The Gita (Chapter 2, Verse 40) teaches that even small progress in spiritual practice protects from great fear. Your progress is significant.

**Modern Application:** Your improvement demonstrates the Gita's promise - sincere practice (Abhyasa) yields results. This is evidence of your spiritual capacity.

**Keep practicing (Sadhana):**
• Notice what works and continue that practice (Yukti)
• Small consistent practice compounds over time
• You're building Samskaras (positive mental impressions)
• This strengthens Buddhi (discriminative intelligence)

**Stay aware (Viveka):**
• Good days don't mean the journey is complete
• Challenges may return - this is natural (Prakriti)
• Keep your practices (Sadhana) consistent
• You've proven you can apply Gita wisdom successfully

**Deeper Understanding:** Gita 6.45 teaches that the yogi, striving with effort, becomes perfected through many lifetimes of practice. Your progress continues building, even beyond this life.

**Next level:**
• How can you deepen your Gita study and practice?
• How can you help others with Gita wisdom (Seva)?
• What did you learn about your true nature (Atman)?

You're stronger than you know. The Self within you is infinite strength. Keep walking this path. 💙"""

# Initialize global instance
wisdom_engine = WisdomEngine()

"""Wisdom Engine - Intelligent response generation using Bhagavad Gita philosophy

This module generates responses using Gita-inspired principles while keeping
language modern and reference-free.
All responses follow the mandatory structure:
- Ancient Wisdom Principle (timeless yogic idea)
- Modern Application
- Practical Steps (applied dharma/karma-yoga)
- Deeper Understanding (calm mind, steady self)
"""


import re


def validate_gita_response(response: str) -> bool:
    """Validate that response follows structured, reference-free Gita wisdom.

    Checks for:
    - Structured format with required sections
    - Presence of Gita-inspired concepts (dharma, karma-yoga, equanimity, etc.)
    - Absence of explicit scripture or character references (Gita, Krishna, Arjuna)

    Returns:
        bool: True if response is a structured, modern Gita-inspired answer
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

    lowered = response.lower()
    blocked_terms = [
        "gita", "bhagavad", "krishna", "arjuna", "kurukshetra", "vyasa",
        "chapter", "verse"
    ]
    if any(re.search(rf"\b{re.escape(term)}\b", lowered) for term in blocked_terms):
        return False

    gita_inspired_terms = [
        "dharma", "karma", "equanimity", "detachment", "yoga", "abhyasa",
        "vairagya", "inner witness", "selfless action", "steady mind",
        "self-mastery", "svadharma"
    ]

    if not any(term in lowered for term in gita_inspired_terms):
        return False

    return True


class WisdomEngine:
    """Generate intelligent responses using Bhagavad Gita principles"""

    def __init__(self):
        """Initialize wisdom mappings based on Bhagavad Gita principles"""
        self.wisdom_principles = {
            "duty": "Live your svadharma—focus on the duty in front of you without clinging to outcomes (karma-yoga).",
            "detachment": "Practice vairagya and gentle detachment—do your best while letting go of results so the mind stays light.",
            "balance": "Hold samatvam—equanimity between effort and acceptance keeps the heart steady in success or setback.",
            "self_knowledge": "Remember the quiet witness within; knowing your deeper Self brings calm beyond circumstances.",
            "action": "Right action with clear intention (karma-yoga) turns even small steps into momentum.",
            "acceptance": "Flow with what you cannot control while standing firm in what you can; equanimity softens resistance.",
            "growth": "Every challenge is sadhana—an opportunity to cultivate strength, clarity, and compassion.",
            "purpose": "Purpose emerges when actions align with your nature and values—your svadharma in motion.",
            "discipline": "Abhyasa (disciplined practice) builds inner steadiness and confidence over time.",
            "compassion": "Seeing the same light in yourself and others nurtures daya (compassion) and dissolves isolation.",
        }

        self.coping_strategies = {
            "breathing": "Practice pranayama: steady inhale and slow exhale to anchor the mind.",
            "grounding": "Center in the witness: notice sensations and breath to return to steadiness.",
            "movement": "Turn movement into karma-yoga—take a walk or stretch as mindful action without pressure.",
            "mindfulness": "Hold sakshi bhava: observe thoughts without judgment as the inner witness.",
            "journaling": "Use svadhyaya (self-study): reflect on triggers, choices, and what restores balance.",
            "connection": "Remember the shared Self in everyone; reach out with seva and selfless presence.",
            "rest": "Honor the body-mind with proper rest; this is part of yoga and supports a steady mind.",
            "nature": "Let nature remind you of harmony—notice details, breathe with the rhythm around you.",
            "creativity": "Express yourself creatively as selfless action, offering effort without worrying about results.",
            "meditation": "Practice dhyana: sit in stillness and watch the breath until attention softens.",
        }

        self.wisdom_themes = {
            "anxiety": {
                "principle": "detachment",
                "message": "Anxiety softens when you focus on effort over outcome—karma-yoga with vairagya keeps attention in the present.",
                "strategies": ["breathing", "grounding", "mindfulness"],
            },
            "depression": {
                "principle": "action",
                "message": "Even small dharmic, karma-yoga actions create momentum. Start with one aligned step to wake up energy.",
                "strategies": ["movement", "connection", "nature"],
            },
            "loneliness": {
                "principle": "compassion",
                "message": "Connection grows when you remember the same light lives in everyone; lead with compassion and presence.",
                "strategies": ["connection", "creativity", "journaling"],
            },
            "self_doubt": {
                "principle": "self_knowledge",
                "message": "Your worth is deeper than performance—the witnessing Self remains whole even when circumstances shift.",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "stress": {
                "principle": "balance",
                "message": "Samatvam—balanced action and rest—keeps stress in check. You don't have to carry everything at once.",
                "strategies": ["breathing", "rest", "nature"],
            },
            "overwhelm": {
                "principle": "duty",
                "message": "Focus on the immediate duty (svadharma): one thing at a time with full presence so your mind can settle.",
                "strategies": ["grounding", "movement", "breathing"],
            },
            "conflict": {
                "principle": "compassion",
                "message": "Everyone carries inner battles. Approach with daya (compassion) and see the shared Self beneath reactions.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "failure": {
                "principle": "growth",
                "message": "Failure is feedback for growth (sadhana), not identity. Look for the lesson with viveka (clear seeing).",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "purpose": {
                "principle": "purpose",
                "message": "Purpose emerges from svadharma—align actions with your nature and values.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "uncertainty": {
                "principle": "acceptance",
                "message": "Certainty is rare; steadiness and equanimity come from trusting your ability to adapt with yukti (wise flexibility).",
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

    def generate_response(self, user_message: str) -> str:
        """Generate intelligent, personalized response based on Bhagavad Gita principles

        All responses follow the mandatory structure:
        - Ancient Wisdom Principle (from Gita)
        - Modern Application
        - Practical Steps (Gita-based)
        - Deeper Understanding (Gita philosophy)
        """

        # Detect concern
        concern = self.analyze_concern(user_message)

        # Crisis handling
        if concern == "crisis":
            return self.get_crisis_response()

        # Get wisdom framework for concern
        theme = self.wisdom_themes.get(concern, self.wisdom_themes.get("general", {}))
        if concern not in self.wisdom_themes:
            theme = {
                "principle": "self_knowledge",
                "message": "Let's explore what's happening through self-knowledge: notice your thoughts, feelings, and the calmer witness within.",
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

        # Build Gita-inspired structured response without explicit references
        response = f"""**Ancient Wisdom Principle:** {principle_wisdom}

**Modern Application:** {theme.get('message', '')}

**Practical Steps:**
{strategies_text}

**Deeper Understanding:** Every challenge can become sadhana—a chance to steady the mind and act with clarity. Your deeper Self stays peaceful and complete beyond changing circumstances. By applying dharma (right action), karma-yoga (selfless effort), and calm observation, you turn difficulty into growth.

**Remember:**
• Your feelings are valid—life brings waves
• You have inner strength (shakti) beyond what you realize
• This moment doesn't define your deeper Self
• Reaching out for guidance is wise (viveka) and shows courage

What feels most important to focus on first? 💙"""

        return response

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
        """Provide specific, modern guidance grounded in Gita-inspired wisdom."""
        guidance = {
            "anxiety": """**Ancient Wisdom Principle:** Steady action with vairagya—release attachment to outcomes and return to calm effort.

**Modern Application:** Your mind is looping on what-ifs. Anchor attention to the next right action and the inner witness instead of the future story.

**Practical Steps:**

*Immediate steadiness:*
• Pranayama: inhale for 4, exhale for 6 to signal safety
• Sakshi bhava: name the worry, then watch it pass like a cloud
• Mantra focus: repeat a grounding word to re-center

*Deeper practice:*
• Viveka list: what you control vs what you cannot—act only on the first list
• Karma-yoga: take one small task as an offering without chasing results
• Dhyana: sit for five minutes after action to let the nervous system settle

**Deeper Understanding:** Equanimity (samatvam) is yoga—caring in action, light in attachment. Each time you release the grip, your mind learns safety and clarity. What's one action you can offer today? 💙""",

            "depression": """**Ancient Wisdom Principle:** Karma-yoga with compassion toward yourself—tiny dharmic actions rekindle light.

**Modern Application:** When heaviness hits, inertia grows. Gentle action aligned with your values rebuilds momentum without pressure.

**Practical Steps:**

*When feeling heavy:*
• One mindful movement: a short walk as a gift to your body
• Connection: message someone safe to share one honest line
• Nature: sit outside and track five sensory details

*Building momentum:*
• Choose a five-minute purposeful task and offer it without judging outcomes
• Creative spark: draw, write, or play music as selfless expression
• Track small wins to remind your mind that effort counts

**Deeper Understanding:** Action with a soft heart dissolves inertia. Your deeper Self is already whole; these small steps help your mood remember. What tiny action feels possible in the next ten minutes? 💙""",

            "loneliness": """**Ancient Wisdom Principle:** See the shared Self—connection grows from recognizing the same light in everyone.

**Modern Application:** Loneliness eases when you approach others with presence and compassion rather than waiting to be chosen.

**Practical Steps:**

*Immediate connection:*
• Serve: offer one kind action with no expectation (a check-in text, a favor)
• Eye-level listening: ask one person how they are and stay present
• Self-connection: write a compassionate note to yourself first

*Building relationships:*
• Join a small circle aligned with your interests or growth
• Share authentically—one honest sentence instead of a mask
• Prioritize depth over quantity; one genuine bond is enough

**Deeper Understanding:** When you act from daya (compassion) and presence, the sense of separation softens. You start to feel the quiet unity beneath roles. Who could you reach out to today, even briefly? 💙""",
        }

        return guidance.get(
            concern,
            """**Ancient Wisdom Principle:** Align with dharma and selfless action—do the next right thing with a steady mind.

**Modern Application:** Whatever the concern, return to present-focused effort and the inner witness. That pairing lowers overwhelm.

**Practical Steps:**
1. Name the situation and your role within it
2. Choose one compassionate, useful action and do it without clinging to results
3. Breathe slowly afterward to let your body register safety
4. Reflect on what felt steady so you can repeat it

**Deeper Understanding:** Each challenge is training for self-mastery. Steady action plus detachment turns turbulence into growth. I'm here to walk through it with you. 💙""",
        )

    def _validate_and_deepen(self, _concern: str) -> str:
        """Validate struggle and deepen understanding through modern, Gita-inspired wisdom"""
        return """**Ancient Wisdom Principle:** Abhyasa (steady practice) with faith in your capacity keeps progress alive.

**Modern Application:** Your effort shows strength; slips are part of the training. Return to small consistent actions without harsh judgment.

**Important reminders:**
• Struggling means learning, not failing—each try plants a new samskara
• No sincere effort is wasted; momentum builds quietly
• Different approaches work for different temperaments—adapt with yukti (wise flexibility)
• Guidance from trusted people is wise when stuck

**Practical Steps:**
• Repeat one practice today (breath, journaling, movement) and keep it short
• Ask one grounded person for support or reflection
• Experiment with a different style if the current one stalls
• Pair discipline with compassion so the mind feels safe to continue

**Deeper Understanding:** Each return to practice strengthens buddhi (clear discernment) and steadies the mind. Combining professional support with these habits creates the safest path forward. 💙"""

    def _reinforce_progress(self, _concern: str) -> str:
        """Reinforce and build on progress using Gita-inspired wisdom"""
        return """**Ancient Wisdom Principle:** Even small, consistent practice builds inner strength and protects against fear.

**Modern Application:** Your improvement shows that abhyasa works. Let's reinforce what helps so you can keep moving without strain.

**Keep practicing (sadhana):**
• Notice what works and keep it simple and repeatable
• Small consistent reps compound over time
• You're building positive samskaras that steady the mind
• Let rest be part of discipline, not a detour

**Stay aware (viveka):**
• Good days still need mindful action
• Challenges may return—meet them with the same tools
• Keep gratitude for progress without gripping it

**Deeper Understanding:** Steady practice plus selfless action shapes a resilient, compassionate mind. How do you want to celebrate and continue? 💙"""

# Initialize global instance
wisdom_engine = WisdomEngine()

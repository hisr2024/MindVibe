"""Wisdom Engine - Intelligent response generation using Bhagavad Gita philosophy"""


class WisdomEngine:
    """Generate intelligent responses using Bhagavad Gita principles"""

    def __init__(self):
        """Initialize wisdom mappings"""
        self.wisdom_principles = {
            "duty": "Focus on your responsibilities without worrying about results",
            "detachment": "Do your best, but detach from outcomes",
            "balance": "Find equilibrium between action and acceptance",
            "self_knowledge": "Understanding yourself is the first step to peace",
            "action": "Right action with right intention brings peace",
            "acceptance": "Accept what you cannot control with equanimity",
            "growth": "Every challenge is an opportunity to grow",
            "purpose": "Living with purpose brings fulfillment",
            "discipline": "Self-discipline creates inner strength",
            "compassion": "Extend kindness to yourself and others",
        }

        self.coping_strategies = {
            "breathing": "Try box breathing: 4 in, 4 hold, 4 out, 4 hold",
            "grounding": "Use 5-4-3-2-1 technique to anchor yourself",
            "movement": "Physical movement shifts mental state",
            "mindfulness": "Observe your thoughts without judgment",
            "journaling": "Write your thoughts to process emotions",
            "connection": "Reach out to someone you trust",
            "rest": "Give yourself permission to rest",
            "nature": "Spend time in nature for perspective",
            "creativity": "Express yourself through art or music",
            "meditation": "Sit with your experience in silence",
        }

        self.wisdom_themes = {
            "anxiety": {
                "principle": "detachment",
                "message": "You are not your worries. Focus on what you can control right now.",
                "strategies": ["breathing", "grounding", "mindfulness"],
            },
            "depression": {
                "principle": "action",
                "message": "Small actions create momentum. Start with one tiny step.",
                "strategies": ["movement", "connection", "nature"],
            },
            "loneliness": {
                "principle": "compassion",
                "message": "Connection begins with compassion toward yourself.",
                "strategies": ["connection", "creativity", "journaling"],
            },
            "self_doubt": {
                "principle": "self_knowledge",
                "message": "Your worth isn't determined by performance. You are inherently valuable.",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "stress": {
                "principle": "balance",
                "message": "Balance action with rest. You don't have to do everything at once.",
                "strategies": ["breathing", "rest", "nature"],
            },
            "overwhelm": {
                "principle": "duty",
                "message": "Focus on your immediate duty. One thing at a time.",
                "strategies": ["grounding", "movement", "breathing"],
            },
            "conflict": {
                "principle": "compassion",
                "message": "Everyone is fighting their own battle. Approach with understanding.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "failure": {
                "principle": "growth",
                "message": "Failure is feedback, not identity. What can you learn?",
                "strategies": ["journaling", "meditation", "creativity"],
            },
            "purpose": {
                "principle": "purpose",
                "message": "Purpose comes from alignment between values and actions.",
                "strategies": ["meditation", "journaling", "connection"],
            },
            "uncertainty": {
                "principle": "acceptance",
                "message": "Certainty isn't possible. Trust in your ability to adapt.",
                "strategies": ["meditation", "breathing", "grounding"],
            },
        }

    def analyze_concern(self, user_message: str) -> str:
        """Detect user's primary concern"""
        message_lower = user_message.lower()

        # Crisis detection (highest priority)
        crisis_keywords = [
            "suicide",
            "kill myself",
            "end it",
            "harm myself",
            "cut myself",
            "overdose",
            "better off dead",
            "no reason to live",
        ]
        if any(keyword in message_lower for keyword in crisis_keywords):
            return "crisis"

        # Map concerns to themes
        concern_map = {
            "anxiety": [
                "anxious",
                "anxiety",
                "worried",
                "nervous",
                "panic",
                "afraid",
                "scared",
            ],
            "depression": [
                "depressed",
                "depression",
                "sad",
                "hopeless",
                "empty",
                "nothing matters",
                "tired",
                "exhausted",
            ],
            "loneliness": [
                "alone",
                "lonely",
                "isolated",
                "nobody understands",
                "disconnected",
            ],
            "self_doubt": [
                "not good enough",
                "failure",
                "worthless",
                "shame",
                "useless",
                "stupid",
                "ugly",
                "loser",
            ],
            "stress": [
                "stressed",
                "pressure",
                "overwhelmed",
                "tense",
                "anxious",
                "tight",
            ],
            "overwhelm": [
                "overwhelmed",
                "too much",
                "can't handle",
                "drowning",
                "too many",
            ],
            "conflict": [
                "argument",
                "fighting",
                "conflict",
                "angry",
                "frustrated",
                "betrayed",
            ],
            "failure": [
                "failed",
                "failure",
                "didn't work",
                "couldn't do it",
                "messed up",
            ],
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
        """Generate intelligent, personalized response"""

        # Detect concern
        concern = self.analyze_concern(user_message)

        # Crisis handling
        if concern == "crisis":
            return self.get_crisis_response()

        # Get wisdom framework for concern
        theme = self.wisdom_themes.get(concern, self.wisdom_themes["general"])
        if concern not in self.wisdom_themes:
            theme = {
                "principle": "self_knowledge",
                "message": "Let's explore what's happening and find a path forward.",
                "strategies": ["journaling", "meditation", "breathing"],
            }

        principle_key_raw = theme.get("principle")
        principle_key: str = (
            str(principle_key_raw) if principle_key_raw else "self_knowledge"
        )
        principle_wisdom = self.wisdom_principles.get(principle_key, "")

        # Get strategies
        strategy_keys_raw = theme.get("strategies", ["breathing", "meditation"])
        strategy_keys = (
            list(strategy_keys_raw)
            if isinstance(strategy_keys_raw, list)
            else ["breathing", "meditation"]
        )
        strategies_text = self._format_strategies(strategy_keys)

        # Build response
        response = f"""{theme.get('message', '')}

**The deeper principle:**
{principle_wisdom}

**Practical steps right now:**
{strategies_text}

**Remember:**
• Your feelings are valid and understandable
• You have more strength than you realize
• This moment doesn't define your future
• Reaching out (like you just did) is powerful

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
        if any(
            w in message_lower for w in ["help", "what should", "how can", "can you"]
        ):
            return self._provide_specific_guidance(user_concern)

        if any(w in message_lower for w in ["tried", "already", "doesn't work"]):
            return self._validate_and_deepen(user_concern)

        if any(w in message_lower for w in ["better", "good", "working"]):
            return self._reinforce_progress(user_concern)

        return self.generate_response(follow_up_message)

    def _provide_specific_guidance(self, concern: str) -> str:
        """Provide specific guidance for the concern"""
        guidance = {
            "anxiety": """Here's what helps with anxiety:

**Immediate relief:**
• Progressive muscle relaxation: Tense each muscle for 5 sec, then relax
• Cold water on face: Triggers calm response
• Naming your thoughts: "This is anxiety speaking, not truth"

**Deeper work:**
• Identify what you can and can't control
• Take one small action on what you CAN control
• Accept what you can't control

**Prevention:**
• Regular movement (even 10 min walks)
• Consistent sleep schedule
• Limiting caffeine and news
• Talking about worries instead of hiding them

What's one thing you CAN control right now? 💙""",
            "depression": """Here's what helps with depression:

**When it's heavy:**
• One tiny action: Make tea. Open a window. Send one message.
• Gentle movement: 5-minute walk, stretch, dance to one song
• Talking: Tell someone "I'm struggling"

**Building momentum:**
• Small wins compound: Today's one action → Tomorrow's easier
• Connection matters: One conversation changes perspective
• Nature helps: Outside changes brain chemistry

**Getting support:**
• Talk to doctor or therapist: Depression responds to treatment
• Medication can help: No shame in chemical support
• Community: You're not alone in this

What's one tiny thing you could do in the next 10 minutes? 💙""",
            "loneliness": """Here's what helps with loneliness:

**Immediate connection:**
• Text one person you trust
• Join an online community around your interests
• Volunteer or help someone else
• Attend a class or group activity

**Building relationships:**
• Quality over quantity: One real connection > many shallow ones
• Vulnerability creates connection: Share your real self
• Show interest in others: Ask questions, listen deeply

**Self-compassion:**
• Loneliness is a signal you need connection
• You deserve companionship
• Start with being your own friend

**Long-term:**
• Join groups aligned with your values
• Invest time in relationships
• Be patient: Good connections take time

Who's one person you could reach out to today? 💙""",
        }

        return guidance.get(
            concern, "I'm here to support you. What specific help would you like?"
        )

    def _validate_and_deepen(self, concern: str) -> str:
        """Validate struggle and deepen understanding"""
        return """I hear that you've been trying. That itself shows strength.

**Important to know:**
• Struggling doesn't mean you're failing
• Sometimes we need professional support
• What worked before might not work now
• Different approaches help different people

**Consider:**
• Speaking with a therapist or counselor
• Talking to your doctor
• Trying a different approach
• Reaching out to people you trust

**Right now:**
Focus not on fixing everything, but on surviving this moment with compassion toward yourself.

You're doing better than you think. Would you like to explore what professional support might look like? 💙"""

    def _reinforce_progress(self, concern: str) -> str:
        """Reinforce and build on progress"""
        return """I'm genuinely glad to hear that. Progress is happening.

**Keep going:**
• Notice what's working and keep doing it
• Small improvements compound over time
• You're building resilience and wisdom

**Stay aware:**
• Good days don't erase the journey
• Challenges might return: That's normal
• Keep your support systems in place
• You've proven you can get through this

**Next level:**
• What else could support this progress?
• How can you help someone else with similar struggles?
• What did you learn about yourself?

You're stronger than you know. Keep going. 💙"""


# Initialize global instance
wisdom_engine = WisdomEngine()

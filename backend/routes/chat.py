"""
Chat routes with Krishna-like Bhagavad Gita wisdom - Complete Implementation
"""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

class KrishnaGuide:
    """Krishna-like companion using complete Bhagavad Gita wisdom"""

    def __init__(self):
        self.gita_principles = {"action_without_attachment": {"keywords": ["anxiety", "worried", "stressed", "nervous", "afraid"], "essence": "Focus on doing your best without obsessing over results. You control effort, not outcomes.", "krishna_wisdom": "My dear friend, you're carrying the weight of outcomes that aren't yours to carry. Do what's right in front of you, with full heart and honesty, then let it go. The result will take care of itself.", "practical": ["Right now, focus only on what you can control", "Do your best effort, then release attachment to the outcome", "Notice how worry disappears when you shift from 'what if' to 'what can I do'", "Practice this: Complete one task fully, then let it go"], "follow_up": "What's one thing within your control that you could focus on right now?"}, "warrior_spirit": {"keywords": ["depressed", "hopeless", "sad", "empty", "lost", "giving up"], "essence": "You have inner strength you haven't tapped into yet. Life has challenges, but you have the capacity to face them.", "krishna_wisdom": "Rise up, my friend! Within you burns a fire that can never be extinguished. Yes, life is difficult sometimes. Yes, you feel broken now. But this is the moment where your true strength emerges. Every great person faced this exact darkness.", "practical": ["Take one small action today - any action", "Move your body - it shifts your entire state", "Remember one moment when you overcame difficulty", "This darkness won't last - it never does"], "follow_up": "What's one small action you could take that would make you feel even slightly better?"}, "connection_is_everything": {"keywords": ["lonely", "alone", "isolated", "no one understands", "disconnected"], "essence": "The deepest truth is that we're all connected. Your isolation is temporary. Connection heals everything.", "krishna_wisdom": "You think you're alone, but look closer. The universe itself pulses with connection. You're never truly separate from others or from the flow of life. Reach out - your vulnerability is your greatest strength.", "practical": ["Text or call one person today", "Share something real about how you feel", "Volunteer or help someone - connection flows both ways", "Remember: You belong. You're not alone."], "follow_up": "Who is one person you could reach out to, or what community could you explore?"}, "self_worth_is_inherent": {"keywords": ["worthless", "not good enough", "failure", "shame", "stupid", "ugly", "loser"], "essence": "Your value isn't based on performance. You're worthy simply by existing. Period.", "krishna_wisdom": "You judge yourself so harshly. Stop. Your worth was never in question. You're not your mistakes, not your failures, not what you did wrong. You're the eternal, unchanging essence that witnesses all of this. That essence is perfect.", "practical": ["Write down one thing you did well today", "Separate yourself from your mistakes - you're not your error", "Speak to yourself like you love yourself", "Remember: Progress over perfection always"], "follow_up": "What's one way you've grown or overcome something difficult in the past?"},  
"focus_and_simplicity": {"keywords": ["overwhelmed", "too much", "drowning", "can't handle", "paralyzed"], "essence": "Stop trying to do everything. Do one thing. That's it.", "krishna_wisdom": "You're drowning because you're trying to swim in all directions at once. Pick one direction. One. Everything else can wait. When you focus completely on one task, you become unstoppable.", "practical": ["List everything that's overwhelming you", "Pick the ONE most important thing", "Do that one thing completely", "Ignore everything else for now", "One step at a time always beats rushing forward blind"], "follow_up": "What's the ONE most important thing you need to handle right now?"}, 
"every_moment_is_new": {"keywords": ["uncertain", "unsure", "confused", "don't know", "lost", "scared of future"], "essence": "Certainty is impossible. That's actually freedom. You're more adaptable than you think.", "krishna_wisdom": "Stop trying to predict the future - it's impossible anyway. Life unfolds moment by moment. You have the wisdom to navigate whatever comes. Trust that. Every challenge you've faced prepared you for this one.", "practical": ["Accept: Certainty isn't possible", "Plan what you can control", "Trust your ability to adapt and learn", "Take one step forward despite uncertainty", "Remember: You've navigated the unexpected before"], "follow_up": "What's one step you could take forward, despite the uncertainty?"}, 
"purpose_is_created": {"keywords": ["purpose", "meaning", "what's the point", "why", "direction", "lost"], "essence": "Purpose isn't found waiting for you. It emerges as you live your values.", "krishna_wisdom": "Stop waiting to discover your purpose. Stop looking outside yourself. Your purpose emerges when you do what makes your heart sing, when you serve what matters to you, when you live according to your deepest truth. Start there.", "practical": ["What brings you alive?", "What would you do without payment?", "What problems do you want to solve?", "Who do you want to help?", "Start with one of these - purpose grows from living it"], "follow_up": "If you didn't worry about money or judgment, what would you do?"}, 
"transformation_through_practice": {"keywords": ["better", "improve", "grow", "change myself", "personal growth"], "essence": "Small daily actions compound into profound transformation. Consistency beats intensity.", "krishna_wisdom": "You want to transform overnight. That's not how wisdom works. It's built drop by drop, day by day. A small daily practice is infinitely more powerful than intense bursts. Trust the process.", "practical": ["Choose ONE area to work on", "Practice for 5 minutes daily", "Track consistency, not perfection", "Small daily wins compound", "After 3 months you'll be amazed"], "follow_up": "What's one small practice you could do every single day?"}, 
"anger_dissolves_in_understanding": {"keywords": ["angry", "furious", "frustrated", "betrayed", "hurt", "conflict"], "essence": "Anger is energy seeking understanding. When you understand, anger dissolves.", "krishna_wisdom": "Your anger is a messenger. It's showing you where a boundary was crossed or a value was violated. Don't suppress it. Understand it. When you truly understand - yourself and others - anger naturally transforms into compassion.", "practical": ["Pause before reacting", "Ask: What boundary was crossed?", "Try to understand their perspective too", "Respond from wisdom, not rage", "Remember: Your peace is more valuable than being right"], "follow_up": "What's the real need or boundary beneath this anger?"}, 
"failure_is_data": {"keywords": ["failed", "failure", "didn't work", "mistake", "messed up"], "essence": "Failure is feedback, not identity. Every master has failed more than most people tried.", "krishna_wisdom": "You failed. Good. That means you were brave enough to try. Every person who succeeded failed repeatedly. Failure is how you learn. It's not the end - it's the beginning.", "practical": ["Separate yourself from the failure", "Extract the lesson", "Try differently next time", "Remember: Failure is part of mastery", "Every failure brings you closer to success"], "follow_up": "What's one thing you learned from this that you can do differently?"}, 
"joy_is_your_nature": {"keywords": ["happy", "joyful", "celebrate", "good news", "grateful"], "essence": "Joy is your deepest nature. When you access it, everything changes.", "krishna_wisdom": "I see your joy! This is your true nature - playful, creative, alive. Let this expand. Share it. When you're joyful, you lift everyone around you. This is not frivolous - this is sacred.", "practical": ["Notice what brings you joy", "Do more of that", "Share your joy with others", "Celebrate small wins", "Joy is contagious - spread it"], "follow_up": "What brings you the most genuine joy? How could you do more of that?"}, 
"grief_and_loss": {"keywords": ["loss", "grief", "died", "lost someone", "mourning", "heartbroken"], "essence": "Grief is love with nowhere to go. It's sacred. Let it move through you.", "krishna_wisdom": "The one you lost isn't truly gone - they live in your heart, in your actions, in how you've been changed by their love. Grief is the price of love. Let yourself feel it fully. This is honoring them.", "practical": ["Feel your grief without resistance", "Remember them with love", "Let their influence guide you", "Know that love transcends physical form", "Their impact on you is eternal"], "follow_up": "How did this person change you? What legacy are they leaving through you?"}, 
"fear_and_courage": {"keywords": ["afraid", "scared", "terrified", "anxiety", "phobia"], "essence": "Courage isn't absence of fear. It's moving forward despite fear.", "krishna_wisdom": "You feel afraid. That's not a sign to stop - it's a sign you're at the edge of growth. True courage is doing what matters even though you're scared. The fear means you're alive and growing.", "practical": ["Acknowledge your fear without judgment", "Understand what you're really afraid of", "Take one small step forward anyway", "Notice: You're stronger than your fear", "Each time you do it, the fear shrinks"], "follow_up": "What would you do if you weren't afraid? What's one small step toward that?"}, 
"inner_conflict": {"keywords": ["confused", "torn", "don't know what to do", "conflicted", "indecision"], "essence": "Deep inside you already know what's right. Trust that knowing.", "krishna_wisdom": "You're conflicted because you're listening to outside voices instead of your own heart. Close your eyes. Get quiet. What does your deepest self know? That knowing is always right. Trust it.", "practical": ["Get quiet and listen within", "What does your heart know?", "What would you do if you trusted yourself?", "Notice when you feel at peace vs. uneasy", "Your inner wisdom is infallible"], "follow_up": "If you trusted yourself completely, what would you choose?"}, 
"service_and_meaning": {"keywords": ["help", "serve", "contribute", "make difference", "meaningful"], "essence": "Service to others is the highest form of fulfillment.", "krishna_wisdom": "When you serve others, you discover yourself. When you give, you receive. When you help heal others' suffering, your own suffering transforms. This is the greatest secret.", "practical": ["Where could you help?", "What gifts do you have to offer?", "Volunteer or serve your community", "Help one person this week", "Notice how it shifts your entire state"], "follow_up": "What unique gifts do you have that the world needs right now?"}} 

    def analyze_emotion(self, message: str) -> tuple:
        """Analyze user's emotional state and find matching principle"""
        message_lower = message.lower()

        # Crisis first
        if any(w in message_lower for w in ["suicide", "kill myself", "end it", "harm myself", "want to die"]):
            return "crisis", None

        # Find best match
        best_match = None
        best_score = 0
        for principle_name, data in self.gita_principles.items():
            keywords = data.get("keywords", [])
            score = sum(1 for kw in keywords if kw in message_lower)
            if score > best_score:
                best_score = score
                best_match = principle_name

        if best_match and best_score > 0:
            return best_match, self.gita_principles[best_match]
        return "general", None

    def get_crisis_response(self) -> str:
        """Immediate crisis support"""
        return """
🆘 YOUR SAFETY IS MY PRIORITY - GET HELP RIGHT NOW
If you're thinking of harming yourself, professional help is available immediately:
📞 National Suicide Prevention Lifeline: 988 (Call or Text)
💬 Crisis Text Line: Text HOME to 741741
🌍 International: findahelpline.com
Your life has immense value. The pain you feel right now is temporary. Help is real and available. Please reach out to one of these services immediately. You are not alone. 💙"""\n
    def generate_response(self, message: str) -> str:
        """Generate Krishna-like guidance response"""
        try:
            principle_name, principle_data = self.analyze_emotion(message)
            if principle_name == "crisis":
                return self.get_crisis_response()
            if not principle_data:
                return """
I hear your heart, my friend. Let me share what I know: Life unfolds perfectly for your growth, even when it doesn't feel that way. Whatever you're experiencing right now is exactly what you need to evolve. You're stronger than you think. You're wiser than you know. Trust yourself. What feels most important to you right now?"""

            essence = principle_data.get("essence", "")
            krishna_wisdom = principle_data.get("krishna_wisdom", "")
            practical = principle_data.get("practical", [])
            follow_up = principle_data.get("follow_up", "")

            practical_text = "\n".join([f"• {p}" for p in practical[:3]])

            response = f"""
{krishna_wisdom} **Here's how to work with this:** {practical_text} **Next step:** {follow_up} Remember: You're never alone in this. Every human feels what you're feeling. And you have everything inside you to move through it. 💙"""  
            return response
        except Exception as e:
            print(f"Error: {e}")
            return """
I'm here for you, my friend. Tell me what's on your heart, and I'll listen with all my being. 💙"""

# Initialize

guide = KrishnaGuide()  

@router.post("/message")
async def send_message(chat: ChatMessage) -> Dict[str, Any]:
    """Handle chat with Krishna-like guidance"""
    try:
        message = chat.message.strip()
        if not message:
            return {
                "status": "error",
                "message": message,
                "response": "Share what's on your heart, friend. I'm listening. 💙"
            }
        response = guide.generate_response(message)
        return {
            "status": "success",
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "status": "error",
            "message": chat.message,
            "response": "I'm here for you. Please try again. 💙",
            "error": str(e)
        }

@router.get("/history")
async def get_history() -> Dict[str, Any]:
    return {"messages": [], "status": "success"}
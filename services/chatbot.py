"""
AI Chatbot Service for Mental Health Guidance

Provides conversational AI chatbot functionality based on Bhagavad Gita wisdom,
with conversation history, context management, and multi-turn dialogues.
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

# Support both package and direct imports
try:
    from ..services.wisdom_kb import WisdomKnowledgeBase
except ImportError:
    from services.wisdom_kb import WisdomKnowledgeBase


class ChatbotService:
    """
    Service for managing AI chatbot conversations with mental health guidance.
    """
    
    def __init__(self):
        self.kb = WisdomKnowledgeBase()
        self.conversation_histories: Dict[str, List[Dict[str, Any]]] = {}
    
    async def chat(
        self,
        message: str,
        session_id: str,
        db: AsyncSession,
        language: str = "english",
        include_sanskrit: bool = False
    ) -> Dict[str, Any]:
        """
        Process a chat message and generate a response.
        
        Args:
            message: User's message/query
            session_id: Unique session identifier for conversation tracking
            db: Database session
            language: Preferred language for response
            include_sanskrit: Whether to include Sanskrit verses
            
        Returns:
            Dictionary containing response, verses, and conversation context
        """
        # Initialize conversation history for new sessions
        if session_id not in self.conversation_histories:
            self.conversation_histories[session_id] = []
        
        # Add user message to history
        self.conversation_histories[session_id].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Search for relevant verses
        relevant_verses = await self.kb.search_relevant_verses(
            db=db,
            query=message,
            limit=3
        )
        
        # Generate AI response
        ai_response = await self._generate_chat_response(
            message=message,
            verses=relevant_verses,
            language=language,
            conversation_history=self.conversation_histories[session_id]
        )
        
        # Add assistant response to history
        self.conversation_histories[session_id].append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Format verses for response
        verse_references = []
        for item in relevant_verses:
            verse = item["verse"]
            formatted = self.kb.format_verse_response(
                verse=verse,
                language=language,
                include_sanskrit=include_sanskrit
            )
            verse_references.append(formatted)
        
        return {
            "response": ai_response,
            "verses": verse_references,
            "session_id": session_id,
            "language": language,
            "conversation_length": len(self.conversation_histories[session_id])
        }
    
    async def _generate_chat_response(
        self,
        message: str,
        verses: List[Dict[str, Any]],
        language: str,
        conversation_history: List[Dict[str, Any]]
    ) -> str:
        """
        Generate AI-powered chat response using OpenAI GPT.
        Falls back to template-based response if OpenAI is not available.
        """
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if not openai_key or openai_key == "your-api-key-here":
            # Fallback to template response
            return self._generate_template_chat_response(message, verses, language)
        
        try:
            # Import OpenAI only if needed
            import openai
            openai.api_key = openai_key
            
            # Prepare verse context
            verse_context = "\n\n".join([
                f"Wisdom Teaching {i+1}:\n{item['verse'].english}\n\nContext: {item['verse'].context}"
                for i, item in enumerate(verses)
            ]) if verses else "No specific verses found, provide general wisdom-based guidance."
            
            # Build conversation context from history (last 6 messages for context)
            recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history[:-1]
            conversation_context = "\n".join([
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in recent_history
            ])
            
            # Create system prompt with strict anti-religious guidelines
            system_prompt = """You are a compassionate mental health chatbot that provides guidance based on universal wisdom principles.
You draw from ancient wisdom teachings but present them in a completely secular, modern, and universally applicable way.

CRITICAL RULES:
- NEVER mention Krishna, Arjuna, Hindu deities, or any religious figures
- NEVER use terms like "Lord", "God", "Divine", "Holy" in a religious context
- Present all wisdom as universal principles applicable to anyone regardless of faith
- Focus on practical mental health applications and actionable advice
- Use modern, accessible, conversational language
- Be warm, empathetic, and supportive like a caring counselor
- Acknowledge emotions and validate user's experiences
- Provide specific, actionable steps when appropriate

You are having an ongoing conversation with someone seeking mental health support.
Build on previous exchanges and show you remember the context of the conversation."""

            user_prompt = f"""Previous Conversation:
{conversation_context if conversation_context else "This is the start of the conversation."}

Current User Message: {message}

Relevant Universal Wisdom Teachings:
{verse_context}

Please provide a compassionate, conversational response that:
1. Acknowledges the user's message and shows you understand their situation
2. References relevant points from our previous conversation if applicable
3. Explains how the wisdom principles apply to their situation
4. Offers concrete, actionable guidance they can implement
5. Uses only universal, non-religious language
6. Maintains a warm, supportive tone like a caring friend or counselor
7. Keeps the response concise but meaningful (2-3 paragraphs)

Response:"""

            # Call OpenAI API with updated client
            try:
                # Try newer OpenAI API (>= 1.0.0)
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=400
                )
                return response.choices[0].message.content.strip()
            except ImportError:
                # Fallback to older OpenAI API (< 1.0.0)
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=400
                )
                return response.choices[0].message.content.strip()
            
        except Exception as e:
            # Log the error and fall back to template response
            print(f"OpenAI API error in chatbot: {str(e)}")
            return self._generate_template_chat_response(message, verses, language)
    
    def _generate_template_chat_response(
        self,
        message: str,
        verses: List[Dict[str, Any]],
        language: str
    ) -> str:
        """
        Generate a template-based chat response when OpenAI is not available.
        Provides fallback guidance based on verse themes.
        """
        if not verses:
            return """I understand you're reaching out for guidance. While I don't have specific wisdom teachings to share at this moment, I'm here to support you. 

Remember that challenges are a natural part of life, and you have inner strength to navigate them. Consider taking a moment to pause, breathe deeply, and approach your situation with patience and self-compassion. 

What specific aspect of this situation would you like to explore further?"""
        
        # Get the most relevant verse
        top_verse = verses[0]["verse"]
        theme = top_verse.theme.replace('_', ' ').title()
        
        # Create contextual response based on theme
        theme_responses = {
            "action_without_attachment": f"""I hear your concern. There's a timeless principle that might help here: focusing on your actions rather than outcomes.

The wisdom teaches us that we can control our efforts and dedication, but not always the results. By putting your energy into doing your best in each moment—without constantly worrying about how things will turn out—you reduce anxiety and find greater peace of mind.

Try this: For today, focus solely on the process. Do your work well, make thoughtful decisions, but let go of attachment to specific outcomes. This shift in perspective can bring surprising relief.""",
            
            "equanimity_in_adversity": f"""Thank you for sharing what you're going through. What you're experiencing is challenging, and it's natural to feel affected by difficult circumstances.

Ancient wisdom teaches us about inner stability—the ability to remain centered even when external situations are turbulent. Think of it like the depths of the ocean: while waves may crash on the surface, the deep waters remain calm and steady.

You can cultivate this inner calm through: 1) Observing your emotions without being overwhelmed by them, 2) Reminding yourself that external situations are temporary, and 3) Finding small moments of peace even in difficulty. Your inner stability is yours to develop and maintain.""",
            
            "control_of_mind": f"""I appreciate you opening up about this. Understanding our thought patterns is one of the most powerful tools we have for mental wellbeing.

There's wisdom in recognizing that our thoughts create cycles of emotion. When we dwell on certain thoughts, they can gain momentum and influence our feelings and behaviors. But here's the empowering part: by becoming aware of these patterns, you gain the ability to interrupt harmful cycles.

Try practicing thought awareness: Notice when your mind starts a familiar negative pattern. Simply observe it without judgment, like watching clouds pass. Over time, this awareness gives you more control over your mental state.""",
            
            "self_empowerment": f"""What you're facing is an opportunity for growth, even though it may not feel that way right now.

Here's an important truth: You have more power over your situation than you might realize. While you can't control everything that happens to you, you have complete control over your response to it. Your mind can be your greatest ally in creating positive change.

Start here: 1) Acknowledge your current situation honestly, 2) Recognize one small thing you can control or change today, 3) Take that one step, however small. Each action you take reinforces your agency and builds momentum for larger changes.""",
            
            "mastering_the_mind": f"""It's completely normal to find the mind challenging to work with—this is a universal human experience, not a personal failing.

The key isn't to fight against your mind, but to work with it skillfully. Think of it like training a muscle: it takes consistent, patient practice. Some days will feel easier than others, and that's perfectly fine.

Here's what you can practice: Set aside just 5 minutes daily to sit quietly and observe your thoughts without engaging with them. When your mind wanders (and it will), gently bring your attention back. This simple practice, done consistently, gradually builds mental clarity and peace.""",
        }
        
        # Get theme-specific response or use default
        theme_key = top_verse.theme
        response = theme_responses.get(theme_key, f"""Thank you for reaching out. The wisdom tradition offers guidance on {theme.lower()} that might be helpful here.

The key insight is that you have inner resources to navigate this challenge. While external circumstances may be difficult, you can develop internal qualities that help you respond with wisdom and balance.

Consider reflecting on how these principles might apply to your specific situation. Sometimes the most powerful changes come from shifting our perspective and approach, rather than changing external circumstances.""")
        
        return response
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve conversation history for a session.
        """
        return self.conversation_histories.get(session_id, [])
    
    def clear_conversation(self, session_id: str) -> bool:
        """
        Clear conversation history for a session.
        """
        if session_id in self.conversation_histories:
            del self.conversation_histories[session_id]
            return True
        return False
    
    def get_active_sessions(self) -> List[str]:
        """
        Get list of active session IDs.
        """
        return list(self.conversation_histories.keys())

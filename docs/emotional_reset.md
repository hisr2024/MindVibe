# KIAAN Emotional Reset

## Overview

The KIAAN Emotional Reset is a specialized 7-step guided flow designed to help users release emotional burdens, reset their mental state, and foster renewal. This feature integrates seamlessly with the existing KIAAN chatbot while maintaining all current functionality.

## Feature Summary

- **7-Step Guided Flow**: A structured journey from emotional acknowledgment to affirmation
- **Crisis Detection**: Integrated safety measures to detect and respond to crisis situations
- **AI-Powered Insights**: Personalized assessments, visualizations, and affirmations
- **Breathing Exercises**: 2-minute guided breathing with animated visuals
- **Wisdom Integration**: Relevant insights from the Gita wisdom base (without citations)
- **Session Persistence**: Sessions auto-save and can be resumed within 30 minutes
- **Rate Limiting**: Maximum 10 sessions per user per day

## The 7 Steps

### Step 1: Welcome & Intention
Users share what's weighing on their heart (max 200 characters). This provides the foundation for personalized guidance throughout the session.

### Step 2: Assessment
KIAAN provides a 2-3 sentence empathetic assessment that:
- Validates the user's feelings
- Identifies core emotions
- Gently reframes with hope

### Step 3: Breathing Reset
A 2-minute guided breathing exercise using the 4-4-4-4 pattern:
- 4 seconds inhale
- 4 seconds hold
- 4 seconds exhale
- 4 seconds rest

Features an animated breathing circle with pause/resume functionality.

### Step 4: Release Visualization
A calming visualization using nature metaphors (flowing stream, floating leaves) to help users symbolically release their burdens.

### Step 5: Wisdom Integration
1-2 relevant insights from the Gita wisdom base, presented as universal principles without religious citations. Includes practical applications for daily life.

### Step 6: Affirmations
3-5 personalized affirmations based on:
- Identified emotions
- Life themes
- User's specific situation

### Step 7: Completion
Summary of the session including:
- Key insights
- Affirmation to remember
- Next steps for continued wellness

## API Endpoints

### POST /api/emotional-reset/start
Initialize a new emotional reset session.

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "current_step": 1,
  "total_steps": 7,
  "step_title": "Welcome & Intention",
  "prompt": "What's weighing on your heart today?",
  "guidance": "Take a moment to acknowledge...",
  "progress": "1/7"
}
```

### POST /api/emotional-reset/step
Process current step and advance to next.

**Request:**
```json
{
  "session_id": "uuid",
  "current_step": 1,
  "user_input": "I'm feeling anxious about work"
}
```

**Response (varies by step):**
```json
{
  "success": true,
  "current_step": 2,
  "total_steps": 7,
  "step_title": "Understanding Your Emotions",
  "guidance": "Let me reflect back...",
  "progress": "2/7",
  "assessment": {
    "assessment": "I hear that you're feeling anxious...",
    "emotions": ["anxious"],
    "themes": ["work"]
  }
}
```

### GET /api/emotional-reset/session/{session_id}
Retrieve current session state for resume functionality.

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "current_step": 3,
  "total_steps": 7,
  "step_title": "Breathing Reset",
  "guidance": "Let's take a moment...",
  "progress": "3/7",
  "completed": false
}
```

### POST /api/emotional-reset/complete
Finalize session and generate summary.

**Request:**
```json
{
  "session_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "summary": {
    "summary": "Today you explored...",
    "key_insight": "Your emotions are messengers...",
    "affirmation_to_remember": "I am at peace.",
    "next_steps": ["Practice breathing", "Revisit affirmations"],
    "closing_message": "Session complete. 💙"
  },
  "affirmations": ["..."],
  "message": "Your emotional reset session is complete. 💙"
}
```

### GET /api/emotional-reset/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "feature": "emotional_reset",
  "version": "1.0.0"
}
```

## Safety & Crisis Detection

The emotional reset feature uses the same crisis detection system as KIAAN:

```python
CRISIS_KEYWORDS = [
    "kill myself", "suicide", "suicidal", "end my life",
    "hurt myself", "self harm", "cut myself", "overdose",
    "want to die", "better off dead", "no reason to live"
]
```

When crisis keywords are detected:
1. Session is paused
2. Crisis resources are immediately displayed
3. User is provided with professional help links
4. Event is logged (anonymized) for safety monitoring

## Configuration

### Environment Variables

```bash
# Enable/disable the feature
EMOTIONAL_RESET_ENABLED=true

# Maximum sessions per user per day
EMOTIONAL_RESET_RATE_LIMIT=10

# Session timeout in seconds (30 minutes default)
EMOTIONAL_RESET_SESSION_TIMEOUT=1800
```

## Frontend Components

### EmotionalResetWizard
The main wizard component that handles the complete 7-step flow.

```tsx
import { EmotionalResetWizard } from '@/components/emotional-reset'

<EmotionalResetWizard
  onComplete={() => console.log('Session complete')}
  onClose={() => setShowWizard(false)}
/>
```

### BreathingAnimation
Standalone breathing exercise component with animated visualization.

```tsx
import { BreathingAnimation } from '@/components/emotional-reset'

<BreathingAnimation
  pattern={{ inhale: 4, hold_in: 4, exhale: 4, hold_out: 4 }}
  durationSeconds={120}
  narration={["Breathe in...", "Hold...", "Breathe out..."]}
  onComplete={() => console.log('Exercise complete')}
/>
```

## Database Model

```python
class EmotionalResetSession(Base):
    id: str                     # Primary key (UUID)
    user_id: str                # Foreign key to users
    session_id: str             # Unique session identifier
    current_step: int           # Current step (1-7)
    emotions_input: str         # User's initial input
    assessment_data: dict       # AI assessment results
    wisdom_verses: list         # Selected wisdom insights
    affirmations: list          # Generated affirmations
    completed: bool             # Session completion status
    completed_at: datetime      # Completion timestamp
    journal_entry_id: str       # Optional linked journal entry
    created_at: datetime        # Session creation time
    updated_at: datetime        # Last activity time
```

## Response Guidelines

All AI responses follow these guidelines:
- Compassionate and non-judgmental tone
- No medical diagnoses or prescriptions
- Framed as "emotional reset" (not religious terminology)
- 50-150 words for mobile optimization
- Universal wisdom without citations
- Always end with 💙

## Accessibility

The feature includes:
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatible components
- Pause/resume functionality for breathing exercise
- High contrast visual elements

## Testing

Run the unit tests:

```bash
# Service tests
pytest tests/unit/test_emotional_reset_service.py -v

# Route tests
pytest tests/unit/test_emotional_reset_routes.py -v
```

## Integration Points

### Journal Auto-Creation (Future)
On session completion, an optional journal entry can be created:

```json
{
  "title": "Emotional Reset - December 3, 2024",
  "content": "Today I released anxiety. Key insight: Focus on actions, not outcomes. Affirmation: I am capable of handling challenges.",
  "tags": ["emotional-reset", "self-care"],
  "mood": "peaceful"
}
```

### Analytics (Future)
Anonymized tracking of:
- Session start/completion rates
- Average time per step
- Most common emotions
- Crisis detection triggers

## Version History

- **v1.0.0** - Initial release with 7-step guided flow

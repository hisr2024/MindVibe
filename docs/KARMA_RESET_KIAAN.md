# Karma Reset with KIAAN Integration

## Overview

The Karma Reset tool helps users acknowledge relational harm, take responsibility, and repair connections with compassion and wisdom. With KIAAN integration, the tool now incorporates ancient wisdom from the Bhagavad Gita to provide deeper, more meaningful guidance.

## What is Karma Reset?

Karma Reset is a 4-step compassionate ritual designed to:

1. **Pause & Breathe**: Center yourself before taking action
2. **Name the Ripple**: Acknowledge the impact of your actions
3. **Choose the Repair**: Select the appropriate way to repair harm
4. **Move with Intention**: Set intentions for future interactions

## KIAAN Enhancement

### What KIAAN Adds

The KIAAN (Knowledge-Informed Ancient Awareness Navigator) integration enhances Karma Reset by:

- **Wisdom Grounding**: Every response is informed by relevant Bhagavad Gita verses
- **Validation**: Guidance is validated to ensure alignment with timeless principles
- **Context**: Users see how many verses were used and the validation score
- **Discoverability**: Navigation to related KIAAN tools (Ardha, Viyoga, etc.)

### How It Works

1. User describes situation, who was affected, and repair type
2. System searches 700+ Gita verses for relevant wisdom
3. Top 3-5 verses inform the guidance generation
4. AI generates personalized 4-step reset plan
5. GitaValidator ensures quality and wisdom alignment
6. Response includes metadata about verses used

## API Documentation

### Endpoint

```
POST /api/karma-reset/kiaan/generate
```

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "situation": "I snapped at my colleague during a stressful meeting",
  "feeling": "My teammate who was trying to help",
  "repair_type": "apology"
}
```

**Fields**:

| Field        | Type   | Required | Description                                    |
|--------------|--------|----------|------------------------------------------------|
| `situation`  | string | Yes      | What happened (max 2000 chars)                 |
| `feeling`    | string | Yes      | Who felt the ripple/impact (max 500 chars)     |
| `repair_type`| string | Yes      | One of: `apology`, `clarification`, `calm_followup` |

### Response

**Success (200)**:
```json
{
  "reset_guidance": {
    "breathingLine": "Take four slow breaths. With each exhale, release the tension from that moment.",
    "rippleSummary": "Your words in a moment of stress created unease for someone trying to support you.",
    "repairAction": "Reach out with a simple, sincere acknowledgment: 'I spoke harshly when you were helping. That wasn't fair to you.'",
    "forwardIntention": "When stress rises, pause before speaking. Your words hold weight."
  },
  "kiaan_metadata": {
    "verses_used": 3,
    "verses": [
      {
        "verse_id": "16.1",
        "score": 0.85,
        "theme": "virtues",
        "sanitized_text": "Fearlessness, purity of heart, steadfastness in knowledge and yoga"
      },
      {
        "verse_id": "12.13",
        "score": 0.82,
        "theme": "forgiveness",
        "sanitized_text": "One who is not envious but a kind friend to all creatures"
      },
      {
        "verse_id": "17.15",
        "score": 0.78,
        "theme": "communication",
        "sanitized_text": "Words that cause no distress, truthful, pleasant and beneficial"
      }
    ],
    "validation_passed": true,
    "validation_score": 0.91,
    "gita_terms_found": ["compassion", "awareness", "balance"],
    "wisdom_context": "Ancient wisdom for apology:\nVerse 16.1: Fearlessness, purity of heart..."
  },
  "_meta": {
    "request_id": "a7f3c2",
    "processing_time_ms": 1340,
    "model_used": "gpt-4",
    "kiaan_enhanced": true
  }
}
```

**Error (500)**:
Returns fallback guidance even on error (never fails completely).

## Repair Types

### Apology

**When to use**: You caused harm and want to take responsibility

**Themes**: Forgiveness, humility, compassion

**Example verses**:
- 16.1: "Fearlessness, purity of heart, steadfastness..."
- 12.13: "One who is not envious but a kind friend..."

**Guidance style**: Sincere, brief, grounded acknowledgment

### Clarification

**When to use**: Misunderstanding occurred and you want to explain

**Themes**: Truth, communication, clarity

**Example verses**:
- 17.15: "Words that cause no distress, truthful, pleasant..."
- 2.47: "You have a right to action, but not to the fruits..."

**Guidance style**: Gentle explanation that invites understanding

### Calm Follow-up

**When to use**: Previous interaction was tense and you want to re-center

**Themes**: Equanimity, peace, emotional balance

**Example verses**:
- 2.48: "Perform your duty equipoised, abandoning attachment..."
- 6.19: "Like a lamp in a windless place, steady and unmoving..."

**Guidance style**: Warm reconnection that establishes peace

## Frontend Integration

### Using the Page

Navigate to `/tools/karma-reset` to access the KIAAN-enhanced interface.

**Features**:
- Sidebar with related KIAAN tools
- KIAAN badge showing verse count and validation
- Animated 4-step plan cards
- Responsive mobile-friendly design

### Component Usage

```tsx
import KarmaResetClient from '@/app/tools/karma-reset/KarmaResetClient'

export default function MyPage() {
  return <KarmaResetClient />
}
```

### Using Components Separately

```tsx
import { KiaanBadge, EcosystemNav } from '@/components/kiaan-ecosystem'

// Show KIAAN metadata
<KiaanBadge
  versesUsed={3}
  validationPassed={true}
  validationScore={0.91}
  showDetails={true}
/>

// Show related tools
<EcosystemNav 
  currentTool="karma-reset"
  relatedOnly={false}
/>
```

## Example Scenarios

### Scenario 1: Workplace Apology

**Input**:
```json
{
  "situation": "I dismissed my teammate's idea in front of the team",
  "feeling": "My colleague who was excited about their suggestion",
  "repair_type": "apology"
}
```

**Output includes**:
- Breathing exercise to center yourself
- Acknowledgment of impact on colleague's enthusiasm
- Specific apology language that's brief and sincere
- Intention to honor others' contributions going forward

**Verses used**: Humility (16.1), Compassion (12.13), Right action (3.19)

### Scenario 2: Relationship Clarification

**Input**:
```json
{
  "situation": "My text about needing space was misunderstood as ending the relationship",
  "feeling": "My partner who felt abandoned",
  "repair_type": "clarification"
}
```

**Output includes**:
- Breathing to approach with clarity
- Recognition of partner's fear and confusion
- Clear explanation of what you meant
- Commitment to communicate more clearly

**Verses used**: Truth (17.15), Communication (4.18), Understanding (2.50)

### Scenario 3: Family Calm Follow-up

**Input**:
```json
{
  "situation": "I raised my voice during a family dinner discussion",
  "feeling": "My parent who was just sharing their perspective",
  "repair_type": "calm_followup"
}
```

**Output includes**:
- Breathing to find inner calm
- Acknowledgment of tense moment
- Warm reconnection message
- Intention to respond with patience

**Verses used**: Equanimity (2.48), Peace (6.19), Balance (2.14)

## Technical Implementation

### Backend Flow

```
1. Request received at /api/karma-reset/kiaan/generate
2. KarmaResetService.get_reset_verses()
   - Maps repair_type to themes
   - Builds search query
   - Searches WisdomKB (read-only)
   - Returns top 5 verses
3. KarmaResetService.build_gita_context()
   - Formats verses into context string
4. OpenAI generates guidance with context
5. KarmaResetService.validate_reset_guidance()
   - Validates with GitaValidator
   - Returns validation results
6. Response assembled with metadata
7. Returns to client
```

### Verse Selection Algorithm

```python
# 1. Map repair type to themes
themes = REPAIR_TYPE_THEMES[repair_type]
# e.g., "apology" → ["forgiveness", "humility", "compassion"]

# 2. Build search query
query = f"{situation} {' '.join(theme_keywords)}"

# 3. Search verses
verses = await wisdom_kb.search_relevant_verses_full_db(
    db=db,
    query=query,
    limit=5
)

# 4. Score includes:
#    - Text similarity (0.0-1.0)
#    - Theme match boost (+0.2)
#    - Spiritual wellness tag boost (+0.2)

# 5. Return top N by score
```

### Validation Criteria

Guidance is validated against:

- **Gita terms**: Must contain wisdom vocabulary (dharma, karma, peace, etc.)
- **Forbidden terms**: Must not contain scientific/clinical language
- **Wisdom markers**: Should use timeless wisdom phrases
- **Length**: 200-500 words total across 4 parts
- **Tone**: Compassionate, non-judgmental, grounded

**Passing score**: > 0.6 (60% wisdom alignment)

## Privacy and Safety

### Data Handling

- **User input**: Processed in memory, not stored long-term
- **Verses**: Read-only access, no modifications
- **Responses**: Not logged with personal information
- **Metadata**: Aggregated for quality improvement only

### Safety Guardrails

- **Fallback**: Always provides guidance even if AI fails
- **Validation**: Ensures responses meet quality standards
- **No medical advice**: Explicitly avoids clinical/therapeutic language
- **Non-judgmental**: Maintains compassionate, supportive tone

### Ethical Considerations

- Wisdom is offered as perspective, not prescription
- Users maintain agency in how they repair relationships
- Cultural sensitivity in universal wisdom application
- Clear that this is guidance, not professional counseling

## Troubleshooting

### Common Issues

**Issue**: Response seems generic
- **Cause**: Short or vague situation description
- **Solution**: Provide more specific details about what happened

**Issue**: Wrong repair type suggested
- **Cause**: User selected type doesn't match situation
- **Solution**: Try different repair type or describe situation differently

**Issue**: Validation fails frequently
- **Cause**: Guidance too short or missing wisdom terms
- **Solution**: System automatically retries with fallback; no user action needed

### Error Handling

The system is designed to **never fail completely**:

1. If OpenAI unavailable → Use fallback guidance
2. If verse search fails → Continue with generic wisdom
3. If validation fails → Still return response (marked as unvalidated)
4. If database error → Use cached verses or fallback

## Metrics and Analytics

### Tracked Metrics

- Requests per repair type
- Average verses per response
- Validation pass rate
- Response generation time
- User engagement with ecosystem navigation

### Quality Indicators

- **Verse relevance score**: Should average > 0.7
- **Validation pass rate**: Target > 80%
- **Response time**: Target < 2 seconds
- **User completion rate**: Track full workflow completion

## Future Roadmap

### Planned Enhancements

1. **Verse exploration**: Allow users to read full verses used
2. **Personalization**: Learn user's preferred wisdom style
3. **Templates**: Pre-built scenarios for common situations
4. **Integration**: Connect with other MindVibe tools
5. **Analytics**: Show user's growth over time

### Research Questions

- Which repair types are most commonly used?
- What verse themes resonate most with users?
- How does validation score correlate with user satisfaction?
- Can we predict best repair type from situation text?

## Resources

### Related Documentation

- [KIAAN Ecosystem Integration Guide](./KIAAN_ECOSYSTEM_INTEGRATION.md)
- [GitaValidator Documentation](../backend/services/gita_validator.py)
- [WisdomKB Documentation](../backend/services/wisdom_kb.py)

### External Resources

- [Bhagavad Gita Overview](https://en.wikipedia.org/wiki/Bhagavad_Gita)
- [Non-Violent Communication](https://www.cnvc.org/)
- [Restorative Practices](https://www.iirp.edu/restorative-practices/what-is-restorative-practices)

## Support

For questions or issues:
- GitHub Issues: Tag with `karma-reset` and `kiaan-ecosystem`
- Email: support@mindvibe.app
- Documentation: `/docs` directory

---

*Last updated: 2024-12-09*
*Version: 1.0.0*

# KIAAN Ecosystem Integration Guide

## Overview

This document describes the complete integration of the KIAAN (Knowledge-Informed Ancient Awareness Navigator) ecosystem with the Karma Reset tool. The integration was designed with **zero-impact** principles to ensure complete backward compatibility.

## Architecture

### Design Principles

1. **Additive Only**: All changes are new files; no modifications to existing services
2. **Read-Only Access**: All database access via SELECT queries only
3. **Isolation**: New service layer completely isolated from existing services
4. **Backward Compatible**: Existing endpoints continue working independently
5. **Rollback Safe**: Remove new files, everything still works

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    KIAAN Ecosystem                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ KIAAN Chat   │  │ Karma Reset  │  │ Emotional    │     │
│  │ (Original)   │  │ (NEW KIAAN)  │  │ Reset        │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                          │                                  │
│                ┌─────────▼─────────┐                        │
│                │  KIAAN Services   │                        │
│                ├───────────────────┤                        │
│                │ KarmaResetService │ (NEW)                  │
│                │ WisdomKB          │ (READ-ONLY)            │
│                │ GitaValidator     │ (READ-ONLY)            │
│                │ GitaService       │ (READ-ONLY)            │
│                └───────────────────┘                        │
│                          │                                  │
│                ┌─────────▼─────────┐                        │
│                │   Database        │                        │
│                │ gita_verses (700) │                        │
│                └───────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Backend Integration

### New Service: `karma_reset_service.py`

**Location**: `backend/services/karma_reset_service.py`

**Purpose**: Provides read-only integration between Karma Reset and KIAAN wisdom engine.

**Key Features**:
- Maps repair types to relevant Gita themes
- Searches verses using `WisdomKnowledgeBase` (read-only)
- Builds wisdom context from retrieved verses
- Validates guidance using `GitaValidator`

**Repair Type Mappings**:

| Repair Type      | Themes                                    | Applications                                |
|------------------|-------------------------------------------|---------------------------------------------|
| `apology`        | forgiveness, humility, compassion         | forgiveness, compassion, humility           |
| `clarification`  | truth, communication, clarity             | clear_communication, truth, understanding   |
| `calm_followup`  | equanimity, peace, emotional_balance      | emotional_balance, peace, equanimity        |
| `self-forgive`   | self_compassion, acceptance, peace        | self_compassion, acceptance, inner_peace    |

**Methods**:

```python
async def get_reset_verses(db, repair_type, situation, limit=5)
    # Search for relevant Gita verses
    # Returns: list[dict] with verse, score, sanitized_text

def build_gita_context(verse_results, repair_type)
    # Format verses into wisdom context string
    # Returns: str

async def validate_reset_guidance(guidance, verse_context)
    # Validate using GitaValidator
    # Returns: dict with valid, issues, score
```

### New Route: `karma_reset_kiaan.py`

**Location**: `backend/routes/karma_reset_kiaan.py`

**Endpoint**: `POST /api/karma-reset/kiaan/generate`

**Purpose**: Enhanced karma reset endpoint with KIAAN metadata.

**Request Body**:
```json
{
  "situation": "I snapped at my colleague",
  "feeling": "My teammate",
  "repair_type": "apology"
}
```

**Response**:
```json
{
  "reset_guidance": {
    "breathingLine": "Take four slow breaths...",
    "rippleSummary": "Your words affected...",
    "repairAction": "Consider reaching out...",
    "forwardIntention": "Move forward with..."
  },
  "kiaan_metadata": {
    "verses_used": 3,
    "verses": [
      {
        "verse_id": "12.13",
        "score": 0.85,
        "theme": "forgiveness",
        "sanitized_text": "One who is not envious but a kind friend..."
      }
    ],
    "validation_passed": true,
    "validation_score": 0.92,
    "gita_terms_found": ["compassion", "forgiveness", "peace"],
    "wisdom_context": "Ancient wisdom for apology..."
  },
  "_meta": {
    "request_id": "abc123",
    "processing_time_ms": 1250,
    "model_used": "gpt-4",
    "kiaan_enhanced": true
  }
}
```

**Coexistence with Original Endpoint**:
- Original: `/api/karma-reset/generate` (unchanged)
- New KIAAN: `/api/karma-reset/kiaan/generate` (new)
- Both work independently
- No breaking changes to existing integrations

## Frontend Integration

### Type Definitions: `kiaan-ecosystem.types.ts`

**Location**: `types/kiaan-ecosystem.types.ts`

**Key Types**:
- `KiaanTool`: Tool configuration interface
- `KiaanMetadata`: KIAAN response metadata
- `KiaanResponse<T>`: Standard KIAAN-enhanced response wrapper
- `EcosystemNavProps`: Navigation component props
- `KiaanBadgeProps`: Badge component props

### API Layer: `kiaan-ecosystem.ts`

**Location**: `lib/api/kiaan-ecosystem.ts`

**Purpose**: Unified API for all KIAAN tools.

**Tool Registry**:
```typescript
export const KIAAN_TOOLS: KiaanTool[] = [
  { id: 'kiaan-chat', name: 'KIAAN Chat', ... },
  { id: 'karma-reset', name: 'Karma Reset', ... },
  { id: 'emotional-reset', name: 'Emotional Reset', ... },
  { id: 'ardha', name: 'Ardha', ... },
  { id: 'viyoga', name: 'Viyoga', ... },
  { id: 'karmic-tree', name: 'Karmic Tree', ... }
]
```

**Helper Functions**:
- `getKiaanTools()`: Get all enabled tools
- `getToolById(id)`: Get specific tool
- `getToolsByCategory(category)`: Filter by category
- `getRelatedTools(currentId)`: Get related tools
- `getEcosystemLinks(currentId, relatedOnly)`: Get navigation links

### Components

#### `EcosystemNav.tsx`

**Location**: `components/kiaan-ecosystem/EcosystemNav.tsx`

**Purpose**: Sidebar navigation showing related KIAAN tools.

**Usage**:
```tsx
<EcosystemNav 
  currentTool="karma-reset" 
  relatedOnly={false} 
/>
```

**Features**:
- Displays tool cards with icons, names, descriptions
- Hover effects and transitions
- "Powered by KIAAN" footer
- Responsive layout

#### `KiaanBadge.tsx`

**Location**: `components/kiaan-ecosystem/KiaanBadge.tsx`

**Purpose**: Badge displaying KIAAN metadata.

**Usage**:
```tsx
<KiaanBadge
  versesUsed={3}
  validationPassed={true}
  validationScore={0.92}
  showDetails={true}
/>
```

**Features**:
- Shows verse count and validation status
- Tooltip with detailed info on hover
- Color-coded based on validation
- Accessible design

### Karma Reset Page

**Location**: `app/tools/karma-reset/page.tsx`, `KarmaResetClient.tsx`

**Features**:
- 4-step reset workflow (input → breathing → plan → complete)
- Integration with `/api/karma-reset/kiaan/generate`
- Displays `KiaanBadge` with metadata
- Shows `EcosystemNav` in sidebar
- Responsive grid layout

**Flow**:
1. User enters situation, who felt it, repair type
2. Submit calls KIAAN endpoint
3. Breathing step shown with guidance
4. Reset plan displayed with animated cards
5. Navigation to related tools available

## Database Safety

### Read-Only Guarantees

All new code accesses the database in **read-only mode**:

```python
# ✅ SAFE: Read-only SELECT queries
await WisdomKB.search_relevant_verses_full_db(db, query, limit=5)
await GitaService.get_all_verses_with_tags(db)

# ❌ NEVER USED: Write operations
# db.add(...)
# db.delete(...)
# await db.commit()
```

### Database Integrity

- **Schema**: No changes to `gita_verses` table
- **Data**: No inserts, updates, or deletes
- **Count**: Remains at 700 verses
- **Migrations**: None required

## Testing Checklist

### Backend Tests

- [ ] Test `KarmaResetService.get_reset_verses()` with each repair type
- [ ] Test `KarmaResetService.build_gita_context()` formatting
- [ ] Test `KarmaResetService.validate_reset_guidance()` validation
- [ ] Test `/api/karma-reset/kiaan/generate` endpoint
- [ ] Verify KIAAN metadata in response
- [ ] Test error handling and fallbacks

### Frontend Tests

- [ ] Test `EcosystemNav` component rendering
- [ ] Test `KiaanBadge` component with various props
- [ ] Test `KarmaResetClient` workflow
- [ ] Test API integration and error states
- [ ] Verify responsive layout

### Integration Tests

- [ ] Verify original `/api/karma-reset/generate` still works
- [ ] Verify KIAAN Chat unchanged
- [ ] Verify Ardha, Viyoga unchanged
- [ ] Test database query count (read-only)
- [ ] Verify 700 verses in database

### Safety Verification

```bash
# Test existing KIAAN chat
curl -X POST /api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I am anxious"}'

# Verify database integrity
psql -c "SELECT COUNT(*) FROM gita_verses;" # Should return 700

# Test Ardha (unchanged)
curl -X POST /api/ardha/reframe \
  -d '{"negative_thought": "I fail"}'

# Test Viyoga (unchanged)
curl -X POST /api/viyoga/detach \
  -d '{"outcome_worry": "project"}'

# Test new KIAAN endpoint
curl -X POST /api/karma-reset/kiaan/generate \
  -H "Content-Type: application/json" \
  -d '{"situation": "hurtful words", "feeling": "friend", "repair_type": "apology"}'
```

## Rollback Plan

If issues arise, the integration can be safely rolled back:

### Step 1: Remove New Route Registration

In `backend/main.py`, remove:
```python
from backend.routes.karma_reset_kiaan import router as karma_reset_kiaan_router
app.include_router(karma_reset_kiaan_router)
```

### Step 2: Delete New Files

```bash
# Backend
rm backend/services/karma_reset_service.py
rm backend/routes/karma_reset_kiaan.py

# Frontend
rm -rf app/tools/karma-reset/
rm -rf components/kiaan-ecosystem/
rm lib/api/kiaan-ecosystem.ts
rm types/kiaan-ecosystem.types.ts

# Docs
rm docs/KIAAN_ECOSYSTEM_INTEGRATION.md
rm docs/KARMA_RESET_KIAAN.md
```

### Step 3: Verify System

All original functionality should work unchanged:
- KIAAN Chat functional
- Database at 700 verses
- Ardha, Viyoga functional
- No errors in logs

## Monitoring

### Success Metrics

- API response times for `/api/karma-reset/kiaan/generate`
- Validation pass rate
- Verse retrieval accuracy
- User engagement with ecosystem navigation

### Key Performance Indicators

- **Response Time**: < 2s for karma reset generation
- **Validation Rate**: > 80% of responses pass validation
- **Verse Relevance**: Average score > 0.7
- **Navigation CTR**: Track clicks on ecosystem links

## Future Enhancements

### Phase 2 (Optional)

1. Add verse preview cards in UI
2. Allow users to explore verses used
3. Add verse citation links to full text
4. Implement verse bookmarking
5. Create unified KIAAN dashboard

### Ecosystem Expansion

- Integrate other tools (Relationship Compass, etc.)
- Create cross-tool wisdom threads
- Build verse recommendation engine
- Add personalized wisdom journeys

## Support and Maintenance

### Troubleshooting

**Issue**: KIAAN endpoint returns 500 error
- **Check**: OpenAI API key configured
- **Check**: Database connection healthy
- **Solution**: Falls back to non-AI guidance

**Issue**: Validation always fails
- **Check**: GitaValidator configuration
- **Check**: Guidance text length (min 20 words)
- **Solution**: Adjust validation thresholds

**Issue**: No verses returned
- **Check**: Database has 700 verses
- **Check**: Search query formation
- **Solution**: Returns fallback guidance

### Contact

For questions or issues:
- Create GitHub issue with `kiaan-ecosystem` label
- Check logs in `/var/log/mindvibe/`
- Review error tracking dashboard

## Conclusion

The KIAAN ecosystem integration provides a powerful, safe, and extensible foundation for wisdom-powered tools. The zero-impact design ensures all existing functionality continues unchanged while enabling rich new experiences for users seeking guidance rooted in ancient wisdom.

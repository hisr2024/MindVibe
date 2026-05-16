"""
Karma Marg (Karma Journey) - Next-Generation Journey System for MindVibe.

This package provides:
1. AI-powered template generation with token budgets
2. Multi-journey management for users
3. Six Enemies (Shadripu) framework integration
4. Real-life modern examples with Gita wisdom

Architecture:
    ┌─────────────────────────────────────────────────────────────────┐
    │                     JOURNEY ENGINE                              │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  ┌──────────────────────────────────────────────────────────┐  │
    │  │            AI TEMPLATE GENERATOR                          │  │
    │  │                                                           │  │
    │  │  • Fixed token budgets per template/step                 │  │
    │  │  • Structured JSON output                                │  │
    │  │  • Six Enemies focused content                           │  │
    │  │  • Modern examples generation                            │  │
    │  └──────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │  ┌──────────────────────────────────────────────────────────┐  │
    │  │            MULTI-JOURNEY MANAGER                          │  │
    │  │                                                           │  │
    │  │  • Multiple concurrent journeys per user                 │  │
    │  │  • Enemy progress tracking                               │  │
    │  │  • Daily step delivery                                   │  │
    │  │  • Recommendations engine                                │  │
    │  └──────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │  ┌──────────────────────────────────────────────────────────┐  │
    │  │            MODERN EXAMPLES DATABASE                       │  │
    │  │                                                           │  │
    │  │  • Real-life scenarios per enemy                         │  │
    │  │  • Gita verse connections                                │  │
    │  │  • Practical application contexts                        │  │
    │  └──────────────────────────────────────────────────────────┘  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
"""

from .template_generator import (
    JourneyTemplateGenerator,
    TemplateGenerationConfig,
    GeneratedTemplate,
    GeneratedStep,
)
from .karma_marg_service import (
    KarmaMargService,
    MultiJourneyManager,
    EnemyProgressTracker,
)
from .modern_examples import (
    ModernExamplesDB,
    EnemyExample,
)

__all__ = [
    # Template Generation
    "JourneyTemplateGenerator",
    "TemplateGenerationConfig",
    "GeneratedTemplate",
    "GeneratedStep",
    # Journey Management
    "KarmaMargService",
    "MultiJourneyManager",
    "EnemyProgressTracker",
    # Modern Examples
    "ModernExamplesDB",
    "EnemyExample",
]

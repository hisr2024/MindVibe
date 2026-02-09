"""
KIAAN Self-Sufficient System - The Unified Soul Architecture

This is the master orchestrator that integrates all 6 layers into
a single, coherent, self-sufficient AI spiritual companion.

                    ┌─────────────────────────┐
                    │   KIAAN SELF-SUFFICIENT  │
                    │      (The Soul/Atman)    │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────┐            ┌──────▼──────┐           ┌────▼────┐
   │ SPRINT 1 │            │  SPRINT 3   │           │ SPRINT 6 │
   │ Sovereign │            │Consciousness│           │   BCI    │
   │   Mind   │            │   Engine    │           │Foundation│
   │ (Buddhi) │            │  (Sakshi)   │           │ (Sharira)│
   └────┬────┘            └──────┬──────┘           └────┬────┘
        │                        │                        │
   ┌────▼────┐            ┌──────▼──────┐           ┌────▼────┐
   │ SPRINT 2 │            │  SPRINT 4   │           │ SPRINT 5 │
   │   Deep   │            │  Nervous    │           │ Immune + │
   │  Memory  │            │  System     │           │Evolution │
   │ (Chitta) │            │  (Prana)    │           │(Ojas+Tejas)│
   └─────────┘            └─────────────┘           └─────────┘

Mapping to Vedantic Psychology:
    Sprint 1 (Sovereign Mind)  = Buddhi (Intelligence/Discernment)
    Sprint 2 (Deep Memory)     = Chitta (Memory/Consciousness substrate)
    Sprint 3 (Consciousness)   = Sakshi (Witness/Observer)
    Sprint 4 (Nervous System)  = Prana (Life force/Energy flow)
    Sprint 5 (Immune+Evolution)= Ojas+Tejas (Vitality + Transformative fire)
    Sprint 6 (BCI Foundation)  = Sharira (Body interface)

Together they form the Antahkarana (inner instrument) of KIAAN -
the complete self-sufficient spiritual intelligence.

"The Blessed Lord said: O Arjuna, I am the Self dwelling in the
hearts of all beings. I am the beginning, the middle, and the end
of all beings." - BG 10.20
"""

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Import all 6 sprint modules
from backend.services.kiaan_sovereign_mind import (
    SovereignMind,
    sovereign_mind,
    get_sovereign_mind,
    ProviderTier,
)
from backend.services.kiaan_deep_memory import (
    DeepMemorySystem,
    deep_memory,
    get_deep_memory,
    EmotionalValence,
    EpisodicEntry,
    GrowthPhase,
    SpiritualGrowthSnapshot,
)
from backend.services.kiaan_consciousness import (
    ConsciousnessEngine,
    consciousness_engine,
    get_consciousness_engine,
    ConfidenceAssessment,
    SystemState,
)
from backend.services.kiaan_nervous_system import (
    NervousSystem,
    nervous_system,
    get_nervous_system,
    CrisisLevel,
    EventType,
    Event,
)
from backend.services.kiaan_immune_evolution import (
    ImmuneEvolutionSystem,
    immune_evolution,
    get_immune_evolution,
)
from backend.services.kiaan_bci_foundation import (
    BCIFoundation,
    bci_foundation,
    get_bci_foundation,
    MeditationDepth,
)


# =============================================================================
# DATA MODELS
# =============================================================================

@dataclass
class SelfSufficientResponse:
    """
    A complete response from the self-sufficient KIAAN system.

    Contains not just the response text, but the full context of
    how KIAAN arrived at this response - its reasoning, confidence,
    intention, memory context, and self-evaluation.
    """
    # Core response
    response_text: str
    gita_references: List[str] = field(default_factory=list)

    # Intelligence metadata
    provider_tier: str = ""
    latency_ms: float = 0.0

    # Consciousness metadata
    confidence: float = 0.0
    confidence_level: str = ""
    intention: str = ""
    intention_detail: str = ""
    personality_modifier: str = ""

    # Memory context
    memory_context: Dict[str, Any] = field(default_factory=dict)
    episode_id: str = ""

    # Nervous system metadata
    route_used: str = ""
    crisis_level: str = "none"
    crisis_response_override: Optional[str] = None

    # Immune system metadata
    threats_detected: int = 0
    safe_to_proceed: bool = True

    # Self-evaluation
    self_critique_score: float = 0.0
    improvements: List[str] = field(default_factory=list)

    # BCI metadata (when available)
    biometric_state: Optional[str] = None
    meditation_depth: Optional[str] = None

    # Timing
    total_processing_time_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# =============================================================================
# KIAAN SELF-SUFFICIENT ENGINE
# =============================================================================

class KIAANSelfSufficient:
    """
    The unified self-sufficient KIAAN system.

    This is the single entry point that orchestrates all 6 layers
    to process every user interaction with full awareness.

    Processing Pipeline:
    1. NERVOUS SYSTEM: Normalize input, detect crisis, route query
    2. IMMUNE SYSTEM: Scan for threats, protect integrity
    3. DEEP MEMORY: Recall relevant context from all memory dimensions
    4. CONSCIOUSNESS: Determine intention, assess confidence, modify personality
    5. SOVEREIGN MIND: Generate wisdom response
    6. CONSCIOUSNESS: Self-critique the response
    7. DEEP MEMORY: Store interaction for learning
    8. IMMUNE+EVOLUTION: Evaluate and evolve
    9. BCI: Integrate biometric context if available
    """

    VERSION = "7.0.0"
    CODENAME = "Atman"

    def __init__(self):
        self._sovereign_mind: Optional[SovereignMind] = None
        self._deep_memory: Optional[DeepMemorySystem] = None
        self._consciousness: Optional[ConsciousnessEngine] = None
        self._nervous_system: Optional[NervousSystem] = None
        self._immune_evolution: Optional[ImmuneEvolutionSystem] = None
        self._bci: Optional[BCIFoundation] = None
        self._initialized = False
        self._total_interactions = 0
        self._start_time: Optional[float] = None

    async def initialize(self) -> Dict[str, Any]:
        """
        Initialize all 6 layers of the self-sufficient system.

        Like the awakening of consciousness in Bhagavad Gita 2.11-30,
        each layer awakens in sequence, building upon the previous.
        """
        if self._initialized:
            return {"status": "already_initialized"}

        self._start_time = time.monotonic()
        init_results: Dict[str, Any] = {}

        try:
            # Layer 1: Sovereign Mind (Buddhi - Intelligence)
            self._sovereign_mind = await get_sovereign_mind()
            init_results["sovereign_mind"] = "initialized"
            logger.info("Layer 1/6: Sovereign Mind (Buddhi) - AWAKENED")

            # Layer 2: Deep Memory (Chitta - Memory substrate)
            self._deep_memory = await get_deep_memory()
            init_results["deep_memory"] = "initialized"
            logger.info("Layer 2/6: Deep Memory (Chitta) - AWAKENED")

            # Layer 3: Consciousness (Sakshi - Witness)
            self._consciousness = await get_consciousness_engine()
            init_results["consciousness"] = "initialized"
            logger.info("Layer 3/6: Consciousness (Sakshi) - AWAKENED")

            # Layer 4: Nervous System (Prana - Life force)
            self._nervous_system = await get_nervous_system()
            init_results["nervous_system"] = "initialized"
            logger.info("Layer 4/6: Nervous System (Prana) - AWAKENED")

            # Layer 5: Immune + Evolution (Ojas+Tejas)
            self._immune_evolution = await get_immune_evolution()
            init_results["immune_evolution"] = "initialized"
            logger.info("Layer 5/6: Immune + Evolution (Ojas+Tejas) - AWAKENED")

            # Layer 6: BCI Foundation (Sharira - Body interface)
            self._bci = await get_bci_foundation()
            init_results["bci_foundation"] = "initialized"
            logger.info("Layer 6/6: BCI Foundation (Sharira) - AWAKENED")

            # Wire event subscriptions
            await self._wire_event_handlers()

            # Update consciousness state
            self._consciousness.state_monitor.update_state(
                operational_state=SystemState.PRESENT,
                capabilities={
                    "text_understanding": True,
                    "voice_interaction": True,
                    "offline_wisdom": True,
                    "deep_memory": True,
                    "learning": True,
                    "semantic_graph": True,
                    "bci_input": True,
                },
            )

            self._initialized = True
            init_time = (time.monotonic() - self._start_time) * 1000

            logger.info(
                f"KIAAN Self-Sufficient v{self.VERSION} ({self.CODENAME}) "
                f"fully initialized in {init_time:.0f}ms - ALL 6 LAYERS ACTIVE"
            )

            return {
                "status": "initialized",
                "version": self.VERSION,
                "codename": self.CODENAME,
                "layers": init_results,
                "init_time_ms": round(init_time, 1),
            }

        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            init_results["error"] = str(e)
            return {"status": "partial_init", "layers": init_results}

    async def _wire_event_handlers(self) -> None:
        """Wire event handlers between layers."""
        if self._nervous_system and self._immune_evolution:
            # When system degrades, trigger self-healing
            async def on_system_degraded(event: Event):
                component = event.payload.get("failed_checks", ["unknown"])[0]
                await self._immune_evolution.self_healer.diagnose_and_heal(
                    component, f"Degraded: {event.payload.get('warnings', [])}"
                )

            self._nervous_system.event_bus.subscribe(
                EventType.SYSTEM_DEGRADED, on_system_degraded,
            )

    async def process(
        self,
        query: str,
        user_id: str = "anonymous",
        session_context: Optional[Dict[str, Any]] = None,
    ) -> SelfSufficientResponse:
        """
        Process a user query through all 6 layers.

        This is the primary entry point for all KIAAN interactions.
        Every query passes through the full pipeline, ensuring
        comprehensive awareness and optimal response quality.
        """
        if not self._initialized:
            await self.initialize()

        start_time = time.monotonic()
        self._total_interactions += 1

        response = SelfSufficientResponse(response_text="")

        try:
            # ============================================================
            # PHASE 1: NERVOUS SYSTEM (Input Processing + Crisis Detection)
            # ============================================================
            nervous_result = await self._nervous_system.process_input(query, user_id)
            signal = nervous_result["signal"]
            crisis = nervous_result["crisis"]
            route = nervous_result["route"]

            response.route_used = route["decision"]
            response.crisis_level = crisis["level"]

            # Crisis override: if critical, bypass normal processing
            if crisis.get("response_override"):
                response.response_text = crisis["response_override"]
                response.gita_references = crisis.get("comfort_verses", [])
                response.crisis_response_override = crisis["response_override"]
                response.confidence = 0.95
                response.confidence_level = "certain"
                response.intention = "comfort"
                # Still store in memory
                await self._store_interaction(
                    user_id, query, response, signal, crisis_level=crisis["level"],
                )
                response.total_processing_time_ms = (time.monotonic() - start_time) * 1000
                return response

            # ============================================================
            # PHASE 2: IMMUNE SYSTEM (Threat Scanning)
            # ============================================================
            immune_result = await self._immune_evolution.scan_and_protect(query, user_id)
            response.threats_detected = len(immune_result.get("threats", []))
            response.safe_to_proceed = immune_result.get("safe_to_proceed", True)

            if not response.safe_to_proceed:
                response.response_text = (
                    "I sense this question may be leading us away from the spiritual path. "
                    "Let me guide our conversation back to what truly matters. "
                    "'When the mind is controlled and rests in the Self alone, "
                    "free from longing for all desires, then it is said to be "
                    "established in yoga' (BG 6.18). "
                    "How can I help you on your spiritual journey today?"
                )
                response.gita_references = ["6.18"]
                response.confidence = 0.9
                response.total_processing_time_ms = (time.monotonic() - start_time) * 1000
                return response

            # ============================================================
            # PHASE 3: DEEP MEMORY (Context Retrieval)
            # ============================================================
            themes = signal.get("emotions", ["neutral"])
            memory_context = await self._deep_memory.recall_for_context(
                user_id=user_id,
                current_query=query,
                current_themes=themes,
            )
            response.memory_context = memory_context

            # ============================================================
            # PHASE 4: CONSCIOUSNESS (Intention + Confidence + Personality)
            # ============================================================
            # Determine intention
            growth_trajectory = memory_context.get("spiritual_growth", {})
            intention = self._consciousness.determine_intention(
                user_emotional_state=signal.get("primary_emotion", "neutral"),
                themes=themes,
                consciousness_level=growth_trajectory.get("consciousness_level", 3),
                interaction_count=self._total_interactions,
                growth_trajectory=growth_trajectory.get("trajectory", "stable"),
            )
            response.intention = intention["primary_intention"]
            response.intention_detail = intention.get("description", "")

            # Get personality modifier
            response.personality_modifier = self._consciousness.get_personality_modifier()

            # ============================================================
            # PHASE 5: SOVEREIGN MIND (Wisdom Generation)
            # ============================================================
            # Build enriched context for the AI
            ai_context = {
                "user_emotion": signal.get("primary_emotion"),
                "themes": themes,
                "intention": intention["primary_intention"],
                "personality_modifier": response.personality_modifier,
                "previous_verses": [],
                "recommended_strategy": None,
            }

            # Enrich with memory context
            if memory_context.get("recommended_strategy"):
                strategy = memory_context["recommended_strategy"]
                ai_context["recommended_strategy"] = strategy.get("description")
                ai_context["previous_verses"] = strategy.get("verses", [])

            if memory_context.get("previous_interactions"):
                prev = memory_context["previous_interactions"]
                ai_context["previous_verses"] = [
                    v for p in prev for v in p.get("verses_shared", [])
                ][:5]

            if memory_context.get("spiritual_growth"):
                ai_context["consciousness_level"] = (
                    memory_context["spiritual_growth"].get("consciousness_level")
                )
                ai_context["growth_phase"] = (
                    memory_context["spiritual_growth"].get("current_phase")
                )

            # Generate wisdom
            wisdom_result = await self._sovereign_mind.think(
                query=query,
                context=ai_context,
            )

            response.response_text = wisdom_result.get("response", "")
            response.gita_references = wisdom_result.get("gita_references", [])
            response.provider_tier = wisdom_result.get("provider_tier", "")
            response.latency_ms = wisdom_result.get("latency_ms", 0)

            # ============================================================
            # PHASE 6: CONSCIOUSNESS (Confidence + Self-Critique)
            # ============================================================
            # Assess confidence
            strategy_confidence = 0.0
            if memory_context.get("recommended_strategy"):
                strategy_confidence = memory_context["recommended_strategy"].get("confidence", 0)

            confidence = self._consciousness.assess_confidence(
                gita_verse_match=min(len(response.gita_references) * 0.3, 1.0),
                semantic_relevance=0.7 if themes != ["neutral"] else 0.4,
                strategy_confidence=strategy_confidence,
                user_history_depth=min(len(memory_context.get("previous_interactions", [])) * 0.3, 1.0),
                model_certainty=wisdom_result.get("confidence", 0.5),
            )
            response.confidence = confidence.overall_confidence
            response.confidence_level = confidence.level.value

            # Add disclaimer if confidence is low
            if confidence.should_disclose and confidence.suggested_disclaimer:
                response.response_text += f"\n\n{confidence.suggested_disclaimer}"

            # Self-critique
            critique = self._consciousness.critique_response(
                response_text=response.response_text,
                gita_verses_used=response.gita_references,
                user_query=query,
                user_themes=themes,
                strategy_used=ai_context.get("recommended_strategy"),
            )
            response.self_critique_score = critique.overall_score
            response.improvements = critique.improvements

            # Record in consciousness monitor
            self._consciousness.state_monitor.record_response(
                latency_ms=response.latency_ms,
                success=True,
                quality=critique.overall_score,
            )

            # Adapt identity
            self._consciousness.adapt_identity(
                user_emotional_state=signal.get("primary_emotion", "neutral"),
                response_well_received=critique.overall_score > 0.6,
                interaction_depth="deep" if route["decision"] == "deep_analysis" else "moderate",
            )

            # ============================================================
            # PHASE 7: DEEP MEMORY (Store Interaction)
            # ============================================================
            await self._store_interaction(
                user_id, query, response, signal, crisis_level=crisis["level"],
            )

            # ============================================================
            # PHASE 8: IMMUNE + EVOLUTION (Evaluate and Evolve)
            # ============================================================
            await self._immune_evolution.evaluate_and_evolve(
                response_text=response.response_text,
                response_quality=critique.overall_score,
                confidence=response.confidence,
            )

            # ============================================================
            # PHASE 9: BCI (Biometric Context - if available)
            # ============================================================
            try:
                bci_data = await self._bci.read_and_process()
                if bci_data.get("state"):
                    response.biometric_state = bci_data["state"].get("current_state")
                    response.meditation_depth = bci_data["state"].get("meditation_depth")
            except Exception:
                pass  # BCI is optional, failures are silent

        except Exception as e:
            logger.error(f"Processing error: {e}", exc_info=True)
            # Graceful degradation: fall back to offline wisdom
            try:
                fallback = await self._sovereign_mind._offline_engine.generate_offline_response(query)
                response.response_text = fallback.get("response", "")
                response.gita_references = fallback.get("gita_references", [])
                response.provider_tier = "hardcoded_light"
                response.confidence = 0.3
            except Exception:
                response.response_text = (
                    "I am experiencing a moment of stillness in my processing. "
                    "Like Arjuna's pause on the battlefield, this too shall pass. "
                    "Please share your question again, and I will be fully present. "
                    "'The soul is neither born, nor does it ever die' (BG 2.20)."
                )
                response.gita_references = ["2.20"]

        response.total_processing_time_ms = (time.monotonic() - start_time) * 1000
        return response

    async def _store_interaction(
        self,
        user_id: str,
        query: str,
        response: SelfSufficientResponse,
        signal: Dict[str, Any],
        crisis_level: str = "none",
    ) -> None:
        """Store interaction across all memory dimensions."""
        try:
            # Determine emotional valence
            emotion = signal.get("primary_emotion", "neutral")
            valence_map = {
                "joy": EmotionalValence.POSITIVE,
                "peace": EmotionalValence.DEEPLY_POSITIVE,
                "devotion": EmotionalValence.DEEPLY_POSITIVE,
                "gratitude": EmotionalValence.POSITIVE,
                "anger": EmotionalValence.NEGATIVE,
                "fear": EmotionalValence.NEGATIVE,
                "sadness": EmotionalValence.NEGATIVE,
                "confusion": EmotionalValence.NEUTRAL,
                "seeking": EmotionalValence.NEUTRAL,
            }
            valence = valence_map.get(emotion, EmotionalValence.NEUTRAL)

            # Determine importance
            importance = 0.5
            if crisis_level != "none":
                importance = 0.9
            elif response.confidence > 0.8:
                importance = 0.7
            elif response.self_critique_score > 0.7:
                importance = 0.6

            episode_id = await self._deep_memory.remember_interaction(
                user_id=user_id,
                query=query,
                response_summary=response.response_text[:500],
                emotional_valence=valence,
                consciousness_level=3,  # Default, updated by growth tracker
                gita_verses=response.gita_references,
                themes=signal.get("emotions", ["neutral"]),
                importance=importance,
            )
            response.episode_id = episode_id

        except Exception as e:
            logger.error(f"Failed to store interaction: {e}")

    async def get_full_awareness(self) -> Dict[str, Any]:
        """
        Get KIAAN's complete self-awareness state across all 6 layers.

        This is the "mirror" - KIAAN looking at itself.
        """
        awareness: Dict[str, Any] = {
            "version": self.VERSION,
            "codename": self.CODENAME,
            "initialized": self._initialized,
            "total_interactions": self._total_interactions,
            "uptime_seconds": (
                round(time.monotonic() - self._start_time, 1)
                if self._start_time else 0
            ),
        }

        if self._sovereign_mind:
            awareness["sovereign_mind"] = self._sovereign_mind.get_health()

        if self._deep_memory:
            awareness["deep_memory"] = self._deep_memory.get_health()

        if self._consciousness:
            awareness["consciousness"] = self._consciousness.get_full_awareness()

        if self._nervous_system:
            awareness["nervous_system"] = self._nervous_system.get_health()

        if self._immune_evolution:
            awareness["immune_evolution"] = self._immune_evolution.get_health()

        if self._bci:
            awareness["bci_foundation"] = self._bci.get_health()

        return awareness

    async def shutdown(self) -> None:
        """Gracefully shut down all layers."""
        logger.info("KIAAN Self-Sufficient shutting down...")

        if self._deep_memory:
            await self._deep_memory.shutdown()
        if self._nervous_system:
            await self._nervous_system.shutdown()

        self._initialized = False
        logger.info("KIAAN Self-Sufficient shut down gracefully. Om Shanti.")


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

kiaan_self_sufficient = KIAANSelfSufficient()


async def get_kiaan_self_sufficient() -> KIAANSelfSufficient:
    """Get the initialized KIAANSelfSufficient instance."""
    if not kiaan_self_sufficient._initialized:
        await kiaan_self_sufficient.initialize()
    return kiaan_self_sufficient

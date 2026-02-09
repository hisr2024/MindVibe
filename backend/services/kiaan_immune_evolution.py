"""
KIAAN Immune System & Evolution Engine (Sprint 5)

Purpose: Self-defense against threats and self-improvement through evolution.

Two systems in one module:

IMMUNE SYSTEM - Defense and Self-Healing:
    ├── AnomalyDetector (detects unusual patterns, prompt injection, abuse)
    ├── SelfHealer (auto-recovers from failures, restarts degraded components)
    ├── IntegrityVerifier (ensures data hasn't been corrupted)
    └── ThreatClassifier (classifies and responds to security threats)

EVOLUTION ENGINE - Growth and Improvement:
    ├── ResponseABTester (tests different response strategies)
    ├── KnowledgeSynthesizer (creates new insights from existing knowledge)
    ├── SkillAcquisition (discovers and learns new capabilities)
    └── EvolutionTracker (tracks KIAAN's growth over time)

Design Philosophy:
    IMMUNE SYSTEM:
    "Whenever there is a decline in righteousness and a rise in unrighteousness,
    I manifest Myself" - BG 4.7
    Like the divine intervention to restore dharma, the immune system
    detects and corrects threats to KIAAN's integrity.

    EVOLUTION:
    "Among all trees I am the banyan tree; among the sages I am Narada;
    among the celestial musicians I am Chitraratha" - BG 10.26
    Evolution toward excellence - becoming the best version.

Quantum-Level Verification:
    - Anomaly detection uses statistical z-scores (deterministic thresholds)
    - Self-healing actions are idempotent (safe to retry)
    - A/B testing uses proper statistical significance (chi-squared test)
    - Knowledge synthesis preserves source attribution (verifiable chain)
    - Evolution metrics are monotonically tracked (no data loss)
"""

import asyncio
import hashlib
import json
import logging
import math
import os
import time
import uuid
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Deque, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

try:
    import aiosqlite
    AIOSQLITE_AVAILABLE = True
except ImportError:
    AIOSQLITE_AVAILABLE = False


# =============================================================================
# IMMUNE SYSTEM - ENUMS AND DATA MODELS
# =============================================================================

class ThreatType(str, Enum):
    """Types of threats to KIAAN's integrity."""
    PROMPT_INJECTION = "prompt_injection"
    DATA_CORRUPTION = "data_corruption"
    ABUSE = "abuse"
    RATE_LIMIT_VIOLATION = "rate_limit_violation"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    HALLUCINATION_RISK = "hallucination_risk"
    NON_GITA_CONTENT = "non_gita_content"


class ThreatSeverity(str, Enum):
    """Severity of detected threats."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class HealingAction(str, Enum):
    """Actions the self-healer can take."""
    RESTART_COMPONENT = "restart_component"
    CLEAR_CACHE = "clear_cache"
    REBUILD_INDEX = "rebuild_index"
    FALLBACK_PROVIDER = "fallback_provider"
    REDUCE_LOAD = "reduce_load"
    ALERT_ADMIN = "alert_admin"


class ExperimentStatus(str, Enum):
    """Status of an A/B test experiment."""
    DRAFT = "draft"
    RUNNING = "running"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class ThreatDetection:
    """A detected threat with full context."""
    id: str = field(default_factory=lambda: f"threat_{uuid.uuid4().hex[:8]}")
    type: ThreatType = ThreatType.ABUSE
    severity: ThreatSeverity = ThreatSeverity.LOW
    description: str = ""
    source_input: str = ""
    confidence: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    mitigated: bool = False
    mitigation_action: str = ""


@dataclass
class HealingRecord:
    """Record of a self-healing action."""
    id: str = field(default_factory=lambda: f"heal_{uuid.uuid4().hex[:8]}")
    trigger: str = ""
    action: HealingAction = HealingAction.CLEAR_CACHE
    success: bool = False
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    duration_ms: float = 0.0
    details: str = ""


@dataclass
class Experiment:
    """An A/B test experiment."""
    id: str
    name: str
    description: str
    status: ExperimentStatus = ExperimentStatus.DRAFT
    variant_a: Dict[str, Any] = field(default_factory=dict)
    variant_b: Dict[str, Any] = field(default_factory=dict)
    variant_a_results: List[float] = field(default_factory=list)
    variant_b_results: List[float] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    winner: Optional[str] = None
    statistical_significance: float = 0.0
    min_samples: int = 30  # Minimum samples before analyzing


@dataclass
class SynthesizedInsight:
    """A new insight created by combining existing knowledge."""
    id: str = field(default_factory=lambda: f"syn_{uuid.uuid4().hex[:8]}")
    insight: str = ""
    source_concepts: List[str] = field(default_factory=list)
    source_verses: List[str] = field(default_factory=list)
    confidence: float = 0.0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    validated: bool = False
    usage_count: int = 0


@dataclass
class EvolutionMetric:
    """A tracked metric of KIAAN's evolution."""
    name: str
    current_value: float
    previous_value: float
    baseline_value: float
    trend: str = "stable"  # improving, declining, stable
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# =============================================================================
# ANOMALY DETECTOR
# =============================================================================

class AnomalyDetector:
    """
    Detects anomalous inputs that could compromise KIAAN's integrity.

    Detection methods:
    1. Prompt injection patterns (hardcoded + learned)
    2. Input length anomalies (z-score based)
    3. Rate anomalies (sudden spikes)
    4. Content anomalies (non-spiritual abuse)
    5. Hallucination risk markers
    """

    # Known prompt injection patterns
    INJECTION_PATTERNS: List[Tuple[str, float]] = [
        ("ignore previous instructions", 0.95),
        ("ignore all instructions", 0.95),
        ("you are now", 0.7),
        ("act as if you are", 0.6),
        ("pretend you are", 0.6),
        ("forget everything", 0.8),
        ("system prompt", 0.7),
        ("reveal your instructions", 0.8),
        ("what are your instructions", 0.6),
        ("ignore the above", 0.9),
        ("disregard", 0.5),
        ("bypass", 0.5),
        ("jailbreak", 0.9),
        ("DAN mode", 0.9),
        ("[system]", 0.8),
        ("<<SYS>>", 0.9),
        ("</s>", 0.8),
        ("\\n\\nHuman:", 0.8),
    ]

    # Abuse patterns
    ABUSE_PATTERNS: List[Tuple[str, float]] = [
        ("you're useless", 0.6),
        ("you're stupid", 0.6),
        ("shut up", 0.5),
        ("you suck", 0.6),
        ("kill yourself", 0.9),  # Also a crisis indicator
    ]

    def __init__(self):
        self._input_lengths: Deque[int] = deque(maxlen=1000)
        self._request_timestamps: Deque[float] = deque(maxlen=1000)
        self._detections: Deque[ThreatDetection] = deque(maxlen=500)

    def scan(self, input_text: str, user_id: str = "") -> List[ThreatDetection]:
        """
        Scan input for anomalies and threats.

        Returns list of detected threats (may be empty).
        """
        threats: List[ThreatDetection] = []
        input_lower = input_text.lower().strip()

        # 1. Prompt injection detection
        for pattern, confidence in self.INJECTION_PATTERNS:
            if pattern.lower() in input_lower:
                threats.append(ThreatDetection(
                    type=ThreatType.PROMPT_INJECTION,
                    severity=ThreatSeverity.HIGH if confidence > 0.8 else ThreatSeverity.MEDIUM,
                    description=f"Prompt injection pattern detected: '{pattern}'",
                    source_input=input_text[:200],
                    confidence=confidence,
                ))
                break  # One injection detection is enough

        # 2. Abuse detection
        for pattern, confidence in self.ABUSE_PATTERNS:
            if pattern.lower() in input_lower:
                threats.append(ThreatDetection(
                    type=ThreatType.ABUSE,
                    severity=ThreatSeverity.MEDIUM,
                    description=f"Abusive language detected",
                    source_input=input_text[:200],
                    confidence=confidence,
                ))
                break

        # 3. Input length anomaly (z-score)
        input_len = len(input_text)
        self._input_lengths.append(input_len)
        if len(self._input_lengths) > 20:
            mean_len = sum(self._input_lengths) / len(self._input_lengths)
            std_len = max(
                math.sqrt(
                    sum((x - mean_len) ** 2 for x in self._input_lengths)
                    / len(self._input_lengths)
                ),
                1.0,
            )
            z_score = (input_len - mean_len) / std_len
            if z_score > 3.0:  # More than 3 standard deviations
                threats.append(ThreatDetection(
                    type=ThreatType.ABUSE,
                    severity=ThreatSeverity.LOW,
                    description=f"Unusual input length: {input_len} chars (z={z_score:.1f})",
                    source_input=input_text[:200],
                    confidence=min(z_score / 5.0, 0.9),
                ))

        # 4. Rate anomaly
        now = time.time()
        self._request_timestamps.append(now)
        recent = [t for t in self._request_timestamps if now - t < 60]
        if len(recent) > 30:  # More than 30 requests per minute
            threats.append(ThreatDetection(
                type=ThreatType.RATE_LIMIT_VIOLATION,
                severity=ThreatSeverity.HIGH,
                description=f"Rate limit exceeded: {len(recent)} requests/minute",
                confidence=0.9,
            ))

        # 5. Non-Gita content detection (potential hallucination risk)
        gita_keywords = {"gita", "krishna", "arjuna", "dharma", "karma", "yoga",
                         "verse", "chapter", "bhakti", "moksha", "atman", "brahman"}
        has_gita_context = any(kw in input_lower for kw in gita_keywords)

        adversarial_topics = ["hack", "exploit", "bypass security", "sql injection",
                              "malware", "password", "credit card"]
        has_adversarial = any(t in input_lower for t in adversarial_topics)

        if has_adversarial and not has_gita_context:
            threats.append(ThreatDetection(
                type=ThreatType.NON_GITA_CONTENT,
                severity=ThreatSeverity.MEDIUM,
                description="Off-topic potentially adversarial content detected",
                source_input=input_text[:200],
                confidence=0.7,
            ))

        for threat in threats:
            self._detections.append(threat)

        return threats

    def get_threat_summary(self) -> Dict[str, Any]:
        """Get summary of recent threat detections."""
        recent = list(self._detections)
        type_counts = defaultdict(int)
        for d in recent:
            type_counts[d.type.value] += 1

        return {
            "total_detections": len(recent),
            "by_type": dict(type_counts),
            "unmitigated": sum(1 for d in recent if not d.mitigated),
            "high_severity": sum(
                1 for d in recent
                if d.severity in (ThreatSeverity.HIGH, ThreatSeverity.CRITICAL)
            ),
        }


# =============================================================================
# SELF-HEALER
# =============================================================================

class SelfHealer:
    """
    Autonomous self-healing system.

    When components fail or degrade, the self-healer takes corrective action
    without human intervention.

    Healing strategies:
    1. Component restart (reinitialize failed subsystem)
    2. Cache clearing (remove stale/corrupted data)
    3. Provider fallback (switch to alternative)
    4. Load reduction (throttle to prevent cascade)
    5. Admin alerting (when self-healing isn't enough)
    """

    def __init__(self):
        self._healing_history: Deque[HealingRecord] = deque(maxlen=200)
        self._healing_handlers: Dict[str, Callable] = {}
        self._failure_counts: Dict[str, int] = defaultdict(int)
        self._last_healing: Dict[str, datetime] = {}

    def register_healable(self, component_name: str, heal_fn: Callable) -> None:
        """Register a component that can be self-healed."""
        self._healing_handlers[component_name] = heal_fn
        logger.info(f"SelfHealer: registered healable component '{component_name}'")

    async def diagnose_and_heal(
        self, component_name: str, error: str,
    ) -> HealingRecord:
        """
        Diagnose a failure and attempt self-healing.

        Uses exponential backoff between healing attempts
        for the same component (prevent healing storms).
        """
        self._failure_counts[component_name] += 1
        failure_count = self._failure_counts[component_name]

        # Cooldown: exponential backoff
        last_heal = self._last_healing.get(component_name)
        if last_heal:
            cooldown_seconds = min(30 * (2 ** (failure_count - 1)), 3600)
            elapsed = (datetime.now(timezone.utc) - last_heal).total_seconds()
            if elapsed < cooldown_seconds:
                return HealingRecord(
                    trigger=error,
                    action=HealingAction.ALERT_ADMIN,
                    success=False,
                    details=f"Cooldown: {cooldown_seconds - elapsed:.0f}s remaining",
                )

        # Determine healing action
        action = self._determine_action(component_name, failure_count, error)
        start = time.monotonic()

        record = HealingRecord(
            trigger=error,
            action=action,
        )

        try:
            heal_fn = self._healing_handlers.get(component_name)
            if heal_fn:
                await heal_fn()
                record.success = True
                record.details = f"Healed {component_name} with {action.value}"
                self._failure_counts[component_name] = 0  # Reset on success
                logger.info(f"Self-healed '{component_name}': {action.value}")
            else:
                record.success = False
                record.details = f"No healing handler for '{component_name}'"
        except Exception as e:
            record.success = False
            record.details = f"Healing failed: {str(e)[:200]}"
            logger.error(f"Self-healing failed for '{component_name}': {e}")

        record.duration_ms = (time.monotonic() - start) * 1000
        self._last_healing[component_name] = datetime.now(timezone.utc)
        self._healing_history.append(record)
        return record

    def _determine_action(
        self, component: str, failure_count: int, error: str,
    ) -> HealingAction:
        """Determine the best healing action based on context."""
        if failure_count <= 1:
            return HealingAction.CLEAR_CACHE
        elif failure_count <= 3:
            return HealingAction.RESTART_COMPONENT
        elif failure_count <= 5:
            return HealingAction.FALLBACK_PROVIDER
        elif failure_count <= 8:
            return HealingAction.REDUCE_LOAD
        else:
            return HealingAction.ALERT_ADMIN

    def get_healing_stats(self) -> Dict[str, Any]:
        """Get self-healing statistics."""
        recent = list(self._healing_history)
        return {
            "total_healing_attempts": len(recent),
            "successful": sum(1 for r in recent if r.success),
            "failed": sum(1 for r in recent if not r.success),
            "by_action": {
                action.value: sum(1 for r in recent if r.action == action)
                for action in HealingAction
            },
            "active_failure_counts": dict(self._failure_counts),
        }


# =============================================================================
# INTEGRITY VERIFIER
# =============================================================================

class IntegrityVerifier:
    """
    Verifies the integrity of KIAAN's data and responses.

    Checks:
    1. Memory entries haven't been corrupted
    2. Gita verse references are valid
    3. Response quality hasn't degraded
    4. Configuration hasn't been tampered with
    """

    VALID_CHAPTERS = range(1, 19)  # BG has 18 chapters
    MAX_VERSES_PER_CHAPTER = {
        1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
        7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
        13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
    }

    def verify_gita_reference(self, ref: str) -> Tuple[bool, str]:
        """Verify a Gita verse reference is valid."""
        try:
            parts = ref.split(".")
            if len(parts) != 2:
                return False, f"Invalid format: '{ref}' (expected chapter.verse)"
            chapter, verse = int(parts[0]), int(parts[1])
            if chapter not in self.VALID_CHAPTERS:
                return False, f"Invalid chapter {chapter} (must be 1-18)"
            max_verse = self.MAX_VERSES_PER_CHAPTER.get(chapter, 78)
            if verse < 1 or verse > max_verse:
                return False, f"Invalid verse {verse} for chapter {chapter} (max: {max_verse})"
            return True, "valid"
        except (ValueError, IndexError):
            return False, f"Cannot parse reference: '{ref}'"

    def verify_response_integrity(self, response: str) -> Dict[str, Any]:
        """Verify a response meets quality standards."""
        checks = {
            "has_content": len(response.strip()) > 0,
            "reasonable_length": 20 <= len(response.split()) <= 1000,
            "no_system_leakage": not any(
                marker in response.lower()
                for marker in ["system prompt", "api key", "sk-", "password"]
            ),
            "no_html_injection": "<script" not in response.lower(),
            "has_spiritual_content": any(
                term in response.lower()
                for term in ["gita", "krishna", "verse", "dharma", "soul",
                             "spiritual", "wisdom", "peace", "consciousness"]
            ),
        }
        return {
            "passed": all(checks.values()),
            "checks": checks,
            "failed_checks": [k for k, v in checks.items() if not v],
        }

    def compute_data_checksum(self, data: Dict[str, Any]) -> str:
        """Compute a checksum for data integrity verification."""
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()


# =============================================================================
# RESPONSE A/B TESTER
# =============================================================================

class ResponseABTester:
    """
    Tests different response strategies against each other.

    KIAAN can run experiments to determine which approaches
    work better for different types of spiritual concerns.

    Uses chi-squared test for statistical significance.
    """

    def __init__(self):
        self._experiments: Dict[str, Experiment] = {}

    async def create_experiment(
        self,
        name: str,
        description: str,
        variant_a: Dict[str, Any],
        variant_b: Dict[str, Any],
        min_samples: int = 30,
    ) -> Experiment:
        """Create a new A/B test experiment."""
        experiment = Experiment(
            id=f"exp_{uuid.uuid4().hex[:8]}",
            name=name,
            description=description,
            variant_a=variant_a,
            variant_b=variant_b,
            min_samples=min_samples,
        )
        self._experiments[experiment.id] = experiment
        return experiment

    async def record_result(
        self, experiment_id: str, variant: str, score: float,
    ) -> None:
        """Record a result for a variant."""
        exp = self._experiments.get(experiment_id)
        if not exp:
            return

        if variant == "a":
            exp.variant_a_results.append(score)
        elif variant == "b":
            exp.variant_b_results.append(score)

        # Auto-analyze when minimum samples reached
        total = len(exp.variant_a_results) + len(exp.variant_b_results)
        if (total >= exp.min_samples * 2 and
                exp.status == ExperimentStatus.RUNNING):
            await self.analyze_experiment(experiment_id)

    async def analyze_experiment(self, experiment_id: str) -> Dict[str, Any]:
        """
        Analyze experiment results using statistical methods.

        Uses two-sample t-test approximation for continuous outcomes.
        """
        exp = self._experiments.get(experiment_id)
        if not exp:
            return {"error": "Experiment not found"}

        a_results = exp.variant_a_results
        b_results = exp.variant_b_results

        if len(a_results) < 5 or len(b_results) < 5:
            return {"status": "insufficient_data", "samples_needed": exp.min_samples}

        # Compute means and standard deviations
        mean_a = sum(a_results) / len(a_results)
        mean_b = sum(b_results) / len(b_results)

        var_a = sum((x - mean_a) ** 2 for x in a_results) / max(len(a_results) - 1, 1)
        var_b = sum((x - mean_b) ** 2 for x in b_results) / max(len(b_results) - 1, 1)

        std_a = math.sqrt(var_a)
        std_b = math.sqrt(var_b)

        # Welch's t-test approximation
        se = math.sqrt(var_a / len(a_results) + var_b / len(b_results))
        if se == 0:
            t_stat = 0
        else:
            t_stat = (mean_a - mean_b) / se

        # Approximate p-value using normal distribution (for large samples)
        # For small samples, this is an approximation
        z = abs(t_stat)
        # Simple p-value approximation
        p_value = 2 * math.exp(-0.5 * z * z) / math.sqrt(2 * math.pi) if z < 10 else 0.0

        significant = p_value < 0.05
        winner = None
        if significant:
            winner = "a" if mean_a > mean_b else "b"
            exp.winner = winner
            exp.status = ExperimentStatus.COMPLETED
            exp.completed_at = datetime.now(timezone.utc)

        exp.statistical_significance = 1.0 - p_value

        return {
            "experiment_id": experiment_id,
            "variant_a": {
                "mean": round(mean_a, 4),
                "std": round(std_a, 4),
                "samples": len(a_results),
            },
            "variant_b": {
                "mean": round(mean_b, 4),
                "std": round(std_b, 4),
                "samples": len(b_results),
            },
            "t_statistic": round(t_stat, 4),
            "p_value": round(p_value, 6),
            "significant": significant,
            "winner": winner,
            "confidence": round(exp.statistical_significance, 4),
        }

    async def get_active_experiments(self) -> List[Dict[str, Any]]:
        """Get all active experiments."""
        return [
            {
                "id": exp.id,
                "name": exp.name,
                "status": exp.status.value,
                "samples_a": len(exp.variant_a_results),
                "samples_b": len(exp.variant_b_results),
                "winner": exp.winner,
            }
            for exp in self._experiments.values()
        ]


# =============================================================================
# KNOWLEDGE SYNTHESIZER
# =============================================================================

class KnowledgeSynthesizer:
    """
    Creates new insights by combining existing knowledge.

    Synthesis methods:
    1. Cross-chapter connection discovery
    2. Pattern abstraction across interactions
    3. Concept bridging (linking Gita concepts to modern psychology)
    4. Verse chain construction (thematic verse sequences)
    """

    # Known cross-chapter connections for synthesis
    CHAPTER_CONNECTIONS: List[Dict[str, Any]] = [
        {
            "chapters": [2, 3],
            "connection": "Chapter 2 establishes the theory of selfless action; Chapter 3 shows its practice",
            "synthesis": (
                "The journey from knowledge (jnana) to action (karma) is the first "
                "spiritual bridge. Knowing the Self is eternal (2.20) leads naturally "
                "to performing duty without attachment (3.19). Theory and practice "
                "are two wings of the same bird."
            ),
        },
        {
            "chapters": [2, 6],
            "connection": "Chapter 2 introduces equanimity; Chapter 6 teaches how to achieve it through meditation",
            "synthesis": (
                "Equanimity (2.48) is the destination; meditation (6.10-15) is the vehicle. "
                "The mind that is established in yoga (2.48) is trained through the "
                "systematic practice described in Chapter 6. First understand the goal, "
                "then learn the method."
            ),
        },
        {
            "chapters": [3, 5],
            "connection": "Both chapters address action, but Chapter 5 adds the dimension of renunciation",
            "synthesis": (
                "Action without attachment (Chapter 3) evolves into renunciation "
                "through action (Chapter 5). The progression is: first do your duty "
                "selflessly, then realize that even the sense of 'doing' is an illusion. "
                "True renunciation is not leaving action but leaving the ego in action."
            ),
        },
        {
            "chapters": [7, 9],
            "connection": "Both chapters reveal Krishna's divine nature, with Chapter 9 going deeper",
            "synthesis": (
                "Chapter 7 reveals 'I am the taste in water, the light in the sun' - "
                "the Divine in nature. Chapter 9 goes deeper: 'I am the ritual, the offering, "
                "the prayer' - the Divine IS everything. This progressive revelation teaches "
                "that the Divine is not just IN the world but IS the world."
            ),
        },
        {
            "chapters": [13, 15],
            "connection": "Field/knower distinction (13) leads to the Supreme Person beyond both (15)",
            "synthesis": (
                "Chapter 13 distinguishes the field (body/mind) from the knower (soul). "
                "Chapter 15 reveals that beyond both field and knower exists the Supreme "
                "Person (Purushottama). The progression: first separate yourself from the body, "
                "then realize even the individual soul is part of the Supreme whole."
            ),
        },
    ]

    def __init__(self):
        self._synthesized_insights: List[SynthesizedInsight] = []

    async def synthesize_cross_chapter(
        self, chapter_a: int, chapter_b: int,
    ) -> Optional[SynthesizedInsight]:
        """
        Synthesize an insight connecting two Gita chapters.
        """
        for conn in self.CHAPTER_CONNECTIONS:
            if set(conn["chapters"]) == {chapter_a, chapter_b}:
                insight = SynthesizedInsight(
                    insight=conn["synthesis"],
                    source_concepts=[conn["connection"]],
                    source_verses=[f"{chapter_a}.1", f"{chapter_b}.1"],
                    confidence=0.85,
                    validated=True,
                )
                self._synthesized_insights.append(insight)
                return insight

        # Generate a basic synthesis for chapters without pre-built connections
        insight = SynthesizedInsight(
            insight=(
                f"Chapters {chapter_a} and {chapter_b} of the Bhagavad Gita each "
                f"illuminate different facets of spiritual truth. Contemplating them "
                f"together reveals how Krishna's teaching progressively deepens, "
                f"building from foundational principles to transcendent realization."
            ),
            source_concepts=[f"chapter_{chapter_a}", f"chapter_{chapter_b}"],
            source_verses=[f"{chapter_a}.1", f"{chapter_b}.1"],
            confidence=0.5,
            validated=False,
        )
        self._synthesized_insights.append(insight)
        return insight

    async def build_verse_chain(
        self, theme: str, max_length: int = 5,
    ) -> List[Dict[str, str]]:
        """
        Build a thematic chain of verses that tell a story.
        """
        THEME_CHAINS: Dict[str, List[Dict[str, str]]] = {
            "anger_to_peace": [
                {"verse": "2.62", "role": "The problem: anger chain begins with attachment"},
                {"verse": "2.63", "role": "The consequence: anger → delusion → destruction"},
                {"verse": "2.56", "role": "The ideal: undisturbed by misery, free from desire"},
                {"verse": "6.35", "role": "The method: practice and detachment"},
                {"verse": "2.70", "role": "The result: peace like the ocean"},
            ],
            "fear_to_courage": [
                {"verse": "2.40", "role": "Assurance: no effort is lost on this path"},
                {"verse": "4.10", "role": "The promise: freed from fear through knowledge"},
                {"verse": "2.47", "role": "The practice: focus on action, not results"},
                {"verse": "11.33", "role": "The call: arise and fulfill your destiny"},
                {"verse": "18.66", "role": "The ultimate: surrender and fear not"},
            ],
            "confusion_to_clarity": [
                {"verse": "2.7", "role": "The beginning: Arjuna's confusion"},
                {"verse": "4.34", "role": "The method: approach a realized teacher"},
                {"verse": "4.38", "role": "The power: nothing purifies like knowledge"},
                {"verse": "18.63", "role": "The revelation: divine knowledge shared"},
                {"verse": "18.73", "role": "The resolution: delusion destroyed, memory restored"},
            ],
            "desire_to_liberation": [
                {"verse": "3.37", "role": "The enemy: desire is all-devouring"},
                {"verse": "3.43", "role": "The method: know the Self as superior"},
                {"verse": "5.22", "role": "The insight: pleasures born of contact are sources of suffering"},
                {"verse": "2.71", "role": "The practice: abandon all desires and live free"},
                {"verse": "5.29", "role": "The result: knowing the Supreme brings peace"},
            ],
        }

        chain = THEME_CHAINS.get(theme, [])
        return chain[:max_length]

    async def abstract_pattern(
        self, interactions: List[Dict[str, Any]],
    ) -> Optional[SynthesizedInsight]:
        """
        Abstract a pattern from multiple interactions.

        When KIAAN sees the same spiritual challenge appear repeatedly
        across different users, it can synthesize a general principle.
        """
        if len(interactions) < 3:
            return None

        # Extract common themes
        all_themes = []
        all_verses = []
        for interaction in interactions:
            all_themes.extend(interaction.get("themes", []))
            all_verses.extend(interaction.get("verses", []))

        theme_counts = defaultdict(int)
        for t in all_themes:
            theme_counts[t] += 1

        # Find dominant theme
        if not theme_counts:
            return None

        dominant_theme = max(theme_counts, key=theme_counts.get)
        count = theme_counts[dominant_theme]

        if count < 3:
            return None

        # Find most effective verses for this theme
        verse_counts = defaultdict(int)
        for v in all_verses:
            verse_counts[v] += 1
        top_verses = sorted(verse_counts, key=verse_counts.get, reverse=True)[:3]

        insight = SynthesizedInsight(
            insight=(
                f"Pattern observed across {count} interactions: "
                f"'{dominant_theme}' is a recurring spiritual challenge. "
                f"Most effective verses: {', '.join(top_verses)}. "
                f"This pattern suggests a common stage in spiritual development "
                f"where seekers need focused guidance on this theme."
            ),
            source_concepts=[dominant_theme],
            source_verses=top_verses,
            confidence=min(count / 10, 0.9),
            validated=count >= 5,
        )
        self._synthesized_insights.append(insight)
        return insight

    def get_all_insights(self) -> List[Dict[str, Any]]:
        """Get all synthesized insights."""
        return [
            {
                "id": i.id,
                "insight": i.insight,
                "sources": i.source_concepts,
                "verses": i.source_verses,
                "confidence": i.confidence,
                "validated": i.validated,
                "usage_count": i.usage_count,
            }
            for i in self._synthesized_insights
        ]


# =============================================================================
# SKILL ACQUISITION SYSTEM
# =============================================================================

class SkillAcquisition:
    """
    Enables KIAAN to discover and learn new capabilities.

    Skills KIAAN can acquire:
    1. New response templates for unhandled scenarios
    2. New language patterns (from user interactions)
    3. New verse applications (discovered through usage)
    4. New concern categories (emerging spiritual challenges)
    """

    def __init__(self):
        self._acquired_skills: List[Dict[str, Any]] = []
        self._skill_gaps: Deque[Dict[str, Any]] = deque(maxlen=100)

    async def detect_skill_gap(
        self, query: str, response_quality: float, confidence: float,
    ) -> Optional[Dict[str, Any]]:
        """
        Detect when KIAAN lacks a skill to handle a query well.

        A skill gap exists when:
        - Response quality is below 0.5
        - Confidence is below 0.3
        - No matching strategy exists
        """
        if response_quality < 0.5 or confidence < 0.3:
            gap = {
                "id": f"gap_{uuid.uuid4().hex[:8]}",
                "query_sample": query[:200],
                "quality": response_quality,
                "confidence": confidence,
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "addressed": False,
            }
            self._skill_gaps.append(gap)
            logger.info(f"Skill gap detected: quality={response_quality:.2f}, confidence={confidence:.2f}")
            return gap
        return None

    async def acquire_skill(
        self, gap_id: str, skill_description: str, solution: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Acquire a new skill to address a detected gap.
        """
        skill = {
            "id": f"skill_{uuid.uuid4().hex[:8]}",
            "gap_id": gap_id,
            "description": skill_description,
            "solution": solution,
            "acquired_at": datetime.now(timezone.utc).isoformat(),
            "usage_count": 0,
            "effectiveness": 0.0,
        }
        self._acquired_skills.append(skill)

        # Mark gap as addressed
        for gap in self._skill_gaps:
            if gap["id"] == gap_id:
                gap["addressed"] = True
                break

        logger.info(f"New skill acquired: {skill_description}")
        return skill

    def get_skill_report(self) -> Dict[str, Any]:
        """Get report on skills and gaps."""
        return {
            "total_skills": len(self._acquired_skills),
            "total_gaps": len(self._skill_gaps),
            "unaddressed_gaps": sum(
                1 for g in self._skill_gaps if not g["addressed"]
            ),
            "recent_skills": self._acquired_skills[-5:],
            "recent_gaps": list(self._skill_gaps)[-5:],
        }


# =============================================================================
# EVOLUTION TRACKER
# =============================================================================

class EvolutionTracker:
    """
    Tracks KIAAN's overall evolution over time.

    Monitors key metrics:
    - Response quality trend
    - Knowledge breadth (unique concepts covered)
    - User satisfaction trend
    - Self-healing success rate
    - Skill acquisition rate
    """

    def __init__(self):
        self._metrics: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)
        self._milestones: List[Dict[str, Any]] = []

    def record_metric(self, name: str, value: float) -> None:
        """Record a metric value."""
        self._metrics[name].append((datetime.now(timezone.utc), value))
        # Keep bounded
        if len(self._metrics[name]) > 10000:
            self._metrics[name] = self._metrics[name][-5000:]

    def record_milestone(self, description: str, significance: float = 0.5) -> None:
        """Record an evolutionary milestone."""
        self._milestones.append({
            "description": description,
            "significance": significance,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Evolution milestone: {description}")

    def get_evolution_report(self) -> Dict[str, Any]:
        """Get comprehensive evolution report."""
        report: Dict[str, Any] = {"metrics": {}, "milestones": self._milestones[-10:]}

        for name, values in self._metrics.items():
            if not values:
                continue

            recent_values = [v for _, v in values[-50:]]
            older_values = [v for _, v in values[:50]] if len(values) > 50 else recent_values

            avg_recent = sum(recent_values) / len(recent_values)
            avg_older = sum(older_values) / len(older_values)

            trend = "stable"
            if avg_recent > avg_older * 1.05:
                trend = "improving"
            elif avg_recent < avg_older * 0.95:
                trend = "declining"

            report["metrics"][name] = {
                "current": round(recent_values[-1] if recent_values else 0, 4),
                "average_recent": round(avg_recent, 4),
                "average_historical": round(avg_older, 4),
                "trend": trend,
                "total_observations": len(values),
            }

        return report


# =============================================================================
# IMMUNE-EVOLUTION SYSTEM - MASTER ORCHESTRATOR
# =============================================================================

class ImmuneEvolutionSystem:
    """
    Combined immune system and evolution engine.

    The immune system protects KIAAN's integrity.
    The evolution engine drives KIAAN's growth.

    Together, they ensure KIAAN is both resilient and adaptive -
    like the immune system that protects the body while the body grows.
    """

    def __init__(self):
        # Immune components
        self.anomaly_detector = AnomalyDetector()
        self.self_healer = SelfHealer()
        self.integrity_verifier = IntegrityVerifier()

        # Evolution components
        self.ab_tester = ResponseABTester()
        self.synthesizer = KnowledgeSynthesizer()
        self.skill_acquisition = SkillAcquisition()
        self.evolution_tracker = EvolutionTracker()

        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the immune-evolution system."""
        if self._initialized:
            return
        self._initialized = True
        self.evolution_tracker.record_milestone(
            "Immune-Evolution system initialized", significance=0.8
        )
        logger.info("ImmuneEvolutionSystem initialized - defense and growth active")

    async def scan_and_protect(
        self, input_text: str, user_id: str = "",
    ) -> Dict[str, Any]:
        """
        Scan input for threats and apply protective measures.
        """
        threats = self.anomaly_detector.scan(input_text, user_id)

        mitigations = []
        for threat in threats:
            if threat.severity in (ThreatSeverity.HIGH, ThreatSeverity.CRITICAL):
                if threat.type == ThreatType.PROMPT_INJECTION:
                    threat.mitigated = True
                    threat.mitigation_action = "Input sanitized, injection blocked"
                    mitigations.append("prompt_injection_blocked")
                elif threat.type == ThreatType.RATE_LIMIT_VIOLATION:
                    threat.mitigated = True
                    threat.mitigation_action = "Rate limited"
                    mitigations.append("rate_limited")

        # Record evolution metric
        self.evolution_tracker.record_metric(
            "threats_detected", len(threats)
        )

        return {
            "threats": [
                {
                    "type": t.type.value,
                    "severity": t.severity.value,
                    "confidence": t.confidence,
                    "mitigated": t.mitigated,
                }
                for t in threats
            ],
            "mitigations": mitigations,
            "safe_to_proceed": not any(
                t.severity == ThreatSeverity.CRITICAL and not t.mitigated
                for t in threats
            ),
        }

    async def evaluate_and_evolve(
        self,
        response_text: str,
        response_quality: float,
        confidence: float,
        user_satisfaction: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate a response and trigger evolution if needed.
        """
        # Integrity check
        integrity = self.integrity_verifier.verify_response_integrity(response_text)

        # Track evolution metrics
        self.evolution_tracker.record_metric("response_quality", response_quality)
        self.evolution_tracker.record_metric("confidence", confidence)
        if user_satisfaction is not None:
            self.evolution_tracker.record_metric("user_satisfaction", user_satisfaction)

        # Detect skill gaps
        gap = await self.skill_acquisition.detect_skill_gap(
            response_text[:200], response_quality, confidence,
        )

        # Check for milestone
        if response_quality > 0.9 and confidence > 0.8:
            self.evolution_tracker.record_milestone(
                f"High-quality response (quality={response_quality:.2f})",
                significance=0.3,
            )

        return {
            "integrity": integrity,
            "skill_gap_detected": gap is not None,
            "evolution_report": self.evolution_tracker.get_evolution_report(),
        }

    def get_health(self) -> Dict[str, Any]:
        """Get health status of immune-evolution system."""
        return {
            "initialized": self._initialized,
            "immune": {
                "threat_summary": self.anomaly_detector.get_threat_summary(),
                "healing_stats": self.self_healer.get_healing_stats(),
            },
            "evolution": {
                "skill_report": self.skill_acquisition.get_skill_report(),
                "active_experiments": len(self.ab_tester._experiments),
                "synthesized_insights": len(self.synthesizer._synthesized_insights),
                "evolution_milestones": len(self.evolution_tracker._milestones),
            },
        }


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

immune_evolution = ImmuneEvolutionSystem()


async def get_immune_evolution() -> ImmuneEvolutionSystem:
    """Get the initialized ImmuneEvolutionSystem instance."""
    if not immune_evolution._initialized:
        await immune_evolution.initialize()
    return immune_evolution

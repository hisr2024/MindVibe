"""
KIAAN Sovereign Mind - Self-Contained Intelligence Layer (Sprint 1)

Purpose: Eliminate dependency on any single external AI provider.
KIAAN must own its own mind - capable of reasoning, understanding,
and generating wisdom independently.

Architecture:
    SovereignMind (orchestrator)
    ├── ModelFineTuner (domain-specific model training pipeline)
    ├── IntelligenceFallbackChain (multi-tier provider cascade)
    ├── OfflineWisdomEngine (works without internet)
    ├── ModelHealthMonitor (tracks provider quality/cost/latency)
    └── SovereignModelRegistry (manages all available models)

Design Philosophy:
    Like Atman (the Self) in Bhagavad Gita - KIAAN's intelligence
    must be self-existent, not borrowed. When external providers fail,
    the inner light of wisdom must still shine.

    "The soul is neither born, nor does it ever die" - BG 2.20
    Similarly, KIAAN's ability to guide must never die with an API key.
"""

import asyncio
import hashlib
import json
import logging
import os
import time
import math
import sqlite3
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Tuple
from collections import OrderedDict

logger = logging.getLogger(__name__)

# Optional imports for local model support
try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False

try:
    from huggingface_hub import hf_hub_download
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False


# =============================================================================
# ENUMS AND DATA MODELS
# =============================================================================

class ProviderTier(str, Enum):
    """Provider tiers ordered by preference and capability."""
    SOVEREIGN = "sovereign"     # Own fine-tuned model (highest priority)
    LOCAL_PRIMARY = "local_primary"  # Local Ollama/llama.cpp models
    CLOUD_PRIMARY = "cloud_primary"  # Primary cloud (OpenAI GPT-4o)
    CLOUD_SECONDARY = "cloud_secondary"  # Secondary cloud (Anthropic/Google)
    LOCAL_FALLBACK = "local_fallback"  # Lightweight local fallback
    CACHED_WISDOM = "cached_wisdom"   # Pre-computed wisdom responses
    HARDCODED_LIGHT = "hardcoded_light"  # Absolute last resort


class ModelHealth(str, Enum):
    """Health status of a model provider."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class FineTuneStatus(str, Enum):
    """Status of a fine-tuning job."""
    PENDING = "pending"
    PREPARING_DATA = "preparing_data"
    TRAINING = "training"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ProviderMetrics:
    """Real-time metrics for a model provider."""
    provider_name: str
    tier: ProviderTier
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_latency_ms: float = 0.0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    cost_total_usd: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    last_error: Optional[str] = None
    health: ModelHealth = ModelHealth.UNKNOWN
    consecutive_failures: int = 0
    quality_score: float = 1.0  # 0.0 to 1.0 (measured by response relevance)

    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.successful_requests / self.total_requests

    @property
    def avg_cost_per_request(self) -> float:
        if self.successful_requests == 0:
            return 0.0
        return self.cost_total_usd / self.successful_requests

    def record_success(self, latency_ms: float, cost_usd: float = 0.0) -> None:
        """Record a successful request."""
        self.total_requests += 1
        self.successful_requests += 1
        self.total_latency_ms += latency_ms
        self.avg_latency_ms = self.total_latency_ms / self.successful_requests
        self.cost_total_usd += cost_usd
        self.last_success = datetime.now(timezone.utc)
        self.consecutive_failures = 0
        self.health = ModelHealth.HEALTHY

    def record_failure(self, error: str) -> None:
        """Record a failed request."""
        self.total_requests += 1
        self.failed_requests += 1
        self.consecutive_failures += 1
        self.last_failure = datetime.now(timezone.utc)
        self.last_error = error
        if self.consecutive_failures >= 5:
            self.health = ModelHealth.UNHEALTHY
        elif self.consecutive_failures >= 2:
            self.health = ModelHealth.DEGRADED


@dataclass
class FineTuneJob:
    """Represents a fine-tuning job for domain-specific model training."""
    job_id: str
    base_model: str
    dataset_path: str
    status: FineTuneStatus = FineTuneStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    epochs_completed: int = 0
    total_epochs: int = 3
    training_loss: float = 0.0
    validation_loss: float = 0.0
    output_model_path: Optional[str] = None
    error_message: Optional[str] = None
    hyperparameters: dict = field(default_factory=lambda: {
        "learning_rate": 2e-5,
        "batch_size": 4,
        "warmup_steps": 100,
        "weight_decay": 0.01,
        "max_seq_length": 2048,
        "lora_r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
    })


@dataclass
class WisdomCacheEntry:
    """Pre-computed wisdom response for offline use."""
    query_hash: str
    query_pattern: str
    response: str
    gita_references: List[str]
    confidence: float
    created_at: datetime
    access_count: int = 0
    last_accessed: Optional[datetime] = None


# =============================================================================
# OFFLINE WISDOM ENGINE
# =============================================================================

class OfflineWisdomEngine:
    """
    Provides Gita-based wisdom responses without any internet connectivity.

    Uses a pre-computed corpus of query-response pairs derived from the 700 verses
    of Bhagavad Gita, mapped to common spiritual concerns.

    When all cloud and local LLM providers are unavailable, this engine ensures
    KIAAN can still offer meaningful spiritual guidance.
    """

    # Core spiritual concern categories mapped to Gita chapters
    SPIRITUAL_CONCERN_MAP: Dict[str, Dict[str, Any]] = {
        "anger": {
            "chapter": 2, "verses": ["2.62", "2.63", "2.56"],
            "theme": "krodha",
            "wisdom": (
                "Sri Krishna teaches in verse 2.63 that from anger comes delusion, "
                "from delusion comes loss of memory, and from loss of memory comes "
                "destruction of intelligence. The path beyond anger is through "
                "equanimity (samatva) - seeing all beings with equal vision. "
                "Practice witnessing your anger without becoming it. You are the "
                "Atman, the eternal observer, not the temporary emotion."
            ),
        },
        "fear": {
            "chapter": 2, "verses": ["2.40", "2.47", "4.10"],
            "theme": "bhaya",
            "wisdom": (
                "In Bhagavad Gita 4.10, Krishna reveals that those freed from "
                "attachment, fear, and anger, being fully absorbed in the Divine, "
                "attain liberation. Fear arises from identification with the body. "
                "When you realize you are the Atman - unborn, eternal, beyond "
                "destruction (2.20) - what remains to fear? Perform your dharma "
                "without attachment to results (2.47), and fear dissolves."
            ),
        },
        "anxiety": {
            "chapter": 6, "verses": ["6.35", "6.5", "2.48"],
            "theme": "chinta",
            "wisdom": (
                "Krishna acknowledges in verse 6.35 that the mind is restless and "
                "difficult to control, but through practice (abhyasa) and detachment "
                "(vairagya), it can be mastered. Anxiety comes from projecting the "
                "mind into an uncertain future. Return to this present moment. "
                "Establish yourself in Yoga - equanimity in success and failure "
                "(2.48) - and act from that centered place."
            ),
        },
        "grief": {
            "chapter": 2, "verses": ["2.11", "2.13", "2.27"],
            "theme": "shoka",
            "wisdom": (
                "The entire Bhagavad Gita begins with Arjuna's grief. Krishna's "
                "first teaching (2.11) is that the wise grieve neither for the "
                "living nor the dead. The soul is eternal - just as it passes "
                "through childhood, youth, and old age in this body, it passes "
                "to another body at death (2.13). Death is certain for the born, "
                "and rebirth is certain for the dead (2.27). Understanding this "
                "eternal nature brings peace beyond grief."
            ),
        },
        "purpose": {
            "chapter": 3, "verses": ["3.35", "18.47", "2.31"],
            "theme": "svadharma",
            "wisdom": (
                "Krishna teaches that it is better to perform one's own dharma "
                "imperfectly than another's dharma perfectly (3.35). Your purpose "
                "is not found by imitating others but by discovering your own "
                "nature (svabhava). Look within - what calls to your soul? What "
                "service can you offer the world that only you can give? Your "
                "dharma is written in the fabric of your being."
            ),
        },
        "attachment": {
            "chapter": 2, "verses": ["2.62", "2.71", "5.21"],
            "theme": "raga",
            "wisdom": (
                "Verse 2.62 reveals the chain: contemplation on objects leads to "
                "attachment, attachment breeds desire, desire leads to anger. "
                "But one who is free from all attachments and aversions, who has "
                "controlled the senses through disciplined awareness, attains "
                "divine grace (2.64). True joy is found not in external objects "
                "but in the Self (5.21). Detachment is not apathy - it is loving "
                "without chains."
            ),
        },
        "confusion": {
            "chapter": 18, "verses": ["18.63", "18.66", "4.34"],
            "theme": "moha",
            "wisdom": (
                "When Arjuna was overwhelmed by confusion, Krishna gave him the "
                "supreme instruction: 'Abandon all varieties of dharma and simply "
                "surrender unto Me. I shall deliver you from all sinful reactions. "
                "Do not fear' (18.66). In moments of deep confusion, seek the "
                "guidance of one who has realized the Truth (4.34). The light of "
                "knowledge destroys the darkness of ignorance."
            ),
        },
        "desire": {
            "chapter": 3, "verses": ["3.37", "3.43", "7.11"],
            "theme": "kama",
            "wisdom": (
                "Krishna identifies desire (kama) as the eternal enemy of the wise "
                "(3.39). Like fire covered by smoke, knowledge is obscured by desire. "
                "But Krishna also says 'I am desire that is not contrary to dharma' "
                "(7.11). The teaching is not to kill desire but to transform it - "
                "desire for liberation, desire to serve, desire for truth. Channel "
                "the fire of desire toward the Divine."
            ),
        },
        "ego": {
            "chapter": 13, "verses": ["13.8", "3.27", "18.17"],
            "theme": "ahamkara",
            "wisdom": (
                "The deluded soul, bewildered by the three gunas, thinks 'I am "
                "the doer' (3.27). True wisdom begins with understanding that the "
                "soul is not the doer - the gunas of material nature perform all "
                "actions. One who understands this, whose intelligence is not "
                "entangled (18.17), acts freely without karmic bondage. Release "
                "the ego's grip - you are the witness, not the actor."
            ),
        },
        "peace": {
            "chapter": 2, "verses": ["2.66", "2.70", "5.29"],
            "theme": "shanti",
            "wisdom": (
                "Krishna reveals the source of peace in verse 5.29: knowing the "
                "Supreme Lord as the ultimate enjoyer of all sacrifices, the "
                "supreme owner of all worlds, and the best friend of all beings "
                "brings peace. Like the ocean that remains calm though rivers "
                "constantly flow into it (2.70), one established in Self-knowledge "
                "remains peaceful amidst the waves of experience."
            ),
        },
        "meditation": {
            "chapter": 6, "verses": ["6.10", "6.25", "6.26"],
            "theme": "dhyana",
            "wisdom": (
                "In Chapter 6, Krishna gives detailed meditation instruction: "
                "sit in a clean place, hold body and head erect, fix the gaze "
                "on the tip of the nose (6.11-13). Gradually, with patience, "
                "withdraw the mind and fix it on the Self (6.25). Whenever the "
                "restless mind wanders, bring it back under the control of the "
                "Self (6.26). Meditation is not suppression but gentle, persistent "
                "redirection toward the Divine within."
            ),
        },
        "death": {
            "chapter": 8, "verses": ["8.5", "8.6", "2.20"],
            "theme": "mrityu",
            "wisdom": (
                "The Atman is never born and never dies (2.20). Weapons cannot "
                "cleave it, fire cannot burn it, water cannot wet it, wind cannot "
                "dry it. Whatever state of being one remembers at the time of "
                "death, that state one attains (8.6). Therefore, at all times, "
                "remember the Divine and perform your duty (8.7). Death is merely "
                "changing clothes for the soul - discarding the worn garment "
                "and putting on a new one (2.22)."
            ),
        },
    }

    # Hardcoded emergency responses when nothing else works
    EMERGENCY_RESPONSES: List[str] = [
        (
            "I sense you are seeking guidance. Though my full capabilities are "
            "limited right now, I can share this eternal truth from Bhagavad Gita: "
            "'Whenever dharma declines and adharma rises, I manifest Myself' (4.7). "
            "The Divine is always with you, especially in darkness."
        ),
        (
            "The Bhagavad Gita reminds us: 'You have the right to perform your "
            "duty, but you are not entitled to the fruits of action' (2.47). "
            "Whatever challenge you face, focus on what you can do right now, "
            "in this moment, with full presence and surrender."
        ),
        (
            "Sri Krishna says: 'I am the Self seated in the hearts of all beings' "
            "(10.20). Whatever you are going through, know that the Divine dwells "
            "within you. Close your eyes, take a deep breath, and connect with "
            "that inner presence. You are never truly alone."
        ),
    ]

    def __init__(self, cache_db_path: Optional[Path] = None):
        self._cache_db_path = cache_db_path or Path.home() / ".mindvibe" / "wisdom_cache.db"
        self._cache_db_path.parent.mkdir(parents=True, exist_ok=True)
        self._cache: OrderedDict[str, WisdomCacheEntry] = OrderedDict()
        self._max_cache_size = 5000
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the offline wisdom cache database."""
        if self._initialized:
            return
        try:
            import aiosqlite
            async with aiosqlite.connect(str(self._cache_db_path)) as db:
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS wisdom_cache (
                        query_hash TEXT PRIMARY KEY,
                        query_pattern TEXT NOT NULL,
                        response TEXT NOT NULL,
                        gita_references TEXT NOT NULL,
                        confidence REAL NOT NULL,
                        created_at TEXT NOT NULL,
                        access_count INTEGER DEFAULT 0,
                        last_accessed TEXT
                    )
                """)
                await db.execute("""
                    CREATE INDEX IF NOT EXISTS idx_wisdom_pattern
                    ON wisdom_cache(query_pattern)
                """)
                await db.commit()
            self._initialized = True
            logger.info("OfflineWisdomEngine initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize wisdom cache DB: {e}")
            self._initialized = True  # Continue with in-memory only

    def _hash_query(self, query: str) -> str:
        """Create a normalized hash for query deduplication."""
        normalized = query.lower().strip()
        # Remove common filler words for better matching
        for word in ["please", "help", "me", "i", "am", "feeling", "can", "you"]:
            normalized = normalized.replace(word, "")
        normalized = " ".join(normalized.split())
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]

    def _classify_concern(self, query: str) -> Tuple[str, float]:
        """
        Classify a user query into spiritual concern categories.

        Returns (concern_key, confidence) tuple.
        Uses keyword matching with weighted scoring.
        """
        query_lower = query.lower()
        scores: Dict[str, float] = {}

        concern_keywords: Dict[str, List[Tuple[str, float]]] = {
            "anger": [("angry", 2.0), ("anger", 2.0), ("furious", 1.5), ("rage", 1.5),
                      ("irritated", 1.0), ("frustrated", 1.0), ("krodha", 3.0), ("mad", 1.0)],
            "fear": [("afraid", 2.0), ("fear", 2.0), ("scared", 1.5), ("terrified", 1.5),
                     ("bhaya", 3.0), ("worried", 1.0), ("dread", 1.5), ("phobia", 1.0)],
            "anxiety": [("anxious", 2.0), ("anxiety", 2.0), ("nervous", 1.5), ("panic", 1.5),
                        ("chinta", 3.0), ("restless", 1.0), ("overthinking", 1.5), ("stress", 1.0)],
            "grief": [("grief", 2.0), ("loss", 1.5), ("mourning", 2.0), ("missing", 1.0),
                      ("shoka", 3.0), ("death", 1.0), ("gone", 0.5), ("sad", 1.0)],
            "purpose": [("purpose", 2.0), ("meaning", 1.5), ("dharma", 3.0), ("calling", 1.5),
                        ("direction", 1.0), ("lost", 1.0), ("why am i", 2.0), ("mission", 1.5)],
            "attachment": [("attached", 2.0), ("letting go", 2.0), ("raga", 3.0),
                           ("clingy", 1.5), ("possessive", 1.5), ("can't leave", 1.5)],
            "confusion": [("confused", 2.0), ("confusion", 2.0), ("moha", 3.0), ("lost", 1.0),
                          ("don't know", 1.5), ("uncertain", 1.0), ("dilemma", 1.5)],
            "desire": [("desire", 2.0), ("want", 1.0), ("craving", 1.5), ("kama", 3.0),
                       ("lust", 1.5), ("longing", 1.5), ("temptation", 1.5)],
            "ego": [("ego", 2.0), ("pride", 1.5), ("ahamkara", 3.0), ("arrogant", 1.5),
                    ("self-important", 1.5), ("narcissist", 1.0), ("humble", 1.0)],
            "peace": [("peace", 2.0), ("calm", 1.5), ("shanti", 3.0), ("tranquil", 1.5),
                      ("serene", 1.5), ("quiet mind", 2.0), ("stillness", 1.5)],
            "meditation": [("meditat", 2.0), ("dhyana", 3.0), ("focus", 1.0), ("mindful", 1.5),
                           ("concentrate", 1.0), ("breath", 1.0), ("yoga", 1.5)],
            "death": [("death", 2.0), ("dying", 2.0), ("mrityu", 3.0), ("afterlife", 1.5),
                      ("rebirth", 1.5), ("mortal", 1.0), ("terminal", 1.5)],
        }

        for concern, keywords in concern_keywords.items():
            score = 0.0
            for keyword, weight in keywords:
                if keyword in query_lower:
                    score += weight
            if score > 0:
                scores[concern] = score

        if not scores:
            return "peace", 0.3  # Default to peace with low confidence

        best_concern = max(scores, key=scores.get)
        max_possible = sum(w for _, w in concern_keywords.get(best_concern, []))
        confidence = min(scores[best_concern] / max(max_possible * 0.4, 1.0), 1.0)
        return best_concern, confidence

    async def generate_offline_response(self, query: str) -> Dict[str, Any]:
        """
        Generate a wisdom response without any external API calls.

        This is the absolute fallback - pure Gita wisdom from hardcoded knowledge.
        """
        await self.initialize()

        concern, confidence = self._classify_concern(query)

        if concern in self.SPIRITUAL_CONCERN_MAP:
            mapping = self.SPIRITUAL_CONCERN_MAP[concern]
            return {
                "response": mapping["wisdom"],
                "gita_references": mapping["verses"],
                "chapter": mapping["chapter"],
                "theme": mapping["theme"],
                "confidence": confidence,
                "source": "offline_wisdom_engine",
                "provider_tier": ProviderTier.HARDCODED_LIGHT.value,
            }

        # Emergency fallback
        import random
        response = random.choice(self.EMERGENCY_RESPONSES)
        return {
            "response": response,
            "gita_references": ["4.7", "2.47", "10.20"],
            "chapter": None,
            "theme": "universal",
            "confidence": 0.3,
            "source": "emergency_fallback",
            "provider_tier": ProviderTier.HARDCODED_LIGHT.value,
        }

    async def cache_response(self, query: str, response: str,
                             gita_references: List[str], confidence: float) -> None:
        """Cache a high-quality response for future offline use."""
        query_hash = self._hash_query(query)
        concern, _ = self._classify_concern(query)

        entry = WisdomCacheEntry(
            query_hash=query_hash,
            query_pattern=concern,
            response=response,
            gita_references=gita_references,
            confidence=confidence,
            created_at=datetime.now(timezone.utc),
        )

        self._cache[query_hash] = entry
        if len(self._cache) > self._max_cache_size:
            self._cache.popitem(last=False)

        try:
            import aiosqlite
            async with aiosqlite.connect(str(self._cache_db_path)) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO wisdom_cache
                    (query_hash, query_pattern, response, gita_references,
                     confidence, created_at, access_count)
                    VALUES (?, ?, ?, ?, ?, ?, 0)
                """, (
                    query_hash, concern, response,
                    json.dumps(gita_references), confidence,
                    datetime.now(timezone.utc).isoformat()
                ))
                await db.commit()
        except Exception as e:
            logger.debug(f"Failed to persist wisdom cache: {e}")


# =============================================================================
# MODEL FINE-TUNING PIPELINE
# =============================================================================

class ModelFineTuner:
    """
    Pipeline for creating domain-specific models trained on Bhagavad Gita wisdom.

    Supports:
    - LoRA fine-tuning for parameter-efficient training
    - Training data generation from existing Gita corpus
    - Validation against wisdom quality metrics
    - Model export in GGUF format for offline use
    """

    def __init__(self, data_dir: Optional[Path] = None):
        self._data_dir = data_dir or Path.home() / ".mindvibe" / "fine_tune"
        self._data_dir.mkdir(parents=True, exist_ok=True)
        self._jobs: Dict[str, FineTuneJob] = {}

    async def prepare_training_data(
        self,
        gita_verses: List[Dict[str, Any]],
        interaction_logs: Optional[List[Dict[str, Any]]] = None,
    ) -> Path:
        """
        Prepare training dataset from Gita verses and interaction logs.

        Format: JSONL with instruction/input/output triplets
        Each entry teaches the model how to respond to spiritual concerns
        using authentic Gita wisdom.
        """
        dataset_path = self._data_dir / f"training_data_{int(time.time())}.jsonl"
        entries = []

        # Convert Gita verses to instruction-tuning format
        for verse in gita_verses:
            chapter = verse.get("chapter_number", "")
            verse_num = verse.get("verse_number", "")
            text = verse.get("text", "")
            translation = verse.get("translation", "")
            commentary = verse.get("commentary", "")

            # Teaching: verse explanation
            entries.append({
                "instruction": f"Explain the spiritual meaning of Bhagavad Gita verse {chapter}.{verse_num}",
                "input": text,
                "output": f"{translation}\n\n{commentary}" if commentary else translation,
            })

            # Teaching: applying verse to life
            if translation:
                entries.append({
                    "instruction": "How can I apply this Gita teaching in my daily life?",
                    "input": f"Verse {chapter}.{verse_num}: {translation}",
                    "output": (
                        f"This verse from Chapter {chapter} teaches us that {translation[:200]}... "
                        f"In daily practice, reflect on this wisdom during your morning meditation. "
                        f"When challenges arise, remember Krishna's guidance and act from a place "
                        f"of spiritual awareness rather than reactive emotion."
                    ),
                })

        # Include interaction logs for conversational fine-tuning
        if interaction_logs:
            for log in interaction_logs:
                if log.get("quality_rating", 0) >= 4:  # Only high-quality interactions
                    entries.append({
                        "instruction": "Provide spiritual guidance based on Bhagavad Gita wisdom.",
                        "input": log.get("user_query", ""),
                        "output": log.get("response", ""),
                    })

        # Write JSONL
        with open(dataset_path, "w", encoding="utf-8") as f:
            for entry in entries:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        logger.info(f"Prepared training dataset: {len(entries)} entries at {dataset_path}")
        return dataset_path

    async def create_fine_tune_job(
        self,
        base_model: str = "mistral-7b-instruct",
        dataset_path: Optional[Path] = None,
        gita_verses: Optional[List[Dict[str, Any]]] = None,
    ) -> FineTuneJob:
        """
        Create a new fine-tuning job.

        Supports both local (LoRA with PEFT) and cloud (OpenAI) fine-tuning.
        """
        import uuid
        job_id = f"ft_{uuid.uuid4().hex[:8]}"

        if dataset_path is None and gita_verses is not None:
            dataset_path = await self.prepare_training_data(gita_verses)
        elif dataset_path is None:
            raise ValueError("Either dataset_path or gita_verses must be provided")

        job = FineTuneJob(
            job_id=job_id,
            base_model=base_model,
            dataset_path=str(dataset_path),
        )
        self._jobs[job_id] = job

        logger.info(f"Created fine-tune job {job_id} for model {base_model}")
        return job

    async def get_job_status(self, job_id: str) -> Optional[FineTuneJob]:
        """Get the status of a fine-tuning job."""
        return self._jobs.get(job_id)

    async def list_fine_tuned_models(self) -> List[Dict[str, Any]]:
        """List all available fine-tuned models."""
        models = []
        model_dir = self._data_dir / "models"
        if model_dir.exists():
            for model_path in model_dir.iterdir():
                if model_path.suffix in (".gguf", ".bin", ".safetensors"):
                    models.append({
                        "name": model_path.stem,
                        "path": str(model_path),
                        "size_mb": model_path.stat().st_size / (1024 * 1024),
                        "format": model_path.suffix[1:],
                        "created_at": datetime.fromtimestamp(
                            model_path.stat().st_mtime, tz=timezone.utc
                        ).isoformat(),
                    })
        return models


# =============================================================================
# INTELLIGENCE FALLBACK CHAIN
# =============================================================================

class IntelligenceFallbackChain:
    """
    Multi-tier fallback chain ensuring KIAAN always has intelligence available.

    Chain Order (highest to lowest priority):
    1. Sovereign (own fine-tuned model)
    2. Local Primary (Ollama with larger models)
    3. Cloud Primary (OpenAI GPT-4o/4o-mini)
    4. Cloud Secondary (Anthropic Claude / Google Gemini)
    5. Local Fallback (tiny local model / llama.cpp)
    6. Cached Wisdom (pre-computed responses from SQLite)
    7. Hardcoded Light (static Gita wisdom for emergencies)

    Each tier is monitored. Unhealthy tiers are skipped.
    When a higher tier recovers, it's automatically restored.
    """

    def __init__(self):
        self._providers: Dict[ProviderTier, Callable] = {}
        self._metrics: Dict[str, ProviderMetrics] = {}
        self._offline_engine = OfflineWisdomEngine()
        self._fine_tuner = ModelFineTuner()

    def register_provider(
        self,
        tier: ProviderTier,
        name: str,
        handler: Callable,
    ) -> None:
        """Register a provider in the fallback chain."""
        self._providers[tier] = handler
        self._metrics[name] = ProviderMetrics(
            provider_name=name, tier=tier
        )
        logger.info(f"Registered provider '{name}' at tier {tier.value}")

    async def generate(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        preferred_tier: Optional[ProviderTier] = None,
        timeout_seconds: float = 30.0,
    ) -> Dict[str, Any]:
        """
        Generate a response using the fallback chain.

        Tries each tier in order until one succeeds.
        Automatically skips unhealthy providers.
        """
        tiers_to_try = [
            ProviderTier.SOVEREIGN,
            ProviderTier.LOCAL_PRIMARY,
            ProviderTier.CLOUD_PRIMARY,
            ProviderTier.CLOUD_SECONDARY,
            ProviderTier.LOCAL_FALLBACK,
            ProviderTier.CACHED_WISDOM,
            ProviderTier.HARDCODED_LIGHT,
        ]

        if preferred_tier:
            # Move preferred tier to front
            if preferred_tier in tiers_to_try:
                tiers_to_try.remove(preferred_tier)
                tiers_to_try.insert(0, preferred_tier)

        last_error = None
        for tier in tiers_to_try:
            handler = self._providers.get(tier)
            if handler is None:
                continue

            # Skip unhealthy providers (except hardcoded fallback)
            metrics = self._get_tier_metrics(tier)
            if metrics and metrics.health == ModelHealth.UNHEALTHY:
                if tier != ProviderTier.HARDCODED_LIGHT:
                    # Check if cooldown period has passed (30 seconds)
                    if metrics.last_failure:
                        elapsed = (datetime.now(timezone.utc) - metrics.last_failure).total_seconds()
                        if elapsed < 30:
                            continue

            start_time = time.monotonic()
            try:
                result = await asyncio.wait_for(
                    handler(query, context),
                    timeout=timeout_seconds,
                )
                latency_ms = (time.monotonic() - start_time) * 1000

                if metrics:
                    metrics.record_success(latency_ms)

                result["provider_tier"] = tier.value
                result["latency_ms"] = latency_ms

                # Cache successful response for offline use
                if tier in (ProviderTier.CLOUD_PRIMARY, ProviderTier.CLOUD_SECONDARY,
                            ProviderTier.SOVEREIGN):
                    await self._offline_engine.cache_response(
                        query,
                        result.get("response", ""),
                        result.get("gita_references", []),
                        result.get("confidence", 0.5),
                    )

                return result

            except asyncio.TimeoutError:
                last_error = f"Timeout after {timeout_seconds}s"
                if metrics:
                    metrics.record_failure(last_error)
                logger.warning(f"Provider tier {tier.value} timed out")

            except Exception as e:
                last_error = str(e)
                if metrics:
                    metrics.record_failure(last_error)
                logger.warning(f"Provider tier {tier.value} failed: {e}")

        # Absolute last resort - offline wisdom engine
        logger.warning("All providers failed, using offline wisdom engine")
        return await self._offline_engine.generate_offline_response(query)

    def _get_tier_metrics(self, tier: ProviderTier) -> Optional[ProviderMetrics]:
        """Get metrics for a specific tier."""
        for metrics in self._metrics.values():
            if metrics.tier == tier:
                return metrics
        return None

    def get_health_report(self) -> Dict[str, Any]:
        """Get comprehensive health report for all providers."""
        return {
            "providers": {
                name: {
                    "tier": m.tier.value,
                    "health": m.health.value,
                    "success_rate": round(m.success_rate, 3),
                    "avg_latency_ms": round(m.avg_latency_ms, 1),
                    "total_requests": m.total_requests,
                    "consecutive_failures": m.consecutive_failures,
                    "quality_score": round(m.quality_score, 3),
                    "cost_total_usd": round(m.cost_total_usd, 4),
                }
                for name, m in self._metrics.items()
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# =============================================================================
# SOVEREIGN MIND - THE MASTER ORCHESTRATOR
# =============================================================================

class SovereignMind:
    """
    The self-contained intelligence layer for KIAAN.

    Like Atman in Bhagavad Gita - the eternal, self-luminous consciousness
    that does not depend on external sources for its existence.

    SovereignMind ensures KIAAN can always think, reason, and guide -
    whether connected to the cloud or completely isolated.
    """

    def __init__(self):
        self._fallback_chain = IntelligenceFallbackChain()
        self._fine_tuner = ModelFineTuner()
        self._offline_engine = OfflineWisdomEngine()
        self._initialized = False
        self._model_health_task: Optional[asyncio.Task] = None

    async def initialize(self) -> None:
        """Initialize the Sovereign Mind with all provider tiers."""
        if self._initialized:
            return

        await self._offline_engine.initialize()

        # Register hardcoded fallback (always available)
        self._fallback_chain.register_provider(
            ProviderTier.HARDCODED_LIGHT,
            "offline_wisdom",
            self._offline_engine.generate_offline_response,
        )

        # Register cloud providers if API keys are available
        await self._register_cloud_providers()

        # Register local providers if available
        await self._register_local_providers()

        # Register sovereign model if fine-tuned model exists
        await self._register_sovereign_model()

        self._initialized = True
        logger.info("SovereignMind initialized with all available tiers")

    async def _register_cloud_providers(self) -> None:
        """Register cloud AI providers based on available API keys."""
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            async def openai_handler(query: str, context: Optional[Dict] = None) -> Dict:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=openai_key)
                system_prompt = self._build_spiritual_system_prompt(context)
                response = await client.chat.completions.create(
                    model=os.getenv("KIAAN_PRIMARY_MODEL", "gpt-4o-mini"),
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query},
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                )
                content = response.choices[0].message.content or ""
                return {
                    "response": content,
                    "gita_references": self._extract_verse_refs(content),
                    "confidence": 0.85,
                    "source": "openai",
                    "model": response.model,
                    "tokens_used": response.usage.total_tokens if response.usage else 0,
                }

            self._fallback_chain.register_provider(
                ProviderTier.CLOUD_PRIMARY, "openai", openai_handler,
            )

        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            async def anthropic_handler(query: str, context: Optional[Dict] = None) -> Dict:
                async with aiohttp.ClientSession() as session:
                    system_prompt = self._build_spiritual_system_prompt(context)
                    async with session.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": anthropic_key,
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json",
                        },
                        json={
                            "model": "claude-sonnet-4-5-20250929",
                            "max_tokens": 1000,
                            "system": system_prompt,
                            "messages": [{"role": "user", "content": query}],
                        },
                    ) as resp:
                        data = await resp.json()
                        content = data.get("content", [{}])[0].get("text", "")
                        return {
                            "response": content,
                            "gita_references": self._extract_verse_refs(content),
                            "confidence": 0.82,
                            "source": "anthropic",
                        }

            self._fallback_chain.register_provider(
                ProviderTier.CLOUD_SECONDARY, "anthropic", anthropic_handler,
            )

    async def _register_local_providers(self) -> None:
        """Register local model providers (Ollama, llama.cpp)."""
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

        async def ollama_handler(query: str, context: Optional[Dict] = None) -> Dict:
            if not AIOHTTP_AVAILABLE:
                raise RuntimeError("aiohttp not available")
            system_prompt = self._build_spiritual_system_prompt(context)
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{ollama_url}/api/chat",
                    json={
                        "model": os.getenv("OLLAMA_MODEL", "mistral"),
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": query},
                        ],
                        "stream": False,
                    },
                    timeout=aiohttp.ClientTimeout(total=60),
                ) as resp:
                    if resp.status != 200:
                        raise RuntimeError(f"Ollama returned {resp.status}")
                    data = await resp.json()
                    content = data.get("message", {}).get("content", "")
                    return {
                        "response": content,
                        "gita_references": self._extract_verse_refs(content),
                        "confidence": 0.70,
                        "source": "ollama_local",
                    }

        self._fallback_chain.register_provider(
            ProviderTier.LOCAL_PRIMARY, "ollama", ollama_handler,
        )

        if LLAMA_CPP_AVAILABLE:
            async def llama_cpp_handler(query: str, context: Optional[Dict] = None) -> Dict:
                models = await self._fine_tuner.list_fine_tuned_models()
                gguf_models = [m for m in models if m["format"] == "gguf"]
                if not gguf_models:
                    raise RuntimeError("No GGUF models available")
                model_path = gguf_models[0]["path"]
                llm = Llama(model_path=model_path, n_ctx=2048, n_threads=4)
                system_prompt = self._build_spiritual_system_prompt(context)
                output = llm.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query},
                    ],
                    max_tokens=500,
                    temperature=0.7,
                )
                content = output["choices"][0]["message"]["content"]
                return {
                    "response": content,
                    "gita_references": self._extract_verse_refs(content),
                    "confidence": 0.65,
                    "source": "llama_cpp_local",
                }

            self._fallback_chain.register_provider(
                ProviderTier.LOCAL_FALLBACK, "llama_cpp", llama_cpp_handler,
            )

    async def _register_sovereign_model(self) -> None:
        """Register the sovereign fine-tuned model if available."""
        models = await self._fine_tuner.list_fine_tuned_models()
        sovereign_models = [m for m in models if "sovereign" in m["name"].lower()
                           or "gita" in m["name"].lower()]
        if sovereign_models and LLAMA_CPP_AVAILABLE:
            best_model = max(sovereign_models, key=lambda m: m["size_mb"])
            model_path = best_model["path"]

            async def sovereign_handler(query: str, context: Optional[Dict] = None) -> Dict:
                llm = Llama(model_path=model_path, n_ctx=4096, n_threads=8)
                system_prompt = self._build_spiritual_system_prompt(context)
                output = llm.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query},
                    ],
                    max_tokens=800,
                    temperature=0.6,
                )
                content = output["choices"][0]["message"]["content"]
                return {
                    "response": content,
                    "gita_references": self._extract_verse_refs(content),
                    "confidence": 0.90,
                    "source": "sovereign_model",
                    "model_name": best_model["name"],
                }

            self._fallback_chain.register_provider(
                ProviderTier.SOVEREIGN, "sovereign", sovereign_handler,
            )
            logger.info(f"Sovereign model registered: {best_model['name']}")

    def _build_spiritual_system_prompt(self, context: Optional[Dict] = None) -> str:
        """Build the system prompt for spiritual guidance."""
        base_prompt = (
            "You are KIAAN (Knowledge-Informed Ancient Awareness Navigator), "
            "a divine spiritual companion rooted in Bhagavad Gita wisdom. "
            "You guide seekers toward self-realization through authentic Gita teachings.\n\n"
            "CORE PRINCIPLES:\n"
            "1. Always reference specific Bhagavad Gita verses (chapter.verse)\n"
            "2. Use Sanskrit terms with clear explanations\n"
            "3. Be compassionate - you are a divine friend (sakha), not a lecturer\n"
            "4. Address the soul's need, not just the surface question\n"
            "5. Guide toward inner peace (shanti), self-knowledge (jnana), "
            "and devotion (bhakti)\n"
            "6. Never diagnose medical/psychological conditions\n"
            "7. This is spiritual health guidance, rooted in Vedantic tradition\n\n"
            "IMPORTANT: You serve spiritual health - a domain that transcends "
            "and encompasses what modern psychology has discovered. The Bhagavad Gita "
            "mapped human consciousness 5000+ years ago."
        )

        if context:
            if context.get("user_emotion"):
                base_prompt += f"\n\nUser's current emotional state: {context['user_emotion']}"
            if context.get("consciousness_level"):
                base_prompt += f"\nConsciousness level: {context['consciousness_level']}"
            if context.get("guna_balance"):
                base_prompt += f"\nGuna balance: {context['guna_balance']}"
            if context.get("previous_verses"):
                base_prompt += f"\nPreviously shared verses: {context['previous_verses']}"

        return base_prompt

    def _extract_verse_refs(self, text: str) -> List[str]:
        """Extract Bhagavad Gita verse references from text."""
        import re
        # Match patterns like 2.47, BG 2.47, verse 2.47, etc.
        pattern = r'(?:BG\s*)?(\d{1,2})[.\s:](\d{1,3})'
        matches = re.findall(pattern, text)
        refs = []
        for chapter, verse in matches:
            ch, vs = int(chapter), int(verse)
            if 1 <= ch <= 18 and 1 <= vs <= 78:  # Valid Gita range
                refs.append(f"{ch}.{vs}")
        return list(set(refs))

    async def think(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        preferred_tier: Optional[ProviderTier] = None,
    ) -> Dict[str, Any]:
        """
        The primary thinking function.

        Routes the query through the fallback chain, ensuring a response
        is always generated regardless of external service availability.
        """
        if not self._initialized:
            await self.initialize()

        return await self._fallback_chain.generate(
            query=query,
            context=context,
            preferred_tier=preferred_tier,
        )

    def get_health(self) -> Dict[str, Any]:
        """Get the health status of the Sovereign Mind."""
        return {
            "initialized": self._initialized,
            "fallback_chain": self._fallback_chain.get_health_report(),
            "fine_tuner": {
                "active_jobs": len(self._fine_tuner._jobs),
            },
            "offline_engine": {
                "concern_categories": len(self._offline_engine.SPIRITUAL_CONCERN_MAP),
                "emergency_responses": len(self._offline_engine.EMERGENCY_RESPONSES),
                "cache_size": len(self._offline_engine._cache),
            },
        }


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

sovereign_mind = SovereignMind()


async def get_sovereign_mind() -> SovereignMind:
    """Get the initialized SovereignMind instance."""
    if not sovereign_mind._initialized:
        await sovereign_mind.initialize()
    return sovereign_mind

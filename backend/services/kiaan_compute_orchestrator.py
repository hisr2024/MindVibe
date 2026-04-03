"""
KIAAN Compute Orchestrator — CPU/GPU/NPU Task-Level Processor Assignment

Assigns every voice processing task to the optimal processor on the device.
This is the engineering that makes KIAAN faster than Siri:
  Siri sends audio to Apple servers. Round trip: 200-800ms.
  KIAAN processes on-device. Total: < 300ms.

Architecture:
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    KIAAN COMPUTE TRINITY                            │
    │                                                                     │
    │  NPU (Neural Processing Unit)    Always-Awake Layer                │
    │  • Wake word: "Hey KIAAN"        • 0.1% battery drain              │
    │  • Emotion detection             • < 1ms latency                   │
    │  • Voice fingerprint             • Runs during sleep               │
    │  • Sanskrit phoneme recognition  • NEVER misses a call             │
    │                                                                     │
    │  GPU (Graphics/Compute)          Beauty + Intelligence Layer        │
    │  • Whisper STT (Metal/Vulkan)    • < 200ms transcription           │
    │  • On-device TTS synthesis       • Audio waveform generation       │
    │  • Gita embedding search         • Real-time prosody rendering     │
    │  • Response quality scoring      • Visual animations (60fps)       │
    │                                                                     │
    │  CPU (Multi-core)                Wisdom + Reasoning Layer           │
    │  • Engine router decisions       • Complex intent parsing          │
    │  • Memory management             • Sanskrit grammar analysis       │
    │  • WisdomCore retrieval          • Cross-session context           │
    │  • Fallback orchestration        • Dharmic pattern matching        │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘

TOTAL ON-DEVICE PIPELINE: < 300ms from "Hey KIAAN" to first spoken word
CLOUD AUGMENTATION: Optional, additive, never blocking
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


# =============================================================================
# PROCESSOR TYPES
# =============================================================================

class ProcessorType(str, Enum):
    """Hardware processor targets for compute tasks."""
    NPU = "npu"   # Neural Processing Unit (Apple ANE / Qualcomm HTP / Samsung NPU)
    GPU = "gpu"   # Graphics Processing Unit (Metal / Vulkan / WebGPU)
    CPU = "cpu"   # Multi-core CPU (always available)


class ThermalState(str, Enum):
    """Device thermal condition reported by OS thermal monitor."""
    NOMINAL = "nominal"
    FAIR = "fair"
    SERIOUS = "serious"
    CRITICAL = "critical"


class PerformanceMode(str, Enum):
    """User/system selected performance mode."""
    PERFORMANCE = "performance"   # Max quality, more battery drain
    BALANCED = "balanced"         # Default
    EFFICIENCY = "efficiency"     # Battery saver


# =============================================================================
# COMPUTE TASKS — Every voice pipeline stage mapped to optimal processor
# =============================================================================

class ComputeTask(Enum):
    """
    Every discrete processing step in the KIAAN voice pipeline,
    tagged with its natural processor affinity and description.
    """
    # NPU tasks (fixed-function, battery-efficient, always-on capable)
    WAKE_WORD_DETECTION     = ("npu", "Wake word: 'Hey KIAAN'", 3)
    VOICE_FINGERPRINT       = ("npu", "Speaker verification", 6)
    EMOTION_DETECTION       = ("npu", "Real-time emotion from voice", 4)
    EMBEDDING_GENERATION    = ("npu", "Semantic search embedding", 8)
    PHONEME_RECOGNITION     = ("npu", "Sanskrit phoneme detection", 5)

    # GPU tasks (parallel compute, high throughput)
    SPEECH_TO_TEXT          = ("gpu", "Whisper on-device STT", 28)
    TEXT_TO_SPEECH          = ("gpu", "Neural TTS synthesis", 180)
    AUDIO_ENHANCEMENT       = ("gpu", "Noise reduction, EQ, warmth", 12)
    VECTOR_SEARCH           = ("gpu", "FAISS Gita verse search", 2)
    RESPONSE_QUALITY        = ("gpu", "Output quality scoring", 10)

    # CPU tasks (sequential logic, branching)
    ENGINE_ROUTING          = ("cpu", "Intent → Engine selection", 3)
    WISDOM_RETRIEVAL        = ("cpu", "Verse ranking & selection", 5)
    MEMORY_MANAGEMENT       = ("cpu", "Session + cross-session", 2)
    SANSKRIT_GRAMMAR        = ("cpu", "Anvaya analysis", 8)
    FALLBACK_ORCHESTRATION  = ("cpu", "Error recovery chains", 1)
    RESPONSE_COMPOSITION    = ("cpu", "Final response assembly", 5)

    def __init__(self, processor: str, description: str, typical_ms: int):
        self._processor = processor
        self._description = description
        self._typical_ms = typical_ms

    @property
    def natural_processor(self) -> ProcessorType:
        return ProcessorType(self._processor)

    @property
    def description(self) -> str:
        return self._description

    @property
    def typical_latency_ms(self) -> int:
        return self._typical_ms


# =============================================================================
# DEVICE CAPABILITIES — Detected at startup
# =============================================================================

@dataclass
class DeviceCapabilities:
    """Hardware capabilities detected at runtime."""
    # NPU
    npu_available: bool = False
    npu_tops: float = 0.0           # Tera operations per second

    # GPU
    gpu_available: bool = False
    gpu_tflops: float = 0.0
    gpu_api: str = "none"           # "metal" | "vulkan" | "webgpu" | "cuda" | "none"
    gpu_vram_mb: int = 0

    # CPU
    cpu_cores: int = 4
    cpu_has_simd: bool = False      # AVX2 / NEON
    cpu_arch: str = "unknown"       # "arm64" | "x86_64"

    # Memory
    ram_gb: float = 4.0

    # Platform
    platform: str = "unknown"       # "ios" | "android" | "web" | "desktop"
    os_version: str = ""

    def summary(self) -> str:
        parts = [f"platform={self.platform}"]
        if self.npu_available:
            parts.append(f"NPU({self.npu_tops:.1f}TOPS)")
        if self.gpu_available:
            parts.append(f"GPU({self.gpu_api},{self.gpu_tflops:.1f}TFLOPS)")
        parts.append(f"CPU({self.cpu_cores}cores)")
        parts.append(f"RAM({self.ram_gb:.1f}GB)")
        return " | ".join(parts)


# =============================================================================
# TASK EXECUTION RESULT — Metrics for each processed task
# =============================================================================

@dataclass
class TaskExecutionResult:
    """Result of executing a compute task with timing metrics."""
    task: ComputeTask
    processor_used: ProcessorType
    latency_ms: float
    success: bool
    output: Any = None
    error: Optional[str] = None
    fallback_used: bool = False


# =============================================================================
# COMPUTE ORCHESTRATOR — The brain of the voice pipeline
# =============================================================================

class KiaanComputeOrchestrator:
    """
    Assigns compute tasks to optimal processors.
    Monitors thermal state, battery, and performance.
    Degrades gracefully: NPU unavailable → GPU → CPU.

    Usage:
        orchestrator = KiaanComputeOrchestrator()
        orchestrator.update_capabilities(detected_caps)

        # Get optimal processor for a task
        processor = orchestrator.get_optimal_processor(
            ComputeTask.SPEECH_TO_TEXT,
            urgency="realtime"
        )

        # Execute with automatic fallback
        result = await orchestrator.execute(
            ComputeTask.EMOTION_DETECTION,
            input_data=audio_chunk,
            handlers={ProcessorType.NPU: npu_fn, ProcessorType.CPU: cpu_fn}
        )
    """

    def __init__(self) -> None:
        self._capabilities = DeviceCapabilities()
        self._thermal_state = ThermalState.NOMINAL
        self._battery_level: float = 1.0    # 0.0 - 1.0
        self._is_charging: bool = False
        self._performance_mode = PerformanceMode.BALANCED

        # Latency tracking for adaptive routing
        self._latency_history: Dict[str, List[float]] = {}
        self._task_count: int = 0

        logger.info("KiaanComputeOrchestrator initialized")

    # ── Configuration ───────────────────────────────────────────────────

    def update_capabilities(self, capabilities: DeviceCapabilities) -> None:
        """Set device capabilities (called once at startup or on device change)."""
        self._capabilities = capabilities
        logger.info(f"Device capabilities updated: {capabilities.summary()}")

    def update_thermal_state(self, state: ThermalState) -> None:
        """Called by platform thermal monitor."""
        prev = self._thermal_state
        self._thermal_state = state
        if state != prev:
            logger.info(f"Thermal state changed: {prev.value} → {state.value}")
        if state == ThermalState.CRITICAL:
            self._performance_mode = PerformanceMode.EFFICIENCY
            logger.warning("CRITICAL thermal — forcing efficiency mode")

    def update_battery(self, level: float, is_charging: bool = False) -> None:
        """Update battery level (0.0-1.0) and charging state."""
        self._battery_level = max(0.0, min(1.0, level))
        self._is_charging = is_charging

    def set_performance_mode(self, mode: PerformanceMode) -> None:
        """User or system-selected performance mode."""
        self._performance_mode = mode
        logger.info(f"Performance mode set to: {mode.value}")

    # ── Core Routing Logic ──────────────────────────────────────────────

    def get_optimal_processor(
        self,
        task: ComputeTask,
        urgency: str = "normal",
    ) -> ProcessorType:
        """
        Determine optimal processor considering:
        - Task's natural affinity
        - Device capabilities
        - Current thermal/battery state
        - Urgency level

        Args:
            task: The compute task to route
            urgency: "realtime" | "normal" | "background"

        Returns:
            The best ProcessorType for this task right now
        """
        natural = task.natural_processor

        # Wake word: ALWAYS NPU if available (battery critical path)
        if task == ComputeTask.WAKE_WORD_DETECTION:
            if self._capabilities.npu_available:
                return ProcessorType.NPU
            return ProcessorType.CPU

        # Critical thermal: force all GPU tasks to CPU
        if self._thermal_state == ThermalState.CRITICAL and natural == ProcessorType.GPU:
            logger.debug(f"Thermal critical: {task.name} GPU → CPU")
            return ProcessorType.CPU

        # Serious thermal: downgrade GPU tasks unless realtime
        if self._thermal_state == ThermalState.SERIOUS and natural == ProcessorType.GPU:
            if urgency != "realtime":
                return ProcessorType.CPU

        # Low battery (< 20%) and not charging: downgrade GPU to CPU
        if self._battery_level < 0.2 and not self._is_charging:
            if natural == ProcessorType.GPU:
                logger.debug(f"Low battery: {task.name} GPU → CPU")
                return ProcessorType.CPU

        # Very low battery (< 10%): downgrade NPU tasks to CPU too
        if self._battery_level < 0.1 and not self._is_charging:
            if natural == ProcessorType.NPU and task != ComputeTask.WAKE_WORD_DETECTION:
                return ProcessorType.CPU

        # Efficiency mode: prefer CPU for non-critical tasks
        if self._performance_mode == PerformanceMode.EFFICIENCY:
            if urgency == "background":
                return ProcessorType.CPU

        # Realtime urgency: use fastest available
        if urgency == "realtime":
            if natural == ProcessorType.NPU and self._capabilities.npu_available:
                return ProcessorType.NPU
            if natural == ProcessorType.GPU and self._capabilities.gpu_available:
                return ProcessorType.GPU
            if self._capabilities.gpu_available and natural != ProcessorType.CPU:
                return ProcessorType.GPU
            return ProcessorType.CPU

        # Normal: use natural affinity if hardware available
        if natural == ProcessorType.NPU and self._capabilities.npu_available:
            return ProcessorType.NPU
        if natural == ProcessorType.GPU and self._capabilities.gpu_available:
            return ProcessorType.GPU
        return ProcessorType.CPU

    def get_pipeline_plan(self, urgency: str = "normal") -> Dict[str, ProcessorType]:
        """
        Get the full voice pipeline processor assignment.
        Returns a mapping of task name → assigned processor.

        Useful for logging and debugging the entire pipeline plan.
        """
        plan = {}
        for task in ComputeTask:
            plan[task.name] = self.get_optimal_processor(task, urgency)
        return plan

    # ── Task Execution with Fallback ────────────────────────────────────

    async def execute(
        self,
        task: ComputeTask,
        input_data: Any,
        handlers: Dict[ProcessorType, Callable],
        urgency: str = "normal",
    ) -> TaskExecutionResult:
        """
        Execute a compute task with automatic processor selection and fallback.

        Args:
            task: The compute task
            input_data: Data to pass to the handler
            handlers: Dict mapping ProcessorType → async callable
            urgency: Priority level

        Returns:
            TaskExecutionResult with timing and output
        """
        optimal = self.get_optimal_processor(task, urgency)
        fallback_chain = self._get_fallback_chain(optimal, handlers)

        for i, processor in enumerate(fallback_chain):
            handler = handlers.get(processor)
            if handler is None:
                continue

            start_time = time.perf_counter()
            try:
                output = await handler(input_data)
                latency_ms = (time.perf_counter() - start_time) * 1000

                self._record_latency(task, processor, latency_ms)
                self._task_count += 1

                return TaskExecutionResult(
                    task=task,
                    processor_used=processor,
                    latency_ms=latency_ms,
                    success=True,
                    output=output,
                    fallback_used=(i > 0),
                )
            except Exception as e:
                latency_ms = (time.perf_counter() - start_time) * 1000
                logger.warning(
                    f"{task.name} failed on {processor.value} "
                    f"({latency_ms:.1f}ms): {e}"
                )
                continue

        # All processors failed
        return TaskExecutionResult(
            task=task,
            processor_used=ProcessorType.CPU,
            latency_ms=0,
            success=False,
            error="All processors failed for task",
            fallback_used=True,
        )

    # ── Latency Budget Estimation ───────────────────────────────────────

    def estimate_pipeline_latency_ms(self, urgency: str = "normal") -> Dict[str, float]:
        """
        Estimate total pipeline latency based on current assignments.
        Uses historical latency if available, otherwise typical values.

        Returns dict of task → estimated ms, plus "total" key.
        """
        estimates: Dict[str, float] = {}
        total = 0.0

        for task in ComputeTask:
            processor = self.get_optimal_processor(task, urgency)
            key = f"{task.name}_{processor.value}"

            # Use historical average if available
            if key in self._latency_history and self._latency_history[key]:
                avg = sum(self._latency_history[key][-10:]) / len(
                    self._latency_history[key][-10:]
                )
            else:
                avg = float(task.typical_latency_ms)
                # CPU fallback is typically 3-5x slower than GPU/NPU
                if processor == ProcessorType.CPU and task.natural_processor != ProcessorType.CPU:
                    avg *= 4.0

            estimates[task.name] = round(avg, 1)

        # Pipeline stages that run in parallel
        # Emotion detection + STT run concurrently
        parallel_stage = max(
            estimates.get("EMOTION_DETECTION", 4),
            estimates.get("SPEECH_TO_TEXT", 28),
        )
        # Sequential stages
        sequential = (
            estimates.get("WAKE_WORD_DETECTION", 3)
            + parallel_stage
            + estimates.get("ENGINE_ROUTING", 3)
            + estimates.get("VECTOR_SEARCH", 2)
            + estimates.get("WISDOM_RETRIEVAL", 5)
            + estimates.get("RESPONSE_COMPOSITION", 5)
            + estimates.get("TEXT_TO_SPEECH", 180)
            + estimates.get("AUDIO_ENHANCEMENT", 12)
        )

        estimates["_parallel_stt_emotion"] = round(parallel_stage, 1)
        estimates["_total_pipeline"] = round(sequential, 1)

        return estimates

    # ── Health & Diagnostics ────────────────────────────────────────────

    def get_status(self) -> Dict[str, Any]:
        """Return current orchestrator status for monitoring."""
        return {
            "capabilities": self._capabilities.summary(),
            "thermal_state": self._thermal_state.value,
            "battery_level": round(self._battery_level, 2),
            "is_charging": self._is_charging,
            "performance_mode": self._performance_mode.value,
            "tasks_processed": self._task_count,
            "pipeline_estimate_ms": self.estimate_pipeline_latency_ms(),
        }

    # ── Internal ────────────────────────────────────────────────────────

    def _get_fallback_chain(
        self,
        primary: ProcessorType,
        handlers: Dict[ProcessorType, Callable],
    ) -> List[ProcessorType]:
        """Build ordered fallback chain: primary → GPU → CPU."""
        chain = [primary]
        if primary != ProcessorType.GPU and ProcessorType.GPU in handlers:
            chain.append(ProcessorType.GPU)
        if primary != ProcessorType.CPU:
            chain.append(ProcessorType.CPU)
        return chain

    def _record_latency(
        self, task: ComputeTask, processor: ProcessorType, latency_ms: float
    ) -> None:
        """Track latency history for adaptive routing (keep last 50 samples)."""
        key = f"{task.name}_{processor.value}"
        if key not in self._latency_history:
            self._latency_history[key] = []
        self._latency_history[key].append(latency_ms)
        if len(self._latency_history[key]) > 50:
            self._latency_history[key] = self._latency_history[key][-50:]


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

_orchestrator: Optional[KiaanComputeOrchestrator] = None


def get_compute_orchestrator() -> KiaanComputeOrchestrator:
    """Get the singleton compute orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = KiaanComputeOrchestrator()
    return _orchestrator

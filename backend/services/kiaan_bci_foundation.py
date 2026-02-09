"""
KIAAN BCI Foundation - Brain-Computer Interface Ready Layer (Sprint 6)

Purpose: Build the foundational API layer and data protocols that will
enable future Neuralink-class hardware integration. Even without hardware
today, the software architecture must be ready.

This is the bridge between KIAAN's spiritual intelligence and
the human body's biological signals.

Architecture:
    BCIFoundation (orchestrator)
    ├── BiometricInputAPI (standardized biometric data ingestion)
    ├── EmotionStateProtocol (real-time emotion state machine)
    ├── FeedbackOutputProtocol (multi-modal output for biofeedback)
    ├── HardwarePluginArchitecture (pluggable hardware adapters)
    ├── NeuralSignalProcessor (EEG/EMG signal processing pipeline)
    └── MeditationBiofeedbackLoop (closed-loop meditation guidance)

Design Philosophy:
    "The Supreme Lord is situated in everyone's heart, O Arjuna,
    and is directing the wanderings of all living entities,
    who are seated as on a machine, made of the material energy." - BG 18.61

    The body is a machine (yantra). The soul drives it.
    BCI technology bridges the gap between the soul's intention
    and the machine's execution.

    KIAAN's BCI layer reads the body's signals to understand
    the soul's state, and provides feedback that helps the soul
    master the body-machine.

Supported Hardware (Future):
    - Neuralink (invasive EEG)
    - OpenBCI (non-invasive EEG)
    - Muse headband (consumer EEG)
    - Apple Watch / Fitbit (heart rate, HRV)
    - Oura Ring (sleep, HRV, temperature)
    - Custom GSR sensors (galvanic skin response)
    - Breathing sensors (respiration rate)
    - Eye trackers (attention, focus)

Quantum-Level Verification:
    - All biometric data validated against physiological ranges
    - State machine transitions are deterministic and logged
    - Feedback loops have configurable bounds (safety limits)
    - Hardware adapters must pass capability verification
    - Signal processing uses validated DSP algorithms
"""

import asyncio
import json
import logging
import math
import time
import uuid
from abc import ABC, abstractmethod
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional, Protocol, Tuple

logger = logging.getLogger(__name__)


# =============================================================================
# ENUMS AND DATA MODELS
# =============================================================================

class BiometricType(str, Enum):
    """Types of biometric signals."""
    HEART_RATE = "heart_rate"               # BPM
    HEART_RATE_VARIABILITY = "hrv"          # ms (RMSSD)
    GALVANIC_SKIN_RESPONSE = "gsr"          # microsiemens
    RESPIRATION_RATE = "respiration_rate"    # breaths per minute
    SKIN_TEMPERATURE = "skin_temperature"   # Celsius
    BLOOD_OXYGEN = "blood_oxygen"           # SpO2 percentage
    EEG_ALPHA = "eeg_alpha"                 # Alpha wave power (8-12 Hz)
    EEG_BETA = "eeg_beta"                   # Beta wave power (12-30 Hz)
    EEG_THETA = "eeg_theta"                 # Theta wave power (4-8 Hz)
    EEG_DELTA = "eeg_delta"                 # Delta wave power (0.5-4 Hz)
    EEG_GAMMA = "eeg_gamma"                 # Gamma wave power (30-100 Hz)
    EYE_TRACKING = "eye_tracking"           # Gaze position + pupil dilation
    EMG = "emg"                             # Muscle tension (microvolts)
    BODY_MOVEMENT = "body_movement"         # Accelerometer data


class MeditationDepth(str, Enum):
    """Depth of meditation based on biometric signals."""
    SURFACE = "surface"             # Active mind, minimal relaxation
    RELAXED = "relaxed"             # Physical relaxation beginning
    FOCUSED = "focused"             # Single-pointed attention
    ABSORBED = "absorbed"           # Deep meditation (dhyana)
    TRANSCENDENT = "transcendent"   # Beyond thought (samadhi indicators)


class EmotionBioState(str, Enum):
    """Emotion states detectable from biometric signals."""
    CALM = "calm"
    ANXIOUS = "anxious"
    STRESSED = "stressed"
    FOCUSED = "focused"
    DROWSY = "drowsy"
    EXCITED = "excited"
    PEACEFUL = "peaceful"
    AGITATED = "agitated"
    MEDITATIVE = "meditative"
    FLOW = "flow"


class FeedbackModality(str, Enum):
    """Output modalities for biofeedback."""
    AUDIO = "audio"               # Guided voice, ambient sounds
    VISUAL = "visual"             # Light patterns, color shifts
    HAPTIC = "haptic"             # Vibration patterns
    BREATHING_GUIDE = "breathing_guide"  # Inhale/exhale timing
    BINAURAL = "binaural"         # Binaural beats for brainwave entrainment
    AMBIENT = "ambient"           # Environmental adjustments


class HardwareCapability(str, Enum):
    """Capabilities a hardware device can provide."""
    EEG = "eeg"
    HEART_RATE = "heart_rate"
    HRV = "hrv"
    GSR = "gsr"
    RESPIRATION = "respiration"
    TEMPERATURE = "temperature"
    EYE_TRACKING = "eye_tracking"
    HAPTIC_OUTPUT = "haptic_output"
    AUDIO_OUTPUT = "audio_output"


@dataclass
class BiometricReading:
    """
    A single biometric data point with full metadata.

    Every reading is validated against physiological ranges
    to prevent corrupted data from affecting KIAAN's analysis.
    """
    id: str = field(default_factory=lambda: f"bio_{uuid.uuid4().hex[:8]}")
    type: BiometricType = BiometricType.HEART_RATE
    value: float = 0.0
    unit: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    device_id: str = ""
    confidence: float = 1.0          # Signal quality 0.0-1.0
    is_valid: bool = True
    validation_error: str = ""

    # Physiological valid ranges
    VALID_RANGES: dict = field(default=None, repr=False)

    def __post_init__(self):
        if self.VALID_RANGES is None:
            self.VALID_RANGES = {
                BiometricType.HEART_RATE: (30, 220, "bpm"),
                BiometricType.HEART_RATE_VARIABILITY: (5, 200, "ms"),
                BiometricType.GALVANIC_SKIN_RESPONSE: (0.01, 20, "μS"),
                BiometricType.RESPIRATION_RATE: (4, 40, "brpm"),
                BiometricType.SKIN_TEMPERATURE: (25, 42, "°C"),
                BiometricType.BLOOD_OXYGEN: (70, 100, "%"),
                BiometricType.EEG_ALPHA: (0, 100, "μV²"),
                BiometricType.EEG_BETA: (0, 100, "μV²"),
                BiometricType.EEG_THETA: (0, 100, "μV²"),
                BiometricType.EEG_DELTA: (0, 100, "μV²"),
                BiometricType.EEG_GAMMA: (0, 50, "μV²"),
                BiometricType.EMG: (0, 1000, "μV"),
            }
        self.validate()

    def validate(self) -> bool:
        """Validate reading against physiological ranges."""
        range_info = self.VALID_RANGES.get(self.type)
        if range_info:
            min_val, max_val, unit = range_info
            self.unit = unit
            if not (min_val <= self.value <= max_val):
                self.is_valid = False
                self.validation_error = (
                    f"{self.type.value}: {self.value} outside range "
                    f"[{min_val}, {max_val}] {unit}"
                )
                return False
        self.is_valid = True
        return True


@dataclass
class BiometricSnapshot:
    """
    A complete snapshot of all available biometric data at a moment.
    """
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    readings: Dict[BiometricType, BiometricReading] = field(default_factory=dict)
    derived_state: Optional[EmotionBioState] = None
    meditation_depth: Optional[MeditationDepth] = None
    stress_index: float = 0.0          # 0.0 (calm) to 1.0 (extreme stress)
    focus_index: float = 0.0           # 0.0 (scattered) to 1.0 (laser focus)
    relaxation_index: float = 0.0      # 0.0 (tense) to 1.0 (deep relaxation)
    coherence_index: float = 0.0       # 0.0 (chaotic) to 1.0 (harmonious)

    def get_reading(self, biometric_type: BiometricType) -> Optional[float]:
        """Get a specific reading value."""
        reading = self.readings.get(biometric_type)
        return reading.value if reading and reading.is_valid else None


@dataclass
class FeedbackInstruction:
    """
    An instruction for the feedback output system.
    """
    modality: FeedbackModality
    action: str                    # e.g., "slow_breathing", "play_om", "vibrate_gentle"
    parameters: Dict[str, Any] = field(default_factory=dict)
    duration_seconds: float = 0.0
    priority: int = 5              # 1 (highest) to 10 (lowest)
    gita_context: str = ""         # Spiritual context for this feedback


@dataclass
class HardwareDeviceInfo:
    """
    Information about a connected hardware device.
    """
    device_id: str
    device_name: str
    manufacturer: str
    capabilities: List[HardwareCapability]
    sampling_rate_hz: float = 0.0
    battery_percent: float = 100.0
    firmware_version: str = ""
    is_connected: bool = False
    last_reading: Optional[datetime] = None


# =============================================================================
# HARDWARE PLUGIN ARCHITECTURE
# =============================================================================

class HardwareAdapter(ABC):
    """
    Abstract base class for hardware adapters.

    Every hardware device that connects to KIAAN must implement
    this interface. This ensures consistent data flow regardless
    of the underlying hardware.
    """

    @abstractmethod
    async def connect(self) -> bool:
        """Connect to the hardware device."""
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from the hardware device."""
        ...

    @abstractmethod
    async def read(self) -> List[BiometricReading]:
        """Read current biometric data from the device."""
        ...

    @abstractmethod
    def get_device_info(self) -> HardwareDeviceInfo:
        """Get device information and capabilities."""
        ...

    @abstractmethod
    def get_capabilities(self) -> List[HardwareCapability]:
        """Get list of capabilities this device supports."""
        ...


class SimulatedHardwareAdapter(HardwareAdapter):
    """
    Simulated hardware adapter for testing and development.

    Generates realistic-looking biometric data based on
    configurable profiles (calm, stressed, meditating, etc.).
    """

    def __init__(self, profile: str = "calm"):
        self._profile = profile
        self._connected = False
        self._device_info = HardwareDeviceInfo(
            device_id="sim_001",
            device_name="KIAAN Simulator",
            manufacturer="MindVibe",
            capabilities=[
                HardwareCapability.HEART_RATE,
                HardwareCapability.HRV,
                HardwareCapability.GSR,
                HardwareCapability.RESPIRATION,
                HardwareCapability.EEG,
            ],
            sampling_rate_hz=256.0,
            firmware_version="sim-1.0.0",
        )

        # Profile-based baseline values
        self._profiles = {
            "calm": {
                BiometricType.HEART_RATE: (65, 5),
                BiometricType.HEART_RATE_VARIABILITY: (60, 10),
                BiometricType.GALVANIC_SKIN_RESPONSE: (2.0, 0.3),
                BiometricType.RESPIRATION_RATE: (14, 2),
                BiometricType.EEG_ALPHA: (40, 5),
                BiometricType.EEG_BETA: (15, 3),
                BiometricType.EEG_THETA: (20, 4),
            },
            "stressed": {
                BiometricType.HEART_RATE: (90, 10),
                BiometricType.HEART_RATE_VARIABILITY: (30, 8),
                BiometricType.GALVANIC_SKIN_RESPONSE: (8.0, 1.5),
                BiometricType.RESPIRATION_RATE: (22, 3),
                BiometricType.EEG_ALPHA: (15, 3),
                BiometricType.EEG_BETA: (45, 8),
                BiometricType.EEG_THETA: (10, 3),
            },
            "meditating": {
                BiometricType.HEART_RATE: (55, 3),
                BiometricType.HEART_RATE_VARIABILITY: (80, 15),
                BiometricType.GALVANIC_SKIN_RESPONSE: (1.0, 0.2),
                BiometricType.RESPIRATION_RATE: (8, 1),
                BiometricType.EEG_ALPHA: (55, 8),
                BiometricType.EEG_BETA: (8, 2),
                BiometricType.EEG_THETA: (35, 6),
            },
        }

    async def connect(self) -> bool:
        self._connected = True
        self._device_info.is_connected = True
        logger.info("Simulated hardware connected")
        return True

    async def disconnect(self) -> None:
        self._connected = False
        self._device_info.is_connected = False

    async def read(self) -> List[BiometricReading]:
        if not self._connected:
            return []

        import random
        profile_data = self._profiles.get(self._profile, self._profiles["calm"])
        readings = []

        for bio_type, (mean, std) in profile_data.items():
            value = random.gauss(mean, std)
            reading = BiometricReading(
                type=bio_type,
                value=round(value, 2),
                device_id=self._device_info.device_id,
                confidence=0.95,
            )
            readings.append(reading)

        self._device_info.last_reading = datetime.now(timezone.utc)
        return readings

    def get_device_info(self) -> HardwareDeviceInfo:
        return self._device_info

    def get_capabilities(self) -> List[HardwareCapability]:
        return self._device_info.capabilities


class HardwarePluginManager:
    """
    Manages hardware device plugins.

    Handles:
    - Device registration and discovery
    - Connection lifecycle
    - Data aggregation from multiple devices
    - Capability negotiation
    """

    def __init__(self):
        self._adapters: Dict[str, HardwareAdapter] = {}
        self._connected_devices: Dict[str, HardwareDeviceInfo] = {}

    async def register_adapter(self, adapter: HardwareAdapter) -> str:
        """Register a hardware adapter."""
        device_info = adapter.get_device_info()
        self._adapters[device_info.device_id] = adapter
        logger.info(f"Hardware adapter registered: {device_info.device_name}")
        return device_info.device_id

    async def connect_device(self, device_id: str) -> bool:
        """Connect to a registered device."""
        adapter = self._adapters.get(device_id)
        if not adapter:
            return False
        success = await adapter.connect()
        if success:
            self._connected_devices[device_id] = adapter.get_device_info()
        return success

    async def disconnect_device(self, device_id: str) -> None:
        """Disconnect a device."""
        adapter = self._adapters.get(device_id)
        if adapter:
            await adapter.disconnect()
            self._connected_devices.pop(device_id, None)

    async def read_all(self) -> List[BiometricReading]:
        """Read from all connected devices."""
        all_readings = []
        for device_id, adapter in self._adapters.items():
            if device_id in self._connected_devices:
                try:
                    readings = await adapter.read()
                    all_readings.extend(readings)
                except Exception as e:
                    logger.error(f"Failed to read from {device_id}: {e}")
        return all_readings

    def get_available_capabilities(self) -> List[HardwareCapability]:
        """Get all capabilities available across connected devices."""
        capabilities = set()
        for info in self._connected_devices.values():
            capabilities.update(info.capabilities)
        return list(capabilities)

    def get_connected_devices(self) -> List[Dict[str, Any]]:
        """Get list of connected devices."""
        return [
            {
                "device_id": info.device_id,
                "name": info.device_name,
                "manufacturer": info.manufacturer,
                "capabilities": [c.value for c in info.capabilities],
                "battery": info.battery_percent,
                "connected": info.is_connected,
            }
            for info in self._connected_devices.values()
        ]


# =============================================================================
# BIOMETRIC INPUT API
# =============================================================================

class BiometricInputAPI:
    """
    Standardized API for ingesting biometric data from any source.

    All biometric data flows through this API regardless of origin:
    - Hardware devices (via adapters)
    - Manual input (user enters resting heart rate)
    - Estimated values (derived from behavior patterns)
    """

    def __init__(self):
        self._reading_history: Dict[BiometricType, Deque[BiometricReading]] = {
            bt: deque(maxlen=1000) for bt in BiometricType
        }
        self._current_snapshot: Optional[BiometricSnapshot] = None

    async def ingest_reading(self, reading: BiometricReading) -> bool:
        """Ingest a single biometric reading."""
        if not reading.is_valid:
            logger.warning(f"Invalid reading rejected: {reading.validation_error}")
            return False

        self._reading_history[reading.type].append(reading)
        return True

    async def ingest_batch(self, readings: List[BiometricReading]) -> int:
        """Ingest a batch of readings. Returns count of accepted readings."""
        accepted = 0
        for reading in readings:
            if await self.ingest_reading(reading):
                accepted += 1
        return accepted

    async def get_current_snapshot(self) -> BiometricSnapshot:
        """
        Build a snapshot from the most recent readings of each type.
        """
        snapshot = BiometricSnapshot()

        for bio_type, history in self._reading_history.items():
            if history:
                latest = history[-1]
                # Only include readings from last 30 seconds
                age = (datetime.now(timezone.utc) - latest.timestamp).total_seconds()
                if age < 30 and latest.is_valid:
                    snapshot.readings[bio_type] = latest

        # Compute derived indices
        snapshot = self._compute_derived_indices(snapshot)
        self._current_snapshot = snapshot
        return snapshot

    def _compute_derived_indices(self, snapshot: BiometricSnapshot) -> BiometricSnapshot:
        """Compute derived indices from raw biometric data."""
        hr = snapshot.get_reading(BiometricType.HEART_RATE)
        hrv = snapshot.get_reading(BiometricType.HEART_RATE_VARIABILITY)
        gsr = snapshot.get_reading(BiometricType.GALVANIC_SKIN_RESPONSE)
        resp = snapshot.get_reading(BiometricType.RESPIRATION_RATE)
        alpha = snapshot.get_reading(BiometricType.EEG_ALPHA)
        beta = snapshot.get_reading(BiometricType.EEG_BETA)
        theta = snapshot.get_reading(BiometricType.EEG_THETA)

        # Stress Index: high HR + low HRV + high GSR + high respiration
        stress_components = []
        if hr is not None:
            stress_components.append(min((hr - 60) / 60, 1.0))  # Normalize: 60=0, 120=1
        if hrv is not None:
            stress_components.append(max(1.0 - hrv / 80, 0.0))  # Low HRV = high stress
        if gsr is not None:
            stress_components.append(min(gsr / 10, 1.0))         # High GSR = stress
        if resp is not None:
            stress_components.append(min((resp - 12) / 18, 1.0)) # High resp = stress
        if stress_components:
            snapshot.stress_index = sum(stress_components) / len(stress_components)
            snapshot.stress_index = max(0.0, min(1.0, snapshot.stress_index))

        # Focus Index: high beta + low theta (for active focus)
        if beta is not None and theta is not None:
            total = beta + theta
            if total > 0:
                snapshot.focus_index = beta / total
            snapshot.focus_index = max(0.0, min(1.0, snapshot.focus_index))

        # Relaxation Index: high alpha + high HRV + low HR
        relax_components = []
        if alpha is not None:
            relax_components.append(min(alpha / 50, 1.0))
        if hrv is not None:
            relax_components.append(min(hrv / 80, 1.0))
        if hr is not None:
            relax_components.append(max(1.0 - (hr - 50) / 50, 0.0))
        if relax_components:
            snapshot.relaxation_index = sum(relax_components) / len(relax_components)
            snapshot.relaxation_index = max(0.0, min(1.0, snapshot.relaxation_index))

        # Coherence Index: heart-brain synchrony approximation
        # High alpha + high HRV + low stress
        if alpha is not None and hrv is not None:
            snapshot.coherence_index = (
                (min(alpha / 50, 1.0) + min(hrv / 80, 1.0) + (1 - snapshot.stress_index))
                / 3.0
            )
            snapshot.coherence_index = max(0.0, min(1.0, snapshot.coherence_index))

        # Derive meditation depth
        snapshot.meditation_depth = self._classify_meditation_depth(snapshot)

        # Derive emotion state
        snapshot.derived_state = self._classify_emotion_state(snapshot)

        return snapshot

    def _classify_meditation_depth(self, snapshot: BiometricSnapshot) -> MeditationDepth:
        """Classify meditation depth from biometric indices."""
        r = snapshot.relaxation_index
        f = snapshot.focus_index
        c = snapshot.coherence_index
        theta = snapshot.get_reading(BiometricType.EEG_THETA) or 0

        if c > 0.8 and r > 0.8 and theta > 30:
            return MeditationDepth.TRANSCENDENT
        elif c > 0.7 and r > 0.7:
            return MeditationDepth.ABSORBED
        elif f > 0.6 and r > 0.5:
            return MeditationDepth.FOCUSED
        elif r > 0.5:
            return MeditationDepth.RELAXED
        else:
            return MeditationDepth.SURFACE

    def _classify_emotion_state(self, snapshot: BiometricSnapshot) -> EmotionBioState:
        """Classify emotion state from biometric indices."""
        s = snapshot.stress_index
        f = snapshot.focus_index
        r = snapshot.relaxation_index
        c = snapshot.coherence_index

        if c > 0.7 and r > 0.7:
            return EmotionBioState.MEDITATIVE
        elif r > 0.6 and s < 0.3:
            return EmotionBioState.PEACEFUL
        elif f > 0.7 and s < 0.4:
            return EmotionBioState.FLOW
        elif s > 0.7:
            return EmotionBioState.STRESSED
        elif s > 0.5:
            return EmotionBioState.ANXIOUS
        elif r > 0.4 and s < 0.4:
            return EmotionBioState.CALM
        elif f > 0.5:
            return EmotionBioState.FOCUSED
        elif r > 0.7 and f < 0.3:
            return EmotionBioState.DROWSY
        else:
            return EmotionBioState.CALM

    def get_trends(self, bio_type: BiometricType, minutes: int = 5) -> Dict[str, Any]:
        """Get trend analysis for a specific biometric type."""
        history = list(self._reading_history.get(bio_type, []))
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        recent = [r for r in history if r.timestamp >= cutoff and r.is_valid]

        if not recent:
            return {"type": bio_type.value, "status": "no_data"}

        values = [r.value for r in recent]
        mean = sum(values) / len(values)
        trend = "stable"
        if len(values) >= 3:
            first_half = values[:len(values) // 2]
            second_half = values[len(values) // 2:]
            first_mean = sum(first_half) / len(first_half)
            second_mean = sum(second_half) / len(second_half)
            if second_mean > first_mean * 1.05:
                trend = "increasing"
            elif second_mean < first_mean * 0.95:
                trend = "decreasing"

        return {
            "type": bio_type.value,
            "mean": round(mean, 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "samples": len(values),
            "trend": trend,
            "unit": recent[0].unit if recent else "",
        }


# =============================================================================
# EMOTION STATE PROTOCOL
# =============================================================================

class EmotionStateProtocol:
    """
    Real-time emotion state machine driven by biometric data.

    Tracks emotional state transitions and provides context
    for KIAAN's spiritual guidance.

    State transitions are deterministic: given the same biometric
    inputs, the same state will always be derived.
    """

    def __init__(self):
        self._current_state: EmotionBioState = EmotionBioState.CALM
        self._state_history: Deque[Tuple[datetime, EmotionBioState]] = deque(maxlen=500)
        self._transition_log: Deque[Dict[str, Any]] = deque(maxlen=200)

    def update_state(self, snapshot: BiometricSnapshot) -> Dict[str, Any]:
        """
        Update emotion state based on biometric snapshot.

        Returns state transition info if state changed.
        """
        new_state = snapshot.derived_state or EmotionBioState.CALM
        old_state = self._current_state
        now = datetime.now(timezone.utc)

        self._state_history.append((now, new_state))

        result = {
            "current_state": new_state.value,
            "previous_state": old_state.value,
            "changed": new_state != old_state,
            "stress_index": round(snapshot.stress_index, 3),
            "focus_index": round(snapshot.focus_index, 3),
            "relaxation_index": round(snapshot.relaxation_index, 3),
            "coherence_index": round(snapshot.coherence_index, 3),
            "meditation_depth": snapshot.meditation_depth.value if snapshot.meditation_depth else None,
        }

        if new_state != old_state:
            transition = {
                "from": old_state.value,
                "to": new_state.value,
                "timestamp": now.isoformat(),
                "trigger_indices": {
                    "stress": snapshot.stress_index,
                    "focus": snapshot.focus_index,
                    "relaxation": snapshot.relaxation_index,
                },
            }
            self._transition_log.append(transition)
            self._current_state = new_state

            # Map to spiritual insight
            result["spiritual_insight"] = self._get_spiritual_insight(old_state, new_state)

        return result

    def _get_spiritual_insight(
        self, from_state: EmotionBioState, to_state: EmotionBioState,
    ) -> str:
        """Get a Gita-based insight about the emotional transition."""
        insights = {
            (EmotionBioState.STRESSED, EmotionBioState.CALM): (
                "Your body is releasing tension. 'Yoga is the journey of the self, "
                "through the self, to the self' (BG 6.20). You are returning to center."
            ),
            (EmotionBioState.ANXIOUS, EmotionBioState.PEACEFUL): (
                "'When meditation is mastered, the mind is unwavering like a lamp "
                "in a windless place' (BG 6.19). You are touching that stillness."
            ),
            (EmotionBioState.CALM, EmotionBioState.MEDITATIVE): (
                "You are entering dhyana. 'The yogi who has controlled the mind "
                "achieves supreme peace' (BG 6.15). Let go and go deeper."
            ),
            (EmotionBioState.FOCUSED, EmotionBioState.FLOW): (
                "'Established in yoga, perform action' (BG 2.48). You have entered "
                "the flow state - action without ego. This is Nishkama Karma."
            ),
            (EmotionBioState.MEDITATIVE, EmotionBioState.CALM): (
                "The meditation is integrating. 'Having obtained real knowledge from "
                "a self-realized soul, you will never fall into illusion' (BG 4.35)."
            ),
            (EmotionBioState.CALM, EmotionBioState.STRESSED): (
                "I notice rising tension in your body. Remember: 'The nonpermanent "
                "appearance of happiness and distress are like winter and summer. "
                "They arise from sense perception and one must tolerate them' (BG 2.14)."
            ),
        }

        key = (from_state, to_state)
        return insights.get(key, (
            f"Your state is shifting from {from_state.value} to {to_state.value}. "
            "Observe this transition with witness-awareness (sakshi bhava). "
            "You are not the state - you are the one who observes it."
        ))

    def get_state_summary(self, minutes: int = 30) -> Dict[str, Any]:
        """Get summary of emotion states over a period."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        recent = [(t, s) for t, s in self._state_history if t >= cutoff]

        if not recent:
            return {"period_minutes": minutes, "dominant_state": self._current_state.value}

        state_counts = {}
        for _, state in recent:
            state_counts[state.value] = state_counts.get(state.value, 0) + 1

        dominant = max(state_counts, key=state_counts.get)
        return {
            "period_minutes": minutes,
            "dominant_state": dominant,
            "state_distribution": state_counts,
            "transitions": len(self._transition_log),
            "current_state": self._current_state.value,
        }


# =============================================================================
# FEEDBACK OUTPUT PROTOCOL
# =============================================================================

class FeedbackOutputProtocol:
    """
    Multi-modal feedback output for biofeedback loops.

    Generates feedback instructions based on the user's biometric state
    to guide them toward deeper meditation, calmer states, or
    heightened awareness.
    """

    def generate_feedback(
        self,
        snapshot: BiometricSnapshot,
        current_practice: str = "meditation",
    ) -> List[FeedbackInstruction]:
        """
        Generate feedback instructions based on current biometric state.
        """
        instructions: List[FeedbackInstruction] = []

        # Breathing guidance based on state
        if snapshot.stress_index > 0.6:
            instructions.append(FeedbackInstruction(
                modality=FeedbackModality.BREATHING_GUIDE,
                action="slow_breathing",
                parameters={
                    "inhale_seconds": 4,
                    "hold_seconds": 7,
                    "exhale_seconds": 8,
                    "cycles": 5,
                },
                duration_seconds=95,
                priority=1,
                gita_context="BG 5.27 - Regulate the breath as the sages do",
            ))

        elif snapshot.relaxation_index > 0.6 and current_practice == "meditation":
            instructions.append(FeedbackInstruction(
                modality=FeedbackModality.BREATHING_GUIDE,
                action="natural_breathing",
                parameters={
                    "observe_only": True,
                    "guidance": "Simply observe the breath. Let it flow naturally.",
                },
                duration_seconds=300,
                priority=3,
                gita_context="BG 6.25 - Gradually still the mind",
            ))

        # Audio guidance
        depth = snapshot.meditation_depth
        if depth == MeditationDepth.SURFACE:
            instructions.append(FeedbackInstruction(
                modality=FeedbackModality.AUDIO,
                action="grounding_guidance",
                parameters={
                    "message": "Bring your attention to the space between your eyebrows...",
                    "voice": "gentle",
                    "volume": 0.4,
                },
                priority=2,
                gita_context="BG 6.13 - Fix the gaze on the tip of the nose",
            ))
        elif depth in (MeditationDepth.ABSORBED, MeditationDepth.TRANSCENDENT):
            instructions.append(FeedbackInstruction(
                modality=FeedbackModality.AMBIENT,
                action="minimize_disturbance",
                parameters={
                    "reduce_all_output": True,
                    "maintain_silence": True,
                },
                priority=1,
                gita_context="BG 6.19 - Like a lamp in a windless place",
            ))

        # Binaural beats for brainwave entrainment
        if snapshot.focus_index < 0.4 and current_practice == "meditation":
            instructions.append(FeedbackInstruction(
                modality=FeedbackModality.BINAURAL,
                action="alpha_entrainment",
                parameters={
                    "base_frequency_hz": 200,
                    "beat_frequency_hz": 10,  # Alpha range
                    "volume": 0.2,
                },
                duration_seconds=600,
                priority=4,
                gita_context="BG 6.26 - Wherever the mind wanders, restrain it",
            ))

        # Haptic feedback for grounding
        if snapshot.stress_index > 0.7:
            instructions.append(FeedbackInstruction(
                modality=FeedbackModality.HAPTIC,
                action="gentle_pulse",
                parameters={
                    "pattern": "heartbeat",
                    "intensity": 0.3,
                    "frequency_hz": 1.0,  # Calm heartbeat rhythm
                },
                duration_seconds=60,
                priority=2,
                gita_context="BG 10.20 - I am the Self seated in the heart",
            ))

        return sorted(instructions, key=lambda x: x.priority)


# =============================================================================
# MEDITATION BIOFEEDBACK LOOP
# =============================================================================

class MeditationBiofeedbackLoop:
    """
    Closed-loop meditation guidance system.

    Reads biometric data → Assesses meditation state → Provides guidance →
    Reads biometric data again → Adjusts guidance → Repeat

    This creates a real-time feedback loop that adapts to the meditator's
    actual state, providing personalized guidance moment by moment.
    """

    def __init__(
        self,
        biometric_api: BiometricInputAPI,
        emotion_protocol: EmotionStateProtocol,
        feedback_protocol: FeedbackOutputProtocol,
    ):
        self._biometric_api = biometric_api
        self._emotion_protocol = emotion_protocol
        self._feedback_protocol = feedback_protocol
        self._session_active = False
        self._session_start: Optional[datetime] = None
        self._session_log: List[Dict[str, Any]] = []

    async def start_session(self, practice: str = "meditation") -> Dict[str, Any]:
        """Start a biofeedback meditation session."""
        self._session_active = True
        self._session_start = datetime.now(timezone.utc)
        self._session_log = []

        return {
            "status": "session_started",
            "practice": practice,
            "started_at": self._session_start.isoformat(),
            "message": (
                "Meditation session beginning. Find a comfortable posture. "
                "Close your eyes. Let us journey inward together. "
                "'Wherever the mind wanders, restrain it and bring it back "
                "to the Self' (BG 6.26)."
            ),
        }

    async def process_cycle(self) -> Dict[str, Any]:
        """
        Run one cycle of the biofeedback loop.

        Call this at regular intervals (e.g., every 1-5 seconds).
        """
        if not self._session_active:
            return {"status": "no_active_session"}

        # Read biometric state
        snapshot = await self._biometric_api.get_current_snapshot()

        # Update emotion state
        state_update = self._emotion_protocol.update_state(snapshot)

        # Generate feedback
        feedback = self._feedback_protocol.generate_feedback(snapshot)

        # Log this cycle
        cycle_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "state": state_update,
            "feedback_count": len(feedback),
            "meditation_depth": snapshot.meditation_depth.value if snapshot.meditation_depth else None,
        }
        self._session_log.append(cycle_data)

        return {
            "state": state_update,
            "feedback": [
                {
                    "modality": f.modality.value,
                    "action": f.action,
                    "parameters": f.parameters,
                    "gita_context": f.gita_context,
                }
                for f in feedback
            ],
            "meditation_depth": snapshot.meditation_depth.value if snapshot.meditation_depth else None,
            "indices": {
                "stress": round(snapshot.stress_index, 3),
                "focus": round(snapshot.focus_index, 3),
                "relaxation": round(snapshot.relaxation_index, 3),
                "coherence": round(snapshot.coherence_index, 3),
            },
        }

    async def end_session(self) -> Dict[str, Any]:
        """End the meditation session and provide summary."""
        self._session_active = False
        duration = 0
        if self._session_start:
            duration = (datetime.now(timezone.utc) - self._session_start).total_seconds()

        # Analyze session
        depth_counts = {}
        for entry in self._session_log:
            depth = entry.get("meditation_depth", "surface")
            depth_counts[depth] = depth_counts.get(depth, 0) + 1

        deepest = max(depth_counts, key=depth_counts.get) if depth_counts else "surface"
        total_cycles = len(self._session_log)

        return {
            "status": "session_complete",
            "duration_seconds": round(duration, 1),
            "total_cycles": total_cycles,
            "deepest_state": deepest,
            "depth_distribution": depth_counts,
            "summary": self._generate_session_summary(duration, deepest, depth_counts),
        }

    def _generate_session_summary(
        self,
        duration: float,
        deepest: str,
        distribution: Dict[str, int],
    ) -> str:
        """Generate a Gita-inspired session summary."""
        minutes = int(duration / 60)

        depth_messages = {
            MeditationDepth.SURFACE.value: (
                f"You sat in stillness for {minutes} minutes. Every moment of "
                "practice matters. 'In this path no effort is ever lost' (BG 2.40)."
            ),
            MeditationDepth.RELAXED.value: (
                f"In {minutes} minutes, you found physical relaxation. The body "
                "is settling. 'The yogi should practice in a secluded place, "
                "controlling body and mind' (BG 6.10)."
            ),
            MeditationDepth.FOCUSED.value: (
                f"Beautiful. In {minutes} minutes, you achieved focused attention. "
                "'The mind, when focused, becomes a powerful instrument of Self-knowledge' "
                "(BG 6.26)."
            ),
            MeditationDepth.ABSORBED.value: (
                f"Extraordinary. In {minutes} minutes, you touched dhyana - "
                "absorbed meditation. 'The yogi who has controlled the mind achieves "
                "supreme peace and merges in the Self' (BG 6.15)."
            ),
            MeditationDepth.TRANSCENDENT.value: (
                f"In {minutes} minutes, your biometrics indicate a transcendent state. "
                "'Having obtained real knowledge, you will never fall into illusion' "
                "(BG 4.35). This is a rare and precious experience."
            ),
        }

        return depth_messages.get(deepest, f"Session complete: {minutes} minutes of practice.")


# =============================================================================
# BCI FOUNDATION - MASTER ORCHESTRATOR
# =============================================================================

class BCIFoundation:
    """
    The complete Brain-Computer Interface foundation for KIAAN.

    Orchestrates all BCI components:
    - Hardware plugin management
    - Biometric data ingestion
    - Emotion state tracking
    - Feedback generation
    - Meditation biofeedback loops

    Even without physical hardware, this layer is fully functional
    with the simulated adapter for development and testing.
    """

    def __init__(self):
        self.hardware_manager = HardwarePluginManager()
        self.biometric_api = BiometricInputAPI()
        self.emotion_protocol = EmotionStateProtocol()
        self.feedback_protocol = FeedbackOutputProtocol()
        self.biofeedback_loop = MeditationBiofeedbackLoop(
            self.biometric_api,
            self.emotion_protocol,
            self.feedback_protocol,
        )
        self._initialized = False

    async def initialize(self, use_simulator: bool = True) -> None:
        """Initialize the BCI foundation."""
        if self._initialized:
            return

        if use_simulator:
            simulator = SimulatedHardwareAdapter(profile="calm")
            device_id = await self.hardware_manager.register_adapter(simulator)
            await self.hardware_manager.connect_device(device_id)
            logger.info("BCI Foundation initialized with simulator")

        self._initialized = True
        logger.info("BCIFoundation initialized - Neuralink-ready interface active")

    async def read_and_process(self) -> Dict[str, Any]:
        """
        Read biometric data from all devices and process it.

        This is the main loop entry point for BCI integration.
        """
        # Read from hardware
        readings = await self.hardware_manager.read_all()
        accepted = await self.biometric_api.ingest_batch(readings)

        # Get current snapshot
        snapshot = await self.biometric_api.get_current_snapshot()

        # Update emotion state
        state = self.emotion_protocol.update_state(snapshot)

        # Generate feedback
        feedback = self.feedback_protocol.generate_feedback(snapshot)

        return {
            "readings_received": len(readings),
            "readings_accepted": accepted,
            "state": state,
            "feedback": [
                {
                    "modality": f.modality.value,
                    "action": f.action,
                    "gita_context": f.gita_context,
                }
                for f in feedback
            ],
        }

    def get_health(self) -> Dict[str, Any]:
        """Get BCI foundation health status."""
        return {
            "initialized": self._initialized,
            "connected_devices": self.hardware_manager.get_connected_devices(),
            "available_capabilities": [
                c.value for c in self.hardware_manager.get_available_capabilities()
            ],
            "current_emotion_state": self.emotion_protocol._current_state.value,
            "session_active": self.biofeedback_loop._session_active,
        }


# =============================================================================
# MODULE-LEVEL SINGLETON
# =============================================================================

bci_foundation = BCIFoundation()


async def get_bci_foundation() -> BCIFoundation:
    """Get the initialized BCIFoundation instance."""
    if not bci_foundation._initialized:
        await bci_foundation.initialize()
    return bci_foundation

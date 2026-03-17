"""
Voice Compute Allocation Policy

Formalizes provider selection based on device capability, network quality,
and subscription tier. Ensures efficient resource usage without draining
battery on mobile or degrading quality unnecessarily.

Priority order:
1. User safety and experience quality
2. Device health (battery, thermal)
3. Cost optimization
4. Latency targets
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class QualityTier(str, Enum):
    DIVINE = "divine"       # Best possible (ElevenLabs, Coqui XTTS)
    PREMIUM = "premium"     # High quality (Sarvam, Silero)
    STANDARD = "standard"   # Good quality (Piper, Edge TTS)
    FAST = "fast"           # Low latency priority (Silero, eSpeak)
    OFFLINE = "offline"     # No network (Piper, Silero local)


class DeviceType(str, Enum):
    DESKTOP = "desktop"
    LAPTOP = "laptop"
    TABLET = "tablet"
    MOBILE = "mobile"
    LOW_END_MOBILE = "low_end_mobile"


class NetworkQuality(str, Enum):
    EXCELLENT = "excellent"   # 5G, WiFi
    GOOD = "good"             # 4G, stable WiFi
    MODERATE = "moderate"     # 3G, weak WiFi
    POOR = "poor"             # 2G, intermittent
    OFFLINE = "offline"       # No network


class UserTier(str, Enum):
    FREE = "free"
    SADHAK = "sadhak"         # Basic paid
    SIDDHA = "siddha"         # Premium
    DIVINE = "divine"         # Highest tier


@dataclass
class DeviceInfo:
    """Information about the user's device capabilities."""
    device_type: DeviceType = DeviceType.DESKTOP
    network: NetworkQuality = NetworkQuality.GOOD
    cpu_cores: int = 4
    memory_gb: float = 4.0
    battery_level: Optional[float] = None    # 0-1, None if unknown/desktop
    is_charging: Optional[bool] = None
    is_thermal_throttled: bool = False
    supports_webgpu: bool = False
    supports_wasm: bool = True
    # GPU/NPU/AI acceleration capabilities
    supports_webnn: bool = False            # Web Neural Network API (NPU access)
    gpu_tier: str = "none"                  # "none" | "integrated" | "discrete"
    has_npu: bool = False                   # Apple Neural Engine, Qualcomm Hexagon, etc.
    onnx_runtime_available: bool = False    # ONNX Runtime Web available in browser


@dataclass
class ComputePolicy:
    """The computed policy for voice processing."""
    tts_provider: str            # elevenlabs, sarvam, silero, piper, browser, edge_tts
    tts_quality: QualityTier
    stt_provider: str            # whisper, vosk, browser
    use_local_inference: bool    # Use edge/local model for AI
    reason: str                  # Why this policy was chosen
    max_audio_length_s: int = 60 # Max audio to process per request
    enable_streaming: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Serialize policy to a dictionary for API responses."""
        return {
            "tts_provider": self.tts_provider,
            "tts_quality": self.tts_quality.value,
            "stt_provider": self.stt_provider,
            "use_local_inference": self.use_local_inference,
            "reason": self.reason,
            "max_audio_length_s": self.max_audio_length_s,
            "enable_streaming": self.enable_streaming,
        }


class VoiceComputePolicy:
    """
    Selects the optimal voice processing configuration based on
    device capabilities, network quality, and user subscription tier.

    Ensures no unnecessary battery drain on mobile, while maintaining
    the highest quality possible for premium users.
    """

    def select(
        self,
        device_info: DeviceInfo,
        user_tier: UserTier = UserTier.FREE,
    ) -> ComputePolicy:
        """
        Select the optimal compute policy.

        Decision matrix:
        - Premium + good network  -> ElevenLabs/Sarvam (highest quality)
        - Premium + poor network  -> Silero/Piper (edge, low latency)
        - Free + any network      -> Browser TTS + Web Speech API STT (zero cost)
        - Offline                 -> Piper + Vosk (fully local)
        - Low battery (< 20%)    -> lightest provider
        - Thermal throttled       -> reduce quality

        Args:
            device_info: Current device capabilities and state.
            user_tier: The user's subscription tier.

        Returns:
            ComputePolicy with provider selections and reasoning.
        """
        # Check offline first — no network means no cloud providers
        if device_info.network == NetworkQuality.OFFLINE:
            return self._offline_policy(device_info)

        # Check low battery — conserve power when not charging
        if device_info.battery_level is not None and device_info.battery_level < 0.20:
            if not device_info.is_charging:
                return self._low_battery_policy(device_info, user_tier)

        # Check thermal throttling — reduce compute load
        if device_info.is_thermal_throttled:
            return self._thermal_policy(device_info, user_tier)

        # On-device AI acceleration — use local inference for ultra-low latency
        # when device has GPU/NPU and network is not excellent
        if (
            device_info.has_npu
            or device_info.supports_webnn
            or (device_info.supports_webgpu and device_info.gpu_tier == "discrete")
        ):
            # Only prefer edge if network isn't great or user wants low latency
            if device_info.network not in (NetworkQuality.EXCELLENT,):
                return self._edge_ai_policy(device_info, user_tier)

        # Normal operation — based on tier + network quality
        if user_tier in (UserTier.DIVINE, UserTier.SIDDHA):
            return self._premium_policy(device_info)
        elif user_tier == UserTier.SADHAK:
            return self._standard_policy(device_info)
        else:
            return self._free_policy(device_info)

    def _edge_ai_policy(self, device: DeviceInfo, tier: UserTier) -> ComputePolicy:
        """Devices with GPU/NPU can run local inference for ultra-low latency (<500ms).

        This policy is selected when the device has hardware acceleration AND the
        network isn't excellent. On excellent networks, cloud providers still win
        on quality for premium users.
        """
        if device.has_npu or device.supports_webnn:
            return ComputePolicy(
                tts_provider="piper",
                tts_quality=QualityTier.PREMIUM,
                stt_provider="whisper_local",
                use_local_inference=True,
                reason="NPU/Neural Engine detected — on-device inference for <500ms latency",
                enable_streaming=True,
            )
        elif device.supports_webgpu and device.gpu_tier == "discrete":
            return ComputePolicy(
                tts_provider="silero",
                tts_quality=QualityTier.PREMIUM,
                stt_provider="whisper_local",
                use_local_inference=True,
                reason="Discrete GPU + WebGPU — GPU-accelerated local inference",
                enable_streaming=True,
            )
        # Fallback: integrated GPU — use lighter local models
        return ComputePolicy(
            tts_provider="silero",
            tts_quality=QualityTier.STANDARD,
            stt_provider="browser",
            use_local_inference=False,
            reason="Integrated GPU — local TTS only, cloud STT for accuracy",
            enable_streaming=True,
        )

    def _premium_policy(self, device: DeviceInfo) -> ComputePolicy:
        """Premium users get the best quality available for their network."""
        if device.network in (NetworkQuality.EXCELLENT, NetworkQuality.GOOD):
            return ComputePolicy(
                tts_provider="elevenlabs",
                tts_quality=QualityTier.DIVINE,
                stt_provider="whisper",
                use_local_inference=False,
                reason="Premium user on good network — highest quality cloud providers",
            )
        elif device.network == NetworkQuality.MODERATE:
            return ComputePolicy(
                tts_provider="sarvam",
                tts_quality=QualityTier.PREMIUM,
                stt_provider="whisper",
                use_local_inference=False,
                reason="Premium user on moderate network — balanced quality provider",
            )
        else:
            # Poor network — use edge processing for acceptable latency
            return ComputePolicy(
                tts_provider="silero",
                tts_quality=QualityTier.FAST,
                stt_provider="browser",
                use_local_inference=True,
                reason="Premium user on poor network — edge processing for low latency",
            )

    def _standard_policy(self, device: DeviceInfo) -> ComputePolicy:
        """Standard paid users get good quality with cost optimization."""
        if device.network in (NetworkQuality.EXCELLENT, NetworkQuality.GOOD):
            return ComputePolicy(
                tts_provider="sarvam",
                tts_quality=QualityTier.PREMIUM,
                stt_provider="whisper",
                use_local_inference=False,
                reason="Standard user on good network — quality cloud providers",
            )
        else:
            return ComputePolicy(
                tts_provider="edge_tts",
                tts_quality=QualityTier.STANDARD,
                stt_provider="browser",
                use_local_inference=False,
                reason="Standard user on weak network — lightweight cloud TTS",
            )

    def _free_policy(self, device: DeviceInfo) -> ComputePolicy:
        """Free users use browser-native APIs (zero cost)."""
        return ComputePolicy(
            tts_provider="browser",
            tts_quality=QualityTier.STANDARD,
            stt_provider="browser",
            use_local_inference=False,
            reason="Free user — browser-native TTS and STT for zero cost",
        )

    def _offline_policy(self, device: DeviceInfo) -> ComputePolicy:
        """Fully offline operation using local models when device supports it."""
        if device.cpu_cores >= 4 and device.memory_gb >= 4:
            return ComputePolicy(
                tts_provider="piper",
                tts_quality=QualityTier.OFFLINE,
                stt_provider="vosk",
                use_local_inference=True,
                reason="Offline — using local Piper TTS and Vosk STT",
                enable_streaming=False,
            )
        else:
            return ComputePolicy(
                tts_provider="browser",
                tts_quality=QualityTier.OFFLINE,
                stt_provider="browser",
                use_local_inference=False,
                reason="Offline on low-end device — browser fallback only",
                enable_streaming=False,
            )

    def _low_battery_policy(self, device: DeviceInfo, tier: UserTier) -> ComputePolicy:
        """Conserve battery — use lightest providers regardless of tier."""
        battery_pct = int((device.battery_level or 0) * 100)
        return ComputePolicy(
            tts_provider="browser",
            tts_quality=QualityTier.FAST,
            stt_provider="browser",
            use_local_inference=False,
            reason=f"Low battery ({battery_pct}%) — using browser-native for minimum power draw",
            max_audio_length_s=30,
        )

    def _thermal_policy(self, device: DeviceInfo, tier: UserTier) -> ComputePolicy:
        """Device is thermally throttled — reduce compute load."""
        return ComputePolicy(
            tts_provider="browser",
            tts_quality=QualityTier.FAST,
            stt_provider="browser",
            use_local_inference=False,
            reason="Thermal throttling detected — reducing compute load",
            max_audio_length_s=30,
        )


# Singleton
_policy_instance: Optional[VoiceComputePolicy] = None


def get_voice_compute_policy() -> VoiceComputePolicy:
    """Get the singleton VoiceComputePolicy instance."""
    global _policy_instance
    if _policy_instance is None:
        _policy_instance = VoiceComputePolicy()
    return _policy_instance

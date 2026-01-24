#!/usr/bin/env python3
"""
KIAAN Audio Synthesizer

Generates actual audio samples from scenarios using multiple TTS engines.

Features:
- 100+ natural AI voices
- Real-time audio augmentation
- Background noise synthesis
- Room acoustics simulation
- Microphone modeling
"""

import os
import sys
import json
import random
import asyncio
import tempfile
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib

# Audio processing
import librosa
import soundfile as sf
from scipy import signal
from scipy.io import wavfile

# Import scenario types
from continuous_learning_engine import (
    Scenario, ScenarioType, NaturalVoice, VoicePersonality,
    NATURAL_VOICES, ContinuousLearningConfig
)


# ============================================================================
# TTS ENGINE INTERFACE
# ============================================================================

class TTSEngine:
    """Base TTS engine interface"""

    def __init__(self):
        self.available = False

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        output_path: str,
        **kwargs
    ) -> bool:
        raise NotImplementedError


class EdgeTTSEngine(TTSEngine):
    """Microsoft Edge TTS - Best quality, free"""

    # Voice ID mapping
    VOICE_MAP = {
        "us_jenny": "en-US-JennyNeural",
        "us_guy": "en-US-GuyNeural",
        "us_aria": "en-US-AriaNeural",
        "us_davis": "en-US-DavisNeural",
        "us_amber": "en-US-AmberNeural",
        "us_ana": "en-US-AnaNeural",
        "us_ashley": "en-US-AshleyNeural",
        "us_brandon": "en-US-BrandonNeural",
        "us_christopher": "en-US-ChristopherNeural",
        "us_cora": "en-US-CoraNeural",
        "us_elizabeth": "en-US-ElizabethNeural",
        "us_eric": "en-US-EricNeural",
        "us_jacob": "en-US-JacobNeural",
        "us_jane": "en-US-JaneNeural",
        "us_jason": "en-US-JasonNeural",
        "us_michelle": "en-US-MichelleNeural",
        "us_monica": "en-US-MonicaNeural",
        "us_nancy": "en-US-NancyNeural",
        "us_roger": "en-US-RogerNeural",
        "us_sara": "en-US-SaraNeural",
        "us_steffan": "en-US-SteffanNeural",
        "us_tony": "en-US-TonyNeural",
        "uk_sonia": "en-GB-SoniaNeural",
        "uk_ryan": "en-GB-RyanNeural",
        "uk_libby": "en-GB-LibbyNeural",
        "uk_abbi": "en-GB-AbbiNeural",
        "uk_alfie": "en-GB-AlfieNeural",
        "uk_bella": "en-GB-BellaNeural",
        "uk_elliot": "en-GB-ElliotNeural",
        "uk_ethan": "en-GB-EthanNeural",
        "uk_hollie": "en-GB-HollieNeural",
        "uk_maisie": "en-GB-MaisieNeural",
        "uk_noah": "en-GB-NoahNeural",
        "uk_oliver": "en-GB-OliverNeural",
        "uk_olivia": "en-GB-OliviaNeural",
        "uk_thomas": "en-GB-ThomasNeural",
        "au_natasha": "en-AU-NatashaNeural",
        "au_william": "en-AU-WilliamNeural",
        "au_annette": "en-AU-AnnetteNeural",
        "au_carly": "en-AU-CarlyNeural",
        "au_darren": "en-AU-DarrenNeural",
        "au_duncan": "en-AU-DuncanNeural",
        "au_elsie": "en-AU-ElsieNeural",
        "au_freya": "en-AU-FreyaNeural",
        "au_joanne": "en-AU-JoanneNeural",
        "au_ken": "en-AU-KenNeural",
        "au_kim": "en-AU-KimNeural",
        "au_neil": "en-AU-NeilNeural",
        "au_tim": "en-AU-TimNeural",
        "au_tina": "en-AU-TinaNeural",
        "in_neerja": "en-IN-NeerjaNeural",
        "in_prabhat": "en-IN-PrabhatNeural",
        "in_aashi": "en-IN-AashiNeural",
        "in_aarti": "en-IN-AartiNeural",
        "in_ananya": "en-IN-AnanyaNeural",
        "in_kavya": "en-IN-KavyaNeural",
        "in_kunal": "en-IN-KunalNeural",
        "in_rehaan": "en-IN-RehaanNeural",
        "ca_clara": "en-CA-ClaraNeural",
        "ca_liam": "en-CA-LiamNeural",
        "ie_connor": "en-IE-ConnorNeural",
        "ie_emily": "en-IE-EmilyNeural",
        "nz_mitchell": "en-NZ-MitchellNeural",
        "nz_molly": "en-NZ-MollyNeural",
        "za_leah": "en-ZA-LeahNeural",
        "za_luke": "en-ZA-LukeNeural",
        "ph_james": "en-PH-JamesNeural",
        "ph_rosa": "en-PH-RosaNeural",
        "sg_luna": "en-SG-LunaNeural",
        "sg_wayne": "en-SG-WayneNeural",
        "ke_asilia": "en-KE-AsiliaNeural",
        "ke_chilemba": "en-KE-ChilembaNeural",
        "ng_abeo": "en-NG-AbeoNeural",
        "ng_ezinne": "en-NG-EzinneNeural",
        "tz_elimu": "en-TZ-ElimuNeural",
        "tz_imani": "en-TZ-ImaniNeural",
        "hi_madhur": "hi-IN-MadhurNeural",
        "hi_swara": "hi-IN-SwaraNeural",
    }

    def __init__(self):
        super().__init__()
        try:
            import edge_tts
            self.edge_tts = edge_tts
            self.available = True
        except ImportError:
            print("Installing edge-tts...")
            os.system("pip install edge-tts")
            import edge_tts
            self.edge_tts = edge_tts
            self.available = True

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        output_path: str,
        pitch: str = "+0Hz",
        rate: str = "+0%",
        volume: str = "+0%",
    ) -> bool:
        try:
            edge_voice = self.VOICE_MAP.get(voice_id, "en-US-JennyNeural")

            communicate = self.edge_tts.Communicate(
                text,
                edge_voice,
                pitch=pitch,
                rate=rate,
                volume=volume,
            )

            await communicate.save(output_path)
            return True

        except Exception as e:
            print(f"Edge TTS error: {e}")
            return False


# ============================================================================
# AUDIO AUGMENTATION
# ============================================================================

class AudioAugmenter:
    """Advanced audio augmentation for robust training"""

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate

        # Pre-generated noise buffers
        self._noise_buffers = {}

    def load_audio(self, path: str) -> np.ndarray:
        """Load and normalize audio"""
        audio, sr = librosa.load(path, sr=self.sample_rate)
        return audio / (np.max(np.abs(audio)) + 1e-8)

    def save_audio(self, audio: np.ndarray, path: str):
        """Save audio"""
        sf.write(path, audio, self.sample_rate)

    def apply_scenario(self, audio: np.ndarray, scenario: Scenario) -> np.ndarray:
        """Apply all scenario-based augmentations"""
        result = audio.copy()

        # 1. Volume adjustment
        result = result * scenario.volume

        # 2. Pitch shift
        if abs(scenario.pitch_shift) > 0.1:
            result = self.pitch_shift(result, scenario.pitch_shift)

        # 3. Speed change
        if abs(scenario.speed_factor - 1.0) > 0.05:
            result = self.time_stretch(result, scenario.speed_factor)

        # 4. Add reverb based on environment
        if scenario.reverb_level > 0.1:
            result = self.add_reverb(result, scenario.reverb_level)

        # 5. Add background noise
        result = self.add_noise(
            result,
            noise_type=scenario.background_noise_type,
            snr_db=scenario.snr_db,
        )

        # 6. Simulate distance
        if scenario.distance_meters > 0.5:
            result = self.simulate_distance(result, scenario.distance_meters)

        # 7. Apply microphone characteristics
        result = self.apply_microphone_model(result, scenario.microphone_type)

        # Normalize output
        result = result / (np.max(np.abs(result)) + 1e-8)

        return result

    def pitch_shift(self, audio: np.ndarray, semitones: float) -> np.ndarray:
        """Shift pitch by semitones"""
        return librosa.effects.pitch_shift(
            audio,
            sr=self.sample_rate,
            n_steps=semitones,
        )

    def time_stretch(self, audio: np.ndarray, rate: float) -> np.ndarray:
        """Change speed without pitch change"""
        return librosa.effects.time_stretch(audio, rate=rate)

    def add_reverb(self, audio: np.ndarray, level: float) -> np.ndarray:
        """Add reverb effect"""
        # Create impulse response
        ir_length = int(self.sample_rate * 0.5)
        t = np.arange(ir_length) / self.sample_rate

        # Exponential decay with early reflections
        ir = np.zeros(ir_length)
        ir[0] = 1.0

        # Add reflections
        reflection_times = [0.01, 0.02, 0.035, 0.05, 0.08, 0.12, 0.18]
        reflection_gains = [0.8, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15]

        for time, gain in zip(reflection_times, reflection_gains):
            idx = int(time * self.sample_rate)
            if idx < ir_length:
                ir[idx] = gain * level

        # Decay tail
        decay = np.exp(-6 * t * (1 - level * 0.5))
        ir = ir * decay

        # Convolve
        reverb = signal.convolve(audio, ir, mode='same')

        # Mix dry and wet
        return (1 - level * 0.5) * audio + level * 0.5 * reverb

    def add_noise(
        self,
        audio: np.ndarray,
        noise_type: str,
        snr_db: float,
    ) -> np.ndarray:
        """Add background noise at specified SNR"""
        noise = self._generate_noise(noise_type, len(audio))

        # Calculate and apply SNR
        signal_power = np.mean(audio ** 2)
        noise_power = np.mean(noise ** 2)

        if noise_power > 0:
            snr_linear = 10 ** (snr_db / 10)
            noise_scaling = np.sqrt(signal_power / (snr_linear * noise_power))
            return audio + noise_scaling * noise

        return audio

    def _generate_noise(self, noise_type: str, length: int) -> np.ndarray:
        """Generate different types of noise"""
        if noise_type == "white":
            return np.random.randn(length)

        elif noise_type == "pink":
            white = np.fft.rfft(np.random.randn(length))
            freqs = np.fft.rfftfreq(length)
            freqs[0] = 1
            pink = white / np.sqrt(freqs)
            return np.fft.irfft(pink, n=length)

        elif noise_type == "brown":
            return np.cumsum(np.random.randn(length)) / 50

        elif noise_type == "wind":
            # Low frequency rumble with gusts
            base = self._generate_noise("brown", length)
            gusts = np.random.randn(length) * 0.3
            modulation = 0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * np.arange(length) / self.sample_rate)
            return base * modulation + gusts

        elif noise_type == "babble":
            # Multiple overlapping voices
            babble = np.zeros(length)
            for _ in range(random.randint(3, 8)):
                voice = np.random.randn(length)
                # Modulate to simulate speech patterns
                env = np.abs(np.random.randn(length // 1000))
                env = np.repeat(env, 1000)[:length]
                babble += voice * env * 0.2
            return babble

        elif noise_type == "music":
            # Simulate background music
            t = np.arange(length) / self.sample_rate
            freqs = [220, 330, 440, 550, 660]
            music = sum(np.sin(2 * np.pi * f * t) * random.uniform(0.1, 0.3) for f in freqs)
            # Add rhythm
            beat_freq = random.uniform(1.5, 2.5)
            beat = 0.5 + 0.5 * np.sin(2 * np.pi * beat_freq * t)
            return music * beat

        elif noise_type == "hvac":
            # HVAC/air conditioning hum
            t = np.arange(length) / self.sample_rate
            hum = np.sin(2 * np.pi * 60 * t) * 0.3  # 60Hz hum
            hum += np.sin(2 * np.pi * 120 * t) * 0.1  # Harmonic
            noise = self._generate_noise("pink", length) * 0.5
            return hum + noise

        elif noise_type == "rain":
            # Rain sounds
            white = np.random.randn(length)
            # High-pass for rain texture
            b, a = signal.butter(4, 1000 / (self.sample_rate / 2), btype='high')
            rain = signal.filtfilt(b, a, white)
            # Add occasional drops
            drops = np.random.randn(length) * (np.random.rand(length) > 0.99)
            return rain + drops * 2

        elif noise_type == "traffic":
            # Traffic sounds
            base = self._generate_noise("brown", length) * 2
            # Add engine sounds
            t = np.arange(length) / self.sample_rate
            engine = np.sin(2 * np.pi * 80 * t) * 0.5
            return base + engine

        elif noise_type in ["engine", "car"]:
            # Car engine
            t = np.arange(length) / self.sample_rate
            rpm = random.uniform(1000, 3000)
            freq = rpm / 60
            engine = np.sin(2 * np.pi * freq * t)
            engine += 0.5 * np.sin(4 * np.pi * freq * t)  # Harmonic
            noise = self._generate_noise("pink", length) * 0.3
            return engine + noise

        else:
            # Default to white noise
            return np.random.randn(length)

    def simulate_distance(self, audio: np.ndarray, distance: float) -> np.ndarray:
        """Simulate sound from a distance"""
        # Inverse square law attenuation
        attenuation = 1.0 / (1.0 + distance * 0.5)
        audio = audio * attenuation

        # High frequency rolloff (air absorption)
        nyq = self.sample_rate / 2
        cutoff = max(1000, nyq - distance * 500)
        b, a = signal.butter(2, cutoff / nyq, btype='low')
        audio = signal.filtfilt(b, a, audio)

        # Add small delay (speed of sound)
        delay_samples = int(distance / 343 * self.sample_rate)
        if delay_samples > 0:
            audio = np.pad(audio, (delay_samples, 0))[:-delay_samples]

        return audio

    def apply_microphone_model(self, audio: np.ndarray, mic_type: str) -> np.ndarray:
        """Apply microphone characteristics"""
        nyq = self.sample_rate / 2

        if mic_type == "phone_builtin":
            # Typical phone: limited low/high
            b, a = signal.butter(4, [100 / nyq, 7000 / nyq], btype='band')
            return signal.filtfilt(b, a, audio)

        elif mic_type == "phone_earbuds":
            # Earbuds: close to ear, reduced noise
            b, a = signal.butter(4, [80 / nyq, 8000 / nyq], btype='band')
            return signal.filtfilt(b, a, audio) * 1.2

        elif mic_type == "laptop_builtin":
            # Laptop: more low-end pickup
            b, a = signal.butter(4, [60 / nyq, 6000 / nyq], btype='band')
            return signal.filtfilt(b, a, audio)

        elif mic_type == "bluetooth_headset":
            # Bluetooth: compressed, narrow band
            b, a = signal.butter(4, [200 / nyq, 5000 / nyq], btype='band')
            return signal.filtfilt(b, a, audio)

        elif mic_type == "smart_speaker":
            # Smart speaker: optimized for voice
            b, a = signal.butter(4, [100 / nyq, 8000 / nyq], btype='band')
            return signal.filtfilt(b, a, audio)

        elif mic_type == "professional_mic":
            # Professional: wide frequency response
            b, a = signal.butter(2, [20 / nyq, min(0.99, 16000 / nyq)], btype='band')
            return signal.filtfilt(b, a, audio)

        else:
            return audio


# ============================================================================
# AUDIO SYNTHESIZER
# ============================================================================

class AudioSynthesizer:
    """
    Synthesizes audio from scenarios using TTS and augmentation.

    This is the production-ready audio generation pipeline.
    """

    def __init__(self, config: ContinuousLearningConfig):
        self.config = config
        self.augmenter = AudioAugmenter(config.sample_rate)

        # Initialize TTS engines
        self.tts_engine = EdgeTTSEngine()

        # Output directory
        self.output_dir = Path(config.data_dir) / "synthesized"
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Statistics
        self.stats = {
            "total_synthesized": 0,
            "successful": 0,
            "failed": 0,
        }

    async def synthesize_scenario(
        self,
        scenario: Scenario,
        output_path: Optional[str] = None,
    ) -> Optional[np.ndarray]:
        """
        Synthesize audio for a single scenario.

        Returns the processed audio array.
        """
        self.stats["total_synthesized"] += 1

        # Generate output path if not provided
        if output_path is None:
            output_path = str(self.output_dir / f"{scenario.id}.wav")

        temp_path = output_path + ".temp.mp3"

        try:
            # 1. Generate TTS audio
            pitch = f"{int(scenario.pitch_shift * 10):+d}Hz"
            rate = f"{int((scenario.speed_factor - 1) * 100):+d}%"
            volume = f"{int((scenario.volume - 1) * 100):+d}%"

            success = await self.tts_engine.synthesize(
                text=scenario.text,
                voice_id=scenario.voice.id,
                output_path=temp_path,
                pitch=pitch,
                rate=rate,
                volume=volume,
            )

            if not success:
                self.stats["failed"] += 1
                return None

            # 2. Load and convert to target sample rate
            audio = self.augmenter.load_audio(temp_path)

            # 3. Apply scenario augmentations
            audio = self.augmenter.apply_scenario(audio, scenario)

            # 4. Pad/trim to target duration
            target_samples = int(self.config.sample_rate * self.config.duration)
            if len(audio) < target_samples:
                audio = np.pad(audio, (0, target_samples - len(audio)))
            else:
                audio = audio[:target_samples]

            # 5. Save processed audio
            self.augmenter.save_audio(audio, output_path)

            # 6. Cleanup temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            self.stats["successful"] += 1
            return audio

        except Exception as e:
            print(f"Synthesis error for {scenario.id}: {e}")
            self.stats["failed"] += 1

            if os.path.exists(temp_path):
                os.remove(temp_path)

            return None

    async def synthesize_batch(
        self,
        scenarios: List[Scenario],
        max_concurrent: int = 10,
    ) -> List[Tuple[Scenario, Optional[np.ndarray]]]:
        """
        Synthesize audio for multiple scenarios concurrently.
        """
        results = []

        # Process in batches
        for i in range(0, len(scenarios), max_concurrent):
            batch = scenarios[i:i + max_concurrent]
            tasks = [self.synthesize_scenario(s) for s in batch]
            audios = await asyncio.gather(*tasks)

            for scenario, audio in zip(batch, audios):
                results.append((scenario, audio))

        return results

    def extract_features(self, audio: np.ndarray) -> np.ndarray:
        """Extract mel spectrogram features from audio"""
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=self.config.sample_rate,
            n_mels=self.config.n_mels,
            n_fft=self.config.n_fft,
            hop_length=self.config.hop_length,
        )

        # Convert to log scale
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

        # Normalize
        mel_spec_db = (mel_spec_db - mel_spec_db.mean()) / (mel_spec_db.std() + 1e-8)

        return mel_spec_db.T  # (time, mels)


# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Test the audio synthesizer"""
    from continuous_learning_engine import InfiniteScenarioGenerator

    config = ContinuousLearningConfig()
    generator = InfiniteScenarioGenerator(config)
    synthesizer = AudioSynthesizer(config)

    # Generate and synthesize a few scenarios
    print("Generating scenarios...")
    scenarios = list(generator.generate(10))

    print(f"Synthesizing {len(scenarios)} scenarios...")
    results = await synthesizer.synthesize_batch(scenarios)

    # Print results
    for scenario, audio in results:
        status = "✓" if audio is not None else "✗"
        print(f"  {status} {scenario.id}: {scenario.text[:30]}...")

    print(f"\nStats: {synthesizer.stats}")


if __name__ == "__main__":
    asyncio.run(main())

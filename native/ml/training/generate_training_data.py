#!/usr/bin/env python3
"""
KIAAN Wake Word Training Data Generator

Generates comprehensive training data for "Hey KIAAN" wake word detection
using multiple TTS engines and data augmentation techniques.

Features:
- Multiple TTS engines (gTTS, pyttsx3, edge-tts, Coqui TTS)
- 50+ voice variations (accents, genders, ages)
- Data augmentation (noise, reverb, speed, pitch)
- Negative sample generation
- Balanced dataset creation

Usage:
    python generate_training_data.py --output ./samples --count 10000

Requirements:
    pip install gtts pyttsx3 edge-tts TTS librosa soundfile numpy scipy
"""

import os
import sys
import json
import random
import argparse
import asyncio
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import hashlib

# Audio processing
import numpy as np
try:
    import soundfile as sf
    import librosa
    from scipy import signal
    from scipy.io import wavfile
except ImportError:
    print("Installing audio dependencies...")
    os.system("pip install soundfile librosa scipy")
    import soundfile as sf
    import librosa
    from scipy import signal
    from scipy.io import wavfile


# ============================================================================
# Configuration
# ============================================================================

@dataclass
class TrainingConfig:
    """Training data generation configuration"""
    output_dir: str = "./samples"
    sample_rate: int = 16000
    positive_count: int = 5000
    negative_count: int = 10000
    augmentation_factor: int = 5

    # Wake word variations
    wake_words: List[str] = None

    # Negative phrases (things that sound similar but aren't the wake word)
    negative_phrases: List[str] = None

    # Background noise types
    noise_types: List[str] = None

    def __post_init__(self):
        if self.wake_words is None:
            self.wake_words = [
                "hey kiaan",
                "ok kiaan",
                "hi kiaan",
                "hello kiaan",
                "hey kian",
                "hey keean",
                "hey kyaan",
                "okay kiaan",
                "hey kiaan help",
                "hey kiaan listen",
            ]

        if self.negative_phrases is None:
            self.negative_phrases = [
                # Similar sounding words
                "hey karen", "hey kevin", "hey brian",
                "ok google", "hey siri", "alexa",
                "hey there", "hey you", "hey man",
                "key on", "keen", "can", "khan",
                # Common phrases
                "how are you", "what time is it",
                "good morning", "good night",
                "thank you", "please help",
                "turn on the light", "play music",
                "set a timer", "what's the weather",
                # Random words
                "hello", "yes", "no", "maybe",
                "computer", "phone", "music", "video",
                # Background speech
                "the quick brown fox jumps over the lazy dog",
                "to be or not to be that is the question",
                "all that glitters is not gold",
            ]

        if self.noise_types is None:
            self.noise_types = [
                "white", "pink", "brown",
                "cafe", "street", "office",
                "rain", "wind", "traffic"
            ]


# ============================================================================
# TTS Engines
# ============================================================================

class TTSEngine:
    """Base class for TTS engines"""

    def synthesize(self, text: str, output_path: str, voice: Optional[str] = None) -> bool:
        raise NotImplementedError


class GTTSEngine(TTSEngine):
    """Google Text-to-Speech engine"""

    LANGUAGES = [
        'en', 'en-au', 'en-uk', 'en-us', 'en-ca', 'en-in', 'en-ie', 'en-za',
        'en-ng', 'en-nz', 'en-gh', 'en-ke', 'en-tz'
    ]

    def __init__(self):
        try:
            from gtts import gTTS
            self.gTTS = gTTS
            self.available = True
        except ImportError:
            print("Installing gTTS...")
            os.system("pip install gtts")
            from gtts import gTTS
            self.gTTS = gTTS
            self.available = True

    def synthesize(self, text: str, output_path: str, voice: Optional[str] = None) -> bool:
        try:
            lang = voice or random.choice(self.LANGUAGES)
            tts = self.gTTS(text=text, lang=lang.split('-')[0], tld=lang.split('-')[1] if '-' in lang else 'com')
            tts.save(output_path)
            return True
        except Exception as e:
            print(f"gTTS error: {e}")
            return False


class EdgeTTSEngine(TTSEngine):
    """Microsoft Edge TTS engine (free, high quality)"""

    # Natural sounding voices from Edge TTS
    VOICES = [
        # English US
        "en-US-JennyNeural", "en-US-GuyNeural", "en-US-AriaNeural",
        "en-US-DavisNeural", "en-US-AmberNeural", "en-US-AnaNeural",
        "en-US-AshleyNeural", "en-US-BrandonNeural", "en-US-ChristopherNeural",
        "en-US-CoraNeural", "en-US-ElizabethNeural", "en-US-EricNeural",
        "en-US-JacobNeural", "en-US-JaneNeural", "en-US-JasonNeural",
        "en-US-MichelleNeural", "en-US-MonicaNeural", "en-US-NancyNeural",
        "en-US-RogerNeural", "en-US-SaraNeural", "en-US-SteffanNeural",
        "en-US-TonyNeural",
        # English UK
        "en-GB-SoniaNeural", "en-GB-RyanNeural", "en-GB-LibbyNeural",
        "en-GB-AbbiNeural", "en-GB-AlfieNeural", "en-GB-BellaNeural",
        "en-GB-ElliotNeural", "en-GB-EthanNeural", "en-GB-HollieNeural",
        "en-GB-MaisieNeural", "en-GB-NoahNeural", "en-GB-OliverNeural",
        "en-GB-OliviaNeural", "en-GB-ThomasNeural",
        # English Australia
        "en-AU-NatashaNeural", "en-AU-WilliamNeural", "en-AU-AnnetteNeural",
        "en-AU-CarlyNeural", "en-AU-DarrenNeural", "en-AU-DuncanNeural",
        "en-AU-ElsieNeural", "en-AU-FreyaNeural", "en-AU-JoanneNeural",
        "en-AU-KenNeural", "en-AU-KimNeural", "en-AU-NeilNeural",
        "en-AU-TimNeural", "en-AU-TinaNeural",
        # English India
        "en-IN-NeerjaNeural", "en-IN-PrabhatNeural", "en-IN-AashiNeural",
        "en-IN-AartiNeural", "en-IN-AnanyaNeural", "en-IN-KavyaNeural",
        "en-IN-KunalNeural", "en-IN-RehaanNeural",
        # English Other
        "en-CA-ClaraNeural", "en-CA-LiamNeural",
        "en-IE-ConnorNeural", "en-IE-EmilyNeural",
        "en-NZ-MitchellNeural", "en-NZ-MollyNeural",
        "en-ZA-LeahNeural", "en-ZA-LukeNeural",
        "en-PH-JamesNeural", "en-PH-RosaNeural",
        "en-SG-LunaNeural", "en-SG-WayneNeural",
        "en-KE-AsiliaNeural", "en-KE-ChilembaNeural",
        "en-NG-AbeoNeural", "en-NG-EzinneNeural",
        "en-TZ-ElimuNeural", "en-TZ-ImaniNeural",
        # Hindi (for Indian users)
        "hi-IN-MadhurNeural", "hi-IN-SwaraNeural",
    ]

    def __init__(self):
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

    def synthesize(self, text: str, output_path: str, voice: Optional[str] = None) -> bool:
        try:
            voice = voice or random.choice(self.VOICES)

            async def _synthesize():
                communicate = self.edge_tts.Communicate(text, voice)
                await communicate.save(output_path)

            asyncio.run(_synthesize())
            return True
        except Exception as e:
            print(f"Edge TTS error: {e}")
            return False


class Pyttsx3Engine(TTSEngine):
    """Offline TTS using pyttsx3"""

    def __init__(self):
        try:
            import pyttsx3
            self.engine = pyttsx3.init()
            self.available = True

            # Get available voices
            self.voices = self.engine.getProperty('voices')
        except Exception as e:
            print(f"pyttsx3 not available: {e}")
            self.available = False

    def synthesize(self, text: str, output_path: str, voice: Optional[str] = None) -> bool:
        if not self.available:
            return False

        try:
            if voice and self.voices:
                # Find matching voice
                for v in self.voices:
                    if voice.lower() in v.name.lower():
                        self.engine.setProperty('voice', v.id)
                        break
            elif self.voices:
                self.engine.setProperty('voice', random.choice(self.voices).id)

            # Vary speech rate
            self.engine.setProperty('rate', random.randint(130, 200))

            self.engine.save_to_file(text, output_path)
            self.engine.runAndWait()
            return True
        except Exception as e:
            print(f"pyttsx3 error: {e}")
            return False


class CoquiTTSEngine(TTSEngine):
    """Coqui TTS - high quality neural TTS"""

    # Pre-trained models
    MODELS = [
        "tts_models/en/ljspeech/tacotron2-DDC",
        "tts_models/en/ljspeech/glow-tts",
        "tts_models/en/vctk/vits",
        "tts_models/en/jenny/jenny",
    ]

    def __init__(self):
        try:
            from TTS.api import TTS
            self.TTS = TTS
            self.available = True
            self._tts = None
        except ImportError:
            print("Coqui TTS not available (optional)")
            self.available = False

    def _get_tts(self, model: str):
        if self._tts is None or self._current_model != model:
            self._tts = self.TTS(model_name=model, progress_bar=False)
            self._current_model = model
        return self._tts

    def synthesize(self, text: str, output_path: str, voice: Optional[str] = None) -> bool:
        if not self.available:
            return False

        try:
            model = voice or random.choice(self.MODELS)
            tts = self._get_tts(model)
            tts.tts_to_file(text=text, file_path=output_path)
            return True
        except Exception as e:
            print(f"Coqui TTS error: {e}")
            return False


# ============================================================================
# Audio Augmentation
# ============================================================================

class AudioAugmenter:
    """Audio data augmentation for robust wake word detection"""

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate

    def load_audio(self, path: str) -> np.ndarray:
        """Load and normalize audio"""
        audio, sr = librosa.load(path, sr=self.sample_rate)
        return audio / (np.max(np.abs(audio)) + 1e-8)

    def save_audio(self, audio: np.ndarray, path: str):
        """Save audio to file"""
        sf.write(path, audio, self.sample_rate)

    def add_noise(self, audio: np.ndarray, noise_type: str = "white", snr_db: float = 10) -> np.ndarray:
        """Add background noise at specified SNR"""
        if noise_type == "white":
            noise = np.random.randn(len(audio))
        elif noise_type == "pink":
            noise = self._generate_pink_noise(len(audio))
        elif noise_type == "brown":
            noise = self._generate_brown_noise(len(audio))
        else:
            noise = np.random.randn(len(audio))

        # Calculate signal and noise power
        signal_power = np.mean(audio ** 2)
        noise_power = np.mean(noise ** 2)

        # Calculate required noise scaling for target SNR
        snr_linear = 10 ** (snr_db / 10)
        noise_scaling = np.sqrt(signal_power / (snr_linear * noise_power))

        return audio + noise_scaling * noise

    def _generate_pink_noise(self, samples: int) -> np.ndarray:
        """Generate pink (1/f) noise"""
        white = np.random.randn(samples)
        fft = np.fft.rfft(white)
        freqs = np.fft.rfftfreq(samples)
        freqs[0] = 1  # Avoid division by zero
        pink_fft = fft / np.sqrt(freqs)
        return np.fft.irfft(pink_fft, n=samples)

    def _generate_brown_noise(self, samples: int) -> np.ndarray:
        """Generate brown (1/f^2) noise"""
        white = np.random.randn(samples)
        return np.cumsum(white) / 100

    def change_speed(self, audio: np.ndarray, rate: float) -> np.ndarray:
        """Change playback speed without changing pitch"""
        return librosa.effects.time_stretch(audio, rate=rate)

    def change_pitch(self, audio: np.ndarray, semitones: float) -> np.ndarray:
        """Shift pitch by semitones"""
        return librosa.effects.pitch_shift(audio, sr=self.sample_rate, n_steps=semitones)

    def add_reverb(self, audio: np.ndarray, decay: float = 0.3) -> np.ndarray:
        """Add simple reverb effect"""
        # Simple convolution reverb
        impulse_response = np.zeros(int(self.sample_rate * 0.5))
        impulse_response[0] = 1

        # Exponential decay
        t = np.arange(len(impulse_response)) / self.sample_rate
        impulse_response = impulse_response * np.exp(-decay * t * 10)

        # Add some reflections
        for i in [0.02, 0.05, 0.1, 0.2]:
            idx = int(i * self.sample_rate)
            if idx < len(impulse_response):
                impulse_response[idx] += 0.3 * np.exp(-decay * i * 10)

        return signal.convolve(audio, impulse_response, mode='same')

    def add_room_simulation(self, audio: np.ndarray, room_size: str = "medium") -> np.ndarray:
        """Simulate room acoustics"""
        if room_size == "small":
            decay = 0.5
        elif room_size == "large":
            decay = 0.15
        else:
            decay = 0.3

        return self.add_reverb(audio, decay)

    def add_telephone_effect(self, audio: np.ndarray) -> np.ndarray:
        """Simulate telephone audio quality"""
        # Bandpass filter (300Hz - 3400Hz)
        nyq = self.sample_rate / 2
        low = 300 / nyq
        high = 3400 / nyq
        b, a = signal.butter(4, [low, high], btype='band')
        return signal.filtfilt(b, a, audio)

    def random_augmentation(self, audio: np.ndarray) -> Tuple[np.ndarray, dict]:
        """Apply random combination of augmentations"""
        augmentations = {}
        result = audio.copy()

        # Random speed change (0.8x - 1.2x)
        if random.random() < 0.5:
            rate = random.uniform(0.85, 1.15)
            result = self.change_speed(result, rate)
            augmentations['speed'] = rate

        # Random pitch shift (-3 to +3 semitones)
        if random.random() < 0.5:
            semitones = random.uniform(-3, 3)
            result = self.change_pitch(result, semitones)
            augmentations['pitch'] = semitones

        # Random noise addition
        if random.random() < 0.7:
            noise_type = random.choice(['white', 'pink', 'brown'])
            snr = random.uniform(5, 25)
            result = self.add_noise(result, noise_type, snr)
            augmentations['noise'] = {'type': noise_type, 'snr': snr}

        # Random reverb
        if random.random() < 0.3:
            room = random.choice(['small', 'medium', 'large'])
            result = self.add_room_simulation(result, room)
            augmentations['reverb'] = room

        # Random telephone effect
        if random.random() < 0.1:
            result = self.add_telephone_effect(result)
            augmentations['telephone'] = True

        return result, augmentations


# ============================================================================
# Dataset Generator
# ============================================================================

class WakeWordDatasetGenerator:
    """Generates training dataset for wake word detection"""

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.augmenter = AudioAugmenter(config.sample_rate)

        # Initialize TTS engines
        self.tts_engines = []

        # Primary: Edge TTS (best quality, free)
        edge = EdgeTTSEngine()
        if edge.available:
            self.tts_engines.append(('edge', edge))

        # Secondary: gTTS (good coverage)
        gtts = GTTSEngine()
        if gtts.available:
            self.tts_engines.append(('gtts', gtts))

        # Tertiary: pyttsx3 (offline)
        pyttsx3 = Pyttsx3Engine()
        if pyttsx3.available:
            self.tts_engines.append(('pyttsx3', pyttsx3))

        # Optional: Coqui TTS (highest quality)
        coqui = CoquiTTSEngine()
        if coqui.available:
            self.tts_engines.append(('coqui', coqui))

        if not self.tts_engines:
            raise RuntimeError("No TTS engines available")

        print(f"Available TTS engines: {[e[0] for e in self.tts_engines]}")

        # Create output directories
        self.positive_dir = Path(config.output_dir) / "positive"
        self.negative_dir = Path(config.output_dir) / "negative"
        self.positive_dir.mkdir(parents=True, exist_ok=True)
        self.negative_dir.mkdir(parents=True, exist_ok=True)

    def generate_sample(self, text: str, output_path: str) -> bool:
        """Generate a single TTS sample"""
        # Try each engine until one succeeds
        random.shuffle(self.tts_engines)

        for name, engine in self.tts_engines:
            temp_path = output_path + ".temp.mp3"
            if engine.synthesize(text, temp_path):
                # Convert to 16kHz mono WAV
                try:
                    audio = self.augmenter.load_audio(temp_path)
                    self.augmenter.save_audio(audio, output_path)
                    os.remove(temp_path)
                    return True
                except Exception as e:
                    print(f"Conversion error: {e}")
                    if os.path.exists(temp_path):
                        os.remove(temp_path)

        return False

    def generate_positive_samples(self, count: int):
        """Generate positive (wake word) samples"""
        print(f"\nGenerating {count} positive samples...")

        generated = 0
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = []

            for i in range(count):
                text = random.choice(self.config.wake_words)
                output_path = self.positive_dir / f"positive_{i:05d}.wav"

                future = executor.submit(self.generate_sample, text, str(output_path))
                futures.append((future, output_path, text))

            for future, path, text in futures:
                try:
                    if future.result(timeout=30):
                        generated += 1

                        # Apply augmentations
                        if generated <= count // self.config.augmentation_factor:
                            self._generate_augmented_versions(path, "positive", generated)

                        if generated % 100 == 0:
                            print(f"  Generated {generated} positive samples...")
                except Exception as e:
                    print(f"Error generating sample: {e}")

        print(f"Generated {generated} positive samples")
        return generated

    def generate_negative_samples(self, count: int):
        """Generate negative (non-wake-word) samples"""
        print(f"\nGenerating {count} negative samples...")

        generated = 0

        # Mix of phrase types
        phrase_types = [
            (self.config.negative_phrases, 0.6),  # Similar phrases
            (self._generate_random_speech, 0.3),   # Random speech
            (self._generate_noise_only, 0.1),      # Pure noise
        ]

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = []

            for i in range(count):
                r = random.random()

                if r < 0.6:
                    text = random.choice(self.config.negative_phrases)
                elif r < 0.9:
                    text = self._generate_random_speech()
                else:
                    text = None  # Noise only

                output_path = self.negative_dir / f"negative_{i:05d}.wav"

                if text:
                    future = executor.submit(self.generate_sample, text, str(output_path))
                else:
                    future = executor.submit(self._generate_noise_sample, str(output_path))

                futures.append((future, output_path))

            for future, path in futures:
                try:
                    if future.result(timeout=30):
                        generated += 1

                        if generated % 100 == 0:
                            print(f"  Generated {generated} negative samples...")
                except Exception as e:
                    print(f"Error generating sample: {e}")

        print(f"Generated {generated} negative samples")
        return generated

    def _generate_augmented_versions(self, original_path: str, prefix: str, index: int):
        """Generate augmented versions of a sample"""
        try:
            audio = self.augmenter.load_audio(str(original_path))

            for aug_idx in range(self.config.augmentation_factor - 1):
                augmented, augs = self.augmenter.random_augmentation(audio)

                output_dir = self.positive_dir if prefix == "positive" else self.negative_dir
                output_path = output_dir / f"{prefix}_{index:05d}_aug{aug_idx}.wav"

                self.augmenter.save_audio(augmented, str(output_path))
        except Exception as e:
            print(f"Augmentation error: {e}")

    def _generate_random_speech(self) -> str:
        """Generate random speech text"""
        words = [
            "the", "a", "is", "it", "to", "and", "of", "that", "in", "was",
            "for", "on", "are", "with", "they", "be", "at", "one", "have", "this",
            "from", "by", "not", "but", "what", "all", "were", "when", "we", "there",
            "can", "an", "your", "which", "their", "said", "if", "do", "will", "each",
            "about", "how", "up", "out", "them", "then", "she", "many", "some", "so"
        ]

        length = random.randint(3, 10)
        return " ".join(random.choices(words, k=length))

    def _generate_noise_sample(self, output_path: str) -> bool:
        """Generate a pure noise sample"""
        try:
            duration = random.uniform(0.5, 2.0)
            samples = int(duration * self.config.sample_rate)

            noise_type = random.choice(self.config.noise_types[:3])  # white, pink, brown

            if noise_type == "white":
                audio = np.random.randn(samples) * 0.1
            elif noise_type == "pink":
                audio = self.augmenter._generate_pink_noise(samples) * 0.1
            else:
                audio = self.augmenter._generate_brown_noise(samples) * 0.1

            self.augmenter.save_audio(audio, output_path)
            return True
        except Exception as e:
            print(f"Noise generation error: {e}")
            return False

    def generate_dataset(self):
        """Generate complete training dataset"""
        print("=" * 60)
        print("KIAAN Wake Word Dataset Generator")
        print("=" * 60)
        print(f"Output directory: {self.config.output_dir}")
        print(f"Target: {self.config.positive_count} positive, {self.config.negative_count} negative")
        print(f"Augmentation factor: {self.config.augmentation_factor}x")
        print("=" * 60)

        # Generate samples
        pos_count = self.generate_positive_samples(self.config.positive_count)
        neg_count = self.generate_negative_samples(self.config.negative_count)

        # Generate manifest
        self._generate_manifest(pos_count, neg_count)

        print("\n" + "=" * 60)
        print("Dataset generation complete!")
        print(f"Positive samples: {pos_count}")
        print(f"Negative samples: {neg_count}")
        print(f"Total: {pos_count + neg_count}")
        print("=" * 60)

    def _generate_manifest(self, pos_count: int, neg_count: int):
        """Generate dataset manifest file"""
        manifest = {
            "name": "kiaan_wakeword",
            "version": "1.0.0",
            "created": str(Path.cwd()),
            "config": {
                "sample_rate": self.config.sample_rate,
                "wake_words": self.config.wake_words,
            },
            "statistics": {
                "positive_samples": pos_count,
                "negative_samples": neg_count,
                "total_samples": pos_count + neg_count,
                "augmentation_factor": self.config.augmentation_factor,
            },
            "files": {
                "positive": [str(p) for p in sorted(self.positive_dir.glob("*.wav"))],
                "negative": [str(p) for p in sorted(self.negative_dir.glob("*.wav"))],
            }
        }

        manifest_path = Path(self.config.output_dir) / "manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)

        print(f"\nManifest saved to: {manifest_path}")


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="KIAAN Wake Word Training Data Generator")
    parser.add_argument("--output", default="./samples", help="Output directory")
    parser.add_argument("--positive", type=int, default=1000, help="Number of positive samples")
    parser.add_argument("--negative", type=int, default=2000, help="Number of negative samples")
    parser.add_argument("--augmentation", type=int, default=5, help="Augmentation factor")

    args = parser.parse_args()

    config = TrainingConfig(
        output_dir=args.output,
        positive_count=args.positive,
        negative_count=args.negative,
        augmentation_factor=args.augmentation,
    )

    generator = WakeWordDatasetGenerator(config)
    generator.generate_dataset()


if __name__ == "__main__":
    main()

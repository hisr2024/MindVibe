# KIAAN Wake Word Model Training

Complete system for training custom "Hey KIAAN" wake word detection models.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate training data (uses 70+ natural AI voices)
python training/generate_training_data.py --positive 2000 --negative 5000

# 3. Train the model
python training/train_model.py --data ./samples --output ./models

# 4. Copy models to native projects
cp models/kiaan_wakeword.tflite ../android/app/src/main/assets/
cp -r models/KiaanWakeWord.mlmodelc ../ios/MindVibe/
```

## Architecture

### Training Data Generator
- **70+ natural AI voices** via Microsoft Edge TTS (free, high quality)
- **Multiple accents**: US, UK, Australian, Indian, Irish, South African, etc.
- **Data augmentation**: noise, reverb, pitch shift, speed variation
- **Negative samples**: similar-sounding phrases, random speech, background noise

### Model Architecture
```
Input: Mel Spectrogram (100 frames × 40 mels)
    ↓
Conv2D (32) → BatchNorm → MaxPool → Dropout
    ↓
Conv2D (64) → BatchNorm → MaxPool → Dropout
    ↓
Conv2D (128) → BatchNorm → MaxPool → Dropout
    ↓
Bidirectional LSTM (64 units)
    ↓
Dense (32) → Dropout
    ↓
Output: Sigmoid (wake word probability)
```

### Export Formats
- **TensorFlow Lite** (`.tflite`) - Android with NNAPI acceleration
- **Core ML** (`.mlmodel`) - iOS with Neural Engine acceleration

## Voice Sources

The training data generator uses these TTS engines:

| Engine | Quality | Voices | Notes |
|--------|---------|--------|-------|
| Edge TTS | ★★★★★ | 70+ | Free, natural neural voices |
| gTTS | ★★★☆☆ | 13 | Good coverage, Google-powered |
| pyttsx3 | ★★☆☆☆ | Varies | Offline, system voices |
| Coqui TTS | ★★★★★ | 4 | Optional, highest quality |

### Edge TTS Voices (Included)

**English US (22 voices)**
- Jenny, Guy, Aria, Davis, Amber, Ana, Ashley, Brandon, Christopher, Cora, Elizabeth, Eric, Jacob, Jane, Jason, Michelle, Monica, Nancy, Roger, Sara, Steffan, Tony

**English UK (14 voices)**
- Sonia, Ryan, Libby, Abbi, Alfie, Bella, Elliot, Ethan, Hollie, Maisie, Noah, Oliver, Olivia, Thomas

**English Australia (14 voices)**
- Natasha, William, Annette, Carly, Darren, Duncan, Elsie, Freya, Joanne, Ken, Kim, Neil, Tim, Tina

**English India (8 voices)**
- Neerja, Prabhat, Aashi, Aarti, Ananya, Kavya, Kunal, Rehaan

**Other English (20+ voices)**
- Canada, Ireland, New Zealand, South Africa, Philippines, Singapore, Kenya, Nigeria, Tanzania

## Data Augmentation

Each sample is augmented with random combinations of:

| Augmentation | Range | Effect |
|--------------|-------|--------|
| Speed | 0.85x - 1.15x | Speaking pace variation |
| Pitch | -3 to +3 semitones | Voice pitch variation |
| Noise | 5-25 dB SNR | Background noise robustness |
| Reverb | Small/Medium/Large | Room acoustics |
| Telephone | Bandpass filter | Low-quality audio |

## Training Configuration

```python
# Model parameters
n_mels = 40           # Mel frequency bands
n_fft = 512           # FFT window size
hop_length = 160      # 10ms hop at 16kHz

# Training parameters
batch_size = 32
epochs = 50
learning_rate = 0.001
dropout_rate = 0.3
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Accuracy | >95% | On held-out test set |
| Precision | >98% | Low false positives |
| Recall | >90% | Catch most wake words |
| Latency | <50ms | On-device inference |
| Model size | <1MB | TFLite quantized |

## Directory Structure

```
native/ml/
├── training/
│   ├── generate_training_data.py   # Training data generator
│   ├── train_model.py              # Model training script
│   └── requirements.txt            # Python dependencies
├── samples/                        # Generated training data
│   ├── positive/                   # Wake word samples
│   ├── negative/                   # Non-wake-word samples
│   └── manifest.json               # Dataset metadata
├── models/                         # Trained models
│   ├── kiaan_wakeword.keras        # Keras model
│   ├── kiaan_wakeword.tflite       # Android model
│   ├── kiaan_wakeword_quant.tflite # Quantized Android model
│   ├── KiaanWakeWord.mlmodel       # iOS model
│   └── KiaanWakeWord.mlmodelc/     # Compiled iOS model
└── README.md                       # This file
```

## Troubleshooting

### "No TTS engines available"
Install at least one TTS engine:
```bash
pip install edge-tts gtts pyttsx3
```

### "coremltools not available"
Install Core ML tools (macOS only):
```bash
pip install coremltools
```

### "NNAPI delegate not available"
- Requires Android 10+ (API 29+)
- Falls back to GPU or CPU automatically

### Low accuracy
- Increase training data: `--positive 5000 --negative 15000`
- Increase augmentation: `--augmentation 10`
- Train longer: `--epochs 100`

## License

This training system is part of MindVibe and follows the same license.

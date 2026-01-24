#!/usr/bin/env python3
"""
KIAAN Wake Word Model Training

Trains a neural network for wake word detection and exports to:
- TensorFlow Lite (.tflite) for Android
- Core ML (.mlmodel) for iOS

Architecture:
- Mel spectrogram feature extraction
- CNN + LSTM hybrid for temporal modeling
- Optimized for on-device inference (<50ms latency)

Usage:
    python train_model.py --data ./samples --output ./models

Requirements:
    pip install tensorflow tensorflow-metal coremltools librosa numpy
"""

import os
import sys
import json
import random
import argparse
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass
import numpy as np

# TensorFlow
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, callbacks

# Audio processing
import librosa

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {tf.config.list_physical_devices('GPU')}")


# ============================================================================
# Configuration
# ============================================================================

@dataclass
class ModelConfig:
    """Model training configuration"""
    # Audio parameters
    sample_rate: int = 16000
    duration: float = 1.0  # seconds
    n_mels: int = 40
    n_fft: int = 512
    hop_length: int = 160

    # Model parameters
    embedding_dim: int = 64
    lstm_units: int = 64
    dense_units: int = 32
    dropout_rate: float = 0.3

    # Training parameters
    batch_size: int = 32
    epochs: int = 50
    learning_rate: float = 0.001
    validation_split: float = 0.2
    early_stopping_patience: int = 10

    # Paths
    data_dir: str = "./samples"
    output_dir: str = "./models"


# ============================================================================
# Feature Extraction
# ============================================================================

class FeatureExtractor:
    """Extract mel spectrogram features from audio"""

    def __init__(self, config: ModelConfig):
        self.config = config
        self.target_length = int(config.sample_rate * config.duration)

        # Calculate expected spectrogram shape
        self.n_frames = 1 + (self.target_length - config.n_fft) // config.hop_length

    def extract(self, audio_path: str) -> np.ndarray:
        """Extract mel spectrogram from audio file"""
        # Load audio
        audio, _ = librosa.load(audio_path, sr=self.config.sample_rate)

        # Pad or truncate to target length
        if len(audio) < self.target_length:
            audio = np.pad(audio, (0, self.target_length - len(audio)))
        else:
            audio = audio[:self.target_length]

        # Compute mel spectrogram
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

    def get_input_shape(self) -> Tuple[int, int]:
        """Get expected input shape (time_steps, n_mels)"""
        return (self.n_frames, self.config.n_mels)


# ============================================================================
# Dataset Loading
# ============================================================================

class WakeWordDataset:
    """Load and prepare wake word dataset"""

    def __init__(self, config: ModelConfig):
        self.config = config
        self.extractor = FeatureExtractor(config)

        self.positive_dir = Path(config.data_dir) / "positive"
        self.negative_dir = Path(config.data_dir) / "negative"

    def load(self) -> Tuple[np.ndarray, np.ndarray]:
        """Load all data and return (features, labels)"""
        print("Loading dataset...")

        features = []
        labels = []

        # Load positive samples
        positive_files = list(self.positive_dir.glob("*.wav"))
        print(f"  Positive samples: {len(positive_files)}")

        for path in positive_files:
            try:
                feat = self.extractor.extract(str(path))
                features.append(feat)
                labels.append(1)
            except Exception as e:
                print(f"  Error loading {path}: {e}")

        # Load negative samples
        negative_files = list(self.negative_dir.glob("*.wav"))
        print(f"  Negative samples: {len(negative_files)}")

        for path in negative_files:
            try:
                feat = self.extractor.extract(str(path))
                features.append(feat)
                labels.append(0)
            except Exception as e:
                print(f"  Error loading {path}: {e}")

        # Convert to numpy arrays
        X = np.array(features)
        y = np.array(labels)

        # Shuffle
        indices = np.random.permutation(len(X))
        X = X[indices]
        y = y[indices]

        print(f"  Total samples: {len(X)}")
        print(f"  Feature shape: {X.shape}")

        return X, y

    def create_tf_dataset(self, X: np.ndarray, y: np.ndarray, training: bool = True) -> tf.data.Dataset:
        """Create TensorFlow dataset with preprocessing"""
        dataset = tf.data.Dataset.from_tensor_slices((X, y))

        if training:
            dataset = dataset.shuffle(buffer_size=len(X))

        dataset = dataset.batch(self.config.batch_size)
        dataset = dataset.prefetch(tf.data.AUTOTUNE)

        return dataset


# ============================================================================
# Model Architecture
# ============================================================================

def create_wake_word_model(config: ModelConfig, input_shape: Tuple[int, int]) -> keras.Model:
    """
    Create wake word detection model

    Architecture:
    - Conv2D layers for local feature extraction
    - LSTM for temporal modeling
    - Dense layers for classification
    """
    inputs = keras.Input(shape=input_shape, name="mel_spectrogram")

    # Reshape for Conv2D: (batch, time, mels) -> (batch, time, mels, 1)
    x = layers.Reshape((*input_shape, 1))(inputs)

    # Convolutional blocks
    # Block 1
    x = layers.Conv2D(32, (3, 3), padding='same', activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(config.dropout_rate)(x)

    # Block 2
    x = layers.Conv2D(64, (3, 3), padding='same', activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(config.dropout_rate)(x)

    # Block 3
    x = layers.Conv2D(128, (3, 3), padding='same', activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(config.dropout_rate)(x)

    # Reshape for LSTM: (batch, time, features)
    x = layers.Reshape((-1, x.shape[-1] * x.shape[-2]))(x)

    # Bidirectional LSTM
    x = layers.Bidirectional(layers.LSTM(config.lstm_units, return_sequences=False))(x)
    x = layers.Dropout(config.dropout_rate)(x)

    # Dense layers
    x = layers.Dense(config.dense_units, activation='relu')(x)
    x = layers.Dropout(config.dropout_rate)(x)

    # Output
    outputs = layers.Dense(1, activation='sigmoid', name="wake_word_probability")(x)

    model = keras.Model(inputs, outputs, name="kiaan_wake_word")

    return model


def create_lightweight_model(config: ModelConfig, input_shape: Tuple[int, int]) -> keras.Model:
    """
    Create lightweight model for faster inference on mobile devices

    Optimized for:
    - <1MB model size
    - <10ms inference time
    - INT8 quantization compatible
    """
    inputs = keras.Input(shape=input_shape, name="mel_spectrogram")

    # Reshape for Conv2D
    x = layers.Reshape((*input_shape, 1))(inputs)

    # Depthwise separable convolutions (more efficient)
    x = layers.SeparableConv2D(32, (3, 3), padding='same', activation='relu')(x)
    x = layers.MaxPooling2D((2, 2))(x)

    x = layers.SeparableConv2D(64, (3, 3), padding='same', activation='relu')(x)
    x = layers.MaxPooling2D((2, 2))(x)

    x = layers.SeparableConv2D(64, (3, 3), padding='same', activation='relu')(x)
    x = layers.GlobalAveragePooling2D()(x)

    # Dense
    x = layers.Dense(32, activation='relu')(x)
    x = layers.Dropout(0.2)(x)

    outputs = layers.Dense(1, activation='sigmoid', name="wake_word_probability")(x)

    model = keras.Model(inputs, outputs, name="kiaan_wake_word_lite")

    return model


# ============================================================================
# Training
# ============================================================================

class WakeWordTrainer:
    """Train and export wake word model"""

    def __init__(self, config: ModelConfig):
        self.config = config
        self.dataset = WakeWordDataset(config)

        # Create output directory
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)

    def train(self, lightweight: bool = False):
        """Train the wake word model"""
        print("\n" + "=" * 60)
        print("KIAAN Wake Word Model Training")
        print("=" * 60)

        # Load data
        X, y = self.dataset.load()

        # Split into train/val
        split_idx = int(len(X) * (1 - self.config.validation_split))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]

        print(f"\nTraining samples: {len(X_train)}")
        print(f"Validation samples: {len(X_val)}")

        # Get input shape
        input_shape = self.dataset.extractor.get_input_shape()
        print(f"Input shape: {input_shape}")

        # Create model
        if lightweight:
            model = create_lightweight_model(self.config, input_shape)
        else:
            model = create_wake_word_model(self.config, input_shape)

        model.summary()

        # Compile
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.config.learning_rate),
            loss='binary_crossentropy',
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
        )

        # Callbacks
        cb = [
            callbacks.EarlyStopping(
                monitor='val_loss',
                patience=self.config.early_stopping_patience,
                restore_best_weights=True
            ),
            callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6
            ),
            callbacks.ModelCheckpoint(
                filepath=str(Path(self.config.output_dir) / "best_model.keras"),
                monitor='val_accuracy',
                save_best_only=True
            ),
            callbacks.TensorBoard(
                log_dir=str(Path(self.config.output_dir) / "logs")
            )
        ]

        # Train
        print("\nTraining...")
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=self.config.epochs,
            batch_size=self.config.batch_size,
            callbacks=cb,
            verbose=1
        )

        # Evaluate
        print("\nEvaluating...")
        results = model.evaluate(X_val, y_val, verbose=0)
        print(f"Validation Loss: {results[0]:.4f}")
        print(f"Validation Accuracy: {results[1]:.4f}")
        print(f"Validation Precision: {results[2]:.4f}")
        print(f"Validation Recall: {results[3]:.4f}")

        # Save Keras model
        model_path = Path(self.config.output_dir) / "kiaan_wakeword.keras"
        model.save(model_path)
        print(f"\nKeras model saved: {model_path}")

        # Export to TFLite
        self.export_tflite(model)

        # Export to Core ML
        self.export_coreml(model, input_shape)

        # Save training history
        self.save_history(history)

        return model, history

    def export_tflite(self, model: keras.Model):
        """Export model to TensorFlow Lite format for Android"""
        print("\nExporting to TensorFlow Lite...")

        # Standard export
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        tflite_model = converter.convert()

        tflite_path = Path(self.config.output_dir) / "kiaan_wakeword.tflite"
        with open(tflite_path, 'wb') as f:
            f.write(tflite_model)

        print(f"  TFLite model saved: {tflite_path}")
        print(f"  Size: {len(tflite_model) / 1024:.1f} KB")

        # Quantized export (INT8)
        converter_quant = tf.lite.TFLiteConverter.from_keras_model(model)
        converter_quant.optimizations = [tf.lite.Optimize.DEFAULT]
        converter_quant.target_spec.supported_types = [tf.float16]

        tflite_quant = converter_quant.convert()

        tflite_quant_path = Path(self.config.output_dir) / "kiaan_wakeword_quant.tflite"
        with open(tflite_quant_path, 'wb') as f:
            f.write(tflite_quant)

        print(f"  Quantized TFLite model saved: {tflite_quant_path}")
        print(f"  Size: {len(tflite_quant) / 1024:.1f} KB")

    def export_coreml(self, model: keras.Model, input_shape: Tuple[int, int]):
        """Export model to Core ML format for iOS"""
        print("\nExporting to Core ML...")

        try:
            import coremltools as ct

            # Convert to Core ML
            mlmodel = ct.convert(
                model,
                inputs=[ct.TensorType(shape=(1, *input_shape), name="mel_spectrogram")],
                outputs=[ct.TensorType(name="wake_word_probability")],
                minimum_deployment_target=ct.target.iOS15,
                compute_precision=ct.precision.FLOAT16,
            )

            # Add metadata
            mlmodel.author = "KIAAN Voice Team"
            mlmodel.short_description = "Wake word detection model for 'Hey KIAAN'"
            mlmodel.version = "1.0.0"

            # Save
            mlmodel_path = Path(self.config.output_dir) / "KiaanWakeWord.mlmodel"
            mlmodel.save(str(mlmodel_path))

            print(f"  Core ML model saved: {mlmodel_path}")

            # Also save compiled version
            mlmodelc_path = Path(self.config.output_dir) / "KiaanWakeWord.mlmodelc"
            if mlmodelc_path.exists():
                import shutil
                shutil.rmtree(mlmodelc_path)

            # Compile for iOS
            os.system(f"xcrun coremlc compile {mlmodel_path} {self.config.output_dir}")

            if mlmodelc_path.exists():
                print(f"  Compiled Core ML model saved: {mlmodelc_path}")

        except ImportError:
            print("  coremltools not available, skipping Core ML export")
            print("  Install with: pip install coremltools")
        except Exception as e:
            print(f"  Core ML export error: {e}")

    def save_history(self, history):
        """Save training history"""
        history_dict = {key: [float(v) for v in values] for key, values in history.history.items()}

        history_path = Path(self.config.output_dir) / "training_history.json"
        with open(history_path, 'w') as f:
            json.dump(history_dict, f, indent=2)

        print(f"\nTraining history saved: {history_path}")


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="KIAAN Wake Word Model Training")
    parser.add_argument("--data", default="./samples", help="Training data directory")
    parser.add_argument("--output", default="./models", help="Output directory")
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lightweight", action="store_true", help="Use lightweight model")

    args = parser.parse_args()

    config = ModelConfig(
        data_dir=args.data,
        output_dir=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
    )

    trainer = WakeWordTrainer(config)
    trainer.train(lightweight=args.lightweight)


if __name__ == "__main__":
    main()

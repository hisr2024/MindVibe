#!/bin/bash
#
# KIAAN Voice - Complete Training Pipeline
#
# This script runs the entire training pipeline:
# 1. Generates infinite training scenarios with natural AI voices
# 2. Trains the wake word model with continuous learning
# 3. Exports models for iOS and Android
#
# Usage:
#   ./run_training.sh                    # Run full pipeline
#   ./run_training.sh --quick            # Quick training (100 epochs)
#   ./run_training.sh --continuous       # Run continuous learning forever
#

set -e

echo "========================================"
echo "KIAAN Voice - Training Pipeline"
echo "========================================"
echo ""

# Configuration
EPOCHS=${EPOCHS:-500}
BATCH_SIZE=${BATCH_SIZE:-64}
SCENARIOS_PER_BATCH=${SCENARIOS_PER_BATCH:-1000}
OUTPUT_DIR=${OUTPUT_DIR:-"./output"}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            EPOCHS=100
            SCENARIOS_PER_BATCH=200
            shift
            ;;
        --continuous)
            EPOCHS=-1  # Run forever
            shift
            ;;
        --epochs)
            EPOCHS=$2
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create directories
mkdir -p "$OUTPUT_DIR/samples/positive"
mkdir -p "$OUTPUT_DIR/samples/negative"
mkdir -p "$OUTPUT_DIR/models"
mkdir -p "$OUTPUT_DIR/logs"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pip install -q edge-tts gtts librosa soundfile scipy numpy tensorflow

# Step 1: Generate training data
echo ""
echo "Step 1: Generating training data..."
echo "  - Using 100+ natural AI voices"
echo "  - Generating infinite scenarios"
echo ""

python3 training/generate_training_data.py \
    --output "$OUTPUT_DIR/samples" \
    --positive 2000 \
    --negative 5000 \
    --augmentation 5

# Step 2: Train the model
echo ""
echo "Step 2: Training wake word model..."
echo "  - Epochs: $EPOCHS"
echo "  - Batch size: $BATCH_SIZE"
echo ""

python3 training/train_model.py \
    --data "$OUTPUT_DIR/samples" \
    --output "$OUTPUT_DIR/models" \
    --epochs $EPOCHS \
    --batch-size $BATCH_SIZE

# Step 3: Run continuous learning (optional)
if [ "$EPOCHS" -eq -1 ]; then
    echo ""
    echo "Step 3: Running continuous learning..."
    echo "  Press Ctrl+C to stop"
    echo ""

    python3 -c "
import asyncio
from engine.continuous_learning_engine import ContinuousLearningEngine, ContinuousLearningConfig

async def main():
    config = ContinuousLearningConfig(
        scenarios_per_batch=$SCENARIOS_PER_BATCH,
        data_dir='$OUTPUT_DIR/data',
        models_dir='$OUTPUT_DIR/models',
        logs_dir='$OUTPUT_DIR/logs',
    )
    engine = ContinuousLearningEngine(config)
    engine.initialize()
    await engine.run_continuous_training()
    engine.export_models('$OUTPUT_DIR/models')

asyncio.run(main())
"
fi

# Step 4: Export models
echo ""
echo "Step 4: Exporting models..."
echo ""

# Copy to native directories
if [ -f "$OUTPUT_DIR/models/kiaan_wakeword.tflite" ]; then
    echo "  Android: kiaan_wakeword.tflite"
    mkdir -p ../android/app/src/main/assets
    cp "$OUTPUT_DIR/models/kiaan_wakeword.tflite" ../android/app/src/main/assets/ 2>/dev/null || true
fi

if [ -d "$OUTPUT_DIR/models/KiaanWakeWord.mlmodelc" ]; then
    echo "  iOS: KiaanWakeWord.mlmodelc"
    mkdir -p ../ios/MindVibe
    cp -r "$OUTPUT_DIR/models/KiaanWakeWord.mlmodelc" ../ios/MindVibe/ 2>/dev/null || true
fi

echo ""
echo "========================================"
echo "Training Complete!"
echo "========================================"
echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""
echo "Models:"
ls -la "$OUTPUT_DIR/models/"
echo ""
echo "To deploy:"
echo "  Android: Copy kiaan_wakeword.tflite to app/src/main/assets/"
echo "  iOS: Copy KiaanWakeWord.mlmodelc to Xcode project"
echo ""

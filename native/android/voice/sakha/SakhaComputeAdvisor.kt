/**
 * Sakha Compute Advisor — thin Sakha-side wrapper around the
 * KIAAN Compute Trinity.
 *
 * KiaanComputeTrinity (native/android/voice/KiaanComputeTrinity.kt)
 * is the canonical NPU/GPU/CPU task router for the KIAAN voice
 * stack. Sakha consumes it for two decisions:
 *
 *   1. Where should wake-word inference run?
 *      Today: SakhaWakeWordDetector uses Android SpeechRecognizer
 *      which doesn't expose hardware delegate selection — so the
 *      advisor is a no-op for the SpeechRecognizer path. When we
 *      swap to Picovoice Porcupine (Phase 3 follow-up) the advisor
 *      drives the .tflite delegate choice.
 *
 *   2. Should the wake recognizer run at all?
 *      On a critical-thermal device we don't want a continuous
 *      recognizer loop heating the SoC further. The advisor
 *      surfaces the thermal state so the manager can decide.
 *
 * Pure read-only API — never mutates Trinity state. The Trinity
 * itself owns thermal / battery monitoring and processor counters.
 *
 * Threading: methods are safe to call from any thread. The
 * underlying Trinity uses thread-safe state (Volatile + StateFlow).
 */

package com.mindvibe.kiaan.voice.sakha

import android.content.Context
import com.mindvibe.kiaan.voice.ComputeTask
import com.mindvibe.kiaan.voice.KiaanComputeTrinity
import com.mindvibe.kiaan.voice.ProcessorType
import com.mindvibe.kiaan.voice.ThermalState

class SakhaComputeAdvisor(context: Context) {

    private val trinity: KiaanComputeTrinity =
        KiaanComputeTrinity.getInstance(context.applicationContext)

    /**
     * Recommend a processor for the given Sakha-relevant compute task.
     * Wraps [KiaanComputeTrinity.getOptimalProcessor] with Sakha
     * conventions: "realtime" urgency for wake-word + barge-in
     * detection, "normal" for everything else.
     */
    fun recommendProcessor(
        task: ComputeTask,
        urgency: String = defaultUrgency(task),
    ): ProcessorType = trinity.getOptimalProcessor(task, urgency)

    /**
     * Should the always-on wake recognizer be allowed to run right now?
     * The detector itself is lightweight, but on a CRITICAL-thermal
     * device we want everything optional silenced.
     */
    fun isWakeAllowed(): Boolean {
        return when (trinity.getThermalState()) {
            ThermalState.CRITICAL -> false
            else -> true
        }
    }

    /**
     * Should barge-in (mid-utterance interruption) be enabled? Disabled
     * under thermal pressure — the parallel STT + TTS load isn't worth
     * the heat budget on a struggling device.
     */
    fun isBargeInAllowed(): Boolean {
        return when (trinity.getThermalState()) {
            ThermalState.CRITICAL,
            ThermalState.SERIOUS,
            -> false
            else -> true
        }
    }

    /** Current thermal classification. Useful for telemetry / UI. */
    fun thermalState(): ThermalState = trinity.getThermalState()

    private fun defaultUrgency(task: ComputeTask): String = when (task) {
        ComputeTask.WAKE_WORD_DETECTION,
        ComputeTask.VOICE_FINGERPRINT,
        ComputeTask.EMOTION_DETECTION,
        -> "realtime"
        else -> "normal"
    }
}

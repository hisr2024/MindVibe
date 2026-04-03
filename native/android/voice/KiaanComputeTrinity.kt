/**
 * KIAAN Compute Trinity - Android
 *
 * CPU/GPU/NPU task-level processor assignment for the KIAAN voice pipeline.
 * Integrates with NNAPI (Qualcomm HTP / Samsung NPU), Vulkan GPU, and multi-core CPU.
 *
 * Architecture:
 *   NPU (NNAPI):  Wake word (5ms) + Emotion detection (6ms) + Voice fingerprint (8ms)
 *   GPU (Vulkan):  Whisper STT (45ms) + TTS synthesis (220ms) + FAISS search (3ms)
 *   CPU:          Engine routing (3ms) + Wisdom retrieval (5ms) + Response composition (5ms)
 *
 * Total pipeline: < 350ms from "Hey KIAAN" to first spoken word
 * Alexa equivalent: ~560ms (due to cloud round trip)
 *
 * Power-aware: Adapts processor assignment based on thermal state and battery.
 * Graceful degradation: NPU unavailable → GPU → CPU fallback chain.
 */

package com.mindvibe.kiaan.voice

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import android.util.Log

// ============================================================================
// Processor Types
// ============================================================================

enum class ProcessorType(val value: String) {
    NPU("npu"),   // NNAPI: Qualcomm HTP / Samsung NPU / MediaTek APU
    GPU("gpu"),   // Vulkan compute
    CPU("cpu"),   // Multi-core CPU
}

// ============================================================================
// Thermal State
// ============================================================================

enum class ThermalState {
    NOMINAL,
    FAIR,
    SERIOUS,
    CRITICAL;

    companion object {
        fun fromPowerThermalStatus(status: Int): ThermalState = when (status) {
            PowerManager.THERMAL_STATUS_NONE,
            PowerManager.THERMAL_STATUS_LIGHT -> NOMINAL
            PowerManager.THERMAL_STATUS_MODERATE -> FAIR
            PowerManager.THERMAL_STATUS_SEVERE -> SERIOUS
            PowerManager.THERMAL_STATUS_CRITICAL,
            PowerManager.THERMAL_STATUS_EMERGENCY,
            PowerManager.THERMAL_STATUS_SHUTDOWN -> CRITICAL
            else -> NOMINAL
        }
    }
}

// ============================================================================
// Compute Tasks
// ============================================================================

/**
 * Every discrete step in the KIAAN voice pipeline mapped to its optimal processor.
 */
enum class ComputeTask(
    val naturalProcessor: ProcessorType,
    val description: String,
    val typicalLatencyMs: Double,
    val cpuFallbackMultiplier: Double,
) {
    // NPU tasks (battery-efficient, NNAPI delegated)
    WAKE_WORD_DETECTION(ProcessorType.NPU, "Wake word: 'Hey KIAAN'", 5.0, 5.0),
    VOICE_FINGERPRINT(ProcessorType.NPU, "Speaker verification", 8.0, 5.0),
    EMOTION_DETECTION(ProcessorType.NPU, "Real-time emotion from voice", 6.0, 7.0),
    EMBEDDING_GENERATION(ProcessorType.NPU, "Semantic search embedding", 10.0, 5.0),
    PHONEME_RECOGNITION(ProcessorType.NPU, "Sanskrit phoneme detection", 7.0, 5.0),

    // GPU tasks (Vulkan compute, parallel)
    SPEECH_TO_TEXT(ProcessorType.GPU, "Whisper on-device STT", 45.0, 4.0),
    TEXT_TO_SPEECH(ProcessorType.GPU, "Neural TTS synthesis", 220.0, 4.0),
    AUDIO_ENHANCEMENT(ProcessorType.GPU, "Noise reduction, EQ, warmth", 15.0, 3.5),
    VECTOR_SEARCH(ProcessorType.GPU, "FAISS Gita verse search", 3.0, 5.0),
    RESPONSE_QUALITY(ProcessorType.GPU, "Output quality scoring", 12.0, 3.0),

    // CPU tasks (sequential logic, branching)
    ENGINE_ROUTING(ProcessorType.CPU, "Intent → Engine selection", 3.0, 1.0),
    WISDOM_RETRIEVAL(ProcessorType.CPU, "Verse ranking & selection", 5.0, 1.0),
    MEMORY_MANAGEMENT(ProcessorType.CPU, "Session + cross-session", 2.0, 1.0),
    SANSKRIT_GRAMMAR(ProcessorType.CPU, "Anvaya analysis", 8.0, 1.0),
    FALLBACK_ORCHESTRATION(ProcessorType.CPU, "Error recovery chains", 1.0, 1.0),
    RESPONSE_COMPOSITION(ProcessorType.CPU, "Final response assembly", 5.0, 1.0),
}

// ============================================================================
// Device Capabilities
// ============================================================================

data class DeviceCapabilities(
    val npuAvailable: Boolean,
    val npuType: String,         // "qualcomm_htp" | "samsung_npu" | "mediatek_apu" | "none"
    val gpuAvailable: Boolean,
    val gpuRenderer: String,
    val cpuCores: Int,
    val ramGB: Double,
    val sdkVersion: Int,
    val manufacturer: String,
) {
    companion object {
        fun detect(context: Context): DeviceCapabilities {
            val manufacturer = Build.MANUFACTURER.lowercase()
            val npuType = when {
                manufacturer.contains("qualcomm") || Build.HARDWARE.contains("qcom") -> "qualcomm_htp"
                manufacturer.contains("samsung") -> "samsung_npu"
                manufacturer.contains("mediatek") -> "mediatek_apu"
                Build.VERSION.SDK_INT >= 27 -> "nnapi_generic"  // NNAPI available on API 27+
                else -> "none"
            }

            val runtime = Runtime.getRuntime()

            return DeviceCapabilities(
                npuAvailable = Build.VERSION.SDK_INT >= 27,  // NNAPI from API 27
                npuType = npuType,
                gpuAvailable = true, // Vulkan available on API 24+
                gpuRenderer = Build.HARDWARE,
                cpuCores = runtime.availableProcessors(),
                ramGB = runtime.maxMemory().toDouble() / (1024 * 1024 * 1024),
                sdkVersion = Build.VERSION.SDK_INT,
                manufacturer = Build.MANUFACTURER,
            )
        }
    }

    fun summary(): String {
        val parts = mutableListOf("Android ${sdkVersion}")
        if (npuAvailable) parts.add("NPU($npuType)")
        if (gpuAvailable) parts.add("GPU($gpuRenderer)")
        parts.add("CPU(${cpuCores}cores)")
        parts.add("RAM(${String.format("%.1f", ramGB)}GB)")
        return parts.joinToString(" | ")
    }
}

// ============================================================================
// Performance Mode
// ============================================================================

enum class PerformanceMode {
    PERFORMANCE,   // Max quality, more battery drain
    BALANCED,      // Default
    EFFICIENCY,    // Battery saver
}

// ============================================================================
// Compute Orchestrator
// ============================================================================

/**
 * Routes each voice pipeline task to the optimal processor based on
 * device capabilities, thermal state, and battery level.
 *
 * Usage:
 *   val trinity = KiaanComputeTrinity.getInstance(context)
 *   val processor = trinity.getOptimalProcessor(ComputeTask.SPEECH_TO_TEXT, "realtime")
 */
class KiaanComputeTrinity private constructor(context: Context) {

    companion object {
        private const val TAG = "KiaanCompute"

        @Volatile
        private var instance: KiaanComputeTrinity? = null

        fun getInstance(context: Context): KiaanComputeTrinity {
            return instance ?: synchronized(this) {
                instance ?: KiaanComputeTrinity(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }

    val capabilities: DeviceCapabilities = DeviceCapabilities.detect(context)
    private var thermalState: ThermalState = ThermalState.NOMINAL
    private var batteryLevel: Float = 1.0f
    private var isCharging: Boolean = false
    private var performanceMode: PerformanceMode = PerformanceMode.BALANCED

    // Latency tracking for adaptive routing
    private val latencyHistory = mutableMapOf<String, MutableList<Double>>()
    private var taskCount = 0

    init {
        Log.i(TAG, "Initialized: ${capabilities.summary()}")
        updateBatteryState(context)
        setupThermalMonitoring(context)
    }

    // ── Core Routing ───────────────────────────────────────────────────

    /**
     * Get the optimal processor for a task based on current device state.
     * @param task The compute task to route
     * @param urgency "realtime" | "normal" | "background"
     */
    fun getOptimalProcessor(
        task: ComputeTask,
        urgency: String = "normal"
    ): ProcessorType {
        val natural = task.naturalProcessor

        // Wake word: ALWAYS NPU if available
        if (task == ComputeTask.WAKE_WORD_DETECTION) {
            return if (capabilities.npuAvailable) ProcessorType.NPU else ProcessorType.CPU
        }

        // Critical thermal: force GPU tasks to CPU
        if (thermalState == ThermalState.CRITICAL && natural == ProcessorType.GPU) {
            return ProcessorType.CPU
        }

        // Serious thermal: downgrade GPU unless realtime
        if (thermalState == ThermalState.SERIOUS && natural == ProcessorType.GPU && urgency != "realtime") {
            return ProcessorType.CPU
        }

        // Low battery (<20%) and not charging: downgrade GPU
        if (batteryLevel < 0.2f && !isCharging && natural == ProcessorType.GPU) {
            return ProcessorType.CPU
        }

        // Very low battery (<10%): downgrade NPU too
        if (batteryLevel < 0.1f && !isCharging && natural == ProcessorType.NPU) {
            return ProcessorType.CPU
        }

        // Efficiency mode: CPU for background tasks
        if (performanceMode == PerformanceMode.EFFICIENCY && urgency == "background") {
            return ProcessorType.CPU
        }

        // Realtime: use fastest available
        if (urgency == "realtime") {
            if (natural == ProcessorType.NPU && capabilities.npuAvailable) return ProcessorType.NPU
            if (capabilities.gpuAvailable) return ProcessorType.GPU
            return ProcessorType.CPU
        }

        // Normal: use natural affinity if hardware available
        if (natural == ProcessorType.NPU && capabilities.npuAvailable) return ProcessorType.NPU
        if (natural == ProcessorType.GPU && capabilities.gpuAvailable) return ProcessorType.GPU
        return ProcessorType.CPU
    }

    // ── NNAPI Configuration ────────────────────────────────────────────

    /**
     * Get NNAPI execution preference for TensorFlow Lite interpreter.
     * Maps to NnApiDelegate.Options.setExecutionPreference()
     */
    fun getNnapiExecutionPreference(task: ComputeTask): Int {
        val processor = getOptimalProcessor(task)
        return when (processor) {
            ProcessorType.NPU -> 0  // EXECUTION_PREFERENCE_FAST_SINGLE_ANSWER
            ProcessorType.GPU -> 1  // EXECUTION_PREFERENCE_SUSTAINED_SPEED
            ProcessorType.CPU -> 2  // EXECUTION_PREFERENCE_LOW_POWER
        }
    }

    // ── Pipeline Planning ──────────────────────────────────────────────

    /**
     * Get the full pipeline assignment.
     */
    fun getPipelinePlan(urgency: String = "normal"): List<Pair<ComputeTask, ProcessorType>> {
        return ComputeTask.entries.map { task ->
            task to getOptimalProcessor(task, urgency)
        }
    }

    /**
     * Estimate total pipeline latency in milliseconds.
     */
    fun estimatePipelineLatencyMs(urgency: String = "normal"): Double {
        val emotionMs = estimateTaskLatency(ComputeTask.EMOTION_DETECTION, urgency)
        val sttMs = estimateTaskLatency(ComputeTask.SPEECH_TO_TEXT, urgency)
        val parallelStage = maxOf(emotionMs, sttMs)

        return estimateTaskLatency(ComputeTask.WAKE_WORD_DETECTION, urgency) +
                parallelStage +
                estimateTaskLatency(ComputeTask.ENGINE_ROUTING, urgency) +
                estimateTaskLatency(ComputeTask.VECTOR_SEARCH, urgency) +
                estimateTaskLatency(ComputeTask.WISDOM_RETRIEVAL, urgency) +
                estimateTaskLatency(ComputeTask.RESPONSE_COMPOSITION, urgency) +
                estimateTaskLatency(ComputeTask.TEXT_TO_SPEECH, urgency) +
                estimateTaskLatency(ComputeTask.AUDIO_ENHANCEMENT, urgency)
    }

    // ── Metrics ────────────────────────────────────────────────────────

    /**
     * Record task execution for adaptive routing.
     */
    fun recordTaskLatency(task: ComputeTask, processor: ProcessorType, latencyMs: Double) {
        val key = "${task.name}_${processor.value}"
        latencyHistory.getOrPut(key) { mutableListOf() }.also { history ->
            history.add(latencyMs)
            if (history.size > 50) history.removeAt(0)
        }
        taskCount++
    }

    /**
     * Get current orchestrator status.
     */
    fun getStatus(): Map<String, Any> = mapOf(
        "capabilities" to capabilities.summary(),
        "thermal_state" to thermalState.name,
        "battery_level" to batteryLevel,
        "is_charging" to isCharging,
        "performance_mode" to performanceMode.name,
        "tasks_processed" to taskCount,
        "estimated_pipeline_ms" to estimatePipelineLatencyMs(),
    )

    // ── State Updates ──────────────────────────────────────────────────

    fun updateThermalState(state: ThermalState) {
        val prev = thermalState
        thermalState = state
        if (state != prev) {
            Log.i(TAG, "Thermal: ${prev.name} → ${state.name}")
        }
        if (state == ThermalState.CRITICAL) {
            performanceMode = PerformanceMode.EFFICIENCY
            Log.w(TAG, "CRITICAL thermal — forcing efficiency mode")
        }
    }

    fun updateBattery(level: Float, charging: Boolean) {
        batteryLevel = level.coerceIn(0f, 1f)
        isCharging = charging
    }

    fun setPerformanceMode(mode: PerformanceMode) {
        performanceMode = mode
        Log.i(TAG, "Performance mode: ${mode.name}")
    }

    // ── Internal ───────────────────────────────────────────────────────

    private fun estimateTaskLatency(task: ComputeTask, urgency: String): Double {
        val processor = getOptimalProcessor(task, urgency)
        val key = "${task.name}_${processor.value}"

        latencyHistory[key]?.takeIf { it.isNotEmpty() }?.let { history ->
            val recent = history.takeLast(10)
            return recent.sum() / recent.size
        }

        return if (processor == ProcessorType.CPU && task.naturalProcessor != ProcessorType.CPU) {
            task.typicalLatencyMs * task.cpuFallbackMultiplier
        } else {
            task.typicalLatencyMs
        }
    }

    private fun updateBatteryState(context: Context) {
        val batteryStatus = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        batteryStatus?.let { intent ->
            val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            if (level >= 0 && scale > 0) {
                batteryLevel = level.toFloat() / scale.toFloat()
            }
            val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
            isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL
        }
    }

    private fun setupThermalMonitoring(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            powerManager?.addThermalStatusListener { status ->
                updateThermalState(ThermalState.fromPowerThermalStatus(status))
            }
        }
    }
}

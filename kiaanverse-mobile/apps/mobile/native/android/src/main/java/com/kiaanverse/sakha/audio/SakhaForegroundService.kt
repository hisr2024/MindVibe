/**
 * SakhaForegroundService — keeps the voice WSS audio session alive when
 * the user backgrounds the app.
 *
 * Why this is necessary:
 *   On Android 14+ (targetSdk 34/35) the system aggressively kills any
 *   background process running an AudioFocus + ExoPlayer session within
 *   30 seconds of the screen going off. Without a foreground service
 *   declared with android:foregroundServiceType="mediaPlayback" the
 *   first ~minute of a Sakha session works, then the user hears silence
 *   followed by an empty WSS reconnect spiral.
 *
 * What it does:
 *   • Posts a persistent low-priority notification ("सखा सुन रहे हैं" /
 *     "Voice companion active") on a single channel so the system
 *     considers the app foreground for audio purposes.
 *   • Holds a partial WAKE_LOCK while a turn is active so the CPU stays
 *     awake for STT + LLM + TTS streaming. Released the moment the
 *     turn ends so battery drain stays under the spec's 4%/30min cap.
 *   • Exposes start() / stop() commands the JS layer (Part 9
 *     useForegroundService hook) calls when a session begins/ends.
 *
 * Manifest entry is injected by the withKiaanForegroundService Expo
 * plugin (apps/sakha-mobile/plugins/withKiaanForegroundService.js) at
 * prebuild time. The fully qualified name MUST match this class:
 *     com.kiaanverse.sakha.audio.SakhaForegroundService
 *
 * Notification channel ID matches the plugin's NOTIFICATION_CHANNEL_ID
 * constant. When the channel doesn't exist yet (first session after
 * install), createNotificationChannel() is called idempotently.
 */

package com.kiaanverse.sakha.audio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class SakhaForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "sakha_voice_session"
        const val NOTIFICATION_ID = 0xC0DE_5A28.toInt() // Sakha-CDE
        const val ACTION_START = "com.kiaanverse.sakha.audio.START"
        const val ACTION_STOP = "com.kiaanverse.sakha.audio.STOP"
        private const val WAKE_LOCK_TAG = "Sakha::VoiceSessionWakeLock"
        private const val LOG_TAG = "SakhaFG"

        /** JS / native helper: start the foreground service. */
        @JvmStatic
        fun start(context: Context) {
            val intent = Intent(context, SakhaForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        @JvmStatic
        fun stop(context: Context) {
            val intent = Intent(context, SakhaForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        ensureNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                shutdown()
                return START_NOT_STICKY
            }
            else -> {
                startInForeground()
                acquireWakeLock()
                return START_STICKY
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        releaseWakeLock()
        super.onDestroy()
    }

    private fun startInForeground() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+: must specify the typed foreground service. The
            // type passed here MUST be a subset of what the manifest
            // declares — the withKiaanForegroundService plugin declares
            // android:foregroundServiceType="microphone|mediaPlayback",
            // and the service actively records mic for VAD + wake-word
            // while also playing TTS audio. Passing only MEDIA_PLAYBACK
            // would let TTS continue but Android 14+ throws
            // SecurityException the moment we hold the mic in foreground.
            // Combine both with bitwise OR.
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun shutdown() {
        releaseWakeLock()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        // IMPORTANCE_LOW so the notification doesn't ping or vibrate; it's a
        // status indicator, not a user-facing message. The system still
        // counts it for foreground-service purposes.
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(resources.getIdentifier("sakha_notification_title", "string", packageName))
                .ifEmpty { "Sakha — voice session" },
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Active while Sakha is listening or speaking."
            setShowBadge(false)
        }
        nm.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val titleId = resources.getIdentifier("sakha_notification_title", "string", packageName)
        val bodyId = resources.getIdentifier("sakha_notification_body", "string", packageName)
        val title = if (titleId != 0) getString(titleId) else "सखा सुन रहे हैं"
        val body = if (bodyId != 0) getString(bodyId) else "Voice companion active"

        // Tap-to-foreground: route back to the launcher activity.
        val launcher = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = if (launcher != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(this, 0, launcher, flags)
        } else null

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play) // replaced by Part 11 Shankha icon
            .setContentTitle(title)
            .setContentText(body)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .also { b -> if (pendingIntent != null) b.setContentIntent(pendingIntent) }
            .build()
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG).apply {
                setReferenceCounted(false)
                // Auto-release after 30 minutes — matches the spec's
                // longest tier (Bhakta gets 30 min/day; longer turns
                // re-acquire on the next start). Defensive cap so a
                // crashed JS layer can't drain the battery silently.
                acquire(30 * 60 * 1000L)
            }
        } catch (e: Exception) {
            Log.w(LOG_TAG, "wake-lock acquire failed: ${e.message}")
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (e: Exception) {
            Log.w(LOG_TAG, "wake-lock release failed: ${e.message}")
        }
        wakeLock = null
    }
}

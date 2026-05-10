/**
 * SakhaBackgroundAudioCoordinator — iOS analog of Android's
 * SakhaForegroundService.
 *
 * iOS does not have foreground services. To keep the Sakha voice session
 * alive while the user backgrounds the app, we instead:
 *
 *   1. Activate an AVAudioSession with category .playAndRecord and the
 *      options [.duckOthers, .allowBluetooth, .allowBluetoothA2DP,
 *      .defaultToSpeaker, .mixWithOthers]. This is what tells iOS "this
 *      app produces audio in/out — let it run while backgrounded."
 *      Combined with UIBackgroundModes:['audio'] in Info.plist (already
 *      set in app.config.ts), the OS will not suspend the process while
 *      the session is active and producing audio.
 *
 *   2. Disable the idle timer (UIApplication.isIdleTimerDisabled = true)
 *      so the screen doesn't dim/lock during a long voice exchange.
 *      Restored when stop() is called.
 *
 *   3. Publish a "Sakha is listening" entry to MPNowPlayingInfoCenter so
 *      the lock-screen / Control Center / CarPlay shows it. Without this,
 *      iOS may de-prioritize the session for resource management.
 *
 *   4. Register observers for AVAudioSession.interruptionNotification
 *      (phone calls, Siri activations) and routeChangeNotification
 *      (Bluetooth headset connect/disconnect, AirPods take-out detection).
 *      These let us re-establish the session gracefully when the OS
 *      releases it.
 *
 * Background-audio policy (re App Review 2.5.4): we ONLY hold the session
 * active while a turn is in progress. When the turn ends, KiaanAudioPlayer
 * deactivates playback, but THIS coordinator stays active until the JS
 * hook calls stop() — typically on screen unmount or when the user
 * explicitly ends the session. The Sakha wake-word path (M4) explicitly
 * gates always-on mic to active turns to satisfy Apple's policy.
 */

import Foundation
import AVFoundation
import MediaPlayer
import UIKit

@objc public final class SakhaBackgroundAudioCoordinator: NSObject {

    @objc public static let shared = SakhaBackgroundAudioCoordinator()

    /// Atomic flag readable by the bridge for `isRunning`-style queries.
    public private(set) var isActive: Bool = false

    private let session = AVAudioSession.sharedInstance()
    private var idleTimerWasDisabledByUs = false

    /// Event hook: iOS-side observers can post audio-session lifecycle
    /// events here. The bridge subscribes and forwards to JS — exposed
    /// in supportedEvents() if/when we add JS-visible events. Today we
    /// only log them; the JS contract is start/stop only (parity with
    /// Android, which also emits nothing).
    private var notificationObservers: [NSObjectProtocol] = []

    private override init() {
        super.init()
    }

    // MARK: - Public API

    @objc public func start() throws {
        if isActive { return }

        // Configure category + options. .mixWithOthers is left OUT here so
        // a Sakha turn temporarily takes audio focus from background music
        // (Spotify etc.); .duckOthers softens it instead of pausing.
        try session.setCategory(
            .playAndRecord,
            mode: .voiceChat,
            options: [
                .duckOthers,
                .allowBluetooth,
                .allowBluetoothA2DP,
                .defaultToSpeaker,
            ]
        )
        try session.setActive(true, options: [])

        // Idle-timer override is process-global; track whether we were the
        // ones who disabled it so stop() restores correctly even if the
        // app screen happened to disable it for an unrelated reason.
        if !UIApplication.shared.isIdleTimerDisabled {
            UIApplication.shared.isIdleTimerDisabled = true
            idleTimerWasDisabledByUs = true
        }

        publishNowPlayingInfo()
        registerObservers()

        isActive = true
    }

    @objc public func stop() {
        guard isActive else { return }

        unregisterObservers()
        clearNowPlayingInfo()

        if idleTimerWasDisabledByUs {
            UIApplication.shared.isIdleTimerDisabled = false
            idleTimerWasDisabledByUs = false
        }

        // Deactivate with notifyOthersOnDeactivation so previously-ducked
        // apps (Spotify etc.) restore their volume cleanly.
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])

        isActive = false
    }

    // MARK: - MPNowPlayingInfoCenter

    private func publishNowPlayingInfo() {
        var info: [String: Any] = [:]
        info[MPMediaItemPropertyTitle] = "Sakha"
        info[MPMediaItemPropertyArtist] = "Kiaanverse"
        info[MPNowPlayingInfoPropertyIsLiveStream] = true
        info[MPNowPlayingInfoPropertyPlaybackRate] = 1.0
        // Note: artwork is intentionally omitted in M2 — adding a Sakha
        // shankha icon to the Asset Catalog is a follow-up cosmetic.
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func clearNowPlayingInfo() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    // MARK: - Interruption + route observers

    private func registerObservers() {
        let nc = NotificationCenter.default

        // Interruptions: phone calls, Siri activations, alarms.
        let interruptObs = nc.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session,
            queue: .main
        ) { [weak self] note in
            self?.handleInterruption(note)
        }
        notificationObservers.append(interruptObs)

        // Route changes: Bluetooth connect/disconnect, headphone unplug,
        // AirPods take-out detection.
        let routeObs = nc.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: session,
            queue: .main
        ) { [weak self] note in
            self?.handleRouteChange(note)
        }
        notificationObservers.append(routeObs)
    }

    private func unregisterObservers() {
        for obs in notificationObservers {
            NotificationCenter.default.removeObserver(obs)
        }
        notificationObservers.removeAll()
    }

    private func handleInterruption(_ note: Notification) {
        guard
            let info = note.userInfo,
            let typeRaw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeRaw)
        else { return }

        switch type {
        case .began:
            // OS has paused our audio (incoming call, Siri). Don't fight it
            // — KiaanAudioPlayer will see its own pause notification and
            // surface a Turn-State change to JS.
            NSLog("[SakhaBgAudio] Interruption began (call/Siri/alarm).")
        case .ended:
            // Try to resume if the option allows it.
            if
                let optionsRaw = info[AVAudioSessionInterruptionOptionKey] as? UInt,
                AVAudioSession.InterruptionOptions(rawValue: optionsRaw).contains(.shouldResume)
            {
                try? session.setActive(true, options: [])
                NSLog("[SakhaBgAudio] Interruption ended — session reactivated.")
            }
        @unknown default:
            break
        }
    }

    private func handleRouteChange(_ note: Notification) {
        guard
            let info = note.userInfo,
            let reasonRaw = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
            let reason = AVAudioSession.RouteChangeReason(rawValue: reasonRaw)
        else { return }

        // Most interesting cases for a voice assistant:
        //   .oldDeviceUnavailable — user pulled out headphones; iOS routes
        //     to the speaker BUT we want playback to PAUSE rather than
        //     blast out loud. KiaanAudioPlayer handles the pause; we just
        //     log here for diagnostics.
        //   .newDeviceAvailable — Bluetooth headset connected mid-session;
        //     no action needed, AVAudioSession routes automatically.
        switch reason {
        case .oldDeviceUnavailable:
            NSLog("[SakhaBgAudio] Old route unavailable (headphones unplugged?).")
        case .newDeviceAvailable:
            NSLog("[SakhaBgAudio] New route available.")
        default:
            break
        }
    }
}

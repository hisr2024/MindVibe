/**
 * SakhaForegroundServiceBridge — RN bridge for SakhaBackgroundAudioCoordinator.
 *
 * Mirrors Android's SakhaForegroundServiceModule.kt: same JS-facing module
 * name ("SakhaForegroundService"), same start()/stop() Promise contract.
 * The hook (apps/mobile/voice/hooks/useForegroundService.ts) drops its
 * Platform.OS === 'android' gate now that this bridge exists.
 *
 * iOS has no foreground services — the bridge maps start()/stop() onto
 * SakhaBackgroundAudioCoordinator's AVAudioSession + idle-timer +
 * MPNowPlayingInfoCenter setup. See SakhaBackgroundAudioCoordinator.swift
 * for the full background-audio policy and App Review 2.5.4 rationale.
 *
 * No event emitter base class because this module emits no events on
 * either platform today (matches Android — kept symmetric so adding one
 * later requires changing both sides at once and updating
 * SAKHA_FOREGROUND_SERVICE_EVENTS in types/sakhaForegroundService.ts).
 */

import Foundation
import React

@objc(SakhaForegroundServiceBridge)
final class SakhaForegroundServiceBridge: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool {
        // SakhaBackgroundAudioCoordinator touches UIApplication.isIdleTimerDisabled
        // which is main-thread-only.
        return true
    }

    @objc var methodQueue: DispatchQueue {
        return DispatchQueue.main
    }

    @objc(start:rejecter:)
    func start(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        do {
            try SakhaBackgroundAudioCoordinator.shared.start()
            resolve(nil)
        } catch {
            reject("FOREGROUND_SERVICE_START_FAILED", error.localizedDescription, error)
        }
    }

    @objc(stop:rejecter:)
    func stop(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SakhaBackgroundAudioCoordinator.shared.stop()
        resolve(nil)
    }
}

/**
 * KiaanAudioPlayerBridge — RN bridge for KiaanAudioPlayer.
 *
 * Mirrors Android's KiaanAudioPlayerModule.kt: same JS-facing module name
 * ("KiaanAudioPlayer"), same method signatures, same event names. JS code
 * (apps/mobile/voice/lib/native/KiaanAudioPlayer.ts) consumes
 * NativeModules.KiaanAudioPlayer transparently — Platform.OS branching
 * is no longer needed for this module.
 *
 * Method exports live in KiaanAudioPlayerBridge.m. The synchronous
 * getAudioLevel() uses RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD via the
 * .m file (Swift cannot directly mark a method synchronous-blocking on
 * the bridge thread; the macro handles the bridge plumbing).
 *
 * Threading: methodQueue is .main since AVQueuePlayer mutations must
 * happen on the main thread per AVFoundation contract.
 */

import Foundation
import React
import AVFoundation

@objc(KiaanAudioPlayerBridge)
final class KiaanAudioPlayerBridge: RCTEventEmitter {

    private var hasListeners = false

    override init() {
        super.init()
        KiaanAudioPlayer.shared.delegate = self
    }

    override static func requiresMainQueueSetup() -> Bool { return true }

    override var methodQueue: DispatchQueue { return DispatchQueue.main }

    override func supportedEvents() -> [String]! {
        return [
            "KiaanAudioPlayer:onPlaybackStateChanged",
            "KiaanAudioPlayer:onAudioLevel",
            "KiaanAudioPlayer:onCrossfade",
            "KiaanAudioPlayer:onError",
        ]
    }

    override func startObserving() { hasListeners = true }
    override func stopObserving()  { hasListeners = false }

    // MARK: - Bridge methods

    @objc(appendChunk:base64Opus:resolver:rejecter:)
    func appendChunk(
        _ seq: NSNumber,
        base64Opus: NSString,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        do {
            try KiaanAudioPlayer.shared.appendChunk(
                seq: seq.intValue,
                base64Opus: base64Opus as String
            )
            resolve(nil)
        } catch {
            reject("APPEND_FAILED", error.localizedDescription, error)
        }
    }

    @objc(play:rejecter:)
    func play(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanAudioPlayer.shared.play()
        resolve(nil)
    }

    @objc(pause:rejecter:)
    func pause(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanAudioPlayer.shared.pause()
        resolve(nil)
    }

    @objc(fadeOut:resolver:rejecter:)
    func fadeOut(
        _ durationMs: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanAudioPlayer.shared.fadeOut(durationMs: durationMs.doubleValue) {
            resolve(nil)
        }
    }

    @objc(stop:rejecter:)
    func stop(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanAudioPlayer.shared.stop()
        resolve(nil)
    }

    @objc(release:rejecter:)
    func releasePlayer(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        KiaanAudioPlayer.shared.release()
        resolve(nil)
    }

    /// Synchronous bridge method — the macro RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD
    /// in .m skips the JS↔native bridge thread hop. Used by the Reanimated
    /// worklet driving Shankha amplitude.
    @objc func getAudioLevel() -> NSNumber {
        return NSNumber(value: KiaanAudioPlayer.shared.getAudioLevel())
    }

    // MARK: - Helpers

    fileprivate func emit(_ name: String, body: Any?) {
        guard hasListeners else { return }
        sendEvent(withName: name, body: body)
    }
}

// MARK: - KiaanAudioPlayerDelegate

extension KiaanAudioPlayerBridge: KiaanAudioPlayer.KiaanAudioPlayerDelegate {

    func audioPlayer(_ p: KiaanAudioPlayer, didChangePlaybackState state: String) {
        emit("KiaanAudioPlayer:onPlaybackStateChanged", body: ["state": state])
    }

    func audioPlayer(_ p: KiaanAudioPlayer, didCrossfadeFromSeq fromSeq: Int, toSeq: Int) {
        emit("KiaanAudioPlayer:onCrossfade", body: [
            "from_seq": fromSeq,
            "to_seq": toSeq,
        ])
    }

    func audioPlayer(_ p: KiaanAudioPlayer, didEncounterErrorCode code: String, message: String) {
        emit("KiaanAudioPlayer:onError", body: [
            "code": code,
            "message": message,
        ])
    }

    func audioPlayer(_ p: KiaanAudioPlayer, didEmitAudioLevel rms: Double) {
        emit("KiaanAudioPlayer:onAudioLevel", body: ["rms": rms])
    }
}

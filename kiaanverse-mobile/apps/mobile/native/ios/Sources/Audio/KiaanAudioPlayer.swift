/**
 * KiaanAudioPlayer — iOS analog of Android's KiaanAudioPlayerModule.
 *
 * Owns the playback half of the Sakha voice WSS pipeline. The WSS handler
 * streams `audio.chunk` frames; the JS hook (useStreamingPlayer) decodes
 * them from base64 and hands the bytes to this class via appendChunk().
 * Each chunk lands in an AVQueuePlayer queue so playback begins as soon
 * as the first chunk arrives — meeting the spec's first-audio-byte
 * budget (≤1.2s on cache miss, ≤500ms on cache hit).
 *
 * Architecture:
 *
 *   JS (useStreamingPlayer)
 *      │
 *      │ appendChunk(seq, base64Opus)  ← Promise<void>
 *      ▼
 *   KiaanAudioPlayer (this file)
 *      │
 *      │ writes Opus bytes to chunk-NNNNNN.opus in tmp dir
 *      │ wraps in AVPlayerItem(url:)
 *      │ inserts into AVQueuePlayer queue
 *      ▼
 *   AVQueuePlayer (AVFoundation)
 *      │
 *      │ AVAudioSession routes audio per
 *      │ SakhaBackgroundAudioCoordinator's category/options.
 *      ▼
 *   AVPlayerItem .didPlayToEndTime → onPlaybackStateChanged event
 *
 * iOS 17+ requirement: AVFoundation decodes Opus natively starting iOS 17.
 * Lower deployment targets would require vendoring libopus or asking the
 * backend to stream PCM. See the deploymentTarget comment in
 * apps/mobile/app.config.ts for the rationale.
 *
 * RMS metering: M2 ships getAudioLevel() returning 0.0 with a TODO. A
 * follow-up will wire MTAudioProcessingTap on AVMutableAudioMixInputParameters
 * for the same 60Hz smoothed RMS the Android Visualizer emits. Without
 * it, the Shankha sound-wave animation falls back to a constant slow
 * pulse — exactly the behavior Android shows when its Visualizer is
 * unavailable, so contract-symmetric.
 *
 * Threading:
 *   • All AVQueuePlayer mutations run on .main per AVFoundation contract.
 *     The bridge dispatches @objc methods on .main already (configured in
 *     KiaanAudioPlayerBridge.methodQueue).
 *   • base64 decoding happens off-main when the bridge layer asks for it,
 *     so a 50ms decode of a large chunk never stalls the audio pipeline.
 */

import Foundation
import AVFoundation

@objc public final class KiaanAudioPlayer: NSObject {

    @objc public static let shared = KiaanAudioPlayer()

    // MARK: - Public delegate (bridge subscribes to forward to JS)

    @objc public protocol KiaanAudioPlayerDelegate: AnyObject {
        func audioPlayer(_ p: KiaanAudioPlayer, didChangePlaybackState state: String)
        func audioPlayer(_ p: KiaanAudioPlayer, didCrossfadeFromSeq fromSeq: Int, toSeq: Int)
        func audioPlayer(_ p: KiaanAudioPlayer, didEncounterErrorCode code: String, message: String)
        func audioPlayer(_ p: KiaanAudioPlayer, didEmitAudioLevel rms: Double)
    }

    @objc public weak var delegate: KiaanAudioPlayerDelegate?

    // MARK: - Internals

    private var queuePlayer: AVQueuePlayer?
    private let chunkDir: URL = {
        let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("sakha-audio-\(UUID().uuidString)", isDirectory: true)
    }()
    private var nextSourceIndex: Int = 0
    private var keyValueObservers: [NSKeyValueObservation] = []
    private var endObserver: NSObjectProtocol?

    /// Last smoothed RMS — read by getAudioLevel(). 0.0 until MTAudioProcessingTap
    /// integration lands (see file header).
    private var lastSmoothedRms: Double = 0.0

    private override init() {
        super.init()
        try? FileManager.default.createDirectory(
            at: chunkDir,
            withIntermediateDirectories: true,
            attributes: nil
        )
    }

    // MARK: - Lifecycle

    private func ensurePlayer() {
        if queuePlayer != nil { return }
        let p = AVQueuePlayer()
        p.actionAtItemEnd = .advance
        p.automaticallyWaitsToMinimizeStalling = false  // start playing ASAP
        attachObservers(to: p)
        queuePlayer = p
    }

    private func attachObservers(to player: AVQueuePlayer) {
        // Status of the *current* item — the player advances through items
        // automatically; we forward state by mapping AVPlayer.timeControlStatus
        // and the current item's .status to the JS-facing string set
        // (idle | buffering | ready | ended | unknown).
        let kvo = player.observe(\.timeControlStatus, options: [.new]) { [weak self] p, _ in
            guard let self = self else { return }
            let stateName: String
            switch p.timeControlStatus {
            case .paused:
                stateName = (p.currentItem == nil) ? "idle" : "ready"
            case .waitingToPlayAtSpecifiedRate:
                stateName = "buffering"
            case .playing:
                stateName = "ready"
            @unknown default:
                stateName = "unknown"
            }
            self.delegate?.audioPlayer(self, didChangePlaybackState: stateName)
        }
        keyValueObservers.append(kvo)

        // End of *all* queued items — AVQueuePlayer fires
        // didPlayToEndTimeNotification per item; track the queue length
        // and emit "ended" only when the queue drains.
        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self, weak player] _ in
            guard let self = self, let player = player else { return }
            // After the natural "advance", check if the queue is empty.
            // .advance has already moved past this item by the time we
            // receive the notification, so .items may be empty here.
            if player.items().isEmpty {
                self.delegate?.audioPlayer(self, didChangePlaybackState: "ended")
            }
        }
    }

    private func detachObservers() {
        keyValueObservers.forEach { $0.invalidate() }
        keyValueObservers.removeAll()
        if let obs = endObserver {
            NotificationCenter.default.removeObserver(obs)
            endObserver = nil
        }
    }

    // MARK: - Public API (called by bridge)

    /// Append one base64-encoded Opus chunk to the playback queue.
    /// Throws on decode/file-write failure; the bridge translates to a
    /// rejected JS Promise.
    @objc public func appendChunk(seq: Int, base64Opus: String) throws {
        ensurePlayer()

        guard let bytes = Data(base64Encoded: base64Opus) else {
            throw NSError(
                domain: "KiaanAudioPlayer",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "base64 decode failed"]
            )
        }

        let fileURL = chunkDir.appendingPathComponent(String(format: "chunk-%06d.opus", seq))
        try bytes.write(to: fileURL, options: .atomic)

        let item = AVPlayerItem(url: fileURL)
        queuePlayer?.insert(item, after: queuePlayer?.items().last)

        if nextSourceIndex > 0 {
            delegate?.audioPlayer(self, didCrossfadeFromSeq: nextSourceIndex - 1, toSeq: seq)
        }
        nextSourceIndex += 1
    }

    @objc public func play() {
        ensurePlayer()
        queuePlayer?.volume = 1.0
        queuePlayer?.play()
    }

    @objc public func pause() {
        queuePlayer?.pause()
    }

    /// Smooth volume fade-out used for barge-in. Default 120ms.
    /// Resolves once the fade completes and the player is paused.
    @objc public func fadeOut(durationMs: Double, completion: @escaping () -> Void) {
        guard let player = queuePlayer else {
            completion()
            return
        }
        let target = max(durationMs, 1.0)
        let startVol = player.volume
        let startTime = CACurrentMediaTime() * 1000.0  // ms

        // 60Hz tick using DispatchSourceTimer — RunLoop-safe with AVPlayer.
        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now(), repeating: .milliseconds(16))
        timer.setEventHandler {
            let elapsed = CACurrentMediaTime() * 1000.0 - startTime
            let t = Float(min(elapsed / target, 1.0))
            player.volume = startVol * (1.0 - t)
            if t >= 1.0 {
                timer.cancel()
                player.pause()
                completion()
            }
        }
        timer.resume()
    }

    @objc public func stop() {
        queuePlayer?.pause()
        queuePlayer?.removeAllItems()
        nextSourceIndex = 0
        cleanupChunkDir()
        delegate?.audioPlayer(self, didChangePlaybackState: "idle")
    }

    @objc public func release() {
        detachObservers()
        queuePlayer?.pause()
        queuePlayer?.removeAllItems()
        queuePlayer = nil
        nextSourceIndex = 0
        cleanupChunkDir()
    }

    /// Synchronous getter — current smoothed RMS [0..1].
    /// M2 ships a stub returning 0.0; MTAudioProcessingTap-based metering
    /// lands in a follow-up. See file header.
    @objc public func getAudioLevel() -> Double {
        return lastSmoothedRms
    }

    // MARK: - Helpers

    private func cleanupChunkDir() {
        guard let entries = try? FileManager.default.contentsOfDirectory(at: chunkDir,
                                                                          includingPropertiesForKeys: nil,
                                                                          options: []) else {
            return
        }
        for url in entries {
            try? FileManager.default.removeItem(at: url)
        }
    }
}

/**
 * KiaanAudioPlayerBridge.m — RCT_EXTERN_MODULE exports for the Swift bridge.
 *
 * Registers the JS-facing module name as `KiaanAudioPlayer` so JS can do:
 *   const { KiaanAudioPlayer } = NativeModules;
 * matching what KiaanAudioPlayerModule.kt exports on Android (companion
 * NAME = "KiaanAudioPlayer").
 *
 * The synchronous getAudioLevel() uses RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD
 * — this skips the JS↔native bridge thread hop, matching Android's
 * `@ReactMethod(isBlockingSynchronousMethod = true)`. Critical for the
 * Reanimated worklet that reads amplitude every frame to drive the
 * Shankha sound-wave animation.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_REMAP_MODULE(KiaanAudioPlayer, KiaanAudioPlayerBridge, RCTEventEmitter)

RCT_EXTERN_METHOD(appendChunk:(nonnull NSNumber *)seq
                  base64Opus:(NSString *)base64Opus
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(play:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(pause:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(fadeOut:(nonnull NSNumber *)durationMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(release:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getAudioLevel)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

@end

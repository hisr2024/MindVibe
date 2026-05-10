/**
 * SakhaForegroundServiceBridge.m — RCT_EXTERN_MODULE exports.
 *
 * JS-facing module name: SakhaForegroundService (matches the companion
 * NAME on Android's SakhaForegroundServiceModule.kt). NSObject-based,
 * no event emitter — start/stop only, no events on either platform.
 */

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(SakhaForegroundService, SakhaForegroundServiceBridge, NSObject)

RCT_EXTERN_METHOD(start:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

@end

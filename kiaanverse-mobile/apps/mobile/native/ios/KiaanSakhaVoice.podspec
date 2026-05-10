#
# KiaanSakhaVoice.podspec
#
# In-tree iOS native voice library — counterpart to the Android library at
# `apps/mobile/native/android/`. Wired into the generated `ios/Podfile` by the
# `withKiaanSakhaVoicePackages` config plugin via:
#
#   pod 'KiaanSakhaVoice', :path => '../native/ios'
#
# The pod path is resolved relative to the prebuild-generated `ios/` dir,
# so `../native/ios` lands on `apps/mobile/native/ios/` both locally and on
# EAS Build's macOS workers.
#
# This pod intentionally does NOT live in `node_modules` and is NOT a CocoaPod
# spec repo entry — that mirrors the Android pattern of avoiding both RN and
# Expo autolinkers (see plugins/withKiaanSakhaVoicePackages.js for the full
# rationale).
#

Pod::Spec.new do |s|
  s.name             = 'KiaanSakhaVoice'
  s.version          = '1.3.2'
  s.summary          = 'KIAAN + Sakha voice native library (iOS) — in-tree.'
  s.description      = <<-DESC
    iOS counterpart to apps/mobile/native/android/. Houses the KIAAN voice
    intelligence pipeline (KiaanVoiceManager, KiaanComputeTrinity,
    KiaanWakeWordDetector, KiaanEngineOrchestrator) and the React Native
    bridge classes that expose them to JS.

    Manually registered by withKiaanSakhaVoicePackages config plugin —
    DO NOT add to node_modules or list in any pnpm workspace, doing so
    re-triggers the dual-autolinker registration bug (see plugin docs).
  DESC

  s.homepage         = 'https://kiaanverse.com'
  s.license          = { :type => 'PROPRIETARY' }
  s.author           = { 'Kiaanverse' => 'engineering@kiaanverse.com' }
  s.source           = { :git => '' }

  # iOS 17.0 minimum: AVFoundation decodes Opus natively starting iOS 17,
  # which the KiaanAudioPlayer streaming TTS pipeline relies on. See
  # app.config.ts → expo-build-properties → ios.deploymentTarget for the
  # canonical value; both must agree or `pod install` will warn about
  # version mismatch.
  s.platform         = :ios, '17.0'
  s.swift_versions   = ['5.9']
  s.requires_arc     = true

  s.source_files     = 'Sources/**/*.{swift,m,mm,h}'

  # React Native dependencies — vanilla bridge pattern (RCTBridgeModule +
  # RCTEventEmitter). Adding `React-Core` is sufficient on RN 0.74; the
  # transitive specs handle all RCT* headers we use.
  s.dependency 'React-Core'

  s.frameworks = [
    'AVFoundation', # AVAudioEngine, AVAudioSession, AVSpeechSynthesizer, AVQueuePlayer
    'Speech',       # SFSpeechRecognizer (on-device speech recognition)
    'CoreML',       # Hardware-accelerated wake-word detection (ANE)
    'Metal',        # GPU compute (Whisper STT, FAISS, TTS synthesis)
    'Accelerate',   # vDSP for audio buffer pre-processing
    'Combine',      # @Published publishers in KiaanVoiceManager
    'MediaPlayer',  # MPNowPlayingInfoCenter, MPRemoteCommandCenter (lock-screen art + controls)
    'UIKit',        # UIApplication.isIdleTimerDisabled in SakhaBackgroundAudioCoordinator
  ]

  # Pod hashing: pin pod-internal artefact cache by source hash so EAS's
  # cache layer doesn't reuse a stale build when sources change.
  s.pod_target_xcconfig = {
    'DEFINES_MODULE'                    => 'YES',
    'SWIFT_VERSION'                     => '5.9',
    'CLANG_ENABLE_MODULES'              => 'YES',
    'OTHER_SWIFT_FLAGS'                 => '$(inherited)',
    'GCC_PREPROCESSOR_DEFINITIONS'      => 'KIAAN_SAKHA_VOICE=1',
  }
end

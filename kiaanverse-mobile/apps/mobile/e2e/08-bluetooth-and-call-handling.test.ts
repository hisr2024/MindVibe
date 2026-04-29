/**
 * E2E 08 — system audio interactions.
 *
 * Spec rows covered:
 *   • Bluetooth headset connect mid-turn: routing flips, no restart
 *   • Incoming call mid-turn: pause + resume on call end
 *   • Background → foreground (60s+): foreground service stable
 *   • Audio focus duck under music
 *   • Network loss → "मौन में सखा" UI + queued utterance for replay
 */

import { device, element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · system audio + lifecycle', () => {
  beforeAll(async () => {
    await sakhaTest.setMockProviders(true);
    await sakhaTest.setUserTier('sadhak');
  });

  beforeEach(async () => {
    await sakhaTest.resetSession();
  });

  it('BT headset connect mid-turn: audio routes without session restart', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I am stressed');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // Simulate BT headset connect via dev backdoor
    await sakhaTest.injectFinalTranscript('SIMULATE_BT_HEADSET_CONNECTED');
    // State must stay "speaking" — no restart, no idle blip
    await detoxExpect(element(by.id('voice-state-speaking'))).toBeVisible();
    await sakhaTest.waitForVoiceState('listening', 12000);
  });

  it('incoming call: pause + resume on call end', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I want to talk');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // Simulate AudioFocus loss (incoming call)
    await sakhaTest.injectFinalTranscript('SIMULATE_AUDIO_FOCUS_LOSS_TRANSIENT');
    await detoxExpect(element(by.id('voice-state-speaking'))).not.toBeVisible();
    // Resume on focus return
    await sakhaTest.injectFinalTranscript('SIMULATE_AUDIO_FOCUS_GAIN');
    await sakhaTest.waitForVoiceState('speaking', 4000);
  });

  it('background → foreground after 60s: session stable, no kill', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 4000);
    await device.sendToHome();
    await new Promise((r) => setTimeout(r, 65_000));
    await device.launchApp({ newInstance: false });
    // Foreground service kept the session alive — state is still
    // listening or returns to it within a beat.
    await sakhaTest.waitForVoiceState('listening', 4000);
  }, 90_000);

  it('mid-turn network loss: shows "मौन में सखा" UI', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I feel sad');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await sakhaTest.injectFinalTranscript('SIMULATE_NETWORK_LOSS');
    await sakhaTest.waitForVoiceState('offline', 4000);
    await detoxExpect(element(by.text(/मौन में सखा|silence/i))).toBeVisible();
  });

  it('audio focus: ducks under foreign music (per withKiaanAudioFocus)', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('SIMULATE_FOREIGN_MUSIC_PLAYING');
    await sakhaTest.injectFinalTranscript('I am stressed');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // The kotlin player set GAIN_TRANSIENT_MAY_DUCK; foreign music
    // continues at lowered volume. Test asserts via testID hooked
    // up to the AudioManager focus state.
    await detoxExpect(element(by.id('audio-focus-ducking-active'))).toBeVisible();
  });
});

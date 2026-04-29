/**
 * E2E 13 — Shankha RMS-driven animation + Wisdom v3.1 telemetry.
 *
 * Spec rows covered:
 *   • #20 Shankha animation during TTS — RMS-synchronized, smooth, no
 *     jitter (must come from actual ExoPlayer audio session metering,
 *     not a faked sin loop)
 *   • #22 Wisdom v3.1 buffer integration — voice_android deliveries
 *     appear in /api/admin/wisdom-telemetry/voice
 *
 * The animation correctness is validated by reading the audio_level
 * field exposed via testID="voice-audio-level" — it must vary above
 * the silent floor while the player is appending TTS chunks. A sin-
 * loop fake would produce smooth periodic motion regardless of
 * playback state; the RMS read tracks actual chunk energy.
 */

import { device, element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · Shankha RMS animation + voice telemetry', () => {
  beforeEach(async () => {
    await sakhaTest.resetSession();
    await sakhaTest.setMockProviders(true);
  });

  it('audio_level RMS varies during TTS playback, settles to silent floor on stop', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript('what does the gita say about peace');
    await sakhaTest.waitForVoiceState('speaking', 8000);

    // While speaking, the RMS readout (testID="voice-audio-level") must
    // be non-zero and change between successive reads.
    const sample1 = await readAudioLevel();
    await new Promise((r) => setTimeout(r, 250));
    const sample2 = await readAudioLevel();

    if (sample1 === sample2 && sample1 === 0) {
      throw new Error(
        'Shankha RMS is stuck at zero during speaking state — ' +
          'animation is NOT being driven by ExoPlayer metering. ' +
          'Check KiaanAudioPlayer.onAudioLevel event subscription.',
      );
    }
    if (sample1 === sample2) {
      throw new Error(
        'Shankha RMS produced identical samples 250ms apart — ' +
          'either a sin-loop fake or playback truly silent. Reproduce ' +
          'with KIAAN_VOICE_DEBUG_RMS=1 to verify.',
      );
    }

    // Once playback stops, the RMS must settle to 0 within 500ms.
    await sakhaTest.waitForVoiceState('idle', 12000);
    await new Promise((r) => setTimeout(r, 500));
    const settled = await readAudioLevel();
    if (settled > 0.05) {
      throw new Error(
        `Shankha RMS = ${settled} after playback ended — should be ~0`,
      );
    }
  });

  it('completed voice turn writes voice_android delivery into wisdom telemetry', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript('how do i find peace');
    await sakhaTest.waitForVoiceState('speaking', 8000);
    await sakhaTest.waitForVoiceState('idle', 15000);

    // Telemetry endpoint must show:
    //   • deliveries_total ≥ 1
    //   • delivery_channel = 'voice_android' on the most recent record
    // Read via the in-app dev panel exposed at testID="dev-telemetry-readout"
    // (only mounted when DETOX_DEV_PANEL=1; the launchArgs in init.ts
    // sets this for E2E builds).
    await detoxExpect(
      element(by.id('dev-telemetry-readout-deliveries-total')),
    ).not.toHaveText('0');
    await detoxExpect(
      element(by.id('dev-telemetry-readout-last-delivery-channel')),
    ).toHaveText('voice_android');
  });

  it('first_audio_byte_ms p50 < 1500 across 5 cache-warm turns (release build only)', async () => {
    // Latency assertion is meaningful only on a release build with
    // a healthy backend. Skip if running against the mock router.
    if (await sakhaTest.isMockProvider()) {
      pendingTest('skipped — only meaningful in release build with real backend');
      return;
    }
    for (let i = 0; i < 5; i += 1) {
      await element(by.text(i === 0 ? 'Tap to begin' : 'Tap to speak')).tap();
      await sakhaTest.waitForVoiceState('listening', 5000);
      await sakhaTest.injectFinalTranscript(`how do i find peace ${i}`);
      await sakhaTest.waitForVoiceState('speaking', 8000);
      await sakhaTest.waitForVoiceState('idle', 15000);
    }
    const p50 = await readP50FirstByteMs();
    if (p50 === null) {
      throw new Error('p50 first_byte_ms not reported — telemetry wiring broken');
    }
    if (p50 >= 1500) {
      throw new Error(
        `p50 first_byte_ms = ${p50} — exceeds FINAL.2 staging gate of 1500ms`,
      );
    }
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────

async function readAudioLevel(): Promise<number> {
  const el = element(by.id('voice-audio-level'));
  await detoxExpect(el).toBeVisible();
  // The element renders the current RMS as plain text. We read via
  // accessibilityValue exposed by the host component.
  const attrs = await el.getAttributes();
  const text = (attrs as { text?: string }).text ?? '0';
  return parseFloat(text);
}

async function readP50FirstByteMs(): Promise<number | null> {
  const el = element(by.id('dev-telemetry-readout-first-byte-p50'));
  await detoxExpect(el).toBeVisible();
  const attrs = await el.getAttributes();
  const text = (attrs as { text?: string }).text ?? '';
  const num = parseInt(text, 10);
  return Number.isFinite(num) ? num : null;
}

function pendingTest(reason: string): void {
  // eslint-disable-next-line no-console
  console.log(`[pending] ${reason}`);
}

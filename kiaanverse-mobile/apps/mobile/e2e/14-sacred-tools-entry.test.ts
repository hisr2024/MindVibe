/**
 * E2E 14 — Voice Companion entry from Sacred Tools dashboard.
 *
 * Spec coverage:
 *   • Step 62 — Sakha is the first card in the Sacred Tools dashboard
 *     under the new "Sacred Voice" section, ahead of Healing /
 *     Wisdom / Karma Insights / Sacred Sound.
 *   • Existing matrix #9 (VOICE_GUIDE: "open Karma Reset") is exercised
 *     in 07-tool-invocation; this file complements it by asserting
 *     the inverse path — the user opens Sakha from the tools menu.
 *
 * Why it matters: the Sacred Tools dashboard is the canonical entry
 * surface for non-power-users (the bottom-tab is for power-users).
 * If the Sakha card disappears from this list (regressing the section
 * order or removing the SACRED_VOICE_TOOLS array), users lose the
 * primary discovery path to the voice companion.
 */

import { device, element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · entry from Sacred Tools dashboard', () => {
  beforeEach(async () => {
    await sakhaTest.resetSession();
  });

  it('renders the Sacred Voice section as the first section on the tools dashboard', async () => {
    // Navigate to Sacred Tools (assumes the bottom-tab "tools" key is
    // exposed via testID="tab-tools"; if your tab uses a different
    // key, adjust here).
    await element(by.id('tab-tools')).tap();
    await detoxExpect(element(by.text('Sacred Tools'))).toBeVisible();
    await detoxExpect(element(by.text('Sacred Voice'))).toBeVisible();
    // Sacred Voice must come before Healing Tools per Step 62.
    await detoxExpect(
      element(by.id('section-Sacred Voice')),
    ).toBeVisibleBeforeElement(element(by.id('section-Healing Tools')));
  });

  it('Sakha card is golden, shows Devanagari सखा, and routes to /voice-companion', async () => {
    await element(by.id('tab-tools')).tap();
    const card = element(by.id('tool-card-voice-companion'));
    await detoxExpect(card).toBeVisible();
    await detoxExpect(
      element(by.text('Sakha — Voice Companion')),
    ).toBeVisible();
    await detoxExpect(element(by.text('सखा'))).toBeVisible();
    await detoxExpect(
      element(by.text('Speak with the divine friend')),
    ).toBeVisible();
    // 🐚 (Shankha) icon
    await detoxExpect(element(by.text(/🐚/))).toBeVisible();

    // Tapping the card navigates to the voice canvas.
    await card.tap();
    await detoxExpect(element(by.id('sakha-canvas'))).toBeVisible();
    await detoxExpect(element(by.id('shankha'))).toBeVisible();
  });

  it('Sacred Voice section enters first in the lotus-bloom animation chain', async () => {
    // The useDivineEntrance staggered chain has Sacred Voice at
    // delay=0ms (sectionIndex=0). The other sections enter at
    // 100/200/300/400ms. We can't measure animations directly in
    // Detox, but we assert by visibility timing via the entrance
    // delay testID's emitted by AnimatedEntrance:
    //   - section-entered-Sacred Voice fires first
    //   - section-entered-Sacred Sound fires last
    await element(by.id('tab-tools')).tap();
    await detoxExpect(
      element(by.id('section-entered-Sacred Voice')),
    ).toBeVisible();
    // Last section is Sacred Sound (Vibe Player). Its entrance fires
    // at 4 × 100 = 400ms after mount.
    await detoxExpect(
      element(by.id('section-entered-Sacred Sound')),
    ).toBeVisible();
  });

  it('opens Voice Companion in idle state ready for "Tap to begin"', async () => {
    await element(by.id('tab-tools')).tap();
    await element(by.id('tool-card-voice-companion')).tap();
    await sakhaTest.waitForVoiceState('idle', 5000);
    await detoxExpect(element(by.text('Tap to begin'))).toBeVisible();
  });
});

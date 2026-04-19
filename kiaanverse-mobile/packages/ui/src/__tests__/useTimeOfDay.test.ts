/**
 * useTimeOfDay — Vedic muhurta boundary tests.
 *
 * The hook's public side-effect (60-second polling) is tested via a pure
 * `resolveTimeOfDay` helper so we don't need fake timers here.
 */

import { resolveTimeOfDay } from '../background/useTimeOfDay';

describe('resolveTimeOfDay', () => {
  it('identifies brahma muhurta at 4:00am', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T04:00:00'))).toBe('brahma');
  });

  it('identifies pratah at 6:30am', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T06:30:00'))).toBe('pratah');
  });

  it('identifies madhyanha at 1:00pm', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T13:00:00'))).toBe('madhyanha');
  });

  it('identifies sandhya at 7:00pm', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T19:00:00'))).toBe('sandhya');
  });

  it('identifies ratri at 10:00pm', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T22:00:00'))).toBe('ratri');
  });

  it('identifies ratri just after midnight', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T01:00:00'))).toBe('ratri');
  });

  it('identifies standard at 8:30pm (between sandhya and ratri)', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T20:30:00'))).toBe('standard');
  });

  it('identifies standard at 3:15am (between ratri-end and brahma-start)', () => {
    expect(resolveTimeOfDay(new Date('2026-04-19T03:15:00'))).toBe('standard');
  });
});

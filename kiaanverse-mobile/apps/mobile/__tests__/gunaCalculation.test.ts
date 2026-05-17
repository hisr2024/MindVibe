/**
 * Relationship Compass — guna calculation tests.
 *
 * `useGunaCalculation` is a pure memoized hook: given three pattern
 * selection arrays, it returns normalized 0..1 scores and the dominant
 * guna. Validated with React's test renderer so the useMemo semantics
 * stay in the loop (rather than exercising the raw math in isolation).
 */

import { renderHook } from '@testing-library/react-native';
import {
  useGunaCalculation,
  type GunaSelections,
} from '../app/tools/relationship-compass/hooks/useGunaCalculation';

const EMPTY: GunaSelections = {
  tamas: [],
  rajas: [],
  sattva: [],
};

describe('useGunaCalculation', () => {
  it('returns all zeros and "balanced" for zero selections', () => {
    const { result } = renderHook(() => useGunaCalculation(EMPTY));

    expect(result.current.tamas).toBe(0);
    expect(result.current.rajas).toBe(0);
    expect(result.current.sattva).toBe(0);
    expect(result.current.dominant).toBe('balanced');
  });

  it('normalizes scores to count / 8 per guna', () => {
    const { result } = renderHook(() =>
      useGunaCalculation({
        tamas: ['a', 'b'],
        rajas: ['c'],
        sattva: ['d', 'e', 'f', 'g'],
      })
    );

    expect(result.current.tamas).toBeCloseTo(2 / 8, 10);
    expect(result.current.rajas).toBeCloseTo(1 / 8, 10);
    expect(result.current.sattva).toBeCloseTo(4 / 8, 10);
  });

  it('reports the guna with the strictly highest count as dominant', () => {
    const { result } = renderHook(() =>
      useGunaCalculation({
        tamas: ['a'],
        rajas: ['b', 'c', 'd'],
        sattva: ['e', 'f'],
      })
    );

    expect(result.current.dominant).toBe('rajas');
  });

  it('returns "balanced" when two or more gunas tie for the max', () => {
    const { result: tie2 } = renderHook(() =>
      useGunaCalculation({
        tamas: ['a', 'b'],
        rajas: ['c', 'd'],
        sattva: [],
      })
    );
    expect(tie2.current.dominant).toBe('balanced');

    const { result: tie3 } = renderHook(() =>
      useGunaCalculation({
        tamas: ['a'],
        rajas: ['b'],
        sattva: ['c'],
      })
    );
    expect(tie3.current.dominant).toBe('balanced');
  });

  it('stays "balanced" when max is 0 even if all three arrays are empty', () => {
    const { result } = renderHook(() => useGunaCalculation(EMPTY));
    expect(result.current.dominant).toBe('balanced');
  });

  it('detects sattva-dominant correctly with 8/8 selections', () => {
    const full = Array.from({ length: 8 }, (_, i) => `p${i}`);
    const { result } = renderHook(() =>
      useGunaCalculation({
        tamas: [],
        rajas: [],
        sattva: full,
      })
    );

    expect(result.current.sattva).toBe(1);
    expect(result.current.dominant).toBe('sattva');
  });

  it('detects tamas-dominant correctly', () => {
    const { result } = renderHook(() =>
      useGunaCalculation({
        tamas: ['a', 'b', 'c', 'd', 'e'],
        rajas: ['f'],
        sattva: ['g'],
      })
    );

    expect(result.current.dominant).toBe('tamas');
  });
});

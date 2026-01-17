/**
 * Tests for useMessageTranslation Hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessageTranslation } from '@/hooks/useMessageTranslation';

describe('useMessageTranslation Hook', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMessageTranslation({
      messageId: 'test-1',
      originalText: 'Hello world',
      sourceLang: 'en'
    }));

    expect(result.current.translatedText).toBeNull();
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isTranslated).toBe(false);
  });
});

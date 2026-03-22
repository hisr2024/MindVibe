/**
 * Persistence — Unit Test Stubs
 *
 * Tests for storage adapters and hydrateAll utility.
 */

import {
  secureStoreAdapter,
  asyncStorageAdapter,
  createAsyncStorage,
  createSecureStorage,
  hydrateAll,
} from '../persistence';

describe('secureStoreAdapter', () => {
  it('should set and get an item', async () => {
    await secureStoreAdapter.setItem('test-key', 'test-value');
    const result = await secureStoreAdapter.getItem('test-key');
    expect(result).toBe('test-value');
  });

  it('should return null for missing key', async () => {
    const result = await secureStoreAdapter.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('should remove an item', async () => {
    await secureStoreAdapter.setItem('to-remove', 'value');
    await secureStoreAdapter.removeItem('to-remove');
    const result = await secureStoreAdapter.getItem('to-remove');
    expect(result).toBeNull();
  });
});

describe('asyncStorageAdapter', () => {
  it('should set and get an item', async () => {
    await asyncStorageAdapter.setItem('test-key', 'test-value');
    const result = await asyncStorageAdapter.getItem('test-key');
    expect(result).toBe('test-value');
  });

  it('should return null for missing key', async () => {
    const result = await asyncStorageAdapter.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('should remove an item', async () => {
    await asyncStorageAdapter.setItem('to-remove', 'value');
    await asyncStorageAdapter.removeItem('to-remove');
    const result = await asyncStorageAdapter.getItem('to-remove');
    expect(result).toBeNull();
  });
});

describe('createAsyncStorage', () => {
  it('should return a Zustand-compatible storage object', () => {
    const storage = createAsyncStorage();
    expect(storage).toBeDefined();
    if (storage) {
      expect(storage.getItem).toBeDefined();
      expect(storage.setItem).toBeDefined();
      expect(storage.removeItem).toBeDefined();
    }
  });
});

describe('createSecureStorage', () => {
  it('should return a Zustand-compatible storage object', () => {
    const storage = createSecureStorage();
    expect(storage).toBeDefined();
    if (storage) {
      expect(storage.getItem).toBeDefined();
      expect(storage.setItem).toBeDefined();
      expect(storage.removeItem).toBeDefined();
    }
  });
});

describe('hydrateAll', () => {
  it('should complete without throwing', async () => {
    // hydrateAll uses lazy imports and Promise.allSettled
    // It should never throw, even if individual stores fail
    await expect(hydrateAll()).resolves.toBeUndefined();
  });
});

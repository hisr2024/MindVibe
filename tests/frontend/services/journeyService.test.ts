/**
 * Comprehensive Tests for Journey Service
 *
 * Tests all CRUD operations, error handling, and API interactions
 * for the Personal Journeys feature.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import after mocking
import {
  journeyService,
  listJourneys,
  getJourney,
  createJourney,
  updateJourney,
  deleteJourney,
  JourneyServiceError,
} from '@/services/journeyService';

describe('JourneyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-user-id');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('listJourneys', () => {
    it('should fetch journeys list successfully', async () => {
      const mockResponse = {
        items: [
          {
            id: 'journey-1',
            owner_id: 'user-1',
            title: 'Test Journey',
            description: 'Description',
            status: 'active',
            cover_image_url: null,
            tags: ['test'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: null,
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await listJourneys();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Test Journey');
    });

    it('should include query parameters in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [], total: 0, limit: 10, offset: 0 }),
      });

      await listJourneys({
        status: 'active',
        search: 'test',
        sort_by: 'created_at',
        sort_order: 'desc',
        limit: 10,
        offset: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=5'),
        expect.any(Object)
      );
    });

    it('should handle empty list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [], total: 0, limit: 50, offset: 0 }),
      });

      const result = await listJourneys();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should throw JourneyServiceError on server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          detail: { error: 'SERVER_ERROR', message: 'Internal server error' },
        }),
      });

      await expect(listJourneys()).rejects.toThrow(JourneyServiceError);
    });
  });

  describe('getJourney', () => {
    it('should fetch single journey successfully', async () => {
      const mockJourney = {
        id: 'journey-123',
        owner_id: 'user-1',
        title: 'Test Journey',
        description: 'Description',
        status: 'active',
        cover_image_url: 'https://example.com/image.jpg',
        tags: ['test', 'example'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockJourney,
      });

      const result = await getJourney('journey-123');

      expect(result.id).toBe('journey-123');
      expect(result.title).toBe('Test Journey');
      expect(result.tags).toEqual(['test', 'example']);
    });

    it('should throw error for non-existent journey', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          detail: { error: 'JOURNEY_NOT_FOUND', message: 'Journey not found' },
        }),
      });

      try {
        await getJourney('nonexistent');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).statusCode).toBe(404);
        expect((error as JourneyServiceError).code).toBe('JOURNEY_NOT_FOUND');
      }
    });

    it('should throw error for forbidden access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          detail: { error: 'FORBIDDEN', message: 'Access denied' },
        }),
      });

      await expect(getJourney('forbidden-journey')).rejects.toThrow(JourneyServiceError);
    });
  });

  describe('createJourney', () => {
    it('should create journey successfully', async () => {
      const newJourney = {
        title: 'New Journey',
        description: 'New description',
        status: 'draft' as const,
        tags: ['new'],
      };

      const mockResponse = {
        id: 'new-journey-id',
        owner_id: 'user-1',
        ...newJourney,
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await createJourney(newJourney);

      expect(result.id).toBe('new-journey-id');
      expect(result.title).toBe('New Journey');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/journeys'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newJourney),
        })
      );
    });

    it('should throw error for validation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          detail: { error: 'VALIDATION_ERROR', message: 'Title is required' },
        }),
      });

      await expect(createJourney({ title: '' })).rejects.toThrow(JourneyServiceError);
    });

    it('should include credentials for httpOnly cookie auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'test', title: 'Test', owner_id: 'user' }),
      });

      await createJourney({ title: 'Test' });

      // Auth is now via httpOnly cookies (credentials: 'include') not X-Auth-UID header
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });
  });

  describe('updateJourney', () => {
    it('should update journey successfully', async () => {
      const updates = {
        title: 'Updated Title',
        status: 'active' as const,
      };

      const mockResponse = {
        id: 'journey-123',
        owner_id: 'user-1',
        title: 'Updated Title',
        description: 'Original description',
        status: 'active',
        cover_image_url: null,
        tags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await updateJourney('journey-123', updates);

      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('active');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/journeys/journey-123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
    });

    it('should throw error for non-existent journey', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          detail: { error: 'JOURNEY_NOT_FOUND', message: 'Journey not found' },
        }),
      });

      await expect(updateJourney('nonexistent', { title: 'Test' })).rejects.toThrow(
        JourneyServiceError
      );
    });
  });

  describe('deleteJourney', () => {
    it('should delete journey successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await expect(deleteJourney('journey-123')).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/journeys/journey-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error for non-existent journey', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          detail: { error: 'JOURNEY_NOT_FOUND', message: 'Journey not found' },
        }),
      });

      await expect(deleteJourney('nonexistent')).rejects.toThrow(JourneyServiceError);
    });

    it('should throw error for forbidden access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          detail: { error: 'FORBIDDEN', message: 'Access denied' },
        }),
      });

      await expect(deleteJourney('forbidden-journey')).rejects.toThrow(JourneyServiceError);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors after retries', async () => {
      // Mock 4 failed network errors (initial + 3 retries)
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await listJourneys();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('NETWORK_ERROR');
        expect((error as JourneyServiceError).statusCode).toBe(0);
        // Verify it attempted retries
        expect(mockFetch).toHaveBeenCalledTimes(4);
      }
    }, 20000); // Extended timeout for retries

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(listJourneys()).rejects.toThrow(JourneyServiceError);
    });

    it('should preserve error code from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          detail: { error: 'VALIDATION_ERROR', message: 'Invalid input' },
        }),
      });

      try {
        await createJourney({ title: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('VALIDATION_ERROR');
        expect((error as JourneyServiceError).message).toBe('Invalid input');
        expect((error as JourneyServiceError).statusCode).toBe(400);
      }
    });

    it('should handle 401 Unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          detail: { error: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
      });

      try {
        await listJourneys();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('UNAUTHORIZED');
        expect((error as JourneyServiceError).statusCode).toBe(401);
        // User-friendly message for 401
        expect((error as JourneyServiceError).message).toBe('Please sign in to access your journeys');
      }
    });

    it('should handle 403 Forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          detail: { error: 'UNAUTHORIZED', message: 'You are not authorized to access this journey' },
        }),
      });

      try {
        await getJourney('protected-journey');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        // Backend returns UNAUTHORIZED code for 403 (authorization errors)
        expect((error as JourneyServiceError).code).toBe('UNAUTHORIZED');
        expect((error as JourneyServiceError).statusCode).toBe(403);
      }
    });

    it('should handle 404 Not Found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          detail: { error: 'JOURNEY_NOT_FOUND', message: 'Journey does not exist' },
        }),
      });

      try {
        await getJourney('missing-journey');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('JOURNEY_NOT_FOUND');
        expect((error as JourneyServiceError).statusCode).toBe(404);
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          detail: { error: 'SERVER_ERROR', message: 'Internal server error' },
        }),
      });

      try {
        await createJourney({ title: 'Test' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('SERVER_ERROR');
        expect((error as JourneyServiceError).statusCode).toBe(500);
      }
    });

    it('should handle 502 Bad Gateway error after retries', async () => {
      // Mock 4 failed attempts (initial + 3 retries)
      const errorResponse = {
        ok: false,
        status: 502,
        json: async () => ({ detail: 'Bad Gateway' }),
      };
      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse);

      try {
        await listJourneys();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).statusCode).toBe(502);
        // Verify it attempted retries
        expect(mockFetch).toHaveBeenCalledTimes(4);
      }
    }, 20000); // Extended timeout for retries

    it('should handle 503 Service Unavailable error after retries', async () => {
      // Mock 4 failed attempts (initial + 3 retries)
      const errorResponse = {
        ok: false,
        status: 503,
        json: async () => ({
          detail: { error: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
        }),
      };
      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse);

      try {
        await listJourneys();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('SERVICE_UNAVAILABLE');
        expect((error as JourneyServiceError).statusCode).toBe(503);
        // Verify it attempted retries
        expect(mockFetch).toHaveBeenCalledTimes(4);
      }
    }, 20000); // Extended timeout for retries

    it('should recover from transient 503 errors on retry', async () => {
      // First 2 calls fail with 503, third succeeds
      const errorResponse = {
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service temporarily unavailable' }),
      };
      const successResponse = {
        ok: true,
        status: 200,
        json: async () => ({ items: [], total: 0, limit: 50, offset: 0 }),
      };
      mockFetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await listJourneys();
      expect(result.items).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 15000); // Extended timeout for retries

    it('should handle string error detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          detail: 'Simple error message',
        }),
      });

      try {
        await createJourney({ title: '' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).message).toBe('Simple error message');
        expect((error as JourneyServiceError).statusCode).toBe(400);
      }
    });

    it('should handle empty error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      try {
        await listJourneys();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).statusCode).toBe(500);
      }
    });

    it('should handle timeout errors after retries', async () => {
      // Mock 4 failed network errors (initial + 3 retries)
      mockFetch
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'));

      try {
        await listJourneys();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(JourneyServiceError);
        expect((error as JourneyServiceError).code).toBe('NETWORK_ERROR');
        // Verify it attempted retries
        expect(mockFetch).toHaveBeenCalledTimes(4);
      }
    }, 20000); // Extended timeout for retries

    it('should recover from network error on retry', async () => {
      // First call fails with network error, second succeeds
      const successResponse = {
        ok: true,
        status: 200,
        json: async () => ({ items: [], total: 0, limit: 50, offset: 0 }),
      };
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(successResponse);

      const result = await listJourneys();
      expect(result.items).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000); // Extended timeout for retry
  });

  describe('Service Object Export', () => {
    it('should export journeyService object with all methods', () => {
      expect(journeyService).toBeDefined();
      expect(journeyService.list).toBeDefined();
      expect(journeyService.get).toBeDefined();
      expect(journeyService.create).toBeDefined();
      expect(journeyService.update).toBeDefined();
      expect(journeyService.delete).toBeDefined();
    });

    it('should have correct method references', () => {
      expect(journeyService.list).toBe(listJourneys);
      expect(journeyService.get).toBe(getJourney);
      expect(journeyService.create).toBe(createJourney);
      expect(journeyService.update).toBe(updateJourney);
      expect(journeyService.delete).toBe(deleteJourney);
    });
  });
});

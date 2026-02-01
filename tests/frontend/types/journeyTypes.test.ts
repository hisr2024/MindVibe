/**
 * Tests for Journey Type Utilities
 *
 * Tests status label and color functions for the Personal Journeys feature.
 */

import { describe, it, expect } from 'vitest';
import {
  getStatusLabel,
  getStatusColor,
  INITIAL_JOURNEY_FORM,
  type JourneyStatus,
  type Journey,
  type JourneyFormState,
} from '@/types/journey.types';

describe('Journey Types', () => {
  describe('getStatusLabel', () => {
    it('should return correct label for draft status', () => {
      expect(getStatusLabel('draft')).toBe('Draft');
    });

    it('should return correct label for active status', () => {
      expect(getStatusLabel('active')).toBe('Active');
    });

    it('should return correct label for completed status', () => {
      expect(getStatusLabel('completed')).toBe('Completed');
    });

    it('should return correct label for archived status', () => {
      expect(getStatusLabel('archived')).toBe('Archived');
    });

    it('should return labels for all valid statuses', () => {
      const statuses: JourneyStatus[] = ['draft', 'active', 'completed', 'archived'];

      statuses.forEach((status) => {
        const label = getStatusLabel(status);
        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStatusColor', () => {
    it('should return gray color for draft status', () => {
      const color = getStatusColor('draft');
      expect(color).toContain('gray');
    });

    it('should return green color for active status', () => {
      const color = getStatusColor('active');
      expect(color).toContain('green');
    });

    it('should return blue color for completed status', () => {
      const color = getStatusColor('completed');
      expect(color).toContain('blue');
    });

    it('should return amber color for archived status', () => {
      const color = getStatusColor('archived');
      expect(color).toContain('amber');
    });

    it('should return Tailwind CSS classes', () => {
      const statuses: JourneyStatus[] = ['draft', 'active', 'completed', 'archived'];

      statuses.forEach((status) => {
        const color = getStatusColor(status);
        expect(color).toContain('bg-');
        expect(color).toContain('text-');
        expect(color).toContain('border-');
      });
    });
  });

  describe('INITIAL_JOURNEY_FORM', () => {
    it('should have empty title', () => {
      expect(INITIAL_JOURNEY_FORM.title).toBe('');
    });

    it('should have empty description', () => {
      expect(INITIAL_JOURNEY_FORM.description).toBe('');
    });

    it('should have draft status', () => {
      expect(INITIAL_JOURNEY_FORM.status).toBe('draft');
    });

    it('should have empty cover image URL', () => {
      expect(INITIAL_JOURNEY_FORM.cover_image_url).toBe('');
    });

    it('should have empty tags array', () => {
      expect(INITIAL_JOURNEY_FORM.tags).toEqual([]);
      expect(Array.isArray(INITIAL_JOURNEY_FORM.tags)).toBe(true);
    });

    it('should be immutable reference', () => {
      const form1 = { ...INITIAL_JOURNEY_FORM };
      const form2 = { ...INITIAL_JOURNEY_FORM };

      form1.title = 'Modified';

      expect(form2.title).toBe('');
      expect(INITIAL_JOURNEY_FORM.title).toBe('');
    });
  });

  describe('Type Safety', () => {
    it('should accept valid Journey object', () => {
      const journey: Journey = {
        id: 'journey-123',
        owner_id: 'user-456',
        title: 'Test Journey',
        description: 'A test journey',
        status: 'active',
        cover_image_url: 'https://example.com/image.jpg',
        tags: ['test', 'example'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      expect(journey.id).toBe('journey-123');
      expect(journey.status).toBe('active');
    });

    it('should accept Journey with null optional fields', () => {
      const journey: Journey = {
        id: 'journey-123',
        owner_id: 'user-456',
        title: 'Minimal Journey',
        description: null,
        status: 'draft',
        cover_image_url: null,
        tags: [],
        created_at: null,
        updated_at: null,
      };

      expect(journey.description).toBeNull();
      expect(journey.cover_image_url).toBeNull();
    });

    it('should accept valid JourneyFormState object', () => {
      const form: JourneyFormState = {
        title: 'Form Title',
        description: 'Form description',
        status: 'completed',
        cover_image_url: 'https://example.com/image.jpg',
        tags: ['tag1', 'tag2'],
      };

      expect(form.title).toBe('Form Title');
      expect(form.tags).toHaveLength(2);
    });
  });

  describe('Status Values', () => {
    it('should have exactly 4 valid status values', () => {
      const validStatuses: JourneyStatus[] = ['draft', 'active', 'completed', 'archived'];

      expect(validStatuses).toHaveLength(4);

      // All statuses should have labels
      validStatuses.forEach((status) => {
        expect(getStatusLabel(status)).toBeDefined();
      });

      // All statuses should have colors
      validStatuses.forEach((status) => {
        expect(getStatusColor(status)).toBeDefined();
      });
    });
  });
});

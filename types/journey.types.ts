/**
 * Journey Types - TypeScript definitions for the Personal Journeys feature.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Status of a personal journey.
 */
export type JourneyStatus = 'draft' | 'active' | 'completed' | 'archived';

/**
 * Fields that can be used for sorting.
 */
export type JourneySortField = 'created_at' | 'updated_at' | 'title';

/**
 * Sort direction.
 */
export type SortOrder = 'asc' | 'desc';

// =============================================================================
// JOURNEY TYPES
// =============================================================================

/**
 * A personal journey entity.
 */
export interface Journey {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: JourneyStatus;
  cover_image_url: string | null;
  tags: string[];
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Paginated list of journeys.
 */
export interface JourneyListResponse {
  items: Journey[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Request to create a new journey.
 */
export interface CreateJourneyRequest {
  title: string;
  description?: string | null;
  status?: JourneyStatus;
  cover_image_url?: string | null;
  tags?: string[];
}

/**
 * Request to update an existing journey.
 */
export interface UpdateJourneyRequest {
  title?: string;
  description?: string | null;
  status?: JourneyStatus;
  cover_image_url?: string | null;
  tags?: string[];
}

/**
 * Query parameters for listing journeys.
 */
export interface ListJourneysParams {
  status?: JourneyStatus;
  search?: string;
  sort_by?: JourneySortField;
  sort_order?: SortOrder;
  limit?: number;
  offset?: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * API error response structure.
 */
export interface ApiError {
  error: string;
  message: string;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Form state for journey creation/editing.
 */
export interface JourneyFormState {
  title: string;
  description: string;
  status: JourneyStatus;
  cover_image_url: string;
  tags: string[];
}

/**
 * Initial form state.
 */
export const INITIAL_JOURNEY_FORM: JourneyFormState = {
  title: '',
  description: '',
  status: 'draft',
  cover_image_url: '',
  tags: [],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display label for journey status.
 */
export function getStatusLabel(status: JourneyStatus): string {
  const labels: Record<JourneyStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status];
}

/**
 * Get status color for UI display.
 */
export function getStatusColor(status: JourneyStatus): string {
  const colors: Record<JourneyStatus, string> = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    archived: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return colors[status];
}

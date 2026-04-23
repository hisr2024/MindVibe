/**
 * KarmalytixScreen — insufficient-data state test.
 *
 * Verifies that when the backend reports ``insufficient_data=true`` with an
 * ``entries_needed`` count the dashboard renders the lotus empty-state card
 * with the correct prompt — never a blank screen, never a partial mirror.
 *
 * The React Query hooks are mocked directly so this test is hermetic (no
 * MSW, no fetch). We exercise the branch where `mirror` is null AND
 * `insufficient = true`, which is the most common first-week experience.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — declared before any import of the screen under test
// ---------------------------------------------------------------------------

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();

jest.mock('@kiaanverse/api', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@kiaanverse/api');
  return {
    ...actual,
    useKarmaLytixWeeklyReport: () => ({
      data: {
        id: null,
        report_date: null,
        report_type: 'weekly',
        period_start: '2026-04-20',
        period_end: '2026-04-26',
        karma_dimensions: {},
        overall_karma_score: 0,
        journal_metadata_summary: {
          entry_count: 1,
          journaling_days: 1,
          mood_counts: {},
          tag_frequencies: {},
          unique_tag_count: 0,
          top_tags: [],
          dominant_mood: null,
          dominant_category: null,
          dominant_time_of_day: null,
          verse_bookmarks: 0,
          assessment_completed: false,
        },
        kiaan_insight: null,
        recommended_verses: [],
        patterns_detected: {},
        comparison_to_previous: {},
        insufficient_data: true,
        entries_needed: 2,
        message:
          'Your reflection deepens with each entry. Write at least 3 reflections this week to generate your sacred mirror.',
      },
      isLoading: false,
      refetch: mockRefetch,
    }),
    useGenerateKarmaLytixReport: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

// ---------------------------------------------------------------------------
// System under test — imported AFTER the mocks are defined
// ---------------------------------------------------------------------------

import KarmalytixScreen from '../app/karmalytix';

describe('KarmalytixScreen — insufficient data state', () => {
  it('renders the lotus empty-state prompt with the correct entries-needed count', () => {
    const { getByText } = render(<KarmalytixScreen />);

    // Title
    expect(getByText('Your mirror awaits')).toBeTruthy();

    // Prompt must reflect the server's entries_needed count (2)
    expect(
      getByText(
        /Write 2 more reflections this week and KIAAN will craft your Sacred Mirror/i,
      ),
    ).toBeTruthy();

    // Privacy guarantee is always visible
    expect(
      getByText(/Karmalytix only reads plaintext mood \+ tag metadata/i),
    ).toBeTruthy();

    // The "Begin a reflection" CTA routes users out to the composer
    expect(getByText('Begin a reflection')).toBeTruthy();
  });

  it('does not render the regenerate button in the insufficient-data state', () => {
    const { queryByText } = render(<KarmalytixScreen />);
    expect(queryByText(/Ask KIAAN for a fresh mirror/i)).toBeNull();
    expect(queryByText(/Regenerating/i)).toBeNull();
  });
});

/**
 * User personalisation context types
 *
 * Fetched on-demand when KIAAN needs to tailor responses to the user's
 * actual spiritual journey state (active enemies, recent moods, bookmarks).
 */

export interface ActiveJourneyContext {
  enemyId: string;
  enemyName: string;
  dayNumber: number;
  totalDays: number;
}

export interface UserPersonalisationContext {
  activeJourneys: ActiveJourneyContext[];
  recentMoods: string[];
  bookmarkedVerses: string[];
}

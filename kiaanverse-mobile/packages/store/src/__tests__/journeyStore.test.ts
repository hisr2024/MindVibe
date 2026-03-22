/**
 * Journey Store — Unit Test Stubs
 *
 * Tests for journey tracking, progress, and completion.
 */

import { useJourneyStore } from '../journeyStore';
import type { Journey } from '@kiaanverse/api';

function resetStore() {
  useJourneyStore.setState({
    activeJourneyId: null,
    completingStepKey: null,
    enrolledJourneys: [],
    completedJourneys: [],
    journeyProgress: {},
    currentJourneyId: null,
  });
}

const mockJourney: Journey = {
  id: 'journey-1',
  title: 'Transform Anger',
  description: 'A 14-day journey to master krodha',
  durationDays: 14,
  status: 'active',
  currentDay: 3,
  completedSteps: 2,
  category: 'deep_dives',
};

describe('useJourneyStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should initialize with empty journey state', () => {
      const state = useJourneyStore.getState();
      expect(state.activeJourneyId).toBeNull();
      expect(state.completingStepKey).toBeNull();
      expect(state.enrolledJourneys).toEqual([]);
      expect(state.completedJourneys).toEqual([]);
      expect(state.journeyProgress).toEqual({});
      expect(state.currentJourneyId).toBeNull();
    });
  });

  describe('activeJourney', () => {
    it('should set active journey', () => {
      useJourneyStore.getState().setActiveJourney('journey-1');
      expect(useJourneyStore.getState().activeJourneyId).toBe('journey-1');
    });

    it('should clear active journey', () => {
      useJourneyStore.getState().setActiveJourney('journey-1');
      useJourneyStore.getState().setActiveJourney(null);
      expect(useJourneyStore.getState().activeJourneyId).toBeNull();
    });
  });

  describe('completingStep', () => {
    it('should set completing step key', () => {
      useJourneyStore.getState().setCompletingStep('journey-1', 5);
      expect(useJourneyStore.getState().completingStepKey).toBe('journey-1:5');
    });

    it('should clear completing step', () => {
      useJourneyStore.getState().setCompletingStep('journey-1', 5);
      useJourneyStore.getState().clearCompletingStep();
      expect(useJourneyStore.getState().completingStepKey).toBeNull();
    });
  });

  describe('enrolledJourneys', () => {
    it('should bulk set enrolled journeys', () => {
      useJourneyStore.getState().setEnrolledJourneys([mockJourney]);
      expect(useJourneyStore.getState().enrolledJourneys).toHaveLength(1);
      expect(useJourneyStore.getState().enrolledJourneys[0]?.id).toBe('journey-1');
    });

    it('should add a single journey', () => {
      useJourneyStore.getState().addEnrolledJourney(mockJourney);
      expect(useJourneyStore.getState().enrolledJourneys).toHaveLength(1);
    });

    it('should not add duplicate journeys', () => {
      useJourneyStore.getState().addEnrolledJourney(mockJourney);
      useJourneyStore.getState().addEnrolledJourney(mockJourney);
      expect(useJourneyStore.getState().enrolledJourneys).toHaveLength(1);
    });

    it('should remove a journey', () => {
      useJourneyStore.getState().addEnrolledJourney(mockJourney);
      useJourneyStore.getState().removeEnrolledJourney('journey-1');
      expect(useJourneyStore.getState().enrolledJourneys).toHaveLength(0);
    });
  });

  describe('markJourneyCompleted', () => {
    it('should move journey from enrolled to completed', () => {
      useJourneyStore.getState().addEnrolledJourney(mockJourney);
      useJourneyStore.getState().setCurrentJourney('journey-1');

      useJourneyStore.getState().markJourneyCompleted('journey-1');

      const state = useJourneyStore.getState();
      expect(state.completedJourneys).toContain('journey-1');
      expect(state.enrolledJourneys).toHaveLength(0);
      expect(state.currentJourneyId).toBeNull();
    });

    it('should not duplicate completed journey IDs', () => {
      useJourneyStore.getState().markJourneyCompleted('journey-1');
      useJourneyStore.getState().markJourneyCompleted('journey-1');
      expect(useJourneyStore.getState().completedJourneys).toHaveLength(1);
    });
  });

  describe('journeyProgress', () => {
    it('should create progress entry for new journey', () => {
      useJourneyStore.getState().updateJourneyProgress('journey-1', {
        currentDay: 3,
        completedSteps: 2,
        totalSteps: 14,
      });

      const progress = useJourneyStore.getState().journeyProgress['journey-1'];
      expect(progress?.currentDay).toBe(3);
      expect(progress?.completedSteps).toBe(2);
      expect(progress?.totalSteps).toBe(14);
    });

    it('should merge partial updates into existing progress', () => {
      useJourneyStore.getState().updateJourneyProgress('journey-1', {
        currentDay: 1,
        completedSteps: 0,
        totalSteps: 14,
      });

      useJourneyStore.getState().updateJourneyProgress('journey-1', {
        currentDay: 3,
        completedSteps: 2,
      });

      const progress = useJourneyStore.getState().journeyProgress['journey-1'];
      expect(progress?.currentDay).toBe(3);
      expect(progress?.completedSteps).toBe(2);
      expect(progress?.totalSteps).toBe(14);
    });
  });

  describe('currentJourney', () => {
    it('should set current journey', () => {
      useJourneyStore.getState().setCurrentJourney('journey-1');
      expect(useJourneyStore.getState().currentJourneyId).toBe('journey-1');
    });
  });

  describe('resetJourneys', () => {
    it('should reset all journey state', () => {
      useJourneyStore.getState().addEnrolledJourney(mockJourney);
      useJourneyStore.getState().markJourneyCompleted('journey-1');
      useJourneyStore.getState().setCurrentJourney('journey-2');

      useJourneyStore.getState().resetJourneys();

      const state = useJourneyStore.getState();
      expect(state.enrolledJourneys).toEqual([]);
      expect(state.completedJourneys).toEqual([]);
      expect(state.journeyProgress).toEqual({});
      expect(state.currentJourneyId).toBeNull();
    });
  });
});

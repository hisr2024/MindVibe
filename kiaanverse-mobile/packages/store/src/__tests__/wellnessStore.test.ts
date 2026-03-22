/**
 * Wellness Store — Unit Test Stubs
 *
 * Tests for mood, karma, and streak tracking.
 */

import { useWellnessStore } from '../wellnessStore';
import type { MoodEntry, KarmaNodeData, KarmaTreeLevel } from '@kiaanverse/api';

function resetStore() {
  useWellnessStore.setState({
    todayMood: null,
    moodHistory: [],
    karmaPoints: 0,
    karmaTreeLevel: 'seed',
    karmaNodes: [],
    streak: 0,
    lastActiveDate: null,
  });
}

describe('useWellnessStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should initialize with default wellness state', () => {
      const state = useWellnessStore.getState();
      expect(state.todayMood).toBeNull();
      expect(state.moodHistory).toEqual([]);
      expect(state.karmaPoints).toBe(0);
      expect(state.karmaTreeLevel).toBe('seed');
      expect(state.karmaNodes).toEqual([]);
      expect(state.streak).toBe(0);
      expect(state.lastActiveDate).toBeNull();
    });
  });

  describe('setTodayMood', () => {
    it('should set today mood', () => {
      useWellnessStore.getState().setTodayMood('peaceful');
      expect(useWellnessStore.getState().todayMood).toBe('peaceful');
    });

    it('should clear today mood', () => {
      useWellnessStore.getState().setTodayMood('peaceful');
      useWellnessStore.getState().setTodayMood(null);
      expect(useWellnessStore.getState().todayMood).toBeNull();
    });
  });

  describe('moodHistory', () => {
    it('should add a mood entry (prepend)', () => {
      const entry: MoodEntry = {
        id: 1,
        score: 2,
        state: 'peaceful',
        at: new Date().toISOString(),
      };

      useWellnessStore.getState().addMoodEntry(entry);
      expect(useWellnessStore.getState().moodHistory).toHaveLength(1);
      expect(useWellnessStore.getState().moodHistory[0]?.id).toBe(1);
    });

    it('should bulk set mood history', () => {
      const entries: MoodEntry[] = [
        { id: 1, score: 2, at: new Date().toISOString() },
        { id: 2, score: -1, at: new Date().toISOString() },
      ];

      useWellnessStore.getState().setMoodHistory(entries);
      expect(useWellnessStore.getState().moodHistory).toHaveLength(2);
    });

    it('should cap mood history at 100 entries', () => {
      for (let i = 0; i < 105; i++) {
        useWellnessStore.getState().addMoodEntry({
          id: i,
          score: 1,
          at: new Date().toISOString(),
        });
      }

      expect(useWellnessStore.getState().moodHistory.length).toBeLessThanOrEqual(100);
    });
  });

  describe('karma', () => {
    it('should set karma points', () => {
      useWellnessStore.getState().setKarmaPoints(150);
      expect(useWellnessStore.getState().karmaPoints).toBe(150);
    });

    it('should set karma tree level', () => {
      useWellnessStore.getState().setKarmaTreeLevel('mighty_tree');
      expect(useWellnessStore.getState().karmaTreeLevel).toBe('mighty_tree');
    });

    it('should bulk set karma nodes', () => {
      const nodes: KarmaNodeData[] = [
        { id: 'k1', label: 'Seva', action: 'service', points: 10, completed: false },
        { id: 'k2', label: 'Dhyana', action: 'meditation', points: 15, completed: true },
      ];

      useWellnessStore.getState().setKarmaNodes(nodes);
      expect(useWellnessStore.getState().karmaNodes).toHaveLength(2);
    });

    it('should add a single karma node', () => {
      const node: KarmaNodeData = {
        id: 'k1',
        label: 'Seva',
        action: 'service',
        points: 10,
        completed: false,
      };

      useWellnessStore.getState().addKarmaNode(node);
      expect(useWellnessStore.getState().karmaNodes).toHaveLength(1);
    });

    it('should complete a karma node', () => {
      useWellnessStore.getState().setKarmaNodes([
        { id: 'k1', label: 'Seva', action: 'service', points: 10, completed: false },
      ]);

      useWellnessStore.getState().completeKarmaNode('k1');

      const node = useWellnessStore.getState().karmaNodes[0];
      expect(node?.completed).toBe(true);
      expect(node?.completedAt).toBeDefined();
    });
  });

  describe('streak', () => {
    it('should start streak on first activity', () => {
      useWellnessStore.getState().updateStreak();

      const state = useWellnessStore.getState();
      expect(state.streak).toBe(1);
      expect(state.lastActiveDate).toBe(new Date().toISOString().slice(0, 10));
    });

    it('should not increment streak if already active today', () => {
      useWellnessStore.getState().updateStreak();
      useWellnessStore.getState().updateStreak();

      expect(useWellnessStore.getState().streak).toBe(1);
    });
  });

  describe('resetWellness', () => {
    it('should reset all wellness state', () => {
      useWellnessStore.getState().setTodayMood('peaceful');
      useWellnessStore.getState().setKarmaPoints(100);
      useWellnessStore.getState().updateStreak();

      useWellnessStore.getState().resetWellness();

      const state = useWellnessStore.getState();
      expect(state.todayMood).toBeNull();
      expect(state.karmaPoints).toBe(0);
      expect(state.streak).toBe(0);
    });
  });
});

/**
 * UI Store — Unit Test Stubs
 *
 * Tests for modals, toasts, theme, and launch state.
 */

import { useUiStore } from '../uiStore';

function resetStore() {
  useUiStore.setState({
    isFirstLaunch: true,
    onboardingCompleted: false,
    activeModal: null,
    modalData: null,
    toastQueue: [],
    theme: 'dark',
  });
}

describe('useUiStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should initialize with default UI state', () => {
      const state = useUiStore.getState();
      expect(state.isFirstLaunch).toBe(true);
      expect(state.onboardingCompleted).toBe(false);
      expect(state.activeModal).toBeNull();
      expect(state.modalData).toBeNull();
      expect(state.toastQueue).toEqual([]);
      expect(state.theme).toBe('dark');
    });
  });

  describe('first launch', () => {
    it('should mark first launch complete', () => {
      useUiStore.getState().setFirstLaunch(false);
      expect(useUiStore.getState().isFirstLaunch).toBe(false);
    });
  });

  describe('onboarding', () => {
    it('should mark onboarding completed', () => {
      useUiStore.getState().setOnboardingCompleted(true);
      expect(useUiStore.getState().onboardingCompleted).toBe(true);
    });
  });

  describe('modals', () => {
    it('should open a modal', () => {
      useUiStore.getState().openModal('celebration');

      const state = useUiStore.getState();
      expect(state.activeModal).toBe('celebration');
      expect(state.modalData).toBeNull();
    });

    it('should open a modal with data', () => {
      useUiStore.getState().openModal('verse-detail', { chapter: 2, verse: 47 });

      const state = useUiStore.getState();
      expect(state.activeModal).toBe('verse-detail');
      expect(state.modalData).toEqual({ chapter: 2, verse: 47 });
    });

    it('should close a modal', () => {
      useUiStore.getState().openModal('celebration');
      useUiStore.getState().closeModal();

      const state = useUiStore.getState();
      expect(state.activeModal).toBeNull();
      expect(state.modalData).toBeNull();
    });

    it('should replace active modal when opening a new one', () => {
      useUiStore.getState().openModal('celebration');
      useUiStore.getState().openModal('karma-award');

      expect(useUiStore.getState().activeModal).toBe('karma-award');
    });
  });

  describe('toasts', () => {
    it('should add a toast with auto-generated ID', () => {
      useUiStore.getState().addToast({
        message: 'Step completed!',
        type: 'success',
      });

      const state = useUiStore.getState();
      expect(state.toastQueue).toHaveLength(1);
      expect(state.toastQueue[0]?.message).toBe('Step completed!');
      expect(state.toastQueue[0]?.type).toBe('success');
      expect(state.toastQueue[0]?.id).toBeDefined();
    });

    it('should queue multiple toasts', () => {
      useUiStore.getState().addToast({ message: 'First', type: 'info' });
      useUiStore.getState().addToast({ message: 'Second', type: 'warning' });

      expect(useUiStore.getState().toastQueue).toHaveLength(2);
    });

    it('should remove a specific toast', () => {
      useUiStore.getState().addToast({ message: 'Test', type: 'info' });
      const id = useUiStore.getState().toastQueue[0]?.id;

      if (id) {
        useUiStore.getState().removeToast(id);
      }
      expect(useUiStore.getState().toastQueue).toHaveLength(0);
    });

    it('should clear all toasts', () => {
      useUiStore.getState().addToast({ message: 'A', type: 'info' });
      useUiStore.getState().addToast({ message: 'B', type: 'error' });
      useUiStore.getState().clearToasts();

      expect(useUiStore.getState().toastQueue).toEqual([]);
    });
  });

  describe('theme', () => {
    it('should set theme to light', () => {
      useUiStore.getState().setTheme('light');
      expect(useUiStore.getState().theme).toBe('light');
    });

    it('should set theme to system', () => {
      useUiStore.getState().setTheme('system');
      expect(useUiStore.getState().theme).toBe('system');
    });
  });
});

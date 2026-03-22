/**
 * Jest Setup — Mobile App (Integration + Component Tests)
 *
 * Mocks for Expo modules, React Native Reanimated, Gesture Handler,
 * and expo-router. Provides MSW server wiring for API mocking in
 * integration tests.
 */

// ---------------------------------------------------------------------------
// @react-native-async-storage/async-storage
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((k) => [k, store[k] ?? null])),
      ),
      multiSet: jest.fn((pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => { store[k] = v; });
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((k) => { delete store[k]; });
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((k) => { delete store[k]; });
        return Promise.resolve();
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// react-native-reanimated — must be first
// ---------------------------------------------------------------------------

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;

  // Layout animation builder mock — chainable methods return `this`
  function createAnimationMock() {
    const mock: Record<string, unknown> = {};
    const chainable = () => mock;
    mock.duration = chainable;
    mock.delay = chainable;
    mock.springify = chainable;
    mock.damping = chainable;
    mock.stiffness = chainable;
    mock.withInitialValues = chainable;
    mock.withCallback = chainable;
    mock.build = () => ({});
    return mock;
  }

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (component: React.ComponentType) => component,
      View,
      Text: require('react-native').Text,
    },
    // Animated.View renders as a plain View in tests
    Animated: { View, Text: require('react-native').Text },
    // Layout animations — used by Toast and OfflineBanner
    FadeIn: createAnimationMock(),
    FadeOut: createAnimationMock(),
    SlideInUp: createAnimationMock(),
    SlideOutUp: createAnimationMock(),
    SlideInDown: createAnimationMock(),
    SlideOutDown: createAnimationMock(),
    // Shared value hooks
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    withSpring: (val: number) => val,
    withTiming: (val: number) => val,
    withRepeat: (val: number) => val,
    withSequence: (...vals: number[]) => vals[0],
    withDelay: (_delay: number, val: number) => val,
    Easing: {
      inOut: (fn: unknown) => fn,
      out: (fn: unknown) => fn,
      ease: 0,
    },
  };
});

// ---------------------------------------------------------------------------
// react-native-gesture-handler
// ---------------------------------------------------------------------------

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;

  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    LongPressGestureHandler: View,
    ScrollView: require('react-native').ScrollView,
    Directions: {},
  };
});

// ---------------------------------------------------------------------------
// Expo modules
// ---------------------------------------------------------------------------

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-push-token' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: { playAsync: jest.fn(), unloadAsync: jest.fn(), setPositionAsync: jest.fn() },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn(),
    AndroidOutputFormat: { MPEG_4: 2 },
    AndroidAudioEncoder: { AAC: 3 },
    IOSOutputFormat: { MPEG4AAC: 'aac' },
    IOSAudioQuality: { HIGH: 127, MEDIUM: 64, LOW: 32 },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn(),
    })),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

// ---------------------------------------------------------------------------
// expo-router
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  }),
  useSegments: jest.fn().mockReturnValue([]),
  usePathname: jest.fn().mockReturnValue('/'),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

/**
 * @fileoverview Test setup configuration for React Native testing
 * Configures Jest for proper test execution without full React Native environment
 */

// Mock React Native completely to avoid native module issues
jest.mock('react-native', () => ({
  StyleSheet: {
    create: (styles: any) => styles,
    flatten: (style: any) => style,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  SafeAreaView: 'SafeAreaView',
  StatusBar: 'StatusBar',
  Platform: {
    OS: 'ios',
    select: (options: any) => options.ios || options.default,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 }),
  },
}));

// Mock Expo StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  }),
}));

// Mock SafeAreaProvider
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock React Native SVG
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  G: 'G',
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'mock-socket-id',
  })),
}));

// Mock MobX
jest.mock('mobx-react-lite', () => ({
  observer: (component: any) => component,
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  State: {},
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
  },
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
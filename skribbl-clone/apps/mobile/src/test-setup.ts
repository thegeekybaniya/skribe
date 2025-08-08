/**
 * @fileoverview Test setup configuration for React Native testing
 * Configures Jest for proper test execution without full React Native environment
 */

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock the global __fbBatchedBridgeConfig to avoid React Native Testing Library errors
global.__fbBatchedBridgeConfig = {};

// Set up environment variables to prevent React Native Testing Library issues
process.env.RN_SRC_EXT = 'e2e.js';

// Mock React Native host components
const mockComponent = (name: string) => {
  const MockedComponent = (props: any) => {
    return React.createElement(name, props, props.children);
  };
  MockedComponent.displayName = `Mocked${name}`;
  return MockedComponent;
};

// Add React import for JSX
const React = require('react');

// Mock React Native modules that cause issues in testing
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock React Native completely to avoid native module issues
jest.mock('react-native', () => {
  return {
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => style,
    },
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TextInput: mockComponent('TextInput'),
    ScrollView: mockComponent('ScrollView'),
    SafeAreaView: mockComponent('SafeAreaView'),
    StatusBar: mockComponent('StatusBar'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    Modal: mockComponent('Modal'),
    RefreshControl: mockComponent('RefreshControl'),
    Platform: {
      OS: 'ios',
      select: (options: any) => options.ios || options.default,
    },
    Dimensions: {
      get: () => ({ width: 375, height: 667 }),
    },
    PanResponder: {
      create: jest.fn(() => ({
        panHandlers: {
          onStartShouldSetPanResponder: jest.fn(),
          onMoveShouldSetPanResponder: jest.fn(),
          onPanResponderGrant: jest.fn(),
          onPanResponderMove: jest.fn(),
          onPanResponderRelease: jest.fn(),
        },
      })),
    },
    Alert: {
      alert: jest.fn(),
    },
    Animated: {
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      sequence: jest.fn(() => ({
        start: jest.fn(),
      })),
      View: mockComponent('Animated.View'),
    },
    NativeModules: {
      PlatformConstants: {
        getConstants: () => ({
          forceTouchAvailable: false,
          osVersion: '14.0',
          systemName: 'iOS',
          interfaceIdiom: 'phone',
        }),
      },
      SettingsManager: {
        getConstants: () => ({}),
        setValues: jest.fn(),
        deleteValues: jest.fn(),
      },
      RNCNetInfo: {
        getCurrentState: jest.fn(() => Promise.resolve({})),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
    },
    TurboModuleRegistry: {
      getEnforcing: (name: string) => {
        if (name === 'PlatformConstants') {
          return {
            getConstants: () => ({
              forceTouchAvailable: false,
              osVersion: '14.0',
              systemName: 'iOS',
              interfaceIdiom: 'phone',
            }),
          };
        }
        if (name === 'SettingsManager') {
          return {
            getConstants: () => ({}),
            setValues: jest.fn(),
            deleteValues: jest.fn(),
          };
        }
        return {
          getConstants: () => ({}),
        };
      },
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
  };
});

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
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name: string) => {
    const MockedComponent = (props: any) => {
      return React.createElement(name, props, props.children);
    };
    MockedComponent.displayName = `Mocked${name}`;
    return MockedComponent;
  };
  
  return {
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Path: mockComponent('Path'),
    Circle: mockComponent('Circle'),
    Line: mockComponent('Line'),
    Rect: mockComponent('Rect'),
    G: mockComponent('G'),
  };
});

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

// Mock global fetch for any network requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;
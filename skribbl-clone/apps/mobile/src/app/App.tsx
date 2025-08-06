/**
 * @fileoverview Main App component for Skribbl Clone mobile app
 * Sets up the app with MobX stores and React Navigation
 * Requirements: 6.1, 6.5, 6.6, 6.7 - React Native app with navigation and state management
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import store context and navigation
import { StoreProvider } from '../contexts/StoreContext';
import { AppNavigator } from '../navigation/AppNavigator';

/**
 * Main App component that sets up the entire application
 * Provides MobX stores and navigation to all child components
 */
export const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
};

export default App;
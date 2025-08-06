/**
 * @fileoverview Main app navigator using React Navigation
 * Handles navigation between different screens in the app
 * Requirements: 6.5 - React Navigation with proper screen structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { observer } from 'mobx-react-lite';

// Import screens (these will be created in later tasks)
import { HomeScreen } from '../screens/HomeScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { GameScreen } from '../screens/GameScreen';
import { ResultsScreen } from '../screens/ResultsScreen';

// Import store context
import { useRootStore } from '../contexts/StoreContext';

/**
 * Type definition for navigation stack parameters
 * Defines what parameters each screen expects
 */
export type RootStackParamList = {
  Home: undefined;
  Lobby: { roomCode: string };
  Game: undefined;
  Results: { finalScores: any[] };
};

// Create the stack navigator
const Stack = createStackNavigator<RootStackParamList>();

/**
 * AppNavigator component that manages navigation between screens
 * Uses MobX store to determine which screens to show based on app state
 */
export const AppNavigator: React.FC = observer(() => {
  const rootStore = useRootStore();
  const { playerStore, roomStore, gameStore } = rootStore;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: {
            backgroundColor: '#F5F5F5',
          },
        }}
      >
        {/* Home Screen - Always available */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Skribbl Clone',
            headerLeft: () => null, // Disable back button on home screen
          }}
        />

        {/* Lobby Screen - Show when in a room but game hasn't started */}
        {roomStore.isInRoom && gameStore.gameState === 'waiting' && (
          <Stack.Screen
            name="Lobby"
            component={LobbyScreen}
            options={{
              title: `Room ${roomStore.currentRoomCode}`,
              headerLeft: () => null, // Disable back button in lobby
            }}
          />
        )}

        {/* Game Screen - Show when game is active */}
        {roomStore.isInRoom && 
         (gameStore.gameState === 'playing' || 
          gameStore.gameState === 'round_end') && (
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              title: `Round ${gameStore.currentRound}/${gameStore.maxRounds}`,
              headerLeft: () => null, // Disable back button during game
            }}
          />
        )}

        {/* Results Screen - Show when game ends */}
        {gameStore.gameState === 'game_end' && (
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{
              title: 'Game Results',
              headerLeft: () => null, // Disable back button on results
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});
/**
 * @fileoverview React context for MobX store dependency injection
 * Provides stores to React components throughout the app
 * Requirements: 6.7 - MobX for reactive state management
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { RootStore } from '../stores/RootStore';

// Create the store context with undefined default (will be provided by provider)
const StoreContext = createContext<RootStore | undefined>(undefined);

/**
 * Props for the StoreProvider component
 */
interface StoreProviderProps {
  children: ReactNode;
  store?: RootStore; // Optional for testing purposes
}

/**
 * StoreProvider component that provides the root store to all child components
 * This should wrap the entire app to make stores available everywhere
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  store = new RootStore() 
}) => {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};

/**
 * Custom hook to access the root store from any component
 * Throws an error if used outside of StoreProvider
 */
export const useRootStore = (): RootStore => {
  const store = useContext(StoreContext);
  
  if (!store) {
    throw new Error('useRootStore must be used within a StoreProvider');
  }
  
  return store;
};

/**
 * Custom hook to access the game store
 * Convenience hook for components that only need game state
 */
export const useGameStore = () => {
  const rootStore = useRootStore();
  return rootStore.gameStore;
};

/**
 * Custom hook to access the player store
 * Convenience hook for components that only need player state
 */
export const usePlayerStore = () => {
  const rootStore = useRootStore();
  return rootStore.playerStore;
};

/**
 * Custom hook to access the room store
 * Convenience hook for components that only need room state
 */
export const useRoomStore = () => {
  const rootStore = useRootStore();
  return rootStore.roomStore;
};

/**
 * Custom hook to access the drawing store
 * Convenience hook for components that only need drawing state
 */
export const useDrawingStore = () => {
  const rootStore = useRootStore();
  return rootStore.drawingStore;
};

/**
 * Custom hook to access the chat store
 * Convenience hook for components that only need chat state
 */
export const useChatStore = () => {
  const rootStore = useRootStore();
  return rootStore.chatStore;
};
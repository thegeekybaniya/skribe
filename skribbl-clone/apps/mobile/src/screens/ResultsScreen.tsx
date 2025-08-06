/**
 * @fileoverview Results screen for end game results and final scores
 * This is a placeholder that will be fully implemented in later tasks
 * Requirements: 6.6, 8.1, 8.2 - Screen components with atomic design
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';

/**
 * ResultsScreen component - placeholder for game results
 * This will be fully implemented in task 15
 */
export const ResultsScreen: React.FC = observer(() => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Results</Text>
      <Text style={styles.subtitle}>Final scores - To be implemented</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
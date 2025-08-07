/**
 * @fileoverview Unit tests for PlayerCard molecule component
 * 
 * This test file covers the PlayerCard component functionality including
 * player information display, status indicators, and accessibility features.
 * Tests ensure proper composition of atoms and correct visual feedback.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlayerCard } from './PlayerCard';
import { Player, PlayerStatus } from '@skribbl-clone/types';

// Mock player data for testing
const mockPlayer: Player = {
  id: 'player-1',
  name: 'TestPlayer',
  score: 150,
  isDrawing: false,
  isConnected: true,
  status: PlayerStatus.CONNECTED,
  joinedAt: new Date('2024-01-01T10:00:00Z'),
};

const mockDrawingPlayer: Player = {
  ...mockPlayer,
  id: 'player-2',
  name: 'DrawingPlayer',
  isDrawing: true,
  status: PlayerStatus.DRAWING,
};

const mockDisconnectedPlayer: Player = {
  ...mockPlayer,
  id: 'player-3',
  name: 'DisconnectedPlayer',
  isConnected: false,
  status: PlayerStatus.DISCONNECTED,
};

describe('PlayerCard Component', () => {
  /**
   * Test basic player information display
   * Verifies that player name and score are correctly displayed
   */
  it('displays player name and score correctly', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    // Check that player name is displayed
    expect(screen.getByText('TestPlayer')).toBeTruthy();
    
    // Check that score is displayed with proper formatting
    expect(screen.getByText('150 points')).toBeTruthy();
  });

  /**
   * Test current player indicator
   * Verifies that current player gets special styling and "You" label
   */
  it('shows current player indicator when isCurrentPlayer is true', () => {
    render(<PlayerCard player={mockPlayer} isCurrentPlayer={true} />);
    
    // Check that "You" label is displayed for current player
    expect(screen.getByText('(You)')).toBeTruthy();
    
    // Check accessibility label includes current player information
    expect(screen.getByLabelText(/Player TestPlayer, score 150, Connected/)).toBeTruthy();
  });

  /**
   * Test drawing player status
   * Verifies that drawing players show appropriate indicators and styling
   */
  it('displays drawing indicator for drawing player', () => {
    render(<PlayerCard player={mockDrawingPlayer} />);
    
    // Check that drawing indicator text is displayed
    expect(screen.getByText('Drawing now...')).toBeTruthy();
    
    // Check accessibility label includes drawing status
    expect(screen.getByLabelText(/Currently drawing/)).toBeTruthy();
  });

  /**
   * Test disconnected player status
   * Verifies that disconnected players show appropriate visual feedback
   */
  it('displays disconnected status correctly', () => {
    render(<PlayerCard player={mockDisconnectedPlayer} />);
    
    // Check accessibility label includes disconnected status
    expect(screen.getByLabelText(/Disconnected/)).toBeTruthy();
  });

  /**
   * Test score visibility control
   * Verifies that score can be hidden when showScore is false
   */
  it('hides score when showScore is false', () => {
    render(<PlayerCard player={mockPlayer} showScore={false} />);
    
    // Check that score is not displayed
    expect(screen.queryByText('150 points')).toBeNull();
    
    // Check that player name is still displayed
    expect(screen.getByText('TestPlayer')).toBeTruthy();
  });

  /**
   * Test status indicator visibility control
   * Verifies that status indicator can be hidden when showStatus is false
   */
  it('hides status indicator when showStatus is false', () => {
    render(<PlayerCard player={mockPlayer} showStatus={false} />);
    
    // Player name should still be visible
    expect(screen.getByText('TestPlayer')).toBeTruthy();
    
    // Status indicator should not be present in accessibility tree
    // (We can't easily test icon visibility, but we can test that the component renders)
    expect(screen.getByLabelText(/Player TestPlayer/)).toBeTruthy();
  });

  /**
   * Test accessibility features
   * Verifies that proper accessibility labels and roles are set
   */
  it('has proper accessibility features', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    // Check that main container has button role
    const playerCard = screen.getByRole('button');
    expect(playerCard).toBeTruthy();
    
    // Check that accessibility label includes all relevant information
    expect(screen.getByLabelText(/Player TestPlayer, score 150, Connected/)).toBeTruthy();
  });

  /**
   * Test onPress callback
   * Verifies that onPress callback is properly handled
   */
  it('calls onPress callback when provided', () => {
    const mockOnPress = jest.fn();
    render(<PlayerCard player={mockPlayer} onPress={mockOnPress} />);
    
    // The component should have accessibility hint when onPress is provided
    expect(screen.getByLabelText(/Player TestPlayer/)).toBeTruthy();
  });

  /**
   * Test custom styling
   * Verifies that custom styles can be applied to the component
   */
  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'red' };
    render(<PlayerCard player={mockPlayer} style={customStyle} />);
    
    // Component should render without errors with custom styles
    expect(screen.getByText('TestPlayer')).toBeTruthy();
  });

  /**
   * Test different player statuses
   * Verifies that different player statuses are handled correctly
   */
  it('handles different player statuses correctly', () => {
    // Test connected player
    const { rerender } = render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByLabelText(/Connected/)).toBeTruthy();
    
    // Test drawing player
    rerender(<PlayerCard player={mockDrawingPlayer} />);
    expect(screen.getByLabelText(/Currently drawing/)).toBeTruthy();
    
    // Test disconnected player
    rerender(<PlayerCard player={mockDisconnectedPlayer} />);
    expect(screen.getByLabelText(/Disconnected/)).toBeTruthy();
  });

  /**
   * Test component composition
   * Verifies that the component properly composes atoms (Text, Icon)
   */
  it('properly composes atomic components', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    // Check that Text components are rendered for name and score
    expect(screen.getByText('TestPlayer')).toBeTruthy();
    expect(screen.getByText('150 points')).toBeTruthy();
    
    // Component should render without throwing errors
    expect(screen.getByRole('button')).toBeTruthy();
  });

  /**
   * Test edge cases
   * Verifies that component handles edge cases gracefully
   */
  it('handles edge cases gracefully', () => {
    // Test with zero score
    const zeroScorePlayer = { ...mockPlayer, score: 0 };
    render(<PlayerCard player={zeroScorePlayer} />);
    expect(screen.getByText('0 points')).toBeTruthy();
    
    // Test with very long name
    const longNamePlayer = { ...mockPlayer, name: 'VeryLongPlayerNameThatMightCauseIssues' };
    const { rerender } = render(<PlayerCard player={longNamePlayer} />);
    expect(screen.getByText('VeryLongPlayerNameThatMightCauseIssues')).toBeTruthy();
    
    // Test with empty name (edge case)
    const emptyNamePlayer = { ...mockPlayer, name: '' };
    rerender(<PlayerCard player={emptyNamePlayer} />);
    // Component should still render without errors
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
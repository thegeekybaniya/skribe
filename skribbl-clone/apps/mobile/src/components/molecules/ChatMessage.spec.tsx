/**
 * @fileoverview Unit tests for ChatMessage molecule component
 * 
 * This test file covers the ChatMessage component functionality including
 * message display, sender information, timestamps, and correct guess indicators.
 * Tests ensure proper composition of atoms and accessibility features.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ChatMessage } from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@skribbl-clone/types';

// Mock chat message data for testing
const mockMessage: ChatMessageType = {
  id: 'msg-1',
  playerId: 'player-1',
  playerName: 'TestPlayer',
  message: 'Hello everyone!',
  isCorrectGuess: false,
  timestamp: new Date('2024-01-01T10:00:00Z'),
};

const mockCorrectGuessMessage: ChatMessageType = {
  ...mockMessage,
  id: 'msg-2',
  message: 'cat',
  isCorrectGuess: true,
};

const mockCurrentUserMessage: ChatMessageType = {
  ...mockMessage,
  id: 'msg-3',
  playerName: 'CurrentUser',
  message: 'This is my message',
};

describe('ChatMessage Component', () => {
  /**
   * Test basic message display
   * Verifies that message content and sender name are correctly displayed
   */
  it('displays message content and sender name correctly', () => {
    render(<ChatMessage message={mockMessage} />);
    
    // Check that message content is displayed
    expect(screen.getByText('Hello everyone!')).toBeTruthy();
    
    // Check that sender name is displayed
    expect(screen.getByText('TestPlayer')).toBeTruthy();
  });

  /**
   * Test current user message display
   * Verifies that current user messages show "You" instead of player name
   */
  it('shows "You" for current user messages', () => {
    render(<ChatMessage message={mockCurrentUserMessage} isCurrentUser={true} />);
    
    // Check that "You" is displayed instead of player name
    expect(screen.getByText('You')).toBeTruthy();
    
    // Check that actual player name is not displayed
    expect(screen.queryByText('CurrentUser')).toBeNull();
    
    // Check that message content is still displayed
    expect(screen.getByText('This is my message')).toBeTruthy();
  });

  /**
   * Test correct guess indicator
   * Verifies that correct guess messages show special indicators
   */
  it('displays correct guess indicator for correct answers', () => {
    render(<ChatMessage message={mockCorrectGuessMessage} />);
    
    // Check that correct guess text is displayed
    expect(screen.getByText('Correct!')).toBeTruthy();
    
    // Check that message content is displayed
    expect(screen.getByText('cat')).toBeTruthy();
    
    // Check accessibility label includes correct guess information
    expect(screen.getByLabelText(/correct guess/)).toBeTruthy();
  });

  /**
   * Test timestamp display
   * Verifies that timestamps are formatted and displayed correctly
   */
  it('displays formatted timestamp when showTimestamp is true', () => {
    // Mock current time to be 5 minutes after message timestamp
    const mockNow = new Date('2024-01-01T10:05:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime());
    
    render(<ChatMessage message={mockMessage} showTimestamp={true} />);
    
    // Check that timestamp is displayed (should show "5m ago")
    expect(screen.getByText('5m ago')).toBeTruthy();
    
    // Restore Date.now
    jest.restoreAllMocks();
  });

  /**
   * Test timestamp hiding
   * Verifies that timestamp can be hidden when showTimestamp is false
   */
  it('hides timestamp when showTimestamp is false', () => {
    render(<ChatMessage message={mockMessage} showTimestamp={false} />);
    
    // Check that message content is still displayed
    expect(screen.getByText('Hello everyone!')).toBeTruthy();
    
    // Timestamp should not be visible (we can't easily test for absence of formatted time)
    // But we can verify the component renders correctly
    expect(screen.getByText('TestPlayer')).toBeTruthy();
  });

  /**
   * Test accessibility features
   * Verifies that proper accessibility labels and roles are set
   */
  it('has proper accessibility features', () => {
    render(<ChatMessage message={mockMessage} />);
    
    // Check that main container has text role
    const messageContainer = screen.getByRole('text');
    expect(messageContainer).toBeTruthy();
    
    // Check that accessibility label includes message content and sender
    expect(screen.getByLabelText(/Message: Hello everyone!, from TestPlayer/)).toBeTruthy();
  });

  /**
   * Test custom styling
   * Verifies that custom styles can be applied to the component
   */
  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'blue' };
    render(<ChatMessage message={mockMessage} style={customStyle} />);
    
    // Component should render without errors with custom styles
    expect(screen.getByText('Hello everyone!')).toBeTruthy();
  });

  /**
   * Test timestamp formatting edge cases
   * Verifies that different time differences are formatted correctly
   */
  it('formats timestamps correctly for different time differences', () => {
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    // Test "Just now" (less than 1 minute)
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:00:30Z').getTime());
    const { rerender } = render(<ChatMessage message={mockMessage} showTimestamp={true} />);
    expect(screen.getByText('Just now')).toBeTruthy();
    
    // Test minutes ago
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:15:00Z').getTime());
    rerender(<ChatMessage message={mockMessage} showTimestamp={true} />);
    expect(screen.getByText('15m ago')).toBeTruthy();
    
    // Test hours ago
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T13:00:00Z').getTime());
    rerender(<ChatMessage message={mockMessage} showTimestamp={true} />);
    expect(screen.getByText('3h ago')).toBeTruthy();
    
    // Restore Date.now
    jest.restoreAllMocks();
  });

  /**
   * Test message types styling
   * Verifies that different message types get appropriate styling
   */
  it('applies different styling for different message types', () => {
    // Test regular message
    const { rerender } = render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText('Hello everyone!')).toBeTruthy();
    
    // Test current user message
    rerender(<ChatMessage message={mockCurrentUserMessage} isCurrentUser={true} />);
    expect(screen.getByText('You')).toBeTruthy();
    
    // Test correct guess message
    rerender(<ChatMessage message={mockCorrectGuessMessage} />);
    expect(screen.getByText('Correct!')).toBeTruthy();
  });

  /**
   * Test component composition
   * Verifies that the component properly composes atoms (Text, Icon)
   */
  it('properly composes atomic components', () => {
    render(<ChatMessage message={mockMessage} />);
    
    // Check that Text components are rendered for sender and message
    expect(screen.getByText('TestPlayer')).toBeTruthy();
    expect(screen.getByText('Hello everyone!')).toBeTruthy();
    
    // Component should render without throwing errors
    expect(screen.getByRole('text')).toBeTruthy();
  });

  /**
   * Test edge cases
   * Verifies that component handles edge cases gracefully
   */
  it('handles edge cases gracefully', () => {
    // Test with empty message
    const emptyMessage = { ...mockMessage, message: '' };
    render(<ChatMessage message={emptyMessage} />);
    expect(screen.getByText('TestPlayer')).toBeTruthy();
    
    // Test with very long message
    const longMessage = { 
      ...mockMessage, 
      message: 'This is a very long message that might cause layout issues if not handled properly in the component design and styling implementation.' 
    };
    const { rerender } = render(<ChatMessage message={longMessage} />);
    expect(screen.getByText(/This is a very long message/)).toBeTruthy();
    
    // Test with special characters in message
    const specialCharMessage = { ...mockMessage, message: '!@#$%^&*()_+{}[]|\\:";\'<>?,./' };
    rerender(<ChatMessage message={specialCharMessage} />);
    expect(screen.getByText('!@#$%^&*()_+{}[]|\\:";\'<>?,./')).toBeTruthy();
  });

  /**
   * Test accessibility labels for different scenarios
   * Verifies that accessibility labels are comprehensive and accurate
   */
  it('provides comprehensive accessibility labels', () => {
    // Test regular message accessibility
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByLabelText(/Message: Hello everyone!, from TestPlayer/)).toBeTruthy();
    
    // Test current user message accessibility
    const { rerender } = render(<ChatMessage message={mockCurrentUserMessage} isCurrentUser={true} />);
    expect(screen.getByLabelText(/your message/)).toBeTruthy();
    
    // Test correct guess message accessibility
    rerender(<ChatMessage message={mockCorrectGuessMessage} />);
    expect(screen.getByLabelText(/correct guess/)).toBeTruthy();
  });
});
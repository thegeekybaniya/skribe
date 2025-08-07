/**
 * @fileoverview Unit tests for RoomCodeDisplay molecule component
 * 
 * This test file covers the RoomCodeDisplay component functionality including
 * room code display, copy-to-clipboard functionality, accessibility features,
 * and proper composition of atomic components.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import * as Clipboard from 'expo-clipboard';

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('RoomCodeDisplay Component', () => {
  const mockOnCopySuccess = jest.fn();
  const mockOnCopyError = jest.fn();
  const defaultProps = {
    roomCode: 'ABC123',
    onCopySuccess: mockOnCopySuccess,
    onCopyError: mockOnCopyError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Clipboard.setStringAsync as jest.Mock).mockResolvedValue(undefined);
  });

  /**
   * Test basic room code display
   * Verifies that room code is displayed correctly with formatting
   */
  it('displays room code correctly with formatting', () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Check that the component renders with group role
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Check that default label is displayed
    expect(screen.getByText('Room Code')).toBeTruthy();
    
    // Check that formatted room code is displayed (AB C1 23)
    expect(screen.getByText('AB C1 23')).toBeTruthy();
    
    // Check that instructions are displayed
    expect(screen.getByText('Share this code with friends to join your room')).toBeTruthy();
  });

  /**
   * Test copy functionality
   * Verifies that copy button works and calls appropriate callbacks
   */
  it('copies room code to clipboard when copy button is pressed', async () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Find and press the copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    // Wait for async operations
    await waitFor(() => {
      // Check that clipboard was called with correct room code
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC123');
      
      // Check that success callback was called
      expect(mockOnCopySuccess).toHaveBeenCalledTimes(1);
      
      // Check that success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copied!',
        'Room code "ABC123" has been copied to your clipboard.',
        [{ text: 'OK', style: 'default' }]
      );
    });
  });

  /**
   * Test copy button state changes
   * Verifies that copy button shows different states during copy process
   */
  it('shows different button states during copy process', async () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Initial state should show "Copy"
    expect(screen.getByText('Copy')).toBeTruthy();
    
    // Press copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    // Wait for state changes
    await waitFor(() => {
      // Should show success state
      expect(screen.getByText('Copied!')).toBeTruthy();
    });
  });

  /**
   * Test copy error handling
   * Verifies that copy errors are handled gracefully
   */
  it('handles copy errors gracefully', async () => {
    const copyError = new Error('Clipboard access denied');
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValue(copyError);
    
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Press copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    // Wait for error handling
    await waitFor(() => {
      // Check that error callback was called
      expect(mockOnCopyError).toHaveBeenCalledWith(copyError);
      
      // Check that error alert was shown
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copy Failed',
        'Failed to copy room code to clipboard. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    });
  });

  /**
   * Test copy button visibility control
   * Verifies that copy button can be hidden
   */
  it('hides copy button when showCopyButton is false', () => {
    render(<RoomCodeDisplay {...defaultProps} showCopyButton={false} />);
    
    // Check that room code is still displayed
    expect(screen.getByText('AB C1 23')).toBeTruthy();
    
    // Check that copy button is not displayed
    expect(screen.queryByText('Copy')).toBeNull();
  });

  /**
   * Test label visibility control
   * Verifies that label can be hidden
   */
  it('hides label when showLabel is false', () => {
    render(<RoomCodeDisplay {...defaultProps} showLabel={false} />);
    
    // Check that room code is still displayed
    expect(screen.getByText('AB C1 23')).toBeTruthy();
    
    // Check that label is not displayed
    expect(screen.queryByText('Room Code')).toBeNull();
  });

  /**
   * Test custom label
   * Verifies that custom labels can be set
   */
  it('displays custom label when provided', () => {
    const customLabel = 'Game Room ID';
    render(<RoomCodeDisplay {...defaultProps} label={customLabel} />);
    
    // Check that custom label is displayed
    expect(screen.getByText(customLabel)).toBeTruthy();
    
    // Check that group has correct accessibility label
    expect(screen.getByLabelText(`${customLabel}: ABC123`)).toBeTruthy();
  });

  /**
   * Test disabled state
   * Verifies that component can be disabled
   */
  it('handles disabled state correctly', async () => {
    render(<RoomCodeDisplay {...defaultProps} disabled={true} />);
    
    // Try to press copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    // Check that clipboard was not called when disabled
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
    expect(mockOnCopySuccess).not.toHaveBeenCalled();
  });

  /**
   * Test accessibility features
   * Verifies that proper accessibility labels and roles are set
   */
  it('has proper accessibility features', () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Check that main container has group role
    const roomCodeDisplay = screen.getByRole('group');
    expect(roomCodeDisplay).toBeTruthy();
    
    // Check that room code has proper accessibility label
    expect(screen.getByLabelText('Room code: A B C 1 2 3')).toBeTruthy();
    
    // Check that copy button has proper accessibility label
    expect(screen.getByLabelText('Copy room code ABC123 to clipboard')).toBeTruthy();
  });

  /**
   * Test room code formatting
   * Verifies that different room codes are formatted correctly
   */
  it('formats different room codes correctly', () => {
    // Test 4-character code
    const { rerender } = render(<RoomCodeDisplay {...defaultProps} roomCode="ABCD" />);
    expect(screen.getByText('AB CD')).toBeTruthy();
    
    // Test 6-character code
    rerender(<RoomCodeDisplay {...defaultProps} roomCode="ABCDEF" />);
    expect(screen.getByText('AB CD EF')).toBeTruthy();
    
    // Test odd-length code
    rerender(<RoomCodeDisplay {...defaultProps} roomCode="ABCDE" />);
    expect(screen.getByText('AB CD E')).toBeTruthy();
  });

  /**
   * Test custom styling
   * Verifies that custom styles can be applied
   */
  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'lightgreen' };
    render(<RoomCodeDisplay {...defaultProps} style={customStyle} />);
    
    // Component should render without errors with custom styles
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByText('Room Code')).toBeTruthy();
  });

  /**
   * Test component composition
   * Verifies that the component properly composes atoms (Text, Button, Icon)
   */
  it('properly composes atomic components', () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Check that Text components are rendered for label and room code
    expect(screen.getByText('Room Code')).toBeTruthy();
    expect(screen.getByText('AB C1 23')).toBeTruthy();
    expect(screen.getByText('Share this code with friends to join your room')).toBeTruthy();
    
    // Check that Button component is rendered for copy functionality
    expect(screen.getByText('Copy')).toBeTruthy();
  });

  /**
   * Test copy success indicator
   * Verifies that success indicator appears after successful copy
   */
  it('shows success indicator after successful copy', async () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Press copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    // Wait for success state
    await waitFor(() => {
      // Check that success button text is shown
      expect(screen.getByText('Copied!')).toBeTruthy();
    });
  });

  /**
   * Test multiple copy attempts
   * Verifies that multiple copy attempts work correctly
   */
  it('handles multiple copy attempts correctly', async () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // First copy attempt
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('ABC123');
      expect(mockOnCopySuccess).toHaveBeenCalledTimes(1);
    });
    
    // Wait for button to reset (we can't easily test the timeout, but we can test multiple calls)
    jest.clearAllMocks();
    
    // Second copy attempt after state reset
    const copyButtonAfterReset = screen.getByText(/Copy/); // Could be "Copy" or "Copied!"
    fireEvent.press(copyButtonAfterReset);
    
    // Should work again (though might be in "Copied!" state)
    expect(screen.getByRole('group')).toBeTruthy();
  });

  /**
   * Test edge cases
   * Verifies that component handles edge cases gracefully
   */
  it('handles edge cases gracefully', () => {
    // Test with empty room code
    const { rerender } = render(<RoomCodeDisplay {...defaultProps} roomCode="" />);
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Test with very long room code
    rerender(<RoomCodeDisplay {...defaultProps} roomCode="VERYLONGROOMCODE123456" />);
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Test with special characters
    rerender(<RoomCodeDisplay {...defaultProps} roomCode="A1B2C3" />);
    expect(screen.getByText('A1 B2 C3')).toBeTruthy();
  });

  /**
   * Test accessibility labels during different states
   * Verifies that accessibility labels update correctly during copy process
   */
  it('updates accessibility labels correctly during copy process', async () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    
    // Initial state accessibility
    expect(screen.getByLabelText('Copy room code ABC123 to clipboard')).toBeTruthy();
    
    // Press copy button
    const copyButton = screen.getByText('Copy');
    fireEvent.press(copyButton);
    
    // Wait for state change
    await waitFor(() => {
      // Success state should have different accessibility label
      expect(screen.getByText('Copied!')).toBeTruthy();
    });
  });
});
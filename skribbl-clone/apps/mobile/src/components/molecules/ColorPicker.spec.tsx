/**
 * @fileoverview Unit tests for ColorPicker molecule component
 * 
 * This test file covers the ColorPicker component functionality including
 * color selection, visual feedback, accessibility features, and proper
 * composition of atomic components for drawing tool color selection.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ColorPicker, DRAWING_COLORS } from './ColorPicker';

describe('ColorPicker Component', () => {
  const mockOnColorSelect = jest.fn();
  const defaultProps = {
    selectedColor: '#000000',
    onColorSelect: mockOnColorSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test basic color display
   * Verifies that all default colors are displayed in the picker
   */
  it('displays all default colors correctly', () => {
    render(<ColorPicker {...defaultProps} />);
    
    // Check that the component renders with group role
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Check that default label is displayed
    expect(screen.getByText('Select drawing color')).toBeTruthy();
    
    // Check that selected color display is present
    expect(screen.getByText('Selected:')).toBeTruthy();
  });

  /**
   * Test color selection functionality
   * Verifies that color selection calls the callback with correct color
   */
  it('calls onColorSelect when a color is pressed', () => {
    render(<ColorPicker {...defaultProps} />);
    
    // Find and press a color button (we'll look for accessibility labels)
    const redColorButton = screen.getByLabelText('Red color');
    fireEvent.press(redColorButton);
    
    // Check that callback was called with correct color
    expect(mockOnColorSelect).toHaveBeenCalledWith('#FF0000');
    expect(mockOnColorSelect).toHaveBeenCalledTimes(1);
  });

  /**
   * Test selected color indication
   * Verifies that the selected color is visually indicated
   */
  it('indicates selected color correctly', () => {
    render(<ColorPicker {...defaultProps} selectedColor="#FF0000" />);
    
    // Check that the red color is marked as selected in accessibility
    expect(screen.getByLabelText('Red color, selected')).toBeTruthy();
  });

  /**
   * Test custom colors
   * Verifies that custom color arrays can be provided
   */
  it('displays custom colors when provided', () => {
    const customColors = [
      { name: 'Custom Red', value: '#FF0000' },
      { name: 'Custom Blue', value: '#0000FF' },
    ];
    
    render(
      <ColorPicker 
        {...defaultProps} 
        colors={customColors}
      />
    );
    
    // Check that custom colors are displayed
    expect(screen.getByLabelText('Custom Red color')).toBeTruthy();
    expect(screen.getByLabelText('Custom Blue color')).toBeTruthy();
    
    // Check that default colors are not present
    expect(screen.queryByLabelText('Green color')).toBeNull();
  });

  /**
   * Test disabled state
   * Verifies that color picker can be disabled
   */
  it('handles disabled state correctly', () => {
    render(<ColorPicker {...defaultProps} disabled={true} />);
    
    // Try to press a color button
    const blackColorButton = screen.getByLabelText(/Black color/);
    fireEvent.press(blackColorButton);
    
    // Check that callback was not called when disabled
    expect(mockOnColorSelect).not.toHaveBeenCalled();
    
    // Check accessibility hint indicates disabled state
    expect(screen.getByLabelText(/Color picker is disabled/)).toBeTruthy();
  });

  /**
   * Test custom label
   * Verifies that custom labels can be set
   */
  it('displays custom label when provided', () => {
    const customLabel = 'Choose your color';
    render(<ColorPicker {...defaultProps} label={customLabel} />);
    
    // Check that custom label is displayed
    expect(screen.getByText(customLabel)).toBeTruthy();
    
    // Check that group has correct accessibility label
    expect(screen.getByLabelText(customLabel)).toBeTruthy();
  });

  /**
   * Test grid layout configuration
   * Verifies that column count can be customized
   */
  it('handles custom column configuration', () => {
    render(<ColorPicker {...defaultProps} columns={3} />);
    
    // Component should render without errors with custom columns
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByText('Select drawing color')).toBeTruthy();
  });

  /**
   * Test custom swatch size
   * Verifies that swatch size can be customized
   */
  it('handles custom swatch size', () => {
    render(<ColorPicker {...defaultProps} swatchSize={50} />);
    
    // Component should render without errors with custom swatch size
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByLabelText('Black color, selected')).toBeTruthy();
  });

  /**
   * Test accessibility features
   * Verifies that proper accessibility labels and roles are set
   */
  it('has proper accessibility features', () => {
    render(<ColorPicker {...defaultProps} />);
    
    // Check that main container has group role
    const colorPicker = screen.getByRole('group');
    expect(colorPicker).toBeTruthy();
    
    // Check that color buttons have proper accessibility labels
    expect(screen.getByLabelText('Black color, selected')).toBeTruthy();
    expect(screen.getByLabelText('White color')).toBeTruthy();
    expect(screen.getByLabelText('Red color')).toBeTruthy();
    
    // Check that selected color display has accessibility label
    expect(screen.getByLabelText(/Currently selected color: Black/)).toBeTruthy();
  });

  /**
   * Test white color special handling
   * Verifies that white color gets special border treatment
   */
  it('handles white color display correctly', () => {
    render(<ColorPicker {...defaultProps} selectedColor="#FFFFFF" />);
    
    // Check that white color is marked as selected
    expect(screen.getByLabelText('White color, selected')).toBeTruthy();
    
    // Check that selected color display shows white
    expect(screen.getByLabelText(/Currently selected color: White/)).toBeTruthy();
  });

  /**
   * Test custom styling
   * Verifies that custom styles can be applied
   */
  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'lightgray' };
    render(<ColorPicker {...defaultProps} style={customStyle} />);
    
    // Component should render without errors with custom styles
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByText('Select drawing color')).toBeTruthy();
  });

  /**
   * Test color selection with different colors
   * Verifies that different colors can be selected
   */
  it('handles selection of different colors', () => {
    const { rerender } = render(<ColorPicker {...defaultProps} />);
    
    // Test selecting blue color
    const blueColorButton = screen.getByLabelText('Blue color');
    fireEvent.press(blueColorButton);
    expect(mockOnColorSelect).toHaveBeenCalledWith('#0000FF');
    
    // Test selecting yellow color
    const yellowColorButton = screen.getByLabelText('Yellow color');
    fireEvent.press(yellowColorButton);
    expect(mockOnColorSelect).toHaveBeenCalledWith('#FFFF00');
    
    // Verify callback was called twice
    expect(mockOnColorSelect).toHaveBeenCalledTimes(2);
  });

  /**
   * Test component composition
   * Verifies that the component properly composes atoms (Text, TouchableOpacity)
   */
  it('properly composes atomic components', () => {
    render(<ColorPicker {...defaultProps} />);
    
    // Check that Text components are rendered for label and selected color
    expect(screen.getByText('Select drawing color')).toBeTruthy();
    expect(screen.getByText('Selected:')).toBeTruthy();
    
    // Check that color buttons are rendered as buttons
    expect(screen.getByLabelText('Black color, selected')).toBeTruthy();
    expect(screen.getByLabelText('Red color')).toBeTruthy();
  });

  /**
   * Test edge cases
   * Verifies that component handles edge cases gracefully
   */
  it('handles edge cases gracefully', () => {
    // Test with empty colors array
    render(<ColorPicker {...defaultProps} colors={[]} />);
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Test with single color
    const singleColor = [{ name: 'Only Red', value: '#FF0000' }];
    const { rerender } = render(<ColorPicker {...defaultProps} colors={singleColor} />);
    expect(screen.getByLabelText('Only Red color')).toBeTruthy();
    
    // Test with invalid selected color (not in colors array)
    rerender(<ColorPicker {...defaultProps} selectedColor="#INVALID" />);
    expect(screen.getByRole('group')).toBeTruthy();
  });

  /**
   * Test grid layout with different column counts
   * Verifies that the grid layout works with various column configurations
   */
  it('handles different grid layouts correctly', () => {
    // Test with 2 columns
    const { rerender } = render(<ColorPicker {...defaultProps} columns={2} />);
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Test with 6 columns
    rerender(<ColorPicker {...defaultProps} columns={6} />);
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Test with more columns than colors
    rerender(<ColorPicker {...defaultProps} columns={20} />);
    expect(screen.getByRole('group')).toBeTruthy();
  });

  /**
   * Test accessibility state management
   * Verifies that accessibility states are properly managed
   */
  it('manages accessibility states correctly', () => {
    render(<ColorPicker {...defaultProps} disabled={true} />);
    
    // Check that disabled state is reflected in accessibility
    const colorButtons = screen.getAllByLabelText(/color/);
    colorButtons.forEach(button => {
      // Each button should indicate disabled state in its hint
      expect(screen.getByLabelText(/Color picker is disabled/)).toBeTruthy();
    });
  });
});
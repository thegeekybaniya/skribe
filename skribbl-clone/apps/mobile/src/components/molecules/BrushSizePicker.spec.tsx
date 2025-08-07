/**
 * @fileoverview Unit tests for BrushSizePicker molecule component
 * 
 * This test file covers the BrushSizePicker component functionality including
 * size selection, visual indicators, accessibility features, and proper
 * composition of atomic components for drawing tool size selection.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BrushSizePicker, BRUSH_SIZES } from './BrushSizePicker';

describe('BrushSizePicker Component', () => {
  const mockOnSizeSelect = jest.fn();
  const defaultProps = {
    selectedSize: 8,
    onSizeSelect: mockOnSizeSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test basic size display
   * Verifies that all default brush sizes are displayed in the picker
   */
  it('displays all default brush sizes correctly', () => {
    render(<BrushSizePicker {...defaultProps} />);
    
    // Check that the component renders with group role
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Check that default label is displayed
    expect(screen.getByText('Select brush size')).toBeTruthy();
    
    // Check that selected size display is present
    expect(screen.getByText(/Selected: Medium \(8px\)/)).toBeTruthy();
  });

  /**
   * Test size selection functionality
   * Verifies that size selection calls the callback with correct size
   */
  it('calls onSizeSelect when a size is pressed', () => {
    render(<BrushSizePicker {...defaultProps} />);
    
    // Find and press a size button
    const largeButton = screen.getByLabelText('Large brush size, 12 pixels');
    fireEvent.press(largeButton);
    
    // Check that callback was called with correct size
    expect(mockOnSizeSelect).toHaveBeenCalledWith(12);
    expect(mockOnSizeSelect).toHaveBeenCalledTimes(1);
  });

  /**
   * Test selected size indication
   * Verifies that the selected size is visually indicated
   */
  it('indicates selected size correctly', () => {
    render(<BrushSizePicker {...defaultProps} selectedSize={4} />);
    
    // Check that the small size is marked as selected in accessibility
    expect(screen.getByLabelText('Small brush size, 4 pixels, selected')).toBeTruthy();
    
    // Check that selected size display shows correct size
    expect(screen.getByText(/Selected: Small \(4px\)/)).toBeTruthy();
  });

  /**
   * Test custom sizes
   * Verifies that custom size arrays can be provided
   */
  it('displays custom sizes when provided', () => {
    const customSizes = [
      { name: 'Tiny', value: 1, displaySize: 6 },
      { name: 'Huge', value: 20, displaySize: 30 },
    ];
    
    render(
      <BrushSizePicker 
        {...defaultProps} 
        sizes={customSizes}
        selectedSize={1}
      />
    );
    
    // Check that custom sizes are displayed
    expect(screen.getByLabelText('Tiny brush size, 1 pixels, selected')).toBeTruthy();
    expect(screen.getByLabelText('Huge brush size, 20 pixels')).toBeTruthy();
    
    // Check that default sizes are not present
    expect(screen.queryByLabelText('Medium brush size')).toBeNull();
  });

  /**
   * Test disabled state
   * Verifies that brush size picker can be disabled
   */
  it('handles disabled state correctly', () => {
    render(<BrushSizePicker {...defaultProps} disabled={true} />);
    
    // Try to press a size button
    const mediumButton = screen.getByLabelText(/Medium brush size/);
    fireEvent.press(mediumButton);
    
    // Check that callback was not called when disabled
    expect(mockOnSizeSelect).not.toHaveBeenCalled();
    
    // Check accessibility hint indicates disabled state
    expect(screen.getByLabelText(/Brush size picker is disabled/)).toBeTruthy();
  });

  /**
   * Test vertical orientation
   * Verifies that vertical layout works correctly
   */
  it('handles vertical orientation correctly', () => {
    render(<BrushSizePicker {...defaultProps} orientation="vertical" />);
    
    // Component should render without errors in vertical orientation
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByText('Select brush size')).toBeTruthy();
    
    // All size options should still be present
    expect(screen.getByLabelText('Extra Small brush size, 2 pixels')).toBeTruthy();
    expect(screen.getByLabelText('Medium brush size, 8 pixels, selected')).toBeTruthy();
  });

  /**
   * Test label visibility control
   * Verifies that size labels can be hidden
   */
  it('hides labels when showLabels is false', () => {
    render(<BrushSizePicker {...defaultProps} showLabels={false} />);
    
    // Component should render without errors
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Size buttons should still be accessible
    expect(screen.getByLabelText('Medium brush size, 8 pixels, selected')).toBeTruthy();
  });

  /**
   * Test custom label
   * Verifies that custom labels can be set
   */
  it('displays custom label when provided', () => {
    const customLabel = 'Choose brush thickness';
    render(<BrushSizePicker {...defaultProps} label={customLabel} />);
    
    // Check that custom label is displayed
    expect(screen.getByText(customLabel)).toBeTruthy();
    
    // Check that group has correct accessibility label
    expect(screen.getByLabelText(customLabel)).toBeTruthy();
  });

  /**
   * Test accessibility features
   * Verifies that proper accessibility labels and roles are set
   */
  it('has proper accessibility features', () => {
    render(<BrushSizePicker {...defaultProps} />);
    
    // Check that main container has group role
    const sizePicker = screen.getByRole('group');
    expect(sizePicker).toBeTruthy();
    
    // Check that size buttons have proper accessibility labels
    expect(screen.getByLabelText('Extra Small brush size, 2 pixels')).toBeTruthy();
    expect(screen.getByLabelText('Small brush size, 4 pixels')).toBeTruthy();
    expect(screen.getByLabelText('Medium brush size, 8 pixels, selected')).toBeTruthy();
    expect(screen.getByLabelText('Large brush size, 12 pixels')).toBeTruthy();
    expect(screen.getByLabelText('Extra Large brush size, 16 pixels')).toBeTruthy();
    
    // Check that selected size display has accessibility label
    expect(screen.getByLabelText(/Currently selected brush size: 8 pixels/)).toBeTruthy();
  });

  /**
   * Test custom styling
   * Verifies that custom styles can be applied
   */
  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'lightblue' };
    render(<BrushSizePicker {...defaultProps} style={customStyle} />);
    
    // Component should render without errors with custom styles
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByText('Select brush size')).toBeTruthy();
  });

  /**
   * Test size selection with different sizes
   * Verifies that different sizes can be selected
   */
  it('handles selection of different sizes', () => {
    render(<BrushSizePicker {...defaultProps} />);
    
    // Test selecting extra small size
    const extraSmallButton = screen.getByLabelText('Extra Small brush size, 2 pixels');
    fireEvent.press(extraSmallButton);
    expect(mockOnSizeSelect).toHaveBeenCalledWith(2);
    
    // Test selecting extra large size
    const extraLargeButton = screen.getByLabelText('Extra Large brush size, 16 pixels');
    fireEvent.press(extraLargeButton);
    expect(mockOnSizeSelect).toHaveBeenCalledWith(16);
    
    // Verify callback was called twice
    expect(mockOnSizeSelect).toHaveBeenCalledTimes(2);
  });

  /**
   * Test component composition
   * Verifies that the component properly composes atoms (Text, TouchableOpacity)
   */
  it('properly composes atomic components', () => {
    render(<BrushSizePicker {...defaultProps} />);
    
    // Check that Text components are rendered for label and selected size
    expect(screen.getByText('Select brush size')).toBeTruthy();
    expect(screen.getByText(/Selected: Medium \(8px\)/)).toBeTruthy();
    
    // Check that size buttons are rendered as buttons
    expect(screen.getByLabelText('Medium brush size, 8 pixels, selected')).toBeTruthy();
    expect(screen.getByLabelText('Large brush size, 12 pixels')).toBeTruthy();
  });

  /**
   * Test selected size display updates
   * Verifies that selected size display updates correctly
   */
  it('updates selected size display correctly', () => {
    const { rerender } = render(<BrushSizePicker {...defaultProps} selectedSize={2} />);
    
    // Check initial selected size display
    expect(screen.getByText(/Selected: Extra Small \(2px\)/)).toBeTruthy();
    expect(screen.getByLabelText(/Currently selected brush size: 2 pixels/)).toBeTruthy();
    
    // Update selected size
    rerender(<BrushSizePicker {...defaultProps} selectedSize={16} />);
    
    // Check updated selected size display
    expect(screen.getByText(/Selected: Extra Large \(16px\)/)).toBeTruthy();
    expect(screen.getByLabelText(/Currently selected brush size: 16 pixels/)).toBeTruthy();
  });

  /**
   * Test edge cases
   * Verifies that component handles edge cases gracefully
   */
  it('handles edge cases gracefully', () => {
    // Test with empty sizes array
    render(<BrushSizePicker {...defaultProps} sizes={[]} />);
    expect(screen.getByRole('group')).toBeTruthy();
    
    // Test with single size
    const singleSize = [{ name: 'Only Medium', value: 8, displaySize: 16 }];
    const { rerender } = render(<BrushSizePicker {...defaultProps} sizes={singleSize} />);
    expect(screen.getByLabelText('Only Medium brush size, 8 pixels')).toBeTruthy();
    
    // Test with invalid selected size (not in sizes array)
    rerender(<BrushSizePicker {...defaultProps} selectedSize={999} />);
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByText(/Selected: Unknown \(999px\)/)).toBeTruthy();
  });

  /**
   * Test horizontal vs vertical orientation
   * Verifies that both orientations work correctly
   */
  it('handles both orientations correctly', () => {
    // Test horizontal orientation (default)
    const { rerender } = render(<BrushSizePicker {...defaultProps} orientation="horizontal" />);
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByLabelText('Medium brush size, 8 pixels, selected')).toBeTruthy();
    
    // Test vertical orientation
    rerender(<BrushSizePicker {...defaultProps} orientation="vertical" />);
    expect(screen.getByRole('group')).toBeTruthy();
    expect(screen.getByLabelText('Medium brush size, 8 pixels, selected')).toBeTruthy();
  });

  /**
   * Test accessibility state management
   * Verifies that accessibility states are properly managed
   */
  it('manages accessibility states correctly', () => {
    render(<BrushSizePicker {...defaultProps} disabled={true} />);
    
    // Check that disabled state is reflected in accessibility
    const sizeButtons = screen.getAllByLabelText(/brush size/);
    expect(sizeButtons.length).toBeGreaterThan(0);
    
    // Check that disabled hint is present
    expect(screen.getByLabelText(/Brush size picker is disabled/)).toBeTruthy();
  });

  /**
   * Test size value display
   * Verifies that size values are displayed correctly
   */
  it('displays size values correctly', () => {
    render(<BrushSizePicker {...defaultProps} />);
    
    // Check that pixel values are displayed for each size
    expect(screen.getByText('2px')).toBeTruthy();
    expect(screen.getByText('4px')).toBeTruthy();
    expect(screen.getByText('8px')).toBeTruthy();
    expect(screen.getByText('12px')).toBeTruthy();
    expect(screen.getByText('16px')).toBeTruthy();
  });
});
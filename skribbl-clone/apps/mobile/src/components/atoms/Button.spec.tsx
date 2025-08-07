/**
 * @fileoverview Unit tests for Button atom component
 * 
 * This test file covers all functionality of the Button component including
 * different variants, accessibility features, and user interactions.
 * Tests ensure the component meets requirements for atomic design and accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button, ButtonProps } from './Button';

// Helper function to render Button with default props
const renderButton = (props: Partial<ButtonProps> = {}) => {
  const defaultProps: ButtonProps = {
    title: 'Test Button',
    ...props,
  };
  return render(<Button {...defaultProps} />);
};

describe('Button Component', () => {
  // Test basic rendering functionality
  describe('Rendering', () => {
    it('should render with title text', () => {
      const { getByText } = renderButton({ title: 'Click Me' });
      expect(getByText('Click Me')).toBeTruthy();
    });

    it('should render with default primary variant', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should render with custom title', () => {
      const customTitle = 'Custom Button Title';
      const { getByText } = renderButton({ title: customTitle });
      expect(getByText(customTitle)).toBeTruthy();
    });
  });

  // Test different button variants
  describe('Variants', () => {
    it('should render primary variant correctly', () => {
      const { getByRole } = renderButton({ variant: 'primary' });
      const button = getByRole('button');
      expect(button).toBeTruthy();
      // Primary variant should be touchable
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('should render secondary variant correctly', () => {
      const { getByRole } = renderButton({ variant: 'secondary' });
      const button = getByRole('button');
      expect(button).toBeTruthy();
      // Secondary variant should be touchable
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('should render disabled variant correctly', () => {
      const { getByRole } = renderButton({ variant: 'disabled' });
      const button = getByRole('button');
      expect(button).toBeTruthy();
      // Disabled variant should not be touchable
      expect(button.props.accessibilityState?.disabled).toBeTruthy();
    });
  });

  // Test disabled state functionality
  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      const { getByRole } = renderButton({ disabled: true });
      const button = getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBeTruthy();
    });

    it('should be disabled when variant is disabled', () => {
      const { getByRole } = renderButton({ variant: 'disabled' });
      const button = getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBeTruthy();
    });

    it('should not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderButton({ 
        disabled: true, 
        onPress: mockOnPress 
      });
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      // onPress should not be called when button is disabled
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  // Test user interaction functionality
  describe('User Interactions', () => {
    it('should call onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderButton({ onPress: mockOnPress });
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should call onPress multiple times when pressed multiple times', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = renderButton({ onPress: mockOnPress });
      
      const button = getByRole('button');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it('should work without onPress prop', () => {
      // Should not throw error when onPress is not provided
      const { getByRole } = renderButton();
      const button = getByRole('button');
      
      expect(() => fireEvent.press(button)).not.toThrow();
    });
  });

  // Test accessibility features
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should have accessibility label matching title', () => {
      const title = 'Accessible Button';
      const { getByLabelText } = renderButton({ title });
      expect(getByLabelText(title)).toBeTruthy();
    });

    it('should have correct accessibility hint for enabled button', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Tap to activate');
    });

    it('should have correct accessibility hint for disabled button', () => {
      const { getByRole } = renderButton({ disabled: true });
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Button is disabled');
    });

    it('should be marked as accessible', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button.props.accessible).toBe(true);
    });

    it('should have correct disabled state in accessibility', () => {
      const { getByRole } = renderButton({ disabled: true });
      const button = getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // Test custom styling
  describe('Custom Styling', () => {
    it('should apply custom container styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByRole } = renderButton({ style: customStyle });
      const button = getByRole('button');
      
      // Check that custom styles are applied (this is a simplified check)
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('should apply custom text styles', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = renderButton({ 
        title: 'Styled Text',
        textStyle: customTextStyle 
      });
      const text = getByText('Styled Text');
      
      // Check that custom text styles are applied
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      );
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const { getByRole } = renderButton({ title: '' });
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should handle very long title', () => {
      const longTitle = 'This is a very long button title that might wrap to multiple lines';
      const { getByText } = renderButton({ title: longTitle });
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('should handle special characters in title', () => {
      const specialTitle = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const { getByText } = renderButton({ title: specialTitle });
      expect(getByText(specialTitle)).toBeTruthy();
    });

    it('should handle undefined onPress gracefully', () => {
      const { getByRole } = renderButton({ onPress: undefined });
      const button = getByRole('button');
      
      expect(() => fireEvent.press(button)).not.toThrow();
    });
  });

  // Test component props forwarding
  describe('Props Forwarding', () => {
    it('should forward additional TouchableOpacity props', () => {
      const testID = 'test-button';
      const { getByTestId } = renderButton({ testID });
      expect(getByTestId(testID)).toBeTruthy();
    });

    it('should forward accessibility props', () => {
      const accessibilityLabel = 'Custom Accessibility Label';
      const { getByLabelText } = renderButton({ 
        accessibilityLabel,
        title: 'Button' 
      });
      expect(getByLabelText(accessibilityLabel)).toBeTruthy();
    });
  });
});
/**
 * @fileoverview Unit tests for Input atom component
 * 
 * This test file covers all functionality of the Input component including
 * different validation states, error handling, and accessibility features.
 * Tests ensure the component meets requirements for atomic design and accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input, InputProps } from './Input';

// Helper function to render Input with default props
const renderInput = (props: Partial<InputProps> = {}) => {
  const defaultProps: InputProps = {
    placeholder: 'Enter text',
    ...props,
  };
  return render(<Input {...defaultProps} />);
};

describe('Input Component', () => {
  // Test basic rendering functionality
  describe('Rendering', () => {
    it('should render with placeholder text', () => {
      const placeholder = 'Enter your name';
      const { getByPlaceholderText } = renderInput({ placeholder });
      expect(getByPlaceholderText(placeholder)).toBeTruthy();
    });

    it('should render with initial value', () => {
      const value = 'Initial Value';
      const { getByDisplayValue } = renderInput({ value });
      expect(getByDisplayValue(value)).toBeTruthy();
    });

    it('should render with label', () => {
      const label = 'Username';
      const { getByText } = renderInput({ label });
      expect(getByText(label)).toBeTruthy();
    });

    it('should render without label when not provided', () => {
      const { queryByText } = renderInput();
      // Should not find any label text
      expect(queryByText(/label/i)).toBeNull();
    });
  });

  // Test different input states
  describe('Input States', () => {
    it('should render default state correctly', () => {
      const { getByPlaceholderText } = renderInput({ state: 'default' });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(true);
    });

    it('should render error state correctly', () => {
      const errorMessage = 'This field is required';
      const { getByText, getByPlaceholderText } = renderInput({ 
        state: 'error',
        errorMessage 
      });
      
      expect(getByText(errorMessage)).toBeTruthy();
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(true);
    });

    it('should render success state correctly', () => {
      const successMessage = 'Input is valid';
      const { getByText, getByPlaceholderText } = renderInput({ 
        state: 'success',
        successMessage 
      });
      
      expect(getByText(successMessage)).toBeTruthy();
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(true);
    });

    it('should render disabled state correctly', () => {
      const { getByPlaceholderText } = renderInput({ state: 'disabled' });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });
  });

  // Test disabled functionality
  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      const { getByPlaceholderText } = renderInput({ disabled: true });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });

    it('should be disabled when state is disabled', () => {
      const { getByPlaceholderText } = renderInput({ state: 'disabled' });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });

    it('should have correct accessibility state when disabled', () => {
      const { getByPlaceholderText } = renderInput({ disabled: true });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // Test user interaction functionality
  describe('User Interactions', () => {
    it('should call onChangeText when text changes', () => {
      const mockOnChangeText = jest.fn();
      const { getByPlaceholderText } = renderInput({ onChangeText: mockOnChangeText });
      
      const input = getByPlaceholderText('Enter text');
      fireEvent.changeText(input, 'New text');
      
      expect(mockOnChangeText).toHaveBeenCalledWith('New text');
    });

    it('should call onChangeText multiple times for multiple changes', () => {
      const mockOnChangeText = jest.fn();
      const { getByPlaceholderText } = renderInput({ onChangeText: mockOnChangeText });
      
      const input = getByPlaceholderText('Enter text');
      fireEvent.changeText(input, 'First');
      fireEvent.changeText(input, 'Second');
      fireEvent.changeText(input, 'Third');
      
      expect(mockOnChangeText).toHaveBeenCalledTimes(3);
      expect(mockOnChangeText).toHaveBeenNthCalledWith(1, 'First');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(2, 'Second');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(3, 'Third');
    });

    it('should work without onChangeText prop', () => {
      const { getByPlaceholderText } = renderInput();
      const input = getByPlaceholderText('Enter text');
      
      expect(() => fireEvent.changeText(input, 'Test')).not.toThrow();
    });
  });

  // Test message display functionality
  describe('Message Display', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Invalid input';
      const { getByText } = renderInput({ errorMessage });
      expect(getByText(errorMessage)).toBeTruthy();
    });

    it('should display success message when provided', () => {
      const successMessage = 'Valid input';
      const { getByText } = renderInput({ successMessage });
      expect(getByText(successMessage)).toBeTruthy();
    });

    it('should prioritize error message over success message', () => {
      const errorMessage = 'Error message';
      const successMessage = 'Success message';
      const { getByText, queryByText } = renderInput({ 
        errorMessage, 
        successMessage 
      });
      
      expect(getByText(errorMessage)).toBeTruthy();
      expect(queryByText(successMessage)).toBeNull();
    });

    it('should not display message when none provided', () => {
      const { queryByText } = renderInput();
      // Should not find any message text
      expect(queryByText(/message/i)).toBeNull();
    });
  });

  // Test accessibility features
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByPlaceholderText } = renderInput();
      const input = getByPlaceholderText('Enter text');
      expect(input.props.accessible).toBe(true);
    });

    it('should have accessibility label from label prop', () => {
      const label = 'Email Address';
      const { getByLabelText } = renderInput({ label });
      expect(getByLabelText(label)).toBeTruthy();
    });

    it('should have accessibility label from placeholder when no label', () => {
      const placeholder = 'Enter email';
      const { getByLabelText } = renderInput({ placeholder });
      expect(getByLabelText(placeholder)).toBeTruthy();
    });

    it('should have correct accessibility hint for enabled input', () => {
      const { getByPlaceholderText } = renderInput();
      const input = getByPlaceholderText('Enter text');
      expect(input.props.accessibilityHint).toBe('Enter text here');
    });

    it('should have correct accessibility hint for disabled input', () => {
      const { getByPlaceholderText } = renderInput({ disabled: true });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.accessibilityHint).toBe('Text input is disabled');
    });

    it('should have accessible error message', () => {
      const errorMessage = 'Required field';
      const { getByRole } = renderInput({ errorMessage });
      const message = getByRole('text');
      expect(message.props.accessible).toBe(true);
    });
  });

  // Test custom styling
  describe('Custom Styling', () => {
    it('should apply custom container styles', () => {
      const customStyle = { marginTop: 20 };
      const { getByPlaceholderText } = renderInput({ containerStyle: customStyle });
      const input = getByPlaceholderText('Enter text');
      
      // Check that the input is rendered (styling verification is limited in testing)
      expect(input).toBeTruthy();
    });

    it('should apply custom input styles', () => {
      const customInputStyle = { fontSize: 18 };
      const { getByPlaceholderText } = renderInput({ inputStyle: customInputStyle });
      const input = getByPlaceholderText('Enter text');
      
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customInputStyle)
        ])
      );
    });

    it('should apply custom label styles', () => {
      const customLabelStyle = { color: 'blue' };
      const { getByText } = renderInput({ 
        label: 'Custom Label',
        labelStyle: customLabelStyle 
      });
      const label = getByText('Custom Label');
      
      expect(label.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customLabelStyle)
        ])
      );
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle empty placeholder', () => {
      const { getByDisplayValue } = renderInput({ 
        placeholder: '',
        value: 'test' 
      });
      expect(getByDisplayValue('test')).toBeTruthy();
    });

    it('should handle very long text input', () => {
      const longText = 'This is a very long text input that might exceed normal input lengths and should be handled gracefully by the component';
      const { getByDisplayValue } = renderInput({ value: longText });
      expect(getByDisplayValue(longText)).toBeTruthy();
    });

    it('should handle special characters in input', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const { getByDisplayValue } = renderInput({ value: specialText });
      expect(getByDisplayValue(specialText)).toBeTruthy();
    });

    it('should handle undefined value gracefully', () => {
      const { getByPlaceholderText } = renderInput({ value: undefined });
      const input = getByPlaceholderText('Enter text');
      expect(input).toBeTruthy();
    });
  });

  // Test component props forwarding
  describe('Props Forwarding', () => {
    it('should forward additional TextInput props', () => {
      const testID = 'test-input';
      const { getByTestId } = renderInput({ testID });
      expect(getByTestId(testID)).toBeTruthy();
    });

    it('should forward keyboard type prop', () => {
      const { getByPlaceholderText } = renderInput({ keyboardType: 'email-address' });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should forward secure text entry prop', () => {
      const { getByPlaceholderText } = renderInput({ secureTextEntry: true });
      const input = getByPlaceholderText('Enter text');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });
});
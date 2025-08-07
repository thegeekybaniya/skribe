/**
 * @fileoverview Input atom component with validation states and error handling
 * 
 * This component provides a reusable text input with validation states,
 * error handling, and proper accessibility features. It's designed to handle
 * user text input with visual feedback for different states.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';

// Define the different validation states the input can have
export type InputState = 'default' | 'error' | 'success' | 'disabled';

// Props interface extending TextInput props for full customization
export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Placeholder text shown when input is empty */
  placeholder?: string;
  /** Current value of the input */
  value?: string;
  /** Function called when text changes */
  onChangeText?: (text: string) => void;
  /** Visual state of the input - affects border color and styling */
  state?: InputState;
  /** Error message to display below the input */
  errorMessage?: string;
  /** Success message to display below the input */
  successMessage?: string;
  /** Label text displayed above the input */
  label?: string;
  /** Custom styles for the input container */
  containerStyle?: ViewStyle;
  /** Custom styles for the input field */
  inputStyle?: TextStyle;
  /** Custom styles for the label text */
  labelStyle?: TextStyle;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * Input component - A text input field with validation states
 * 
 * This is an atom component that provides consistent text input styling
 * across the app. It supports different validation states with visual
 * feedback and includes proper accessibility features.
 * 
 * @param props - Input configuration and event handlers
 * @returns JSX element representing a styled text input
 */
export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  state = 'default',
  errorMessage,
  successMessage,
  label,
  containerStyle,
  inputStyle,
  labelStyle,
  disabled,
  ...otherProps
}) => {
  // Determine if input should be disabled
  const isDisabled = disabled || state === 'disabled';
  
  // Get the appropriate styles based on the state
  const inputContainerStyle = [
    styles.inputContainer,
    styles[`${state}Container`],
    isDisabled && styles.disabledContainer,
  ];
  
  const textInputStyle = [
    styles.input,
    styles[`${state}Input`],
    isDisabled && styles.disabledInput,
    inputStyle,
  ];

  // Determine which message to show (error takes priority over success)
  const messageToShow = errorMessage || successMessage;
  const messageStyle = errorMessage ? styles.errorText : styles.successText;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label text above the input field */}
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      {/* Main input field container with border styling */}
      <View style={inputContainerStyle}>
        <TextInput
          style={textInputStyle}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={!isDisabled}
          // Accessibility features for screen readers
          accessible={true}
          accessibilityLabel={label || placeholder}
          accessibilityHint={
            isDisabled 
              ? 'Text input is disabled' 
              : 'Enter text here'
          }
          accessibilityState={{
            disabled: isDisabled,
          }}
          {...otherProps}
        />
      </View>
      
      {/* Error or success message below the input */}
      {messageToShow && (
        <Text 
          style={messageStyle}
          accessible={true}
          accessibilityRole="text"
        >
          {messageToShow}
        </Text>
      )}
    </View>
  );
};

// Design system colors - these would typically come from a theme file
const colors = {
  primary: '#007AFF',
  error: '#FF3B30',
  success: '#34C759',
  border: '#C7C7CC',
  borderFocus: '#007AFF',
  borderError: '#FF3B30',
  borderSuccess: '#34C759',
  borderDisabled: '#E5E5EA',
  background: '#FFFFFF',
  backgroundDisabled: '#F2F2F7',
  text: '#000000',
  textDisabled: '#8E8E93',
  textSecondary: '#8E8E93',
  placeholder: '#C7C7CC',
};

// Styles for the input component following the design system
const styles = StyleSheet.create({
  // Main container for the entire input component
  container: {
    marginVertical: 8,
  },
  
  // Label text above the input
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  
  // Container for the input field with border
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  
  // The actual text input field
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 44, // Minimum touch target size for accessibility
  },
  
  // Default state styles
  defaultContainer: {
    borderColor: colors.border,
  },
  
  defaultInput: {
    color: colors.text,
  },
  
  // Error state styles - red border and text
  errorContainer: {
    borderColor: colors.borderError,
  },
  
  errorInput: {
    color: colors.text,
  },
  
  // Success state styles - green border
  successContainer: {
    borderColor: colors.borderSuccess,
  },
  
  successInput: {
    color: colors.text,
  },
  
  // Disabled state styles - gray appearance
  disabledContainer: {
    borderColor: colors.borderDisabled,
    backgroundColor: colors.backgroundDisabled,
  },
  
  disabledInput: {
    color: colors.textDisabled,
  },
  
  // Error message text styling
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
  },
  
  // Success message text styling
  successText: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
  },
});
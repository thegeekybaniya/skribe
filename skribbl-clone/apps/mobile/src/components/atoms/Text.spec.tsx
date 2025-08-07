/**
 * @fileoverview Unit tests for Text atom component
 * 
 * This test file covers all functionality of the Text component including
 * different typography variants, colors, and accessibility features.
 * Tests ensure the component meets requirements for atomic design and accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, TextProps } from './Text';

// Helper function to render Text with default props
const renderText = (props: Partial<TextProps> = {}) => {
  const defaultProps: TextProps = {
    children: 'Test Text',
    ...props,
  };
  return render(<Text {...defaultProps} />);
};

describe('Text Component', () => {
  // Test basic rendering functionality
  describe('Rendering', () => {
    it('should render with text content', () => {
      const textContent = 'Hello World';
      const { getByText } = renderText({ children: textContent });
      expect(getByText(textContent)).toBeTruthy();
    });

    it('should render with default body variant', () => {
      const { getByText } = renderText();
      const text = getByText('Test Text');
      expect(text).toBeTruthy();
    });

    it('should render with React node children', () => {
      const { getByText } = renderText({ 
        children: <Text>Nested Text</Text> 
      });
      expect(getByText('Nested Text')).toBeTruthy();
    });
  });

  // Test different typography variants
  describe('Typography Variants', () => {
    it('should render h1 variant correctly', () => {
      const { getByText } = renderText({ 
        variant: 'h1',
        children: 'Heading 1' 
      });
      const text = getByText('Heading 1');
      expect(text).toBeTruthy();
    });

    it('should render h2 variant correctly', () => {
      const { getByText } = renderText({ 
        variant: 'h2',
        children: 'Heading 2' 
      });
      const text = getByText('Heading 2');
      expect(text).toBeTruthy();
    });

    it('should render h3 variant correctly', () => {
      const { getByText } = renderText({ 
        variant: 'h3',
        children: 'Heading 3' 
      });
      const text = getByText('Heading 3');
      expect(text).toBeTruthy();
    });

    it('should render body variant correctly', () => {
      const { getByText } = renderText({ 
        variant: 'body',
        children: 'Body text' 
      });
      const text = getByText('Body text');
      expect(text).toBeTruthy();
    });

    it('should render caption variant correctly', () => {
      const { getByText } = renderText({ 
        variant: 'caption',
        children: 'Caption text' 
      });
      const text = getByText('Caption text');
      expect(text).toBeTruthy();
    });

    it('should render button variant correctly', () => {
      const { getByText } = renderText({ 
        variant: 'button',
        children: 'Button text' 
      });
      const text = getByText('Button text');
      expect(text).toBeTruthy();
    });
  });

  // Test different color variants
  describe('Color Variants', () => {
    it('should render primary color correctly', () => {
      const { getByText } = renderText({ 
        color: 'primary',
        children: 'Primary text' 
      });
      const text = getByText('Primary text');
      expect(text).toBeTruthy();
    });

    it('should render secondary color correctly', () => {
      const { getByText } = renderText({ 
        color: 'secondary',
        children: 'Secondary text' 
      });
      const text = getByText('Secondary text');
      expect(text).toBeTruthy();
    });

    it('should render accent color correctly', () => {
      const { getByText } = renderText({ 
        color: 'accent',
        children: 'Accent text' 
      });
      const text = getByText('Accent text');
      expect(text).toBeTruthy();
    });

    it('should render error color correctly', () => {
      const { getByText } = renderText({ 
        color: 'error',
        children: 'Error text' 
      });
      const text = getByText('Error text');
      expect(text).toBeTruthy();
    });

    it('should render success color correctly', () => {
      const { getByText } = renderText({ 
        color: 'success',
        children: 'Success text' 
      });
      const text = getByText('Success text');
      expect(text).toBeTruthy();
    });

    it('should render white color correctly', () => {
      const { getByText } = renderText({ 
        color: 'white',
        children: 'White text' 
      });
      const text = getByText('White text');
      expect(text).toBeTruthy();
    });
  });

  // Test text styling modifiers
  describe('Styling Modifiers', () => {
    it('should render centered text correctly', () => {
      const { getByText } = renderText({ 
        center: true,
        children: 'Centered text' 
      });
      const text = getByText('Centered text');
      expect(text).toBeTruthy();
    });

    it('should render bold text correctly', () => {
      const { getByText } = renderText({ 
        bold: true,
        children: 'Bold text' 
      });
      const text = getByText('Bold text');
      expect(text).toBeTruthy();
    });

    it('should render italic text correctly', () => {
      const { getByText } = renderText({ 
        italic: true,
        children: 'Italic text' 
      });
      const text = getByText('Italic text');
      expect(text).toBeTruthy();
    });

    it('should combine multiple modifiers correctly', () => {
      const { getByText } = renderText({ 
        center: true,
        bold: true,
        italic: true,
        children: 'Styled text' 
      });
      const text = getByText('Styled text');
      expect(text).toBeTruthy();
    });
  });

  // Test accessibility features
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByRole } = renderText();
      const text = getByRole('text');
      expect(text).toBeTruthy();
    });

    it('should be marked as accessible', () => {
      const { getByText } = renderText();
      const text = getByText('Test Text');
      expect(text.props.accessible).toBe(true);
    });

    it('should have text accessibility role', () => {
      const { getByText } = renderText();
      const text = getByText('Test Text');
      expect(text.props.accessibilityRole).toBe('text');
    });

    it('should be accessible with different variants', () => {
      const variants = ['h1', 'h2', 'h3', 'body', 'caption', 'button'] as const;
      
      variants.forEach(variant => {
        const { getByRole } = renderText({ 
          variant,
          children: `${variant} text` 
        });
        const text = getByRole('text');
        expect(text).toBeTruthy();
      });
    });
  });

  // Test custom styling
  describe('Custom Styling', () => {
    it('should apply custom styles', () => {
      const customStyle = { fontSize: 20, color: 'red' };
      const { getByText } = renderText({ 
        style: customStyle,
        children: 'Custom styled text' 
      });
      const text = getByText('Custom styled text');
      
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('should combine custom styles with variant styles', () => {
      const customStyle = { marginTop: 10 };
      const { getByText } = renderText({ 
        variant: 'h1',
        style: customStyle,
        children: 'Styled heading' 
      });
      const text = getByText('Styled heading');
      
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle empty string children', () => {
      const { getByText } = renderText({ children: '' });
      const text = getByText('');
      expect(text).toBeTruthy();
    });

    it('should handle number children', () => {
      const { getByText } = renderText({ children: 42 });
      const text = getByText('42');
      expect(text).toBeTruthy();
    });

    it('should handle very long text', () => {
      const longText = 'This is a very long text that might wrap to multiple lines and should be handled gracefully by the Text component without any issues or performance problems';
      const { getByText } = renderText({ children: longText });
      expect(getByText(longText)).toBeTruthy();
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const { getByText } = renderText({ children: specialText });
      expect(getByText(specialText)).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      const unicodeText = '🎨🎮🏆✨🌟';
      const { getByText } = renderText({ children: unicodeText });
      expect(getByText(unicodeText)).toBeTruthy();
    });
  });

  // Test component props forwarding
  describe('Props Forwarding', () => {
    it('should forward additional Text props', () => {
      const testID = 'test-text';
      const { getByTestId } = renderText({ testID });
      expect(getByTestId(testID)).toBeTruthy();
    });

    it('should forward numberOfLines prop', () => {
      const { getByText } = renderText({ 
        numberOfLines: 2,
        children: 'Multi-line text' 
      });
      const text = getByText('Multi-line text');
      expect(text.props.numberOfLines).toBe(2);
    });

    it('should forward ellipsizeMode prop', () => {
      const { getByText } = renderText({ 
        ellipsizeMode: 'tail',
        children: 'Ellipsized text' 
      });
      const text = getByText('Ellipsized text');
      expect(text.props.ellipsizeMode).toBe('tail');
    });

    it('should forward onPress prop', () => {
      const mockOnPress = jest.fn();
      const { getByText } = renderText({ 
        onPress: mockOnPress,
        children: 'Pressable text' 
      });
      const text = getByText('Pressable text');
      expect(text.props.onPress).toBe(mockOnPress);
    });
  });

  // Test variant and color combinations
  describe('Variant and Color Combinations', () => {
    it('should handle all variant and color combinations', () => {
      const variants = ['h1', 'h2', 'h3', 'body', 'caption', 'button'] as const;
      const colors = ['primary', 'secondary', 'accent', 'error', 'success', 'white'] as const;
      
      variants.forEach(variant => {
        colors.forEach(color => {
          const { getByText } = renderText({ 
            variant,
            color,
            children: `${variant} ${color}` 
          });
          expect(getByText(`${variant} ${color}`)).toBeTruthy();
        });
      });
    });
  });
});
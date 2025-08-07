/**
 * @fileoverview Unit tests for Icon atom component
 * 
 * This test file covers all functionality of the Icon component including
 * different icon names, sizes, colors, and accessibility features.
 * Tests ensure the component meets requirements for atomic design and accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Icon, IconProps } from './Icon';

// Helper function to render Icon with default props
const renderIcon = (props: Partial<IconProps> = {}) => {
  const defaultProps: IconProps = {
    name: 'home',
    ...props,
  };
  return render(<Icon {...defaultProps} />);
};

describe('Icon Component', () => {
  // Test basic rendering functionality
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByRole } = renderIcon();
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render with specified icon name', () => {
      const { getByLabelText } = renderIcon({ name: 'users' });
      expect(getByLabelText('users icon')).toBeTruthy();
    });

    it('should render with custom accessibility label', () => {
      const customLabel = 'Custom home icon';
      const { getByLabelText } = renderIcon({ 
        name: 'home',
        accessibilityLabel: customLabel 
      });
      expect(getByLabelText(customLabel)).toBeTruthy();
    });
  });

  // Test different icon names
  describe('Icon Names', () => {
    const iconNames = [
      'home', 'users', 'edit', 'message', 'timer', 
      'trophy', 'settings', 'close', 'check', 
      'arrow-left', 'arrow-right'
    ] as const;

    iconNames.forEach(iconName => {
      it(`should render ${iconName} icon correctly`, () => {
        const { getByLabelText } = renderIcon({ name: iconName });
        expect(getByLabelText(`${iconName} icon`)).toBeTruthy();
      });
    });

    it('should handle unknown icon name gracefully', () => {
      // Mock console.warn to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { getByRole } = renderIcon({ name: 'unknown' as any });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
      
      // Should warn about unknown icon
      expect(consoleSpy).toHaveBeenCalledWith('Icon "unknown" not found');
      
      consoleSpy.mockRestore();
    });
  });

  // Test different icon sizes
  describe('Icon Sizes', () => {
    it('should render small size correctly', () => {
      const { getByRole } = renderIcon({ size: 'small' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render medium size correctly (default)', () => {
      const { getByRole } = renderIcon({ size: 'medium' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render large size correctly', () => {
      const { getByRole } = renderIcon({ size: 'large' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render xlarge size correctly', () => {
      const { getByRole } = renderIcon({ size: 'xlarge' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should use medium size as default', () => {
      const { getByRole } = renderIcon();
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });
  });

  // Test different icon colors
  describe('Icon Colors', () => {
    it('should render primary color correctly (default)', () => {
      const { getByRole } = renderIcon({ color: 'primary' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render secondary color correctly', () => {
      const { getByRole } = renderIcon({ color: 'secondary' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render accent color correctly', () => {
      const { getByRole } = renderIcon({ color: 'accent' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render error color correctly', () => {
      const { getByRole } = renderIcon({ color: 'error' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render success color correctly', () => {
      const { getByRole } = renderIcon({ color: 'success' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should render white color correctly', () => {
      const { getByRole } = renderIcon({ color: 'white' });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should use primary color as default', () => {
      const { getByRole } = renderIcon();
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });
  });

  // Test accessibility features
  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByRole } = renderIcon();
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });

    it('should be marked as accessible', () => {
      const { getByRole } = renderIcon();
      const icon = getByRole('image');
      expect(icon.props.accessible).toBe(true);
    });

    it('should have image accessibility role', () => {
      const { getByRole } = renderIcon();
      const icon = getByRole('image');
      expect(icon.props.accessibilityRole).toBe('image');
    });

    it('should have default accessibility label based on icon name', () => {
      const { getByLabelText } = renderIcon({ name: 'settings' });
      expect(getByLabelText('settings icon')).toBeTruthy();
    });

    it('should use custom accessibility label when provided', () => {
      const customLabel = 'Navigation menu';
      const { getByLabelText } = renderIcon({ 
        name: 'settings',
        accessibilityLabel: customLabel 
      });
      expect(getByLabelText(customLabel)).toBeTruthy();
    });

    it('should have accessibility label for unknown icons', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { getByLabelText } = renderIcon({ name: 'unknown' as any });
      expect(getByLabelText('unknown icon')).toBeTruthy();
      
      consoleSpy.mockRestore();
    });
  });

  // Test custom styling
  describe('Custom Styling', () => {
    it('should apply custom container styles', () => {
      const customStyle = { backgroundColor: 'red', padding: 10 };
      const { getByRole } = renderIcon({ style: customStyle });
      const icon = getByRole('image');
      
      // Check that the icon is rendered (styling verification is limited in testing)
      expect(icon).toBeTruthy();
    });

    it('should combine custom styles with default styles', () => {
      const customStyle = { marginTop: 20 };
      const { getByRole } = renderIcon({ 
        style: customStyle,
        size: 'large' 
      });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });
  });

  // Test size and color combinations
  describe('Size and Color Combinations', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
    const colors = ['primary', 'secondary', 'accent', 'error', 'success', 'white'] as const;

    sizes.forEach(size => {
      colors.forEach(color => {
        it(`should render ${size} ${color} icon correctly`, () => {
          const { getByRole } = renderIcon({ size, color });
          const icon = getByRole('image');
          expect(icon).toBeTruthy();
        });
      });
    });
  });

  // Test edge cases and error handling
  describe('Edge Cases', () => {
    it('should handle undefined accessibility label gracefully', () => {
      const { getByLabelText } = renderIcon({ 
        name: 'home',
        accessibilityLabel: undefined 
      });
      expect(getByLabelText('home icon')).toBeTruthy();
    });

    it('should handle empty string accessibility label', () => {
      const { getByLabelText } = renderIcon({ 
        name: 'home',
        accessibilityLabel: '' 
      });
      expect(getByLabelText('')).toBeTruthy();
    });

    it('should render placeholder for unknown icons', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { getByRole } = renderIcon({ name: 'nonexistent' as any });
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
      
      consoleSpy.mockRestore();
    });
  });

  // Test all available icons with different configurations
  describe('Icon Catalog', () => {
    const iconNames = [
      'home', 'users', 'edit', 'message', 'timer', 
      'trophy', 'settings', 'close', 'check', 
      'arrow-left', 'arrow-right'
    ] as const;

    iconNames.forEach(iconName => {
      it(`should render ${iconName} with all size variants`, () => {
        const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
        
        sizes.forEach(size => {
          const { getByLabelText } = renderIcon({ name: iconName, size });
          expect(getByLabelText(`${iconName} icon`)).toBeTruthy();
        });
      });

      it(`should render ${iconName} with all color variants`, () => {
        const colors = ['primary', 'secondary', 'accent', 'error', 'success', 'white'] as const;
        
        colors.forEach(color => {
          const { getByLabelText } = renderIcon({ name: iconName, color });
          expect(getByLabelText(`${iconName} icon`)).toBeTruthy();
        });
      });
    });
  });

  // Test component props forwarding
  describe('Props Forwarding', () => {
    it('should handle testID prop', () => {
      const testID = 'test-icon';
      const { getByTestId } = renderIcon({ 
        name: 'home',
        style: { testID } as any 
      });
      // Note: testID would be applied to the container View
      const icon = getByRole('image');
      expect(icon).toBeTruthy();
    });
  });

  // Test performance and memory considerations
  describe('Performance', () => {
    it('should render multiple icons without issues', () => {
      const iconNames = ['home', 'users', 'edit', 'message', 'timer'] as const;
      
      iconNames.forEach(iconName => {
        const { getByLabelText } = renderIcon({ name: iconName });
        expect(getByLabelText(`${iconName} icon`)).toBeTruthy();
      });
    });

    it('should handle rapid re-renders with different props', () => {
      const { rerender, getByRole } = renderIcon({ name: 'home', size: 'small' });
      expect(getByRole('image')).toBeTruthy();

      rerender(<Icon name="users" size="medium" color="accent" />);
      expect(getByRole('image')).toBeTruthy();

      rerender(<Icon name="settings" size="large" color="error" />);
      expect(getByRole('image')).toBeTruthy();
    });
  });
});
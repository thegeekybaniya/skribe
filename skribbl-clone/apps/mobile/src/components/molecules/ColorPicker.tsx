/**
 * @fileoverview ColorPicker molecule component for drawing tool color selection
 * 
 * This component combines atoms (Button, Icon) to create a color selection
 * interface for drawing tools. It provides a grid of color options with
 * visual feedback for the selected color and proper accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../atoms/Text';

// Define available drawing colors
export const DRAWING_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Gray', value: '#808080' },
  { name: 'Cyan', value: '#00FFFF' },
] as const;

// Color option type
export interface ColorOption {
  name: string;
  value: string;
}

// Props interface for the ColorPicker component
export interface ColorPickerProps {
  /** Currently selected color value */
  selectedColor: string;
  /** Function called when a color is selected */
  onColorSelect: (color: string) => void;
  /** Custom color options (defaults to DRAWING_COLORS) */
  colors?: ColorOption[];
  /** Number of columns in the color grid */
  columns?: number;
  /** Size of each color swatch */
  swatchSize?: number;
  /** Whether the color picker is disabled */
  disabled?: boolean;
  /** Custom styles for the container */
  style?: ViewStyle;
  /** Label for the color picker */
  label?: string;
}

/**
 * ColorPicker component - A grid of color options for drawing tool selection
 * 
 * This is a molecule component that combines TouchableOpacity and styling
 * to create an interactive color selection interface. It provides visual
 * feedback for the selected color and includes proper accessibility features.
 * 
 * @param props - Color selection configuration and event handlers
 * @returns JSX element representing a color picker grid
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  colors = DRAWING_COLORS,
  columns = 4,
  swatchSize = 40,
  disabled = false,
  style,
  label = 'Select drawing color',
}) => {
  // Handle color selection
  const handleColorSelect = (color: string) => {
    if (!disabled) {
      onColorSelect(color);
    }
  };

  // Get accessibility label for a color swatch
  const getColorAccessibilityLabel = (colorOption: ColorOption, isSelected: boolean) => {
    const selectedText = isSelected ? ', selected' : '';
    return `${colorOption.name} color${selectedText}`;
  };

  // Create color swatch component
  const renderColorSwatch = (colorOption: ColorOption, index: number) => {
    const isSelected = selectedColor === colorOption.value;
    const isWhite = colorOption.value === '#FFFFFF';
    
    const swatchStyle = [
      styles.colorSwatch,
      {
        width: swatchSize,
        height: swatchSize,
        backgroundColor: colorOption.value,
      },
      isSelected && styles.selectedSwatch,
      isWhite && styles.whiteSwatch,
      disabled && styles.disabledSwatch,
    ];

    return (
      <TouchableOpacity
        key={`${colorOption.value}-${index}`}
        style={swatchStyle}
        onPress={() => handleColorSelect(colorOption.value)}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getColorAccessibilityLabel(colorOption, isSelected)}
        accessibilityHint={disabled ? 'Color picker is disabled' : 'Tap to select this color'}
        accessibilityState={{
          selected: isSelected,
          disabled: disabled,
        }}
      >
        {/* Selection indicator for selected color */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <View 
              style={[
                styles.selectionDot,
                { backgroundColor: isWhite ? '#000000' : '#FFFFFF' }
              ]} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate grid layout
  const rows = Math.ceil(colors.length / columns);
  const colorGrid = [];
  
  for (let row = 0; row < rows; row++) {
    const rowColors = colors.slice(row * columns, (row + 1) * columns);
    colorGrid.push(
      <View key={`row-${row}`} style={styles.colorRow}>
        {rowColors.map((color, index) => 
          renderColorSwatch(color, row * columns + index)
        )}
        {/* Fill empty spaces in the last row */}
        {rowColors.length < columns && 
          Array.from({ length: columns - rowColors.length }).map((_, index) => (
            <View 
              key={`empty-${index}`} 
              style={[styles.emptySwatch, { width: swatchSize, height: swatchSize }]} 
            />
          ))
        }
      </View>
    );
  }

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="group"
      accessibilityLabel={label}
    >
      {/* Label for the color picker */}
      {label && (
        <Text 
          variant="body" 
          color="primary"
          style={styles.label}
        >
          {label}
        </Text>
      )}

      {/* Selected color display */}
      <View style={styles.selectedColorContainer}>
        <Text 
          variant="caption" 
          color="secondary"
          style={styles.selectedColorLabel}
        >
          Selected:
        </Text>
        <View 
          style={[
            styles.selectedColorDisplay,
            { backgroundColor: selectedColor },
            selectedColor === '#FFFFFF' && styles.whiteColorDisplay,
          ]}
          accessible={true}
          accessibilityLabel={`Currently selected color: ${colors.find(c => c.value === selectedColor)?.name || 'Unknown'}`}
        />
      </View>

      {/* Color grid */}
      <View style={styles.colorGrid}>
        {colorGrid}
      </View>
    </View>
  );
};

// Design system colors and spacing
const colors = {
  border: '#E5E5EA',
  selectedBorder: '#007AFF',
  whiteBorder: '#C7C7CC',
  disabledOverlay: 'rgba(0, 0, 0, 0.3)',
  background: '#FFFFFF',
  shadow: '#000000',
};

// Styles for the ColorPicker component following the design system
const styles = StyleSheet.create({
  // Main container for the color picker
  container: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Label text styling
  label: {
    marginBottom: 12,
    fontWeight: '500',
  },

  // Selected color display container
  selectedColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Selected color label
  selectedColorLabel: {
    marginRight: 8,
  },

  // Selected color display swatch
  selectedColorDisplay: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.selectedBorder,
  },

  // White color display needs a border
  whiteColorDisplay: {
    borderColor: colors.whiteBorder,
  },

  // Color grid container
  colorGrid: {
    alignItems: 'center',
  },

  // Row of colors in the grid
  colorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  // Individual color swatch
  colorSwatch: {
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 2,
  },

  // Selected color swatch styling
  selectedSwatch: {
    borderColor: colors.selectedBorder,
    borderWidth: 3,
    // Enhanced shadow for selected state
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // White color swatch needs a visible border
  whiteSwatch: {
    borderColor: colors.whiteBorder,
  },

  // Disabled color swatch styling
  disabledSwatch: {
    opacity: 0.5,
  },

  // Selection indicator container
  selectionIndicator: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Selection dot inside selected swatch
  selectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty swatch for grid alignment
  emptySwatch: {
    marginHorizontal: 4,
  },
});
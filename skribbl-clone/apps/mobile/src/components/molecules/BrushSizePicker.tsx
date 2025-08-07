/**
 * @fileoverview BrushSizePicker molecule component for drawing tool size selection
 * 
 * This component combines atoms (Button, Text) to create a brush size selection
 * interface for drawing tools. It provides visual size indicators with
 * proper accessibility and responsive feedback.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../atoms/Text';

// Define available brush sizes
export const BRUSH_SIZES = [
  { name: 'Extra Small', value: 2, displaySize: 8 },
  { name: 'Small', value: 4, displaySize: 12 },
  { name: 'Medium', value: 8, displaySize: 16 },
  { name: 'Large', value: 12, displaySize: 20 },
  { name: 'Extra Large', value: 16, displaySize: 24 },
] as const;

// Brush size option type
export interface BrushSizeOption {
  name: string;
  value: number;
  displaySize: number;
}

// Props interface for the BrushSizePicker component
export interface BrushSizePickerProps {
  /** Currently selected brush size value */
  selectedSize: number;
  /** Function called when a brush size is selected */
  onSizeSelect: (size: number) => void;
  /** Custom brush size options (defaults to BRUSH_SIZES) */
  sizes?: BrushSizeOption[];
  /** Whether to display sizes horizontally or vertically */
  orientation?: 'horizontal' | 'vertical';
  /** Whether the brush size picker is disabled */
  disabled?: boolean;
  /** Custom styles for the container */
  style?: ViewStyle;
  /** Label for the brush size picker */
  label?: string;
  /** Whether to show size labels */
  showLabels?: boolean;
}

/**
 * BrushSizePicker component - A selection interface for drawing brush sizes
 * 
 * This is a molecule component that combines TouchableOpacity, Text, and View
 * atoms to create an interactive brush size selection interface. It provides
 * visual size indicators and includes proper accessibility features.
 * 
 * @param props - Brush size selection configuration and event handlers
 * @returns JSX element representing a brush size picker
 */
export const BrushSizePicker: React.FC<BrushSizePickerProps> = ({
  selectedSize,
  onSizeSelect,
  sizes = BRUSH_SIZES,
  orientation = 'horizontal',
  disabled = false,
  style,
  label = 'Select brush size',
  showLabels = true,
}) => {
  // Handle size selection
  const handleSizeSelect = (size: number) => {
    if (!disabled) {
      onSizeSelect(size);
    }
  };

  // Get accessibility label for a size option
  const getSizeAccessibilityLabel = (sizeOption: BrushSizeOption, isSelected: boolean) => {
    const selectedText = isSelected ? ', selected' : '';
    return `${sizeOption.name} brush size, ${sizeOption.value} pixels${selectedText}`;
  };

  // Create size option component
  const renderSizeOption = (sizeOption: BrushSizeOption, index: number) => {
    const isSelected = selectedSize === sizeOption.value;
    
    const optionStyle = [
      styles.sizeOption,
      orientation === 'vertical' && styles.verticalSizeOption,
      isSelected && styles.selectedSizeOption,
      disabled && styles.disabledSizeOption,
    ];

    const indicatorStyle = [
      styles.sizeIndicator,
      {
        width: sizeOption.displaySize,
        height: sizeOption.displaySize,
        borderRadius: sizeOption.displaySize / 2,
      },
      isSelected && styles.selectedIndicator,
      disabled && styles.disabledIndicator,
    ];

    return (
      <TouchableOpacity
        key={`${sizeOption.value}-${index}`}
        style={optionStyle}
        onPress={() => handleSizeSelect(sizeOption.value)}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getSizeAccessibilityLabel(sizeOption, isSelected)}
        accessibilityHint={disabled ? 'Brush size picker is disabled' : 'Tap to select this brush size'}
        accessibilityState={{
          selected: isSelected,
          disabled: disabled,
        }}
      >
        {/* Visual size indicator */}
        <View style={styles.indicatorContainer}>
          <View style={indicatorStyle} />
        </View>

        {/* Size label */}
        {showLabels && (
          <Text 
            variant="caption" 
            color={isSelected ? 'accent' : 'secondary'}
            center
            style={styles.sizeLabel}
          >
            {sizeOption.name}
          </Text>
        )}

        {/* Size value for screen readers */}
        <Text 
          variant="caption" 
          color="secondary"
          center
          style={styles.sizeValue}
          accessible={false} // Hidden from screen readers as it's included in accessibility label
        >
          {sizeOption.value}px
        </Text>
      </TouchableOpacity>
    );
  };

  // Get container styles based on orientation
  const containerStyle = [
    styles.container,
    orientation === 'vertical' && styles.verticalContainer,
    style,
  ];

  const optionsContainerStyle = [
    styles.optionsContainer,
    orientation === 'vertical' && styles.verticalOptionsContainer,
  ];

  return (
    <View 
      style={containerStyle}
      accessible={true}
      accessibilityRole="group"
      accessibilityLabel={label}
    >
      {/* Label for the brush size picker */}
      {label && (
        <Text 
          variant="body" 
          color="primary"
          style={styles.label}
        >
          {label}
        </Text>
      )}

      {/* Selected size display */}
      <View style={styles.selectedSizeContainer}>
        <Text 
          variant="caption" 
          color="secondary"
          style={styles.selectedSizeLabel}
        >
          Selected: {sizes.find(s => s.value === selectedSize)?.name || 'Unknown'} ({selectedSize}px)
        </Text>
        <View 
          style={[
            styles.selectedSizeDisplay,
            {
              width: Math.max(16, selectedSize),
              height: Math.max(16, selectedSize),
              borderRadius: Math.max(8, selectedSize / 2),
            },
          ]}
          accessible={true}
          accessibilityLabel={`Currently selected brush size: ${selectedSize} pixels`}
        />
      </View>

      {/* Size options */}
      <View style={optionsContainerStyle}>
        {sizes.map((size, index) => renderSizeOption(size, index))}
      </View>
    </View>
  );
};

// Design system colors and spacing
const colors = {
  border: '#E5E5EA',
  selectedBorder: '#007AFF',
  background: '#FFFFFF',
  indicator: '#000000',
  selectedIndicator: '#007AFF',
  disabledIndicator: '#C7C7CC',
  shadow: '#000000',
};

// Styles for the BrushSizePicker component following the design system
const styles = StyleSheet.create({
  // Main container for the brush size picker
  container: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Vertical container layout
  verticalContainer: {
    alignItems: 'center',
  },

  // Label text styling
  label: {
    marginBottom: 12,
    fontWeight: '500',
  },

  // Selected size display container
  selectedSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  // Selected size label
  selectedSizeLabel: {
    flex: 1,
  },

  // Selected size display indicator
  selectedSizeDisplay: {
    backgroundColor: colors.selectedIndicator,
    marginLeft: 8,
    minWidth: 16,
    minHeight: 16,
  },

  // Options container
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  // Vertical options container
  verticalOptionsContainer: {
    flexDirection: 'column',
  },

  // Individual size option
  sizeOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 60,
    minHeight: 60,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 1,
  },

  // Vertical size option layout
  verticalSizeOption: {
    marginVertical: 4,
    marginHorizontal: 0,
    minWidth: 80,
  },

  // Selected size option styling
  selectedSizeOption: {
    borderColor: colors.selectedBorder,
    backgroundColor: '#F0F8FF',
    // Enhanced shadow for selected state
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Disabled size option styling
  disabledSizeOption: {
    opacity: 0.5,
  },

  // Container for the size indicator dot
  indicatorContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  // Visual size indicator dot
  sizeIndicator: {
    backgroundColor: colors.indicator,
  },

  // Selected indicator styling
  selectedIndicator: {
    backgroundColor: colors.selectedIndicator,
  },

  // Disabled indicator styling
  disabledIndicator: {
    backgroundColor: colors.disabledIndicator,
  },

  // Size label text
  sizeLabel: {
    marginBottom: 2,
    fontSize: 10,
  },

  // Size value text
  sizeValue: {
    fontSize: 9,
    opacity: 0.7,
  },
});
/**
 * @fileoverview DrawingCanvas organism component with touch handling and real-time updates
 * 
 * This component provides an interactive drawing canvas that supports touch gestures
 * for drawing strokes. It integrates with the DrawingStore for state management and
 * handles real-time drawing synchronization with other players through Socket.IO.
 * Only the current drawer can interact with the canvas, while others view in read-only mode.
 * 
 * Requirements covered: 2.1, 2.2, 2.3, 2.4, 2.5 (real-time drawing system)
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../contexts/StoreContext';
import { DrawingData } from '@skribbl-clone/types';
import { Text } from '../atoms/Text';
import { Button } from '../atoms/Button';

// Get screen dimensions for canvas sizing
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Props interface for the DrawingCanvas component
export interface DrawingCanvasProps {
  /** Custom styles for the canvas container */
  style?: ViewStyle;
  /** Whether the canvas is in read-only mode (for non-drawers) */
  readOnly?: boolean;
  /** Callback when drawing data is created */
  onDrawingData?: (data: DrawingData) => void;
}

/**
 * DrawingCanvas component - Interactive canvas for real-time collaborative drawing
 * 
 * This organism component combines touch gesture handling with real-time drawing
 * capabilities. It uses React Native Skia for high-performance canvas rendering
 * and integrates with MobX stores for state management. The component handles
 * both drawing input (for the current drawer) and display of remote drawing data.
 * 
 * @param props - Canvas configuration and event handlers
 * @returns JSX element representing an interactive drawing canvas
 */
export const DrawingCanvas: React.FC<DrawingCanvasProps> = observer(({
  style,
  readOnly = false,
  onDrawingData,
}) => {
  const { drawingStore, gameStore, playerStore } = useStores();
  const [currentPath, setCurrentPath] = useState<string>('');
  const isDrawingRef = useRef(false);

  // Check if current player can draw
  const canDraw = !readOnly && playerStore.currentPlayer?.isDrawing && gameStore.isPlaying;

  /**
   * Create SVG path string from points
   */
  const createPathString = useCallback((points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    return path;
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((x: number, y: number) => {
    if (!canDraw) return;

    isDrawingRef.current = true;
    const pathString = `M${x},${y}`;
    setCurrentPath(pathString);

    // Create drawing data for real-time sync
    const drawingData: DrawingData = {
      x,
      y,
      color: drawingStore.currentColor,
      brushSize: drawingStore.currentBrushSize,
      isDrawing: true,
      timestamp: Date.now(),
    };

    // Update local store and notify parent
    drawingStore.addStroke(drawingData);
    onDrawingData?.(drawingData);
  }, [canDraw, drawingStore, onDrawingData]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((x: number, y: number) => {
    if (!canDraw || !isDrawingRef.current) return;

    setCurrentPath(prev => `${prev} L${x},${y}`);

    // Create drawing data for real-time sync
    const drawingData: DrawingData = {
      x,
      y,
      color: drawingStore.currentColor,
      brushSize: drawingStore.currentBrushSize,
      isDrawing: true,
      timestamp: Date.now(),
    };

    // Update local store and notify parent
    drawingStore.addStroke(drawingData);
    onDrawingData?.(drawingData);
  }, [canDraw, drawingStore, onDrawingData]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(() => {
    if (!canDraw || !isDrawingRef.current) return;

    isDrawingRef.current = false;

    // Finalize the current path
    if (currentPath) {
      drawingStore.finalizePath(currentPath);
      setCurrentPath('');
    }

    // Send end drawing signal
    const drawingData: DrawingData = {
      x: 0,
      y: 0,
      color: drawingStore.currentColor,
      brushSize: drawingStore.currentBrushSize,
      isDrawing: false,
      timestamp: Date.now(),
    };

    onDrawingData?.(drawingData);
  }, [canDraw, drawingStore, onDrawingData, currentPath]);

  /**
   * Create PanResponder for touch handling
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canDraw,
      onMoveShouldSetPanResponder: () => canDraw,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        handleTouchStart(locationX, locationY);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        handleTouchMove(locationX, locationY);
      },
      onPanResponderRelease: () => {
        handleTouchEnd();
      },
    })
  ).current;

  /**
   * Clear the entire canvas
   * Only available to the current drawer
   */
  const handleClearCanvas = useCallback(() => {
    if (!canDraw) return;
    
    drawingStore.clearCanvas();
    // Notify other players about canvas clear
    onDrawingData?.({
      x: 0,
      y: 0,
      color: '#000000',
      brushSize: 1,
      isDrawing: false,
      timestamp: Date.now(),
    });
  }, [canDraw, drawingStore, onDrawingData]);

  /**
   * Render all drawing paths on the canvas
   * This includes both local and remote drawing data
   */
  const renderPaths = useCallback(() => {
    return drawingStore.paths.map((pathData, index) => (
      <Path
        key={`path-${index}`}
        d={pathData.path}
        stroke={pathData.color}
        strokeWidth={pathData.brushSize}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ));
  }, [drawingStore.paths]);

  // Effect to handle incoming drawing data from other players
  useEffect(() => {
    // This would be connected to Socket.IO events in a real implementation
    // For now, we just observe the drawing store
  }, []);

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={canDraw ? "Drawing canvas - you can draw here" : "Drawing canvas - view only"}
    >
      {/* Canvas header with status and controls */}
      <View style={styles.header}>
        <Text variant="body" color="secondary">
          {canDraw ? "Your turn to draw!" : "Watch the drawing"}
        </Text>
        
        {canDraw && (
          <Button
            title="Clear"
            variant="secondary"
            onPress={handleClearCanvas}
            style={styles.clearButton}
          />
        )}
      </View>

      {/* Main drawing canvas */}
      <View style={styles.canvasContainer}>
        <View
          style={styles.canvas}
          {...panResponder.panHandlers}
        >
          <Svg
            width="100%"
            height="100%"
            style={styles.svgCanvas}
          >
            {renderPaths()}
            
            {/* Current drawing path */}
            {isDrawingRef.current && currentPath && (
              <Path
                d={currentPath}
                stroke={drawingStore.currentColor}
                strokeWidth={drawingStore.currentBrushSize}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        </View>

        {/* Overlay for read-only mode */}
        {!canDraw && (
          <View style={styles.readOnlyOverlay}>
            <Text variant="caption" color="secondary">
              {gameStore.currentDrawer ? 
                `${gameStore.currentDrawer.name} is drawing` : 
                "Waiting for drawer"
              }
            </Text>
          </View>
        )}
      </View>

      {/* Canvas footer with drawing info */}
      <View style={styles.footer}>
        <Text variant="caption" color="secondary">
          Brush: {drawingStore.currentBrushSize}px • Color: {drawingStore.currentColor}
        </Text>
      </View>
    </View>
  );
});

// Design system colors
const colors = {
  background: '#FFFFFF',
  border: '#E5E5EA',
  overlay: 'rgba(0, 0, 0, 0.1)',
  shadow: '#000000',
};

// Styles for the DrawingCanvas component
const styles = StyleSheet.create({
  // Main container for the entire canvas component
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },

  // Header with status and controls
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Clear button styling
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },

  // Container for the actual canvas
  canvasContainer: {
    position: 'relative',
    aspectRatio: 4/3, // 4:3 aspect ratio for the drawing area
    backgroundColor: colors.background,
  },

  // The canvas element
  canvas: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // SVG canvas styling
  svgCanvas: {
    backgroundColor: colors.background,
  },

  // Overlay shown when canvas is read-only
  readOnlyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },

  // Footer with drawing information
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
});
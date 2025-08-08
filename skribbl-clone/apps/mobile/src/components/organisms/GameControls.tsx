/**
 * @fileoverview GameControls organism component with drawing tools and game actions
 * 
 * This component provides a comprehensive set of controls for the drawing game,
 * including drawing tools (color picker, brush size), game actions (clear canvas,
 * leave game), and game state controls (start game, ready up). It integrates
 * with multiple stores and provides different interfaces based on player role and game state.
 * 
 * Requirements covered: 2.1, 2.2, 2.3, 2.4, 2.5 (drawing tools and controls)
 * Requirements covered: 4.1, 4.2, 4.3, 4.4, 4.5 (game flow controls)
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Modal,
  Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../contexts/StoreContext';
import { ColorPicker } from '../molecules/ColorPicker';
import { BrushSizePicker } from '../molecules/BrushSizePicker';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';

// Props interface for the GameControls component
export interface GameControlsProps {
  /** Custom styles for the controls container */
  style?: ViewStyle;
  /** Whether to show drawing tools */
  showDrawingTools?: boolean;
  /** Whether to show game controls */
  showGameControls?: boolean;
  /** Whether to show compact layout */
  compact?: boolean;
  /** Callback when clear canvas is requested */
  onClearCanvas?: () => void;
  /** Callback when leave game is requested */
  onLeaveGame?: () => void;
  /** Callback when start game is requested */
  onStartGame?: () => void;
}

/**
 * GameControls component - Comprehensive game control interface
 * 
 * This organism component combines ColorPicker and BrushSizePicker molecules
 * with Button atoms to create a complete game control system. It provides
 * different interfaces based on the current game state and player role,
 * including drawing tools for drawers and game management controls for hosts.
 * 
 * @param props - Controls configuration and event handlers
 * @returns JSX element representing complete game controls
 */
export const GameControls: React.FC<GameControlsProps> = observer(({
  style,
  showDrawingTools = true,
  showGameControls = true,
  compact = false,
  onClearCanvas,
  onLeaveGame,
  onStartGame,
}) => {
  const { drawingStore, gameStore, playerStore, roomStore } = useStores();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushPicker, setShowBrushPicker] = useState(false);

  // Check player permissions and game state
  const isDrawing = playerStore.currentPlayer?.isDrawing;
  const isHost = playerStore.currentPlayer?.id === roomStore.hostId;
  const canStartGame = isHost && !gameStore.isPlaying && roomStore.players.length >= 2;
  const canUseDrawingTools = isDrawing && gameStore.isPlaying;

  /**
   * Handle color selection from color picker
   */
  const handleColorSelect = useCallback((color: string) => {
    drawingStore.setCurrentColor(color);
    setShowColorPicker(false);
  }, [drawingStore]);

  /**
   * Handle brush size selection
   */
  const handleBrushSizeSelect = useCallback((size: number) => {
    drawingStore.setCurrentBrushSize(size);
    setShowBrushPicker(false);
  }, [drawingStore]);

  /**
   * Handle clear canvas with confirmation
   */
  const handleClearCanvas = useCallback(() => {
    if (!canUseDrawingTools) return;

    Alert.alert(
      'Clear Canvas',
      'Are you sure you want to clear the entire canvas? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            drawingStore.clearCanvas();
            onClearCanvas?.();
          },
        },
      ]
    );
  }, [canUseDrawingTools, drawingStore, onClearCanvas]);

  /**
   * Handle leave game with confirmation
   */
  const handleLeaveGame = useCallback(() => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave the game? Your progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            onLeaveGame?.();
          },
        },
      ]
    );
  }, [onLeaveGame]);

  /**
   * Handle start game
   */
  const handleStartGame = useCallback(() => {
    if (!canStartGame) return;
    onStartGame?.();
  }, [canStartGame, onStartGame]);

  /**
   * Get current tool status text
   */
  const getToolStatusText = useCallback((): string => {
    if (!gameStore.isPlaying) return 'Game not started';
    if (!isDrawing) return 'Waiting for your turn';
    return 'Your turn to draw!';
  }, [gameStore.isPlaying, isDrawing]);

  return (
    <View 
      style={[styles.container, compact && styles.compactContainer, style]}
      accessible={true}
      accessibilityRole="toolbar"
      accessibilityLabel="Game controls"
    >
      {/* Drawing Tools Section */}
      {showDrawingTools && (
        <View style={styles.section}>
          <Text variant="subtitle" color="primary" style={styles.sectionTitle}>
            Drawing Tools
          </Text>
          
          <Text variant="caption" color="secondary" style={styles.statusText}>
            {getToolStatusText()}
          </Text>

          <View style={[styles.toolsRow, compact && styles.compactToolsRow]}>
            {/* Color Picker Button */}
            <Button
              title=""
              variant={canUseDrawingTools ? 'primary' : 'disabled'}
              disabled={!canUseDrawingTools}
              onPress={() => setShowColorPicker(true)}
              style={[
                styles.toolButton,
                { backgroundColor: drawingStore.currentColor },
                !canUseDrawingTools && styles.disabledToolButton,
              ]}
              accessible={true}
              accessibilityLabel={`Current color: ${drawingStore.currentColor}`}
              accessibilityHint="Tap to change drawing color"
            />

            {/* Brush Size Button */}
            <Button
              title={`${drawingStore.currentBrushSize}px`}
              variant={canUseDrawingTools ? 'secondary' : 'disabled'}
              disabled={!canUseDrawingTools}
              onPress={() => setShowBrushPicker(true)}
              style={styles.toolButton}
              accessible={true}
              accessibilityLabel={`Current brush size: ${drawingStore.currentBrushSize} pixels`}
              accessibilityHint="Tap to change brush size"
            />

            {/* Clear Canvas Button */}
            <Button
              title="Clear"
              variant={canUseDrawingTools ? 'secondary' : 'disabled'}
              disabled={!canUseDrawingTools}
              onPress={handleClearCanvas}
              style={styles.toolButton}
              accessible={true}
              accessibilityLabel="Clear canvas"
              accessibilityHint="Tap to clear the entire drawing"
            />
          </View>
        </View>
      )}

      {/* Game Controls Section */}
      {showGameControls && (
        <View style={styles.section}>
          <Text variant="subtitle" color="primary" style={styles.sectionTitle}>
            Game Controls
          </Text>

          <View style={[styles.controlsRow, compact && styles.compactControlsRow]}>
            {/* Start Game Button (Host Only) */}
            {isHost && !gameStore.isPlaying && (
              <Button
                title="Start Game"
                variant={canStartGame ? 'primary' : 'disabled'}
                disabled={!canStartGame}
                onPress={handleStartGame}
                style={styles.controlButton}
                accessible={true}
                accessibilityLabel="Start game"
                accessibilityHint={canStartGame ? 
                  'Tap to start the game' : 
                  'Need at least 2 players to start'
                }
              />
            )}

            {/* Game Status Info */}
            {gameStore.isPlaying && (
              <View style={styles.gameInfo}>
                <Text variant="body" color="secondary">
                  Round {gameStore.currentRound}/{gameStore.maxRounds}
                </Text>
                {gameStore.currentDrawer && (
                  <Text variant="caption" color="accent">
                    {gameStore.currentDrawer.name} is drawing
                  </Text>
                )}
              </View>
            )}

            {/* Leave Game Button */}
            <Button
              title="Leave"
              variant="secondary"
              onPress={handleLeaveGame}
              style={styles.controlButton}
              accessible={true}
              accessibilityLabel="Leave game"
              accessibilityHint="Tap to leave the current game"
            />
          </View>
        </View>
      )}

      {/* Player Status Section */}
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Icon 
            name={playerStore.currentPlayer?.isConnected ? 'check' : 'close'} 
            size="small" 
            color={playerStore.currentPlayer?.isConnected ? 'success' : 'error'} 
          />
          <Text variant="caption" color="secondary" style={styles.statusLabel}>
            {playerStore.currentPlayer?.isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Icon name="users" size="small" color="secondary" />
          <Text variant="caption" color="secondary" style={styles.statusLabel}>
            {roomStore.players.length}/{roomStore.maxPlayers} players
          </Text>
        </View>
      </View>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="subtitle" color="primary" style={styles.modalTitle}>
              Choose Color
            </Text>
            
            <ColorPicker
              selectedColor={drawingStore.currentColor}
              onColorSelect={handleColorSelect}
              style={styles.colorPicker}
            />
            
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowColorPicker(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Brush Size Picker Modal */}
      <Modal
        visible={showBrushPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBrushPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="subtitle" color="primary" style={styles.modalTitle}>
              Choose Brush Size
            </Text>
            
            <BrushSizePicker
              selectedSize={drawingStore.currentBrushSize}
              onSizeSelect={handleBrushSizeSelect}
              style={styles.brushPicker}
            />
            
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowBrushPicker(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
});

// Design system colors
const colors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  border: '#E5E5EA',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#C7C7CC',
};

// Styles for the GameControls component
const styles = StyleSheet.create({
  // Main container for all controls
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
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

  // Compact container layout
  compactContainer: {
    padding: 12,
  },

  // Section container
  section: {
    marginBottom: 16,
  },

  // Section title
  sectionTitle: {
    marginBottom: 8,
  },

  // Status text
  statusText: {
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Tools row layout
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 12,
  },

  // Compact tools row
  compactToolsRow: {
    gap: 8,
  },

  // Individual tool button
  toolButton: {
    flex: 1,
    minWidth: 60,
    minHeight: 44,
  },

  // Disabled tool button
  disabledToolButton: {
    backgroundColor: colors.disabled,
  },

  // Controls row layout
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  // Compact controls row
  compactControlsRow: {
    flexDirection: 'column',
    gap: 8,
  },

  // Individual control button
  controlButton: {
    flex: 1,
    minWidth: 80,
  },

  // Game info container
  gameInfo: {
    flex: 1,
    alignItems: 'center',
  },

  // Status section
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Status label
  statusLabel: {
    marginLeft: 6,
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal content container
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
    alignItems: 'center',
  },

  // Modal title
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },

  // Color picker in modal
  colorPicker: {
    marginBottom: 16,
  },

  // Brush picker in modal
  brushPicker: {
    marginBottom: 16,
  },

  // Modal button
  modalButton: {
    minWidth: 100,
  },
});
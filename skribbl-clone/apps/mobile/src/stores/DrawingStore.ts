/**
 * @fileoverview Drawing store for managing canvas state and drawing tools
 * Handles drawing data, tool settings, and real-time drawing updates
 * Requirements: 6.7 - MobX for reactive state management
 */

import { makeAutoObservable } from 'mobx';
import { DrawingData } from '@skribbl-clone/types';
import type { RootStore } from './RootStore';

/**
 * DrawingStore manages the drawing canvas state and tool settings
 * This includes brush settings, colors, canvas history, and drawing data
 */
export class DrawingStore {
  // Current brush color (hex color string)
  brushColor: string = '#000000';
  
  // Current brush size (1-20 pixels)
  brushSize: number = 5;
  
  // Available colors for the color picker
  availableColors: string[] = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
  ];
  
  // Available brush sizes
  availableBrushSizes: number[] = [2, 5, 10, 15, 20];
  
  // Current drawing data being processed
  currentDrawingData: DrawingData[] = [];
  
  // Whether the canvas is currently being cleared
  isClearing: boolean = false;
  
  // Whether drawing tools are enabled (only for current drawer)
  isDrawingEnabled: boolean = false;

  constructor(private rootStore: RootStore) {
    // Make this store observable so React components can react to changes
    makeAutoObservable(this);
  }

  /**
   * Set the current brush color
   * Called when user selects a color from the color picker
   */
  setBrushColor(color: string) {
    this.brushColor = color;
  }

  /**
   * Set the current brush size
   * Called when user selects a brush size
   */
  setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(20, size)); // Clamp between 1-20
  }

  /**
   * Add new drawing data to the current stroke
   * Called when receiving drawing data from touch events
   */
  addDrawingData(drawingData: DrawingData) {
    this.currentDrawingData.push(drawingData);
  }

  /**
   * Clear all drawing data and reset canvas
   * Called when starting a new round or clearing canvas
   */
  clearCanvas() {
    this.isClearing = true;
    this.currentDrawingData = [];
    
    // Reset clearing flag after a brief delay
    setTimeout(() => {
      this.isClearing = false;
    }, 100);
  }

  /**
   * Enable or disable drawing tools
   * Called when it's the player's turn to draw or not
   */
  setDrawingEnabled(enabled: boolean) {
    this.isDrawingEnabled = enabled;
  }

  /**
   * Process incoming drawing data from other players
   * Called when receiving real-time drawing updates via Socket.IO
   */
  processIncomingDrawingData(drawingData: DrawingData) {
    // Only process if it's not from the current player
    if (!this.rootStore.gameStore.isCurrentPlayerDrawing) {
      this.addDrawingData(drawingData);
    }
  }

  /**
   * Create drawing data object from touch coordinates
   * Used when processing touch events on the canvas
   */
  createDrawingData(x: number, y: number, prevX?: number, prevY?: number, isDrawing: boolean = true): DrawingData {
    return {
      x,
      y,
      prevX,
      prevY,
      color: this.brushColor,
      brushSize: this.brushSize,
      isDrawing,
      timestamp: Date.now(),
    };
  }

  /**
   * Get the current brush settings as an object
   * Used for displaying current tool settings
   */
  get currentBrushSettings() {
    return {
      color: this.brushColor,
      size: this.brushSize,
    };
  }

  /**
   * Check if the current color is a light color
   * Used for determining text color on color picker buttons
   */
  get isCurrentColorLight(): boolean {
    const hex = this.brushColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness using standard formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }

  /**
   * Get the number of drawing strokes currently on canvas
   * Used for performance monitoring
   */
  get strokeCount(): number {
    return this.currentDrawingData.length;
  }

  /**
   * Reset the drawing store to initial state
   * Called when leaving a game or starting fresh
   */
  reset() {
    this.brushColor = '#000000';
    this.brushSize = 5;
    this.currentDrawingData = [];
    this.isClearing = false;
    this.isDrawingEnabled = false;
  }
}
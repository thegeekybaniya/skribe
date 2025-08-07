/**
 * @fileoverview Unit tests for DrawingStore
 * Tests drawing canvas state, tool settings, and drawing data management
 * Requirements: 6.7 - MobX for reactive state management
 */

import { DrawingStore } from './DrawingStore';
import { RootStore } from './RootStore';
import { DrawingData } from '@skribbl-clone/types';

describe('DrawingStore', () => {
  let drawingStore: DrawingStore;
  let rootStore: RootStore;

  beforeEach(() => {
    rootStore = new RootStore();
    drawingStore = rootStore.drawingStore;
  });

  /**
   * Test initial state of DrawingStore
   * This validates default values are set correctly
   */
  it('should initialize with correct default values', () => {
    expect(drawingStore.brushColor).toBe('#000000');
    expect(drawingStore.brushSize).toBe(5);
    expect(drawingStore.currentDrawingData).toEqual([]);
    expect(drawingStore.isClearing).toBe(false);
    expect(drawingStore.isDrawingEnabled).toBe(false);
  });

  /**
   * Test available colors array
   * This validates color palette is properly defined
   */
  it('should have predefined available colors', () => {
    expect(drawingStore.availableColors).toContain('#000000'); // Black
    expect(drawingStore.availableColors).toContain('#FFFFFF'); // White
    expect(drawingStore.availableColors).toContain('#FF0000'); // Red
    expect(drawingStore.availableColors).toContain('#00FF00'); // Green
    expect(drawingStore.availableColors).toContain('#0000FF'); // Blue
    expect(drawingStore.availableColors.length).toBe(12);
  });

  /**
   * Test available brush sizes array
   * This validates brush size options are properly defined
   */
  it('should have predefined available brush sizes', () => {
    expect(drawingStore.availableBrushSizes).toEqual([2, 5, 10, 15, 20]);
  });

  /**
   * Test setting brush color
   * This validates color selection functionality
   */
  it('should set brush color correctly', () => {
    drawingStore.setBrushColor('#FF0000');
    expect(drawingStore.brushColor).toBe('#FF0000');

    drawingStore.setBrushColor('#00FF00');
    expect(drawingStore.brushColor).toBe('#00FF00');
  });

  /**
   * Test setting brush size with clamping
   * This validates brush size limits and clamping
   */
  it('should set brush size with proper clamping', () => {
    // Normal size
    drawingStore.setBrushSize(10);
    expect(drawingStore.brushSize).toBe(10);

    // Too small - should clamp to 1
    drawingStore.setBrushSize(0);
    expect(drawingStore.brushSize).toBe(1);

    drawingStore.setBrushSize(-5);
    expect(drawingStore.brushSize).toBe(1);

    // Too large - should clamp to 20
    drawingStore.setBrushSize(25);
    expect(drawingStore.brushSize).toBe(20);

    drawingStore.setBrushSize(100);
    expect(drawingStore.brushSize).toBe(20);

    // Edge cases
    drawingStore.setBrushSize(1);
    expect(drawingStore.brushSize).toBe(1);

    drawingStore.setBrushSize(20);
    expect(drawingStore.brushSize).toBe(20);
  });

  /**
   * Test adding drawing data
   * This validates drawing data accumulation
   */
  it('should add drawing data correctly', () => {
    const drawingData: DrawingData = {
      x: 100,
      y: 150,
      prevX: 95,
      prevY: 145,
      color: '#FF0000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now(),
    };

    drawingStore.addDrawingData(drawingData);
    expect(drawingStore.currentDrawingData).toContainEqual(drawingData);
    expect(drawingStore.strokeCount).toBe(1);

    const drawingData2: DrawingData = {
      x: 105,
      y: 155,
      prevX: 100,
      prevY: 150,
      color: '#FF0000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now(),
    };

    drawingStore.addDrawingData(drawingData2);
    expect(drawingStore.currentDrawingData).toContainEqual(drawingData2);
    expect(drawingStore.strokeCount).toBe(2);
  });

  /**
   * Test clearing canvas
   * This validates canvas clearing functionality
   */
  it('should clear canvas correctly', () => {
    // Add some drawing data first
    const drawingData: DrawingData = {
      x: 100,
      y: 150,
      color: '#FF0000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now(),
    };

    drawingStore.addDrawingData(drawingData);
    expect(drawingStore.strokeCount).toBe(1);

    // Clear canvas
    drawingStore.clearCanvas();
    expect(drawingStore.currentDrawingData).toEqual([]);
    expect(drawingStore.strokeCount).toBe(0);
    expect(drawingStore.isClearing).toBe(true);
  });

  /**
   * Test clearing flag reset
   * This validates that clearing flag is reset after timeout
   */
  it('should reset clearing flag after timeout', (done) => {
    drawingStore.clearCanvas();
    expect(drawingStore.isClearing).toBe(true);

    // Check that flag is reset after timeout
    setTimeout(() => {
      expect(drawingStore.isClearing).toBe(false);
      done();
    }, 150); // Wait longer than the 100ms timeout
  });

  /**
   * Test enabling/disabling drawing tools
   * This validates drawing permission management
   */
  it('should enable and disable drawing tools correctly', () => {
    expect(drawingStore.isDrawingEnabled).toBe(false);

    drawingStore.setDrawingEnabled(true);
    expect(drawingStore.isDrawingEnabled).toBe(true);

    drawingStore.setDrawingEnabled(false);
    expect(drawingStore.isDrawingEnabled).toBe(false);
  });

  /**
   * Test processing incoming drawing data
   * This validates real-time drawing data handling
   */
  it('should process incoming drawing data when not current drawer', () => {
    // Set up game state so current player is not drawing
    rootStore.gameStore.currentDrawerId = 'other-player';
    rootStore.playerStore.currentPlayer = { id: 'current-player' } as any;

    const drawingData: DrawingData = {
      x: 200,
      y: 250,
      color: '#0000FF',
      brushSize: 10,
      isDrawing: true,
      timestamp: Date.now(),
    };

    drawingStore.processIncomingDrawingData(drawingData);
    expect(drawingStore.currentDrawingData).toContainEqual(drawingData);
  });

  /**
   * Test ignoring incoming drawing data when current drawer
   * This validates that drawer doesn't receive their own drawing data
   */
  it('should ignore incoming drawing data when current player is drawing', () => {
    // Set up game state so current player is drawing
    rootStore.gameStore.currentDrawerId = 'current-player';
    rootStore.playerStore.currentPlayer = { id: 'current-player' } as any;

    const drawingData: DrawingData = {
      x: 200,
      y: 250,
      color: '#0000FF',
      brushSize: 10,
      isDrawing: true,
      timestamp: Date.now(),
    };

    drawingStore.processIncomingDrawingData(drawingData);
    expect(drawingStore.currentDrawingData).not.toContainEqual(drawingData);
    expect(drawingStore.strokeCount).toBe(0);
  });

  /**
   * Test creating drawing data object
   * This validates drawing data creation with current settings
   */
  it('should create drawing data with current brush settings', () => {
    drawingStore.setBrushColor('#FF00FF');
    drawingStore.setBrushSize(15);

    const drawingData = drawingStore.createDrawingData(100, 200, 95, 195, true);

    expect(drawingData.x).toBe(100);
    expect(drawingData.y).toBe(200);
    expect(drawingData.prevX).toBe(95);
    expect(drawingData.prevY).toBe(195);
    expect(drawingData.color).toBe('#FF00FF');
    expect(drawingData.brushSize).toBe(15);
    expect(drawingData.isDrawing).toBe(true);
    expect(drawingData.timestamp).toBeCloseTo(Date.now(), -2); // Within 100ms
  });

  /**
   * Test creating drawing data without previous coordinates
   * This validates drawing data creation for new strokes
   */
  it('should create drawing data without previous coordinates', () => {
    const drawingData = drawingStore.createDrawingData(50, 75);

    expect(drawingData.x).toBe(50);
    expect(drawingData.y).toBe(75);
    expect(drawingData.prevX).toBeUndefined();
    expect(drawingData.prevY).toBeUndefined();
    expect(drawingData.isDrawing).toBe(true); // Default value
  });

  /**
   * Test current brush settings getter
   * This validates brush settings object creation
   */
  it('should return current brush settings object', () => {
    drawingStore.setBrushColor('#FFFF00');
    drawingStore.setBrushSize(8);

    const settings = drawingStore.currentBrushSettings;
    expect(settings.color).toBe('#FFFF00');
    expect(settings.size).toBe(8);
  });

  /**
   * Test light color detection
   * This validates color brightness calculation
   */
  it('should correctly identify light and dark colors', () => {
    // Test dark colors
    drawingStore.setBrushColor('#000000'); // Black
    expect(drawingStore.isCurrentColorLight).toBe(false);

    drawingStore.setBrushColor('#FF0000'); // Red
    expect(drawingStore.isCurrentColorLight).toBe(false);

    drawingStore.setBrushColor('#0000FF'); // Blue
    expect(drawingStore.isCurrentColorLight).toBe(false);

    // Test light colors
    drawingStore.setBrushColor('#FFFFFF'); // White
    expect(drawingStore.isCurrentColorLight).toBe(true);

    drawingStore.setBrushColor('#FFFF00'); // Yellow
    expect(drawingStore.isCurrentColorLight).toBe(true);

    drawingStore.setBrushColor('#00FFFF'); // Cyan
    expect(drawingStore.isCurrentColorLight).toBe(true);
  });

  /**
   * Test stroke count getter
   * This validates drawing data count tracking
   */
  it('should return correct stroke count', () => {
    expect(drawingStore.strokeCount).toBe(0);

    const drawingData1: DrawingData = {
      x: 10,
      y: 20,
      color: '#000000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now(),
    };

    const drawingData2: DrawingData = {
      x: 15,
      y: 25,
      color: '#000000',
      brushSize: 5,
      isDrawing: true,
      timestamp: Date.now(),
    };

    drawingStore.addDrawingData(drawingData1);
    expect(drawingStore.strokeCount).toBe(1);

    drawingStore.addDrawingData(drawingData2);
    expect(drawingStore.strokeCount).toBe(2);
  });

  /**
   * Test store reset functionality
   * This validates cleanup when leaving game
   */
  it('should reset to initial state when reset is called', () => {
    // Set up some state
    drawingStore.setBrushColor('#FF0000');
    drawingStore.setBrushSize(15);
    drawingStore.setDrawingEnabled(true);

    const drawingData: DrawingData = {
      x: 100,
      y: 200,
      color: '#FF0000',
      brushSize: 15,
      isDrawing: true,
      timestamp: Date.now(),
    };
    drawingStore.addDrawingData(drawingData);

    // Reset
    drawingStore.reset();

    // Verify reset to initial state
    expect(drawingStore.brushColor).toBe('#000000');
    expect(drawingStore.brushSize).toBe(5);
    expect(drawingStore.currentDrawingData).toEqual([]);
    expect(drawingStore.isClearing).toBe(false);
    expect(drawingStore.isDrawingEnabled).toBe(false);
  });
});
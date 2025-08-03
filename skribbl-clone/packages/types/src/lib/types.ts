// Enums for game states and player statuses
export enum GameState {
  WAITING = 'waiting',
  STARTING = 'starting',
  PLAYING = 'playing',
  ROUND_END = 'round_end',
  GAME_END = 'game_end'
}

export enum PlayerStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  DRAWING = 'drawing',
  GUESSING = 'guessing'
}

// Core Player interface
export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
  isConnected: boolean;
  status: PlayerStatus;
  joinedAt: Date;
}

// Room interface
export interface Room {
  id: string;
  code: string;
  players: Player[];
  currentDrawer: string | null;
  currentWord: string | null;
  roundNumber: number;
  maxRounds: number;
  gameState: GameState;
  createdAt: Date;
  lastActivity: Date;
  maxPlayers: number;
}

// Drawing data model for real-time drawing
export interface DrawingData {
  x: number;
  y: number;
  prevX?: number;
  prevY?: number;
  color: string;
  brushSize: number;
  isDrawing: boolean;
  timestamp: number;
}

// Chat message model
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  isCorrectGuess: boolean;
  timestamp: Date;
}

// Round results for end of round display
export interface RoundResults {
  roundNumber: number;
  word: string;
  drawer: Player;
  correctGuessers: Player[];
  scores: { playerId: string; pointsEarned: number }[];
}

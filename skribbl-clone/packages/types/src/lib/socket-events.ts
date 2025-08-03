import { Player, Room, DrawingData, ChatMessage, RoundResults } from './types';

// Client to Server events - events that the client can emit to the server
export interface ClientToServerEvents {
    // Room management events
    'room:create': (playerName: string) => void;
    'room:join': (roomCode: string, playerName: string) => void;
    'room:leave': () => void;

    // Game flow events
    'game:start': () => void;
    'game:ready': () => void;

    // Drawing events
    'drawing:stroke': (drawingData: DrawingData) => void;
    'drawing:clear': () => void;

    // Chat and guessing events
    'chat:message': (message: string) => void;

    // Player events
    'player:disconnect': () => void;
}

// Server to Client events - events that the server can emit to clients
export interface ServerToClientEvents {
    // Room management events
    'room:created': (room: Room) => void;
    'room:joined': (room: Room, player: Player) => void;
    'room:updated': (room: Room) => void;
    'room:error': (error: string) => void;
    'room:player_joined': (player: Player) => void;
    'room:player_left': (playerId: string) => void;

    // Game flow events
    'game:started': (currentDrawer: Player, word: string) => void;
    'game:round_started': (currentDrawer: Player, roundNumber: number) => void;
    'game:round_end': (results: RoundResults) => void;
    'game:end': (finalScores: Player[]) => void;
    'game:timer_update': (timeRemaining: number) => void;

    // Drawing events
    'drawing:update': (drawingData: DrawingData) => void;
    'drawing:cleared': () => void;

    // Chat and guessing events
    'chat:message': (message: ChatMessage) => void;
    'chat:correct_guess': (playerId: string, playerName: string) => void;

    // Player events
    'player:score_updated': (playerId: string, newScore: number) => void;
    'player:status_changed': (playerId: string, status: string) => void;

    // Connection events
    'connection:error': (error: string) => void;
    'connection:reconnected': () => void;
}

// Inter-server events (for potential scaling)
export interface InterServerEvents {
    'server:room_created': (roomId: string) => void;
    'server:room_deleted': (roomId: string) => void;
}

// Socket data interface for typed socket instances
export interface SocketData {
    playerId?: string;
    playerName?: string;
    roomId?: string;
}
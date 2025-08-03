/**
 * @fileoverview Zod validation schemas for room-related requests
 * 
 * This module provides input validation for all room management operations:
 * - Room creation requests
 * - Room joining requests  
 * - Player name validation
 * - Room code format validation
 * 
 * Requirements covered: 9.2, 9.3 (input validation and error handling)
 */

import { z } from 'zod';

/**
 * Validation schema for player names
 * Player names must be:
 * - Between 2 and 20 characters long
 * - Contain only letters, numbers, spaces, and basic punctuation
 * - Not be empty or just whitespace
 * - Not contain offensive words (basic filter)
 */
export const PlayerNameSchema = z
    .string()
    .min(2, 'Player name must be at least 2 characters long')
    .max(20, 'Player name must be no more than 20 characters long')
    .regex(
        /^[a-zA-Z0-9\s\-_\.]+$/,
        'Player name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
    )
    .refine(
        (name) => name.trim().length > 0,
        'Player name cannot be empty or just whitespace'
    )
    .refine(
        (name) => !containsOffensiveWords(name),
        'Player name contains inappropriate content'
    )
    .transform((name) => name.trim()); // Remove leading/trailing whitespace

/**
 * Validation schema for room codes
 * Room codes must be:
 * - Exactly 6 characters long
 * - Contain only letters and numbers (case insensitive)
 * - Match the format used by our room code generator
 */
export const RoomCodeSchema = z
    .string()
    .length(6, 'Room code must be exactly 6 characters long')
    .regex(
        /^[A-Za-z0-9]+$/,
        'Room code must contain only letters and numbers'
    )
    .transform((code) => code.toUpperCase()); // Transform to uppercase after validation

/**
 * Validation schema for room creation requests
 * Validates the player name for the room creator
 */
export const CreateRoomRequestSchema = z.object({
    playerName: PlayerNameSchema
});

/**
 * Validation schema for room joining requests
 * Validates both the room code and player name
 */
export const JoinRoomRequestSchema = z.object({
    roomCode: RoomCodeSchema,
    playerName: PlayerNameSchema
});

/**
 * Validation schema for leaving room requests
 * Currently just validates that playerId is provided and is a string
 */
export const LeaveRoomRequestSchema = z.object({
    playerId: z.string().min(1, 'Player ID is required')
});

/**
 * Type definitions derived from our Zod schemas
 * These provide TypeScript types for validated data
 */
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomRequestSchema>;
export type LeaveRoomRequest = z.infer<typeof LeaveRoomRequestSchema>;

/**
 * Basic offensive word filter
 * This is a simple implementation - in production you'd want a more sophisticated filter
 * @param text - The text to check for offensive content
 * @returns true if offensive words are found, false otherwise
 */
function containsOffensiveWords(text: string): boolean {
    // Basic list of words to filter - in production this would be more comprehensive
    const offensiveWords = [
        'admin', 'moderator', 'bot', 'system', 'server',
        // Add more words as needed, but keep it reasonable for a drawing game
    ];
    
    const lowerText = text.toLowerCase();
    return offensiveWords.some(word => lowerText.includes(word));
}

/**
 * Utility function to validate and parse room creation requests
 * @param data - Raw request data to validate
 * @returns Parsed and validated data
 * @throws ZodError if validation fails
 */
export function validateCreateRoomRequest(data: unknown): CreateRoomRequest {
    return CreateRoomRequestSchema.parse(data);
}

/**
 * Utility function to validate and parse room joining requests
 * @param data - Raw request data to validate
 * @returns Parsed and validated data
 * @throws ZodError if validation fails
 */
export function validateJoinRoomRequest(data: unknown): JoinRoomRequest {
    return JoinRoomRequestSchema.parse(data);
}

/**
 * Utility function to validate and parse room leaving requests
 * @param data - Raw request data to validate
 * @returns Parsed and validated data
 * @throws ZodError if validation fails
 */
export function validateLeaveRoomRequest(data: unknown): LeaveRoomRequest {
    return LeaveRoomRequestSchema.parse(data);
}

/**
 * Utility function to safely validate data and return result with error info
 * This is useful when you want to handle validation errors gracefully
 * @param schema - The Zod schema to use for validation
 * @param data - The data to validate
 * @returns Object with success flag and either data or error
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Format Zod errors into a user-friendly message
            const errorMessage = error.issues
                .map(err => {
                    const path = err.path && err.path.length > 0 ? err.path.join('.') : 'root';
                    return `${path}: ${err.message}`;
                })
                .join(', ');
            return { success: false, error: errorMessage };
        }
        return { success: false, error: 'Validation failed' };
    }
}
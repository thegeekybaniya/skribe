/**
 * @fileoverview Unit tests for room validation schemas
 * 
 * This test suite provides comprehensive coverage for Zod validation schemas
 * used in room management operations:
 * - Player name validation with various edge cases
 * - Room code format validation
 * - Request schema validation for create/join/leave operations
 * - Error handling and user-friendly error messages
 * 
 * Requirements covered: 9.2, 9.3 (input validation and error handling)
 */

import {
    PlayerNameSchema,
    RoomCodeSchema,
    CreateRoomRequestSchema,
    JoinRoomRequestSchema,
    LeaveRoomRequestSchema,
    validateCreateRoomRequest,
    validateJoinRoomRequest,
    validateLeaveRoomRequest,
    safeValidate
} from './roomValidation';
import { z } from 'zod';

describe('Room Validation Schemas', () => {
    
    describe('PlayerNameSchema', () => {
        /**
         * Test valid player names that should pass validation
         * Requirement 9.2: Input validation for player names
         */
        it('should accept valid player names', () => {
            const validNames = [
                'John',
                'Player123',
                'Cool_Player',
                'Test-User',
                'Player.Name',
                'A B C',
                'PlayerWithNumbers123',
                'Mix_Of-Everything12' // Shortened to fit 20 char limit
            ];

            validNames.forEach(name => {
                expect(() => PlayerNameSchema.parse(name)).not.toThrow();
                const result = PlayerNameSchema.parse(name);
                expect(result).toBe(name.trim());
            });
        });

        /**
         * Test that player names are trimmed of whitespace
         * Requirement 9.3: Data sanitization
         */
        it('should trim whitespace from player names', () => {
            const nameWithSpaces = '  TestPlayer  ';
            const result = PlayerNameSchema.parse(nameWithSpaces);
            expect(result).toBe('TestPlayer');
        });

        /**
         * Test rejection of names that are too short
         * Requirement 9.3: Input validation constraints
         */
        it('should reject names that are too short', () => {
            const shortNames = ['', 'A'];
            
            shortNames.forEach(name => {
                expect(() => PlayerNameSchema.parse(name)).toThrow('Player name must be at least 2 characters long');
            });
        });

        /**
         * Test rejection of names that are too long
         * Requirement 9.3: Input validation constraints
         */
        it('should reject names that are too long', () => {
            const longName = 'A'.repeat(21); // 21 characters
            
            expect(() => PlayerNameSchema.parse(longName)).toThrow('Player name must be no more than 20 characters long');
        });

        /**
         * Test rejection of names with invalid characters
         * Requirement 9.3: Input validation for security
         */
        it('should reject names with invalid characters', () => {
            const invalidNames = [
                'Player@Name',
                'Player#123',
                'Player$Money',
                'Player%Test',
                'Player&Co',
                'Player*Star',
                'Player+Plus',
                'Player=Equal',
                'Player[Bracket]',
                'Player{Brace}',
                'Player|Pipe',
                'Player\\Backslash',
                'Player/Slash',
                'Player<Greater>',
                'Player"Quote"',
                "Player'Apostrophe",
                'Player`Backtick',
                'Player~Tilde',
                'Player!Exclamation',
                'Player?Question',
                'Player:Colon',
                'Player;Semicolon',
                'Player,Comma'
            ];

            invalidNames.forEach(name => {
                expect(() => PlayerNameSchema.parse(name)).toThrow('Player name can only contain letters, numbers, spaces, hyphens, underscores, and periods');
            });
        });

        /**
         * Test rejection of empty or whitespace-only names
         * Requirement 9.3: Input validation
         */
        it('should reject empty or whitespace-only names', () => {
            const emptyNames = ['', '   ', '\t', '\n', '  \t  \n  '];
            
            emptyNames.forEach(name => {
                expect(() => PlayerNameSchema.parse(name)).toThrow('Player name cannot be empty or just whitespace');
            });
        });

        /**
         * Test rejection of names with offensive words
         * Requirement 9.3: Content filtering
         */
        it('should reject names with offensive words', () => {
            const offensiveNames = [
                'admin',
                'ADMIN',
                'Admin',
                'moderator',
                'MODERATOR',
                'bot',
                'BOT',
                'system',
                'SYSTEM',
                'server',
                'SERVER',
                'TestAdmin',
                'BotPlayer',
                'SystemUser'
            ];

            offensiveNames.forEach(name => {
                expect(() => PlayerNameSchema.parse(name)).toThrow('Player name contains inappropriate content');
            });
        });
    });

    describe('RoomCodeSchema', () => {
        /**
         * Test valid room codes that should pass validation
         * Requirement 9.2: Room code format validation
         */
        it('should accept valid room codes', () => {
            const validCodes = [
                'ABC123',
                'XYZABC',
                '123456',
                'A1B2C3',
                'QWERTY',
                'ZXCVBN'
            ];

            validCodes.forEach(code => {
                expect(() => RoomCodeSchema.parse(code)).not.toThrow();
                const result = RoomCodeSchema.parse(code);
                expect(result).toBe(code.toUpperCase());
            });
        });

        /**
         * Test that room codes are converted to uppercase
         * Requirement 9.3: Data normalization
         */
        it('should convert room codes to uppercase', () => {
            const lowerCaseCode = 'abc123';
            const result = RoomCodeSchema.parse(lowerCaseCode);
            expect(result).toBe('ABC123');
        });

        /**
         * Test rejection of codes with wrong length
         * Requirement 9.3: Input validation constraints
         */
        it('should reject codes with wrong length', () => {
            const invalidLengthCodes = [
                'ABC12',    // Too short (5 chars)
                'ABC1234',  // Too long (7 chars)
                '',         // Empty
                'A',        // Too short (1 char)
                'ABCDEFGH'  // Too long (8 chars)
            ];

            invalidLengthCodes.forEach(code => {
                expect(() => RoomCodeSchema.parse(code)).toThrow('Room code must be exactly 6 characters long');
            });
        });

        /**
         * Test rejection of codes with invalid characters
         * Requirement 9.3: Input validation for security
         */
        it('should reject codes with invalid characters', () => {
            const invalidCodes = [
                'ABC12@',
                'ABC-12',
                'ABC_12',
                'ABC.12',
                'ABC 12',
                'ABC!12',
                'abc123',  // lowercase (should be handled by transform, but let's test)
                'ABC12#'
            ];

            // Note: lowercase should actually pass due to transform, so we test differently
            const trulyInvalidCodes = [
                'ABC12@',
                'ABC-12',
                'ABC_12',
                'ABC.12',
                'ABC 12',
                'ABC!12',
                'ABC12#'
            ];

            trulyInvalidCodes.forEach(code => {
                expect(() => RoomCodeSchema.parse(code)).toThrow('Room code must contain only letters and numbers');
            });
        });
    });

    describe('CreateRoomRequestSchema', () => {
        /**
         * Test valid room creation requests
         * Requirement 9.2: Request validation
         */
        it('should accept valid create room requests', () => {
            const validRequests = [
                { playerName: 'TestPlayer' },
                { playerName: 'Player123' },
                { playerName: 'Cool_Player' }
            ];

            validRequests.forEach(request => {
                expect(() => CreateRoomRequestSchema.parse(request)).not.toThrow();
            });
        });

        /**
         * Test rejection of invalid create room requests
         * Requirement 9.3: Input validation
         */
        it('should reject invalid create room requests', () => {
            const invalidRequests = [
                {},                           // Missing playerName
                { playerName: '' },          // Empty playerName
                { playerName: 'A' },         // Too short
                { playerName: 'admin' },     // Offensive word
                { wrongField: 'TestPlayer' } // Wrong field name
            ];

            invalidRequests.forEach(request => {
                expect(() => CreateRoomRequestSchema.parse(request)).toThrow();
            });
        });
    });

    describe('JoinRoomRequestSchema', () => {
        /**
         * Test valid room join requests
         * Requirement 9.2: Request validation
         */
        it('should accept valid join room requests', () => {
            const validRequests = [
                { roomCode: 'ABC123', playerName: 'TestPlayer' },
                { roomCode: 'xyz789', playerName: 'Player123' }, // lowercase code should be transformed
                { roomCode: 'QWERTY', playerName: 'Cool_Player' }
            ];

            validRequests.forEach(request => {
                expect(() => JoinRoomRequestSchema.parse(request)).not.toThrow();
            });
        });

        /**
         * Test rejection of invalid join room requests
         * Requirement 9.3: Input validation
         */
        it('should reject invalid join room requests', () => {
            const invalidRequests = [
                {},                                              // Missing both fields
                { roomCode: 'ABC123' },                         // Missing playerName
                { playerName: 'TestPlayer' },                   // Missing roomCode
                { roomCode: 'ABC12', playerName: 'TestPlayer' }, // Invalid roomCode length
                { roomCode: 'ABC123', playerName: 'A' },        // Invalid playerName length
                { roomCode: 'ABC@23', playerName: 'TestPlayer' } // Invalid roomCode characters
            ];

            invalidRequests.forEach(request => {
                expect(() => JoinRoomRequestSchema.parse(request)).toThrow();
            });
        });
    });

    describe('LeaveRoomRequestSchema', () => {
        /**
         * Test valid leave room requests
         * Requirement 9.2: Request validation
         */
        it('should accept valid leave room requests', () => {
            const validRequests = [
                { playerId: 'player123' },
                { playerId: 'player_456' },
                { playerId: 'very-long-player-id-12345' }
            ];

            validRequests.forEach(request => {
                expect(() => LeaveRoomRequestSchema.parse(request)).not.toThrow();
            });
        });

        /**
         * Test rejection of invalid leave room requests
         * Requirement 9.3: Input validation
         */
        it('should reject invalid leave room requests', () => {
            const invalidRequests = [
                {},                    // Missing playerId
                { playerId: '' },      // Empty playerId
                { wrongField: 'test' } // Wrong field name
            ];

            invalidRequests.forEach(request => {
                expect(() => LeaveRoomRequestSchema.parse(request)).toThrow();
            });
        });
    });

    describe('Validation Utility Functions', () => {
        /**
         * Test validateCreateRoomRequest utility function
         * Requirement 9.2: Utility function validation
         */
        it('should validate create room requests correctly', () => {
            const validRequest = { playerName: 'TestPlayer' };
            const result = validateCreateRoomRequest(validRequest);
            expect(result.playerName).toBe('TestPlayer');

            expect(() => validateCreateRoomRequest({})).toThrow();
        });

        /**
         * Test validateJoinRoomRequest utility function
         * Requirement 9.2: Utility function validation
         */
        it('should validate join room requests correctly', () => {
            const validRequest = { roomCode: 'abc123', playerName: 'TestPlayer' };
            const result = validateJoinRoomRequest(validRequest);
            expect(result.roomCode).toBe('ABC123'); // Should be transformed to uppercase
            expect(result.playerName).toBe('TestPlayer');

            expect(() => validateJoinRoomRequest({})).toThrow();
        });

        /**
         * Test validateLeaveRoomRequest utility function
         * Requirement 9.2: Utility function validation
         */
        it('should validate leave room requests correctly', () => {
            const validRequest = { playerId: 'player123' };
            const result = validateLeaveRoomRequest(validRequest);
            expect(result.playerId).toBe('player123');

            expect(() => validateLeaveRoomRequest({})).toThrow();
        });

        /**
         * Test safeValidate utility function with successful validation
         * Requirement 9.3: Safe validation with error handling
         */
        it('should return success result for valid data', () => {
            const schema = z.object({ name: z.string().min(2) });
            const validData = { name: 'TestName' };
            
            const result = safeValidate(schema, validData);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('TestName');
            }
        });

        /**
         * Test safeValidate utility function with validation failure
         * Requirement 9.3: Safe validation with error handling
         */
        it('should return error result for invalid data', () => {
            const schema = z.object({ name: z.string().min(2) });
            const invalidData = { name: 'A' };
            
            const result = safeValidate(schema, invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('Too small');
            }
        });

        /**
         * Test safeValidate with multiple validation errors
         * Requirement 9.3: Comprehensive error reporting
         */
        it('should format multiple validation errors correctly', () => {
            const schema = z.object({
                name: z.string().min(2),
                age: z.number().min(0)
            });
            const invalidData = { name: 'A', age: -1 };
            
            const result = safeValidate(schema, invalidData);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('name:');
                expect(result.error).toContain('age:');
            }
        });

        /**
         * Test safeValidate with non-Zod errors
         * Requirement 9.3: Error handling for unexpected errors
         */
        it('should handle non-Zod errors gracefully', () => {
            const schema = z.object({ name: z.string() });
            
            // Mock a schema that throws a non-Zod error
            const mockSchema = {
                parse: () => {
                    throw new Error('Non-Zod error');
                }
            } as any;
            
            const result = safeValidate(mockSchema, { name: 'test' });
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Validation failed');
            }
        });
    });

    describe('Edge Cases and Security', () => {
        /**
         * Test handling of null and undefined values
         * Requirement 9.3: Robust input validation
         */
        it('should handle null and undefined values', () => {
            expect(() => PlayerNameSchema.parse(null)).toThrow();
            expect(() => PlayerNameSchema.parse(undefined)).toThrow();
            expect(() => RoomCodeSchema.parse(null)).toThrow();
            expect(() => RoomCodeSchema.parse(undefined)).toThrow();
        });

        /**
         * Test handling of non-string values
         * Requirement 9.3: Type safety
         */
        it('should reject non-string values', () => {
            const nonStringValues = [123, true, [], {}, Symbol('test')];
            
            nonStringValues.forEach(value => {
                expect(() => PlayerNameSchema.parse(value)).toThrow();
                expect(() => RoomCodeSchema.parse(value)).toThrow();
            });
        });

        /**
         * Test Unicode and special character handling
         * Requirement 9.3: International character support
         */
        it('should handle Unicode characters appropriately', () => {
            // These should be rejected as they contain non-ASCII characters
            const unicodeNames = ['Player🎮', 'Tëst', 'Plâyér', '玩家'];
            
            unicodeNames.forEach(name => {
                expect(() => PlayerNameSchema.parse(name)).toThrow();
            });
        });

        /**
         * Test very long input handling
         * Requirement 9.3: DoS protection
         */
        it('should handle very long inputs efficiently', () => {
            const veryLongString = 'A'.repeat(10000);
            
            // Should fail quickly without processing the entire string
            expect(() => PlayerNameSchema.parse(veryLongString)).toThrow();
            expect(() => RoomCodeSchema.parse(veryLongString)).toThrow();
        });
    });
});
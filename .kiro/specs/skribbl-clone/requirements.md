# Requirements Document

## Introduction

This document outlines the requirements for building a real-time multiplayer drawing game inspired by Skribbl.io. The application will be built as an NX monorepo with a React Native (Expo) mobile frontend and Node.js backend using Socket.IO for real-time communication. The game allows players to join as guests without authentication, take turns drawing while others guess the word, and compete for points in a fun, social gaming experience.

## Requirements

### Requirement 1

**User Story:** As a player, I want to create or join a game room using a room code, so that I can play with friends or other players.

#### Acceptance Criteria

1. WHEN a player opens the app THEN the system SHALL display options to create a new room or join an existing room
2. WHEN a player creates a new room THEN the system SHALL generate a unique 6-character room code and display it prominently
3. WHEN a player enters a valid room code THEN the system SHALL connect them to that game room
4. WHEN a player enters an invalid room code THEN the system SHALL display an error message "Room not found"
5. WHEN a room reaches maximum capacity (8 players) THEN the system SHALL prevent new players from joining and display "Room is full"

### Requirement 2

**User Story:** As a player, I want to participate in real-time collaborative drawing, so that I can express the word I'm trying to convey to other players.

#### Acceptance Criteria

1. WHEN it's a player's turn to draw THEN the system SHALL enable the drawing canvas with brush tools
2. WHEN a player draws on the canvas THEN the system SHALL broadcast the drawing data to all other players in real-time
3. WHEN other players receive drawing data THEN the system SHALL render the strokes on their canvas immediately
4. WHEN a drawing turn ends THEN the system SHALL clear the canvas for the next round
5. WHEN a player is not the drawer THEN the system SHALL disable drawing tools and display the canvas in view-only mode

### Requirement 3

**User Story:** As a player, I want to guess what others are drawing through a chat system, so that I can earn points and participate in the game.

#### Acceptance Criteria

1. WHEN a player types a message THEN the system SHALL display it in the chat for all players to see
2. WHEN a player submits a correct guess THEN the system SHALL award points to both the guesser and the drawer
3. WHEN a player submits a correct guess THEN the system SHALL display a special indicator showing the correct guess
4. WHEN a player submits an incorrect guess THEN the system SHALL display the message normally in chat
5. WHEN the drawer types in chat THEN the system SHALL prevent their messages from being sent to avoid giving hints

### Requirement 4

**User Story:** As a player, I want to participate in turn-based gameplay with a timer, so that the game progresses fairly and maintains engagement.

#### Acceptance Criteria

1. WHEN a new round starts THEN the system SHALL select the next player in rotation as the drawer
2. WHEN a player becomes the drawer THEN the system SHALL display a secret word for them to draw
3. WHEN a round starts THEN the system SHALL start a 60-second countdown timer visible to all players
4. WHEN the timer reaches zero THEN the system SHALL end the current round and move to the next player
5. WHEN all players have had a turn THEN the system SHALL complete the game and display final scores

### Requirement 5

**User Story:** As a player, I want to see a scoreboard with round history, so that I can track my performance and compete with others.

#### Acceptance Criteria

1. WHEN a player joins a room THEN the system SHALL display a scoreboard showing all players and their current scores
2. WHEN a player earns points THEN the system SHALL update their score on the scoreboard immediately
3. WHEN a round ends THEN the system SHALL display round results showing who guessed correctly and points earned
4. WHEN a game completes THEN the system SHALL display final rankings with total scores
5. WHEN viewing the scoreboard THEN the system SHALL show each player's name and total points in descending order

### Requirement 6

**User Story:** As a developer, I want the codebase organized in an NX monorepo with shared types and atomic design principles, so that code can be maintained efficiently and the UI is scalable and consistent.

#### Acceptance Criteria

1. WHEN the project is structured THEN the system SHALL have separate apps for mobile and server in the apps directory
2. WHEN shared code is needed THEN the system SHALL use packages directory for types and common utilities
3. WHEN types are defined THEN the system SHALL ensure they are shared between frontend and backend through the types package
4. WHEN building the project THEN the system SHALL use NX build system with proper dependency management
5. WHEN code is written THEN the system SHALL include TypeScript throughout with strict type checking enabled
6. WHEN frontend components are created THEN the system SHALL follow atomic design methodology with atoms, molecules, organisms, templates, and screens
7. WHEN managing application state THEN the system SHALL use MobX for reactive state management in the mobile app

### Requirement 7

**User Story:** As a developer, I want comprehensive unit test coverage, so that the codebase is reliable and maintainable.

#### Acceptance Criteria

1. WHEN tests are run THEN the system SHALL achieve 100% unit test coverage across all modules
2. WHEN new code is added THEN the system SHALL require corresponding unit tests before merging
3. WHEN tests fail THEN the system SHALL prevent deployment and notify developers
4. WHEN edge cases exist THEN the system SHALL include tests covering error scenarios and boundary conditions
5. WHEN Socket.IO events are tested THEN the system SHALL use appropriate mocks and test real-time functionality

### Requirement 8

**User Story:** As a developer, I want clean, well-documented code with beginner-friendly comments, so that the codebase is accessible and maintainable.

#### Acceptance Criteria

1. WHEN code is written THEN the system SHALL include explanation comments that a teenager can understand
2. WHEN complex logic is implemented THEN the system SHALL break it down with step-by-step comments
3. WHEN functions are created THEN the system SHALL include JSDoc comments explaining parameters and return values
4. WHEN architectural decisions are made THEN the system SHALL document the reasoning in code comments
5. WHEN reviewing code THEN the system SHALL ensure comments explain the "why" not just the "what"

### Requirement 9

**User Story:** As a system administrator, I want proper error handling and resource cleanup, so that the server remains stable under various conditions.

#### Acceptance Criteria

1. WHEN a player disconnects unexpectedly THEN the system SHALL clean up their session and notify other players
2. WHEN invalid data is received THEN the system SHALL validate input and return appropriate error messages
3. WHEN memory usage grows THEN the system SHALL clean up unused rooms and expired sessions
4. WHEN errors occur THEN the system SHALL log them appropriately without exposing sensitive information
5. WHEN the server restarts THEN the system SHALL handle reconnections gracefully and restore game state where possible
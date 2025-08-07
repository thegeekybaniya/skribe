/**
 * @fileoverview Unit tests for ChatStore
 * Tests chat message management, input handling, and chat functionality
 * Requirements: 6.7 - MobX for reactive state management
 */

import { ChatStore } from './ChatStore';
import { RootStore } from './RootStore';
import { ChatMessage } from '@skribbl-clone/types';

describe('ChatStore', () => {
  let chatStore: ChatStore;
  let rootStore: RootStore;

  beforeEach(() => {
    rootStore = new RootStore();
    chatStore = rootStore.chatStore;
  });

  /**
   * Test initial state of ChatStore
   * This validates default values are set correctly
   */
  it('should initialize with correct default values', () => {
    expect(chatStore.messages).toEqual([]);
    expect(chatStore.currentMessage).toBe('');
    expect(chatStore.isInputFocused).toBe(false);
    expect(chatStore.maxMessages).toBe(100);
    expect(chatStore.hasUnreadMessages).toBe(false);
  });

  /**
   * Test adding messages to chat
   * This validates message addition and unread status
   */
  it('should add messages correctly', () => {
    const message: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'TestPlayer',
      message: 'Hello world!',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message);

    expect(chatStore.messages).toContainEqual(message);
    expect(chatStore.hasMessages).toBe(true);
    expect(chatStore.hasUnreadMessages).toBe(true); // Should be unread when input not focused
  });

  /**
   * Test adding messages when input is focused
   * This validates that messages don't become unread when chat is focused
   */
  it('should not mark messages as unread when input is focused', () => {
    chatStore.setInputFocused(true);

    const message: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'TestPlayer',
      message: 'Hello world!',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message);

    expect(chatStore.messages).toContainEqual(message);
    expect(chatStore.hasUnreadMessages).toBe(false); // Should not be unread
  });

  /**
   * Test message limit enforcement
   * This validates that old messages are removed when limit is exceeded
   */
  it('should enforce message limit and remove old messages', () => {
    // Set a lower limit for testing
    chatStore.maxMessages = 3;

    const messages: ChatMessage[] = [
      {
        id: 'msg1',
        playerId: 'player1',
        playerName: 'Player1',
        message: 'Message 1',
        isCorrectGuess: false,
        timestamp: new Date(),
      },
      {
        id: 'msg2',
        playerId: 'player2',
        playerName: 'Player2',
        message: 'Message 2',
        isCorrectGuess: false,
        timestamp: new Date(),
      },
      {
        id: 'msg3',
        playerId: 'player3',
        playerName: 'Player3',
        message: 'Message 3',
        isCorrectGuess: false,
        timestamp: new Date(),
      },
      {
        id: 'msg4',
        playerId: 'player4',
        playerName: 'Player4',
        message: 'Message 4',
        isCorrectGuess: false,
        timestamp: new Date(),
      },
    ];

    messages.forEach(msg => chatStore.addMessage(msg));

    expect(chatStore.messages.length).toBe(3);
    expect(chatStore.messages.find(m => m.id === 'msg1')).toBeUndefined(); // First message should be removed
    expect(chatStore.messages.find(m => m.id === 'msg4')).toBeDefined(); // Last message should be present
  });

  /**
   * Test setting current message
   * This validates message input handling
   */
  it('should set current message correctly', () => {
    chatStore.setCurrentMessage('Hello world!');
    expect(chatStore.currentMessage).toBe('Hello world!');

    chatStore.setCurrentMessage('Another message');
    expect(chatStore.currentMessage).toBe('Another message');
  });

  /**
   * Test clearing current message
   * This validates message input clearing
   */
  it('should clear current message correctly', () => {
    chatStore.setCurrentMessage('Test message');
    expect(chatStore.currentMessage).toBe('Test message');

    chatStore.clearCurrentMessage();
    expect(chatStore.currentMessage).toBe('');
  });

  /**
   * Test setting input focus state
   * This validates focus state management and unread message clearing
   */
  it('should set input focus state and clear unread messages', () => {
    // Add a message to create unread status
    const message: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'TestPlayer',
      message: 'Hello!',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message);
    expect(chatStore.hasUnreadMessages).toBe(true);

    // Focus input - should clear unread messages
    chatStore.setInputFocused(true);
    expect(chatStore.isInputFocused).toBe(true);
    expect(chatStore.hasUnreadMessages).toBe(false);

    // Unfocus input
    chatStore.setInputFocused(false);
    expect(chatStore.isInputFocused).toBe(false);
  });

  /**
   * Test sending valid message
   * This validates message sending when conditions are met
   */
  it('should send message when valid and player is not drawing', () => {
    // Set up game state so player is not drawing
    rootStore.gameStore.currentDrawerId = 'other-player';
    rootStore.playerStore.currentPlayer = { id: 'current-player' } as any;

    chatStore.setCurrentMessage('  Hello world!  ');
    const sentMessage = chatStore.sendMessage();

    expect(sentMessage).toBe('Hello world!'); // Should trim whitespace
    expect(chatStore.currentMessage).toBe(''); // Should clear input
  });

  /**
   * Test sending empty message
   * This validates that empty messages are not sent
   */
  it('should not send empty or whitespace-only messages', () => {
    // Set up game state so player is not drawing
    rootStore.gameStore.currentDrawerId = 'other-player';
    rootStore.playerStore.currentPlayer = { id: 'current-player' } as any;

    chatStore.setCurrentMessage('');
    expect(chatStore.sendMessage()).toBeNull();

    chatStore.setCurrentMessage('   ');
    expect(chatStore.sendMessage()).toBeNull();

    chatStore.setCurrentMessage('\t\n');
    expect(chatStore.sendMessage()).toBeNull();
  });

  /**
   * Test preventing drawer from sending messages
   * This validates that drawer cannot send messages to prevent hints
   */
  it('should prevent drawer from sending messages', () => {
    // Set up game state so current player is drawing
    rootStore.gameStore.currentDrawerId = 'current-player';
    rootStore.playerStore.currentPlayer = { id: 'current-player' } as any;

    chatStore.setCurrentMessage('This is a hint!');
    const sentMessage = chatStore.sendMessage();

    expect(sentMessage).toBeNull();
    expect(chatStore.currentMessage).toBe('This is a hint!'); // Should not clear input
  });

  /**
   * Test can send message validation
   * This validates message sending conditions
   */
  it('should correctly validate if message can be sent', () => {
    // Set up game state so player is not drawing
    rootStore.gameStore.currentDrawerId = 'other-player';
    rootStore.playerStore.currentPlayer = { id: 'current-player' } as any;

    // Empty message
    chatStore.setCurrentMessage('');
    expect(chatStore.canSendMessage).toBe(false);

    // Valid message
    chatStore.setCurrentMessage('Hello!');
    expect(chatStore.canSendMessage).toBe(true);

    // Change game state so player is now drawing
    rootStore.gameStore.currentDrawerId = 'current-player';
    expect(chatStore.canSendMessage).toBe(false);
  });

  /**
   * Test getting recent messages
   * This validates recent message retrieval (last 50)
   */
  it('should return recent messages (last 50)', () => {
    // Add more than 50 messages
    for (let i = 1; i <= 60; i++) {
      const message: ChatMessage = {
        id: `msg${i}`,
        playerId: 'player1',
        playerName: 'TestPlayer',
        message: `Message ${i}`,
        isCorrectGuess: false,
        timestamp: new Date(),
      };
      chatStore.addMessage(message);
    }

    const recentMessages = chatStore.recentMessages;
    expect(recentMessages.length).toBe(50);
    expect(recentMessages[0].message).toBe('Message 11'); // Should start from message 11 (60-50+1)
    expect(recentMessages[49].message).toBe('Message 60'); // Should end with message 60
  });

  /**
   * Test unread message count
   * This validates unread message counting
   */
  it('should return correct unread message count', () => {
    expect(chatStore.unreadMessageCount).toBe(0);

    // Add messages to create unread status
    for (let i = 1; i <= 15; i++) {
      const message: ChatMessage = {
        id: `msg${i}`,
        playerId: 'player1',
        playerName: 'TestPlayer',
        message: `Message ${i}`,
        isCorrectGuess: false,
        timestamp: new Date(),
      };
      chatStore.addMessage(message);
    }

    // Should cap at 10
    expect(chatStore.unreadMessageCount).toBe(10);

    // Clear unread messages
    chatStore.setInputFocused(true);
    expect(chatStore.unreadMessageCount).toBe(0);
  });

  /**
   * Test current round messages
   * This validates round-specific message retrieval
   */
  it('should return current round messages', () => {
    const message: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'TestPlayer',
      message: 'Round message',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message);

    // Currently returns recent messages (simplified implementation)
    const roundMessages = chatStore.currentRoundMessages;
    expect(roundMessages).toContainEqual(message);
  });

  /**
   * Test has messages check
   * This validates message existence detection
   */
  it('should correctly identify if there are messages', () => {
    expect(chatStore.hasMessages).toBe(false);

    const message: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'TestPlayer',
      message: 'First message',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message);
    expect(chatStore.hasMessages).toBe(true);
  });

  /**
   * Test getting last message
   * This validates last message retrieval
   */
  it('should return last message correctly', () => {
    expect(chatStore.lastMessage).toBeNull();

    const message1: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'Player1',
      message: 'First message',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    const message2: ChatMessage = {
      id: 'msg2',
      playerId: 'player2',
      playerName: 'Player2',
      message: 'Second message',
      isCorrectGuess: true,
      timestamp: new Date(),
    };

    chatStore.addMessage(message1);
    expect(chatStore.lastMessage).toStrictEqual(message1);

    chatStore.addMessage(message2);
    expect(chatStore.lastMessage).toStrictEqual(message2);
  });

  /**
   * Test clearing all messages
   * This validates message history clearing
   */
  it('should clear all messages correctly', () => {
    // Add some messages
    const message1: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'Player1',
      message: 'Message 1',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    const message2: ChatMessage = {
      id: 'msg2',
      playerId: 'player2',
      playerName: 'Player2',
      message: 'Message 2',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message1);
    chatStore.addMessage(message2);
    expect(chatStore.messages.length).toBe(2);
    expect(chatStore.hasUnreadMessages).toBe(true);

    // Clear messages
    chatStore.clearMessages();
    expect(chatStore.messages).toEqual([]);
    expect(chatStore.hasUnreadMessages).toBe(false);
    expect(chatStore.hasMessages).toBe(false);
  });

  /**
   * Test store reset functionality
   * This validates cleanup when leaving game
   */
  it('should reset to initial state when reset is called', () => {
    // Set up some state
    const message: ChatMessage = {
      id: 'msg1',
      playerId: 'player1',
      playerName: 'TestPlayer',
      message: 'Test message',
      isCorrectGuess: false,
      timestamp: new Date(),
    };

    chatStore.addMessage(message);
    chatStore.setCurrentMessage('Typing...');
    chatStore.setInputFocused(true);

    // Reset
    chatStore.reset();

    // Verify reset to initial state
    expect(chatStore.messages).toEqual([]);
    expect(chatStore.currentMessage).toBe('');
    expect(chatStore.isInputFocused).toBe(false);
    expect(chatStore.hasUnreadMessages).toBe(false);
  });
});
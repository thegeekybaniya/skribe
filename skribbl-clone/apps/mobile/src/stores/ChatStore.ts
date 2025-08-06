/**
 * @fileoverview Chat store for managing chat messages and input state
 * Handles message history, input management, and chat-related functionality
 * Requirements: 6.7 - MobX for reactive state management
 */

import { makeAutoObservable } from 'mobx';
import { ChatMessage } from '@skribbl-clone/types';
import type { RootStore } from './RootStore';

/**
 * ChatStore manages chat messages and input state
 * This includes message history, input handling, and chat functionality
 */
export class ChatStore {
  // List of all chat messages in the current room
  messages: ChatMessage[] = [];
  
  // Current message being typed by the user
  currentMessage: string = '';
  
  // Whether the chat input is focused
  isInputFocused: boolean = false;
  
  // Maximum number of messages to keep in memory (for performance)
  maxMessages: number = 100;
  
  // Whether there are unread messages
  hasUnreadMessages: boolean = false;

  constructor(private rootStore: RootStore) {
    // Make this store observable so React components can react to changes
    makeAutoObservable(this);
  }

  /**
   * Add a new message to the chat
   * Called when receiving a message from Socket.IO or sending a message
   */
  addMessage(message: ChatMessage) {
    this.messages.push(message);
    
    // Mark as unread if chat is not focused
    if (!this.isInputFocused) {
      this.hasUnreadMessages = true;
    }
    
    // Keep only the most recent messages for performance
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Update the current message being typed
   * Called when user types in the chat input
   */
  setCurrentMessage(message: string) {
    this.currentMessage = message;
  }

  /**
   * Clear the current message input
   * Called after sending a message
   */
  clearCurrentMessage() {
    this.currentMessage = '';
  }

  /**
   * Set the chat input focus state
   * Used for managing unread message indicators
   */
  setInputFocused(focused: boolean) {
    this.isInputFocused = focused;
    
    // Clear unread messages when chat is focused
    if (focused) {
      this.hasUnreadMessages = false;
    }
  }

  /**
   * Send the current message
   * Returns the message text and clears the input
   */
  sendMessage(): string | null {
    const messageText = this.currentMessage.trim();
    
    // Don't send empty messages
    if (!messageText) {
      return null;
    }
    
    // Don't allow drawer to send messages (to prevent hints)
    if (this.rootStore.gameStore.isCurrentPlayerDrawing) {
      return null;
    }
    
    this.clearCurrentMessage();
    return messageText;
  }

  /**
   * Check if the current message is valid to send
   * Message must not be empty and player must not be drawing
   */
  get canSendMessage(): boolean {
    const hasText = this.currentMessage.trim().length > 0;
    const isNotDrawing = !this.rootStore.gameStore.isCurrentPlayerDrawing;
    return hasText && isNotDrawing;
  }

  /**
   * Get the most recent messages (last 50)
   * Used for displaying chat history
   */
  get recentMessages(): ChatMessage[] {
    return this.messages.slice(-50);
  }

  /**
   * Get the number of unread messages
   * Used for displaying unread message count
   */
  get unreadMessageCount(): number {
    if (!this.hasUnreadMessages) {
      return 0;
    }
    
    // Count messages since last focus (simplified approach)
    return Math.min(this.messages.length, 10);
  }

  /**
   * Get messages from the current round only
   * Used for displaying round-specific chat
   */
  get currentRoundMessages(): ChatMessage[] {
    // This would need to be enhanced with round timestamps
    // For now, return recent messages
    return this.recentMessages;
  }

  /**
   * Check if there are any messages in the chat
   * Used for showing empty state
   */
  get hasMessages(): boolean {
    return this.messages.length > 0;
  }

  /**
   * Get the last message sent
   * Used for displaying recent activity
   */
  get lastMessage(): ChatMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  /**
   * Clear all messages from the chat
   * Called when starting a new game or leaving a room
   */
  clearMessages() {
    this.messages = [];
    this.hasUnreadMessages = false;
  }

  /**
   * Reset the chat store to initial state
   * Called when leaving a room or starting fresh
   */
  reset() {
    this.messages = [];
    this.currentMessage = '';
    this.isInputFocused = false;
    this.hasUnreadMessages = false;
  }
}
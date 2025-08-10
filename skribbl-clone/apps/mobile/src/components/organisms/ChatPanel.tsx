/**
 * @fileoverview ChatPanel organism component with message list and input functionality
 * 
 * This component provides a complete chat interface for players to communicate
 * and make guesses during the game. It includes a scrollable message list,
 * input field with validation, and special handling for correct guesses.
 * The component integrates with ChatStore for state management and Socket.IO for real-time messaging.
 * 
 * Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5 (chat and guessing system)
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../contexts/StoreContext';
// ChatMessage type will be used when implementing message filtering
import { ChatMessage } from '../molecules/ChatMessage';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';

// Props interface for the ChatPanel component
export interface ChatPanelProps {
  /** Custom styles for the panel container */
  style?: ViewStyle;
  /** Maximum number of messages to display */
  maxMessages?: number;
  /** Whether the chat input is disabled */
  disabled?: boolean;
  /** Callback when a message is sent */
  onSendMessage?: (message: string) => void;
}

/**
 * ChatPanel component - Complete chat interface for game communication
 * 
 * This organism component combines ChatMessage molecules with Input and Button atoms
 * to create a full-featured chat system. It handles message display, input validation,
 * auto-scrolling, and special indicators for correct guesses. The component prevents
 * the current drawer from sending messages to avoid giving hints.
 * 
 * @param props - Chat configuration and event handlers
 * @returns JSX element representing a complete chat interface
 */
export const ChatPanel: React.FC<ChatPanelProps> = observer(({
  style,
  maxMessages = 100,
  disabled = false,
  onSendMessage,
}) => {
  const { chatStore, playerStore, gameStore } = useStores();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Check if current player can send messages (drawers cannot send messages)
  const canSendMessages = !disabled && 
    !playerStore.currentPlayer?.isDrawing && 
    gameStore.isPlaying;

  /**
   * Handle sending a new message
   * Validates input and prevents empty messages
   */
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = inputValue.trim();
    
    // Validate message content
    if (!trimmedMessage) return;
    if (trimmedMessage.length > 100) {
      // Show error for too long messages
      return;
    }
    if (!canSendMessages) return;

    // Clear input and send message
    setInputValue('');
    onSendMessage?.(trimmedMessage);
    
    // Add message to local store (will be confirmed by server)
    chatStore.addMessage({
      id: `temp-${Date.now()}`,
      playerId: playerStore.currentPlayer?.id || '',
      playerName: playerStore.currentPlayer?.name || 'Unknown',
      message: trimmedMessage,
      isCorrectGuess: false, // Server will determine this
      timestamp: new Date(),
    });
  }, [inputValue, canSendMessages, onSendMessage, chatStore, playerStore]);

  /**
   * Handle input value changes with validation
   */
  const handleInputChange = useCallback((text: string) => {
    // Limit message length
    if (text.length <= 100) {
      setInputValue(text);
    }
  }, []);

  /**
   * Scroll to bottom when new messages arrive
   */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatStore.messages.length, scrollToBottom]);

  /**
   * Get placeholder text based on game state
   */
  const getInputPlaceholder = () => {
    if (!gameStore.isPlaying) return 'Game not started';
    if (playerStore.currentPlayer?.isDrawing) return 'You cannot chat while drawing';
    return 'Type your guess...';
  };

  /**
   * Get input error message if any
   */
  const getInputError = () => {
    if (inputValue.length > 100) return 'Message too long (max 100 characters)';
    return undefined;
  };

  // Get recent messages (limited by maxMessages)
  const displayMessages = chatStore.messages.slice(-maxMessages);

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Chat header */}
      <View style={styles.header}>
        <Text variant="subtitle" color="primary">
          Chat & Guesses
        </Text>
        <Text variant="caption" color="secondary">
          {displayMessages.length} messages
        </Text>
      </View>

      {/* Messages list */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessible={true}
        accessibilityLabel="Chat messages"
        accessibilityHint="Scroll to view more messages"
      >
        {displayMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="body" color="secondary" style={styles.emptyText}>
              No messages yet. Start guessing!
            </Text>
          </View>
        ) : (
          displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.playerId === playerStore.currentPlayer?.id}
              style={styles.messageItem}
            />
          ))
        )}
      </ScrollView>

      {/* Input area */}
      <View style={styles.inputContainer}>
        {/* Character counter */}
        <View style={styles.inputHeader}>
          <Text variant="caption" color="secondary">
            {inputValue.length}/100
          </Text>
          {!canSendMessages && (
            <Text variant="caption" color="error">
              {playerStore.currentPlayer?.isDrawing ? 
                'Cannot chat while drawing' : 
                'Chat disabled'
              }
            </Text>
          )}
        </View>

        {/* Input row */}
        <View style={styles.inputRow}>
          <Input
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder={getInputPlaceholder()}
            multiline={false}
            maxLength={100}
            editable={canSendMessages}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            style={styles.textInput}
            error={getInputError()}
            accessible={true}
            accessibilityLabel="Message input"
            accessibilityHint={canSendMessages ? 
              'Type your guess or message here' : 
              'Message input is disabled'
            }
          />
          
          <Button
            title="Send"
            variant={inputValue.trim() && canSendMessages ? 'primary' : 'disabled'}
            onPress={handleSendMessage}
            disabled={!inputValue.trim() || !canSendMessages}
            style={styles.sendButton}
          />
        </View>
      </View>

      {/* Game status indicator */}
      {gameStore.isPlaying && gameStore.currentWord && !playerStore.currentPlayer?.isDrawing && (
        <View style={styles.gameStatus}>
          <Text variant="caption" color="accent">
            💡 Guess the word! ({gameStore.currentWord.length} letters)
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
});

// Design system colors
const colors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  border: '#E5E5EA',
  shadow: '#000000',
  success: '#34C759',
  error: '#FF3B30',
};

// Styles for the ChatPanel component
const styles = StyleSheet.create({
  // Main container for the entire chat panel
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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

  // Header with title and message count
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },

  // Scrollable messages list
  messagesList: {
    flex: 1,
    maxHeight: 300, // Limit height to prevent taking too much space
  },

  // Content container for messages
  messagesContent: {
    padding: 8,
    flexGrow: 1,
  },

  // Empty state when no messages
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Empty state text
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Individual message item
  messageItem: {
    marginVertical: 2,
  },

  // Input container at the bottom
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
  },

  // Input header with counter and status
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  // Row containing input and send button
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  // Text input field
  textInput: {
    flex: 1,
  },

  // Send button
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
  },

  // Game status indicator
  gameStatus: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
});
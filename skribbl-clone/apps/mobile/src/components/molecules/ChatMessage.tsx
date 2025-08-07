/**
 * @fileoverview ChatMessage molecule component with sender info and timestamp
 * 
 * This component combines atoms (Text, Icon) to display chat messages
 * with sender information, timestamp, and special indicators for correct guesses.
 * It handles different message types and provides proper accessibility.
 * 
 * Requirements covered: 6.6 (atomic design), 8.1, 8.2 (accessibility)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';
import { ChatMessage as ChatMessageType } from '@skribbl-clone/types';

// Props interface for the ChatMessage component
export interface ChatMessageProps {
  /** Chat message data to display */
  message: ChatMessageType;
  /** Whether this message is from the current user */
  isCurrentUser?: boolean;
  /** Whether to show the timestamp */
  showTimestamp?: boolean;
  /** Custom styles for the message container */
  style?: ViewStyle;
}

/**
 * ChatMessage component - Displays a chat message with sender info and timestamp
 * 
 * This is a molecule component that combines Text and Icon atoms to show
 * chat messages with proper formatting, sender identification, and special
 * indicators for correct guesses. It provides different styling for different
 * message types and users.
 * 
 * @param props - Message data and display configuration
 * @returns JSX element representing a formatted chat message
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser = false,
  showTimestamp = true,
  style,
}) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      if (hours < 24) {
        return `${hours}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  // Get message container styles based on message type and user
  const getMessageStyles = () => {
    const baseStyles = [styles.container];
    
    if (message.isCorrectGuess) {
      baseStyles.push(styles.correctGuessContainer);
    } else if (isCurrentUser) {
      baseStyles.push(styles.currentUserContainer);
    } else {
      baseStyles.push(styles.otherUserContainer);
    }
    
    if (style) {
      baseStyles.push(style);
    }
    
    return baseStyles;
  };

  // Get text color based on message type
  const getMessageTextColor = () => {
    if (message.isCorrectGuess) return 'success';
    return 'primary';
  };

  // Get sender name color
  const getSenderNameColor = () => {
    if (message.isCorrectGuess) return 'success';
    if (isCurrentUser) return 'accent';
    return 'secondary';
  };

  // Get accessibility label for the message
  const getAccessibilityLabel = () => {
    const timeText = showTimestamp ? `, sent ${formatTimestamp(message.timestamp)}` : '';
    const guessText = message.isCorrectGuess ? ', correct guess' : '';
    const userText = isCurrentUser ? ', your message' : `, from ${message.playerName}`;
    
    return `Message: ${message.message}${userText}${guessText}${timeText}`;
  };

  const messageStyles = getMessageStyles();
  const messageTextColor = getMessageTextColor();
  const senderNameColor = getSenderNameColor();

  return (
    <View 
      style={messageStyles}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel()}
    >
      {/* Message header with sender name and correct guess indicator */}
      <View style={styles.headerRow}>
        <View style={styles.senderContainer}>
          <Text 
            variant="caption" 
            color={senderNameColor}
            bold={isCurrentUser}
            style={styles.senderName}
          >
            {isCurrentUser ? 'You' : message.playerName}
          </Text>
          
          {/* Correct guess indicator */}
          {message.isCorrectGuess && (
            <View style={styles.correctGuessIndicator}>
              <Icon 
                name="check"
                size="small"
                color="success"
              />
              <Text 
                variant="caption" 
                color="success"
                bold
                style={styles.correctGuessText}
              >
                Correct!
              </Text>
            </View>
          )}
        </View>

        {/* Timestamp */}
        {showTimestamp && (
          <Text 
            variant="caption" 
            color="secondary"
            style={styles.timestamp}
          >
            {formatTimestamp(message.timestamp)}
          </Text>
        )}
      </View>

      {/* Message content */}
      <View style={styles.messageContent}>
        <Text 
          variant="body" 
          color={messageTextColor}
          style={styles.messageText}
        >
          {message.message}
        </Text>
      </View>
    </View>
  );
};

// Design system colors - these would typically come from a theme file
const colors = {
  background: '#FFFFFF',
  backgroundCurrentUser: '#E3F2FD',
  backgroundOtherUser: '#F5F5F5',
  backgroundCorrectGuess: '#E8F5E8',
  border: '#E5E5EA',
  borderCurrentUser: '#2196F3',
  borderCorrectGuess: '#4CAF50',
  shadow: '#000000',
};

// Styles for the ChatMessage component following the design system
const styles = StyleSheet.create({
  // Main container for the chat message
  container: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 2,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow for iOS
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 1,
  },

  // Header row containing sender name and timestamp
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  // Container for sender name and correct guess indicator
  senderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Sender name text styling
  senderName: {
    marginRight: 8,
  },

  // Correct guess indicator container
  correctGuessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCorrectGuess,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Correct guess text styling
  correctGuessText: {
    marginLeft: 4,
  },

  // Timestamp text styling
  timestamp: {
    marginLeft: 8,
  },

  // Message content container
  messageContent: {
    marginTop: 2,
  },

  // Message text styling
  messageText: {
    lineHeight: 20,
  },

  // Current user message styling
  currentUserContainer: {
    backgroundColor: colors.backgroundCurrentUser,
    borderColor: colors.borderCurrentUser,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },

  // Other user message styling
  otherUserContainer: {
    backgroundColor: colors.backgroundOtherUser,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },

  // Correct guess message styling
  correctGuessContainer: {
    backgroundColor: colors.backgroundCorrectGuess,
    borderColor: colors.borderCorrectGuess,
    borderWidth: 2,
    alignSelf: 'center',
    maxWidth: '90%',
  },
});
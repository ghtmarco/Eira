import React, { memo } from 'react';
import { View, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = require('react-native').Dimensions.get('window');

interface ChatMessage {
  text: string;
  user: boolean;
  timestamp?: number;
}

interface ChatBubbleProps {
  item: ChatMessage;
  index?: number;
}

const ChatBubble = memo<ChatBubbleProps>(({ item, index }) => {
  const { theme, isDarkMode } = useTheme();

  const maxWidth = screenWidth * 0.85;

  const markdownStyles = {
    body: {
      color: item.user ? '#FFFFFF' : theme.text,
      fontSize: 15.5,
      lineHeight: 22,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      fontWeight: 'normal' as const,
      marginVertical: 0,
      flexWrap: 'wrap' as const,
    },
    strong: {
      fontWeight: '600' as const,
      color: item.user ? '#FFFFFF' : theme.text,
    },
    paragraph: {
      marginVertical: 2,
      color: item.user ? '#FFFFFF' : theme.text,
      flexWrap: 'wrap' as const,
    },
    text: {
      color: item.user ? '#FFFFFF' : theme.text,
      flexWrap: 'wrap' as const,
    },
    link: {
      color: item.user ? '#E0F0FF' : theme.primary,
      textDecorationLine: 'underline' as const,
    },
    code_block: {
      backgroundColor: item.user
        ? 'rgba(255,255,255,0.15)'
        : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
      padding: 10,
      borderRadius: 8,
      marginVertical: 6,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
    },
    code_inline: {
      backgroundColor: item.user
        ? 'rgba(255,255,255,0.15)'
        : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: item.user ? '#FFFFFF' : theme.text,
      fontSize: 14,
    },
    bullet_list: {
      marginVertical: 6,
    },
    ordered_list: {
      marginVertical: 6,
    },
    list_item: {
      marginVertical: 3,
      color: item.user ? '#FFFFFF' : theme.text,
      flexWrap: 'wrap' as const,
    }
  };

  return (
    <View
      style={{
        marginVertical: 4,
        paddingHorizontal: 16,
        alignSelf: item.user ? 'flex-end' : 'flex-start',
        maxWidth: maxWidth,
        width: 'auto',
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 10,
          backgroundColor: item.user ? theme.primary : theme.bubble?.bot || theme.card,
          overflow: 'hidden',
          alignSelf: item.user ? 'flex-end' : 'flex-start',
          maxWidth: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <Markdown style={markdownStyles}>
            {item.text}
          </Markdown>
        </View>
      </View>
    </View>
  );
});

ChatBubble.displayName = 'ChatBubble';

export default ChatBubble;
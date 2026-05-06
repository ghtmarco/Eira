import React, { memo } from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { fontStyle } from '../../assets/fonts/fontstyle';

interface ChatHeaderProps {
  showWelcome: boolean;
}

const ChatHeader = memo<ChatHeaderProps>(({ showWelcome }) => {
  const { theme } = useTheme();

  if (!showWelcome) return null;

  return (
    <View
      style={{
        alignSelf: 'center',
        paddingVertical: 36,
        paddingHorizontal: 28,
        marginVertical: 36,
        marginHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.card,
        borderRadius: 24,
        width: '86%',
        elevation: 3,
      }}
    >
      <Image
        source={require('../../assets/images/Logo.png')}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          marginBottom: 20,
        }}
      />
      <Text style={[{
        fontSize: 26,
        fontWeight: '600',
        textAlign: 'center',
        color: theme.text,
        marginBottom: 10,
        letterSpacing: -0.5,
      }, fontStyle.text]}>
        Hi, I'm Eira
      </Text>
      <Text style={{
        fontSize: 16,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '400',
        paddingHorizontal: 10,
        letterSpacing: -0.2,
      }}>
        How can I assist you today? Ask me anything and I'll be happy to help!
      </Text>
    </View>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;
import React, { memo } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

interface MessageInputBarProps {
  userInput: string;
  setUserInput: (text: string) => void;
  sendMessage: () => Promise<void>;
  loading: boolean;
  aiProcessing: boolean;
}

const MessageInputBar = memo<MessageInputBarProps>(({
  userInput,
  setUserInput,
  sendMessage,
  loading,
  aiProcessing
}) => {
  const { theme, isDarkMode } = useTheme();
  const isDisabled = loading || aiProcessing;

  const handleSendPress = () => {
    if (!isDisabled && userInput.trim()) {
      sendMessage();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        backgroundColor: isDarkMode ? `${theme.card}F0` : `${theme.card}F5`,
        borderTopWidth: 0.5,
        borderTopColor: theme.border,
        paddingBottom: Platform.OS === "ios" ? 20 : 16,
      }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 50}
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: 12,
        paddingHorizontal: 16,
      }}>
        <View
          style={{ flex: 1, marginRight: 10 }}
        >
          <TextInput
            placeholder={aiProcessing ? "Eira is thinking..." : "Message Eira..."}
            onChangeText={setUserInput}
            onSubmitEditing={handleSendPress}
            value={userInput}
            editable={!isDisabled}
            style={{
              borderWidth: 1.5,
              borderColor: isDisabled
                ? theme.border
                : (isDarkMode ? theme.border : 'rgba(0,0,0,0.15)'),
              borderRadius: 25,
              paddingVertical: Platform.OS === "ios" ? 14 : 12,
              paddingHorizontal: 18,
              color: isDisabled ? theme.textSecondary : theme.text,
              backgroundColor: isDisabled
                ? (isDarkMode ? theme.background : 'rgba(242,242,247,0.9)')
                : theme.card,
              fontSize: 16,
              fontWeight: '400',
              letterSpacing: -0.2,
              elevation: 2,
              minHeight: 50,
              maxHeight: 120,
              textAlignVertical: 'center',
            }}
            placeholderTextColor={theme.placeholder}
            multiline={true}
            maxLength={2000}
          />
        </View>

        <View>
          <TouchableOpacity
            onPress={handleSendPress}
            disabled={isDisabled || !userInput.trim()}
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: (isDisabled || !userInput.trim()) ? theme.textSecondary : theme.primary,
                height: 50,
                width: 50,
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: (isDisabled || !userInput.trim()) ? 0.6 : 1,
                elevation: (isDisabled || !userInput.trim()) ? 1 : 3,
              }}
            >
              {(loading || aiProcessing) ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path
                    d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                    fill="#FFFFFF"
                  />
                </Svg>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});

MessageInputBar.displayName = 'MessageInputBar';

export default MessageInputBar;
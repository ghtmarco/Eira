import { View, FlatList, SafeAreaView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useCallback, JSX } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFocusEffect, useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { StackNavigationProp } from '@react-navigation/stack'

import ChatBubble from '../components/chat/ChatBubble'
import MessageInputBar from '../components/chat/MessageInputBar'
import ChatHeader from '../components/chat/ChatHeader'
import { useChatLogic } from '../hooks/useChatLogic'
import { useTheme } from '../contexts/ThemeContext'

interface ChatMessage {
  text: string;
  user: boolean;
  timestamp?: number;
}

type RootStackParamList = {
  Home: { chatId?: string | null; newChatTrigger?: number };
  History: undefined;
};

const HomeScreen = (): JSX.Element => {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'Home'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const {
    messages,
    userInput,
    loading,
    aiProcessing,
    flatListRef,
    setUserInput,
    updateChatId,
    handleNewChat,
    fetchChatById,
    scrollToBottom,
    sendMessage,
  } = useChatLogic({ route, navigation });

  useEffect(() => {
    const paramsChatId = route.params?.chatId;
    if (paramsChatId) {
      updateChatId(paramsChatId);
    }
  }, [route.params, updateChatId]);

  useEffect(() => {
    if (route.params?.newChatTrigger) {
      handleNewChat();
    }
  }, [route.params?.newChatTrigger, handleNewChat]);

  useFocusEffect(
    useCallback(() => {
      fetchChatById();
    }, [fetchChatById])
  );

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const ListHeader = useCallback(() =>
    messages.length === 0 ? <ChatHeader showWelcome={true} /> : null,
  [messages.length]);

  const renderChatBubble = useCallback(({ item, index }: { item: ChatMessage; index: number }) => (
    <ChatBubble item={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: ChatMessage, index: number) =>
    `${item.timestamp || index}-${index}`, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <StatusBar
        style={theme.statusBarStyle}
        backgroundColor={theme.navbar}
        translucent={false}
      />
      <LinearGradient
        colors={theme.gradient}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <FlatList
              ListHeaderComponent={ListHeader}
              data={messages}
              ref={flatListRef}
              renderItem={renderChatBubble}
              keyExtractor={keyExtractor}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                paddingHorizontal: 8,
                paddingBottom: 10
              }}
              contentContainerStyle={{
                paddingTop: messages.length > 0 ? 12 : 0,
                paddingBottom: 24,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              windowSize={10}
              initialNumToRender={15}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              disableVirtualization={false}
              scrollEventThrottle={16}
              decelerationRate="normal"
            />

            <MessageInputBar
              userInput={userInput}
              setUserInput={setUserInput}
              sendMessage={sendMessage}
              loading={loading}
              aiProcessing={aiProcessing}
            />
          </View>
        </GestureHandlerRootView>
      </LinearGradient>
    </SafeAreaView>
  )
}

export default HomeScreen
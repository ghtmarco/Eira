import { View, Text, ActivityIndicator, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItem } from 'react-native'
import React, { useEffect, useState, useCallback, useRef, JSX } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFocusEffect, useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Markdown from 'react-native-markdown-display'
import Svg, { Path } from "react-native-svg"
import Animated, { FadeInDown, FadeInUp, SlideInLeft, SlideInRight } from 'react-native-reanimated'
import axios, { AxiosError } from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from 'react-native-toast-message'
import Constants from 'expo-constants'
import { fontStyle } from '../assets/fonts/fontstyle'

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users/chats`;

interface ChatMessage {
  text: string;
  user: boolean;
}

interface ApiChatMessage {
  message: string;
  sender: "user" | "bot";
}

interface ChatDocument {
  _id: string;
  userId: string;
  messages: ApiChatMessage[];
}

interface ChatPostResponse {
  chatId?: string;
  message?: string;
}

interface ChatBubbleProps {
  item: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ item }) => (
  <Animated.View
    style={[
      {
        marginVertical: 8,
        paddingHorizontal: 16,
        paddingVertical: 10, 
        borderRadius: 15,
        maxWidth: '80%',
        alignSelf: item.user ? 'flex-end' : 'flex-start',
        backgroundColor: item.user ? '#0081E4' : '#E2E2E2',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    ]}
    entering={
      item.user
        ? SlideInRight.duration(500)
        : SlideInLeft.duration(500)
    }
  >
    <Markdown
      style={{
        body: {
          color: item.user ? '#FFFFFF' : '#000000',
        },
        strong: {
          fontWeight: 'bold',
        },
        paragraph: {
          alignSelf: 'center',
        },
      }}
    >
      {item.text}
    </Markdown>
  </Animated.View>
);

interface ChatHeaderProps {
  showWelcome: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ showWelcome }) => {
  return (
    <>
      {showWelcome && (
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={{
            alignSelf: 'center',
            paddingVertical: 40,
            paddingHorizontal: 20,
            marginVertical: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 15,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}
        >
          <Text style={[{ fontSize: 30, fontWeight: 'bold', textAlign: 'center' }, fontStyle.text]}>
            Hi, How can I help you? {'\u{1F60A}'}
          </Text>
        </Animated.View>
      )}
    </>
  );
};

type RootStackParamList = {
  Home: { chatId?: string | null; newChatTrigger?: number };
};

interface MessageInputBarProps {
  userInput: string;
  setUserInput: (text: string) => void;
  sendMessage: () => Promise<void>;
  loading: boolean;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({ userInput, setUserInput, sendMessage, loading }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{}}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 10}}>
        <Animated.View
          style={{ flex: 1, marginHorizontal: 8 }}
          entering={FadeInDown.duration(500)}
        >
          <TextInput
            placeholder="Ask me anything..."
            onChangeText={setUserInput}
            onSubmitEditing={sendMessage}
            value={userInput}
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 30,
              padding: 16,
              color: 'black',
              backgroundColor: '#FFFFFF',
              fontSize: 16,
            }}
            placeholderTextColor="#A0A0A0"
            numberOfLines={1}
            multiline={false}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <TouchableOpacity onPress={sendMessage}>
            <View
              style={{
                backgroundColor: '#0081E4',
                height: 50,
                width: 50,
                borderRadius: 9999,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Path
                    d="M2 21l21-9L2 3v7l15 2-15 2z"
                    fill="#FFFFFF"
                  />
                </Svg>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const HomeScreen = (): JSX.Element => {
  const route = useRoute<RouteProp<RootStackParamList, 'Home'>>();
  const initialChatId = route.params?.chatId || null;
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0);
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setKey(prevKey => prevKey + 1)
    }, [])
  )

  useEffect(() => {
    const paramsChatId = route.params?.chatId;
    if (paramsChatId) {
      setChatId(paramsChatId);
    }
  }, [route.params]);

  useEffect(() => {
    if (route.params?.newChatTrigger) {
      handleNewChat();
    }
  }, [route.params?.newChatTrigger]);

  useFocusEffect(
    useCallback(() => {
      const fetchChatById = async () => {
        if (!chatId) {
          setMessages([])
          return
        }
        setLoading(true)
        try {
          const response = await axios.get<ChatDocument>(`${PAGE_URL}/${chatId}`);
          const chatDoc = response.data;
          if (chatDoc && chatDoc.messages) {
            const fetchedMessages: ChatMessage[] = chatDoc.messages.map((msg: ApiChatMessage) => ({
              text: msg.message,
              user: msg.sender === "user",
            }));
            setMessages(fetchedMessages);
          }
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response && axiosError.response.status === 404) {
            setChatId(null);
            setMessages([]);
          } else {
            console.error("Fetch chat error:", error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load chat history.' });
          }
        } finally {
          setLoading(false)
        }
      }

      fetchChatById()
    }, [chatId])
  )

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return
    const newPrompt = userInput
    setUserInput("")
    setLoading(true)
    try {
      const userId = await AsyncStorage.getItem("id");
      setMessages(prev => [...prev, { text: newPrompt, user: true }]);
      const userResponse = await axios.post<ChatPostResponse>(PAGE_URL, {
        userId,
        chatId,
        message: newPrompt,
        sender: "user"
      })
      if (!chatId && userResponse.data.chatId) {
        setChatId(userResponse.data.chatId)
      }

      const instruction = "Eira, you are a supportive AI companion for mental well-being. Your goal is to offer empathetic conversations and general guidance. Remind users you are not a substitute for professional therapy. If a topic seems beyond general support, gently suggest they consult a healthcare professional. Maintain a calm, non-judgmental tone.";
      const historyForBackend = messages.slice(0, -1);

      const aiApiResponse = await axios.post<{ generatedText: string }>(
        `${SERVER_URL}/api/ai/generate-response`,
        {
          prompt: newPrompt,
          history: historyForBackend,
          instruction
        }
      );
      const text = aiApiResponse.data.generatedText;

      setMessages(prev => [...prev, { text, user: false }]);
      await axios.post<ChatPostResponse>(PAGE_URL, {
        userId,
        chatId: chatId || userResponse.data.chatId,
        message: text,
        sender: "bot"
      })
    } catch (err) {
      console.error("AI Error:", err);
      Toast.show({ type: 'error', text1: 'Message Error', text2: 'Could not send message.' });
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setKey(prev => prev + 1)
    setChatId(null)
    setMessages([])
    navigation.setParams({ chatId: null });
    Toast.show({ text1: "New Chat", text2: "Created new chat successfully", type: "success", position: "bottom" });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <View key={key} style={{ flex: 1, padding: 4, backgroundColor: '#E3E3E3' }}>
          <ChatHeader
            showWelcome={!loading && !chatId && messages.length === 0}
          />
          <FlatList
            ListHeaderComponent={() => {
              if (loading && chatId && messages.length === 0) {
                return (
                  <View style={{ height: 360, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#0081E4" />
                  </View>
                );
              }
              return null;
            }}
            data={messages}
            ref={flatListRef}
            renderItem={({ item }) => <ChatBubble item={item} />}
            keyExtractor={(item, index) => index.toString()}
            style={{ flex: 1, backgroundColor: '#E3E3E3', padding: 4, paddingTop: 70 }}
            showsVerticalScrollIndicator={false}
          />

          <MessageInputBar
            userInput={userInput}
            setUserInput={setUserInput}
            sendMessage={sendMessage}
            loading={loading}
          />
        </View>
    </GestureHandlerRootView>
  )
}

export default HomeScreen

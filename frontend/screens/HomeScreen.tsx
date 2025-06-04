import { View, Text, ActivityIndicator, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItem, StatusBar, SafeAreaView, Image } from 'react-native'
import React, { useEffect, useState, useCallback, useRef, JSX } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFocusEffect, useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
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

// Theme colors
const THEME = {
  primary: '#007AFF',  // iOS blue
  secondary: '#FF3B30', // iOS red
  tertiary: '#34C759', // iOS green
  background: '#F7F7F7', // iOS light background
  card: '#FFFFFF',
  text: '#111111', // Darker text for better contrast
  textSecondary: '#8E8E93', // iOS secondary text
  placeholder: '#C7C7CC', // iOS placeholder text
  bubble: {
    user: '#007AFF', // iOS blue
    bot: '#F2F2F7',  // iOS light gray
  },
  navbar: '#FFFFFF',
  shadow: {
    color: '#000000',
    opacity: 0.08,
  }
};

// Interfaces
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

type RootStackParamList = {
  Home: { chatId?: string | null; newChatTrigger?: number };
  History: undefined;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ item }) => (
  <Animated.View
    style={[
      {
        marginVertical: 8,
        paddingHorizontal: 16,
        paddingVertical: 12, 
        borderRadius: 18,
        borderTopLeftRadius: item.user ? 18 : 4,
        borderTopRightRadius: item.user ? 4 : 18,
        maxWidth: '80%',
        alignSelf: item.user ? 'flex-end' : 'flex-start',
        backgroundColor: item.user ? 'transparent' : THEME.bubble.bot,
        shadowColor: THEME.shadow.color,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        overflow: 'hidden',
      },
    ]}
    entering={
      item.user
        ? SlideInRight.duration(350).springify().damping(12)
        : SlideInLeft.duration(350).springify().damping(12)
    }
  >
    {item.user && (
      <LinearGradient
        colors={['#0A84FF', '#007AFF']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />
    )}
    <Markdown
      style={{
        body: {
          color: item.user ? '#FFFFFF' : THEME.text,
          fontSize: 15.5,
          lineHeight: 21,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
          fontWeight: '400',
        },
        strong: {
          fontWeight: '600',
        },
        paragraph: {
          marginVertical: 2,
        },
        link: {
          color: item.user ? '#E0F0FF' : '#007AFF',
          textDecorationLine: 'underline',
        },
        code_block: {
          backgroundColor: item.user ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)',
          padding: 10,
          borderRadius: 8,
          marginVertical: 6,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        },
        code_inline: {
          backgroundColor: item.user ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)',
          borderRadius: 4,
          paddingHorizontal: 4,
          paddingVertical: 1,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        },
        bullet_list: {
          marginVertical: 6,
        },
        ordered_list: {
          marginVertical: 6,
        },
        list_item: {
          marginVertical: 3,
        }
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
          entering={FadeInUp.delay(200).duration(500).springify().damping(14)}
          style={{
            alignSelf: 'center',
            paddingVertical: 36,
            paddingHorizontal: 28,
            marginVertical: 36,
            marginHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            width: '86%',
          }}
        >
          <Image
            source={require('../assets/images/Logo.png')}
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              marginBottom: 20,
              shadowColor: THEME.shadow.color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
            }}
          />
          <Text style={[{ 
            fontSize: 26, 
            fontWeight: '600', 
            textAlign: 'center',
            color: '#000000',
            marginBottom: 10,
            letterSpacing: -0.5,
          }, fontStyle.text]}>
            Hi, I'm Eira
          </Text>
          <Text style={{
            fontSize: 16,
            color: THEME.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            fontWeight: '400',
            paddingHorizontal: 10,
            letterSpacing: -0.2,
          }}>
            How can I assist you today? Ask me anything and I'll be happy to help!
          </Text>
        </Animated.View>
      )}
    </>
  );
};

interface MessageInputBarProps {
  userInput: string;
  setUserInput: (text: string) => void;
  sendMessage: () => Promise<void>;
  loading: boolean;
  aiProcessing: boolean;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({ userInput, setUserInput, sendMessage, loading, aiProcessing }) => {
  const isDisabled = loading || aiProcessing;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.95)', 
        borderTopWidth: 0.5, 
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingBottom: Platform.OS === "ios" ? 4 : 2,
      }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 12,
        paddingHorizontal: 16,
      }}>
        <Animated.View
          style={{ flex: 1, marginRight: 10 }}
          entering={FadeInDown.duration(400).springify()}
        >
          <TextInput
            placeholder={aiProcessing ? "Eira is thinking..." : "Message Eira..."}
            onChangeText={setUserInput}
            onSubmitEditing={sendMessage}
            value={userInput}
            editable={!isDisabled}
            style={{
              borderWidth: 1.5,
              borderColor: isDisabled ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.15)',
              borderRadius: 25,
              paddingVertical: Platform.OS === "ios" ? 14 : 12,
              paddingHorizontal: 18,
              color: isDisabled ? THEME.textSecondary : THEME.text,
              backgroundColor: isDisabled ? 'rgba(242,242,247,0.9)' : THEME.card,
              fontSize: 16,
              fontWeight: '400',
              letterSpacing: -0.2,
              shadowColor: THEME.shadow.color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDisabled ? 0.03 : 0.06,
              shadowRadius: 4,
              elevation: 2, // For Android shadow
              minHeight: 50, // Ensure consistent height
            }}
            placeholderTextColor={THEME.placeholder}
            numberOfLines={1}
            multiline={true}
            maxLength={500}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <TouchableOpacity 
            onPress={sendMessage} 
            disabled={isDisabled} 
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: isDisabled ? THEME.textSecondary : THEME.primary,
                height: 50,
                width: 50,
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: isDisabled ? THEME.textSecondary : THEME.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDisabled ? 0.2 : 0.4,
                shadowRadius: 3,
                opacity: isDisabled ? 0.7 : 1,
                transform: [{ rotate: '0deg' }], // For smooth animation
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
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
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
            Toast.show({ 
              type: 'error', 
              text1: 'Couldn\'t Load Chat', 
              text2: 'Please check your connection and try again.', 
              position: 'bottom',
              visibilityTime: 3000,
            });
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

      // Prepare conversation history for the AI backend
      const currentMessages = [...messages, { text: newPrompt, user: true }];
      const historyForBackend = currentMessages.slice(0, -1); // Exclude the current message
      
      // Add system instruction as the first message if this is a new conversation
      let fullPrompt = newPrompt;
      if (historyForBackend.length === 0) {
        fullPrompt = `You are Eira, a supportive AI companion for mental well-being. Your goal is to offer empathetic conversations and general guidance. You should:

- Be empathetic, understanding, and non-judgmental
- Provide emotional support and general wellness tips
- Remind users you're not a substitute for professional therapy
- If topics seem beyond general support, gently suggest consulting a healthcare professional
- Maintain a calm, supportive tone
- Ask follow-up questions to show genuine interest
- Provide practical coping strategies when appropriate

Please respond to: ${newPrompt}`;
      }

      let text: string;
      
      // Show AI processing indicator
      setAiProcessing(true);
      
      // Add a temporary "AI is thinking" message
      const thinkingMessage = { text: "✨ Eira is thinking...", user: false };
      setMessages(prev => [...prev, thinkingMessage]);
      
      try {
        const aiApiResponse = await axios.post<{ generatedText: string; success?: boolean }>(
          `${SERVER_URL}/api/ai/generate-response`,
          {
            prompt: fullPrompt,
            chatId: chatId || userResponse.data.chatId,
            history: historyForBackend
          },
          {
            timeout: 30000, // 30 second timeout
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (aiApiResponse.data.success === false) {
          throw new Error('AI service returned error status');
        }
        
        text = aiApiResponse.data.generatedText || "I apologize, but I'm having trouble processing your message right now. Please try again.";
      } catch (aiError) {
        console.warn("AI API error:", aiError);
        
        // Check if it's a network/server error
        const error = aiError as AxiosError;
        const isNetworkError = error.code === 'ECONNREFUSED' || 
                              error.code === 'ENOTFOUND' || 
                              (error.response?.status && error.response.status >= 500);
        
        if (isNetworkError) {
          text = "I'm currently experiencing some technical difficulties connecting to my AI system. Your message is important to me, and I want to help. While I work to resolve this issue, please remember that if you're dealing with urgent mental health concerns, consider reaching out to a mental health professional or crisis hotline. Please try sending your message again in a moment.";
        } else {
          // API-specific errors (rate limiting, safety filters, etc.)
          text = "I understand you're reaching out, and I appreciate you sharing with me. I'm experiencing some technical challenges right now, but I'm here to support you. If you're dealing with immediate mental health concerns, please don't hesitate to contact a mental health professional or crisis support service. Let's try continuing our conversation in a moment.";
        }
        
        Toast.show({
          type: 'info',
          text1: 'AI Service Notice',
          text2: 'Using fallback response due to technical issues.',
          position: 'bottom',
          visibilityTime: 4000,
        });
      }

      // Clear AI processing indicator
      setAiProcessing(false);

      // Remove the "thinking" message and add the actual AI response
      setMessages(prev => {
        const withoutThinking = prev.slice(0, -1); // Remove the "thinking" message
        return [...withoutThinking, { text, user: false }];
      });
      await axios.post<ChatPostResponse>(PAGE_URL, {
        userId,
        chatId: chatId || userResponse.data.chatId,
        message: text,
        sender: "bot"
      })
    } catch (err) {
      console.error("General Error:", err);
      Toast.show({ 
        type: 'error', 
        text1: 'Message Not Sent', 
        text2: 'Unable to send your message. Please try again.', 
        position: 'bottom',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setAiProcessing(false);
    }
  }

  const handleNewChat = () => {
    setKey(prev => prev + 1)
    setChatId(null)
    setMessages([])
    navigation.setParams({ chatId: null });
    Toast.show({ 
      text1: "New Conversation", 
      text2: "Started a fresh conversation", 
      type: "success", 
      position: "bottom",
      visibilityTime: 2000,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.navbar} />
      <LinearGradient
        colors={['#F8F8F8', '#F4F6F8', '#F7F7F7']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View key={key} style={{ flex: 1 }}>
            
            <ChatHeader
              showWelcome={!loading && !chatId && messages.length === 0}
            />
            
            <FlatList            ListHeaderComponent={() => {
              if (loading && chatId && messages.length === 0) {
                return (
                  <View style={{ 
                    height: 300, 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                  }}>
                    <ActivityIndicator size="large" color={THEME.primary} />
                    <Text style={{ 
                      marginTop: 16, 
                      color: THEME.textSecondary,
                      fontSize: 14,
                      fontWeight: '400'
                    }}>
                      Loading conversation...
                    </Text>
                  </View>
                );
              }
              return null;
            }}
              data={messages}
              ref={flatListRef}
              renderItem={({ item }) => <ChatBubble item={item} />}
              keyExtractor={(item, index) => index.toString()}
              style={{ 
                flex: 1, 
                backgroundColor: 'transparent', 
                paddingHorizontal: 14,
                paddingBottom: 10
              }}
              contentContainerStyle={{
                paddingTop: messages.length > 0 ? 12 : 0,
                paddingBottom: 24,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={15}
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

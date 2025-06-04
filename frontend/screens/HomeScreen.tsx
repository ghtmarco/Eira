import { View, Text, ActivityIndicator, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItem, SafeAreaView, Image, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
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
import { useTheme } from '../contexts/ThemeContext'

const { width: screenWidth } = Dimensions.get('window');

// Database server URL from .env
const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users/chats`;
const AI_URL: string = `${SERVER_URL}/api/ai/generate-response`;

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

interface AIResponse {
  generatedText?: string;
  success: boolean;
  message?: string;
  error?: string;
}

interface ChatBubbleProps {
  item: ChatMessage;
}

type RootStackParamList = {
  Home: { chatId?: string | null; newChatTrigger?: number };
  History: undefined;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ item }) => {
  const { theme, isDarkMode } = useTheme();
  
  // Calculate dynamic width based on content length and screen size
  const maxBubbleWidth = screenWidth * 0.8; // 80% of screen width
  const minBubbleWidth = screenWidth * 0.3; // 30% of screen width
  
  return (
    <Animated.View
      style={{
        marginVertical: 6,
        paddingHorizontal: 16,
        alignSelf: item.user ? 'flex-end' : 'flex-start',
        maxWidth: maxBubbleWidth,
        minWidth: minBubbleWidth,
      }}
      entering={
        item.user
          ? SlideInRight.duration(350).springify().damping(12)
          : SlideInLeft.duration(350).springify().damping(12)
      }
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 20,
          borderTopLeftRadius: item.user ? 20 : 6,
          borderTopRightRadius: item.user ? 6 : 20,
          backgroundColor: item.user ? 'transparent' : theme.bubble.bot,
          shadowColor: theme.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.shadow.opacity,
          shadowRadius: 4,
          elevation: 3,
          overflow: 'hidden',
        }}
      >
        {item.user && (
          <LinearGradient
            colors={isDarkMode ? ['#0A84FF', '#1E90FF'] : ['#0A84FF', '#007AFF']}
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
              color: item.user ? '#FFFFFF' : theme.text,
              fontSize: 15.5,
              lineHeight: 22,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
              fontWeight: '400',
              marginVertical: 0,
            },
            strong: {
              fontWeight: '600',
              color: item.user ? '#FFFFFF' : theme.text,
            },
            paragraph: {
              marginVertical: 2,
              color: item.user ? '#FFFFFF' : theme.text,
              flexWrap: 'wrap',
            },
            text: {
              color: item.user ? '#FFFFFF' : theme.text,
              flexWrap: 'wrap',
            },
            link: {
              color: item.user ? '#E0F0FF' : theme.primary,
              textDecorationLine: 'underline',
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
              flexWrap: 'wrap',
            }
          }}
        >
          {item.text}
        </Markdown>
      </View>
    </Animated.View>
  );
};

interface ChatHeaderProps {
  showWelcome: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ showWelcome }) => {
  const { theme } = useTheme();
  
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
            backgroundColor: theme.card,
            borderRadius: 24,
            shadowColor: theme.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.shadow.opacity,
            shadowRadius: 8,
            width: '86%',
            elevation: 3,
          }}
        >
          <Image
            source={require('../assets/images/Logo.png')}
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              marginBottom: 20,
              shadowColor: theme.shadow.color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
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
  const { theme, isDarkMode } = useTheme();
  const isDisabled = loading || aiProcessing;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ 
        backgroundColor: isDarkMode ? `${theme.card}F0` : `${theme.card}F5`, 
        borderTopWidth: 0.5, 
        borderTopColor: theme.border,
        paddingBottom: Platform.OS === "ios" ? 4 : 2,
      }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'flex-end', 
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
              shadowColor: theme.shadow.color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDisabled ? 0.03 : theme.shadow.opacity,
              shadowRadius: 4,
              elevation: 2,
              minHeight: 50,
              maxHeight: 120,
              textAlignVertical: 'center',
            }}
            placeholderTextColor={theme.placeholder}
            multiline={true}
            maxLength={2000}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <TouchableOpacity 
            onPress={sendMessage} 
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
                shadowColor: (isDisabled || !userInput.trim()) ? theme.textSecondary : theme.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: (isDisabled || !userInput.trim()) ? 0.2 : 0.4,
                shadowRadius: 3,
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
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const HomeScreen = (): JSX.Element => {
  const { theme, isDarkMode } = useTheme();
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
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return
    const newPrompt = userInput.trim()
    setUserInput("")
    setLoading(true)
    
    try {
      const userId = await AsyncStorage.getItem("id");
      setMessages(prev => [...prev, { text: newPrompt, user: true }]);
      
      // Save user message to database
      const userResponse = await axios.post<ChatPostResponse>(PAGE_URL, {
        userId,
        chatId,
        message: newPrompt,
        sender: "user"
      })
      
      if (!chatId && userResponse.data.chatId) {
        setChatId(userResponse.data.chatId)
      }

      const currentMessages = [...messages, { text: newPrompt, user: true }];
      const historyForBackend = currentMessages.slice(0, -1);
      
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

      setAiProcessing(true);
      
      const thinkingMessage = { text: "✨ Eira is thinking...", user: false };
      setMessages(prev => [...prev, thinkingMessage]);
      
      try {
        // Use backend AI route instead of calling Gemini API directly
        const aiApiResponse = await axios.post<AIResponse>(
          AI_URL,
          {
            prompt: fullPrompt,
            chatId: chatId || userResponse.data.chatId,
            history: historyForBackend
          },
          {
            timeout: 45000,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (!aiApiResponse.data.success || !aiApiResponse.data.generatedText) {
          throw new Error(aiApiResponse.data.message || 'AI service returned empty response');
        }
        
        var text = aiApiResponse.data.generatedText;
        
      } catch (aiError) {
        console.warn("Backend AI API error:", aiError);
        
        const error = aiError as AxiosError<AIResponse>;
        const isNetworkError = error.code === 'ECONNREFUSED' || 
                              error.code === 'ENOTFOUND' || 
                              error.code === 'ETIMEDOUT' ||
                              (error.response?.status && error.response.status >= 500);
        
        if (isNetworkError) {
          text = "I'm currently experiencing some technical difficulties connecting to my AI system. Your message is important to me, and I want to help. While I work to resolve this issue, please remember that if you're dealing with urgent mental health concerns, consider reaching out to a mental health professional or crisis hotline. Please try sending your message again in a moment.";
        } else {
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

      setAiProcessing(false);

      setMessages(prev => {
        const withoutThinking = prev.slice(0, -1);
        return [...withoutThinking, { text, user: false }];
      });

      // Save AI response to database
      await axios.post<ChatPostResponse>(PAGE_URL, {
        userId,
        chatId: chatId || userResponse.data.chatId,
        message: text,
        sender: "bot"
      })

    } catch (err) {
      console.error("General Error:", err);
      setAiProcessing(false);
      
      // Remove thinking message if it exists
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.text === "✨ Eira is thinking...") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      Toast.show({ 
        type: 'error', 
        text1: 'Message Not Sent', 
        text2: 'Unable to send your message. Please try again.', 
        position: 'bottom',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
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
          <View key={key} style={{ flex: 1 }}>
            
            <ChatHeader
              showWelcome={!loading && !chatId && messages.length === 0}
            />
            
            <FlatList            
              ListHeaderComponent={() => {
                if (loading && chatId && messages.length === 0) {
                  return (
                    <View style={{ 
                      height: 300, 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}>
                      <ActivityIndicator size="large" color={theme.primary} />
                      <Text style={{ 
                        marginTop: 16, 
                        color: theme.textSecondary,
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
                paddingHorizontal: 8,
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
              removeClippedSubviews={true}
              getItemLayout={(data, index) => ({
                length: 80, // Approximate height
                offset: 80 * index,
                index,
              })}
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
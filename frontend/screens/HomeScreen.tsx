import { View, Text, ActivityIndicator, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItem, SafeAreaView, Image, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState, useCallback, useRef, JSX } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFocusEffect, useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { StackNavigationProp } from '@react-navigation/stack'
import Markdown from 'react-native-markdown-display'
import Svg, { Path } from "react-native-svg"
import axios, { AxiosError } from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from 'react-native-toast-message'
import Constants from 'expo-constants'
import { fontStyle } from '../assets/fonts/fontstyle'
import { useTheme } from '../contexts/ThemeContext'
import { GoogleGenerativeAI } from '@google/generative-ai'

const { width: screenWidth } = Dimensions.get('window');

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users/chats`;
const GEMINI_API_KEY: string = (Constants.expoConfig?.extra?.API_KEY as string) || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;


interface ChatMessage {
  text: string;
  user: boolean;
  timestamp?: number;
}

interface ApiChatMessage {
  message: string;
  sender: "user" | "bot";
  timestamp?: Date;
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
  index: number;
}

type RootStackParamList = {
  Home: { chatId?: string | null; newChatTrigger?: number };
  History: undefined;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ item, index }) => {
  const { theme, isDarkMode } = useTheme();
  
  const textLength = item.text.length;
  const minWidth = Math.min(screenWidth * 0.3, 120);
  const maxWidth = screenWidth * 0.85;
  
  let bubbleWidth = textLength < 50 ? minWidth : 
                   textLength < 150 ? screenWidth * 0.6 : 
                   maxWidth;

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
          <Markdown
            style={{
              body: {
                color: item.user ? '#FFFFFF' : theme.text,
                fontSize: 15.5,
                lineHeight: 22,
                fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                fontWeight: '400',
                marginVertical: 0,
                flexWrap: 'wrap',
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
      </View>
    </View>
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
            source={require('../assets/images/Logo.png')}
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
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

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
            const fetchedMessages: ChatMessage[] = chatDoc.messages.map((msg: ApiChatMessage, index: number) => ({
              text: msg.message,
              user: msg.sender === "user",
              timestamp: Date.now() + index,
            }));
            setMessages(fetchedMessages);
          }
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response && axiosError.response.status === 404) {
            setChatId(null);
            setMessages([]);
          } else {
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

  const callGeminiAPI = async (prompt: string): Promise<string> => {
    if (!genAI) {
      throw new Error('Gemini AI not configured');
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text || "I apologize, but I couldn't generate a response. Please try again.";
      
    } catch (error: any) {
      if (error.message?.includes('API_KEY')) {
        throw new Error('API key configuration error. Please check your Gemini API key.');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (error.message?.includes('safety')) {
        throw new Error('Content filtered for safety reasons.');
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        throw new Error('API key does not have permission to use this service.');
      } else {
        throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return
    const newPrompt = userInput.trim()
    setUserInput("")
    setLoading(true)
    
    try {
      const userId = await AsyncStorage.getItem("id");
      const newMessage: ChatMessage = { 
        text: newPrompt, 
        user: true, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, newMessage]);
      
      let currentChatId = chatId;

      try {
        const userResponse = await axios.post<ChatPostResponse>(PAGE_URL, {
          userId,
          chatId: currentChatId,
          message: newPrompt,
          sender: "user"
        })
        
        if (!currentChatId && userResponse.data.chatId) {
          currentChatId = userResponse.data.chatId;
        }
      } catch (dbError) {
        Toast.show({ 
          type: 'error', 
          text1: 'Database Error', 
          text2: 'Failed to save user message to database.', 
          position: 'bottom',
          visibilityTime: 3000,
        });
      }

      let fullPrompt = newPrompt;
      if (messages.length === 0) { 
        fullPrompt = `You are Eira, a supportive AI companion for mental well-being. Your goal is to offer empathetic conversations and general guidance. You should:

- Be empathetic, understanding, and non-judgmental
- Provide emotional support and general wellness tips
- Remind users you're not a substitute for professional therapy
- If topics seem beyond general support, gently suggest consulting a healthcare professional
- Maintain a calm, supportive tone
- Ask follow-up questions to show genuine interest
- Provide practical coping strategies when appropriate

Please respond to: ${newPrompt}`;
      } else {
        fullPrompt = `User: ${newPrompt}`;
      }

      setAiProcessing(true);
      
      const thinkingMessage: ChatMessage = { 
        text: "Eira is thinking...", 
        user: false, 
        timestamp: Date.now() + 1 
      };
      setMessages(prev => [...prev, thinkingMessage]);
      
      let text = '';
      
      try {
        text = await callGeminiAPI(fullPrompt);
        
      } catch (aiError: any) {
        if (aiError.message.includes('API key')) {
          text = "I'm experiencing a configuration issue with my AI service. Please check that the API key is properly set up.";
          
          Toast.show({
            type: 'error',
            text1: 'Configuration Error',
            text2: 'Please check your Gemini API key configuration.',
            position: 'bottom',
            visibilityTime: 5000,
          });
        } else if (aiError.message.includes('quota')) {
          text = "I'm currently experiencing high demand and have reached my usage limit. Please try again in a little while.";
          
          Toast.show({
            type: 'info',
            text1: 'API Limit Reached',
            text2: 'Please try again later.',
            position: 'bottom',
            visibilityTime: 4000,
          });
        } else {
          text = "I'm experiencing some technical difficulties right now, but I'm here to support you. If you're dealing with immediate mental health concerns, please don't hesitate to contact a mental health professional or crisis support service.";
          
          Toast.show({
            type: 'info',
            text1: 'AI Service Notice',
            text2: 'Experiencing technical difficulties.',
            position: 'bottom',
            visibilityTime: 4000,
          });
        }
      }

      setAiProcessing(false);

      const aiMessage: ChatMessage = { 
        text, 
        user: false, 
        timestamp: Date.now() + 2 
      };

      setMessages(prev => {
        const withoutThinking = prev.slice(0, -1);
        return [...withoutThinking, aiMessage];
      });

      try {
        await axios.post<ChatPostResponse>(PAGE_URL, {
          userId,
          chatId: currentChatId,
          message: text,
          sender: "bot"
        })
      } catch (dbError) {
        Toast.show({ 
          type: 'error', 
          text1: 'Database Error', 
          text2: 'Failed to save bot message to database.', 
          position: 'bottom',
          visibilityTime: 3000,
        });
      }

      if (currentChatId && currentChatId !== chatId) {
        setChatId(currentChatId);
      }

    } catch (err) {
      setAiProcessing(false);
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.text === "Eira is thinking...") {
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

  const renderChatBubble: ListRenderItem<ChatMessage> = ({ item, index }) => (
    <ChatBubble item={item} index={index} />
  );

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
              ListHeaderComponent={() => (
                messages.length === 0 ? <ChatHeader showWelcome={true} /> : null
              )}
              data={messages}
              ref={flatListRef}
              renderItem={renderChatBubble}
              keyExtractor={(item, index) => `${item.timestamp || index}-${index}`}
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

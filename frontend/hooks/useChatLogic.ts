import { useState, useCallback, useRef } from 'react';
import { useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { FlatList } from 'react-native';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SERVER_URL = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL = `${SERVER_URL}/users/chats`;
const GEMINI_API_KEY = (Constants.expoConfig?.extra?.API_KEY as string) || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Helper to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const SYSTEM_INSTRUCTION = `You are Eira, a supportive AI companion for mental well-being. Your goal is to offer empathetic conversations and general guidance. You should:
- Be empathetic, understanding, and non-judgmental
- Provide emotional support and general wellness tips
- Remind users you're not a substitute for professional therapy
- If topics seem beyond general support, gently suggest consulting a healthcare professional
- Maintain a calm, supportive tone
- Ask follow-up questions to show genuine interest
- Provide practical coping strategies when appropriate`;

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

type RootStackParamList = {
  Home: { chatId?: string | null; newChatTrigger?: number };
  History: undefined;
};

interface UseChatLogicProps {
  route: RouteProp<RootStackParamList, 'Home'>;
  navigation: NavigationProp<RootStackParamList>;
}

export const useChatLogic = ({ route, navigation }: UseChatLogicProps) => {
  const initialChatId = route.params?.chatId || null;
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

  const updateChatId = useCallback((paramsChatId?: string | null) => {
    if (paramsChatId) {
      setChatId(paramsChatId);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setChatId(null);
    setMessages([]);
    navigation.setParams({ chatId: null });
    Toast.show({
      text1: "New Conversation",
      text2: "Started a fresh conversation",
      type: "success",
      position: "bottom",
      visibilityTime: 2000,
    });
  }, [navigation]);

  const fetchChatById = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<ChatDocument>(`${PAGE_URL}/${chatId}`, headers);
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
          text2: 'Session expired or connection issue.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages]);

  const callGeminiAPI = useCallback(async (history: any[], currentPrompt: string): Promise<string> => {
    if (!genAI) {
      throw new Error('Gemini AI not configured');
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-001",
        systemInstruction: SYSTEM_INSTRUCTION
      });

      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(currentPrompt);
      const response = await result.response;
      const text = response.text();

      return text || "I apologize, but I couldn't generate a response. Please try again.";

    } catch (error: any) {
      // ... error handling
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!userInput.trim()) return;

    const newPrompt = userInput.trim();
    setUserInput("");
    setLoading(true);

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
        const headers = await getAuthHeaders();
        const userResponse = await axios.post<ChatPostResponse>(PAGE_URL, {
          userId,
          chatId: currentChatId,
          message: newPrompt,
          sender: "user"
        }, headers);

        if (!currentChatId && userResponse.data.chatId) {
          currentChatId = userResponse.data.chatId;
        }
      } catch (dbError) {
        console.error("Database Error:", dbError);
      }

      // Convert history to Gemini format
      const geminiHistory = messages.map(msg => ({
        role: msg.user ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      setAiProcessing(true);

      const thinkingMessage: ChatMessage = {
        text: "Eira is thinking...",
        user: false,
        timestamp: Date.now() + 1
      };
      setMessages(prev => [...prev, thinkingMessage]);

      let text = '';

      try {
        text = await callGeminiAPI(geminiHistory, newPrompt);
      } catch (aiError: any) {
        text = "I'm experiencing some technical difficulties right now. Please try again later.";
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
        const headers = await getAuthHeaders();
        await axios.post<ChatPostResponse>(PAGE_URL, {
          userId,
          chatId: currentChatId,
          message: text,
          sender: "bot"
        }, headers);
      } catch (dbError) {
        console.error("Database Error:", dbError);
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
  }, [userInput, chatId, messages, callGeminiAPI]);

  return {
    chatId,
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
  };
};
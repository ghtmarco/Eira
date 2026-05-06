import { useState, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { FlatList } from 'react-native';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

const SERVER_URL = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const CHATS_URL = `${SERVER_URL}/users/chats`;
const AI_URL    = `${SERVER_URL}/users/chat/ai`;

// Gemini API key is NO LONGER in the client — calls go through the backend proxy

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

interface GeminiHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface ChatMessage {
  text: string;
  user: boolean;
  timestamp?: number;
}

interface ApiChatMessage {
  message: string;
  sender: 'user' | 'bot';
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

// ─── Helper: save one message to DB ──────────────────────────────────────────
const saveMessageToDB = async (
  userId: string,
  chatId: string | null,
  message: string,
  sender: 'user' | 'bot'
): Promise<string | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post<ChatPostResponse>(
      CHATS_URL,
      { userId, chatId, message, sender },
      headers
    );
    return res.data.chatId ?? chatId;
  } catch (err) {
    console.error('DB save error:', err);
    return chatId;
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useChatLogic = ({ route, navigation }: UseChatLogicProps) => {
  const initialChatId = route.params?.chatId || null;
  const [chatId, setChatId]       = useState<string | null>(initialChatId);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading]     = useState<boolean>(false);
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

  // Memoised Gemini history — only rebuilds when messages array changes (#18)
  const geminiHistory = useMemo<GeminiHistoryItem[]>(
    () => messages.map(msg => ({
      role: msg.user ? 'user' : 'model',
      parts: [{ text: msg.text }],
    })),
    [messages]
  );

  const updateChatId = useCallback((paramsChatId?: string | null) => {
    if (paramsChatId) setChatId(paramsChatId);
  }, []);

  const handleNewChat = useCallback(() => {
    setChatId(null);
    setMessages([]);
    navigation.setParams({ chatId: null });
    Toast.show({
      text1: 'New Conversation',
      text2: 'Started a fresh conversation',
      type: 'success',
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, [navigation]);

  const fetchChatById = useCallback(async () => {
    if (!chatId) { setMessages([]); return; }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<ChatDocument>(`${CHATS_URL}/${chatId}`, headers);
      const chatDoc = response.data;

      if (chatDoc?.messages) {
        setMessages(chatDoc.messages.map((msg, index) => ({
          text: msg.message,
          user: msg.sender === 'user',
          timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : index,
        })));
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        // Session expired — redirect to login
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      } else if (axiosError.response?.status === 404) {
        setChatId(null);
        setMessages([]);
      } else {
        Toast.show({
          type: 'error',
          text1: "Couldn't Load Chat",
          text2: 'Session expired or connection issue.',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Stable ref — does NOT depend on messages, fires scroll via useEffect in screen (#13)
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // AI call goes to backend proxy — API key never in the bundle (#4)
  const callAI = useCallback(async (history: GeminiHistoryItem[], prompt: string): Promise<string> => {
    const headers = await getAuthHeaders();
    const res = await axios.post<{ response: string }>(
      AI_URL,
      { message: prompt, history },
      headers
    );
    return res.data.response || "I apologize, but I couldn't generate a response. Please try again.";
  }, []);

  const sendMessage = useCallback(async () => {
    if (!userInput.trim()) return;

    const newPrompt = userInput.trim();
    setUserInput('');
    setLoading(true);

    try {
      // Guard: userId must exist (#17)
      const userId = await AsyncStorage.getItem('id');
      if (!userId) {
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again.',
          position: 'bottom',
          visibilityTime: 3000,
        });
        return;
      }

      setMessages(prev => [...prev, { text: newPrompt, user: true, timestamp: Date.now() }]);

      let currentChatId = chatId;
      currentChatId = await saveMessageToDB(userId, currentChatId, newPrompt, 'user');
      if (!chatId && currentChatId) setChatId(currentChatId);

      // Show thinking placeholder
      setAiProcessing(true);
      setMessages(prev => [...prev, { text: 'Eira is thinking...', user: false, timestamp: Date.now() }]);

      let aiText = '';
      try {
        aiText = await callAI(geminiHistory, newPrompt);
      } catch {
        aiText = "I'm experiencing some technical difficulties right now. Please try again later.";
      }

      setAiProcessing(false);

      // Replace thinking placeholder by marker match, not by position (#7)
      setMessages(prev => [
        ...prev.filter(m => m.text !== 'Eira is thinking...'),
        { text: aiText, user: false, timestamp: Date.now() },
      ]);

      await saveMessageToDB(userId, currentChatId, aiText, 'bot');

    } catch (err) {
      setAiProcessing(false);
      setMessages(prev => prev.filter(m => m.text !== 'Eira is thinking...'));
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
  }, [userInput, chatId, geminiHistory, callAI]);

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

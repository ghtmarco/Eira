import React, { useState, useCallback, JSX } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ListRenderItem, Alert, StyleSheet } from 'react-native'
import axios, { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import Constants from 'expo-constants'
import Svg, { Path } from "react-native-svg"
import { LinearGradient } from 'expo-linear-gradient'
import Toast from 'react-native-toast-message'
import { useTheme } from '../contexts/ThemeContext'

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users/chats/user`;

console.log('SERVER_URL:', SERVER_URL);
console.log('PAGE_URL:', PAGE_URL);

interface ApiChatMessage { 
  message: string;
  sender: "user" | "bot";
  timestamp?: Date;
}

interface ChatHistoryItem {
  _id: string;
  messages: ApiChatMessage[];
}

type RootStackParamList = {
  Chat: { chatId?: string; newChatTrigger?: number };
  History: undefined;
};

const HistoryScreen = (): JSX.Element => {
  const { theme } = useTheme();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<{[key: string]: boolean}>({});
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("id");
      const response = await axios.get<ChatHistoryItem[] | ChatHistoryItem>(`${PAGE_URL}/${userId}`);
      const data = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
      setChatHistory(data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Failed to fetch chat history:", axiosError.message);
      setChatHistory([]);
      Toast.show({
        type: 'error',
        text1: 'Couldn\'t Load History',
        text2: 'Please check your connection and try again.',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const handleDeleteChat = async (chatId: string) => {
    Alert.alert(
      "Feature Temporarily Unavailable",
      "The delete functionality is currently not available as the server is being updated. Please try again later.",
      [
        {
          text: "OK",
          style: "default"
        }
      ]
    );
    return;
  };

  const renderChat: ListRenderItem<ChatHistoryItem> = ({ item, index }) => {
    const firstUserMessage = item.messages.find(msg => msg.sender === "user");
    const firstMessage = firstUserMessage || item.messages[0];
    
    const title = firstMessage?.message ? 
      (firstMessage.message.length > 35 ? 
        firstMessage.message.substring(0, 35) + '...' : 
        firstMessage.message) : 
      "Conversation";
    
    const mostRecentMessage = item.messages[item.messages.length - 1];
    const messageDate = mostRecentMessage?.timestamp ? 
      new Date(mostRecentMessage.timestamp) : 
      new Date();
    
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const dateDisplay = isToday ? 
      messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    const messageCount = item.messages.length;
    
    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 100).springify()}
      >
        <View style={[styles.chatCard, { backgroundColor: theme.card, shadowColor: theme.shadow.color }]}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatTitle, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteChat(item._id)}
              disabled={deleting[item._id]}
            >
              {deleting[item._id] ? (
                <ActivityIndicator size="small" color={theme.secondary} />
              ) : (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                    stroke={theme.secondary}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M10 11v6M14 11v6"
                    stroke={theme.secondary}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.chatInfo}>
            <Text style={[styles.messageCount, { color: theme.textSecondary }]}>
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </Text>
            <Text style={[styles.messageDate, { color: theme.textSecondary }]}>{dateDisplay}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Chat', { chatId: item._id.toString() })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#007AFF', '#0A84FF']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.primary}
              />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading conversations...</Text>
            </View>
          ) : chatHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Svg width={50} height={50} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 12h8M8 16h4M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7z"
                  stroke={theme.textSecondary}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Conversations Yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Start a new conversation from the chat screen.
              </Text>
              <TouchableOpacity
                style={styles.newChatButton}
                onPress={() => navigation.navigate('Chat', { newChatTrigger: Date.now() })}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#007AFF', '#0A84FF']}
                  style={styles.continueButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.continueButtonText}>Start New Conversation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={chatHistory}
              renderItem={renderChat}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </LinearGradient>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  chatCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  chatInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  messageCount: {
    fontSize: 14,
    fontWeight: '400',
  },
  messageDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  continueButton: {
    alignSelf: 'flex-end',
    borderRadius: 20,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 15,
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  newChatButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default HistoryScreen;
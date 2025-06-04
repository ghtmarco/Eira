import React, { useState, useCallback, useRef, JSX } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ListRenderItem, Alert, StyleSheet } from 'react-native'
import axios, { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native'
import Animated, { FadeInDown, SlideInLeft, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Swipeable } from 'react-native-gesture-handler'
import Constants from 'expo-constants'
import Svg, { Path } from "react-native-svg"
import { LinearGradient } from 'expo-linear-gradient'
import Toast from 'react-native-toast-message'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users/chats/user`;

console.log('SERVER_URL:', SERVER_URL);
console.log('PAGE_URL:', PAGE_URL);

// Theme colors - iOS inspired
const THEME = {
  primary: '#007AFF',  // iOS blue
  secondary: '#FF3B30', // iOS red
  tertiary: '#34C759', // iOS green
  background: '#F7F7F7', // iOS light background
  card: '#FFFFFF',
  text: '#111111', // Darker text for better contrast
  textSecondary: '#8E8E93', // iOS secondary text
  placeholder: '#C7C7CC', // iOS placeholder text
  shadow: {
    color: '#000000',
    opacity: 0.08,
  }
};

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
    // Temporary: Check if delete endpoint is available
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
    
    // Original delete logic (commented out until server is updated)
    /*
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(prev => ({ ...prev, [chatId]: true }));
              const deleteUrl = `${SERVER_URL}/users/chats/${chatId}`;
              console.log('Delete URL:', deleteUrl);
              console.log('ChatId:', chatId);
              console.log('SERVER_URL:', SERVER_URL);
              
              await axios.delete(deleteUrl);
              setChatHistory(prev => prev.filter(chat => chat._id !== chatId));
              Toast.show({
                type: 'success',
                text1: 'Conversation Deleted',
                text2: 'The conversation has been removed.',
                position: 'bottom',
                visibilityTime: 2000,
              });
            } catch (error) {
              console.error("Failed to delete chat:", error);
              if ((error as any).response) {
                console.error("Error response status:", (error as any).response.status);
                console.error("Error response data:", (error as any).response.data);
              }
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Unable to delete the conversation.',
                position: 'bottom',
                visibilityTime: 3000,
              });
            } finally {
              setDeleting(prev => ({ ...prev, [chatId]: false }));
            }
          }
        }
      ]
    );
    */
  };

  // Array of refs for all swipeable items
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());
  
  // Function to close all open swipeables except the current one
  const closeOtherSwipeables = (currentId: string) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (id !== currentId && ref) {
        ref.close();
      }
    });
  };

  const renderChat: ListRenderItem<ChatHistoryItem> = ({ item, index }) => {
    // Get the first user message as the title, or use the first available message
    const firstUserMessage = item.messages.find(msg => msg.sender === "user");
    const firstMessage = firstUserMessage || item.messages[0];
    
    // Format the message as a title - truncate if too long
    const title = firstMessage?.message ? 
      (firstMessage.message.length > 35 ? 
        firstMessage.message.substring(0, 35) + '...' : 
        firstMessage.message) : 
      "Conversation";
    
    // Get the most recent message time for displaying date
    const mostRecentMessage = item.messages[item.messages.length - 1];
    const messageDate = mostRecentMessage?.timestamp ? 
      new Date(mostRecentMessage.timestamp) : 
      new Date();
    
    // Format the date to show either today's time, or the date for older messages
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const dateDisplay = isToday ? 
      messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    // Get message count
    const messageCount = item.messages.length;
    
    // Save ref to the swipeable component
    const setSwipeableRef = (ref: Swipeable | null) => {
      if (ref) {
        swipeableRefs.current.set(item._id, ref);
      }
    };
    
    const renderRightActions = () => {
      return (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            swipeableRefs.current.get(item._id)?.close();
            handleDeleteChat(item._id);
          }}
          disabled={deleting[item._id]}
        >
          {deleting[item._id] ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.deleteActionText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }
    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 100).springify()}
      >
        <Swipeable
          ref={setSwipeableRef}
          renderRightActions={renderRightActions}
          friction={2}
          rightThreshold={40}
          onSwipeableOpen={() => {
            // Close other swipeables when opening this one
            closeOtherSwipeables(item._id);
            // Add haptic feedback when swipe is completed
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              console.log('Haptics not available', error);
            }
          }}
        >
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {title}
              </Text>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteChat(item._id)}
                disabled={deleting[item._id]}
              >
                {deleting[item._id] ? (
                  <ActivityIndicator size="small" color={THEME.secondary} />
                ) : (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                      stroke={THEME.secondary}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M10 11v6M14 11v6"
                      stroke={THEME.secondary}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.chatInfo}>
              <Text style={styles.messageCount}>
                {messageCount} {messageCount === 1 ? 'message' : 'messages'}
              </Text>
              <Text style={styles.messageDate}>{dateDisplay}</Text>
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
        </Swipeable>
      </Animated.View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#F8F8F8', '#F4F6F8', '#F7F7F7']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={THEME.primary}
              />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : chatHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Svg width={50} height={50} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 12h8M8 16h4M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7z"
                  stroke={THEME.textSecondary}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.emptyTitle}>No Conversations Yet</Text>
              <Text style={styles.emptyText}>
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
    </GestureHandlerRootView>
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
    backgroundColor: THEME.card,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: THEME.shadow.color,
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
    color: THEME.text,
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
    color: THEME.textSecondary,
    fontWeight: '400',
  },
  messageDate: {
    fontSize: 13,
    color: THEME.textSecondary,
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
    color: THEME.textSecondary,
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
    color: THEME.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  newChatButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Swipe to delete styles
  deleteAction: {
    backgroundColor: THEME.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    flexDirection: 'column',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13,
    marginTop: 4,
  }
});

export default HistoryScreen;
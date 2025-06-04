import React, { useState, useCallback, JSX } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ListRenderItem } from 'react-native'
import axios, { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native'
import Animated, { SlideInLeft } from 'react-native-reanimated'
import Constants from 'expo-constants'

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users/chats/user`;

interface ApiChatMessage { 
  message: string;
  sender: "user" | "bot";
}

interface ChatHistoryItem {
  _id: string;
  messages: ApiChatMessage[];
}

type RootStackParamList = {
  Chat: { chatId: string };
  History: undefined;
};


const HistoryScreen = (): JSX.Element => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        setLoading(true)
        try {
          const userId = await AsyncStorage.getItem("id")
          const response = await axios.get<ChatHistoryItem[] | ChatHistoryItem>(`${PAGE_URL}/${userId}`);
          const data = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
          setChatHistory(data);
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error("Failed to fetch chat history:", axiosError.message);
            setChatHistory([]);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }, [])
  );

  const renderChat: ListRenderItem<ChatHistoryItem> = ({ item, index }) => {
    const titleMessage = item.messages.find(msg => msg.sender === "user");
    return (
      <Animated.View
        entering={SlideInLeft.duration(500).delay(index * 200)}
        style={{
          backgroundColor: '#DCDCDC',
          marginBottom: 20,
          padding: 12,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 32,
            paddingTop: 12,
            paddingLeft: 12,
          }}
        >
          {titleMessage?.message || "Chat"}
        </Text>

        <TouchableOpacity
          style={{ alignSelf: 'flex-end' }}
          onPress={() => navigation.navigate('Chat', { chatId: item._id.toString() })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#547565' }}>Back to Chat</Text>
            <Text style={{ fontSize: 18, marginBottom: 4, color: '#547565' }}>{'\u2192'}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        padding: 16,
        backgroundColor: '#E3E3E3',
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0081E4"
          style={{ paddingTop: 12 }}
        />
      ) : (
        <FlatList
          data={chatHistory}
          renderItem={renderChat}
          keyExtractor={(item) => item._id}
        />
      )}
    </View>
  )
}

export default HistoryScreen
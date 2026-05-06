export interface ApiChatMessage {
  message: string;
  sender: 'user' | 'bot';
  timestamp?: string | Date;
}

export interface ChatHistoryItem {
  _id: string;
  userId: string;
  messages: ApiChatMessage[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserSession {
  token: string;
  id: string;
  name: string;
}

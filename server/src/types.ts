export interface SocketUser {
  userId: string;
  typing: boolean;
  username: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
}

export interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  username: string;
} 
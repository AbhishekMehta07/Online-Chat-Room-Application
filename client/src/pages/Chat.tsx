import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

interface User {
  id: string;
  username: string;
  email: string;
}

interface OnlineUser {
  userId: string;
  username: string;
}

interface Message {
  senderId: string;
  message: string;
  timestamp: Date;
  username: string;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [typingUser, setTypingUser] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate('/login');
      return;
    }

    try {
      const user: User = JSON.parse(userStr);
      setCurrentUser(user);
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('user_connected', {
          userId: user.id,
          username: user.username,
        });
      });

      newSocket.on('connect_error', (error: Error) => {
        console.error('Connection error:', error);
        setError('Failed to connect to server');
      });

      newSocket.on('error', (data: { message: string }) => {
        console.error('Socket error:', data.message);
        setError(data.message);
      });

      newSocket.on('online_users', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('receive_message', (data: Message) => {
        setMessages(prev => [...prev, data]);
      });

      newSocket.on('user_typing', (data: { userId: string; username: string; isTyping: boolean }) => {
        if (data.userId !== user.id) {
          setTypingUser(data.isTyping ? data.username : '');
        }
      });

      newSocket.on('account_login_elsewhere', (data: { message: string }) => {
        alert(data.message);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        newSocket.disconnect();
        navigate('/login');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Error setting up chat:', error);
      setError('Failed to initialize chat');
      navigate('/login');
    }
  }, [navigate]);

  const handleTyping = () => {
    if (socket && currentUser) {
      socket.emit('typing', {
        isTyping: true,
        username: currentUser.username
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          isTyping: false,
          username: currentUser.username
        });
      }, 2000);
    }
  };

  const sendMessage = () => {
    if (message.trim() && socket && currentUser) {
      socket.emit('send_message', {
        message: message.trim(),
        username: currentUser.username
      });
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto',
      height: '100vh', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Chat Room</h2>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            {onlineUsers.length} {onlineUsers.length === 1 ? 'person' : 'people'} online
          </div>
        </div>
        {currentUser && (
          <div>
            <span>Logged in as: {currentUser.username}</span>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Online Users: {onlineUsers.map(user => user.username).join(', ')}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ 
          flex: 1,
          padding: '20px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflowY: 'auto',
          backgroundColor: '#f7fafc',
          marginBottom: '10px'
        }}>
          {messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === currentUser?.id;
            
            return (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  backgroundColor: isOwnMessage ? '#ebf8ff' : '#edf2f7',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  maxWidth: '70%'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#4a5568',
                    marginBottom: '4px',
                    fontWeight: 'bold'
                  }}>
                    {isOwnMessage ? 'You' : msg.username}
                  </div>
                  <div style={{ fontSize: '14px' }}>{msg.message}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
          {typingUser && (
            <div style={{ 
              fontSize: '14px', 
              color: '#718096', 
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              {typingUser} is typing...
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          padding: '10px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          position: 'sticky',
          bottom: '20px'
        }}>
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              backgroundColor: '#3182ce',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
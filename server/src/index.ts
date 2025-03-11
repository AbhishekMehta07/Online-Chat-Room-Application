import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import { SocketUser } from './types';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Store connected users
const connectedUsers = new Map<string, SocketUser>();
// Store user ID to socket ID mapping
const userIdToSocketId = new Map<string, string>();

// Function to broadcast online users count
const broadcastOnlineUsers = () => {
  // Get unique users by userId
  const uniqueUsers = new Map<string, SocketUser>();
  connectedUsers.forEach((user) => {
    uniqueUsers.set(user.userId, user);
  });
  
  const onlineUsers = Array.from(uniqueUsers.values()).map(user => ({
    userId: user.userId,
    username: user.username
  }));
  io.emit('online_users', onlineUsers);
};

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', async (data: { userId: string, username: string }) => {
    try {
      // Check if this user is already connected from another device
      const existingSocketId = userIdToSocketId.get(data.userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        // Notify the existing session about the new login
        io.to(existingSocketId).emit('account_login_elsewhere', {
          message: 'Your account has been logged in from another device'
        });
        
        // Disconnect the existing socket
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
        
        // Clean up the old socket's data
        connectedUsers.delete(existingSocketId);
        userIdToSocketId.delete(data.userId);
      }

      // Update the maps with new socket connection
      userIdToSocketId.set(data.userId, socket.id);
      connectedUsers.set(socket.id, { 
        userId: data.userId, 
        username: data.username, 
        typing: false 
      });
      
      console.log(`User ${data.username} (${data.userId}) connected with socket ${socket.id}`);
      broadcastOnlineUsers();
    } catch (error) {
      console.error('Error in user_connected:', error);
      socket.emit('error', { message: 'Failed to connect user' });
    }
  });

  socket.on('typing', (data: { isTyping: boolean; username: string }) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', {
        userId: user.userId,
        username: data.username,
        isTyping: data.isTyping
      });
    }
  });

  socket.on('send_message', (data: { message: string; username: string }) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      io.emit('receive_message', {
        senderId: user.userId,
        message: data.message,
        timestamp: new Date(),
        username: data.username
      });
    }
  });

  socket.on('disconnect', () => {
    try {
      const userId = Array.from(userIdToSocketId.entries())
        .find(([_, socketId]) => socketId === socket.id)?.[0];
      
      if (userId) {
        userIdToSocketId.delete(userId);
      }
      
      connectedUsers.delete(socket.id);
      console.log('User disconnected:', socket.id);
      broadcastOnlineUsers();
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }); 
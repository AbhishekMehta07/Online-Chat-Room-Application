# Real-time Chat Application

A real-time chat application built with React, Node.js, Express, Socket.IO, and TypeScript.

## Features

- User authentication (login/register)
- Real-time messaging
- Typing indicators
- Modern UI with responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas connection string)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your-secret-key
   ```

## Running the Application

1. Start the development servers:
   ```bash
   npm start
   ```
   This will start both the client (on port 3000) and server (on port 5000)

2. Open your browser and navigate to `http://localhost:3000`

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create optimized builds in both the client and server directories.

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Socket.IO Client
  - React Router

- Backend:
  - Node.js
  - Express
  - Socket.IO
  - MongoDB
  - TypeScript
  - JWT Authentication 
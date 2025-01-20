const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initializeDriveWatcher } = require('./services/driveService');
const { transcribeVideo } = require('./services/geminiService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeDriveWatcher(io);
}); 
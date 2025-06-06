import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('task-created', (data) => {
    // Notify the assigned user
    if (data.assignedTo) {
      socket.to(data.assignedTo).emit('task-created', data);
    }
  });

  socket.on('task-updated', (data) => {
    // Notify relevant users
    if (data.assignedTo) {
      socket.to(data.assignedTo).emit('task-updated', data);
    }
    if (data.createdBy && data.createdBy !== data.assignedTo) {
      socket.to(data.createdBy).emit('task-updated', data);
    }
  });

  socket.on('notification-sent', (data) => {
    // Send notification to specific user
    socket.to(data.recipient).emit('new-notification', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
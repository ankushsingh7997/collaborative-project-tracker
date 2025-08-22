const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/configs');

const socketHandlers = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.id = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Join project rooms
    socket.on('joinProject', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.user.username} joined project ${projectId}`);
    });

    // Leave project rooms
    socket.on('leaveProject', (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`User ${socket.user.username} left project ${projectId}`);
    });

    // Handle task status updates
    socket.on('taskStatusUpdate', (data) => {
      socket.to(`project_${data.projectId}`).emit('taskStatusChanged', data);
    });

    // Handle typing indicators for comments
    socket.on('typingComment', (data) => {
      socket.to(`project_${data.projectId}`).emit('userTyping', {
        user: socket.user.username,
        taskId: data.taskId
      });
    });

    socket.on('stopTypingComment', (data) => {
      socket.to(`project_${data.projectId}`).emit('userStoppedTyping', {
        user: socket.user.username,
        taskId: data.taskId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });
};

module.exports = socketHandlers;
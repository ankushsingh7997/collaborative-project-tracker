const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const { JWT_SECRET } = require('../config/configs');

// Map to store user connections: userId -> Set of socket IDs
const userConnections = new Map();

// Map to store socket to user mapping: socketId -> userId
const socketToUser = new Map();

const socketHandlers = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      console.log("Authenticating user for connection");
      
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User ${socket.user.username} connected with socket ID: ${socket.id}`);

    // Add this socket to user connections
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(socket.id);
    
    // Map socket to user for cleanup
    socketToUser.set(socket.id, userId);

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Auto-join user to all their project rooms
    joinUserToProjectRooms(socket, userId);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.username} disconnected. Reason: ${reason}`);
      
      // Clean up user connections
      if (userConnections.has(userId)) {
        userConnections.get(userId).delete(socket.id);
        if (userConnections.get(userId).size === 0) {
          userConnections.delete(userId);
        }
      }
      
      // Clean up socket mapping
      socketToUser.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Helper function to join user to all their project rooms
  const joinUserToProjectRooms = async (socket, userId) => {
    try {
      const userProjects = await Project.find({ 
        members: userId 
      }).select('_id');
      
      userProjects.forEach(project => {
        socket.join(`project_${project._id}`);
        console.log(`User ${socket.user.username} auto-joined project ${project._id}`);
      });
    } catch (error) {
      console.error('Error joining user to project rooms:', error);
    }
  };
};

// Utility functions to emit events to project members
const emitToProjectMembers = async (io, projectId, eventName, data, excludeUserId = null) => {
  try {
    // Get all project members
    const project = await Project.findById(projectId).populate('members', '_id');
    if (!project) {
      console.error(`Project not found: ${projectId}`);
      return;
    }

    const memberIds = project.members.map(member => member._id.toString());
    
    // Emit to each connected member
    memberIds.forEach(memberId => {
      // Skip the excluded user (e.g., the one who made the change)
      if (excludeUserId && memberId === excludeUserId.toString()) {
        return;
      }
      
      if (userConnections.has(memberId)) {
        const socketIds = userConnections.get(memberId);
        socketIds.forEach(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit(eventName, data);
          }
        });
      }
    });
    
    console.log(`Emitted ${eventName} to ${memberIds.length} project members`);
  } catch (error) {
    console.error('Error emitting to project members:', error);
  }
};

// Emit to specific user across all their connections
const emitToUser = (io, userId, eventName, data) => {
  if (userConnections.has(userId)) {
    const socketIds = userConnections.get(userId);
    socketIds.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(eventName, data);
      }
    });
    console.log(`Emitted ${eventName} to user ${userId} across ${socketIds.size} connections`);
  }
};

// Export both the handler and utility functions
module.exports = {
  socketHandlers,
  emitToProjectMembers,
  emitToUser,
  userConnections,
  socketToUser
};
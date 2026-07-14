const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VaultEntry = require('../models/VaultEntry');
const StorageFile = require('../models/StorageFile');
const { pushChange, markAsSynced, getPendingChanges } = require('../services/syncService');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    },
    path: '/sync'
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.userId = user._id;
      socket.userEmail = user.email;
      socket.deviceId = socket.handshake.auth.deviceId || 'unknown';
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔗 Device connected: ${socket.deviceId} - User: ${socket.userEmail}`);
    
    socket.join(`user:${socket.userId}`);
    
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
    
    socket.on('sync:push', async (data) => {
      try {
        const { action, resourceType, resourceId, resourceData } = data;
        
        await pushChange(
          socket.userId,
          socket.deviceId,
          action,
          resourceType,
          resourceId,
          resourceData
        );
        
        io.to(`user:${socket.userId}`).emit('sync:update', {
          action,
          resourceType,
          resourceId,
          resourceData,
          sourceDevice: socket.deviceId,
          timestamp: new Date().toISOString()
        });
        
        socket.emit('sync:ack', { success: true, action });
      } catch (error) {
        socket.emit('sync:error', { message: error.message });
      }
    });
    
    socket.on('sync:pull', async (data) => {
      try {
        const { lastSyncTime } = data;
        const pending = await getPendingChanges(socket.userId, socket.deviceId);
        
        const changes = await require('../services/syncService').pullChanges(
          socket.userId,
          socket.deviceId,
          lastSyncTime
        );
        
        socket.emit('sync:data', {
          changes,
          pending: pending.length,
          timestamp: new Date().toISOString()
        });
        
        for (const change of changes) {
          await markAsSynced(change._id);
        }
      } catch (error) {
        socket.emit('sync:error', { message: error.message });
      }
    });
    
    socket.on('sync:status', async () => {
      try {
        const status = await require('../services/syncService').getSyncStatus(socket.userId);
        socket.emit('sync:status', status);
      } catch (error) {
        socket.emit('sync:error', { message: error.message });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 Device disconnected: ${socket.deviceId} - User: ${socket.userEmail}`);
    });
  });

  return io;
};

const broadcastUpdate = (userId, action, resourceType, resourceId, resourceData = {}) => {
  if (io) {
    io.to(`user:${userId}`).emit('sync:update', {
      action,
      resourceType,
      resourceId,
      resourceData,
      timestamp: new Date().toISOString()
    });
  }
};

const getIO = () => io;

module.exports = { initSocket, broadcastUpdate, getIO };
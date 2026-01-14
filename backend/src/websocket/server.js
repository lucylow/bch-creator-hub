const { Server } = require('socket.io');
const logger = require('../utils/logger');

class WebSocketServer {
  constructor() {
    this.io = null;
    this.creatorConnections = new Map(); // creatorId -> Set of socket IDs
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // Handle creator authentication
      socket.on('authenticate', (data) => {
        try {
          const { creatorId } = data;
          
          if (!creatorId) {
            socket.emit('error', { message: 'Creator ID required' });
            return;
          }

          // Add socket to creator's connection set
          if (!this.creatorConnections.has(creatorId)) {
            this.creatorConnections.set(creatorId, new Set());
          }
          
          this.creatorConnections.get(creatorId).add(socket.id);
          
          socket.creatorId = creatorId;
          
          socket.emit('authenticated', { creatorId });
          
          logger.info(`Socket ${socket.id} authenticated for creator ${creatorId}`);
        } catch (error) {
          logger.error('WebSocket authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.creatorId) {
          const connections = this.creatorConnections.get(socket.creatorId);
          if (connections) {
            connections.delete(socket.id);
            if (connections.size === 0) {
              this.creatorConnections.delete(socket.creatorId);
            }
          }
        }
        
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });

      // Handle ping/pong for keepalive
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Broadcast message to all connections for a specific creator
   */
  broadcastToCreator(creatorId, event, data) {
    try {
      const connections = this.creatorConnections.get(creatorId);
      
      if (!connections || connections.size === 0) {
        return;
      }

      connections.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      });

      logger.debug(`Broadcasted ${event} to creator ${creatorId} (${connections.size} connections)`);
    } catch (error) {
      logger.error(`Error broadcasting to creator ${creatorId}:`, error);
    }
  }

  /**
   * Send message to all connected clients
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Get number of connections for a creator
   */
  getConnectionCount(creatorId) {
    const connections = this.creatorConnections.get(creatorId);
    return connections ? connections.size : 0;
  }

  /**
   * Get total number of connections
   */
  getTotalConnections() {
    return this.io.sockets.sockets.size;
  }
}

module.exports = new WebSocketServer();

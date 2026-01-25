const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { ValidationError, AppError } = require('../utils/errors');

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
      transports: ['websocket', 'polling'],
      pingInterval: 20_000,
      pingTimeout: 10_000,
      upgradeTimeout: 10_000,
      maxHttpBufferSize: 1e6
    });

    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // Handle creator authentication
      socket.on('authenticate', (data) => {
        try {
          if (!data || typeof data !== 'object') {
            socket.emit('error', { 
              message: 'Invalid authentication data',
              code: 'INVALID_DATA'
            });
            return;
          }

          const { creatorId } = data;
          
          if (!creatorId || typeof creatorId !== 'string' || creatorId.trim().length === 0) {
            socket.emit('error', { 
              message: 'Creator ID is required and must be a non-empty string',
              code: 'MISSING_CREATOR_ID'
            });
            return;
          }

          // Validate creatorId format (should be 16 characters)
          if (creatorId.length !== 16) {
            socket.emit('error', { 
              message: 'Invalid creator ID format',
              code: 'INVALID_CREATOR_ID_FORMAT'
            });
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
          logger.error('WebSocket authentication error:', {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            socketId: socket.id
          });
          
          socket.emit('error', { 
            message: 'Authentication failed',
            code: 'AUTHENTICATION_ERROR'
          });
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
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot broadcast');
      return;
    }

    if (!creatorId || typeof creatorId !== 'string') {
      logger.warn('Invalid creatorId provided to broadcastToCreator:', { creatorId });
      return;
    }

    if (!event || typeof event !== 'string') {
      logger.warn('Invalid event name provided to broadcastToCreator:', { event });
      return;
    }

    try {
      const connections = this.creatorConnections.get(creatorId);
      
      if (!connections || connections.size === 0) {
        logger.debug(`No connections found for creator ${creatorId}`);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      connections.forEach(socketId => {
        try {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket && socket.connected) {
            socket.emit(event, data);
            successCount++;
          } else {
            // Clean up stale connection
            connections.delete(socketId);
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          logger.error(`Error emitting to socket ${socketId}:`, {
            error: {
              name: error.name,
              message: error.message
            },
            socketId,
            creatorId,
            event
          });
        }
      });

      // Clean up empty connection sets
      if (connections.size === 0) {
        this.creatorConnections.delete(creatorId);
      }

      logger.debug(`Broadcasted ${event} to creator ${creatorId}: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
      logger.error(`Error broadcasting to creator ${creatorId}:`, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        creatorId,
        event
      });
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
    return this.io?.sockets?.sockets?.size ?? 0;
  }

  /**
   * Broadcast a batch of items in one message to reduce round-trips.
   * Use for payments:batch, etc.
   */
  broadcastBatchToCreator(creatorId, event, items) {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot broadcast batch');
      return;
    }
    if (!creatorId || typeof creatorId !== 'string' || !event || typeof event !== 'string') {
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }
    this.broadcastToCreator(creatorId, event, { transactions: items });
  }
}

module.exports = new WebSocketServer();

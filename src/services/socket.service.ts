import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initialize Socket.IO server
   */
  initialize(io: SocketIOServer) {
    this.io = io;

    // Authentication middleware
    io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
          email: string;
        };
        
        socket.data.userId = decoded.id;
        socket.data.email = decoded.email;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      this.connectedUsers.set(userId, socket.id);

      logger.info(`User connected: ${userId} (${socket.id})`);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(userId);
        logger.info(`User disconnected: ${userId}`);
      });

      // Handle custom events
      socket.on('subscribe:alerts', () => {
        socket.join('alerts');
        logger.info(`User ${userId} subscribed to alerts`);
      });

      socket.on('subscribe:tickets', () => {
        socket.join('tickets');
        logger.info(`User ${userId} subscribed to tickets`);
      });

      socket.on('unsubscribe:alerts', () => {
        socket.leave('alerts');
        logger.info(`User ${userId} unsubscribed from alerts`);
      });

      socket.on('unsubscribe:tickets', () => {
        socket.leave('tickets');
        logger.info(`User ${userId} unsubscribed from tickets`);
      });
    });

    logger.info('Socket.IO service initialized');
  }

  /**
   * Emit new alert to all subscribed users
   */
  emitAlert(alert: any) {
    if (!this.io) return;

    this.io.to('alerts').emit('alert:new', {
      type: 'ALERT_CREATED',
      data: alert,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Alert emitted: ${alert.id}`);
  }

  /**
   * Emit alert update
   */
  emitAlertUpdate(alert: any) {
    if (!this.io) return;

    this.io.to('alerts').emit('alert:updated', {
      type: 'ALERT_UPDATED',
      data: alert,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Alert update emitted: ${alert.id}`);
  }

  /**
   * Emit new ticket
   */
  emitTicket(ticket: any) {
    if (!this.io) return;

    this.io.to('tickets').emit('ticket:new', {
      type: 'TICKET_CREATED',
      data: ticket,
      timestamp: new Date().toISOString(),
    });

    // Also emit to assigned user if exists
    if (ticket.assignedToId) {
      this.emitToUser(ticket.assignedToId, 'ticket:assigned', {
        type: 'TICKET_ASSIGNED',
        data: ticket,
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug(`Ticket emitted: ${ticket.id}`);
  }

  /**
   * Emit ticket update
   */
  emitTicketUpdate(ticket: any) {
    if (!this.io) return;

    this.io.to('tickets').emit('ticket:updated', {
      type: 'TICKET_UPDATED',
      data: ticket,
      timestamp: new Date().toISOString(),
    });

    // Also emit to assigned user
    if (ticket.assignedToId) {
      this.emitToUser(ticket.assignedToId, 'ticket:updated', {
        type: 'TICKET_UPDATED',
        data: ticket,
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug(`Ticket update emitted: ${ticket.id}`);
  }

  /**
   * Emit notification to specific user
   */
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug(`Event ${event} emitted to user: ${userId}`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any) {
    if (!this.io) return;

    this.io.emit(event, data);
    logger.debug(`Broadcast event: ${event}`);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

export const socketService = new SocketService();

export const initializeSocketIO = (io: SocketIOServer) => {
  socketService.initialize(io);
};

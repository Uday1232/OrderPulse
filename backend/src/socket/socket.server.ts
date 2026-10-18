import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let ioInstance: Server | null = null;

export interface SocketEvents {
  'join:store': (storeId: string) => void;
  'leave:store': (storeId: string) => void;
  'order:created': (order: unknown) => void;
  'order:updated': (order: unknown) => void;
}

export function initializeSocketServer(httpServer: HttpServer, corsOrigins: string[]): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket client connected: ${socket.id}`, {
      clientIp: socket.handshake.address,
      query: socket.handshake.query,
    });

    // Automatically join room if storeId is supplied in handshake query
    const initialStoreId = socket.handshake.query.store_id as string | undefined;
    if (initialStoreId) {
      const room = `store:${initialStoreId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined initial room: ${room}`);
      socket.emit('store:joined', { storeId: initialStoreId, room });
    }

    // Explicit store room join
    socket.on('join:store', (storeId: string) => {
      if (!storeId || typeof storeId !== 'string') return;
      const room = `store:${storeId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
      socket.emit('store:joined', { storeId, room });
    });

    // Leave store room
    socket.on('leave:store', (storeId: string) => {
      if (!storeId || typeof storeId !== 'string') return;
      const room = `store:${storeId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
      socket.emit('store:left', { storeId, room });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id}`, { reason });
    });

    // Error handling
    socket.on('error', (err) => {
      logger.error(`Socket error on ${socket.id}:`, { error: err.message });
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketServer(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO server has not been initialized yet');
  }
  return ioInstance;
}

export function emitOrderCreated(storeId: string, order: unknown): void {
  if (!ioInstance) return;
  const room = `store:${storeId}`;
  ioInstance.to(room).emit('order:created', order);
  logger.info(`Real-time event [order:created] emitted to room ${room}`, {
    orderId: (order as { id?: string })?.id,
  });
}

export function emitOrderUpdated(storeId: string, order: unknown): void {
  if (!ioInstance) return;
  const room = `store:${storeId}`;
  ioInstance.to(room).emit('order:updated', order);
  logger.info(`Real-time event [order:updated] emitted to room ${room}`, {
    orderId: (order as { id?: string })?.id,
  });
}

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let ioInstance: Server | null = null;

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

    // Automatically join store room if provided in query
    const initialStoreId = socket.handshake.query.store_id as string | undefined;
    if (initialStoreId) {
      socket.join(`store_${initialStoreId}`);
      socket.join(`store:${initialStoreId}`);
      logger.info(`Socket ${socket.id} joined initial store room: store_${initialStoreId}`);
    }

    // Automatically join user room if user_id is provided in query
    const initialUserId = socket.handshake.query.user_id as string | undefined;
    if (initialUserId) {
      socket.join(`user_${initialUserId}`);
      logger.info(`Socket ${socket.id} joined user room: user_${initialUserId}`);
    }

    // Explicit store room join
    socket.on('join:store', (storeId: string) => {
      if (!storeId || typeof storeId !== 'string') return;
      socket.join(`store_${storeId}`);
      socket.join(`store:${storeId}`);
      logger.info(`Socket ${socket.id} joined store room: store_${storeId}`);
      socket.emit('store:joined', { storeId, room: `store_${storeId}` });
    });

    // Explicit user room join
    socket.on('join:user', (userId: string) => {
      if (!userId || typeof userId !== 'string') return;
      socket.join(`user_${userId}`);
      logger.info(`Socket ${socket.id} joined user room: user_${userId}`);
      socket.emit('user:joined', { userId, room: `user_${userId}` });
    });

    // Leave store room
    socket.on('leave:store', (storeId: string) => {
      if (!storeId || typeof storeId !== 'string') return;
      socket.leave(`store_${storeId}`);
      socket.leave(`store:${storeId}`);
      logger.info(`Socket ${socket.id} left store room: store_${storeId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id}`, { reason });
    });

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
  const storeRoom = `store_${storeId}`;
  const legacyRoom = `store:${storeId}`;

  // Emit both event names for maximum compatibility
  ioInstance.to(storeRoom).to(legacyRoom).emit('new_order', order);
  ioInstance.to(storeRoom).to(legacyRoom).emit('order:created', order);

  logger.info(`Real-time event [new_order] emitted to room ${storeRoom}`, {
    orderId: (order as { id?: string })?.id,
  });
}

export function emitOrderUpdated(storeId: string, order: unknown, userId?: string | null): void {
  if (!ioInstance) return;
  const storeRoom = `store_${storeId}`;
  const legacyRoom = `store:${storeId}`;

  // Broadcast to store room
  ioInstance.to(storeRoom).to(legacyRoom).emit('order_status_updated', order);
  ioInstance.to(storeRoom).to(legacyRoom).emit('order:updated', order);

  // If user_id exists, broadcast directly to user's private notification room
  if (userId) {
    const userRoom = `user_${userId}`;
    ioInstance.to(userRoom).emit('order_status_updated', order);
    ioInstance.to(userRoom).emit('order:updated', order);
    logger.info(`Real-time event [order_status_updated] sent to user room ${userRoom}`);
  }

  logger.info(`Real-time event [order_status_updated] emitted for order ${((order as { id?: string })?.id)}`);
}

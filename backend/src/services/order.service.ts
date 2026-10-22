import { Order, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { RedisService } from './redis.service';
import { emitOrderCreated, emitOrderUpdated } from '../socket/socket.server';
import { CreateOrderInput, GetOrdersQuery } from '../validators/order.schema';
import { NotFoundError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

export interface PaginatedOrdersResponse {
  orders: Order[];
  nextCursor: string | null;
  hasMore: boolean;
  totalReturned: number;
}

export class OrderService {
  /**
   * Create a new order with calculated total_amount, payment handling, and real-time broadcasting
   */
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    // 1. Normalize line-items and calculate subtotal
    const normalizedItems = input.items.map((item) => {
      const qty = item.qty || item.quantity || 1;
      const price = item.price !== undefined ? item.price : (item.unit_price || 0);
      const subtotal = Math.round(qty * price * 100) / 100;
      return {
        item_id: item.item_id || '',
        name: item.name,
        qty,
        quantity: qty,
        price,
        unit_price: price,
        subtotal,
      };
    });

    const totalAmount = Math.round(
      normalizedItems.reduce((acc, curr) => acc + curr.subtotal, 0) * 100
    ) / 100;

    // 2. Set payment_status: COMPLETED for simulated electronic payments (CARD, UPI) or PENDING for Cash on Delivery
    let paymentStatus: PaymentStatus = 'PENDING';
    if (input.payment_status) {
      paymentStatus = input.payment_status;
    } else if (input.payment_method === 'CARD' || input.payment_method === 'UPI') {
      paymentStatus = 'COMPLETED';
    }

    const orderStatus: OrderStatus = input.status || (input.payment_method === 'CASH' ? 'PENDING' : 'PLACED');

    // 3. Validate store exists, fallback if needed to prevent foreign key errors
    let targetStoreId = input.store_id;
    const store = await prisma.store.findUnique({
      where: { id: targetStoreId },
      select: { id: true },
    });

    if (!store) {
      const fallbackStore = await prisma.store.findFirst({
        where: { is_active: true },
        select: { id: true },
      });
      if (!fallbackStore) {
        throw new NotFoundError(`No active store found to process order`);
      }
      targetStoreId = fallbackStore.id;
    }

    // 4. Validate user exists (guards against stale JWT / localStorage tokens after re-seeding)
    let validUserId: string | null = null;
    if (input.user_id) {
      const userExists = await prisma.user.findUnique({
        where: { id: input.user_id },
        select: { id: true },
      });
      if (userExists) {
        validUserId = userExists.id;
      }
    }

    // 5. Persist order in PostgreSQL
    const order = await prisma.order.create({
      data: {
        store_id: targetStoreId,
        user_id: validUserId,
        items: normalizedItems,
        total_amount: totalAmount,
        status: orderStatus,
        payment_method: input.payment_method,
        payment_status: paymentStatus,
      },
      include: {
        store: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info(`Order created: ${order.id} for store ${order.store_id}`, {
      orderId: order.id,
      storeId: order.store_id,
      totalAmount: order.total_amount,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
    });

    // 4. Invalidate Redis caches
    await Promise.all([
      RedisService.invalidatePattern(`orders:${order.store_id}:*`),
      RedisService.invalidatePattern('analytics:*'),
    ]);

    // 5. Broadcast real-time Socket.IO event to store room
    emitOrderCreated(order.store_id, order);

    return order;
  }

  /**
   * Fetch orders for a store with cursor-based pagination and Redis caching
   */
  static async getOrders(query: GetOrdersQuery): Promise<PaginatedOrdersResponse> {
    const { store_id, cursor, limit = 10, status } = query;
    const cacheKey = `orders:${store_id}:cursor:${cursor || 'initial'}:limit:${limit}:status:${status || 'all'}`;

    // 1. Try Redis cache first
    const cached = await RedisService.get<PaginatedOrdersResponse>(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT for orders query: ${cacheKey}`);
      return cached;
    }

    logger.debug(`Cache MISS for orders query: ${cacheKey}`);

    // 2. Build Prisma query
    const whereClause: {
      store_id: string;
      status?: OrderStatus;
    } = {
      store_id,
      ...(status ? { status } : {}),
    };

    const takeCount = limit + 1; // Take one extra to determine nextCursor

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: takeCount,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      include: {
        store: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    });

    const hasMore = orders.length > limit;
    const resultOrders = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore && resultOrders.length > 0 ? resultOrders[resultOrders.length - 1]!.id : null;

    const response: PaginatedOrdersResponse = {
      orders: resultOrders,
      nextCursor,
      hasMore,
      totalReturned: resultOrders.length,
    };

    // Cache the result in Redis for 60 seconds
    await RedisService.set(cacheKey, response, 60);

    return response;
  }

  /**
   * Update order status with row-level locking (SELECT ... FOR UPDATE) to eliminate race conditions & deadlocks
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Execute raw query with row-level lock (FOR UPDATE)
      const lockedRows = await tx.$queryRaw<Order[]>`
        SELECT id, store_id, user_id, items, total_amount, status, payment_method, payment_status, created_at
        FROM "orders"
        WHERE "id" = ${orderId}::uuid
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new NotFoundError(`Order with ID ${orderId} not found`);
      }

      const existingOrder = lockedRows[0]!;

      // Update status on locked record
      const updated = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status,
          ...(status === 'PREPARED' && existingOrder.payment_status === 'PENDING'
            ? { payment_status: 'COMPLETED' }
            : {}),
        },
        include: {
          store: { select: { id: true, name: true, location: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    logger.info(`Order status updated to ${status} for order: ${updatedOrder.id}`, {
      orderId: updatedOrder.id,
      storeId: updatedOrder.store_id,
      status: updatedOrder.status,
    });

    // Invalidate Redis caches
    await Promise.all([
      RedisService.invalidatePattern(`orders:${updatedOrder.store_id}:*`),
      RedisService.invalidatePattern('analytics:*'),
    ]);

    // Broadcast real-time update to store room and user room
    emitOrderUpdated(updatedOrder.store_id, updatedOrder, updatedOrder.user_id);

    return updatedOrder;
  }

  /**
   * Fetch a single order by ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  /**
   * Fetch orders placed by a specific user with search, status/store filtering, and pagination
   */
  static async getUserOrders(
    userId: string,
    query?: {
      search?: string;
      q?: string;
      status?: string;
      store_id?: string;
      page?: number | string;
      limit?: number | string;
    }
  ) {
    const where: any = { user_id: userId };
    const searchTerm = (query?.search || query?.q || '').trim();

    if (searchTerm) {
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { store: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query?.store_id && query.store_id !== 'all') {
      where.store_id = query.store_id;
    }

    const total = await prisma.order.count({ where });

    const page = query?.page ? Math.max(Number(query.page), 1) : 1;
    const limit = query?.limit ? Math.min(Math.max(Number(query.limit), 1), 100) : 10;
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        store: { select: { id: true, name: true, location: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }
}

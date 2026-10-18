import { Order, OrderStatus } from '@prisma/client';
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
   * Create a new order with atomic total calculation and real-time broadcasting
   */
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    // Calculate line-item subtotals and verify total_amount
    const normalizedItems = input.items.map((item) => {
      const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
      return {
        ...item,
        subtotal,
      };
    });

    const totalAmount = Math.round(
      normalizedItems.reduce((acc, curr) => acc + curr.subtotal, 0) * 100
    ) / 100;

    const order = await prisma.order.create({
      data: {
        store_id: input.store_id,
        items: normalizedItems,
        total_amount: totalAmount,
        status: input.status || 'PLACED',
      },
    });

    logger.info(`Order created successfully: ${order.id} for store ${order.store_id}`, {
      orderId: order.id,
      storeId: order.store_id,
      totalAmount: order.total_amount,
    });

    // Invalidate Redis caches for this store and global analytics
    await Promise.all([
      RedisService.invalidatePattern(`orders:${order.store_id}:*`),
      RedisService.invalidatePattern('analytics:*'),
    ]);

    // Real-time broadcast to store room
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

    // 2. Build Prisma cursor-based query
    const whereClause: {
      store_id: string;
      status?: OrderStatus;
    } = {
      store_id,
      ...(status ? { status } : {}),
    };

    const takeCount = limit + 1; // Take one extra to determine nextCursor and hasMore

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: takeCount,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
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
   * Update order status with row-level locking (SELECT ... FOR UPDATE) to prevent concurrency anomalies
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Execute raw query with row-level lock (FOR UPDATE)
      const lockedRows = await tx.$queryRaw<Order[]>`
        SELECT id, store_id, items, total_amount, status, created_at
        FROM "orders"
        WHERE "id" = ${orderId}::uuid
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new NotFoundError(`Order with ID ${orderId} not found`);
      }

      const existingOrder = lockedRows[0]!;

      // Update the status of the locked row
      const updated = await tx.order.update({
        where: { id: existingOrder.id },
        data: { status },
      });

      return updated;
    });

    logger.info(`Order status updated to ${status} for order: ${updatedOrder.id}`, {
      orderId: updatedOrder.id,
      storeId: updatedOrder.store_id,
      status: updatedOrder.status,
    });

    // Invalidate Redis caches for this store and global analytics
    await Promise.all([
      RedisService.invalidatePattern(`orders:${updatedOrder.store_id}:*`),
      RedisService.invalidatePattern('analytics:*'),
    ]);

    // Broadcast real-time update to store room
    emitOrderUpdated(updatedOrder.store_id, updatedOrder);

    return updatedOrder;
  }

  /**
   * Fetch a single order by ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID ${orderId} not found`);
    }

    return order;
  }
}


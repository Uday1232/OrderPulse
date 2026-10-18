import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { CreateOrderInput, GetOrdersQuery, UpdateOrderStatusInput } from '../validators/order.schema';

export class OrderController {
  /**
   * POST /orders
   * Create a new order with validation and real-time broadcasting
   */
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.createOrder(req.body as CreateOrderInput);
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders
   * Retrieve orders for a specific store with cursor pagination and Redis caching
   */
  static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.getOrders(req.query as unknown as GetOrdersQuery);
      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          totalReturned: result.totalReturned,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /orders/:id/status
   * Update order status with row-level locking
   */
  static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateOrderStatusInput;
      const updated = await OrderService.updateOrderStatus(id!, status);
      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /orders/:id
   * Fetch a single order by UUID
   */
  static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id!);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}


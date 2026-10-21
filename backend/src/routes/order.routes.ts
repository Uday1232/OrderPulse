import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { validateRequest } from '../middlewares/validate';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import {
  CreateOrderSchema,
  GetOrdersQuerySchema,
  OrderIdParamSchema,
  UpdateOrderStatusSchema,
} from '../validators/order.schema';

const router = Router();

// POST /orders - Create a new order (Public or Authenticated User/Guest)
router.post(
  '/',
  validateRequest({ body: CreateOrderSchema }),
  OrderController.createOrder
);

// GET /orders - Fetch orders filtered by store_id with cursor pagination & caching
router.get(
  '/',
  validateRequest({ query: GetOrdersQuerySchema }),
  OrderController.getOrders
);

// GET /orders/my-orders - Authenticated Customer: Fetch current user's orders
router.get(
  '/my-orders',
  authenticate,
  OrderController.getMyOrders
);

// GET /orders/:id - Fetch single order by UUID
router.get(
  '/:id',
  validateRequest({ params: OrderIdParamSchema }),
  OrderController.getOrderById
);

// PATCH /orders/:id/status - Admin only: Update order status with row-level locking
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('ADMIN'),
  validateRequest({
    params: OrderIdParamSchema,
    body: UpdateOrderStatusSchema,
  }),
  OrderController.updateOrderStatus
);

export default router;

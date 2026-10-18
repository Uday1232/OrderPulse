import { z } from 'zod';

export const OrderStatusEnum = z.enum(['PLACED', 'PREPARING', 'COMPLETED']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name cannot be empty'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
  unit_price: z
    .number()
    .positive('Unit price must be greater than 0'),
  subtotal: z.number().positive().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const CreateOrderSchema = z.object({
  store_id: z.string().trim().min(1, 'store_id is required'),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  status: OrderStatusEnum.default('PLACED'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const GetOrdersQuerySchema = z.object({
  store_id: z.string().trim().min(1, 'store_id query parameter is required'),
  cursor: z.string().uuid('Cursor must be a valid UUID').optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  status: OrderStatusEnum.optional(),
});

export type GetOrdersQuery = z.infer<typeof GetOrdersQuerySchema>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const OrderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID. Must be a valid UUID'),
});

export const ArchiveOrdersSchema = z.object({
  days_threshold: z
    .number()
    .int('Days threshold must be an integer')
    .min(1, 'Days threshold must be at least 1')
    .optional()
    .default(30),
});

export type ArchiveOrdersInput = z.infer<typeof ArchiveOrdersSchema>;

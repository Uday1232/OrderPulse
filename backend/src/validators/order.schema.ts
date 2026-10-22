import { z } from 'zod';

export const OrderItemSchema = z.object({
  item_id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional(),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional(),
  unit_price: z.coerce.number().min(0, 'Price must be non-negative').optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative').optional(),
}).transform((item) => ({
  item_id: item.item_id || '',
  name: item.name,
  qty: item.qty || item.quantity || 1,
  quantity: item.qty || item.quantity || 1,
  price: item.price !== undefined ? item.price : (item.unit_price || 0),
  unit_price: item.price !== undefined ? item.price : (item.unit_price || 0),
}));

export const CreateOrderSchema = z.object({
  store_id: z.string().uuid('store_id must be a valid UUID'),
  user_id: z.string().uuid().optional().nullable(),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  delivery_address: z.string().min(1, 'Delivery address is compulsory to place an order'),
  address: z.string().optional(),
  save_address: z.boolean().optional(),
  payment_method: z.enum(['CASH', 'CARD', 'UPI']).default('CASH'),
  payment_status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  status: z.enum(['PENDING', 'PLACED', 'PREPARED', 'CANCELLED']).default('PLACED'),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PLACED', 'PREPARED', 'CANCELLED']),
});

export const OrderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID. Must be a valid UUID'),
});

export const GetOrdersQuerySchema = z.object({
  store_id: z.string().uuid('store_id must be a valid UUID'),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'PLACED', 'PREPARED', 'CANCELLED']).optional(),
});

export const ArchiveOrdersSchema = z.object({
  days_threshold: z.coerce.number().int().min(1, 'days_threshold must be at least 1').default(30),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type GetOrdersQuery = z.infer<typeof GetOrdersQuerySchema>;
export type ArchiveOrdersInput = z.infer<typeof ArchiveOrdersSchema>;

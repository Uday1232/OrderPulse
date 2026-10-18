import { z } from 'zod';

export const CreateStoreSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters'),
  location: z.string().min(2, 'Store location is required'),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
});

export const CreateItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  description: z.string().optional().default(''),
  price: z.coerce.number().positive('Price must be greater than 0'),
  category_id: z.string().uuid('category_id must be a valid UUID'),
  rating: z.coerce.number().min(1).max(5).optional().default(4.5),
  image_url: z.string().optional(),
});

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;

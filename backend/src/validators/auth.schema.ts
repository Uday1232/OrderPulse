import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'USER']).default('USER').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateAdminSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Valid email format required').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'USER']),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

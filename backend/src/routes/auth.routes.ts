import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { RegisterSchema, LoginSchema, UpdateUserRoleSchema, CreateAdminSchema } from '../validators/auth.schema';

const router = Router();

// POST /auth/register - Register a new user
router.post(
  '/register',
  validateRequest({ body: RegisterSchema }),
  AuthController.register
);

// POST /auth/login - Login user & return JWT token
router.post(
  '/login',
  validateRequest({ body: LoginSchema }),
  AuthController.login
);

// GET /auth/me - Verify current token & return profile
router.get(
  '/me',
  authenticate,
  AuthController.me
);

// GET /auth/profile - Return full user profile with order metrics
router.get(
  '/profile',
  authenticate,
  AuthController.me
);

// PATCH & PUT /auth/profile - Update user profile (delivery address, name)
router.patch('/profile', authenticate, AuthController.updateProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.patch('/me', authenticate, AuthController.updateProfile);

// POST /auth/admins - Create a new Store Admin with auto-generated credentials (SUPERADMIN only)
router.post(
  '/admins',
  authenticate,
  authorizeRoles('SUPERADMIN'),
  validateRequest({ body: CreateAdminSchema }),
  AuthController.createAdmin
);

// GET /auth/users - List all registered users (Admin / Superadmin only)
router.get(
  '/users',
  authenticate,
  authorizeRoles('ADMIN'),
  AuthController.getAllUsers
);

// PATCH /auth/users/:id/role - Promote/Demote user role (SUPERADMIN only)
router.patch(
  '/users/:id/role',
  authenticate,
  authorizeRoles('SUPERADMIN'),
  validateRequest({ body: UpdateUserRoleSchema }),
  AuthController.updateUserRole
);

export default router;

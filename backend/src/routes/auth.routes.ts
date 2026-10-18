import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { RegisterSchema, LoginSchema } from '../validators/auth.schema';

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

export default router;

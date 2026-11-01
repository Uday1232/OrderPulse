import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Role } from '@prisma/client';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError, BadRequestError } from '../middlewares/errorHandler';
import { RegisterInput, LoginInput, CreateAdminInput } from '../validators/auth.schema';
import { RedisService } from './redis.service';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    address?: string;
  };
  token: string;
}

export class AuthService {
  /**
   * Register a new user and generate a JWT token
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const resolvedName = input.name && input.name.trim().length > 0 ? input.name.trim() : input.email.split('@')[0] || 'User';

    // Strict RBAC Security Policy: Public registration strictly creates 'USER' accounts only.
    // Store Admins can ONLY be created by an authenticated SuperAdmin via Staff Management.
    const assignedRole: Role = 'USER';

    const user = await prisma.user.create({
      data: {
        name: resolvedName,
        email: input.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: assignedRole,
      },
    });

    logger.info(`User registered: ${user.email} (Role: ${user.role})`);

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address || '',
      },
      token,
    };
  }

  /**
   * Login user by validating email and password
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email} (Role: ${user.role})`);

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address || '',
      },
      token,
    };
  }

  /**
   * Fetch current user profile with complete metrics and recent orders
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        created_at: true,
        _count: {
          select: {
            orders: true,
            stores: true,
          },
        },
        orders: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            total_amount: true,
            status: true,
            created_at: true,
            store: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
        stores: {
          take: 5,
          select: {
            id: true,
            name: true,
            location: true,
            is_active: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || '',
      created_at: user.created_at,
      ordersCount: user._count.orders,
      recentOrders: user.orders,
      storesCount: user._count.stores,
      managedStores: user.stores,
    };
  }

  /**
   * Update user profile information such as delivery address or display name
   */
  static async updateUserProfile(userId: string, data: { name?: string; address?: string }) {
    const updateData: { name?: string; address?: string } = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.address !== undefined) updateData.address = data.address.trim();

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        created_at: true,
      },
    });

    return user;
  }

  /**
   * Fetch all registered users with optional search, role filter, and pagination (Admin only)
   */
  static async getAllUsers(query?: { search?: string; q?: string; role?: string; page?: number | string; limit?: number | string }) {
    const where: any = {};
    const searchTerm = (query?.search || query?.q || '').trim();

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.role) {
      const roleUpper = query.role.toUpperCase();
      if (['SUPERADMIN', 'ADMIN', 'USER'].includes(roleUpper)) {
        where.role = roleUpper;
      }
    }

    const total = await prisma.user.count({ where });

    const page = query?.page ? Math.max(Number(query.page), 1) : 1;
    const limit = query?.limit ? Math.min(Math.max(Number(query.limit), 1), 100) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      users,
      total,
      page,
      limit: limit || total,
      totalPages: Math.max(Math.ceil(total / (limit || total || 1)), 1),
    };
  }

  /**
   * Create a new Store Admin with auto-generated credentials (Admin/Superadmin only)
   */
  static async createAdmin(input: CreateAdminInput) {
    const randomHex = Math.random().toString(36).substring(2, 7);
    const name = input.name?.trim() || `Admin_${randomHex.toUpperCase()}`;
    const email = input.email?.trim().toLowerCase() || `admin_${randomHex}@storepulse.com`;

    // Auto-generate strong secure password if omitted
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generatedPass = 'Admin@';
    for (let i = 0; i < 6; i++) {
      generatedPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const plainPassword = input.password?.trim() || generatedPass;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictError(`User with email "${email}" already exists`);
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    logger.info(`Store Admin created via Staff Management: ${user.email}`);

    return {
      user,
      credentials: {
        email,
        plainPassword,
      },
    };
  }

  /**
   * Update a user's role (SuperAdmin only)
   */
  static async updateUserRole(userId: string, role: Role, requesterRole?: Role) {
    if (requesterRole !== 'SUPERADMIN') {
      throw new ForbiddenError('Only Superadmin can modify user roles');
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Protect master SuperAdmin account
    if (existing.role === 'SUPERADMIN') {
      throw new ForbiddenError('Superadmin account cannot be modified or demoted');
    }

    if (role === 'SUPERADMIN') {
      throw new ForbiddenError('Only one Superadmin is permitted in the system');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    logger.info(`User ${updated.email} role updated to: ${role}`);
    return updated;
  }

  /**
   * Request password reset token with anti-enumeration protection and rate limiting
   */
  static async forgotPassword(
    email: string,
    clientIp?: string,
    clientOrigin?: string
  ): Promise<{ success: boolean; message: string; devResetUrl?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Rate limiting check (e.g., max 5 requests per 15 minutes per IP or Email, bypassed in tests)
    if (env.NODE_ENV !== 'test') {
      const rateLimitKey = `pwd_rate:${clientIp || normalizedEmail}`;
      const attempts = await RedisService.get<number>(rateLimitKey);
      if (attempts && attempts >= 5) {
        throw new BadRequestError('Too many password reset requests. Please wait 15 minutes before trying again.');
      }
      await RedisService.set(rateLimitKey, (attempts || 0) + 1, 900);
    }

    // 2. Lookup user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let devResetUrl: string | undefined;

    // 3. If user exists, generate cryptographically secure token & hash it
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Store in Redis with 15-minute TTL (900 seconds)
      const tokenKey = `pwd_reset:${hashedToken}`;
      await RedisService.set(tokenKey, user.id, 900);

      // Dynamically resolve frontend base URL
      let frontendBase = env.FRONTEND_URL;
      if (clientOrigin && clientOrigin.startsWith('http')) {
        try {
          const parsed = new URL(clientOrigin);
          frontendBase = parsed.origin;
        } catch (_) {}
      }
      if (!frontendBase || frontendBase === 'http://localhost:3000') {
        if (env.NODE_ENV === 'production') {
          frontendBase = 'https://orderpulse-frontend-three.vercel.app';
        } else {
          frontendBase = 'http://localhost:3000';
        }
      }

      const resetUrl = `${frontendBase}/reset-password?token=${rawToken}`;

      // Dispatch branded email directly via Gmail SMTP
      await EmailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

      if (env.NODE_ENV !== 'production') {
        devResetUrl = resetUrl;
      }

      logger.info(`Password reset requested for user: ${user.email} (ID: ${user.id})`);
    } else {
      logger.info(`Password reset requested for non-existent email: ${normalizedEmail}`);
    }

    // 4. Return clean, anti-enumeration success message
    return {
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
      devResetUrl,
    };
  }

  /**
   * Reset user password using the one-time secure token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!token || token.length < 32) {
      throw new BadRequestError('Invalid or missing password reset token.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters.');
    }

    // 1. Compute SHA-256 hash of provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenKey = `pwd_reset:${hashedToken}`;

    // 2. Fetch userId from Redis
    const userId = await RedisService.get<string>(tokenKey);
    if (!userId) {
      throw new BadRequestError('Password reset link is invalid or has expired. Please request a new link.');
    }

    // 3. Find user in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await RedisService.del(tokenKey);
      throw new NotFoundError('User account associated with this reset link no longer exists.');
    }

    // 4. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 5. Update user password in PostgreSQL
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: passwordHash },
    });

    // 6. Burn the token immediately (single-use guarantee)
    await RedisService.del(tokenKey);

    logger.info(`Password successfully reset for user ${user.email} (${user.id})`);

    return {
      success: true,
      message: 'Your password has been successfully reset. You may now log in with your new password.',
    };
  }

  private static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }
}

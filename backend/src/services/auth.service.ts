import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Role } from '@prisma/client';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler';
import { RegisterInput, LoginInput, CreateAdminInput } from '../validators/auth.schema';
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

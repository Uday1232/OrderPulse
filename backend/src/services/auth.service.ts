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

    // Public registration creates regular users only; Admins must be created via Staff Management
    const assignedRole: Role = input.role === 'SUPERADMIN' ? 'USER' : (input.role || 'USER');

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
      },
      token,
    };
  }

  /**
   * Fetch current user profile
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  /**
   * Fetch all registered users (Admin only)
   */
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
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
   * Update a user's role (Admin / SuperAdmin only)
   */
  static async updateUserRole(userId: string, role: Role, requesterRole?: Role) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Only SUPERADMIN can demote or promote to SUPERADMIN
    if (existing.role === 'SUPERADMIN' && requesterRole !== 'SUPERADMIN') {
      throw new ForbiddenError('Only Superadmin can modify another Superadmin account');
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

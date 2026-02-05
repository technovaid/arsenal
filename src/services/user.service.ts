import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

export interface CreateUserInput {
  email: string;
  name?: string;
  fullname?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  fullname?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateFullnameInput {
  fullname: string;
}

class UserService {
  /**
   * Get all users (for Super Admin)
   */
  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullname: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          fullname: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        fullname: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Create new user (Super Admin only)
   */
  async createUser(data: CreateUserInput) {
    const { email: rawEmail, name, fullname, password, role = UserRole.VIEWER } = data;

    const email = rawEmail.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        fullname,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        fullname: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info(`User created by admin: ${user.email}`);

    return user;
  }

  /**
   * Update user (Super Admin only)
   */
  async updateUser(id: string, data: UpdateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        fullname: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${user.email}`);

    return user;
  }

  /**
   * Update own fullname (user can update their own fullname)
   */
  async updateOwnFullname(userId: string, data: UpdateFullnameInput) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullname: data.fullname },
      select: {
        id: true,
        email: true,
        name: true,
        fullname: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated own fullname: ${user.email}`);

    return user;
  }

  /**
   * Delete user (Super Admin only)
   */
  async deleteUser(id: string, requesterId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    if (existingUser.id === requesterId) {
      throw ApiError.badRequest('Cannot delete your own account');
    }

    if (existingUser.role === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot delete Super Admin account');
    }

    await prisma.user.delete({
      where: { id },
    });

    logger.info(`User deleted: ${existingUser.email}`);

    return { message: 'User deleted successfully' };
  }
}

export const userService = new UserService();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AzureLoginInput {
  azureUser: {
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  };
  azureAccessToken: string;
}

class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterInput) {
    const { email: rawEmail, name, password, role = UserRole.VIEWER } = data;

    // Normalize email to lowercase
    const email = rawEmail.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info(`User registered: ${user.email}`);

    return user;
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    const { email: rawEmail, password } = data;

    // Normalize email to lowercase for case-insensitive lookup
    const email = rawEmail.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as {
        id: string;
        email: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }

  /**
   * Azure AD login
   */
  async azureLogin(data: AzureLoginInput) {
    const { azureUser, azureAccessToken } = data;
    const rawEmail = azureUser.mail || azureUser.userPrincipalName;

    if (!rawEmail) {
      throw ApiError.badRequest('Email not found in Azure user data');
    }

    // Normalize email to lowercase for case-insensitive lookup
    const email = rawEmail.toLowerCase();

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // User must exist in database to login with Microsoft
    if (!user) {
      logger.warn(`Azure login attempt failed: User not found in database - ${email}`);
      throw ApiError.forbidden(
        'Akun Anda tidak terdaftar dalam sistem. Silakan hubungi administrator untuk mendaftarkan akun Anda terlebih dahulu.'
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    // Update last login and name
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        name: azureUser.displayName || user.name,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    logger.info(`User logged in via Azure AD: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw ApiError.badRequest('Invalid old password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      } as jwt.SignOptions
    );
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      } as jwt.SignOptions
    );
  }
}

export const authService = new AuthService();

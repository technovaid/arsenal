import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';

export class UserController {
  /**
   * Get all users (Super Admin only)
   */
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await userService.getAllUsers(page, limit, search);
      return ApiResponse.success(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (Super Admin only)
   */
  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user (Super Admin only)
   */
  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user (Super Admin only)
   */
  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update own fullname (authenticated user)
   */
  async updateOwnFullname(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await userService.updateOwnFullname(userId, req.body);
      return ApiResponse.success(res, user, 'Fullname updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (Super Admin only)
   */
  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requesterId = req.user!.id;
      const result = await userService.deleteUser(id, requesterId);
      return ApiResponse.success(res, result, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

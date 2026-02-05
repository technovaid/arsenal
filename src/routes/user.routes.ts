import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Super Admin only)
 * @access  Private (Super Admin)
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
  ]),
  userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (Super Admin only)
 * @access  Private (Super Admin)
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
  ]),
  userController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user (Super Admin only)
 * @access  Private (Super Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('fullname').optional().isString().withMessage('Fullname must be a string'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
  ]),
  userController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (Super Admin only)
 * @access  Private (Super Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('fullname').optional().isString().withMessage('Fullname must be a string'),
    body('role')
      .optional()
      .isIn(Object.values(UserRole))
      .withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ]),
  userController.updateUser
);

/**
 * @route   PATCH /api/v1/users/me/fullname
 * @desc    Update own fullname (authenticated user or Super Admin)
 * @access  Private
 */
router.patch(
  '/me/fullname',
  authenticate,
  validate([
    body('fullname').notEmpty().withMessage('Fullname is required'),
  ]),
  userController.updateOwnFullname
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (Super Admin only)
 * @access  Private (Super Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
  ]),
  userController.deleteUser
);

export default router;

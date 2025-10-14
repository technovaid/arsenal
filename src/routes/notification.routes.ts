import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, type, page, limit } = req.query;
    
    const filters = {
      status: status as any,
      type: type as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await notificationService.getUserNotifications(
      (req as AuthRequest).user!.id,
      filters
    );

    return ApiResponse.paginated(
      res,
      result.notifications,
      result.page,
      result.limit,
      result.total
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    return ApiResponse.success(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

export default router;

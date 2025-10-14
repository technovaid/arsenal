import { Router } from 'express';
import { body } from 'express-validator';
import { alertController } from '../controllers/alert.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/alerts
 * @desc    Create new alert
 * @access  Private (OPS, ANALYST, ADMIN)
 */
router.post(
  '/',
  authorize('OPS', 'ANALYST', 'ADMIN'),
  validate([
    body('type').notEmpty().withMessage('Alert type is required'),
    body('severity').notEmpty().withMessage('Severity is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ]),
  alertController.createAlert
);

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts
 * @access  Private
 */
router.get('/', alertController.getAlerts);

/**
 * @route   GET /api/v1/alerts/statistics
 * @desc    Get alert statistics
 * @access  Private
 */
router.get('/statistics', alertController.getStatistics);

/**
 * @route   GET /api/v1/alerts/:id
 * @desc    Get alert by ID
 * @access  Private
 */
router.get('/:id', alertController.getAlertById);

/**
 * @route   PATCH /api/v1/alerts/:id
 * @desc    Update alert
 * @access  Private (OPS, ANALYST, MANAGER, ADMIN)
 */
router.patch(
  '/:id',
  authorize('OPS', 'ANALYST', 'MANAGER', 'ADMIN'),
  alertController.updateAlert
);

/**
 * @route   POST /api/v1/alerts/:id/acknowledge
 * @desc    Acknowledge alert
 * @access  Private (OPS, ANALYST, MANAGER, ADMIN)
 */
router.post(
  '/:id/acknowledge',
  authorize('OPS', 'ANALYST', 'MANAGER', 'ADMIN'),
  alertController.acknowledgeAlert
);

/**
 * @route   POST /api/v1/alerts/:id/resolve
 * @desc    Resolve alert
 * @access  Private (OPS, ANALYST, MANAGER, ADMIN)
 */
router.post(
  '/:id/resolve',
  authorize('OPS', 'ANALYST', 'MANAGER', 'ADMIN'),
  validate([
    body('resolution').notEmpty().withMessage('Resolution is required'),
  ]),
  alertController.resolveAlert
);

/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete alert
 * @access  Private (ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), alertController.deleteAlert);

export default router;

import { Router } from 'express';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/power-usage
 * @desc    Get power usage data
 * @access  Private
 */
router.get('/', (_req, res) => {
  res.json({ message: 'Get power usage - To be implemented' });
});

/**
 * @route   GET /api/v1/power-usage/:siteId
 * @desc    Get power usage by site
 * @access  Private
 */
router.get('/:siteId', (_req, res) => {
  res.json({ message: 'Get power usage by site - To be implemented' });
});

/**
 * @route   POST /api/v1/power-usage
 * @desc    Create power usage record
 * @access  Private (ADMIN)
 */
router.post('/', (_req, res) => {
  res.json({ message: 'Create power usage - To be implemented' });
});

export default router;

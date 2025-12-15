import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { siteController } from '../controllers/site.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/sites
 * @desc    Get sites with filtering and pagination
 * @access  Private
 */
router.get('/', siteController.getSites.bind(siteController));

/**
 * @route   GET /api/v1/sites/regions
 * @desc    Get available regions
 * @access  Private
 */
router.get('/regions', siteController.getRegions.bind(siteController));

/**
 * @route   GET /api/v1/sites/:siteId/detail
 * @desc    Get site detail by siteId
 * @access  Private
 */
router.get('/:siteId/detail', siteController.getSiteDetail.bind(siteController));

/**
 * @route   POST /api/v1/sites
 * @desc    Create new site
 * @access  Private (ADMIN)
 */
router.post('/', (_req, res) => {
  res.json({ message: 'Create site - To be implemented' });
});

/**
 * @route   PATCH /api/v1/sites/:id
 * @desc    Update site
 * @access  Private (ADMIN)
 */
router.patch('/:id', (_req, res) => {
  res.json({ message: 'Update site - To be implemented' });
});

export default router;

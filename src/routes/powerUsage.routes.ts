import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { powerUsageController } from '../controllers/powerUsage.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/power-usage/sites
 * @desc    Get power usage sites with filtering
 * @access  Private
 * @query   search - search by siteId or siteName
 * @query   region - filter by region
 * @query   nop - filter by NOP
 * @query   regency - filter by regency
 * @query   powerRange - filter by power range (< 53.000 VA | ≥ 53.000 VA)
 * @query   payloadLevel - filter by payload level (Low | Medium | High)
 * @query   outlierType - filter by outlier type (Valid | Over | Under)
 * @query   period - filter by period (Last 3 Months | Last 6 Months | Last 12 Months)
 */
router.get('/sites', powerUsageController.getPowerUsageSites.bind(powerUsageController));

/**
 * @route   GET /api/v1/power-usage/:siteId
 * @desc    Get power usage history for a site (for charts)
 * @access  Private
 */
router.get('/:siteId', powerUsageController.getSitePowerUsage.bind(powerUsageController));

/**
 * @route   POST /api/v1/power-usage
 * @desc    Create power usage record
 * @access  Private (ADMIN)
 */
router.post('/', (_req, res) => {
  res.json({ message: 'Create power usage - To be implemented' });
});

export default router;

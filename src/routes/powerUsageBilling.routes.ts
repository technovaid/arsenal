import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { powerUsageBillingController } from '../controllers/powerUsageBilling.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/power-usage-billing/sites
 * @desc    Get all sites with power usage billing data
 * @access  Private
 */
router.get('/sites', powerUsageBillingController.getSites.bind(powerUsageBillingController));

/**
 * @route   GET /api/v1/power-usage-billing/summary
 * @desc    Get summary statistics
 * @access  Private
 */
router.get('/summary', powerUsageBillingController.getSummary.bind(powerUsageBillingController));

/**
 * @route   GET /api/v1/power-usage-billing/periods
 * @desc    Get available periods (yearmonth values)
 * @access  Private
 */
router.get('/periods', powerUsageBillingController.getAvailablePeriods.bind(powerUsageBillingController));

/**
 * @route   GET /api/v1/power-usage-billing/filter-options
 * @desc    Get filter options (regions, NOPs, regencies, etc.)
 * @access  Private
 */
router.get('/filter-options', powerUsageBillingController.getFilterOptions.bind(powerUsageBillingController));

/**
 * @route   GET /api/v1/power-usage-billing/model-performance
 * @desc    Get model performance summary by cluster
 * @access  Private
 */
router.get('/model-performance', powerUsageBillingController.getModelPerformanceSummary.bind(powerUsageBillingController));

/**
 * @route   GET /api/v1/power-usage-billing/sites/:siteId/monthly
 * @desc    Get monthly series data for a specific site
 * @access  Private
 */
router.get('/sites/:siteId/monthly', powerUsageBillingController.getSiteMonthlyData.bind(powerUsageBillingController));

export default router;

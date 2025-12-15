import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { anomalyController } from '../controllers/anomaly.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/anomalies/summary
 * @desc    Get anomaly summary counts by severity
 * @access  Private
 */
router.get('/summary', anomalyController.getSummary.bind(anomalyController));

/**
 * @route   GET /api/v1/anomalies
 * @desc    Get anomaly list with filtering and pagination
 * @access  Private
 */
router.get('/', anomalyController.getAnomalies.bind(anomalyController));

export default router;

import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard/summary
 * @desc    Get dashboard summary statistics
 * @access  Private
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @route   GET /api/v1/dashboard/consumption
 * @desc    Get consumption data for chart
 * @access  Private
 * @query   period - daily | weekly | monthly
 * @query   startDate - ISO date string
 * @query   endDate - ISO date string
 */
router.get('/consumption', dashboardController.getConsumption);

/**
 * @route   GET /api/v1/dashboard/heatmap
 * @desc    Get heatmap data for sites
 * @access  Private
 */
router.get('/heatmap', dashboardController.getHeatmap);

/**
 * @route   GET /api/v1/dashboard/ticket-status
 * @desc    Get ticket status distribution for pie chart
 * @access  Private
 */
router.get('/ticket-status', dashboardController.getTicketStatus);

/**
 * @route   GET /api/v1/dashboard/anomalies
 * @desc    Get recent anomalies for table
 * @access  Private
 * @query   limit - number of anomalies to return (default: 10)
 */
router.get('/anomalies', dashboardController.getAnomalies);

export default router;

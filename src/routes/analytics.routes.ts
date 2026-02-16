import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @route GET /api/v1/analytics/dashboard
 * @desc Get dashboard metrics summary (Power Usage & Billing)
 * @query {string} timeRange - today, week, or month (default: month)
 */
router.get('/dashboard', authenticate, AnalyticsController.getDashboardMetrics);

/**
 * @route GET /api/v1/analytics/power-graph
 * @desc Get power usage graph data (historical KWH trend)
 * @query {string} timeRange - today, week, or month (default: month)
 * @query {string} interval - hour or day (default: day)
 */
router.get('/power-graph', authenticate, AnalyticsController.getPowerGraph);

/**
 * @route GET /api/v1/analytics/power-factor-graph
 * @desc Get power factor (Daya VA) trend graph data
 * @query {string} timeRange - today, week, or month (default: month)
 * @query {string} interval - hour or day (default: day)
 */
router.get('/power-factor-graph', authenticate, AnalyticsController.getPowerFactorGraph);

/**
 * @route GET /api/v1/analytics/predictions
 * @desc Get ML predictions vs actual KWH (kwh_predictions_v0)
 * @query {number} days - Number of future days (default: 7, max: 365)
 * @query {string} dayaCluster - Filter by daya cluster (optional)
 */
router.get('/predictions', authenticate, AnalyticsController.getPredictions);

/**
 * @route GET /api/v1/analytics/model-performance
 * @desc Get ML model performance metrics (RMSE, MAE, R², MAPE)
 * @query {string} dayaCluster - Filter by daya cluster (optional)
 */
router.get('/model-performance', authenticate, AnalyticsController.getModelPerformance);

/**
 * @route GET /api/v1/analytics/feature-importance
 * @desc Get feature importance (SHAP values) for ML model
 * @query {string} dayaCluster - Filter by daya cluster (optional)
 */
router.get('/feature-importance', authenticate, AnalyticsController.getFeatureImportance);

/**
 * @route GET /api/v1/analytics/power-usage-by-site
 * @desc Get top consuming sites
 * @query {number} limit - Number of sites to return (default: 20, max: 1000)
 * @query {number} yearmonth - Specific yearmonth (YYYYMM format, optional)
 */
router.get('/power-usage-by-site', authenticate, AnalyticsController.getPowerUsageBySite);

/**
 * @route GET /api/v1/analytics/prediction-accuracy
 * @desc Get prediction accuracy metrics (MAE, MAPE)
 * @query {string} dayaCluster - Filter by daya cluster (optional)
 */
router.get('/prediction-accuracy', authenticate, AnalyticsController.getPredictionAccuracy);

/**
 * @route POST /api/v1/analytics/custom-query
 * @desc Execute custom ClickHouse query (admin only)
 * @body {string} query - ClickHouse SQL query
 */
router.post('/custom-query', authenticate, AnalyticsController.executeCustomQuery);

export default router;

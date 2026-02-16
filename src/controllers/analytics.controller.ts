import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { ApiError } from '../utils/ApiError';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/dashboard
   * Get dashboard metrics summary
   */
  static async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { timeRange = 'today' } = req.query;

      if (!['today', 'week', 'month'].includes(timeRange as string)) {
        throw ApiError.badRequest('Invalid timeRange. Must be: today, week, or month');
      }

      const metrics = await analyticsService.getDashboardMetrics(timeRange as 'today' | 'week' | 'month');

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/power-graph
   * Get power usage graph data
   */
  static async getPowerGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const { timeRange = 'today', interval = 'hour' } = req.query;

      if (!['today', 'week', 'month'].includes(timeRange as string)) {
        throw ApiError.badRequest('Invalid timeRange. Must be: today, week, or month');
      }

      if (!['hour', 'day'].includes(interval as string)) {
        throw ApiError.badRequest('Invalid interval. Must be: hour or day');
      }

      const data = await analyticsService.getPowerGraphData(
        timeRange as 'today' | 'week' | 'month',
        interval as 'hour' | 'day'
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/power-factor-graph
   * Get power factor graph data
   */
  static async getPowerFactorGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const { timeRange = 'today', interval = 'hour' } = req.query;

      if (!['today', 'week', 'month'].includes(timeRange as string)) {
        throw ApiError.badRequest('Invalid timeRange. Must be: today, week, or month');
      }

      if (!['hour', 'day'].includes(interval as string)) {
        throw ApiError.badRequest('Invalid interval. Must be: hour or day');
      }

      const data = await analyticsService.getPowerFactorGraphData(
        timeRange as 'today' | 'week' | 'month',
        interval as 'hour' | 'day'
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/predictions
   * Get predicted power usage from ML model
   */
  static async getPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = '7' } = req.query;
      const daysNum = parseInt(days as string);

      if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
        throw ApiError.badRequest('Invalid days. Must be between 1 and 365');
      }

      const data = await analyticsService.getPredictedPowerUsage(daysNum);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/model-performance
   * Get ML model performance metrics
   */
  static async getModelPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { dayaCluster } = req.query;

      const data = await analyticsService.getModelPerformance(dayaCluster as string | undefined);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/feature-importance
   * Get feature importance (SHAP values)
   */
  static async getFeatureImportance(req: Request, res: Response, next: NextFunction) {
    try {
      const { dayaCluster } = req.query;

      const data = await analyticsService.getFeatureImportance(dayaCluster as string | undefined);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/power-usage-by-site
   * Get power usage by site (top consumers)
   */
  static async getPowerUsageBySite(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '20', yearmonth } = req.query;
      const limitNum = parseInt(limit as string);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        throw ApiError.badRequest('Invalid limit. Must be between 1 and 1000');
      }

      const data = await analyticsService.getPowerUsageBySite(
        limitNum,
        yearmonth ? parseInt(yearmonth as string) : undefined
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/prediction-accuracy
   * Get prediction accuracy metrics
   */
  static async getPredictionAccuracy(req: Request, res: Response, next: NextFunction) {
    try {
      const { dayaCluster } = req.query;

      const data = await analyticsService.getPredictionAccuracy(dayaCluster as string | undefined);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/analytics/custom-query
   * Execute custom ClickHouse query (admin only)
   */
  static async executeCustomQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        throw ApiError.badRequest('Query is required and must be a string');
      }

      const data = await analyticsService.executeCustomQuery(query);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

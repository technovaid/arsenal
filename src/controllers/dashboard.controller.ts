import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { dashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/ApiResponse';

export class DashboardController {
  /**
   * Get dashboard summary statistics
   */
  async getSummary(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary();
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consumption data for chart
   */
  async getConsumption(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period, siteId, region } = req.query;

      const params = {
        period: period ? parseInt(period as string) : 6,
        siteId: siteId as string | undefined,
        region: region as string | undefined,
      };

      const consumption = await dashboardService.getConsumption(params);
      return ApiResponse.success(res, consumption);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get heatmap data
   */
  async getHeatmap(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const heatmap = await dashboardService.getHeatmap();
      return ApiResponse.success(res, { data: heatmap });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ticket status distribution for pie chart
   */
  async getTicketStatus(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticketStatus = await dashboardService.getTicketStatus();
      return ApiResponse.success(res, { data: ticketStatus });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent anomalies for table
   */
  async getAnomalies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const anomalies = await dashboardService.getAnomalies(
        limit ? parseInt(limit as string) : 10
      );
      return ApiResponse.success(res, { data: anomalies });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();

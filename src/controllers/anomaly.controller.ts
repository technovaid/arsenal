import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { anomalyService } from '../services/anomaly.service';
import { ApiResponse } from '../utils/ApiResponse';

export class AnomalyController {
  /**
   * Get anomaly summary counts
   */
  async getSummary(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await anomalyService.getSummary();
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get anomaly list with filtering
   */
  async getAnomalies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { severity, siteId, page, limit } = req.query;

      const params = {
        severity: severity as string | undefined,
        siteId: siteId as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await anomalyService.getAnomalies(params);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const anomalyController = new AnomalyController();

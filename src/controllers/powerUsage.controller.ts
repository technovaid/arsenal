import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { powerUsageService } from '../services/powerUsage.service';
import { ApiResponse } from '../utils/ApiResponse';

export class PowerUsageController {
  /**
   * Get power usage sites with filtering
   */
  async getPowerUsageSites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, region, nop, regency, powerRange, payloadLevel, outlierType, period } = req.query;

      const params = {
        search: search as string,
        region: region as string,
        nop: nop as string,
        regency: regency as string,
        powerRange: powerRange as string,
        payloadLevel: payloadLevel as string,
        outlierType: outlierType as string,
        period: period as string,
      };

      const result = await powerUsageService.getPowerUsageSites(params);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get power usage history for a site
   */
  async getSitePowerUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;
      const { period } = req.query;

      const params = {
        siteId,
        period: period ? parseInt(period as string) : 6,
      };

      const result = await powerUsageService.getSitePowerUsage(params);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const powerUsageController = new PowerUsageController();

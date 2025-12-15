import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { siteService } from '../services/site.service';
import { ApiResponse } from '../utils/ApiResponse';

export class SiteController {
  /**
   * Get sites with filtering and pagination
   */
  async getSites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, region, cluster, period, page, limit } = req.query;

      const params = {
        search: search as string | undefined,
        region: region as string | undefined,
        cluster: cluster as string | undefined,
        period: period as 'monthly' | 'quarterly' | 'yearly' | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await siteService.getSites(params);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get site detail by siteId
   */
  async getSiteDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;
      const detail = await siteService.getSiteDetail(siteId);

      if (!detail) {
        return ApiResponse.error(res, 'Site not found', 404);
      }

      return ApiResponse.success(res, detail);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available regions
   */
  async getRegions(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const regions = await siteService.getRegions();
      return ApiResponse.success(res, { data: regions });
    } catch (error) {
      next(error);
    }
  }
}

export const siteController = new SiteController();

import { Request, Response } from 'express';
import { powerBackupService } from '../services/powerBackup.service';
import { ApiResponse } from '../utils/ApiResponse';

export class PowerBackupController {
  /**
   * Get power backup sites with filtering and pagination
   */
  async getPowerBackupSites(req: Request, res: Response) {
    try {
      const { search, region, tier, page, limit } = req.query;

      const result = await powerBackupService.getPowerBackupSites({
        search: search as string,
        region: region as string,
        tier: tier as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      return ApiResponse.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        'Power backup sites retrieved successfully'
      );
    } catch (error) {
      console.error('Error in getPowerBackupSites:', error);
      return ApiResponse.error(res, 'Failed to fetch power backup sites', 500);
    }
  }

  /**
   * Get available regions
   */
  async getRegions(req: Request, res: Response) {
    try {
      const regions = await powerBackupService.getRegions();
      return ApiResponse.success(res, { data: regions }, 'Regions retrieved successfully');
    } catch (error) {
      console.error('Error in getRegions:', error);
      return ApiResponse.error(res, 'Failed to fetch regions', 500);
    }
  }

  /**
   * Get power backup site detail
   */
  async getPowerBackupDetail(req: Request, res: Response) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const detail = await powerBackupService.getPowerBackupDetail(siteId);

      if (!detail) {
        return ApiResponse.error(res, 'Power backup site not found', 404);
      }

      return ApiResponse.success(res, detail, 'Power backup detail retrieved successfully');
    } catch (error) {
      console.error('Error in getPowerBackupDetail:', error);
      return ApiResponse.error(res, 'Failed to fetch power backup detail', 500);
    }
  }

  /**
   * Get power analysis data for a site
   */
  async getPowerAnalysis(req: Request, res: Response) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const analysis = await powerBackupService.getPowerAnalysis(siteId);
      return ApiResponse.success(res, analysis, 'Power analysis retrieved successfully');
    } catch (error) {
      console.error('Error in getPowerAnalysis:', error);
      return ApiResponse.error(res, 'Failed to fetch power analysis', 500);
    }
  }

  /**
   * Get outage history for a site
   */
  async getOutageHistory(req: Request, res: Response) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const history = await powerBackupService.getOutageHistory(siteId);
      return ApiResponse.success(res, history, 'Outage history retrieved successfully');
    } catch (error) {
      console.error('Error in getOutageHistory:', error);
      return ApiResponse.error(res, 'Failed to fetch outage history', 500);
    }
  }

  /**
   * Get battery health trend for a site
   */
  async getBatteryHealth(req: Request, res: Response) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const health = await powerBackupService.getBatteryHealth(siteId);
      return ApiResponse.success(res, health, 'Battery health retrieved successfully');
    } catch (error) {
      console.error('Error in getBatteryHealth:', error);
      return ApiResponse.error(res, 'Failed to fetch battery health', 500);
    }
  }
}

export const powerBackupController = new PowerBackupController();

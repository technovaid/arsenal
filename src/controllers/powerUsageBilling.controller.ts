import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { powerUsageBillingService } from '../services/powerUsageBilling.service';
import { ApiResponse } from '../utils/ApiResponse';

export class PowerUsageBillingController {
  /**
   * Get all sites with power usage billing data
   */
  async getSites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { region, nop, regency, powerRange, payloadLevel, outlierType, yearmonth } = req.query;

      const filters = {
        region: region as string,
        nop: nop as string,
        regency: regency as string,
        powerRange: powerRange as string,
        payloadLevel: payloadLevel as string,
        outlierType: outlierType as string,
        yearmonth: yearmonth ? parseInt(yearmonth as string) : undefined,
      };

      const sites = await powerUsageBillingService.getSites(filters);
      return ApiResponse.success(res, sites);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { region, nop, regency, powerRange, payloadLevel, outlierType, yearmonth } = req.query;

      const filters = {
        region: region as string,
        nop: nop as string,
        regency: regency as string,
        powerRange: powerRange as string,
        payloadLevel: payloadLevel as string,
        outlierType: outlierType as string,
        yearmonth: yearmonth ? parseInt(yearmonth as string) : undefined,
      };

      const summary = await powerUsageBillingService.getSummary(filters);
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get monthly series data for a specific site
   */
  async getSiteMonthlyData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const data = await powerUsageBillingService.getSiteMonthlyData(siteId);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available periods
   */
  async getAvailablePeriods(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const periods = await powerUsageBillingService.getAvailablePeriods();
      return ApiResponse.success(res, periods);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get filter options
   */
  async getFilterOptions(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const options = await powerUsageBillingService.getFilterOptions();
      return ApiResponse.success(res, options);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get model performance summary
   */
  async getModelPerformanceSummary(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await powerUsageBillingService.getModelPerformanceSummary();
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const powerUsageBillingController = new PowerUsageBillingController();

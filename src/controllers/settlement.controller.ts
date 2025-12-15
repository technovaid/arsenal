import { Request, Response } from 'express';
import { settlementService } from '../services/settlement.service';
import { ApiResponse } from '../utils/ApiResponse';

export class SettlementController {
  /**
   * Get settlements with filtering and pagination
   */
  async getSettlements(req: Request, res: Response) {
    try {
      const { search, region, condition, page, limit } = req.query;

      const result = await settlementService.getSettlements({
        search: search as string,
        region: region as string,
        condition: condition as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      return ApiResponse.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        'Settlements retrieved successfully'
      );
    } catch (error) {
      console.error('Error in getSettlements:', error);
      return ApiResponse.error(res, 'Failed to fetch settlements', 500);
    }
  }

  /**
   * Get settlement summary counts
   */
  async getSummary(req: Request, res: Response) {
    try {
      const summary = await settlementService.getSummary();
      return ApiResponse.success(res, summary, 'Settlement summary retrieved successfully');
    } catch (error) {
      console.error('Error in getSummary:', error);
      return ApiResponse.error(res, 'Failed to fetch settlement summary', 500);
    }
  }

  /**
   * Get available regions
   */
  async getRegions(req: Request, res: Response) {
    try {
      const regions = await settlementService.getRegions();
      return ApiResponse.success(res, { data: regions }, 'Regions retrieved successfully');
    } catch (error) {
      console.error('Error in getRegions:', error);
      return ApiResponse.error(res, 'Failed to fetch regions', 500);
    }
  }

  /**
   * Get settlement detail by site ID
   */
  async getSettlementDetail(req: Request, res: Response) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const detail = await settlementService.getSettlementDetail(siteId);

      if (!detail) {
        return ApiResponse.error(res, 'Settlement not found', 404);
      }

      return ApiResponse.success(res, detail, 'Settlement detail retrieved successfully');
    } catch (error) {
      console.error('Error in getSettlementDetail:', error);
      return ApiResponse.error(res, 'Failed to fetch settlement detail', 500);
    }
  }

  /**
   * Get work orders for a site
   */
  async getWorkOrders(req: Request, res: Response) {
    try {
      const { siteId } = req.params;

      if (!siteId) {
        return ApiResponse.error(res, 'Site ID is required', 400);
      }

      const workOrders = await settlementService.getWorkOrders(siteId);
      return ApiResponse.success(res, { data: workOrders }, 'Work orders retrieved successfully');
    } catch (error) {
      console.error('Error in getWorkOrders:', error);
      return ApiResponse.error(res, 'Failed to fetch work orders', 500);
    }
  }
}

export const settlementController = new SettlementController();

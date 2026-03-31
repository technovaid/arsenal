import { Request, Response } from 'express';
import { isrSettlementService } from '../services/isrSettlement.service';
import { ApiResponse } from '../utils/ApiResponse';

export class IsrSettlementController {

  async getList(req: Request, res: Response) {
    try {
      const { search, region, nearProvinsi, nearCity, page, limit } = req.query;
      const result = await isrSettlementService.getList({
        search: search as string,
        region: region as string,
        nearProvinsi: nearProvinsi as string,
        nearCity: nearCity as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'ISR list retrieved');
    } catch (error) {
      console.error('getList error:', error);
      return ApiResponse.error(res, 'Failed to fetch ISR list', 500);
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const summary = await isrSettlementService.getSummary();
      return ApiResponse.success(res, summary, 'Summary retrieved');
    } catch (error) {
      console.error('getSummary error:', error);
      return ApiResponse.error(res, 'Failed to fetch summary', 500);
    }
  }

  async getFilterOptions(req: Request, res: Response) {
    try {
      const options = await isrSettlementService.getFilterOptions();
      return ApiResponse.success(res, options, 'Filter options retrieved');
    } catch (error) {
      console.error('getFilterOptions error:', error);
      return ApiResponse.error(res, 'Failed to fetch filter options', 500);
    }
  }

  async getIsrMdrs(req: Request, res: Response) {
    try {
      const { region, nearProvinsi, nearCity, page, limit } = req.query;
      const result = await isrSettlementService.getIsrMdrsAnalysis({
        region: region as string,
        nearProvinsi: nearProvinsi as string,
        nearCity: nearCity as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      return ApiResponse.success(res, result, 'ISR vs MDRS analysis retrieved');
    } catch (error) {
      console.error('getIsrMdrs error:', error);
      return ApiResponse.error(res, 'Failed to fetch ISR vs MDRS analysis', 500);
    }
  }

  async getIsrPotency(req: Request, res: Response) {
    try {
      const { region, nearProvinsi, page, limit } = req.query;
      const result = await isrSettlementService.getIsrPotencyAnalysis({
        region: region as string,
        nearProvinsi: nearProvinsi as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      return ApiResponse.success(res, result, 'ISR vs Potency analysis retrieved');
    } catch (error) {
      console.error('getIsrPotency error:', error);
      return ApiResponse.error(res, 'Failed to fetch ISR vs Potency analysis', 500);
    }
  }

  async getRadioFrequency(req: Request, res: Response) {
    try {
      const { region, nearProvinsi, page, limit } = req.query;
      const result = await isrSettlementService.getRadioFrequencyAnalysis({
        region: region as string,
        nearProvinsi: nearProvinsi as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      return ApiResponse.success(res, result, 'Radio frequency analysis retrieved');
    } catch (error) {
      console.error('getRadioFrequency error:', error);
      return ApiResponse.error(res, 'Failed to fetch radio frequency analysis', 500);
    }
  }

  async getBwDistance(req: Request, res: Response) {
    try {
      const { region, nearProvinsi, bandCategory, page, limit } = req.query;
      const result = await isrSettlementService.getBwDistanceAnalysis({
        region: region as string,
        nearProvinsi: nearProvinsi as string,
        bandCategory: bandCategory as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      return ApiResponse.success(res, result, 'BW distance analysis retrieved');
    } catch (error) {
      console.error('getBwDistance error:', error);
      return ApiResponse.error(res, 'Failed to fetch BW distance analysis', 500);
    }
  }

  async getInvoice(req: Request, res: Response) {
    try {
      const { region, search, invStatus, page, limit } = req.query;
      const result = await isrSettlementService.getInvoiceList({
        region: region as string,
        search: search as string,
        invStatus: invStatus as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Invoice list retrieved');
    } catch (error) {
      console.error('getInvoice error:', error);
      return ApiResponse.error(res, 'Failed to fetch invoice list', 500);
    }
  }
}

export const isrSettlementController = new IsrSettlementController();

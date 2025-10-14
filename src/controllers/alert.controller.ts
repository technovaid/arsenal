import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { alertService } from '../services/alert.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';

export class AlertController {
  /**
   * Create new alert
   */
  async createAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alert = await alertService.createAlert(req.body);
      return ApiResponse.created(res, alert, 'Alert created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alert = await alertService.getAlertById(req.params.id);
      return ApiResponse.success(res, alert);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all alerts
   */
  async getAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        type,
        severity,
        status,
        siteId,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const filters = {
        type: type as AlertType,
        severity: severity as AlertSeverity,
        status: status as AlertStatus,
        siteId: siteId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await alertService.getAlerts(filters);

      return ApiResponse.paginated(
        res,
        result.alerts,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update alert
   */
  async updateAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alert = await alertService.updateAlert(req.params.id, req.body);
      return ApiResponse.success(res, alert, 'Alert updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alert = await alertService.acknowledgeAlert(
        req.params.id,
        req.user!.id
      );
      return ApiResponse.success(res, alert, 'Alert acknowledged');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { resolution } = req.body;
      const alert = await alertService.resolveAlert(
        req.params.id,
        req.user!.id,
        resolution
      );
      return ApiResponse.success(res, alert, 'Alert resolved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get alert statistics
   */
  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, siteId } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        siteId: siteId as string,
      };

      const stats = await alertService.getAlertStatistics(filters);
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await alertService.deleteAlert(req.params.id);
      return ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();

import prisma from '../config/database';
import { AlertType, AlertSeverity, AlertStatus, Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { notificationService } from './notification.service';
import { ticketService } from './ticket.service';
import { socketService } from './socket.service';

export interface CreateAlertInput {
  usageId?: string;
  siteId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedValue?: number;
  expectedValue?: number;
  threshold?: number;
  deviationPercent?: number;
}

export interface UpdateAlertInput {
  status?: AlertStatus;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolution?: string;
}

class AlertService {
  /**
   * Create a new alert
   */
  async createAlert(data: CreateAlertInput) {
    try {
      const alert = await prisma.anomalyAlert.create({
        data: {
          ...data,
          status: AlertStatus.OPEN,
        },
        include: {
          powerUsage: {
            include: {
              site: true,
            },
          },
        },
      });

      logger.info(`Alert created: ${alert.id} - ${alert.title}`);

      // Create ticket automatically for critical and high severity alerts
      if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH) {
        await ticketService.createTicketFromAlert(alert.id);
      }

      // Send notifications
      await notificationService.sendAlertNotifications(alert);

      // Emit real-time event via Socket.IO
      socketService.emitAlert(alert);

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw ApiError.internal('Failed to create alert');
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(id: string) {
    const alert = await prisma.anomalyAlert.findUnique({
      where: { id },
      include: {
        powerUsage: {
          include: {
            site: true,
          },
        },
        ticket: true,
        notifications: true,
      },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    return alert;
  }

  /**
   * Get all alerts with filters
   */
  async getAlerts(filters: {
    type?: AlertType;
    severity?: AlertSeverity;
    status?: AlertStatus;
    siteId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      type,
      severity,
      status,
      siteId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.AnomalyAlertWhereInput = {};

    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (siteId) where.siteId = siteId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [alerts, total] = await Promise.all([
      prisma.anomalyAlert.findMany({
        where,
        include: {
          powerUsage: {
            include: {
              site: true,
            },
          },
          ticket: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.anomalyAlert.count({ where }),
    ]);

    return {
      alerts,
      total,
      page,
      limit,
    };
  }

  /**
   * Update alert
   */
  async updateAlert(id: string, data: UpdateAlertInput) {
    const alert = await prisma.anomalyAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    const updateData: Prisma.AnomalyAlertUpdateInput = { ...data };

    // Set timestamps based on status
    if (data.status === AlertStatus.ACKNOWLEDGED) {
      updateData.acknowledgedAt = new Date();
    } else if (data.status === AlertStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    const updatedAlert = await prisma.anomalyAlert.update({
      where: { id },
      data: updateData,
      include: {
        powerUsage: {
          include: {
            site: true,
          },
        },
        ticket: true,
      },
    });

    logger.info(`Alert updated: ${id} - Status: ${data.status}`);

    // Emit real-time event
    socketService.emitAlertUpdate(updatedAlert);

    return updatedAlert;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string, userId: string) {
    return this.updateAlert(id, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: userId,
    });
  }

  /**
   * Resolve alert
   */
  async resolveAlert(id: string, userId: string, resolution: string) {
    return this.updateAlert(id, {
      status: AlertStatus.RESOLVED,
      resolvedBy: userId,
      resolution,
    });
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    siteId?: string;
  }) {
    const where: Prisma.AnomalyAlertWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters?.siteId) {
      where.siteId = filters.siteId;
    }

    const [
      totalAlerts,
      openAlerts,
      resolvedAlerts,
      bySeverity,
      byType,
      byStatus,
    ] = await Promise.all([
      prisma.anomalyAlert.count({ where }),
      prisma.anomalyAlert.count({ where: { ...where, status: AlertStatus.OPEN } }),
      prisma.anomalyAlert.count({ where: { ...where, status: AlertStatus.RESOLVED } }),
      prisma.anomalyAlert.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      prisma.anomalyAlert.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      prisma.anomalyAlert.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalAlerts,
      openAlerts,
      resolvedAlerts,
      bySeverity: bySeverity.map((item) => ({
        severity: item.severity,
        count: item._count,
      })),
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    };
  }

  /**
   * Delete alert (soft delete by marking as closed)
   */
  async deleteAlert(id: string) {
    const alert = await prisma.anomalyAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    await prisma.anomalyAlert.update({
      where: { id },
      data: { status: AlertStatus.CLOSED },
    });

    logger.info(`Alert deleted: ${id}`);
  }
}

export const alertService = new AlertService();

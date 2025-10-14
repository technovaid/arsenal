import prisma from '../config/database';
import { TicketPriority, TicketStatus, SLAStatus, Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { socketService } from './socket.service';
import { notificationService } from './notification.service';

export interface CreateTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  alertId: string;
  assignedToId?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string;
  resolution?: string;
  category?: string;
  tags?: string[];
}

class TicketService {
  /**
   * Generate unique ticket number
   */
  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: new Date(year, date.getMonth(), 1),
          lt: new Date(year, date.getMonth() + 1, 1),
        },
      },
    });

    return `TKT-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Calculate SLA deadline based on priority
   */
  private calculateSLADeadline(priority: TicketPriority): Date {
    const now = new Date();
    const hours = {
      [TicketPriority.CRITICAL]: 4,
      [TicketPriority.HIGH]: 8,
      [TicketPriority.MEDIUM]: 24,
      [TicketPriority.LOW]: 72,
    };

    return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000);
  }

  /**
   * Create ticket from alert
   */
  async createTicketFromAlert(alertId: string) {
    const alert = await prisma.anomalyAlert.findUnique({
      where: { id: alertId },
      include: {
        powerUsage: {
          include: {
            site: true,
          },
        },
      },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    // Check if ticket already exists for this alert
    const existingTicket = await prisma.ticket.findUnique({
      where: { alertId },
    });

    if (existingTicket) {
      return existingTicket;
    }

    // Map alert severity to ticket priority
    const priorityMap = {
      CRITICAL: TicketPriority.CRITICAL,
      HIGH: TicketPriority.HIGH,
      MEDIUM: TicketPriority.MEDIUM,
      LOW: TicketPriority.LOW,
      INFO: TicketPriority.LOW,
    };

    const priority = priorityMap[alert.severity];
    const ticketNumber = await this.generateTicketNumber();
    const slaDeadline = this.calculateSLADeadline(priority);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        alertId,
        title: alert.title,
        description: alert.description,
        priority,
        status: TicketStatus.OPEN,
        slaDeadline,
        slaStatus: SLAStatus.ON_TIME,
        category: alert.type,
      },
      include: {
        alert: {
          include: {
            powerUsage: {
              include: {
                site: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Ticket created from alert: ${ticket.ticketNumber}`);

    // Emit real-time event
    socketService.emitTicket(ticket);

    return ticket;
  }

  /**
   * Create ticket manually
   */
  async createTicket(data: CreateTicketInput) {
    const ticketNumber = await this.generateTicketNumber();
    const slaDeadline = this.calculateSLADeadline(data.priority);

    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        ticketNumber,
        status: TicketStatus.OPEN,
        slaDeadline,
        slaStatus: SLAStatus.ON_TIME,
        assignedAt: data.assignedToId ? new Date() : undefined,
      },
      include: {
        alert: true,
        assignedTo: true,
      },
    });

    // Create history entry
    await this.addHistory(ticket.id, 'CREATED', 'Ticket created');

    // Send notification if assigned
    if (data.assignedToId) {
      await notificationService.sendTicketAssignedNotification(ticket);
    }

    logger.info(`Ticket created: ${ticket.ticketNumber}`);
    socketService.emitTicket(ticket);

    return ticket;
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        alert: {
          include: {
            powerUsage: {
              include: {
                site: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    return ticket;
  }

  /**
   * Get all tickets with filters
   */
  async getTickets(filters: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: string;
    category?: string;
    slaStatus?: SLAStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      priority,
      assignedToId,
      category,
      slaStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.TicketWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (category) where.category = category;
    if (slaStatus) where.slaStatus = slaStatus;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          alert: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      total,
      page,
      limit,
    };
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, data: UpdateTicketInput, userId?: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    const updateData: Prisma.TicketUpdateInput = { ...data };

    // Handle status changes
    if (data.status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    } else if (data.status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    } else if (data.status === TicketStatus.ASSIGNED && data.assignedToId) {
      updateData.assignedAt = new Date();
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        alert: true,
        assignedTo: true,
      },
    });

    // Add history entries for changes
    if (data.status && data.status !== ticket.status) {
      await this.addHistory(id, 'STATUS_CHANGED', `Status changed from ${ticket.status} to ${data.status}`, userId);
    }

    if (data.assignedToId && data.assignedToId !== ticket.assignedToId) {
      await this.addHistory(id, 'ASSIGNED', `Ticket assigned to user ${data.assignedToId}`, userId);
      await notificationService.sendTicketAssignedNotification(updatedTicket);
    }

    logger.info(`Ticket updated: ${ticket.ticketNumber}`);
    socketService.emitTicketUpdate(updatedTicket);

    return updatedTicket;
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketId: string, userId: string, comment: string, isInternal = false) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    const ticketComment = await prisma.ticketComment.create({
      data: {
        ticketId,
        userId,
        comment,
        isInternal,
      },
    });

    await this.addHistory(ticketId, 'COMMENT_ADDED', 'Comment added', userId);

    logger.info(`Comment added to ticket: ${ticket.ticketNumber}`);

    return ticketComment;
  }

  /**
   * Add history entry
   */
  async addHistory(
    ticketId: string,
    action: string,
    _description: string,
    userId?: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string
  ) {
    return prisma.ticketHistory.create({
      data: {
        ticketId,
        userId,
        action,
        fieldName,
        oldValue,
        newValue,
      },
    });
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    assignedToId?: string;
  }) {
    const where: Prisma.TicketWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      byPriority,
      byStatus,
      bySLA,
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: TicketStatus.OPEN } }),
      prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.ticket.groupBy({
        by: ['slaStatus'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      byPriority: byPriority.map((item) => ({
        priority: item.priority,
        count: item._count,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      bySLA: bySLA.map((item) => ({
        slaStatus: item.slaStatus,
        count: item._count,
      })),
    };
  }

  /**
   * Update SLA status for all tickets
   */
  async updateSLAStatuses() {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Mark tickets as breached
    await prisma.ticket.updateMany({
      where: {
        status: {
          notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED],
        },
        slaDeadline: {
          lt: now,
        },
        slaStatus: {
          not: SLAStatus.BREACHED,
        },
      },
      data: {
        slaStatus: SLAStatus.BREACHED,
      },
    });

    // Mark tickets at risk
    await prisma.ticket.updateMany({
      where: {
        status: {
          notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED],
        },
        slaDeadline: {
          gte: now,
          lt: twoHoursFromNow,
        },
        slaStatus: SLAStatus.ON_TIME,
      },
      data: {
        slaStatus: SLAStatus.AT_RISK,
      },
    });

    logger.info('SLA statuses updated');
  }
}

export const ticketService = new TicketService();

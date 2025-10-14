import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ticketService } from '../services/ticket.service';
import { ApiResponse } from '../utils/ApiResponse';
import { TicketPriority, TicketStatus, SLAStatus } from '@prisma/client';

export class TicketController {
  /**
   * Create new ticket
   */
  async createTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.createTicket(req.body);
      return ApiResponse.created(res, ticket, 'Ticket created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      return ApiResponse.success(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tickets
   */
  async getTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        status,
        priority,
        assignedToId,
        category,
        slaStatus,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const filters = {
        status: status as TicketStatus,
        priority: priority as TicketPriority,
        assignedToId: assignedToId as string,
        category: category as string,
        slaStatus: slaStatus as SLAStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const result = await ticketService.getTickets(filters);

      return ApiResponse.paginated(
        res,
        result.tickets,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.updateTicket(
        req.params.id,
        req.body,
        req.user!.id
      );
      return ApiResponse.success(res, ticket, 'Ticket updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { comment, isInternal } = req.body;
      const ticketComment = await ticketService.addComment(
        req.params.id,
        req.user!.id,
        comment,
        isInternal
      );
      return ApiResponse.created(res, ticketComment, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ticket statistics
   */
  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, assignedToId } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        assignedToId: assignedToId as string,
      };

      const stats = await ticketService.getTicketStatistics(filters);
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();

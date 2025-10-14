import prisma from '../config/database';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import logger from '../utils/logger';
import nodemailer from 'nodemailer';

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    if (process.env.ALERT_EMAIL_ENABLED === 'true') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      logger.info('Email transporter initialized');
    }
  }

  /**
   * Send alert notifications to relevant users
   */
  async sendAlertNotifications(alert: any) {
    try {
      // Get users based on alert severity and type
      const users = await this.getUsersForAlert(alert);

      for (const user of users) {
        // Create in-app notification
        await this.createNotification({
          userId: user.id,
          alertId: alert.id,
          type: NotificationType.ALERT,
          channel: NotificationChannel.IN_APP,
          title: alert.title,
          message: alert.description,
        });

        // Send email if enabled
        if (this.transporter && process.env.ALERT_EMAIL_ENABLED === 'true') {
          await this.sendEmailNotification(user.email, alert);
        }
      }

      logger.info(`Notifications sent for alert: ${alert.id}`);
    } catch (error) {
      logger.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Send ticket assigned notification
   */
  async sendTicketAssignedNotification(ticket: any) {
    if (!ticket.assignedToId) return;

    try {
      const user = await prisma.user.findUnique({
        where: { id: ticket.assignedToId },
      });

      if (!user) return;

      await this.createNotification({
        userId: user.id,
        type: NotificationType.TICKET_ASSIGNED,
        channel: NotificationChannel.IN_APP,
        title: `Ticket Assigned: ${ticket.ticketNumber}`,
        message: `You have been assigned ticket ${ticket.ticketNumber}: ${ticket.title}`,
      });

      if (this.transporter && process.env.ALERT_EMAIL_ENABLED === 'true') {
        await this.sendTicketEmail(user.email, ticket, 'assigned');
      }

      logger.info(`Ticket assignment notification sent to user: ${user.id}`);
    } catch (error) {
      logger.error('Error sending ticket assignment notification:', error);
    }
  }

  /**
   * Create notification record
   */
  async createNotification(data: {
    userId: string;
    alertId?: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return prisma.notification.create({
      data: {
        ...data,
        status: NotificationStatus.PENDING,
      },
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(email: string, alert: any) {
    if (!this.transporter) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `[${alert.severity}] ${alert.title}`,
        html: this.generateAlertEmailTemplate(alert),
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Update notification status
      await prisma.notification.updateMany({
        where: {
          alertId: alert.id,
          channel: NotificationChannel.EMAIL,
        },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      logger.info(`Email sent: ${info.messageId}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      
      await prisma.notification.updateMany({
        where: {
          alertId: alert.id,
          channel: NotificationChannel.EMAIL,
        },
        data: {
          status: NotificationStatus.FAILED,
        },
      });
    }
  }

  /**
   * Send ticket email
   */
  private async sendTicketEmail(email: string, ticket: any, action: 'assigned' | 'updated' | 'resolved') {
    if (!this.transporter) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Ticket ${action}: ${ticket.ticketNumber}`,
        html: this.generateTicketEmailTemplate(ticket, action),
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Ticket email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending ticket email:', error);
    }
  }

  /**
   * Get users who should receive alert notifications
   */
  private async getUsersForAlert(alert: any) {
    // Get all active users with OPS, ANALYST, MANAGER, or ADMIN roles
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['OPS', 'ANALYST', 'MANAGER', 'ADMIN'],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Filter based on alert severity
    if (alert.severity === 'CRITICAL') {
      return users; // All users for critical alerts
    } else if (alert.severity === 'HIGH') {
      return users.filter((u) => ['OPS', 'MANAGER', 'ADMIN'].includes(u.role));
    } else {
      return users.filter((u) => ['OPS', 'ANALYST'].includes(u.role));
    }
  }

  /**
   * Generate alert email template
   */
  private generateAlertEmailTemplate(alert: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Alert: ${alert.title}</h2>
          </div>
          <div class="content">
            <div class="detail">
              <span class="label">Severity:</span> ${alert.severity}
            </div>
            <div class="detail">
              <span class="label">Type:</span> ${alert.type}
            </div>
            <div class="detail">
              <span class="label">Description:</span><br/>
              ${alert.description}
            </div>
            ${alert.detectedValue ? `
              <div class="detail">
                <span class="label">Detected Value:</span> ${alert.detectedValue}
              </div>
            ` : ''}
            ${alert.expectedValue ? `
              <div class="detail">
                <span class="label">Expected Value:</span> ${alert.expectedValue}
              </div>
            ` : ''}
            ${alert.deviationPercent ? `
              <div class="detail">
                <span class="label">Deviation:</span> ${alert.deviationPercent}%
              </div>
            ` : ''}
            <div class="detail">
              <span class="label">Created At:</span> ${new Date(alert.createdAt).toLocaleString()}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from ARSeNAL System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate ticket email template
   */
  private generateTicketEmailTemplate(ticket: any, action: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎫 Ticket ${action}: ${ticket.ticketNumber}</h2>
          </div>
          <div class="content">
            <div class="detail">
              <span class="label">Title:</span> ${ticket.title}
            </div>
            <div class="detail">
              <span class="label">Priority:</span> ${ticket.priority}
            </div>
            <div class="detail">
              <span class="label">Status:</span> ${ticket.status}
            </div>
            <div class="detail">
              <span class="label">Description:</span><br/>
              ${ticket.description}
            </div>
            ${ticket.slaDeadline ? `
              <div class="detail">
                <span class="label">SLA Deadline:</span> ${new Date(ticket.slaDeadline).toLocaleString()}
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get color based on severity
   */
  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      CRITICAL: '#d32f2f',
      HIGH: '#f57c00',
      MEDIUM: '#fbc02d',
      LOW: '#388e3c',
      INFO: '#1976d2',
    };
    return colors[severity] || '#666';
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, filters?: {
    status?: NotificationStatus;
    type?: NotificationType;
    page?: number;
    limit?: number;
  }) {
    const { status, type, page = 1, limit = 20 } = filters || {};

    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
    };
  }
}

export const notificationService = new NotificationService();

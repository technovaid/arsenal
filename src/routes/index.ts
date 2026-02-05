import { Router } from 'express';
import authRoutes from './auth.routes';
import alertRoutes from './alert.routes';
import ticketRoutes from './ticket.routes';
import siteRoutes from './site.routes';
import powerUsageRoutes from './powerUsage.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard.routes';
import anomalyRoutes from './anomaly.routes';
import settlementRoutes from './settlement.routes';
import powerBackupRoutes from './powerBackup.routes';
import userRoutes from './user.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);
router.use('/tickets', ticketRoutes);
router.use('/sites', siteRoutes);
router.use('/power-usage', powerUsageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/anomalies', anomalyRoutes);
router.use('/settlements', settlementRoutes);
router.use('/power-backup', powerBackupRoutes);
router.use('/users', userRoutes);

export default router;

import { Router } from 'express';
import authRoutes from './auth.routes';
import alertRoutes from './alert.routes';
import ticketRoutes from './ticket.routes';
import siteRoutes from './site.routes';
import powerUsageRoutes from './powerUsage.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/alerts', alertRoutes);
router.use('/tickets', ticketRoutes);
router.use('/sites', siteRoutes);
router.use('/power-usage', powerUsageRoutes);
router.use('/notifications', notificationRoutes);

export default router;

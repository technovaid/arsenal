import { Router } from 'express';
import { settlementController } from '../controllers/settlement.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/settlements/summary - Get settlement summary counts
router.get('/summary', settlementController.getSummary);

// GET /api/v1/settlements/regions - Get available regions
router.get('/regions', settlementController.getRegions);

// GET /api/v1/settlements/:siteId/work-orders - Get work orders for a site
router.get('/:siteId/work-orders', settlementController.getWorkOrders);

// GET /api/v1/settlements/:siteId - Get settlement detail by site ID
router.get('/:siteId', settlementController.getSettlementDetail);

// GET /api/v1/settlements - Get settlements with filtering and pagination
router.get('/', settlementController.getSettlements);

export default router;

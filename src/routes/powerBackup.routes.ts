import { Router } from 'express';
import { powerBackupController } from '../controllers/powerBackup.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/power-backup/regions - Get available regions
router.get('/regions', powerBackupController.getRegions);

// GET /api/v1/power-backup/:siteId/power-analysis - Get power analysis data
router.get('/:siteId/power-analysis', powerBackupController.getPowerAnalysis);

// GET /api/v1/power-backup/:siteId/outage-history - Get outage history
router.get('/:siteId/outage-history', powerBackupController.getOutageHistory);

// GET /api/v1/power-backup/:siteId/battery-health - Get battery health trend
router.get('/:siteId/battery-health', powerBackupController.getBatteryHealth);

// GET /api/v1/power-backup/:siteId - Get power backup site detail
router.get('/:siteId', powerBackupController.getPowerBackupDetail);

// GET /api/v1/power-backup - Get power backup sites with filtering and pagination
router.get('/', powerBackupController.getPowerBackupSites);

export default router;

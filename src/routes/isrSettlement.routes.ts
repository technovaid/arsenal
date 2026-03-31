import { Router } from 'express';
import { isrSettlementController } from '../controllers/isrSettlement.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', isrSettlementController.getSummary);
router.get('/filter-options', isrSettlementController.getFilterOptions);
router.get('/isr-mdrs', isrSettlementController.getIsrMdrs);
router.get('/isr-potency', isrSettlementController.getIsrPotency);
router.get('/radio-frequency', isrSettlementController.getRadioFrequency);
router.get('/bw-distance', isrSettlementController.getBwDistance);
router.get('/invoice', isrSettlementController.getInvoice);
router.get('/', isrSettlementController.getList);

export default router;

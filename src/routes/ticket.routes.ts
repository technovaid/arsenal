import { Router } from 'express';
import { body } from 'express-validator';
import { ticketController } from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/tickets
 * @desc    Create new ticket
 * @access  Private (OPS, ANALYST, MANAGER, ADMIN)
 */
router.post(
  '/',
  authorize('OPS', 'ANALYST', 'MANAGER', 'ADMIN'),
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('priority').notEmpty().withMessage('Priority is required'),
    body('alertId').notEmpty().withMessage('Alert ID is required'),
  ]),
  ticketController.createTicket
);

/**
 * @route   GET /api/v1/tickets
 * @desc    Get all tickets
 * @access  Private
 */
router.get('/', ticketController.getTickets);

/**
 * @route   GET /api/v1/tickets/statistics
 * @desc    Get ticket statistics
 * @access  Private
 */
router.get('/statistics', ticketController.getStatistics);

/**
 * @route   GET /api/v1/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private
 */
router.get('/:id', ticketController.getTicketById);

/**
 * @route   PATCH /api/v1/tickets/:id
 * @desc    Update ticket
 * @access  Private (OPS, ANALYST, MANAGER, ADMIN)
 */
router.patch(
  '/:id',
  authorize('OPS', 'ANALYST', 'MANAGER', 'ADMIN'),
  ticketController.updateTicket
);

/**
 * @route   POST /api/v1/tickets/:id/comments
 * @desc    Add comment to ticket
 * @access  Private (OPS, ANALYST, MANAGER, ADMIN)
 */
router.post(
  '/:id/comments',
  authorize('OPS', 'ANALYST', 'MANAGER', 'ADMIN'),
  validate([
    body('comment').notEmpty().withMessage('Comment is required'),
  ]),
  ticketController.addComment
);

export default router;

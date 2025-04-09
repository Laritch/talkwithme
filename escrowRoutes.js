/**
 * Escrow API Routes
 *
 * Endpoints for managing escrow transactions:
 * - Creating escrow transactions
 * - Managing escrow lifecycle (fund, release, cancel)
 * - Handling disputes
 * - Fetching escrow details
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import escrowService from '../services/escrowService.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { body, param } from 'express-validator';

const router = express.Router();

/**
 * @route POST /api/escrow
 * @desc Create a new escrow transaction
 * @access Private
 */
router.post(
  '/',
  authenticate,
  [
    body('recipientId').notEmpty().withMessage('Recipient ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be a valid 3-letter code'),
    body('description').optional(),
    body('processorName').optional(),
    body('paymentMethodId').optional(),
    body('releaseConditions').optional().isArray(),
    body('expiryDays').optional().isInt({ min: 1, max: 365 }),
    body('escrowType').optional().isIn(['standard', 'milestone', 'conditional'])
  ],
  validateRequest,
  async (req, res) => {
    try {
      const escrowData = {
        senderId: req.user.id, // From auth middleware
        recipientId: req.body.recipientId,
        amount: req.body.amount,
        currency: req.body.currency,
        description: req.body.description,
        processorName: req.body.processorName,
        paymentMethodId: req.body.paymentMethodId,
        releaseConditions: req.body.releaseConditions,
        expiryDays: req.body.expiryDays,
        escrowType: req.body.escrowType,
        metadata: req.body.metadata
      };

      const result = await escrowService.createEscrowTransaction(escrowData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      res.status(400).json({
        error: error.message,
        processorError: error.processorError
      });
    }
  }
);

/**
 * @route GET /api/escrow/:id
 * @desc Get escrow transaction details
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid escrow ID format')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const escrowTransaction = await escrowService.getEscrowTransaction(req.params.id);

      // Check if user is authorized to view this escrow transaction
      if (escrowTransaction.senderId.toString() !== req.user.id &&
          escrowTransaction.recipientId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view this escrow transaction' });
      }

      res.json(escrowTransaction);
    } catch (error) {
      console.error('Error fetching escrow transaction:', error);
      res.status(404).json({ error: error.message });
    }
  }
);

/**
 * @route POST /api/escrow/:id/fund
 * @desc Fund an escrow transaction
 * @access Private
 */
router.post(
  '/:id/fund',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid escrow ID format')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Get the escrow transaction first to verify ownership
      const escrowTransaction = await escrowService.getEscrowTransaction(req.params.id);

      // Only the sender can fund the escrow
      if (escrowTransaction.senderId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Only the sender can fund this escrow' });
      }

      const result = await escrowService.fundEscrow(req.params.id, {
        ...req.body,
        fundedBy: req.user.id
      });

      res.json(result);
    } catch (error) {
      console.error('Error funding escrow transaction:', error);
      res.status(400).json({
        error: error.message,
        processorError: error.processorError
      });
    }
  }
);

/**
 * @route POST /api/escrow/:id/release
 * @desc Release funds from escrow to recipient
 * @access Private
 */
router.post(
  '/:id/release',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid escrow ID format'),
    body('releaseAmount').optional().isNumeric().withMessage('Release amount must be a number'),
    body('note').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Get the escrow transaction first to verify ownership
      const escrowTransaction = await escrowService.getEscrowTransaction(req.params.id);

      // Only the sender can release the escrow under normal circumstances
      // (Admin and mediators can be added for dispute resolution)
      if (escrowTransaction.senderId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to release this escrow' });
      }

      const result = await escrowService.releaseEscrow(req.params.id, {
        releaseAmount: req.body.releaseAmount,
        note: req.body.note,
        releasedBy: req.user.id,
        metadata: req.body.metadata
      });

      res.json(result);
    } catch (error) {
      console.error('Error releasing escrow funds:', error);
      res.status(400).json({
        error: error.message,
        processorError: error.processorError
      });
    }
  }
);

/**
 * @route POST /api/escrow/:id/cancel
 * @desc Cancel an escrow transaction and refund sender
 * @access Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid escrow ID format'),
    body('reason').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Get the escrow transaction first to verify ownership
      const escrowTransaction = await escrowService.getEscrowTransaction(req.params.id);

      // Only the sender can cancel the escrow under normal circumstances
      if (escrowTransaction.senderId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to cancel this escrow' });
      }

      const result = await escrowService.cancelEscrow(req.params.id, {
        reason: req.body.reason,
        cancelledBy: req.user.id,
        metadata: req.body.metadata
      });

      res.json(result);
    } catch (error) {
      console.error('Error cancelling escrow transaction:', error);
      res.status(400).json({
        error: error.message,
        processorError: error.processorError
      });
    }
  }
);

/**
 * @route POST /api/escrow/:id/dispute
 * @desc Open a dispute for an escrow transaction
 * @access Private
 */
router.post(
  '/:id/dispute',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid escrow ID format'),
    body('disputeReason').notEmpty().withMessage('Dispute reason is required'),
    body('evidence').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Get the escrow transaction first to verify relationship
      const escrowTransaction = await escrowService.getEscrowTransaction(req.params.id);

      // Only the sender or recipient can open a dispute
      if (escrowTransaction.senderId.toString() !== req.user.id &&
          escrowTransaction.recipientId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to dispute this escrow' });
      }

      const result = await escrowService.openDispute(req.params.id, {
        disputeReason: req.body.disputeReason,
        evidence: req.body.evidence,
        openedBy: req.user.id,
        metadata: req.body.metadata
      });

      res.json(result);
    } catch (error) {
      console.error('Error opening escrow dispute:', error);
      res.status(400).json({
        error: error.message,
        processorError: error.processorError
      });
    }
  }
);

/**
 * @route POST /api/escrow/:id/resolve-dispute
 * @desc Resolve a dispute for an escrow transaction
 * @access Private (Admin/Mediator only)
 */
router.post(
  '/:id/resolve-dispute',
  authenticate,
  authorize(['admin', 'mediator']), // Only admins or designated mediators can resolve disputes
  [
    param('id').isMongoId().withMessage('Invalid escrow ID format'),
    body('resolution').isIn(['release', 'refund', 'split']).withMessage('Invalid resolution type'),
    body('splitRatio').optional().isFloat({ min: 0, max: 1 }),
    body('note').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await escrowService.resolveDispute(req.params.id, {
        resolution: req.body.resolution,
        splitRatio: req.body.splitRatio,
        note: req.body.note,
        resolvedBy: req.user.id,
        metadata: req.body.metadata
      });

      res.json(result);
    } catch (error) {
      console.error('Error resolving escrow dispute:', error);
      res.status(400).json({
        error: error.message,
        processorError: error.processorError
      });
    }
  }
);

/**
 * @route GET /api/escrow/user/transactions
 * @desc Get all escrow transactions for the current user
 * @access Private
 */
router.get(
  '/user/transactions',
  authenticate,
  async (req, res) => {
    try {
      // Parse query parameters for filtering
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100
      };

      const transactions = await escrowService.getUserEscrowTransactions(req.user.id, filters);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching user escrow transactions:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;

/**
 * Escrow Service
 *
 * Handles the lifecycle of escrow transactions including:
 * - Creating escrow transactions
 * - Holding funds in escrow
 * - Releasing funds to recipients
 * - Managing disputes and refunds
 * - Handling transaction statuses and transitions
 */

import PaymentFactory from '../paymentFactory.js';
import EscrowTransaction from '../../models/escrowTransactionModel.js';
import User from '../../models/userModel.js';
import { getAvailableProcessorsForRegion } from '../../utils/paymentUtils.js';
import { generateTransactionId } from '../../utils/transactionUtils.js';

class EscrowService {
  /**
   * Create a new escrow transaction
   * @param {Object} options - Escrow transaction options
   * @returns {Promise<Object>} - Escrow transaction details
   */
  async createEscrowTransaction(options) {
    const {
      senderId,
      recipientId,
      amount,
      currency,
      description,
      processorName,
      paymentMethodId,
      metadata = {},
      releaseConditions = {},
      expiryDays = 30, // Default expiry of 30 days
      escrowType = 'standard', // 'standard', 'milestone', 'conditional'
    } = options;

    try {
      // Validate sender and recipient
      const [sender, recipient] = await Promise.all([
        User.findById(senderId),
        User.findById(recipientId)
      ]);

      if (!sender || !recipient) {
        throw new Error('Invalid sender or recipient');
      }

      // Get preferred processor if not specified
      const processor = processorName || await this.getPreferredProcessor(senderId, sender.region);

      // Get payment processor instance
      const paymentProcessor = PaymentFactory.createProcessor(processor);
      if (!paymentProcessor) {
        throw new Error(`Payment processor '${processor}' is not supported for escrow`);
      }

      // Check if the payment processor supports escrow
      if (!paymentProcessor.supportsEscrow?.()) {
        throw new Error(`Payment processor '${processor}' does not support escrow transactions`);
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      // Generate a unique escrow transaction ID
      const escrowTransactionId = generateTransactionId('escrow');

      // Create escrow payment with the processor
      const escrowResult = await paymentProcessor.createEscrowPayment({
        senderId,
        recipientId,
        amount,
        currency,
        description,
        paymentMethodId,
        escrowTransactionId,
        metadata: {
          ...metadata,
          escrowType,
          source: 'escrow_service'
        }
      });

      // Store escrow transaction in database
      const escrowTransaction = new EscrowTransaction({
        escrowTransactionId,
        senderId,
        recipientId,
        amount,
        currency,
        description,
        processor,
        processorTransactionId: escrowResult.id,
        status: 'pending',
        escrowType,
        releaseConditions,
        expiryDate,
        metadata: {
          ...metadata,
          clientSecret: escrowResult.clientSecret
        },
        timeline: [
          {
            status: 'created',
            timestamp: new Date(),
            note: 'Escrow transaction created'
          }
        ]
      });

      await escrowTransaction.save();

      return {
        escrowId: escrowTransaction._id,
        escrowTransactionId,
        processor,
        redirectUrl: escrowResult.redirectUrl,
        clientSecret: escrowResult.clientSecret,
        status: 'pending',
        amount,
        currency
      };
    } catch (error) {
      console.error('Error creating escrow transaction:', error);

      // Attach processor-specific error info if available
      if (error.processorError) {
        throw {
          message: error.message,
          processorError: error.processorError
        };
      }

      throw error;
    }
  }

  /**
   * Get the preferred payment processor for a user
   * @param {string} userId - User ID
   * @param {string} region - User region
   * @returns {Promise<string>} - Preferred processor name
   */
  async getPreferredProcessor(userId, region) {
    // First check if user has a preferred processor for escrow
    // that is available in their region
    const user = await User.findById(userId);
    const availableProcessors = getAvailableProcessorsForRegion(region);

    // Filter processors that support escrow
    const escrowProcessors = Object.keys(availableProcessors).filter(processor => {
      const processorInstance = PaymentFactory.createProcessor(processor);
      return processorInstance && processorInstance.supportsEscrow?.();
    });

    if (escrowProcessors.length === 0) {
      throw new Error(`No escrow-compatible payment processors available in your region`);
    }

    // Check if user's preferred processor supports escrow
    if (user.preferredPaymentProcessor &&
        escrowProcessors.includes(user.preferredPaymentProcessor)) {
      return user.preferredPaymentProcessor;
    }

    // Default to first available escrow processor
    return escrowProcessors[0];
  }

  /**
   * Get escrow transaction by ID
   * @param {string} escrowId - Escrow transaction ID
   * @returns {Promise<Object>} - Escrow transaction details
   */
  async getEscrowTransaction(escrowId) {
    try {
      const escrowTransaction = await EscrowTransaction.findById(escrowId);

      if (!escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      return escrowTransaction;
    } catch (error) {
      console.error('Error fetching escrow transaction:', error);
      throw error;
    }
  }

  /**
   * Fund an escrow transaction
   * This moves funds from sender to escrow account
   * @param {string} escrowId - Escrow transaction ID
   * @param {Object} options - Additional funding options
   * @returns {Promise<Object>} - Updated escrow transaction
   */
  async fundEscrow(escrowId, options = {}) {
    try {
      const escrowTransaction = await EscrowTransaction.findById(escrowId);

      if (!escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      if (escrowTransaction.status !== 'pending') {
        throw new Error(`Cannot fund escrow in '${escrowTransaction.status}' status`);
      }

      // Get processor instance
      const processor = PaymentFactory.createProcessor(escrowTransaction.processor);

      // Fund the escrow with the processor
      const fundResult = await processor.fundEscrow({
        escrowTransactionId: escrowTransaction.escrowTransactionId,
        processorTransactionId: escrowTransaction.processorTransactionId,
        amount: escrowTransaction.amount,
        currency: escrowTransaction.currency,
        ...options
      });

      // Update escrow transaction status
      escrowTransaction.status = 'funded';
      escrowTransaction.processorEscrowId = fundResult.processorEscrowId;
      escrowTransaction.timeline.push({
        status: 'funded',
        timestamp: new Date(),
        note: 'Funds moved to escrow account'
      });

      await escrowTransaction.save();

      return escrowTransaction;
    } catch (error) {
      console.error('Error funding escrow:', error);

      // Handle processor-specific errors
      if (error.processorError) {
        throw {
          message: error.message,
          processorError: error.processorError
        };
      }

      throw error;
    }
  }

  /**
   * Release funds from escrow to recipient
   * @param {string} escrowId - Escrow transaction ID
   * @param {Object} options - Release options
   * @returns {Promise<Object>} - Updated escrow transaction
   */
  async releaseEscrow(escrowId, options = {}) {
    const {
      releasedBy,
      releaseAmount, // Optional partial release amount
      note,
      metadata = {}
    } = options;

    try {
      const escrowTransaction = await EscrowTransaction.findById(escrowId);

      if (!escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      if (escrowTransaction.status !== 'funded') {
        throw new Error(`Cannot release escrow in '${escrowTransaction.status}' status`);
      }

      // Get processor instance
      const processor = PaymentFactory.createProcessor(escrowTransaction.processor);

      // Determine release amount (full or partial)
      const amount = releaseAmount || escrowTransaction.amount;

      // Validate release amount doesn't exceed escrow amount
      if (amount > escrowTransaction.amount - escrowTransaction.releasedAmount) {
        throw new Error('Release amount exceeds available escrow balance');
      }

      // Release funds with the processor
      const releaseResult = await processor.releaseEscrow({
        escrowTransactionId: escrowTransaction.escrowTransactionId,
        processorTransactionId: escrowTransaction.processorTransactionId,
        processorEscrowId: escrowTransaction.processorEscrowId,
        recipientId: escrowTransaction.recipientId,
        amount,
        currency: escrowTransaction.currency,
        metadata: {
          ...metadata,
          releasedBy
        }
      });

      // Update escrow transaction
      escrowTransaction.releasedAmount = (escrowTransaction.releasedAmount || 0) + amount;

      // Update status based on whether this is a full or partial release
      if (escrowTransaction.releasedAmount >= escrowTransaction.amount) {
        escrowTransaction.status = 'released';
      } else {
        escrowTransaction.status = 'partially_released';
      }

      // Record transfer ID from processor
      escrowTransaction.processorTransferId = releaseResult.processorTransferId;

      // Update timeline
      escrowTransaction.timeline.push({
        status: escrowTransaction.status,
        timestamp: new Date(),
        note: note || `${amount} ${escrowTransaction.currency} released to recipient`,
        metadata: {
          amount,
          releasedBy
        }
      });

      await escrowTransaction.save();

      return escrowTransaction;
    } catch (error) {
      console.error('Error releasing escrow:', error);

      // Handle processor-specific errors
      if (error.processorError) {
        throw {
          message: error.message,
          processorError: error.processorError
        };
      }

      throw error;
    }
  }

  /**
   * Cancel an escrow transaction and refund sender
   * @param {string} escrowId - Escrow transaction ID
   * @param {Object} options - Cancellation options
   * @returns {Promise<Object>} - Updated escrow transaction
   */
  async cancelEscrow(escrowId, options = {}) {
    const {
      cancelledBy,
      reason,
      metadata = {}
    } = options;

    try {
      const escrowTransaction = await EscrowTransaction.findById(escrowId);

      if (!escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      // Can only cancel if status is pending or funded
      if (!['pending', 'funded'].includes(escrowTransaction.status)) {
        throw new Error(`Cannot cancel escrow in '${escrowTransaction.status}' status`);
      }

      // Get processor instance
      const processor = PaymentFactory.createProcessor(escrowTransaction.processor);

      // Cancel with the processor and refund sender
      const cancelResult = await processor.cancelEscrow({
        escrowTransactionId: escrowTransaction.escrowTransactionId,
        processorTransactionId: escrowTransaction.processorTransactionId,
        processorEscrowId: escrowTransaction.processorEscrowId,
        senderId: escrowTransaction.senderId,
        amount: escrowTransaction.amount,
        currency: escrowTransaction.currency,
        reason,
        metadata: {
          ...metadata,
          cancelledBy
        }
      });

      // Update escrow transaction
      escrowTransaction.status = 'cancelled';
      escrowTransaction.processorRefundId = cancelResult.processorRefundId;

      // Update timeline
      escrowTransaction.timeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason || 'Escrow transaction cancelled and funds returned to sender',
        metadata: {
          cancelledBy
        }
      });

      await escrowTransaction.save();

      return escrowTransaction;
    } catch (error) {
      console.error('Error cancelling escrow:', error);

      // Handle processor-specific errors
      if (error.processorError) {
        throw {
          message: error.message,
          processorError: error.processorError
        };
      }

      throw error;
    }
  }

  /**
   * Open a dispute for an escrow transaction
   * @param {string} escrowId - Escrow transaction ID
   * @param {Object} options - Dispute options
   * @returns {Promise<Object>} - Updated escrow transaction with dispute
   */
  async openDispute(escrowId, options = {}) {
    const {
      openedBy,
      disputeReason,
      evidence = {},
      metadata = {}
    } = options;

    try {
      const escrowTransaction = await EscrowTransaction.findById(escrowId);

      if (!escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      // Can only open dispute if status is funded
      if (escrowTransaction.status !== 'funded') {
        throw new Error(`Cannot open dispute for escrow in '${escrowTransaction.status}' status`);
      }

      // Get processor instance
      const processor = PaymentFactory.createProcessor(escrowTransaction.processor);

      // Open dispute with the processor
      const disputeResult = await processor.createEscrowDispute({
        escrowTransactionId: escrowTransaction.escrowTransactionId,
        processorTransactionId: escrowTransaction.processorTransactionId,
        processorEscrowId: escrowTransaction.processorEscrowId,
        senderId: escrowTransaction.senderId,
        recipientId: escrowTransaction.recipientId,
        disputeReason,
        evidence,
        metadata: {
          ...metadata,
          openedBy
        }
      });

      // Update escrow transaction
      escrowTransaction.status = 'disputed';
      escrowTransaction.processorDisputeId = disputeResult.processorDisputeId;

      // Add dispute info to escrow transaction
      escrowTransaction.dispute = {
        openedBy,
        openDate: new Date(),
        reason: disputeReason,
        evidence,
        status: 'open',
        processorDisputeId: disputeResult.processorDisputeId
      };

      // Update timeline
      escrowTransaction.timeline.push({
        status: 'disputed',
        timestamp: new Date(),
        note: `Dispute opened: ${disputeReason}`,
        metadata: {
          openedBy,
          disputeReason
        }
      });

      await escrowTransaction.save();

      return escrowTransaction;
    } catch (error) {
      console.error('Error opening escrow dispute:', error);

      // Handle processor-specific errors
      if (error.processorError) {
        throw {
          message: error.message,
          processorError: error.processorError
        };
      }

      throw error;
    }
  }

  /**
   * Resolve a dispute for an escrow transaction
   * @param {string} escrowId - Escrow transaction ID
   * @param {Object} options - Dispute resolution options
   * @returns {Promise<Object>} - Updated escrow transaction
   */
  async resolveDispute(escrowId, options = {}) {
    const {
      resolvedBy,
      resolution, // 'release', 'refund', 'split'
      splitRatio = 0.5, // Default 50/50 split if resolution is 'split'
      note,
      metadata = {}
    } = options;

    try {
      const escrowTransaction = await EscrowTransaction.findById(escrowId);

      if (!escrowTransaction) {
        throw new Error('Escrow transaction not found');
      }

      // Can only resolve dispute if status is disputed
      if (escrowTransaction.status !== 'disputed') {
        throw new Error(`Cannot resolve dispute for escrow in '${escrowTransaction.status}' status`);
      }

      // Get processor instance
      const processor = PaymentFactory.createProcessor(escrowTransaction.processor);

      let resolutionResult;

      // Handle resolution based on decision
      switch (resolution) {
        case 'release':
          // Release full amount to recipient
          resolutionResult = await processor.resolveEscrowDispute({
            escrowTransactionId: escrowTransaction.escrowTransactionId,
            processorTransactionId: escrowTransaction.processorTransactionId,
            processorEscrowId: escrowTransaction.processorEscrowId,
            processorDisputeId: escrowTransaction.processorDisputeId,
            resolution,
            recipientId: escrowTransaction.recipientId,
            amount: escrowTransaction.amount,
            currency: escrowTransaction.currency,
            metadata: {
              ...metadata,
              resolvedBy
            }
          });

          // Update status
          escrowTransaction.status = 'released';
          escrowTransaction.releasedAmount = escrowTransaction.amount;
          break;

        case 'refund':
          // Refund full amount to sender
          resolutionResult = await processor.resolveEscrowDispute({
            escrowTransactionId: escrowTransaction.escrowTransactionId,
            processorTransactionId: escrowTransaction.processorTransactionId,
            processorEscrowId: escrowTransaction.processorEscrowId,
            processorDisputeId: escrowTransaction.processorDisputeId,
            resolution,
            senderId: escrowTransaction.senderId,
            amount: escrowTransaction.amount,
            currency: escrowTransaction.currency,
            metadata: {
              ...metadata,
              resolvedBy
            }
          });

          // Update status
          escrowTransaction.status = 'refunded';
          break;

        case 'split':
          // Split amount between sender and recipient
          const recipientAmount = escrowTransaction.amount * splitRatio;
          const senderAmount = escrowTransaction.amount - recipientAmount;

          resolutionResult = await processor.resolveEscrowDisputeSplit({
            escrowTransactionId: escrowTransaction.escrowTransactionId,
            processorTransactionId: escrowTransaction.processorTransactionId,
            processorEscrowId: escrowTransaction.processorEscrowId,
            processorDisputeId: escrowTransaction.processorDisputeId,
            senderId: escrowTransaction.senderId,
            recipientId: escrowTransaction.recipientId,
            senderAmount,
            recipientAmount,
            currency: escrowTransaction.currency,
            metadata: {
              ...metadata,
              resolvedBy,
              splitRatio
            }
          });

          // Update status
          escrowTransaction.status = 'split';
          escrowTransaction.releasedAmount = recipientAmount;
          break;

        default:
          throw new Error(`Invalid dispute resolution: ${resolution}`);
      }

      // Update dispute info
      escrowTransaction.dispute.status = 'resolved';
      escrowTransaction.dispute.resolvedBy = resolvedBy;
      escrowTransaction.dispute.resolveDate = new Date();
      escrowTransaction.dispute.resolution = resolution;

      if (resolution === 'split') {
        escrowTransaction.dispute.splitRatio = splitRatio;
      }

      // Update timeline
      escrowTransaction.timeline.push({
        status: escrowTransaction.status,
        timestamp: new Date(),
        note: note || `Dispute resolved with decision: ${resolution}`,
        metadata: {
          resolvedBy,
          resolution,
          splitRatio: resolution === 'split' ? splitRatio : undefined
        }
      });

      await escrowTransaction.save();

      return escrowTransaction;
    } catch (error) {
      console.error('Error resolving escrow dispute:', error);

      // Handle processor-specific errors
      if (error.processorError) {
        throw {
          message: error.message,
          processorError: error.processorError
        };
      }

      throw error;
    }
  }

  /**
   * Get all escrow transactions for a user (as sender or recipient)
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (status, etc.)
   * @returns {Promise<Array>} - List of escrow transactions
   */
  async getUserEscrowTransactions(userId, filters = {}) {
    try {
      const query = {
        $or: [{ senderId: userId }, { recipientId: userId }]
      };

      // Apply status filter if provided
      if (filters.status) {
        query.status = filters.status;
      }

      // Apply date range filter if provided
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};

        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }

        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      // Find transactions
      const transactions = await EscrowTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100);

      return transactions;
    } catch (error) {
      console.error('Error fetching user escrow transactions:', error);
      throw error;
    }
  }
}

export default new EscrowService();

import dotenv from 'dotenv';

dotenv.config();

/**
 * Handles Telr webhook events
 */
export const telrWebhooks = {
  /**
   * Process and validates Telr webhook events
   * @param {Object} webhookData - The webhook event data
   * @returns {Object} Response object
   */
  async handleWebhook(webhookData) {
    console.log('Processing Telr webhook event');

    try {
      // In a real implementation, we would verify the webhook signature here

      // Extract event details
      const eventType = webhookData.event || 'unknown';
      const transactionId = webhookData.tran_ref || webhookData.transaction_id;
      const status = webhookData.status || webhookData.payment_status;

      // Process based on event type or status
      switch (status) {
        case 'success':
        case 'paid':
        case 'authorized':
          return await this.handlePaymentSuccess(webhookData);

        case 'failed':
        case 'declined':
          return await this.handlePaymentFailed(webhookData);

        case 'refunded':
          return await this.handleRefund(webhookData);

        default:
          console.log(`Unhandled Telr webhook: ${eventType} or status: ${status}`);
          return { message: 'Event received but not processed' };
      }
    } catch (error) {
      console.error('Error processing Telr webhook:', error);
      throw error;
    }
  },

  /**
   * Handle payment success event
   * @param {Object} webhookData - The webhook data
   * @returns {Object} Response object
   */
  async handlePaymentSuccess(webhookData) {
    const transactionId = webhookData.tran_ref || webhookData.transaction_id;
    const amount = webhookData.amount;
    const currency = webhookData.currency;

    console.log(`Telr payment succeeded: ${transactionId} for ${amount} ${currency}`);

    // In a real implementation, we would update the transaction in the database
    // await transactionService.updateTransactionStatus(transactionId, 'completed');

    return {
      message: 'Payment success processed successfully',
      transactionId,
      status: 'completed'
    };
  },

  /**
   * Handle payment failed event
   * @param {Object} webhookData - The webhook data
   * @returns {Object} Response object
   */
  async handlePaymentFailed(webhookData) {
    const transactionId = webhookData.tran_ref || webhookData.transaction_id;
    const reason = webhookData.reason || webhookData.message || 'Payment failed';

    console.log(`Telr payment failed: ${transactionId}, reason: ${reason}`);

    // In a real implementation, we would update the transaction in the database
    // await transactionService.updateTransactionStatus(transactionId, 'failed', reason);

    return {
      message: 'Payment failure processed successfully',
      transactionId,
      status: 'failed',
      reason
    };
  },

  /**
   * Handle refund event
   * @param {Object} webhookData - The webhook data
   * @returns {Object} Response object
   */
  async handleRefund(webhookData) {
    const transactionId = webhookData.tran_ref || webhookData.transaction_id;
    const refundId = webhookData.refund_ref || webhookData.refund_id;
    const amount = webhookData.amount;
    const currency = webhookData.currency;

    console.log(`Telr payment refunded: ${transactionId}, refund ID: ${refundId}, amount: ${amount} ${currency}`);

    // In a real implementation, we would update the transaction in the database
    // await transactionService.refundTransaction(transactionId, refundId);

    return {
      message: 'Refund processed successfully',
      transactionId,
      refundId,
      status: 'refunded'
    };
  }
};

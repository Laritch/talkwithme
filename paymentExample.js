/**
 * Payment Service Example
 *
 * This file demonstrates how to use the Payment Service and Payment-Loyalty Integration
 * in your existing expert chat system.
 */

// Import required services
const PaymentService = require('./paymentService');
const PaymentLoyaltyIntegration = require('./paymentLoyaltyIntegration');

// Mock implementation of LoyaltyService for demonstration
class MockLoyaltyService {
  constructor() {
    // Mock client data
    this.clientData = {
      'client123': {
        id: 'client123',
        points: 5000,
        tier: 'gold',
        history: []
      },
      'client456': {
        id: 'client456',
        points: 1200,
        tier: 'silver',
        history: []
      },
      'expert789': {
        id: 'expert789',
        points: 8500,
        tier: 'platinum',
        history: []
      }
    };
  }

  async getClientLoyaltyInfo(clientId) {
    return this.clientData[clientId] || { points: 0, tier: 'standard' };
  }

  async addPoints(clientId, points, metadata) {
    if (!this.clientData[clientId]) {
      this.clientData[clientId] = {
        id: clientId,
        points: 0,
        tier: 'standard',
        history: []
      };
    }

    this.clientData[clientId].points += points;
    this.clientData[clientId].history.push({
      action: 'add',
      points,
      timestamp: new Date(),
      ...metadata
    });

    // Update tier based on total points
    this._updateTier(clientId);

    console.log(`Added ${points} points to ${clientId}. New total: ${this.clientData[clientId].points}`);
    return this.clientData[clientId];
  }

  async deductPoints(clientId, points, metadata) {
    if (!this.clientData[clientId]) {
      return false;
    }

    if (this.clientData[clientId].points < points) {
      console.log(`Cannot deduct ${points} points from ${clientId}. Insufficient balance.`);
      return false;
    }

    this.clientData[clientId].points -= points;
    this.clientData[clientId].history.push({
      action: 'deduct',
      points,
      timestamp: new Date(),
      ...metadata
    });

    // Update tier based on total points
    this._updateTier(clientId);

    console.log(`Deducted ${points} points from ${clientId}. New total: ${this.clientData[clientId].points}`);
    return true;
  }

  calculatePointsValue(points) {
    // Example: 100 points = $1
    return points / 100;
  }

  getMaxRedeemablePoints(amount) {
    // Allow up to 50% of purchase to be paid with points
    return amount * 50 * 100; // Convert to points (100 points = $1)
  }

  _updateTier(clientId) {
    const points = this.clientData[clientId].points;

    if (points >= 10000) {
      this.clientData[clientId].tier = 'platinum';
    } else if (points >= 5000) {
      this.clientData[clientId].tier = 'gold';
    } else if (points >= 2000) {
      this.clientData[clientId].tier = 'silver';
    } else if (points >= 500) {
      this.clientData[clientId].tier = 'bronze';
    } else {
      this.clientData[clientId].tier = 'standard';
    }
  }
}

// Example usage

async function runExample() {
  console.log('=== Payment Service Integration Example ===\n');

  // Initialize services
  const paymentService = new PaymentService({
    standardCommission: 0.15, // 15%
    escrowEnabled: true
  });

  const loyaltyService = new MockLoyaltyService();

  const integration = new PaymentLoyaltyIntegration(
    paymentService,
    loyaltyService
  );

  try {
    // Example 1: Process a service payment with loyalty benefits
    console.log('Example 1: Process Expert Service Payment');
    console.log('------------------------------------------');

    // Get client loyalty info before payment
    const clientBefore = await loyaltyService.getClientLoyaltyInfo('client123');
    console.log('Client before payment:',
      `ID: ${clientBefore.id}, Points: ${clientBefore.points}, Tier: ${clientBefore.tier}`);

    // Process payment
    const paymentResult = await integration.processPaymentWithLoyalty({
      clientId: 'client123',
      recipientId: 'expert789',
      amount: 250.00,
      paymentType: 'service',
      itemId: 'consultation-1hr',
      isSubscriber: true // Client has a subscription
    });

    console.log('\nPayment Result:');
    console.log('- Transaction ID:', paymentResult.transactionId);
    console.log('- Status:', paymentResult.status);
    console.log('- Amount:', `$${paymentResult.amount.toFixed(2)}`);
    console.log('- Platform Fee:', `$${paymentResult.platformFee.toFixed(2)}`);
    console.log('- Recipient Amount:', `$${paymentResult.recipientAmount.toFixed(2)}`);
    console.log('- Expected Loyalty Points:', paymentResult.loyalty.expectedPoints);

    // Complete the payment (release from escrow)
    console.log('\nCompleting payment (releasing from escrow)...');
    const completionResult = await paymentService.completePayment(paymentResult.transactionId);
    console.log('Payment completed:', completionResult.status);

    // Get client loyalty info after payment
    setTimeout(async () => {
      const clientAfter = await loyaltyService.getClientLoyaltyInfo('client123');
      console.log('\nClient after payment:',
        `ID: ${clientAfter.id}, Points: ${clientAfter.points}, Tier: ${clientAfter.tier}`);

      // Check expert loyalty points
      const expertAfter = await loyaltyService.getClientLoyaltyInfo('expert789');
      console.log('Expert after payment:',
        `ID: ${expertAfter.id}, Points: ${expertAfter.points}, Tier: ${expertAfter.tier}`);

      // Example 2: Process a subscription with loyalty benefits
      console.log('\n\nExample 2: Process Subscription with Loyalty Benefits');
      console.log('----------------------------------------------------');

      // Get client loyalty info before subscription
      const client2Before = await loyaltyService.getClientLoyaltyInfo('client456');
      console.log('Client before subscription:',
        `ID: ${client2Before.id}, Points: ${client2Before.points}, Tier: ${client2Before.tier}`);

      // Process subscription
      const subscriptionResult = await integration.processSubscriptionWithLoyalty({
        clientId: 'client456',
        planId: 'premium-monthly',
        amount: 49.99,
        interval: 'month'
      });

      console.log('\nSubscription Result:');
      console.log('- Subscription ID:', subscriptionResult.subscriptionId);
      console.log('- Status:', subscriptionResult.status);
      console.log('- Current Period End:', subscriptionResult.currentPeriodEnd);
      console.log('- Loyalty Points Awarded:', subscriptionResult.loyalty.pointsAwarded);
      console.log('- Tier Discount:', subscriptionResult.loyalty.tierDiscount);

      // Get client loyalty info after subscription
      setTimeout(async () => {
        const client2After = await loyaltyService.getClientLoyaltyInfo('client456');
        console.log('\nClient after subscription:',
          `ID: ${client2After.id}, Points: ${client2After.points}, Tier: ${client2After.tier}`);

        // Example 3: Process product purchase with point redemption
        console.log('\n\nExample 3: Product Purchase with Point Redemption');
        console.log('------------------------------------------------');

        // Get client loyalty info before purchase
        const client3Before = await loyaltyService.getClientLoyaltyInfo('client123');
        console.log('Client before purchase:',
          `ID: ${client3Before.id}, Points: ${client3Before.points}, Tier: ${client3Before.tier}`);

        // Process payment with point redemption
        const productResult = await integration.processPaymentWithLoyalty({
          clientId: 'client123',
          recipientId: 'platform',
          amount: 120.00,
          paymentType: 'product',
          itemId: 'course-advanced',
          redeemPoints: 2000 // Redeem 2000 points ($20 value)
        });

        console.log('\nProduct Purchase Result:');
        console.log('- Transaction ID:', productResult.transactionId);
        console.log('- Status:', productResult.status);
        console.log('- Amount (after points redemption):', `$${productResult.amount.toFixed(2)}`);
        console.log('- Platform Fee:', `$${productResult.platformFee.toFixed(2)}`);
        console.log('- Expected Loyalty Points:', productResult.loyalty.expectedPoints);

        // Complete the payment
        await paymentService.completePayment(productResult.transactionId);

        // Get client loyalty info after purchase
        setTimeout(async () => {
          const client3After = await loyaltyService.getClientLoyaltyInfo('client123');
          console.log('\nClient after purchase with point redemption:',
            `ID: ${client3After.id}, Points: ${client3After.points}, Tier: ${client3After.tier}`);

          // Generate financial reports
          console.log('\n\nExample 4: Financial Reporting');
          console.log('-----------------------------');

          const platformReport = paymentService.generateFinancialReport();

          console.log('Platform Financial Summary:');
          console.log('- Transaction Count:', platformReport.totals.transactionCount);
          console.log('- Gross Volume:', `$${platformReport.totals.grossVolume.toFixed(2)}`);
          console.log('- Platform Fees:', `$${platformReport.totals.platformFees.toFixed(2)}`);

          console.log('\nBreakdown by Payment Type:');
          Object.entries(platformReport.byPaymentType).forEach(([type, data]) => {
            console.log(`- ${type}: ${data.count} transactions, $${data.volume.toFixed(2)} volume, $${data.fees.toFixed(2)} fees`);
          });

          // Generate expert statement
          const expertStatement = paymentService.generateRecipientStatement('expert789');

          console.log('\nExpert Financial Statement:');
          console.log('- Expert ID:', expertStatement.recipientId);
          console.log('- Total Earnings:', `$${expertStatement.summary.totalEarnings.toFixed(2)}`);
          console.log('- Platform Fees:', `$${expertStatement.summary.platformFees.toFixed(2)}`);
          console.log('- Available Balance:', `$${expertStatement.summary.availableBalance.toFixed(2)}`);

          console.log('\n=== End of Payment Service Integration Example ===');
        }, 100);
      }, 100);
    }, 100);

  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
runExample();

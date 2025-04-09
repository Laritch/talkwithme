/**
 * Unified Payment Service
 *
 * Centralized service for handling payments across multiple processors
 * Implements a Strategy Pattern for different payment processors
 */

import PaymentFactory from './paymentFactory.js';
import PaymentPreference from '../../models/paymentPreferenceModel.js';
import PaymentMethod from '../../models/paymentMethodModel.js';
import User from '../../models/userModel.js';
import Transaction from '../../models/transactionModel.js';
import Order from '../../models/orderModel.js';
import Subscription from '../../models/subscriptionModel.js';
import CheckoutSession from '../../models/checkoutSessionModel.js';
import { getAvailableProcessorsForRegion } from '../../utils/paymentUtils.js';

// Add import for region fee service
import regionFeeService from '../regionFeeService.js';

class UnifiedPaymentService {
  /**
   * Create a new checkout session
   * @param {Object} options - Checkout options
   * @returns {Object} - Checkout session details
   */
  async createCheckout(options) {
    const {
      userId,
      items,
      currency: requestedCurrency,
      paymentMethodId,
      processor: specifiedProcessor,
      couponCode,
      shippingAddress,
      billingAddress,
      metadata = {},
      expertId,
      platformFee,
      paymentType = 'standard', // 'standard', 'expert', 'platform', 'subscription'
      region
    } = options;

    try {
      // Get user for region information
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Determine the appropriate currency for this payment
      const userRegion = region || user.region;
      const paymentCurrency = await this.determinePaymentCurrency(paymentType, {
        currency: requestedCurrency,
        expertId,
        userId,
        region: userRegion
      });

      // Determine which payment processor to use
      const processor = specifiedProcessor || await this.getPreferredProcessor(userId, userRegion);

      // Get appropriate payment processor instance
      const paymentProcessor = PaymentFactory.createProcessor(processor);
      if (!paymentProcessor) {
        throw new Error(`Payment processor '${processor}' is not supported`);
      }

      // Check if the payment processor is available in the user's region
      const availableProcessors = getAvailableProcessorsForRegion(userRegion);
      if (!availableProcessors[processor]) {
        throw new Error(`Payment processor '${processor}' is not available in your region`);
      }

      // For expert payments, separate expert payment and platform fee if applicable
      let checkoutItems = [...items];
      let platformFeeItem = null;

      if (paymentType === 'expert' && expertId) {
        // Calculate total amount of expert items
        const expertTotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

        // Calculate platform fee using region fee service or use provided fee
        let platformFeeAmount;

        if (platformFee) {
          // Use provided platformFee if specified
          platformFeeAmount = typeof platformFee === 'string' && platformFee.includes('%')
            ? (expertTotal * parseFloat(platformFee) / 100)
            : platformFee;
        } else {
          // Calculate fee based on region and expert data
          const feeDetails = await this.calculatePlatformFee({
            amount: expertTotal,
            expertId,
            region: userRegion,
            currency: paymentCurrency
          });

          platformFeeAmount = feeDetails.amount;
        }

        // Add platform fee as a separate item if amount is greater than zero
        if (platformFeeAmount > 0) {
          platformFeeItem = {
            name: 'Platform Service Fee',
            price: platformFeeAmount,
            quantity: 1,
            type: 'platform_fee'
          };

          checkoutItems.push(platformFeeItem);
        }
      }

      // Resolve payment method if provided
      let resolvedPaymentMethodId = paymentMethodId;
      const preferences = await PaymentPreference.findOne({ userId });
      if (!resolvedPaymentMethodId && preferences?.defaultPaymentMethods?.get(processor)) {
        resolvedPaymentMethodId = preferences.defaultPaymentMethods.get(processor);
      }

      // Create checkout session with the processor
      const checkoutResult = await paymentProcessor.createCheckoutSession({
        userId,
        items: checkoutItems,
        currency: paymentCurrency,
        paymentMethodId: resolvedPaymentMethodId,
        couponCode,
        shippingAddress,
        billingAddress,
        metadata: {
          ...metadata,
          source: 'unified_payment_service',
          processor,
          paymentType,
          expertId: expertId || null,
          platformFee: platformFeeItem ? platformFeeItem.price : 0
        }
      });

      // Store checkout session in database
      const checkoutSession = new CheckoutSession({
        userId,
        processor,
        processorCheckoutId: checkoutResult.id,
        items,
        currency: paymentCurrency,
        amount: checkoutResult.amount,
        status: 'pending',
        paymentMethodId: resolvedPaymentMethodId,
        couponCode,
        metadata: {
          ...metadata,
          clientSecret: checkoutResult.clientSecret
        }
      });

      await checkoutSession.save();

      return {
        id: checkoutSession._id,
        processor,
        redirectUrl: checkoutResult.redirectUrl,
        clientSecret: checkoutResult.clientSecret,
        amount: checkoutResult.amount,
        currency: paymentCurrency
      };
    } catch (error) {
      console.error('Error creating checkout:', error);

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
   * Calculate platform fee for an expert payment
   * @param {Object} options - Fee calculation options
   * @returns {Promise<Object>} - Fee details
   */
  async calculatePlatformFee(options) {
    const {
      amount,
      expertId,
      region,
      currency
    } = options;

    try {
      if (!expertId) {
        throw new Error('Expert ID is required for platform fee calculation');
      }

      // Get expert details
      const Expert = (await import('../../models/expertModel.js')).default;
      const expert = await Expert.findById(expertId);

      if (!expert) {
        throw new Error('Expert not found');
      }

      // Use expert's region if not provided
      const expertRegion = region || expert.region || 'global';

      // Get expert's earnings data
      const Transaction = (await import('../../models/transactionModel.js')).default;
      const transactions = await Transaction.find({
        'expertPayment.expertId': expertId,
        status: 'completed'
      });

      const totalEarnings = transactions.reduce((total, tx) => {
        return total + (tx.expertPayment?.amount || 0);
      }, 0);

      // Calculate commission using region fee service
      const expertData = {
        totalEarnings,
        subscriptionTier: expert.subscriptionTier
      };

      const commissionData = await regionFeeService.calculateCommission(
        expertRegion,
        amount,
        expertData
      );

      // Convert commission to the requested currency if needed
      let finalFee = commissionData.totalCommission;
      let finalCurrency = commissionData.currency;

      if (currency && currency !== commissionData.currency) {
        finalFee = await this.convertCurrency(
          finalFee,
          commissionData.currency,
          currency
        );
        finalCurrency = currency;
      }

      return {
        amount: finalFee,
        currency: finalCurrency,
        commissionRate: commissionData.commissionRate,
        originalCurrency: commissionData.currency,
        originalAmount: commissionData.totalCommission,
        fixedFee: commissionData.fixedFee,
        percentageFee: commissionData.percentageCommission
      };
    } catch (error) {
      console.error('Error calculating platform fee:', error);

      // Fallback to a default fee if calculation fails
      return {
        amount: amount * 0.15, // Default 15% fee
        currency: currency || 'USD',
        commissionRate: 15,
        isDefault: true
      };
    }
  }

  /**
   * Determine the appropriate currency for a payment
   * @param {string} paymentType - Type of payment (expert, platform, subscription)
   * @param {Object} options - Payment options
   * @returns {string} - Appropriate currency code
   */
  async determinePaymentCurrency(paymentType, options) {
    const {
      currency: requestedCurrency,
      expertId,
      userId,
      region,
      forceExpertCurrency,
      forcePlatformCurrency
    } = options;

    // If a specific currency is forced, use it
    if (forcePlatformCurrency && ['platform', 'subscription'].includes(paymentType)) {
      return forcePlatformCurrency;
    }

    if (forceExpertCurrency && paymentType === 'expert') {
      return forceExpertCurrency;
    }

    // Get platform default currency
    const platformCurrency = process.env.DEFAULT_CURRENCY || 'USD';

    // For platform payments and subscriptions, use platform currency by default
    if (['platform', 'subscription'].includes(paymentType)) {
      return requestedCurrency || platformCurrency;
    }

    // For expert payments, try to use expert's preferred currency if available
    if (paymentType === 'expert' && expertId) {
      try {
        const Expert = (await import('../../models/expertModel.js')).default;
        const expert = await Expert.findById(expertId).select('paymentPreferences region');

        if (expert && expert.paymentPreferences && expert.paymentPreferences.currency) {
          return expert.paymentPreferences.currency;
        }

        // If expert has a region, use that region's currency
        if (expert && expert.region) {
          const expertRegionCurrency = this.getCurrencyForRegion(expert.region);
          if (expertRegionCurrency) {
            return expertRegionCurrency;
          }
        }
      } catch (error) {
        console.error('Error fetching expert payment preferences:', error);
      }
    }

    // If we have a region, use that region's currency
    if (region) {
      const regionCurrency = this.getCurrencyForRegion(region);
      if (regionCurrency) {
        return regionCurrency;
      }
    }

    // Fall back to requested currency or platform default
    return requestedCurrency || platformCurrency;
  }

  /**
   * Get currency for a region
   * @param {string} region - Region code
   * @returns {string} - Currency code
   */
  getCurrencyForRegion(region) {
    const { getCurrencyForRegion } = require('../../utils/paymentUtils.js');
    return getCurrencyForRegion(region);
  }

  /**
   * Apply currency conversion if needed
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<number>} - Converted amount
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      // Try to get the exchange rate from cache or API
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);

      // Apply conversion
      return amount * exchangeRate;
    } catch (error) {
      console.error(`Error converting currency from ${fromCurrency} to ${toCurrency}:`, error);
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Promise<number>} - Exchange rate
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    // Check cache first
    const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}`;
    const cachedRate = await this.getCachedValue(cacheKey);

    if (cachedRate) {
      return parseFloat(cachedRate);
    }

    // Fetch from exchange rate API
    try {
      // Use an exchange rate API (add your preferred service)
      const url = `${process.env.EXCHANGE_RATE_API_URL}?from=${fromCurrency}&to=${toCurrency}&amount=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.EXCHANGE_RATE_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`);
      }

      const data = await response.json();
      const rate = data.result || data.rate || data.exchangeRate;

      if (!rate) {
        throw new Error('Invalid exchange rate response');
      }

      // Cache the rate for 1 hour
      await this.setCachedValue(cacheKey, rate.toString(), 3600);

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);

      // Fallback to hardcoded rates for common pairs
      const fallbackRates = {
        'USD_AED': 3.6725,
        'AED_USD': 0.2723,
        'USD_SAR': 3.75,
        'SAR_USD': 0.2667,
        'USD_QAR': 3.64,
        'QAR_USD': 0.2747,
        'EUR_USD': 1.08,
        'USD_EUR': 0.93,
        'GBP_USD': 1.27,
        'USD_GBP': 0.79
      };

      const rateKey = `${fromCurrency}_${toCurrency}`;
      if (fallbackRates[rateKey]) {
        console.warn(`Using fallback exchange rate for ${rateKey}`);
        return fallbackRates[rateKey];
      }

      // If no fallback available, throw error
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value
   */
  async getCachedValue(key) {
    // Implement caching mechanism of your choice
    // For example, using Redis or in-memory cache
    return null; // Placeholder
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<void>}
   */
  async setCachedValue(key, value, ttl) {
    // Implement caching mechanism of your choice
    // For example, using Redis or in-memory cache
  }

  /**
   * Get the status of a checkout session
   * @param {string} checkoutId - Checkout session ID
   * @param {string} userId - User ID
   * @returns {Object} - Checkout status details
   */
  async getCheckoutStatus(checkoutId, userId) {
    try {
      const checkoutSession = await CheckoutSession.findOne({
        _id: checkoutId,
        userId
      });

      if (!checkoutSession) {
        return null;
      }

      // If the session is already completed or failed, return the stored status
      if (['completed', 'failed', 'cancelled'].includes(checkoutSession.status)) {
        return {
          status: checkoutSession.status,
          orderId: checkoutSession.orderId,
          transactionId: checkoutSession.transactionId
        };
      }

      // Otherwise, check with the processor for the latest status
      const paymentProcessor = PaymentFactory.createProcessor(checkoutSession.processor);
      if (!paymentProcessor) {
        throw new Error(`Payment processor '${checkoutSession.processor}' is not supported`);
      }

      const statusResult = await paymentProcessor.getCheckoutStatus(checkoutSession.processorCheckoutId);

      // Update the checkout session status
      checkoutSession.status = statusResult.status;
      if (statusResult.transactionId) {
        checkoutSession.transactionId = statusResult.transactionId;
      }
      if (statusResult.orderId) {
        checkoutSession.orderId = statusResult.orderId;
      }

      await checkoutSession.save();

      return {
        status: statusResult.status,
        orderId: statusResult.orderId,
        transactionId: statusResult.transactionId
      };
    } catch (error) {
      console.error('Error getting checkout status:', error);
      throw error;
    }
  }

  /**
   * Process a payment directly (without checkout)
   * @param {Object} options - Payment options
   * @returns {Object} - Payment result
   */
  async processPayment(options) {
    const {
      userId,
      amount,
      currency,
      paymentMethodId,
      processor: specifiedProcessor,
      description,
      metadata = {}
    } = options;

    try {
      // Get user for region information
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Determine which payment processor to use
      const processor = specifiedProcessor || await this.getPreferredProcessor(userId, user.region);

      // Get appropriate payment processor instance
      const paymentProcessor = PaymentFactory.createProcessor(processor);
      if (!paymentProcessor) {
        throw new Error(`Payment processor '${processor}' is not supported`);
      }

      // Resolve payment method
      let paymentMethod;
      if (paymentMethodId) {
        paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId });
        if (!paymentMethod) {
          throw new Error('Payment method not found');
        }
      } else {
        // Find default payment method for this processor
        paymentMethod = await PaymentMethod.findOne({
          userId,
          processor,
          isDefault: true
        });

        if (!paymentMethod) {
          // Find any payment method for this user and processor
          paymentMethod = await PaymentMethod.findOne({ userId, processor });
        }

        if (!paymentMethod) {
          throw new Error(`No payment method found for processor '${processor}'`);
        }
      }

      // Process the payment
      const paymentResult = await paymentProcessor.processPayment({
        amount,
        currency: currency || 'USD',
        paymentMethodId: paymentMethod.processorPaymentId,
        description,
        metadata: {
          ...metadata,
          userId,
          source: 'unified_payment_service'
        }
      });

      // Create transaction record
      const transaction = new Transaction({
        userId,
        processor,
        processorTransactionId: paymentResult.id,
        amount,
        currency: currency || 'USD',
        status: paymentResult.status,
        paymentMethodId: paymentMethod._id,
        description,
        metadata: {
          ...metadata,
          processorResponse: paymentResult
        }
      });

      await transaction.save();

      return {
        success: paymentResult.status === 'succeeded',
        transactionId: transaction._id,
        status: paymentResult.status,
        processorTransactionId: paymentResult.id
      };
    } catch (error) {
      console.error('Error processing payment:', error);

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
   * Refund a transaction
   * @param {Object} options - Refund options
   * @returns {Object} - Refund result
   */
  async refundTransaction(options) {
    const {
      transactionId,
      amount,
      reason,
      metadata = {}
    } = options;

    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'succeeded') {
        throw new Error('Cannot refund a transaction that has not succeeded');
      }

      if (transaction.refunded) {
        throw new Error('Transaction has already been refunded');
      }

      const paymentProcessor = PaymentFactory.createProcessor(transaction.processor);
      if (!paymentProcessor) {
        throw new Error(`Payment processor '${transaction.processor}' is not supported`);
      }

      // Process the refund
      const refundResult = await paymentProcessor.refundPayment({
        transactionId: transaction.processorTransactionId,
        amount: amount || transaction.amount,
        reason,
        metadata: {
          ...metadata,
          originalTransactionId: transactionId
        }
      });

      // Update the transaction
      transaction.refunded = true;
      transaction.refundDetails = {
        refundId: refundResult.id,
        amount: refundResult.amount,
        status: refundResult.status,
        reason,
        refundedAt: new Date()
      };

      await transaction.save();

      // Update associated order if exists
      const order = await Order.findOne({ transactionId: transaction._id });
      if (order) {
        order.paymentStatus = 'refunded';
        order.refundDetails = transaction.refundDetails;
        await order.save();
      }

      return {
        success: true,
        refundId: refundResult.id,
        status: refundResult.status,
        amount: refundResult.amount,
        transactionId: transaction._id
      };
    } catch (error) {
      console.error('Error refunding transaction:', error);

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
   * Get preferred payment processor for a user
   * @param {string} userId - User ID
   * @param {string} region - User region
   * @returns {string} - Preferred processor name
   */
  async getPreferredProcessor(userId, region = 'global') {
    // Get user preferences
    const preferences = await PaymentPreference.findOne({ userId });

    if (preferences) {
      return preferences.getPreferredProcessor(region);
    }

    // Fallback to region-based default
    const availableProcessors = getAvailableProcessorsForRegion(region);
    const processorNames = Object.keys(availableProcessors);

    // Priority order
    const processorPriority = ['stripe', 'adyen', 'square', 'mpesa', 'razorpay'];

    for (const processor of processorPriority) {
      if (processorNames.includes(processor)) {
        return processor;
      }
    }

    // Final fallback
    return processorNames[0] || 'stripe';
  }

  /**
   * Get appropriate currency for a region
   * @param {string} region - Region code
   * @returns {string} - Currency code
   */
  getCurrencyForRegion(region) {
    const regionCurrencyMap = {
      us: 'USD',
      eu: 'EUR',
      uk: 'GBP',
      kenya: 'KES',
      tanzania: 'TZS',
      uganda: 'UGX',
      ghana: 'GHS',
      nigeria: 'NGN',
      southafrica: 'ZAR',
      india: 'INR',
      africa: 'USD',
      asia: 'USD',
      global: 'USD'
    };

    return regionCurrencyMap[region] || 'USD';
  }

  /**
   * Complete a checkout session
   * @param {Object} options - Checkout completion options
   * @returns {Promise<Object>} - Completion result
   */
  async completeCheckout(options) {
    const {
      sessionId,
      processor,
      payerId,
      orderId,
      user = {}
    } = options;

    try {
      if (!sessionId) {
        throw new Error('Checkout session ID is required');
      }

      if (!processor) {
        throw new Error('Payment processor is required');
      }

      // Find the checkout session
      const checkoutSession = await CheckoutSession.findById(sessionId);

      if (!checkoutSession) {
        // Try to find by processor ID
        const checkoutByProcessor = await CheckoutSession.findOne({
          'processorData.sessionId': sessionId
        });

        if (!checkoutByProcessor) {
          throw new Error(`Checkout session '${sessionId}' not found`);
        }

        checkoutSession = checkoutByProcessor;
      }

      // Get payment processor instance
      const paymentProcessor = PaymentFactory.createProcessor(processor);
      if (!paymentProcessor) {
        throw new Error(`Payment processor '${processor}' is not supported`);
      }

      // Complete the checkout with the processor
      const completionResult = await paymentProcessor.completeCheckout({
        checkoutId: sessionId,
        payerId,
        additionalData: {
          checkoutSessionId: checkoutSession._id
        }
      });

      // If we have an order ID, update the order
      let order;
      if (orderId || checkoutSession.orderId) {
        order = await Order.findById(orderId || checkoutSession.orderId);

        if (order) {
          // Update order payment status
          order.paymentStatus = completionResult.status === 'succeeded' ? 'completed' : 'pending';

          // Update order status based on item type
          if (order.isDigitalOnly) {
            order.status = 'delivered';
          } else {
            order.status = 'processing';
          }

          // Record transaction details
          if (!order.paymentDetails) {
            order.paymentDetails = {};
          }

          order.paymentDetails.transactionId = completionResult.transactionId;
          order.paymentDetails.processorTransactionId = completionResult.transactionId;
          order.paymentDetails.paymentMethod = processor;
          order.paymentDetails.paymentProcessor = processor;
          order.paymentDetails.paidAmount = completionResult.amount;
          order.paymentDetails.currency = completionResult.currency || checkoutSession.currency;
          order.paymentDetails.paymentDate = new Date();

          await order.save();

          // Process loyalty points
          try {
            await paymentLoyaltyIntegration.processLoyaltyAfterPayment(order._id);
          } catch (loyaltyError) {
            console.error('Error processing loyalty after checkout completion:', loyaltyError);
          }
        }
      }

      // Update checkout session
      checkoutSession.status = 'completed';
      checkoutSession.completedAt = new Date();
      checkoutSession.processorData = {
        ...checkoutSession.processorData,
        paymentId: completionResult.transactionId,
        completionResult
      };

      await checkoutSession.save();

      return {
        success: true,
        orderId: order?._id || null,
        transactionId: completionResult.transactionId,
        amount: completionResult.amount,
        currency: completionResult.currency,
        status: completionResult.status
      };
    } catch (error) {
      console.error('Error completing checkout:', error);
      throw error;
    }
  }
}

export default UnifiedPaymentService;

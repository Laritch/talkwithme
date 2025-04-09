/**
 * Payment Factory
 *
 * Factory for creating appropriate payment processor instances
 * based on processor type, region, and payment method
 */

import StripeProcessor from './processors/stripeProcessor.js';
import SquareProcessor from './processors/squareProcessor.js';
import AdyenProcessor from './processors/adyenProcessor.js';
import MpesaProcessor from './processors/mpesaProcessor.js';
import RazorpayProcessor from './processors/razorpayProcessor.js';
import PayPalProcessor from './processors/paypalProcessor.js';
import TelrProcessor from './processors/telrProcessor.js';
import { getAvailableProcessorsForRegion } from '../../utils/paymentUtils.js';

class PaymentFactory {
  // Cache processor instances for reuse
  static processorInstances = {};

  /**
   * Create a payment processor instance
   * @param {string} processorName - Payment processor name
   * @returns {Object} - Payment processor instance
   */
  static createProcessor(processorName) {
    // Check if we already have an instance
    if (this.processorInstances[processorName]) {
      return this.processorInstances[processorName];
    }

    // Create a new instance based on processor name
    let processor;

    switch (processorName.toLowerCase()) {
      case 'stripe':
        processor = new StripeProcessor();
        break;
      case 'square':
        processor = new SquareProcessor();
        break;
      case 'adyen':
        processor = new AdyenProcessor();
        break;
      case 'mpesa':
        processor = new MpesaProcessor();
        break;
      case 'razorpay':
        processor = new RazorpayProcessor();
        break;
      case 'paypal':
        processor = new PayPalProcessor();
        break;
      case 'telr':
        processor = new TelrProcessor();
        break;
      default:
        console.error(`Unsupported payment processor: ${processorName}`);
        return null;
    }

    // Cache the instance
    this.processorInstances[processorName] = processor;

    return processor;
  }

  /**
   * Get best available processor for a region and payment method
   * @param {string} region - Region code
   * @param {string} paymentMethod - Payment method type
   * @returns {Object} - Payment processor instance
   */
  static getBestProcessorForRegion(region, paymentMethod) {
    // Get available processors for this region
    const availableProcessors = getAvailableProcessorsForRegion(region);

    // Filter processors that support the payment method
    const supportedProcessors = Object.entries(availableProcessors)
      .filter(([_, processor]) =>
        processor.methods.includes(paymentMethod)
      )
      .map(([name]) => name);

    if (supportedProcessors.length === 0) {
      console.error(`No processor available for ${paymentMethod} in ${region}`);
      return null;
    }

    // Priority order (processor ranking)
    const processorPriority = {
      stripe: 5,
      adyen: 4,
      paypal: 4,  // Same priority as Adyen
      telr: 4,    // Same priority as Adyen & PayPal - preferred for Middle East
      square: 3,
      razorpay: 2,
      mpesa: 1
    };

    // Sort processors by priority
    supportedProcessors.sort((a, b) => {
      const priorityA = processorPriority[a] || 0;
      const priorityB = processorPriority[b] || 0;
      return priorityB - priorityA;
    });

    // Return instance of the highest priority processor
    return this.createProcessor(supportedProcessors[0]);
  }

  /**
   * Clear processor instance cache
   * Useful for testing or when configuration changes
   */
  static clearProcessorCache() {
    this.processorInstances = {};
  }
}

export default PaymentFactory;

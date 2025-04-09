// Define the payment method interface
export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  transactionFeePercentage: number;
  minAmount: number;
  maxAmount: number | null;
  supportedCurrencies: string[];
  processingTimeHours: number;
  availableRegions: string[];
  priorityRegions: string[];
  isAvailable: () => boolean;
  process: (amount: number, currency: string, details: any) => Promise<ProcessedPayment>;
}

// Define the processed payment result
export interface ProcessedPayment {
  success: boolean;
  transactionId?: string;
  error?: string;
  receipt?: {
    amount: number;
    currency: string;
    fee: number;
    paymentMethod: string;
    timestamp: string;
    recipient: string;
  };
  requiresAdditionalVerification?: boolean;
  verificationUrl?: string;
}

// Payment method implementations
const PaymentMethods: Record<string, PaymentMethod> = {
  // Credit Card
  creditCard: {
    id: 'credit-card',
    name: 'Credit Card',
    description: 'Pay using Visa, Mastercard, or American Express',
    iconPath: '/icons/credit-card.svg',
    transactionFeePercentage: 2.9,
    minAmount: 5,
    maxAmount: 25000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    processingTimeHours: 0, // Instant
    availableRegions: ['GLOBAL'],
    priorityRegions: ['US', 'CA', 'EU', 'UK', 'AU'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `cc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 2.9) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'Credit Card',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Credit card processing failed',
        };
      }
    },
  },

  // PayPal
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    description: 'Fast and secure payment via PayPal',
    iconPath: '/icons/paypal.svg',
    transactionFeePercentage: 3.4,
    minAmount: 1,
    maxAmount: 10000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    processingTimeHours: 0, // Instant
    availableRegions: ['GLOBAL'],
    priorityRegions: ['US', 'EU', 'CA', 'UK', 'AU'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `pp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 3.4) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'PayPal',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'PayPal processing failed',
        };
      }
    },
  },

  // Bank Transfer
  bankTransfer: {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Secure direct bank transfer (ACH/SEPA/Wire)',
    iconPath: '/icons/bank.svg',
    transactionFeePercentage: 1.5,
    minAmount: 100,
    maxAmount: 1000000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY'],
    processingTimeHours: 48, // 1-2 business days
    availableRegions: ['US', 'EU', 'UK', 'CH', 'CA', 'AU', 'JP'],
    priorityRegions: ['US', 'EU', 'UK'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `bt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 1.5) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'Bank Transfer',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Bank transfer processing failed',
        };
      }
    },
  },

  // M-Pesa
  mpesa: {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Mobile money transfer service',
    iconPath: '/icons/mpesa.svg',
    transactionFeePercentage: 1.2,
    minAmount: 10,
    maxAmount: 15000,
    supportedCurrencies: ['KES', 'USD'],
    processingTimeHours: 0, // Almost instant
    availableRegions: ['KE', 'TZ', 'CD', 'MZ', 'ZM', 'LR', 'ET'],
    priorityRegions: ['KE', 'TZ'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `mp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 1.2) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'M-Pesa',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'M-Pesa processing failed',
        };
      }
    },
  },

  // Wise (formerly TransferWise)
  wise: {
    id: 'wise',
    name: 'Wise',
    description: 'International transfers with low fees',
    iconPath: '/icons/wise.svg',
    transactionFeePercentage: 0.5,
    minAmount: 50,
    maxAmount: 50000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'NZD', 'CAD', 'JPY', 'SGD'],
    processingTimeHours: 24, // Usually within 1 day
    availableRegions: ['GLOBAL'],
    priorityRegions: ['UK', 'EU', 'US', 'AU', 'NZ', 'SG'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 0.5) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'Wise',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Wise processing failed',
        };
      }
    },
  },

  // Western Union
  westernUnion: {
    id: 'western-union',
    name: 'Western Union',
    description: 'Global money transfer service',
    iconPath: '/icons/western-union.svg',
    transactionFeePercentage: 2.5,
    minAmount: 50,
    maxAmount: 5000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN', 'PHP', 'INR'],
    processingTimeHours: 2, // Usually within 2 hours
    availableRegions: ['GLOBAL'],
    priorityRegions: ['US', 'MX', 'IN', 'PH', 'NG'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `wu-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 2.5) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'Western Union',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Western Union processing failed',
        };
      }
    },
  },

  // Payoneer
  payoneer: {
    id: 'payoneer',
    name: 'Payoneer',
    description: 'Global payment platform for businesses',
    iconPath: '/icons/payoneer.svg',
    transactionFeePercentage: 1.0,
    minAmount: 50,
    maxAmount: 15000,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD'],
    processingTimeHours: 12, // Usually within 12 hours
    availableRegions: ['GLOBAL'],
    priorityRegions: ['US', 'CN', 'IN', 'PH', 'PK', 'BD'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `pn-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 1.0) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'Payoneer',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Payoneer processing failed',
        };
      }
    },
  },

  // Cryptocurrency
  cryptocurrency: {
    id: 'cryptocurrency',
    name: 'Cryptocurrency',
    description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
    iconPath: '/icons/crypto.svg',
    transactionFeePercentage: 1.0, // Platform fee (network fees are separate)
    minAmount: 10,
    maxAmount: null, // No upper limit
    supportedCurrencies: ['BTC', 'ETH', 'USDT', 'USDC', 'XRP', 'SOL', 'ADA'],
    processingTimeHours: 1, // Varies by network and confirmation settings
    availableRegions: ['GLOBAL'],
    priorityRegions: ['US', 'KR', 'JP', 'SG', 'CH'],
    isAvailable: () => true,
    process: async (amount, currency, details) => {
      try {
        // Simulated processing
        const transactionId = `crypto-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const fee = (amount * 1.0) / 100;

        return {
          success: true,
          transactionId,
          receipt: {
            amount,
            currency,
            fee,
            paymentMethod: 'Cryptocurrency',
            timestamp: new Date().toISOString(),
            recipient: details.recipient || 'Merchant',
          },
        };
      } catch (error) {
        return {
          success: false,
          error: 'Cryptocurrency processing failed',
        };
      }
    },
  },
};

// Get all payment methods
export function getAllPaymentMethods(): PaymentMethod[] {
  return Object.values(PaymentMethods);
}

// Get available payment methods for a region
export function getAvailablePaymentMethods(
  userRegion: string,
  currency: string
): PaymentMethod[] {
  const allMethods = getAllPaymentMethods();

  // Filter methods by region and currency
  return allMethods.filter(method => {
    const isRegionAvailable =
      method.availableRegions.includes('GLOBAL') ||
      method.availableRegions.includes(userRegion);

    const isCurrencySupported = method.supportedCurrencies.includes(currency);

    return isRegionAvailable && isCurrencySupported && method.isAvailable();
  });
}

// Get prioritized payment methods for a user's region
export function getPrioritizedPaymentMethods(
  userRegion: string,
  currency: string
): PaymentMethod[] {
  const availableMethods = getAvailablePaymentMethods(userRegion, currency);

  // Sort by priority for the user's region
  return availableMethods.sort((a, b) => {
    const aIsPriority = a.priorityRegions.includes(userRegion);
    const bIsPriority = b.priorityRegions.includes(userRegion);

    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;

    // If both are priority or neither is priority, sort by fee
    return a.transactionFeePercentage - b.transactionFeePercentage;
  });
}

// Get a payment method by ID
export function getPaymentMethodById(id: string): PaymentMethod | undefined {
  return PaymentMethods[id];
}

// Process a payment
export async function processPayment(
  methodId: string,
  amount: number,
  currency: string,
  details: any
): Promise<ProcessedPayment> {
  const method = getPaymentMethodById(methodId);

  if (!method) {
    return {
      success: false,
      error: 'Invalid payment method',
    };
  }

  if (amount < method.minAmount) {
    return {
      success: false,
      error: `Minimum amount for ${method.name} is ${method.minAmount} ${currency}`,
    };
  }

  if (method.maxAmount !== null && amount > method.maxAmount) {
    return {
      success: false,
      error: `Maximum amount for ${method.name} is ${method.maxAmount} ${currency}`,
    };
  }

  return method.process(amount, currency, details);
}

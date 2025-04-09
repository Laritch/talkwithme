/**
 * Payment Utility Functions
 *
 * Common utility functions for payment processing,
 * currency handling, region determination, etc.
 */

/**
 * Get available payment processors for a region
 * @param {string} region - Region code
 * @returns {Object} - Available processors with details
 */
export function getAvailableProcessorsForRegion(region) {
  const processorRegionMap = {
    stripe: ['global', 'us', 'eu', 'uk', 'ca', 'au', 'nz', 'sg', 'jp', 'hk', 'asia'],
    square: ['global', 'us', 'ca', 'jp', 'uk', 'au'],
    adyen: ['global', 'eu', 'uk', 'asia', 'au', 'br', 'ca', 'us'],
    mpesa: ['global', 'kenya', 'tanzania', 'ghana', 'drc', 'mozambique', 'egypt', 'lesotho', 'africa'],
    razorpay: ['global', 'india', 'asia'],
    paypal: ['global', 'us', 'eu', 'uk', 'ca', 'au', 'br', 'jp', 'mx', 'sg', 'hk'],
    telr: ['global', 'uae', 'ae', 'sa', 'saudi', 'ksa', 'qatar', 'qa', 'me', 'middleeast', 'bh', 'bahrain', 'om', 'oman', 'kw', 'kuwait', 'jo', 'jordan', 'eg', 'egypt']
  };

  const allProcessors = {
    stripe: {
      name: 'Stripe',
      methods: ['card', 'apple', 'google', 'bank'],
      description: 'Global payment processor for online businesses'
    },
    square: {
      name: 'Square',
      methods: ['card', 'apple', 'google'],
      description: 'Integrated payment solution for businesses'
    },
    adyen: {
      name: 'Adyen',
      methods: ['card', 'bank', 'local', 'apple', 'google'],
      description: 'Global payment platform supporting multiple payment methods'
    },
    mpesa: {
      name: 'M-Pesa',
      methods: ['mobile'],
      description: 'Mobile money transfer service popular in Africa'
    },
    razorpay: {
      name: 'Razorpay',
      methods: ['card', 'bank', 'upi', 'wallet'],
      description: 'India\'s popular payment gateway'
    },
    paypal: {
      name: 'PayPal',
      methods: ['paypal', 'card', 'bank'],
      description: 'Global online payment system supporting transactions and digital wallets'
    },
    telr: {
      name: 'Telr',
      methods: ['card', 'apple', 'samsung', 'mada', 'local'],
      description: 'Middle East payment gateway specializing in UAE, Saudi Arabia, and Qatar'
    }
  };

  // Filter processors based on region availability
  const available = {};

  // Normalize region
  const normalizedRegion = normalizeRegion(region);

  Object.entries(processorRegionMap).forEach(([processor, regions]) => {
    const isAvailable = regions.includes(normalizedRegion) || regions.includes('global');
    if (isAvailable) {
      available[processor] = {
        ...allProcessors[processor],
        available: true
      };
    }
  });

  return available;
}

/**
 * Get appropriate currency for a region
 * @param {string} region - Region code
 * @returns {string} - Currency code
 */
export function getCurrencyForRegion(region) {
  const regionCurrencyMap = {
    us: 'USD',
    ca: 'CAD',
    eu: 'EUR',
    uk: 'GBP',
    au: 'AUD',
    nz: 'NZD',
    jp: 'JPY',
    sg: 'SGD',
    hk: 'HKD',
    kenya: 'KES',
    tanzania: 'TZS',
    uganda: 'UGX',
    ghana: 'GHS',
    nigeria: 'NGN',
    southafrica: 'ZAR',
    india: 'INR',
    russia: 'RUB',
    china: 'CNY',
    brazil: 'BRL',
    mexico: 'MXN',
    indonesia: 'IDR',
    malaysia: 'MYR',
    philippines: 'PHP',
    thailand: 'THB',
    vietnam: 'VND',
    africa: 'USD',
    asia: 'USD',
    global: 'USD',
    // Middle East regions
    uae: 'AED',
    ae: 'AED',
    saudi: 'SAR',
    sa: 'SAR',
    ksa: 'SAR',
    qatar: 'QAR',
    qa: 'QAR',
    bahrain: 'BHD',
    bh: 'BHD',
    oman: 'OMR',
    om: 'OMR',
    kuwait: 'KWD',
    kw: 'KWD',
    jordan: 'JOD',
    jo: 'JOD',
    egypt: 'EGP',
    eg: 'EGP',
    me: 'AED', // Default Middle East to AED (UAE Dirham)
    middleeast: 'AED'
  };

  const normalizedRegion = normalizeRegion(region);
  return regionCurrencyMap[normalizedRegion] || 'USD';
}

/**
 * Format currency amount based on region and locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  try {
    // Map of currencies to locales for better formatting
    const currencyLocaleMap = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      JPY: 'ja-JP',
      AUD: 'en-AU',
      CAD: 'en-CA',
      KES: 'en-KE',
      INR: 'en-IN',
      NGN: 'en-NG',
      ZAR: 'en-ZA',
      BRL: 'pt-BR',
      RUB: 'ru-RU',
      CNY: 'zh-CN',
      // Add Middle East currencies
      AED: 'ar-AE',
      SAR: 'ar-SA',
      QAR: 'ar-QA',
      BHD: 'ar-BH',
      OMR: 'ar-OM',
      KWD: 'ar-KW',
      JOD: 'ar-JO',
      EGP: 'ar-EG'
    };

    // Use currency-specific locale if available
    const formattingLocale = currencyLocaleMap[currency] || locale;

    return new Intl.NumberFormat(formattingLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Normalize the region code to a standard format
 * @param {string} region - Region code
 * @returns {string} - Normalized region code
 */
export function normalizeRegion(region) {
  if (!region) return 'global';

  // Convert to lowercase
  const lowercased = region.toLowerCase();

  // Map country codes to regions
  const countryToRegionMap = {
    us: 'us',
    usa: 'us',
    unitedstates: 'us',
    ca: 'ca',
    canada: 'ca',
    gb: 'uk',
    uk: 'uk',
    unitedkingdom: 'uk',
    de: 'eu',
    fr: 'eu',
    it: 'eu',
    es: 'eu',
    nl: 'eu',
    be: 'eu',
    pt: 'eu',
    at: 'eu',
    fi: 'eu',
    se: 'eu',
    dk: 'eu',
    ie: 'eu',
    pl: 'eu',
    cz: 'eu',
    gr: 'eu',
    hu: 'eu',
    ro: 'eu',
    jp: 'jp',
    japan: 'jp',
    cn: 'china',
    china: 'china',
    in: 'india',
    india: 'india',
    au: 'au',
    australia: 'au',
    nz: 'nz',
    newzealand: 'nz',
    br: 'brazil',
    brazil: 'brazil',
    mx: 'mexico',
    mexico: 'mexico',
    za: 'southafrica',
    southafrica: 'southafrica',
    ng: 'nigeria',
    nigeria: 'nigeria',
    ke: 'kenya',
    kenya: 'kenya',
    tz: 'tanzania',
    tanzania: 'tanzania',
    gh: 'ghana',
    ghana: 'ghana',
    sg: 'sg',
    singapore: 'sg',
    hk: 'hk',
    hongkong: 'hk',
    // Add Middle East countries
    ae: 'uae',
    uae: 'uae',
    unitedarabemirates: 'uae',
    sa: 'saudi',
    ksa: 'saudi',
    saudi: 'saudi',
    saudiarabia: 'saudi',
    qa: 'qatar',
    qatar: 'qatar',
    bh: 'bahrain',
    bahrain: 'bahrain',
    kw: 'kuwait',
    kuwait: 'kuwait',
    om: 'oman',
    oman: 'oman',
    jo: 'jordan',
    jordan: 'jordan',
    eg: 'egypt',
    egypt: 'egypt'
  };

  // Return mapped region or the original if no mapping exists
  return countryToRegionMap[lowercased] || lowercased;
}

/**
 * Get region from IP address
 * @param {string} ipAddress - IP address
 * @returns {Promise<string>} - Region code
 */
export async function getRegionFromIP(ipAddress) {
  try {
    // Make API call to IP geolocation service
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'IP lookup failed');
    }

    // Return country code
    return normalizeRegion(data.country_code);
  } catch (error) {
    console.error('Error determining region from IP:', error);
    return 'global';
  }
}

/**
 * Validate a payment amount
 * @param {number} amount - Amount to validate
 * @param {string} currency - Currency code
 * @returns {Object} - Validation result
 */
export function validatePaymentAmount(amount, currency = 'USD') {
  // Minimum amounts for different currencies (in smallest units)
  const minimumAmounts = {
    USD: 0.5,
    EUR: 0.5,
    GBP: 0.3,
    JPY: 50,
    INR: 1,
    KES: 5
  };

  const minimum = minimumAmounts[currency] || 0.5;

  if (amount < minimum) {
    return {
      valid: false,
      message: `Amount must be at least ${formatCurrency(minimum, currency)}`
    };
  }

  return { valid: true };
}

/**
 * Check if a payment method type is valid for a processor
 * @param {string} processor - Processor name
 * @param {string} methodType - Payment method type
 * @returns {boolean} - Whether the method is valid
 */
export function isValidPaymentMethodForProcessor(processor, methodType) {
  const processorMethods = {
    stripe: ['card', 'bank', 'apple', 'google'],
    square: ['card', 'apple', 'google'],
    adyen: ['card', 'bank', 'apple', 'google', 'local'],
    mpesa: ['mobile'],
    razorpay: ['card', 'bank', 'upi', 'wallet'],
    paypal: ['paypal', 'card', 'bank']
  };

  return processorMethods[processor]?.includes(methodType) || false;
}

/**
 * Get error message for payment errors
 * @param {Object} error - Error object
 * @param {string} processor - Processor name
 * @returns {string} - User-friendly error message
 */
export function getPaymentErrorMessage(error, processor) {
  // Generic error messages
  const genericErrors = {
    card_declined: 'Your card was declined. Please try another payment method.',
    expired_card: 'Your card has expired. Please try another card.',
    incorrect_cvc: 'The security code (CVC) is incorrect. Please check and try again.',
    processing_error: 'An error occurred while processing your payment. Please try again.',
    insufficient_funds: 'Insufficient funds. Please try another payment method.',
    invalid_expiry: 'The expiration date is invalid. Please check and try again.',
    invalid_number: 'The card number is invalid. Please check and try again.',
    incorrect_zip: 'The postal code is incorrect. Please check and try again.',
    authentication_required: 'Authentication required. Please complete the verification process.'
  };

  // Get error code from different processor error formats
  let errorCode;
  if (error.processorError) {
    if (processor === 'stripe') {
      errorCode = error.processorError.code;
    } else if (processor === 'square') {
      errorCode = error.processorError.category;
    } else if (processor === 'adyen') {
      errorCode = error.processorError.resultCode;
    } else if (processor === 'mpesa') {
      errorCode = error.processorError.errorCode?.toString();
    } else if (processor === 'razorpay') {
      errorCode = error.processorError.error?.code;
    } else if (processor === 'paypal') {
      errorCode = error.processorError.code;
    }
  }

  // Use generic message if available, otherwise use the original error message
  return genericErrors[errorCode] || error.message || 'An error occurred during payment processing';
}

/**
 * Generate an invoice/receipt number
 * @param {string} prefix - Prefix for the invoice number
 * @returns {string} - Invoice number
 */
export function generateInvoiceNumber(prefix = 'INV') {
  const timestamp = new Date().getTime().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp.slice(-8)}-${random}`;
}

// Exchange rates cache
// Store exchange rates with timestamp to avoid excessive API calls
// Format: { 'USD_EUR': { rate: 0.85, timestamp: Date } }
const exchangeRatesCache = {};

/**
 * Cache TTL in milliseconds (4 hours)
 */
const CACHE_TTL = 4 * 60 * 60 * 1000;

/**
 * Get the exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency) => {
  // If same currency, rate is 1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Check cache first
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cachedRate = exchangeRatesCache[cacheKey];

  if (cachedRate && (Date.now() - cachedRate.timestamp) < CACHE_TTL) {
    return cachedRate.rate;
  }

  try {
    // In a real implementation, you would call an exchange rate API here
    // For this example, we'll use a simplified approach with hardcoded rates

    // Dummy exchange rates relative to USD
    const usdRates = {
      'USD': 1,
      'EUR': 0.85,
      'GBP': 0.75,
      'JPY': 110,
      'AUD': 1.35,
      'CAD': 1.25,
      'CHF': 0.92,
      'CNY': 6.45,
      'HKD': 7.78,
      'NZD': 1.45,
      'AED': 3.67,
      'SAR': 3.75,
      'QAR': 3.64,
      'KWD': 0.30,
      'BHD': 0.38,
      'OMR': 0.38,
      'INR': 73.5,
      'IDR': 14300,
      'MYR': 4.15,
      'PHP': 50.2,
      'SGD': 1.35,
      'THB': 33.2,
      'ZAR': 15.0,
      'NGN': 410,
      'KES': 110
    };

    // Calculate the exchange rate
    let rate;

    if (fromCurrency === 'USD') {
      // Direct conversion from USD
      rate = usdRates[toCurrency] || 1;
    } else if (toCurrency === 'USD') {
      // Direct conversion to USD
      rate = 1 / (usdRates[fromCurrency] || 1);
    } else {
      // Cross conversion through USD
      const fromToUsd = 1 / (usdRates[fromCurrency] || 1);
      const usdToTarget = usdRates[toCurrency] || 1;
      rate = fromToUsd * usdToTarget;
    }

    // Cache the result
    exchangeRatesCache[cacheKey] = {
      rate,
      timestamp: Date.now()
    };

    return rate;
  } catch (error) {
    console.error(`Error getting exchange rate from ${fromCurrency} to ${toCurrency}:`, error);
    // Fallback: return 1 as exchange rate
    return 1;
  }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  } catch (error) {
    console.error(`Error converting ${amount} ${fromCurrency} to ${toCurrency}:`, error);
    // Fallback: return the original amount
    return amount;
  }
};

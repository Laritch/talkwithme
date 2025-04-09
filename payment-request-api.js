/**
 * Payment Request API Implementation
 *
 * Provides a seamless checkout experience using the browser's built-in
 * PaymentRequest API, which provides a native UI for collecting payment
 * and shipping information.
 */

class PaymentRequestHandler {
  /**
   * Initialize the Payment Request API handler
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      supportedPaymentMethods: [],
      supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
      requestShipping: false,
      requestPayerEmail: true,
      requestPayerName: true,
      requestPayerPhone: false,
      shippingOptions: [],
      merchantName: 'Expert Chat',
      countryCode: 'US',
      currencyCode: 'USD',
      onPaymentStarted: null,
      onPaymentAuthorized: null,
      onShippingOptionChange: null,
      onShippingAddressChange: null,
      onPaymentError: null,
      ...options
    };

    // Check if Payment Request API is supported
    this.isSupported = Boolean(window.PaymentRequest);

    if (!this.isSupported) {
      console.warn('Payment Request API is not supported in this browser.');
    }

    // Configure default payment methods if none provided
    if (!this.options.supportedPaymentMethods.length) {
      this.options.supportedPaymentMethods = this._getDefaultPaymentMethods();
    }
  }

  /**
   * Get default supported payment methods
   * @private
   * @returns {Array} - Array of payment method objects
   */
  _getDefaultPaymentMethods() {
    const methods = [];

    // Basic card method
    methods.push({
      supportedMethods: 'basic-card',
      data: {
        supportedNetworks: this.options.supportedNetworks,
        supportedTypes: ['credit', 'debit', 'prepaid']
      }
    });

    // Add Google Pay if available
    if (window.PaymentRequest && this.options.stripePublishableKey) {
      methods.push({
        supportedMethods: 'https://google.com/pay',
        data: {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                'gateway': 'stripe',
                'stripe:version': '2020-08-27',
                'stripe:publishableKey': this.options.stripePublishableKey
              }
            }
          }],
          merchantInfo: {
            merchantName: this.options.merchantName
          }
        }
      });
    }

    return methods;
  }

  /**
   * Create a new payment request
   * @param {Object} details - Payment details
   * @returns {Object} - Payment request object
   */
  createPaymentRequest(details) {
    if (!this.isSupported) {
      throw new Error('Payment Request API is not supported in this browser.');
    }

    const {
      items,
      total,
      shippingOptions
    } = details;

    // Validate required fields
    if (!total || typeof total !== 'number' || total <= 0) {
      throw new Error('Valid total amount is required.');
    }

    // Format display items from items
    const displayItems = (items || []).map(item => ({
      label: item.name,
      amount: {
        currency: this.options.currencyCode,
        value: item.price.toFixed(2)
      }
    }));

    // Create payment details
    const paymentDetails = {
      total: {
        label: 'Total',
        amount: {
          currency: this.options.currencyCode,
          value: total.toFixed(2)
        }
      },
      displayItems
    };

    // Add shipping options if provided
    if (this.options.requestShipping && (shippingOptions || this.options.shippingOptions.length)) {
      paymentDetails.shippingOptions = shippingOptions || this.options.shippingOptions;

      // Set the first shipping option as selected by default
      if (paymentDetails.shippingOptions && paymentDetails.shippingOptions.length) {
        paymentDetails.shippingOptions[0].selected = true;
      }
    }

    // Create payment options
    const paymentOptions = {
      requestShipping: this.options.requestShipping,
      requestPayerEmail: this.options.requestPayerEmail,
      requestPayerName: this.options.requestPayerName,
      requestPayerPhone: this.options.requestPayerPhone,
      shippingType: 'shipping'
    };

    // Create payment request
    try {
      const request = new PaymentRequest(
        this.options.supportedPaymentMethods,
        paymentDetails,
        paymentOptions
      );

      // Set up event listeners for shipping changes if shipping is requested
      if (this.options.requestShipping) {
        request.addEventListener('shippingaddresschange', event => {
          this._handleShippingAddressChange(event, request);
        });

        request.addEventListener('shippingoptionchange', event => {
          this._handleShippingOptionChange(event, request);
        });
      }

      return request;
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  }

  /**
   * Show the payment UI and process payment
   * @param {Object} details - Payment details
   * @returns {Promise<Object>} - Payment result
   */
  async showPaymentUI(details) {
    try {
      if (!this.isSupported) {
        throw new Error('Payment Request API is not supported in this browser.');
      }

      // Create payment request
      const request = this.createPaymentRequest(details);

      // Check if the payment method is supported
      const canMakePayment = await request.canMakePayment();
      if (!canMakePayment) {
        throw new Error('The selected payment method is not available.');
      }

      // Notify payment started
      if (typeof this.options.onPaymentStarted === 'function') {
        this.options.onPaymentStarted();
      }

      // Show payment UI
      const response = await request.show();

      // Extract payment details
      const paymentData = {
        methodName: response.methodName,
        details: response.details,
        shippingAddress: response.shippingAddress,
        shippingOption: response.shippingOption,
        payerName: response.payerName,
        payerEmail: response.payerEmail,
        payerPhone: response.payerPhone,
        // Include the original payment response for advanced processing
        _originalResponse: response
      };

      // Notify payment authorized
      if (typeof this.options.onPaymentAuthorized === 'function') {
        await this.options.onPaymentAuthorized(paymentData);
      }

      // Complete the payment
      response.complete('success');

      return paymentData;
    } catch (error) {
      console.error('Payment request error:', error);

      // Notify payment error
      if (typeof this.options.onPaymentError === 'function') {
        this.options.onPaymentError(error);
      }

      throw error;
    }
  }

  /**
   * Handle shipping address changes
   * @private
   * @param {Event} event - Shipping address change event
   * @param {PaymentRequest} request - Payment request object
   */
  _handleShippingAddressChange(event, request) {
    if (typeof this.options.onShippingAddressChange === 'function') {
      event.updateWith(
        this.options.onShippingAddressChange(request.shippingAddress)
          .then(details => details)
          .catch(error => {
            console.error('Error updating shipping address:', error);
            throw error;
          })
      );
    } else {
      // If no handler is provided, just continue with the same details
      event.updateWith(request.paymentDetails);
    }
  }

  /**
   * Handle shipping option changes
   * @private
   * @param {Event} event - Shipping option change event
   * @param {PaymentRequest} request - Payment request object
   */
  _handleShippingOptionChange(event, request) {
    if (typeof this.options.onShippingOptionChange === 'function') {
      event.updateWith(
        this.options.onShippingOptionChange(request.shippingOption)
          .then(details => details)
          .catch(error => {
            console.error('Error updating shipping option:', error);
            throw error;
          })
      );
    } else {
      // If no handler is provided, just continue with the same details
      event.updateWith(request.paymentDetails);
    }
  }

  /**
   * Check if Payment Request API is supported
   * @returns {boolean} - True if supported, false otherwise
   */
  canUsePaymentRequest() {
    return this.isSupported;
  }

  /**
   * Check if a specific payment method is supported
   * @param {string} methodName - Payment method name to check
   * @returns {Promise<boolean>} - True if supported, false otherwise
   */
  async isPaymentMethodSupported(methodName) {
    if (!this.isSupported) {
      return false;
    }

    // Create a minimal payment request to check support
    try {
      const supportedMethods = [];

      if (methodName === 'basic-card') {
        supportedMethods.push({
          supportedMethods: 'basic-card',
          data: {
            supportedNetworks: this.options.supportedNetworks
          }
        });
      } else if (methodName === 'google-pay') {
        supportedMethods.push({
          supportedMethods: 'https://google.com/pay',
          data: {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['VISA', 'MASTERCARD']
              }
            }]
          }
        });
      } else {
        supportedMethods.push({
          supportedMethods: methodName
        });
      }

      const request = new PaymentRequest(
        supportedMethods,
        {
          total: {
            label: 'Test',
            amount: { currency: this.options.currencyCode, value: '1.00' }
          }
        },
        {}
      );

      return await request.canMakePayment();
    } catch (error) {
      console.error(`Error checking support for ${methodName}:`, error);
      return false;
    }
  }
}

// Expose to window
window.PaymentRequestHandler = PaymentRequestHandler;

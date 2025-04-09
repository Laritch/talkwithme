/**
 * Mobile Wallets Integration
 *
 * Provides Apple Pay and Google Pay integration for faster mobile checkout
 */

class MobileWallets {
  /**
   * Initialize mobile wallet integrations
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      stripePublicKey: null,
      merchantId: null, // For Apple Pay
      merchantName: 'Expert Chat',
      country: 'US',
      currency: 'USD',
      debug: false,
      onApplePayReady: null,
      onGooglePayReady: null,
      onPaymentAuthorized: null,
      onPaymentError: null,
      ...options
    };

    this.stripe = null;
    this.googlePayClient = null;
    this.applePaySession = null;
    this.isApplePayAvailable = false;
    this.isGooglePayAvailable = false;

    this.init();
  }

  /**
   * Initialize payment wallets
   */
  async init() {
    if (!this.options.stripePublicKey) {
      this.log('Stripe public key is required for mobile wallet integration');
      return;
    }

    // Initialize Stripe
    this.stripe = Stripe(this.options.stripePublicKey);

    // Check for Apple Pay and Google Pay availability
    await this.checkApplePayAvailability();
    await this.checkGooglePayAvailability();
  }

  /**
   * Check if Apple Pay is available on this device
   */
  async checkApplePayAvailability() {
    if (!window.ApplePaySession) {
      this.log('Apple Pay is not available on this device');
      return;
    }

    this.isApplePayAvailable = await this.stripe.applePayDomainAssociation
      ? ApplePaySession.canMakePaymentsWithActiveCard(this.options.merchantId)
      : ApplePaySession.canMakePayments();

    this.log(`Apple Pay available: ${this.isApplePayAvailable}`);

    if (this.isApplePayAvailable && typeof this.options.onApplePayReady === 'function') {
      this.options.onApplePayReady();
    }
  }

  /**
   * Check if Google Pay is available on this device
   */
  async checkGooglePayAvailability() {
    if (!window.google || !window.google.payments || !window.google.payments.api) {
      this.log('Google Pay is not available on this device');
      return;
    }

    try {
      // Initialize Google Pay API
      this.googlePayClient = new google.payments.api.PaymentsClient({
        environment: this.options.debug ? 'TEST' : 'PRODUCTION'
      });

      // Check if Google Pay is available to the user
      const isReadyToPay = await this.googlePayClient.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: this.getGooglePayPaymentMethods()
      });

      this.isGooglePayAvailable = isReadyToPay.result;
      this.log(`Google Pay available: ${this.isGooglePayAvailable}`);

      if (this.isGooglePayAvailable && typeof this.options.onGooglePayReady === 'function') {
        this.options.onGooglePayReady();
      }
    } catch (error) {
      this.log('Error checking Google Pay availability:', error);
      this.isGooglePayAvailable = false;
    }
  }

  /**
   * Get Google Pay payment methods configuration
   * @returns {Array} - Payment methods configuration
   * @private
   */
  getGooglePayPaymentMethods() {
    return [{
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'],
        billingAddressRequired: true,
        billingAddressParameters: {
          format: 'FULL',
          phoneNumberRequired: true
        }
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: 'stripe',
          'stripe:version': '2020-08-27',
          'stripe:publishableKey': this.options.stripePublicKey
        }
      }
    }];
  }

  /**
   * Initiate Apple Pay payment
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} - Payment result
   */
  async requestApplePayPayment(paymentDetails) {
    if (!this.isApplePayAvailable) {
      throw new Error('Apple Pay is not available');
    }

    const {
      amount,
      currency = this.options.currency,
      label = 'Total',
      items = [],
      requiredBillingFields = ['postalAddress', 'phone', 'email']
    } = paymentDetails;

    // Construct payment request
    const paymentRequest = {
      countryCode: this.options.country,
      currencyCode: currency.toUpperCase(),
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      total: {
        label: this.options.merchantName,
        amount: amount.toFixed(2)
      },
      lineItems: items.map(item => ({
        label: item.name,
        amount: (item.price * (item.quantity || 1)).toFixed(2)
      }))
    };

    // Add billing contact request if needed
    if (requiredBillingFields && requiredBillingFields.length > 0) {
      paymentRequest.requiredBillingContactFields = requiredBillingFields;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create and start Apple Pay session
        const session = new ApplePaySession(3, paymentRequest);

        // Handle authorization
        session.onpaymentauthorized = (event) => {
          this.stripe.createPaymentMethod({
            type: 'card',
            card: {
              applepay: event.payment.token
            },
            billing_details: this.extractBillingDetails(event.payment.billingContact)
          }).then(({ paymentMethod, error }) => {
            if (error) {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
              reject(error);

              if (typeof this.options.onPaymentError === 'function') {
                this.options.onPaymentError(error);
              }
            } else {
              session.completePayment(ApplePaySession.STATUS_SUCCESS);

              const result = {
                token: paymentMethod.id,
                billingDetails: this.extractBillingDetails(event.payment.billingContact)
              };

              resolve(result);

              if (typeof this.options.onPaymentAuthorized === 'function') {
                this.options.onPaymentAuthorized(result);
              }
            }
          });
        };

        // Handle validation errors
        session.onerror = (event) => {
          this.log('Apple Pay error:', event);
          reject(new Error('Apple Pay session error'));

          if (typeof this.options.onPaymentError === 'function') {
            this.options.onPaymentError(new Error('Apple Pay session error'));
          }
        };

        // Start the session
        session.begin();
        this.applePaySession = session;
      } catch (error) {
        this.log('Apple Pay request error:', error);
        reject(error);

        if (typeof this.options.onPaymentError === 'function') {
          this.options.onPaymentError(error);
        }
      }
    });
  }

  /**
   * Initiate Google Pay payment
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} - Payment result
   */
  async requestGooglePayPayment(paymentDetails) {
    if (!this.isGooglePayAvailable || !this.googlePayClient) {
      throw new Error('Google Pay is not available');
    }

    const {
      amount,
      currency = this.options.currency,
      transactionInfo = {}
    } = paymentDetails;

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: this.getGooglePayPaymentMethods(),
      merchantInfo: {
        merchantId: this.options.merchantId,
        merchantName: this.options.merchantName
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount.toFixed(2),
        currencyCode: currency.toUpperCase(),
        countryCode: this.options.country,
        ...transactionInfo
      },
      emailRequired: true,
      shippingAddressRequired: false
    };

    try {
      const paymentData = await this.googlePayClient.loadPaymentData(paymentDataRequest);
      const paymentToken = paymentData.paymentMethodData.tokenizationData.token;

      // Parse the token string into JSON
      const tokenData = JSON.parse(paymentToken);

      // Stripe requires the id field from the token
      const result = {
        token: tokenData.id,
        billingDetails: {
          email: paymentData.email,
          name: [
            paymentData.paymentMethodData.info?.billingAddress?.name,
            paymentData.paymentMethodData.info?.cardDetails
          ].filter(Boolean).join(' - ')
        }
      };

      if (typeof this.options.onPaymentAuthorized === 'function') {
        this.options.onPaymentAuthorized(result);
      }

      return result;
    } catch (error) {
      this.log('Google Pay request error:', error);

      if (typeof this.options.onPaymentError === 'function') {
        this.options.onPaymentError(error);
      }

      throw error;
    }
  }

  /**
   * Helper to extract billing details from Apple Pay contact
   * @param {Object} contact - Apple Pay contact
   * @returns {Object} - Billing details
   * @private
   */
  extractBillingDetails(contact) {
    if (!contact) return {};

    const billingDetails = {
      name: contact.givenName && contact.familyName ? `${contact.givenName} ${contact.familyName}` : undefined,
      email: contact.emailAddress,
      phone: contact.phoneNumber
    };

    if (contact.postalAddress) {
      billingDetails.address = {
        line1: contact.postalAddress.street,
        city: contact.postalAddress.city,
        state: contact.postalAddress.state,
        postalCode: contact.postalAddress.postalCode,
        country: contact.postalAddress.country
      };
    }

    return billingDetails;
  }

  /**
   * Check if Apple Pay is available
   * @returns {boolean} - Availability status
   */
  isApplePaySupported() {
    return this.isApplePayAvailable;
  }

  /**
   * Check if Google Pay is available
   * @returns {boolean} - Availability status
   */
  isGooglePaySupported() {
    return this.isGooglePayAvailable;
  }

  /**
   * Create a button for Apple Pay
   * @param {string} containerId - Container element ID
   * @param {Object} options - Button options
   * @returns {HTMLElement} - The created button
   */
  createApplePayButton(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const defaults = {
      buttonType: 'plain', // plain, buy, donate, etc.
      buttonColor: 'black', // black, white, white-outline
      onClick: null
    };

    const buttonOptions = { ...defaults, ...options };

    // Create the Apple Pay button
    const button = document.createElement('apple-pay-button');
    button.setAttribute('buttonstyle', buttonOptions.buttonColor);
    button.setAttribute('type', buttonOptions.buttonType);
    button.setAttribute('locale', 'en');

    // Style the button
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.height = '40px';
    button.style.borderRadius = '4px';

    // Add click handler
    button.addEventListener('click', (event) => {
      if (typeof buttonOptions.onClick === 'function') {
        buttonOptions.onClick(event);
      }
    });

    // Add to container
    container.appendChild(button);
    return button;
  }

  /**
   * Create a button for Google Pay
   * @param {string} containerId - Container element ID
   * @param {Object} options - Button options
   * @returns {HTMLElement} - The created button
   */
  createGooglePayButton(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !this.googlePayClient) return null;

    const defaults = {
      buttonColor: 'black', // black, white
      buttonType: 'pay', // pay, buy, checkout, etc.
      onClick: null
    };

    const buttonOptions = { ...defaults, ...options };

    // Create the Google Pay button
    const button = this.googlePayClient.createButton({
      onClick: (event) => {
        if (typeof buttonOptions.onClick === 'function') {
          buttonOptions.onClick(event);
        }
      },
      buttonColor: buttonOptions.buttonColor,
      buttonType: buttonOptions.buttonType,
      buttonSizeMode: 'fill',
      allowedPaymentMethods: this.getGooglePayPaymentMethods()
    });

    // Add to container
    container.appendChild(button);
    return button;
  }

  /**
   * Log messages in debug mode
   * @private
   */
  log(...args) {
    if (this.options.debug) {
      console.log('[MobileWallets]', ...args);
    }
  }
}

// Expose to window
window.MobileWallets = MobileWallets;

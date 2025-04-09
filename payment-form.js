/**
 * Payment Form Component
 *
 * A reusable component for handling payments with loyalty program integration.
 * Supports credit card payments through Stripe, PayPal, and other payment methods.
 */

class PaymentForm {
  /**
   * Initialize the payment form
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      formSelector: '#payment-form',
      amountSelector: '#payment-amount',
      submitButtonSelector: '#payment-submit',
      paymentMethodsSelector: '.payment-method',
      loyaltyPointsSelector: '#use-loyalty-points',
      loyaltyPointsAmountSelector: '#loyalty-points-amount',
      loyaltyTierDiscountSelector: '#apply-tier-discount',
      resultSelector: '#payment-result',
      stripe: null,
      orderId: null,
      paymentType: 'product',
      expertId: null,
      onSuccess: null,
      onError: null,
      ...options
    };

    this.form = document.querySelector(this.options.formSelector);
    if (!this.form) {
      console.error('Payment form not found!');
      return;
    }

    this.amount = parseFloat(document.querySelector(this.options.amountSelector)?.value || 0);
    this.selectedMethod = 'credit_card';
    this.cardElement = null;
    this.loyaltyInfo = null;
    this.pointsToRedeem = 0;
    this.applyTierDiscount = false;

    this.init();
  }

  /**
   * Initialize the payment form and event listeners
   */
  init() {
    // Initialize Stripe if available
    if (this.options.stripe) {
      const elements = this.options.stripe.elements();
      this.cardElement = elements.create('card');
      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        this.cardElement.mount('#card-element');
        this.cardElement.on('change', this.handleCardChange.bind(this));
      }
    }

    // Set up payment method selection
    const paymentMethods = document.querySelectorAll(this.options.paymentMethodsSelector);
    paymentMethods.forEach(method => {
      method.addEventListener('click', (e) => this.selectPaymentMethod(e));
    });

    // Set up loyalty points toggle
    const loyaltyPointsCheckbox = document.querySelector(this.options.loyaltyPointsSelector);
    if (loyaltyPointsCheckbox) {
      loyaltyPointsCheckbox.addEventListener('change', (e) => this.toggleLoyaltyPoints(e));
    }

    // Set up loyalty tier discount toggle
    const loyaltyTierDiscountCheckbox = document.querySelector(this.options.loyaltyTierDiscountSelector);
    if (loyaltyTierDiscountCheckbox) {
      loyaltyTierDiscountCheckbox.addEventListener('change', (e) => this.toggleTierDiscount(e));
    }

    // Set up form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // Fetch loyalty information if user is logged in
    this.fetchLoyaltyInfo();
  }

  /**
   * Handle changes to the card element
   * @param {Object} event - Change event
   */
  handleCardChange(event) {
    const displayError = document.getElementById('card-errors');
    if (displayError) {
      displayError.textContent = event.error ? event.error.message : '';
    }
  }

  /**
   * Select payment method
   * @param {Event} event - Click event
   */
  selectPaymentMethod(event) {
    const selectedElement = event.currentTarget;
    const method = selectedElement.dataset.method;

    if (!method) return;

    // Update UI
    document.querySelectorAll(this.options.paymentMethodsSelector).forEach(el => {
      el.classList.remove('selected');
    });
    selectedElement.classList.add('selected');

    // Show/hide payment method specific fields
    document.querySelectorAll('.payment-method-fields').forEach(el => {
      el.style.display = 'none';
    });
    const methodFields = document.getElementById(`${method}-fields`);
    if (methodFields) {
      methodFields.style.display = 'block';
    }

    this.selectedMethod = method;
  }

  /**
   * Toggle loyalty points redemption
   * @param {Event} event - Change event
   */
  toggleLoyaltyPoints(event) {
    const checked = event.target.checked;
    const pointsInput = document.querySelector(this.options.loyaltyPointsAmountSelector);

    if (pointsInput) {
      pointsInput.disabled = !checked;

      if (checked && this.loyaltyInfo) {
        // Default to maximum available points or max allowed for purchase
        const maxPointsForPurchase = Math.floor(this.amount * 50); // 50 points per $ maximum
        const maxPoints = Math.min(this.loyaltyInfo.points, maxPointsForPurchase);
        pointsInput.value = maxPoints;
        this.pointsToRedeem = maxPoints;
        this.updateSummary();
      } else {
        this.pointsToRedeem = 0;
        this.updateSummary();
      }
    }
  }

  /**
   * Toggle loyalty tier discount
   * @param {Event} event - Change event
   */
  toggleTierDiscount(event) {
    this.applyTierDiscount = event.target.checked;
    this.updateSummary();
  }

  /**
   * Fetch user's loyalty information
   */
  async fetchLoyaltyInfo() {
    try {
      const token = this.getAuthToken();
      if (!token) return;

      const response = await fetch('/api/payments/loyalty/rewards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.loyaltyInfo = {
            points: data.points,
            tier: data.tier,
            rewards: data.rewards
          };

          this.updateLoyaltyUI();
        }
      }
    } catch (error) {
      console.error('Error fetching loyalty info:', error);
    }
  }

  /**
   * Update loyalty-related UI elements
   */
  updateLoyaltyUI() {
    if (!this.loyaltyInfo) return;

    // Update available points display
    const pointsDisplay = document.getElementById('available-points');
    if (pointsDisplay) {
      pointsDisplay.textContent = this.loyaltyInfo.points;
    }

    // Update tier display
    const tierDisplay = document.getElementById('loyalty-tier');
    if (tierDisplay) {
      tierDisplay.textContent = this.loyaltyInfo.tier.charAt(0).toUpperCase() + this.loyaltyInfo.tier.slice(1);
    }

    // Enable/disable loyalty points checkbox
    const loyaltyPointsCheckbox = document.querySelector(this.options.loyaltyPointsSelector);
    if (loyaltyPointsCheckbox) {
      const hasEnoughPoints = this.loyaltyInfo.points >= 100; // Minimum points needed
      loyaltyPointsCheckbox.disabled = !hasEnoughPoints;

      if (!hasEnoughPoints) {
        loyaltyPointsCheckbox.checked = false;
        const pointsInput = document.querySelector(this.options.loyaltyPointsAmountSelector);
        if (pointsInput) {
          pointsInput.disabled = true;
          pointsInput.value = 0;
        }
      }
    }

    // Enable/disable tier discount checkbox
    const tierDiscountCheckbox = document.querySelector(this.options.loyaltyTierDiscountSelector);
    if (tierDiscountCheckbox) {
      // Only enable for silver tier and above
      const eligibleForDiscount = ['silver', 'gold', 'platinum'].includes(this.loyaltyInfo.tier);
      tierDiscountCheckbox.disabled = !eligibleForDiscount;

      if (!eligibleForDiscount) {
        tierDiscountCheckbox.checked = false;
      }
    }

    this.updateSummary();
  }

  /**
   * Update payment summary with loyalty benefits
   */
  updateSummary() {
    // Get original amount
    let finalAmount = this.amount;
    const summaryItems = [];

    // Add original amount to summary
    summaryItems.push({
      label: 'Original Amount',
      amount: finalAmount,
      type: 'original'
    });

    // Apply points redemption if selected
    if (this.pointsToRedeem > 0) {
      const pointsValue = this.pointsToRedeem / 100; // 100 points = $1
      finalAmount = Math.max(0, finalAmount - pointsValue);

      summaryItems.push({
        label: `Loyalty Points Redemption (${this.pointsToRedeem} points)`,
        amount: -pointsValue,
        type: 'points'
      });
    }

    // Apply tier discount if selected
    if (this.applyTierDiscount && this.loyaltyInfo) {
      let discountRate = 0;

      switch (this.loyaltyInfo.tier) {
        case 'platinum':
          discountRate = 0.10; // 10% discount
          break;
        case 'gold':
          discountRate = 0.07; // 7% discount
          break;
        case 'silver':
          discountRate = 0.05; // 5% discount
          break;
        case 'bronze':
          discountRate = 0.03; // 3% discount
          break;
      }

      if (discountRate > 0) {
        const discountAmount = finalAmount * discountRate;
        finalAmount -= discountAmount;

        summaryItems.push({
          label: `${this.loyaltyInfo.tier.charAt(0).toUpperCase() + this.loyaltyInfo.tier.slice(1)} Tier Discount (${discountRate * 100}%)`,
          amount: -discountAmount,
          type: 'discount'
        });
      }
    }

    // Add final amount to summary
    summaryItems.push({
      label: 'Final Amount',
      amount: finalAmount,
      type: 'final'
    });

    // Update summary UI
    const summaryContainer = document.getElementById('payment-summary');
    if (summaryContainer) {
      let html = '';

      summaryItems.forEach(item => {
        const amountFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Math.abs(item.amount));

        let className = '';
        switch (item.type) {
          case 'original':
            className = 'summary-original';
            break;
          case 'points':
          case 'discount':
            className = 'summary-discount';
            break;
          case 'final':
            className = 'summary-final';
            break;
        }

        html += `
          <div class="summary-row ${className}">
            <span>${item.label}</span>
            <span>${item.type === 'original' || item.type === 'final' ? amountFormatted : `-${amountFormatted}`}</span>
          </div>
        `;
      });

      summaryContainer.innerHTML = html;
    }

    // Update hidden amount input
    const amountInput = document.querySelector(this.options.amountSelector);
    if (amountInput) {
      amountInput.value = finalAmount.toFixed(2);
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    const submitButton = document.querySelector(this.options.submitButtonSelector);
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    const resultContainer = document.querySelector(this.options.resultSelector);
    if (resultContainer) {
      resultContainer.innerHTML = '';
      resultContainer.style.display = 'none';
    }

    try {
      const amount = parseFloat(document.querySelector(this.options.amountSelector).value);

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Process payment based on selected method
      switch (this.selectedMethod) {
        case 'credit_card':
          await this.processCardPayment(amount);
          break;
        case 'paypal':
          await this.processPayPalPayment(amount);
          break;
        case 'apple_pay':
          await this.processApplePayment(amount);
          break;
        case 'google_pay':
          await this.processGooglePayment(amount);
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      console.error('Payment error:', error);

      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            ${error.message || 'An error occurred during payment processing. Please try again.'}
          </div>
        `;
        resultContainer.style.display = 'block';
      }

      if (this.options.onError) {
        this.options.onError(error);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Pay Now';
      }
    }
  }

  /**
   * Process credit card payment
   * @param {number} amount - Payment amount
   */
  async processCardPayment(amount) {
    if (!this.options.stripe || !this.cardElement) {
      throw new Error('Stripe is not configured');
    }

    // Prepare payment data
    const paymentData = {
      amount,
      currency: 'usd',
      paymentMethod: 'credit_card',
      orderId: this.options.orderId,
      paymentType: this.options.paymentType,
      expertId: this.options.expertId,
      redeemPoints: this.pointsToRedeem,
      applyTierDiscount: this.applyTierDiscount
    };

    // Process payment with API
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment processing failed');
    }

    const paymentResult = await response.json();

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || 'Payment processing failed');
    }

    // If we have a client secret, confirm the payment with Stripe
    if (paymentResult.clientSecret) {
      const { error, paymentIntent } = await this.options.stripe.confirmCardPayment(
        paymentResult.clientSecret, {
          payment_method: {
            card: this.cardElement,
            billing_details: {
              name: document.getElementById('cardholder-name')?.value || '',
              email: document.getElementById('cardholder-email')?.value || ''
            }
          }
        }
      );

      if (error) {
        throw new Error(error.message || 'Card payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        await this.confirmPayment(paymentResult.transactionId, this.options.orderId, true);
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } else {
      // For non-Stripe payments that don't need client-side confirmation
      await this.confirmPayment(paymentResult.transactionId, this.options.orderId, true);
    }
  }

  /**
   * Process PayPal payment
   * @param {number} amount - Payment amount
   */
  async processPayPalPayment(amount) {
    // Prepare payment data
    const paymentData = {
      amount,
      currency: 'usd',
      paymentMethod: 'paypal',
      orderId: this.options.orderId,
      paymentType: this.options.paymentType,
      expertId: this.options.expertId,
      redeemPoints: this.pointsToRedeem,
      applyTierDiscount: this.applyTierDiscount
    };

    // Process payment with API
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment processing failed');
    }

    const paymentResult = await response.json();

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || 'Payment processing failed');
    }

    // For PayPal, redirect to approval URL
    if (paymentResult.approvalUrl) {
      window.location.href = paymentResult.approvalUrl;
    } else {
      throw new Error('PayPal approval URL not provided');
    }
  }

  /**
   * Process Apple Pay payment
   * @param {number} amount - Payment amount
   */
  async processApplePayment(amount) {
    // Check if Apple Pay is available
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      throw new Error('Apple Pay is not available on this device or browser');
    }

    // Implementation would depend on your Apple Pay integration
    throw new Error('Apple Pay integration not implemented');
  }

  /**
   * Process Google Pay payment
   * @param {number} amount - Payment amount
   */
  async processGooglePayment(amount) {
    // Implementation would depend on your Google Pay integration
    throw new Error('Google Pay integration not implemented');
  }

  /**
   * Confirm payment and process loyalty benefits
   * @param {string} transactionId - Transaction ID
   * @param {string} orderId - Order ID
   * @param {boolean} success - Whether payment succeeded
   */
  async confirmPayment(transactionId, orderId, success) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId,
          orderId,
          success
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment confirmation failed');
      }

      const confirmResult = await response.json();

      const resultContainer = document.querySelector(this.options.resultSelector);
      if (resultContainer) {
        if (confirmResult.success) {
          resultContainer.innerHTML = `
            <div class="alert alert-success">
              <i class="fas fa-check-circle"></i>
              Payment successful!
              ${confirmResult.loyalty ? `
                <p>You earned ${confirmResult.loyalty.pointsEarned} loyalty points.
                ${confirmResult.loyalty.tierUpgrade ? `<br>Congratulations! You've been upgraded to ${confirmResult.loyalty.currentTier} tier!` : ''}
                </p>
              ` : ''}
            </div>
          `;
        } else {
          resultContainer.innerHTML = `
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-circle"></i>
              Payment failed. Please try again.
            </div>
          `;
        }
        resultContainer.style.display = 'block';
      }

      if (confirmResult.success && this.options.onSuccess) {
        this.options.onSuccess(confirmResult);
      } else if (!confirmResult.success && this.options.onError) {
        this.options.onError(new Error('Payment failed'));
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      throw error;
    }
  }

  /**
   * Get the authentication token
   * @returns {string|null} - Auth token
   */
  getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentForm;
}

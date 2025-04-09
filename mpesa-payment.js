/**
 * M-Pesa Payment Component
 *
 * A reusable component for handling M-Pesa payments with status checking
 * and loyalty integration.
 */

class MpesaPayment {
  /**
   * Initialize the M-Pesa payment form
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      formSelector: '#mpesa-form',
      phoneSelector: '#mpesa-phone',
      amountSelector: '#payment-amount',
      submitButtonSelector: '#mpesa-submit',
      resultSelector: '#payment-result',
      statusCheckInterval: 5000, // 5 seconds
      maxStatusChecks: 12, // Check for up to 1 minute (12 * 5s)
      orderId: null,
      onSuccess: null,
      onError: null,
      onPending: null,
      ...options
    };

    this.form = document.querySelector(this.options.formSelector);
    if (!this.form) {
      console.error('M-Pesa form not found');
      return;
    }

    this.statusCheckCount = 0;
    this.statusCheckIntervalId = null;
    this.checkoutRequestId = null;

    this.init();
  }

  /**
   * Initialize the payment form
   */
  init() {
    // Set up form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // Format phone number input if exists
    const phoneInput = document.querySelector(this.options.phoneSelector);
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        // Allow only digits and plus sign
        e.target.value = e.target.value.replace(/[^\d+]/g, '');
      });
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    const phoneInput = document.querySelector(this.options.phoneSelector);
    const amountInput = document.querySelector(this.options.amountSelector);
    const submitButton = document.querySelector(this.options.submitButtonSelector);
    const resultContainer = document.querySelector(this.options.resultSelector);

    if (!phoneInput || !amountInput) {
      this.showError('Phone number and amount are required');
      return;
    }

    const phoneNumber = phoneInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!phoneNumber) {
      this.showError('Please enter your M-Pesa phone number');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      this.showError('Please enter a valid amount');
      return;
    }

    // Disable form while processing
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    if (resultContainer) {
      resultContainer.innerHTML = '';
      resultContainer.style.display = 'none';
    }

    try {
      // Initialize payment
      const response = await this.initiatePayment(phoneNumber, amount);

      if (!response.success) {
        throw new Error(response.message || 'Failed to initiate M-Pesa payment');
      }

      // Show pending message
      this.showPending('M-Pesa payment request sent to your phone. Please check your phone and enter PIN to complete payment.');

      // Store checkout request ID for status checking
      this.checkoutRequestId = response.checkoutRequestId;

      // Start checking status
      this.statusCheckCount = 0;
      this.startStatusChecking();

      // Call onPending callback if provided
      if (this.options.onPending) {
        this.options.onPending(response);
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      this.showError(error.message || 'An error occurred while processing M-Pesa payment');

      if (this.options.onError) {
        this.options.onError(error);
      }

      // Re-enable form
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Pay with M-Pesa';
      }
    }
  }

  /**
   * Initiate M-Pesa payment
   * @param {string} phoneNumber - Customer's phone number
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>} - Payment result
   */
  async initiatePayment(phoneNumber, amount) {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/mpesa/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        phoneNumber,
        amount,
        orderId: this.options.orderId
      })
    });

    const data = await response.json();
    return data;
  }

  /**
   * Start checking payment status
   */
  startStatusChecking() {
    // Clear any existing interval
    if (this.statusCheckIntervalId) {
      clearInterval(this.statusCheckIntervalId);
    }

    // Start a new interval
    this.statusCheckIntervalId = setInterval(() => {
      this.checkPaymentStatus();
    }, this.options.statusCheckInterval);
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus() {
    if (!this.checkoutRequestId) {
      this.stopStatusChecking();
      return;
    }

    this.statusCheckCount++;

    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/mpesa/status/${this.checkoutRequestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        if (data.status === 'SUCCESS') {
          // Payment successful
          this.stopStatusChecking();
          this.showSuccess('Payment completed successfully!');

          // Re-enable form
          const submitButton = document.querySelector(this.options.submitButtonSelector);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Pay with M-Pesa';
          }

          // Call onSuccess callback if provided
          if (this.options.onSuccess) {
            this.options.onSuccess(data);
          }
        } else if (data.status === 'FAILED') {
          // Payment failed
          this.stopStatusChecking();
          this.showError('Payment failed: ' + (data.message || 'Please try again'));

          // Re-enable form
          const submitButton = document.querySelector(this.options.submitButtonSelector);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Pay with M-Pesa';
          }

          // Call onError callback if provided
          if (this.options.onError) {
            this.options.onError(new Error(data.message || 'Payment failed'));
          }
        } else if (this.statusCheckCount >= this.options.maxStatusChecks) {
          // Max checks reached, stop checking
          this.stopStatusChecking();
          this.showPending('Payment status is still pending. Please check your order status later.');

          // Re-enable form
          const submitButton = document.querySelector(this.options.submitButtonSelector);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Pay with M-Pesa';
          }
        }
      } else {
        // Error checking status
        if (this.statusCheckCount >= this.options.maxStatusChecks) {
          this.stopStatusChecking();
          this.showError('Unable to confirm payment status. Please check your order status later.');

          // Re-enable form
          const submitButton = document.querySelector(this.options.submitButtonSelector);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Pay with M-Pesa';
          }

          // Call onError callback if provided
          if (this.options.onError) {
            this.options.onError(new Error(data.message || 'Unable to confirm payment status'));
          }
        }
      }
    } catch (error) {
      console.error('Error checking M-Pesa payment status:', error);

      if (this.statusCheckCount >= this.options.maxStatusChecks) {
        this.stopStatusChecking();
        this.showError('Error checking payment status. Please check your order status later.');

        // Re-enable form
        const submitButton = document.querySelector(this.options.submitButtonSelector);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Pay with M-Pesa';
        }

        // Call onError callback if provided
        if (this.options.onError) {
          this.options.onError(error);
        }
      }
    }
  }

  /**
   * Stop checking payment status
   */
  stopStatusChecking() {
    if (this.statusCheckIntervalId) {
      clearInterval(this.statusCheckIntervalId);
      this.statusCheckIntervalId = null;
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    const resultContainer = document.querySelector(this.options.resultSelector);
    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          ${message}
        </div>
      `;
      resultContainer.style.display = 'block';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const resultContainer = document.querySelector(this.options.resultSelector);
    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          ${message}
        </div>
      `;
      resultContainer.style.display = 'block';
    }
  }

  /**
   * Show pending message
   * @param {string} message - Pending message
   */
  showPending(message) {
    const resultContainer = document.querySelector(this.options.resultSelector);
    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-spinner fa-spin"></i>
          ${message}
        </div>
      `;
      resultContainer.style.display = 'block';
    }
  }

  /**
   * Get authentication token
   * @returns {string} - Authentication token
   */
  getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MpesaPayment;
}

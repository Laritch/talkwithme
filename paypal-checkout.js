/**
 * PayPal Checkout Integration
 *
 * Client-side implementation for PayPal payment processing
 */

// PayPal client configuration
let paypalClientId;
let paypalEnvironment;

// Initialize PayPal configuration on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch PayPal configuration from server
    const configResponse = await fetch('/api/payment/config');
    const config = await configResponse.json();

    if (config.paypal && config.paypal.clientId) {
      paypalClientId = config.paypal.clientId;
      paypalEnvironment = config.paypal.sandbox ? 'sandbox' : 'production';

      // Initialize the PayPal JavaScript SDK
      await loadPayPalScript();
    }
  } catch (error) {
    console.error('Error loading PayPal configuration:', error);
  }
});

/**
 * Load the PayPal JavaScript SDK
 * @returns {Promise} - Resolves when the script is loaded
 */
function loadPayPalScript() {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="paypal-sdk"]')) {
      // Script already loaded
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.body.appendChild(script);
  });
}

/**
 * Initialize PayPal button in a container
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
async function initializePayPalButton(containerId, options = {}) {
  const {
    amount,
    currency = 'USD',
    orderId,
    items = [],
    successCallback,
    cancelCallback,
    errorCallback
  } = options;

  if (!amount) {
    console.error('Amount is required for PayPal checkout');
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`PayPal container #${containerId} not found`);
    return;
  }

  // Make sure the PayPal SDK is loaded
  if (!window.paypal) {
    try {
      await loadPayPalScript();
    } catch (error) {
      console.error('Could not load PayPal SDK:', error);
      if (errorCallback) errorCallback(error);
      return;
    }
  }

  // Clear any existing buttons
  container.innerHTML = '';

  // Create the PayPal button
  window.paypal.Buttons({
    // Set up the transaction
    createOrder: async (data, actions) => {
      try {
        // Create a checkout session through our backend
        const response = await fetch('/api/unified-payment/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            processor: 'paypal',
            amount,
            currency,
            items: items.length > 0 ? items : [{
              name: 'Expert Chat Services',
              price: amount,
              quantity: 1
            }],
            orderId,
            returnUrl: window.location.origin + '/checkout/success',
            cancelUrl: window.location.origin + '/checkout/cancel'
          })
        });

        const checkoutData = await response.json();

        if (!checkoutData.success) {
          throw new Error(checkoutData.message || 'Failed to create checkout session');
        }

        // Return the order ID from our checkout session
        return checkoutData.sessionId;
      } catch (error) {
        console.error('Error creating PayPal order:', error);
        if (errorCallback) errorCallback(error);
        throw error;
      }
    },

    // Finalize the transaction
    onApprove: async (data, actions) => {
      try {
        // Show loading indicator
        container.innerHTML = '<div class="paypal-loading">Processing payment...</div>';

        // Call our server to complete the payment
        const response = await fetch('/api/unified-payment/complete-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: data.orderID,
            processor: 'paypal',
            payerId: data.payerID
          })
        });

        const resultData = await response.json();

        if (!resultData.success) {
          throw new Error(resultData.message || 'Payment completion failed');
        }

        // Call success callback with the result
        if (successCallback) {
          successCallback(resultData);
        } else {
          // Default success handler
          window.location.href = `/checkout/success?orderId=${resultData.orderId || ''}&session=${data.orderID}`;
        }
      } catch (error) {
        console.error('Error completing PayPal payment:', error);
        container.innerHTML = '<div class="paypal-error">Payment processing failed. Please try again.</div>';
        if (errorCallback) errorCallback(error);
      }
    },

    // Handle cancellation
    onCancel: (data) => {
      console.log('PayPal payment cancelled by user');
      if (cancelCallback) {
        cancelCallback(data);
      } else {
        // Default cancel handler
        window.location.href = `/checkout/cancel?session=${data.orderID || ''}`;
      }
    },

    // Handle errors
    onError: (err) => {
      console.error('PayPal error:', err);
      container.innerHTML = '<div class="paypal-error">An error occurred with PayPal. Please try again.</div>';
      if (errorCallback) errorCallback(err);
    },

    style: {
      layout: 'vertical',
      color: 'blue',
      shape: 'rect',
      label: 'pay'
    }
  }).render(container);
}

/**
 * Create a PayPal checkout session
 * @param {Object} options - Checkout options
 * @returns {Promise<Object>} - Checkout session details
 */
async function createPayPalCheckoutSession(options) {
  try {
    const {
      amount,
      currency = 'USD',
      items = [],
      orderId,
      customerId,
      metadata = {}
    } = options;

    if (!amount) {
      throw new Error('Amount is required for PayPal checkout');
    }

    // Create checkout session via the backend
    const response = await fetch('/api/unified-payment/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        processor: 'paypal',
        amount,
        currency,
        items: items.length > 0 ? items : [{
          name: 'Expert Chat Services',
          price: amount,
          quantity: 1
        }],
        orderId,
        customerId,
        metadata
      })
    });

    const checkoutData = await response.json();

    if (!checkoutData.success) {
      throw new Error(checkoutData.message || 'Failed to create checkout session');
    }

    return {
      success: true,
      sessionId: checkoutData.sessionId,
      redirectUrl: checkoutData.redirectUrl
    };
  } catch (error) {
    console.error('Error creating PayPal checkout session:', error);
    return {
      success: false,
      message: error.message || 'Failed to create PayPal checkout session'
    };
  }
}

/**
 * Complete a PayPal checkout
 * @param {Object} options - Completion options
 * @returns {Promise<Object>} - Completion result
 */
async function completePayPalCheckout(options) {
  try {
    const { sessionId, payerId, orderId } = options;

    if (!sessionId) {
      throw new Error('Session ID is required to complete checkout');
    }

    // Complete the checkout via the backend
    const response = await fetch('/api/unified-payment/complete-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        sessionId,
        payerId,
        orderId,
        processor: 'paypal'
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Error completing PayPal checkout:', error);
    return {
      success: false,
      message: error.message || 'Failed to complete checkout'
    };
  }
}

/**
 * Get the user's authentication token
 * @returns {string} - Auth token
 */
function getToken() {
  return localStorage.getItem('token') || '';
}

// Export the PayPal checkout functions
window.paypalCheckout = {
  initializeButton: initializePayPalButton,
  createSession: createPayPalCheckoutSession,
  completeCheckout: completePayPalCheckout
};

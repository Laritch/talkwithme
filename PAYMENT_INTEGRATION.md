# Payment Integration Guide

This document provides information on how to use the payment integration system in the Expert Chat application. The system supports multiple payment methods, including debit and credit cards via Stripe, PayPal, and M-Pesa.

## Supported Payment Methods

1. **Credit/Debit Cards** (via Stripe)
   - Visa
   - Mastercard
   - American Express
   - Discover
   - JCB
   - UnionPay

2. **Digital Wallets**
   - PayPal
   - Apple Pay (planned)
   - Google Pay (planned)

3. **Mobile Money**
   - M-Pesa (for Kenya, Tanzania, etc.)

## Configuration

The payment system requires proper configuration of environment variables. Copy `.env.example` to `.env` and configure the following variables:

### Stripe Configuration (Credit/Debit Card)

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayPal Configuration

```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### M-Pesa Configuration

```
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_PASSKEY=your_mpesa_passkey
```

## Frontend Implementation

The payment system provides a unified payment form (`payment.html`) that adapts to the selected payment method. To create a payment form, you can use the following code:

```html
<!-- Include Stripe.js -->
<script src="https://js.stripe.com/v3/"></script>
<script src="js/payment-form.js"></script>

<!-- Initialize payment form -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe
    const stripe = Stripe('your_publishable_key');

    // Initialize payment form
    const paymentForm = new PaymentForm({
      stripe: stripe,
      orderId: 'order_123',
      paymentType: 'product',
      onSuccess: function(result) {
        console.log('Payment successful!', result);
      },
      onError: function(error) {
        console.error('Payment error:', error);
      }
    });
  });
</script>
```

## Backend Implementation

### Processing a Payment

To process a payment on the backend, make a POST request to `/api/payments/process` with the following parameters:

```json
{
  "amount": 99.99,
  "currency": "usd",
  "paymentMethod": "credit_card",
  "paymentMethodId": "pm_123456789",
  "description": "Payment for Expert Consultation"
}
```

### Handling Webhooks

The system handles payment webhooks from Stripe and PayPal to process asynchronous events like payment confirmations, refunds, and subscription updates.

- Stripe webhook endpoint: `/api/webhooks/stripe`
- PayPal webhook endpoint: `/api/webhooks/paypal`

## Payment Flow

### Credit/Debit Card Payment Flow

1. User selects "Credit/Debit Card" as payment method
2. User enters card details in the Stripe Elements form
3. User clicks "Pay Now"
4. Frontend creates a payment intent via API call
5. Backend processes the payment with Stripe
6. Upon approval, Stripe sends a webhook to confirm payment
7. User receives confirmation and email receipt

### PayPal Payment Flow

1. User selects "PayPal" as payment method
2. User clicks "Pay Now"
3. User is redirected to PayPal for authentication
4. User approves payment on PayPal
5. PayPal redirects back to success URL
6. PayPal sends webhook to confirm payment
7. User receives confirmation and email receipt

## Loyalty Integration

The payment system integrates with the loyalty program:

1. **Points Earning**: Users earn loyalty points for completed payments
2. **Points Redemption**: Users can redeem points for discounts on payments
3. **Tier Discounts**: Higher loyalty tiers provide percentage-based discounts

## Testing

### Test Cards for Stripe

- Success: 4242 4242 4242 4242 (any future expiry date, any 3-digit CVC)
- Requires Authentication: 4000 0025 0000 3155
- Declined: 4000 0000 0000 9995

### Test PayPal Accounts

Use the PayPal sandbox for testing PayPal payments. Create sandbox buyer and seller accounts in the PayPal Developer Dashboard.

## Troubleshooting

Common issues and their solutions:

1. **Payment Declined**: Check the card details and ensure sufficient funds
2. **Authentication Failed**: Verify 3D Secure setup
3. **Webhook Failures**: Ensure webhook endpoints are publicly accessible
4. **Missing Parameters**: Verify all required parameters are provided

For additional help, check the logs or contact the development team.

## Security Considerations

- Never log or store complete card numbers
- Ensure PCI compliance when handling card data
- Use HTTPS for all payment communications
- Keep API keys secure and never expose them in client-side code

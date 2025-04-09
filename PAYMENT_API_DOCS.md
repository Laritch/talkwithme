# Payment Processor API Documentation

This document outlines the API endpoints and functionality for the multi-payment processor integration in the Expert Chat System. The system supports multiple payment processors, allowing users to choose the most suitable option based on their region and preferences.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Payment Processors](#payment-processors)
- [API Endpoints](#api-endpoints)
  - [Payment Methods](#payment-methods)
  - [Transactions](#transactions)
  - [Preferences](#preferences)
  - [Checkout](#checkout)
  - [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [Testing](#testing)

## Overview

The payment processor integration uses a Strategy Pattern, allowing the system to seamlessly switch between different payment processors based on:

1. User preferences
2. Geographic location
3. Payment method availability
4. Fallback strategies

The API provides unified endpoints for managing payment methods, processing transactions, and configuring preferences. Each payment processor has a standardized interface, making it easy to add new processors in the future.

## Authentication

All API endpoints require authentication using JSON Web Tokens (JWT).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

## Payment Processors

The system currently supports the following payment processors:

| Processor | Supported Payment Methods | Supported Regions |
|-----------|--------------------------|-------------------|
| Stripe    | Credit/Debit Cards, Apple Pay, Google Pay | Global (except for restricted countries) |
| Square    | Credit/Debit Cards, Apple Pay, Google Pay | US, Canada, Japan, UK, Australia |
| Adyen     | Credit/Debit Cards, Bank Transfers, Local Methods | Global |
| M-Pesa    | Mobile Money | Kenya, Tanzania, Ghana, DRC, Mozambique, Egypt, Lesotho |
| RazorPay  | Credit/Debit Cards, Bank Transfers, UPI | India |

## API Endpoints

### Payment Methods

#### GET /api/payment-methods

Retrieves all saved payment methods for the authenticated user.

**Response:**
```json
{
  "success": true,
  "paymentMethods": [
    {
      "id": "pm_123456789",
      "type": "card",
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025,
      "isDefault": true,
      "processor": "stripe"
    },
    {
      "id": "ba_987654321",
      "type": "bank_account",
      "bankName": "Chase",
      "last4": "6789",
      "isDefault": false,
      "processor": "stripe"
    }
  ]
}
```

#### POST /api/payment-methods

Creates a new payment method.

**Request:**
```json
{
  "type": "card",
  "processor": "stripe",
  "paymentToken": "tok_visa",
  "isDefault": true,
  "billingDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94103",
      "country": "US"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentMethod": {
    "id": "pm_123456789",
    "type": "card",
    "brand": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2025,
    "isDefault": true,
    "processor": "stripe"
  }
}
```

#### DELETE /api/payment-methods/:id

Deletes a payment method.

**Response:**
```json
{
  "success": true,
  "message": "Payment method deleted successfully"
}
```

#### PUT /api/payment-methods/:id/default

Sets a payment method as default.

**Response:**
```json
{
  "success": true,
  "message": "Payment method set as default"
}
```

### Transactions

#### GET /api/transactions

Fetches transaction history with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `status` (optional): Filter by status (completed, pending, failed, refunded)
- `paymentMethod` (optional): Filter by payment method (card, bank, mpesa, etc.)
- `processor` (optional): Filter by processor (stripe, square, adyen, mpesa, razorpay)
- `type` (optional): Filter by transaction type (order, subscription)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "tx_123456789",
      "type": "order",
      "orderType": "product",
      "description": "Purchase of Expert Session",
      "amount": 99.99,
      "currency": "USD",
      "status": "completed",
      "paymentMethod": "card",
      "processor": "stripe",
      "date": "2025-02-15T14:30:45Z",
      "items": [
        {
          "id": "item_123",
          "name": "Expert Consultation",
          "quantity": 1,
          "price": 99.99
        }
      ],
      "loyaltyPointsEarned": 100,
      "refunded": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalTransactions": 47
  }
}
```

#### GET /api/transactions/:id

Fetches details for a specific transaction.

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_123456789",
    "type": "order",
    "orderType": "product",
    "description": "Purchase of Expert Session",
    "amount": 99.99,
    "currency": "USD",
    "status": "completed",
    "paymentMethod": "card",
    "processor": "stripe",
    "date": "2025-02-15T14:30:45Z",
    "items": [
      {
        "id": "item_123",
        "name": "Expert Consultation",
        "quantity": 1,
        "price": 99.99
      }
    ],
    "loyaltyPointsEarned": 100,
    "refunded": false,
    "processorDetails": {
      "paymentIntentId": "pi_123456789",
      "paymentMethodId": "pm_123456789",
      "receiptUrl": "https://pay.stripe.com/receipts/..."
    },
    "shipping": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94103",
      "country": "US"
    },
    "billingAddress": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94103",
      "country": "US"
    }
  }
}
```

#### GET /api/transactions/:id/receipt

Generates and retrieves a receipt for a transaction.

**Response:**
A PDF file containing the receipt.

### Preferences

#### GET /api/payment-preferences

Retrieves payment preferences for the authenticated user.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "defaultCurrency": "USD",
    "savePaymentInfo": true,
    "autoCurrency": true,
    "processors": {
      "global": {
        "stripe": true,
        "square": false,
        "adyen": false,
        "mpesa": false,
        "razorpay": false
      },
      "us": {
        "stripe": true,
        "square": true,
        "adyen": false,
        "mpesa": false,
        "razorpay": false
      }
    }
  }
}
```

#### POST /api/payment-preferences

Updates payment preferences.

**Request:**
```json
{
  "defaultCurrency": "EUR",
  "savePaymentInfo": true,
  "autoCurrency": false,
  "region": "global",
  "processors": {
    "stripe": true,
    "square": true,
    "adyen": false,
    "mpesa": false,
    "razorpay": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment preferences updated successfully"
}
```

### Checkout

#### POST /api/checkout

Creates a new checkout session.

**Request:**
```json
{
  "items": [
    {
      "id": "item_123",
      "quantity": 1
    }
  ],
  "currency": "USD",
  "paymentMethodId": "pm_123456789", // Optional
  "processor": "stripe", // Optional, will use preferred processor if not specified
  "couponCode": "DISCOUNT20", // Optional
  "shippingAddress": {
    "name": "John Doe",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94103",
    "country": "US"
  },
  "billingAddress": {
    "same_as_shipping": true // Or include full address
  }
}
```

**Response:**
```json
{
  "success": true,
  "checkoutId": "checkout_123456789",
  "redirectUrl": "https://checkout.stripe.com/...", // If applicable
  "clientSecret": "pi_123_secret_456", // For client-side confirmation
  "processorType": "stripe"
}
```

#### GET /api/checkout/:id

Retrieves the status of a checkout session.

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "orderId": "order_123456789",
  "transactionId": "tx_123456789"
}
```

### Webhooks

#### POST /api/webhooks/:processor

Endpoint for receiving webhook events from payment processors.

**Request:**
The request body varies depending on the processor, but typically contains event information about payments, refunds, disputes, etc.

**Response:**
```json
{
  "received": true
}
```

## Error Handling

All API endpoints follow a consistent error handling pattern:

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "invalid_request",
    "message": "The payment method is invalid",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `authentication_required` | Authentication is required |
| `invalid_token` | The provided token is invalid |
| `expired_token` | The provided token has expired |
| `permission_denied` | User doesn't have permission to perform this action |
| `resource_not_found` | The requested resource doesn't exist |
| `invalid_request` | The request is invalid or missing required parameters |
| `processor_error` | An error occurred with the payment processor |
| `rate_limit_exceeded` | Too many requests, try again later |
| `internal_error` | An internal server error occurred |

## Testing

### Test Modes

Each payment processor integration includes a test mode that can be enabled in development environments. In test mode, no real charges are made, and predefined test cards can be used.

### Test Cards

| Processor | Card Number | Expiry | CVC | Result |
|-----------|-------------|--------|-----|--------|
| Stripe    | 4242 4242 4242 4242 | Any future date | Any 3 digits | Successful payment |
| Stripe    | 4000 0000 0000 0002 | Any future date | Any 3 digits | Declined payment |
| Square    | 4111 1111 1111 1111 | Any future date | Any 3 digits | Successful payment |
| Adyen     | 5555 5555 5555 4444 | Any future date | Any 3 digits | Successful payment |
| RazorPay  | 4111 1111 1111 1111 | Any future date | Any 3 digits | Successful payment |

### Test Endpoints

For testing purposes, append `/test` to any API endpoint to use the test mode.

Example:
```
POST /api/checkout/test
```

This will create a test checkout that doesn't process real payments.

## Implementation Example

Here's a simple example of how to create a payment method using the API:

```javascript
// Create a payment method
async function addPaymentMethod() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/payment-methods', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'card',
      processor: 'stripe',
      paymentToken: 'tok_visa', // This would come from Stripe Elements or similar
      isDefault: true,
      billingDetails: {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94103',
          country: 'US'
        }
      }
    })
  });

  const data = await response.json();

  if (data.success) {
    console.log('Payment method added:', data.paymentMethod);
    return data.paymentMethod;
  } else {
    console.error('Error adding payment method:', data.error);
    throw new Error(data.error.message);
  }
}
```

## Appendix: Processor-Specific Details

Each payment processor has specific parameters and response formats. For complete documentation on each processor's integration, refer to the following internal documents:

- [Stripe Integration Guide](./docs/stripe-integration.md)
- [Square Integration Guide](./docs/square-integration.md)
- [Adyen Integration Guide](./docs/adyen-integration.md)
- [M-Pesa Integration Guide](./docs/mpesa-integration.md)
- [RazorPay Integration Guide](./docs/razorpay-integration.md)

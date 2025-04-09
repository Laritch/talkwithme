'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { obfuscateCardNumber } from '@/lib/encryption';
import { useAuth } from '@/lib/auth/AuthContext';
import { transactionRequires2FA } from '@/lib/auth/twoFactor';

// Define payment method types
interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  recommendedFor: string[];
  priority: number;
  availableIn: string[];
}

// All available payment methods with prioritization
const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'payoneer',
    name: 'Payoneer',
    icon: '💳',
    recommendedFor: ['US', 'EU', 'UK'],
    priority: 90,
    availableIn: ['US', 'EU', 'UK', 'Africa']
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    icon: '🏦',
    recommendedFor: ['Kenya'],
    priority: 80,
    availableIn: ['Global']
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '📱',
    recommendedFor: ['Kenya'],
    priority: 95,
    availableIn: ['Kenya', 'Tanzania', 'Ghana']
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    icon: '💳',
    recommendedFor: ['Global'],
    priority: 70,
    availableIn: ['Global']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🔐',
    recommendedFor: ['US', 'EU', 'UK'],
    priority: 75,
    availableIn: ['Global', 'except restricted countries']
  },
  {
    id: 'wise',
    name: 'Wise',
    icon: '🌐',
    recommendedFor: ['UK', 'EU'],
    priority: 85,
    availableIn: ['Global']
  },
  {
    id: 'western-union',
    name: 'Western Union',
    icon: '🏛️',
    recommendedFor: [],
    priority: 50,
    availableIn: ['Global']
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    icon: '₿',
    recommendedFor: [],
    priority: 40,
    availableIn: ['Global']
  }
];

export default function PaymentUI() {
  const { user, isAuthenticated } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [sortedMethods, setSortedMethods] = useState<PaymentMethod[]>([]);
  const [userCountry, setUserCountry] = useState<string>('');
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    amount: 0,
    currency: 'USD',
    paymentMethod: ''
  });
  const [obfuscatedCard, setObfuscatedCard] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Two-factor auth states
  const [showTwoFactorPrompt, setShowTwoFactorPrompt] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Initialize component with security measures
  useEffect(() => {
    if (!isAuthenticated) return;

    // Get user's country from auth context
    const region = user?.region || 'Kenya';
    setUserCountry(region);

    // Filter out payment methods not available in the user's region
    const availableMethods = ALL_PAYMENT_METHODS.filter(method => {
      if (method.availableIn.includes('Global')) return true;
      if (method.availableIn.includes(region)) return true;
      return false;
    });

    // Sort payment methods based on priority for the user's region
    const optimizedMethods = [...availableMethods].sort((a, b) => {
      // Check if method is recommended for user's country
      const aRecommended = a.recommendedFor.includes(region);
      const bRecommended = b.recommendedFor.includes(region);

      if (aRecommended && !bRecommended) return -1;
      if (!aRecommended && bRecommended) return 1;

      // If both or neither are recommended, sort by priority
      return b.priority - a.priority;
    });

    setSortedMethods(optimizedMethods);

    // Set default payment method based on user's preferred method if available
    if (user?.defaultPaymentMethod) {
      const userPreferredMethod = optimizedMethods.find(m => m.id === user.defaultPaymentMethod);
      if (userPreferredMethod) {
        setSelectedMethod(userPreferredMethod.id);
        setPaymentData(prev => ({ ...prev, paymentMethod: userPreferredMethod.id }));
      } else {
        setSelectedMethod(optimizedMethods[0]?.id || '');
        setPaymentData(prev => ({ ...prev, paymentMethod: optimizedMethods[0]?.id || '' }));
      }
    } else {
      setSelectedMethod(optimizedMethods[0]?.id || '');
      setPaymentData(prev => ({ ...prev, paymentMethod: optimizedMethods[0]?.id || '' }));
    }

    // Generate a CSRF token (would normally be from the server)
    const newToken = `secure-token-${Math.random().toString(36).substring(2)}`;
    setCsrfToken(newToken);

    // Store CSRF token in cookie (simulated here)
    document.cookie = `csrf_token=${newToken}; path=/; secure; samesite=strict`;
  }, [isAuthenticated, user]);

  // Handle payment method selection
  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentData(prev => ({ ...prev, paymentMethod: methodId }));
    setError('');
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Special handling for card number to obfuscate it immediately
    if (name === 'cardNumber') {
      setObfuscatedCard(obfuscateCardNumber(value));
    }

    setPaymentData({
      ...paymentData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  // Submit payment with security measures
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      // Check if we have the necessary authorization token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }

      // Send payment request to API
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          ...paymentData,
          amount: parseFloat(paymentData.amount.toString()),
        }),
      });

      const data = await response.json();

      // Check if the payment requires 2FA verification
      if (data.requiresVerification) {
        setTransactionId(data.transactionId);
        setShowTwoFactorPrompt(true);
        setIsProcessing(false);
        return;
      }

      // Payment successful
      setIsProcessing(false);
      setSuccessMessage(`Payment successful! Confirmation code: ${data.confirmationCode}`);

      // Clear form
      setPaymentData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: '',
        amount: 0,
        currency: 'USD',
        paymentMethod: selectedMethod
      });

      // Reset obfuscated card
      setObfuscatedCard('');
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try a different method or try again later.');
    }
  };

  // Handle 2FA verification for high-value transactions
  const handleTwoFactorVerify = async () => {
    setError('');
    setIsProcessing(true);

    try {
      // Check if we have the necessary authorization token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login.');
      }

      // Verify the 2FA code for this transaction
      const response = await fetch('/api/auth/two-factor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: twoFactorCode,
          transactionId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // 2FA successful, now retry the payment with verification flag
      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          ...paymentData,
          amount: parseFloat(paymentData.amount.toString()),
          twoFactorVerified: true
        }),
      });

      const paymentData2 = await paymentResponse.json();

      // Hide 2FA prompt
      setShowTwoFactorPrompt(false);
      setTwoFactorCode('');
      setTransactionId('');

      // Show success message
      setIsProcessing(false);
      setSuccessMessage(`Payment successful! Confirmation code: ${paymentData2.confirmationCode}`);

      // Clear form
      setPaymentData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: '',
        amount: 0,
        currency: 'USD',
        paymentMethod: selectedMethod
      });

      // Reset obfuscated card
      setObfuscatedCard('');
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    }
  };

  // Show security badge with information
  const SecurityBadge = () => (
    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 text-xl">🔒</span>
        <h3 className="text-green-800 font-medium">Secured Payment</h3>
      </div>
      <ul className="text-sm text-green-700">
        <li className="flex items-center gap-2">
          <span>✓</span>
          <span>End-to-end encrypted payment information</span>
        </li>
        <li className="flex items-center gap-2">
          <span>✓</span>
          <span>Anti-phishing protection</span>
        </li>
        <li className="flex items-center gap-2">
          <span>✓</span>
          <span>Real-time fraud monitoring</span>
        </li>
        {user?.twoFactorEnabled && (
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Two-factor authentication enabled</span>
          </li>
        )}
      </ul>
    </div>
  );

  // 2FA verification prompt
  const TwoFactorVerificationPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Verification Required</h3>
        <p className="mb-4 text-gray-600">
          This transaction requires additional verification for your security.
          Please enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            type="text"
            id="twoFactorCode"
            name="twoFactorCode"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full p-2 border border-gray-300 rounded-md"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowTwoFactorPrompt(false);
              setTwoFactorCode('');
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTwoFactorVerify}
            disabled={isProcessing || twoFactorCode.length !== 6}
            className={`px-4 py-2 rounded-md ${
              isProcessing || twoFactorCode.length !== 6
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto text-center p-8">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="mb-6">
            Please sign in to access the secure payment system.
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md">
          <div className="flex items-start">
            <span className="text-green-600 text-xl mr-2">✓</span>
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm mt-1">
                Thank you for your payment! A receipt has been sent to your email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment method tabs with prioritization */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
        <div className="flex overflow-x-auto gap-2 pb-2">
          {sortedMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`flex items-center px-4 py-3 rounded-lg min-w-[140px] border transition
                ${selectedMethod === method.id
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                }
                ${method.recommendedFor.includes(userCountry) ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              <span className="mr-2 text-xl">{method.icon}</span>
              <span>{method.name}</span>
              {method.recommendedFor.includes(userCountry) && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payment form with security features */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">
            {sortedMethods.find(m => m.id === selectedMethod)?.name || 'Payment'} Details
          </h3>

          {/* Hidden CSRF token field */}
          <input type="hidden" name="csrfToken" value={csrfToken} />

          {selectedMethod === 'credit-card' && (
            <>
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  onChange={handleInputChange}
                  placeholder="**** **** **** ****"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  maxLength={19}
                  required
                />
                {obfuscatedCard && (
                  <p className="text-xs text-gray-500 mt-1">
                    For your security, we store this as: {obfuscatedCard}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    onChange={handleInputChange}
                    placeholder="***"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {selectedMethod === 'bank-transfer' && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Bank Account Details (Kenya)</h4>
              <p className="text-sm text-gray-600 mb-1">Account Name: Your Company Ltd</p>
              <p className="text-sm text-gray-600 mb-1">Bank: ABC Bank Kenya</p>
              <p className="text-sm text-gray-600 mb-1">Account Number: XXXX-XXXX-XXXX</p>
              <p className="text-sm text-gray-600">SWIFT/BIC: ABCKENXXX</p>
            </div>
          )}

          {selectedMethod === 'payoneer' && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Optimized for US and European users sending money to Kenya.
                Lower fees and faster processing times than traditional bank transfers.
              </p>
              <label htmlFor="payoneerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Payoneer Email
              </label>
              <input
                type="email"
                id="payoneerEmail"
                name="payoneerEmail"
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          {selectedMethod === 'mpesa' && (
            <div className="mb-4">
              <label htmlFor="mpesaNumber" className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                id="mpesaNumber"
                name="mpesaNumber"
                onChange={handleInputChange}
                placeholder="e.g. 254712345678"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 254 followed by your 9-digit phone number
              </p>
            </div>
          )}

          {selectedMethod === 'paypal' && (
            <div className="mb-4">
              <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                PayPal Email
              </label>
              <input
                type="email"
                id="paypalEmail"
                name="paypalEmail"
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          {selectedMethod === 'wise' && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Wise (formerly TransferWise) offers competitive exchange rates and low fees for international transfers.
              </p>
              <label htmlFor="wiseEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Wise Email
              </label>
              <input
                type="email"
                id="wiseEmail"
                name="wiseEmail"
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          {selectedMethod === 'western-union' && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Send money for cash pickup at thousands of agent locations worldwide.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recipientFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient First Name
                  </label>
                  <input
                    type="text"
                    id="recipientFirstName"
                    name="recipientFirstName"
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="recipientLastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Last Name
                  </label>
                  <input
                    type="text"
                    id="recipientLastName"
                    name="recipientLastName"
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'crypto' && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Send cryptocurrency payments with low fees and fast confirmation times.
              </p>
              <div className="mb-4">
                <label htmlFor="cryptoType" className="block text-sm font-medium text-gray-700 mb-1">
                  Cryptocurrency
                </label>
                <select
                  id="cryptoType"
                  name="cryptoType"
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select cryptocurrency</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="USDT">Tether (USDT)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                </select>
              </div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                id="walletAddress"
                name="walletAddress"
                onChange={handleInputChange}
                placeholder="Enter recipient wallet address"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="flex">
              <select
                name="currency"
                value={paymentData.currency}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-l-md"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="KES">KES</option>
                <option value="GBP">GBP</option>
              </select>
              <input
                type="number"
                id="amount"
                name="amount"
                value={paymentData.amount || ''}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full p-2 border border-gray-300 rounded-r-md"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            {/* Show 2FA warning for high-value transactions */}
            {paymentData.amount > 0 && user && transactionRequires2FA(
              paymentData.amount,
              paymentData.currency,
              user.twoFactorEnabled
            ) && (
              <p className="mt-2 text-xs text-orange-600">
                <span className="font-medium">Note:</span> This high-value transaction will require two-factor authentication.
              </p>
            )}
          </div>
        </div>

        <SecurityBadge />

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isProcessing || !selectedMethod || paymentData.amount <= 0}
            className={`px-6 py-2 rounded-md ${
              isProcessing || !selectedMethod || paymentData.amount <= 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>

      {/* 2FA Verification Modal */}
      {showTwoFactorPrompt && <TwoFactorVerificationPrompt />}
    </div>
  );
}

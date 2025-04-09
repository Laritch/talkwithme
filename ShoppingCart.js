import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { cartAPI } from '../../services/api';
import { ShoppingCartIcon, XIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/outline';

export default function ShoppingCart({ isOpen, setIsOpen }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch cart items when cart is opened
  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await cartAPI.updateCartItem(itemId, quantity);

      // Optimistically update the UI
      setCart(prevCart => {
        const updatedItems = prevCart.items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, quantity };
            return updatedItem;
          }
          return item;
        });

        // Recalculate total
        const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
          ...prevCart,
          items: updatedItems,
          total: newTotal
        };
      });
    } catch (err) {
      console.error('Error updating cart item:', err);
      // Revert back to actual state on error
      fetchCart();
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeFromCart(itemId);

      // Optimistically update the UI
      setCart(prevCart => {
        const updatedItems = prevCart.items.filter(item => item.id !== itemId);
        const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
          ...prevCart,
          items: updatedItems,
          total: newTotal
        };
      });
    } catch (err) {
      console.error('Error removing cart item:', err);
      fetchCart();
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      await cartAPI.clearCart();
      setCart({ items: [], total: 0 });
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const proceedToCheckout = () => {
    setIsOpen(false);
    router.push('/client/checkout');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div
      className={`fixed inset-0 overflow-hidden z-50 ${isOpen ? 'block' : 'hidden'}`}
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* Background overlay */}
        <div
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        ></div>

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl">
              {/* Cart header */}
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white" id="slide-over-title">
                    Shopping Cart
                  </h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="-m-2 p-2 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="sr-only">Close panel</span>
                      <XIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  {loading ? (
                    <div className="animate-pulse space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex py-6">
                          <div className="h-24 w-24 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="py-6">
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                            <button
                              onClick={fetchCart}
                              className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
                            >
                              Try Again
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : cart.items.length === 0 ? (
                    <div className="py-6 text-center">
                      <div className="flex justify-center">
                        <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Your cart is empty</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Start shopping by exploring expert products
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/client/marketplace"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => setIsOpen(false)}
                        >
                          View Marketplace
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flow-root">
                      <ul role="list" className="-my-6 divide-y divide-gray-200 dark:divide-gray-700">
                        {cart.items.map((item) => (
                          <li key={item.id} className="py-6 flex">
                            <div className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover object-center"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingCartIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                                  <h3>
                                    <Link
                                      href={`/products/${item.productId}`}
                                      className="hover:text-blue-600 dark:hover:text-blue-400"
                                      onClick={() => setIsOpen(false)}
                                    >
                                      {item.title}
                                    </Link>
                                  </h3>
                                  <p className="ml-4">
                                    {formatCurrency(item.price)}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {item.expertName && `By ${item.expertName}`}
                                </p>
                              </div>
                              <div className="flex-1 flex items-end justify-between text-sm">
                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                                  <button
                                    type="button"
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                  <span className="px-2 text-gray-700 dark:text-gray-300">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="flex">
                                  <button
                                    type="button"
                                    className="font-medium text-red-600 dark:text-red-400 hover:text-red-500"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {cart.items.length > 0 && (
                        <div className="mt-6 text-right">
                          <button
                            type="button"
                            onClick={clearCart}
                            className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500"
                          >
                            Clear Cart
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Cart footer with totals and checkout button */}
              {!loading && cart.items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 py-6 px-4 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                    <p>Subtotal</p>
                    <p>{formatCurrency(cart.total)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={proceedToCheckout}
                      className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Checkout
                    </button>
                  </div>
                  <div className="mt-6 flex justify-center text-sm text-center text-gray-500 dark:text-gray-400">
                    <p>
                      or{' '}
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-500"
                        onClick={() => setIsOpen(false)}
                      >
                        Continue Shopping<span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

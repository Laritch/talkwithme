import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching the cart from the server
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart');

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding an item to the cart on the server
export const addToCartAsync = createAsyncThunk(
  'cart/addToCartAsync',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for removing an item from the cart on the server
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCartAsync',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cart/remove/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }

      return { courseId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for applying a coupon code
export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply coupon');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalItems: 0,
    subtotal: 0,
    total: 0,
    discount: 0,
    couponCode: null,
    couponDiscount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    // For client-side cart management (when user is not logged in)
    addToCart: (state, action) => {
      const course = action.payload;

      // Check if course already exists in cart
      const existingItem = state.items.find(item => item.id === course.id);

      if (!existingItem) {
        state.items.push(course);
        state.totalItems += 1;
        state.subtotal += course.price;
        state.total = state.subtotal - state.discount - state.couponDiscount;

        // Save to localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify({
            items: state.items,
            totalItems: state.totalItems,
            subtotal: state.subtotal,
            discount: state.discount,
            couponCode: state.couponCode,
            couponDiscount: state.couponDiscount,
          }));
        }
      }
    },
    removeFromCart: (state, action) => {
      const courseId = action.payload;
      const courseIndex = state.items.findIndex(item => item.id === courseId);

      if (courseIndex !== -1) {
        const removedItem = state.items[courseIndex];
        state.items.splice(courseIndex, 1);
        state.totalItems -= 1;
        state.subtotal -= removedItem.price;
        state.total = state.subtotal - state.discount - state.couponDiscount;

        // Save to localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify({
            items: state.items,
            totalItems: state.totalItems,
            subtotal: state.subtotal,
            discount: state.discount,
            couponCode: state.couponCode,
            couponDiscount: state.couponDiscount,
          }));
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.subtotal = 0;
      state.total = 0;
      state.discount = 0;
      state.couponCode = null;
      state.couponDiscount = 0;

      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
    },
    initializeCartFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        const storedCart = localStorage.getItem('cart');

        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);

          state.items = parsedCart.items || [];
          state.totalItems = parsedCart.totalItems || 0;
          state.subtotal = parsedCart.subtotal || 0;
          state.discount = parsedCart.discount || 0;
          state.couponCode = parsedCart.couponCode || null;
          state.couponDiscount = parsedCart.couponDiscount || 0;
          state.total = state.subtotal - state.discount - state.couponDiscount;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.subtotal = action.payload.subtotal;
        state.discount = action.payload.discount || 0;
        state.couponCode = action.payload.couponCode || null;
        state.couponDiscount = action.payload.couponDiscount || 0;
        state.total = state.subtotal - state.discount - state.couponDiscount;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Handle addToCartAsync
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.subtotal = action.payload.subtotal;
        state.total = action.payload.total;
        state.discount = action.payload.discount || 0;
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Handle removeFromCartAsync
      .addCase(removeFromCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Simply filter out the removed item (optimistic update)
        // The full cart will be refreshed when fetchCart is called
        state.items = state.items.filter(item => item.id !== action.payload.courseId);
        state.totalItems = state.items.length;
        // Recalculate totals
        state.subtotal = state.items.reduce((total, item) => total + item.price, 0);
        state.total = state.subtotal - state.discount - state.couponDiscount;
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Handle applyCoupon
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.couponCode = action.payload.couponCode;
        state.couponDiscount = action.payload.discount;
        state.total = state.subtotal - state.discount - state.couponDiscount;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addToCart, removeFromCart, clearCart, initializeCartFromStorage } = cartSlice.actions;
export default cartSlice.reducer;

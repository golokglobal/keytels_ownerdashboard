import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOwnerBilling, createSubscriptionCheckout } from '../../api/payments';

export const fetchOwnerBilling = createAsyncThunk(
  'payments/fetchOwnerBilling',
  async (ownerId, { rejectWithValue }) => {
    try {
      return await getOwnerBilling(ownerId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch billing info');
    }
  }
);

export const startCheckout = createAsyncThunk(
  'payments/startCheckout',
  async ({ ownerId, priceId }, { rejectWithValue }) => {
    try {
      return await createSubscriptionCheckout({ ownerId, priceId });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create checkout session');
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    billing: null,
    loading: false,
    error: null,
    checkoutLoading: false,
    checkoutError: null,
  },
  reducers: {
    clearPaymentsError(state) {
      state.error = null;
      state.checkoutError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerBilling.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerBilling.fulfilled, (state, action) => {
        state.loading = false;
        state.billing = action.payload;
      })
      .addCase(fetchOwnerBilling.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startCheckout.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutError = null;
      })
      .addCase(startCheckout.fulfilled, (state) => {
        state.checkoutLoading = false;
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload;
      });
  },
});

export const { clearPaymentsError } = paymentsSlice.actions;
export default paymentsSlice.reducer;

export const selectBilling = (state) => state.payments.billing;
export const selectBillingLoading = (state) => state.payments.loading;
export const selectBillingError = (state) => state.payments.error;
export const selectCheckoutLoading = (state) => state.payments.checkoutLoading;
export const selectCheckoutError = (state) => state.payments.checkoutError;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getOwnerBilling,
  getOwnerDashboard,
  getOwnerInvoices,
  getOwnerPayments,
  listSubscriptionPlans,
  createSubscriptionCheckout,
  changeSubscriptionPlan,
  cancelSubscription,
  createPaymentWithCommission,
  refundPayment,
  syncCheckout as syncCheckoutApi,
} from '../../api/payments';

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

export const fetchSubscriptionPlans = createAsyncThunk(
  'payments/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      return await listSubscriptionPlans();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription plans');
    }
  }
);

export const createCommissionPayment = createAsyncThunk(
  'payments/createCommissionPayment',
  async ({ bookingId, userId, amount, currency }, { rejectWithValue }) => {
    try {
      return await createPaymentWithCommission({ bookingId, userId, amount, currency });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create commission payment');
    }
  }
);

export const startCheckout = createAsyncThunk(
  'payments/startCheckout',
  async ({ ownerId, planCode, priceId }, { rejectWithValue }) => {
    try {
      return await createSubscriptionCheckout({ ownerId, planCode, priceId });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create checkout session');
    }
  }
);

export const changePlan = createAsyncThunk(
  'payments/changePlan',
  async ({ ownerId, newPlanCode, newPriceId }, { rejectWithValue }) => {
    try {
      return await changeSubscriptionPlan({ ownerId, newPlanCode, newPriceId });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change plan');
    }
  }
);

export const cancelPlan = createAsyncThunk(
  'payments/cancelPlan',
  async ({ ownerId, cancelImmediately, reason }, { rejectWithValue }) => {
    try {
      return await cancelSubscription({ ownerId, cancelImmediately, reason });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }
);

export const fetchOwnerDashboardAnalytics = createAsyncThunk(
  'payments/fetchOwnerDashboard',
  async ({ ownerId, startDate, endDate }, { rejectWithValue }) => {
    try {
      return await getOwnerDashboard(ownerId, startDate, endDate);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch owner dashboard');
    }
  }
);

export const fetchOwnerInvoices = createAsyncThunk(
  'payments/fetchOwnerInvoices',
  async (ownerId, { rejectWithValue }) => {
    try {
      return await getOwnerInvoices(ownerId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch invoices');
    }
  }
);

export const fetchOwnerPayments = createAsyncThunk(
  'payments/fetchOwnerPayments',
  async (ownerId, { rejectWithValue }) => {
    try {
      return await getOwnerPayments(ownerId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const syncCheckoutSession = createAsyncThunk(
  'payments/syncCheckoutSession',
  async ({ ownerId, sessionId }, { rejectWithValue }) => {
    try {
      return await syncCheckoutApi(ownerId, sessionId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync checkout');
    }
  }
);

export const processRefund = createAsyncThunk(
  'payments/processRefund',
  async (refundData, { rejectWithValue }) => {
    try {
      return await refundPayment(refundData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process refund');
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
    plans: [],
    plansLoading: false,
    plansError: null,
    commissionLoading: false,
    commissionError: null,
    // owner analytics dashboard
    ownerDashboard: null,
    ownerDashboardLoading: false,
    ownerDashboardError: null,
    // subscription invoices (Stripe)
    invoices: [],
    invoicesLoading: false,
    invoicesError: null,
    // booking payments
    ownerPayments: [],
    ownerPaymentsLoading: false,
    ownerPaymentsError: null,
    // plan change / cancel
    planActionLoading: false,
    planActionError: null,
    // refund
    refundLoading: false,
    refundError: null,
  },
  reducers: {
    clearPaymentsError(state) {
      state.error = null;
      state.checkoutError = null;
      state.plansError = null;
      state.planActionError = null;
      state.refundError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchOwnerBilling ──
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

      // ── fetchSubscriptionPlans ──
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.plansLoading = true;
        state.plansError = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.plansLoading = false;
        state.plansError = action.payload;
      })

      // ── createCommissionPayment ──
      .addCase(createCommissionPayment.pending, (state) => {
        state.commissionLoading = true;
        state.commissionError = null;
      })
      .addCase(createCommissionPayment.fulfilled, (state) => {
        state.commissionLoading = false;
      })
      .addCase(createCommissionPayment.rejected, (state, action) => {
        state.commissionLoading = false;
        state.commissionError = action.payload;
      })

      // ── startCheckout ──
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
      })

      // ── changePlan ──
      .addCase(changePlan.pending, (state) => {
        state.planActionLoading = true;
        state.planActionError = null;
      })
      .addCase(changePlan.fulfilled, (state, action) => {
        state.planActionLoading = false;
        state.billing = action.payload;
      })
      .addCase(changePlan.rejected, (state, action) => {
        state.planActionLoading = false;
        state.planActionError = action.payload;
      })

      // ── cancelPlan ──
      .addCase(cancelPlan.pending, (state) => {
        state.planActionLoading = true;
        state.planActionError = null;
      })
      .addCase(cancelPlan.fulfilled, (state, action) => {
        state.planActionLoading = false;
        state.billing = action.payload;
      })
      .addCase(cancelPlan.rejected, (state, action) => {
        state.planActionLoading = false;
        state.planActionError = action.payload;
      })

      // ── fetchOwnerDashboardAnalytics ──
      .addCase(fetchOwnerDashboardAnalytics.pending, (state) => {
        state.ownerDashboardLoading = true;
        state.ownerDashboardError = null;
      })
      .addCase(fetchOwnerDashboardAnalytics.fulfilled, (state, action) => {
        state.ownerDashboardLoading = false;
        state.ownerDashboard = action.payload;
      })
      .addCase(fetchOwnerDashboardAnalytics.rejected, (state, action) => {
        state.ownerDashboardLoading = false;
        state.ownerDashboardError = action.payload;
      })

      // ── fetchOwnerInvoices ──
      .addCase(fetchOwnerInvoices.pending, (state) => {
        state.invoicesLoading = true;
        state.invoicesError = null;
      })
      .addCase(fetchOwnerInvoices.fulfilled, (state, action) => {
        state.invoicesLoading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchOwnerInvoices.rejected, (state, action) => {
        state.invoicesLoading = false;
        state.invoicesError = action.payload;
      })

      // ── fetchOwnerPayments ──
      .addCase(fetchOwnerPayments.pending, (state) => {
        state.ownerPaymentsLoading = true;
        state.ownerPaymentsError = null;
      })
      .addCase(fetchOwnerPayments.fulfilled, (state, action) => {
        state.ownerPaymentsLoading = false;
        state.ownerPayments = action.payload;
      })
      .addCase(fetchOwnerPayments.rejected, (state, action) => {
        state.ownerPaymentsLoading = false;
        state.ownerPaymentsError = action.payload;
      })

      // ── syncCheckoutSession ──
      .addCase(syncCheckoutSession.fulfilled, (state, action) => {
        state.billing = action.payload;
      })

      // ── processRefund ──
      .addCase(processRefund.pending, (state) => {
        state.refundLoading = true;
        state.refundError = null;
      })
      .addCase(processRefund.fulfilled, (state) => {
        state.refundLoading = false;
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.refundLoading = false;
        state.refundError = action.payload;
      });
  },
});

export const { clearPaymentsError } = paymentsSlice.actions;
export default paymentsSlice.reducer;

export const selectBilling              = (state) => state.payments.billing;
export const selectBillingLoading       = (state) => state.payments.loading;
export const selectBillingError         = (state) => state.payments.error;
export const selectCheckoutLoading      = (state) => state.payments.checkoutLoading;
export const selectCheckoutError        = (state) => state.payments.checkoutError;
export const selectPlans                = (state) => state.payments.plans;
export const selectPlansLoading         = (state) => state.payments.plansLoading;
export const selectPlansError           = (state) => state.payments.plansError;
export const selectCommissionLoading    = (state) => state.payments.commissionLoading;
export const selectCommissionError      = (state) => state.payments.commissionError;
export const selectOwnerDashboard       = (state) => state.payments.ownerDashboard;
export const selectOwnerDashboardLoading = (state) => state.payments.ownerDashboardLoading;
export const selectInvoices             = (state) => state.payments.invoices;
export const selectInvoicesLoading      = (state) => state.payments.invoicesLoading;
export const selectOwnerPayments        = (state) => state.payments.ownerPayments;
export const selectOwnerPaymentsLoading = (state) => state.payments.ownerPaymentsLoading;
export const selectPlanActionLoading    = (state) => state.payments.planActionLoading;
export const selectPlanActionError      = (state) => state.payments.planActionError;
export const selectRefundLoading        = (state) => state.payments.refundLoading;
export const selectRefundError          = (state) => state.payments.refundError;

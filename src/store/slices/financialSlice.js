import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchInvoices, fetchPayments } from '../../api/financials';

export const loadInvoices = createAsyncThunk(
  'financials/loadInvoices',
  async (filters, { rejectWithValue }) => {
    try {
      const res = await fetchInvoices(filters);
      return res?.invoices || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load invoices');
    }
  }
);

export const loadPayments = createAsyncThunk(
  'financials/loadPayments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchPayments();
      return res?.payments || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load payments');
    }
  }
);

const initialState = {
  invoices: [],
  payments: [],
  selectedInvoice: null,
  loading: false,
  error: null,
};

const financialSlice = createSlice({
  name: 'financials',
  initialState,
  reducers: {
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    setPayments: (state, action) => {
      state.payments = action.payload;
    },
    selectInvoice: (state, action) => {
      state.selectedInvoice = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(loadInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(loadPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setInvoices, setPayments, selectInvoice, setLoading, setError } = financialSlice.actions;
export default financialSlice.reducer;

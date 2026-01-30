import { createSlice } from '@reduxjs/toolkit';

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
});

export const { setInvoices, setPayments, selectInvoice, setLoading, setError } = financialSlice.actions;
export default financialSlice.reducer;

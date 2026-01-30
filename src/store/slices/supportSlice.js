import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    setTickets: (state, action) => {
      state.tickets = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    selectTicket: (state, action) => {
      state.selectedTicket = action.payload;
    },
    addTicket: (state, action) => {
      state.tickets.unshift(action.payload);
    },
    updateTicket: (state, action) => {
      const index = state.tickets.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setTickets, setLoading, selectTicket, addTicket, updateTicket, setError } = supportSlice.actions;
export default supportSlice.reducer;

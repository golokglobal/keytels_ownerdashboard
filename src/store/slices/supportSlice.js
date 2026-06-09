import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchTickets } from '../../api/support';

export const loadTickets = createAsyncThunk(
  'support/loadTickets',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await fetchTickets(filters);
      return response?.tickets || [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error || error.message || 'Failed to load tickets'
      );
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      .addCase(loadTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(loadTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTickets, setLoading, selectTicket, addTicket, updateTicket, setError } = supportSlice.actions;
export default supportSlice.reducer;

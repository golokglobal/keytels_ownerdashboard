import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchGuests } from '../../api/guests';

export const loadGuests = createAsyncThunk(
  'guests/loadGuests',
  async (hotelId, { rejectWithValue }) => {
    try {
      const guests = await fetchGuests(hotelId);
      return guests;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to load guests');
    }
  }
);

const initialState = {
  guests: [],
  selectedGuest: null,
  loading: false,
  error: null,
};

const guestSlice = createSlice({
  name: 'guests',
  initialState,
  reducers: {
    setGuests: (state, action) => {
      state.guests = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    selectGuest: (state, action) => {
      state.selectedGuest = action.payload;
    },
    updateGuest: (state, action) => {
      const index = state.guests.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.guests[index] = action.payload;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(loadGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setGuests, setLoading, selectGuest, updateGuest, setError } = guestSlice.actions;
export default guestSlice.reducer;

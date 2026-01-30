import { createSlice } from '@reduxjs/toolkit';

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
      state.guests = action.payload;
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
});

export const { setGuests, setLoading, selectGuest, updateGuest, setError } = guestSlice.actions;
export default guestSlice.reducer;

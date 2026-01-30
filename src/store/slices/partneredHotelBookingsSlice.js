// src/store/slices/partneredHotelBookingsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as partneredHotelsApi from '../../api/partneredHotelsApi.js';

// --- ASYNC THUNKS ---

/** POST: Create a new partnered hotel booking */
export const createPartneredHotelBooking = createAsyncThunk(
  'partneredHotelBookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      console.log('📤 Creating booking with data:', bookingData);
      const response = await partneredHotelsApi.createPartneredHotelBooking(bookingData);
      console.log('📥 Response from API:', response);
      return response;
    } catch (error) {
      console.error('🚨 Thunk error:', error.message);
      return rejectWithValue(error.message || 'Failed to create partnered hotel booking.');
    }
  }
);

// --- INITIAL STATE ---
const initialState = {
  list: [],
  currentBooking: null,
  paymentInfo: null,
  loading: 'idle',
  error: null,
  message: '',
};

// --- PARTNERED HOTEL BOOKINGS SLICE ---
const partneredHotelBookingsSlice = createSlice({
  name: 'partneredHotelBookings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = '';
    },
    clearPaymentInfo: (state) => {
      state.paymentInfo = null;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = 'pending';
      state.error = null;
      state.message = '';
    };

    const handleRejected = (state, action) => {
      state.loading = 'failed';
      state.error = action.payload || 'An unknown error occurred.';
    };

    builder
      // --- CREATE BOOKING Handlers ---
      .addCase(createPartneredHotelBooking.pending, handlePending)
      .addCase(createPartneredHotelBooking.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.message = 'Booking created successfully';
        if (action.payload) {
          // Add booking to the list (newest first)
          state.list.unshift(action.payload);
          // Store payment info for payment processing
          state.paymentInfo = action.payload;
          // Set as current booking
          state.currentBooking = action.payload;
        }
      })
      .addCase(createPartneredHotelBooking.rejected, handleRejected);
  },
});

export const { clearError, clearMessage, clearPaymentInfo, clearCurrentBooking } = partneredHotelBookingsSlice.actions;

export default partneredHotelBookingsSlice.reducer;

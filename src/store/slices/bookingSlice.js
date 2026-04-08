import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/bookings';

/* ============================ BOOKING THUNKS ============================ */

// Fetch all bookings for a hotel
export const fetchHotelBookings = createAsyncThunk(
  'bookings/fetchHotelBookings',
  async ({ hotelId, filters }, { rejectWithValue }) => {
    try {
      const response = await api.getHotelBookings(hotelId, filters);
      // Handle both array response and object with bookings property
      const bookingsData = Array.isArray(response) ? response : response.bookings || [];
      return bookingsData;
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

// Fetch single booking by ID
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.getBookingById(bookingId);
      return response;
    } catch (error) {
      console.error('❌ Error fetching booking:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

// Fetch today's check-ins
export const fetchTodayCheckIns = createAsyncThunk(
  'bookings/fetchTodayCheckIns',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.getTodayCheckIns(hotelId);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Error fetching today check-ins:', error);
      // Return empty array for 204 No Content
      if (error.response?.status === 204) return [];
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch check-ins');
    }
  }
);

// Fetch today's check-outs
export const fetchTodayCheckOuts = createAsyncThunk(
  'bookings/fetchTodayCheckOuts',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.getTodayCheckOuts(hotelId);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Error fetching today check-outs:', error);
      // Return empty array for 204 No Content
      if (error.response?.status === 204) return [];
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch check-outs');
    }
  }
);

// Check-in a booking
export const checkIn = createAsyncThunk(
  'bookings/checkIn',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.checkInBooking(bookingId);
      return response;
    } catch (error) {
      console.error('❌ Error checking in:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to check-in');
    }
  }
);

// Check-out a booking
export const checkOut = createAsyncThunk(
  'bookings/checkOut',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.checkOutBooking(bookingId);
      return response;
    } catch (error) {
      console.error('❌ Error checking out:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to check-out');
    }
  }
);

// Cancel a booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.cancelBooking(bookingId);
      return response;
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

// Fetch booking summary
export const fetchBookingSummary = createAsyncThunk(
  'bookings/fetchBookingSummary',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.getBookingSummary(hotelId);
      return response;
    } catch (error) {
      console.error('❌ Error fetching booking summary:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

// Process payment
export const processPayment = createAsyncThunk(
  'bookings/processPayment',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.processPayment(bookingId);
      return response;
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to process payment');
    }
  }
);

// Fetch hotel revenue
export const fetchHotelRevenue = createAsyncThunk(
  'bookings/fetchHotelRevenue',
  async ({ hotelId, fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await api.getHotelRevenue(hotelId, fromDate, toDate);
      return response;
    } catch (error) {
      console.error('❌ Error fetching revenue:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue');
    }
  }
);


// Fetch booking payment details
export const fetchBookingPaymentDetails = createAsyncThunk(
  'bookings/fetchBookingPaymentDetails',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.getBookingPaymentDetails(bookingId);
      return response;
    } catch (error) {
      console.error('❌ Error fetching payment details:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment details');
    }
  }
);


/* ============================ SLICE ============================ */

const initialState = {
  bookings: [],
  todayCheckIns: [],
  todayCheckOuts: [],
  selectedBooking: null,
  paymentDetails: null,
  summary: null,
  revenue: null,
  loading: false,
  checkInLoading: false,
  checkOutLoading: false,
  cancelLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    clearPaymentDetails: (state) => {
      state.paymentDetails = null;
    },
    clearBookingError: (state) => {
      state.error = null;
    },
    clearBookings: (state) => {
      state.bookings = [];
      state.todayCheckIns = [];
      state.todayCheckOuts = [];
      state.selectedBooking = null;
      state.summary = null;
      state.revenue = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────────────── FETCH HOTEL BOOKINGS ──────────────
      .addCase(fetchHotelBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchHotelBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH BOOKING BY ID ──────────────
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.selectedBooking = action.payload;
      })

      // ────────────── FETCH TODAY CHECK-INS ──────────────
      .addCase(fetchTodayCheckIns.fulfilled, (state, action) => {
        state.todayCheckIns = action.payload;
      })

      // ────────────── FETCH TODAY CHECK-OUTS ──────────────
      .addCase(fetchTodayCheckOuts.fulfilled, (state, action) => {
        state.todayCheckOuts = action.payload;
      })

      // ────────────── CHECK-IN ──────────────
      .addCase(checkIn.pending, (state) => {
        state.checkInLoading = true;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.checkInLoading = false;
        // Update booking in list
        const index = state.bookings.findIndex(b => b.bookingId === action.payload.bookingId);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        // Remove from todayCheckIns
        state.todayCheckIns = state.todayCheckIns.filter(b => b.bookingId !== action.payload.bookingId);
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload;
      })

      // ────────────── CHECK-OUT ──────────────
      .addCase(checkOut.pending, (state) => {
        state.checkOutLoading = true;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.checkOutLoading = false;
        // Update booking in list
        const index = state.bookings.findIndex(b => b.bookingId === action.payload.bookingId);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        // Remove from todayCheckOuts
        state.todayCheckOuts = state.todayCheckOuts.filter(b => b.bookingId !== action.payload.bookingId);
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.checkOutLoading = false;
        state.error = action.payload;
      })

      // ────────────── CANCEL BOOKING ──────────────
      .addCase(cancelBooking.pending, (state) => {
        state.cancelLoading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.cancelLoading = false;
        // Update booking in list
        const index = state.bookings.findIndex(b => b.bookingId === action.payload.bookingId);
        if (index !== -1) {
          state.bookings[index] = { ...state.bookings[index], ...action.payload };
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH BOOKING SUMMARY ──────────────
      .addCase(fetchBookingSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })

      // ────────────── PROCESS PAYMENT ──────────────
      .addCase(processPayment.fulfilled, (state, action) => {
        // Update booking in list
        const index = state.bookings.findIndex(b => b.bookingId === action.payload.bookingId);
        if (index !== -1) {
          state.bookings[index] = { ...state.bookings[index], ...action.payload };
        }
      })

      // ────────────── FETCH REVENUE ──────────────
      .addCase(fetchHotelRevenue.fulfilled, (state, action) => {
        state.revenue = action.payload;
      })

      // ────────────── FETCH PAYMENT DETAILS ──────────────
      .addCase(fetchBookingPaymentDetails.fulfilled, (state, action) => {
        state.paymentDetails = action.payload;
      });
  },
});

export const { setBookings, setSelectedBooking, clearPaymentDetails, clearBookingError, clearBookings } = bookingSlice.actions;
export default bookingSlice.reducer;

// Selectors
export const selectBookings = (state) => state.bookings.bookings;
export const selectTodayCheckIns = (state) => state.bookings.todayCheckIns;
export const selectTodayCheckOuts = (state) => state.bookings.todayCheckOuts;
export const selectSelectedBooking = (state) => state.bookings.selectedBooking;
export const selectPaymentDetails = (state) => state.bookings.paymentDetails;
export const selectBookingSummary = (state) => state.bookings.summary;
export const selectRevenue = (state) => state.bookings.revenue;
export const selectPaymentsTotal = (state) =>
  state.bookings.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
export const selectBookingsLoading = (state) => state.bookings.loading;
export const selectCheckInLoading = (state) => state.bookings.checkInLoading;
export const selectCheckOutLoading = (state) => state.bookings.checkOutLoading;
export const selectCancelLoading = (state) => state.bookings.cancelLoading;
export const selectBookingsError = (state) => state.bookings.error;

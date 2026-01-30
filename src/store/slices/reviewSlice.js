import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/reviews";

/* ============================ REVIEW THUNKS ============================ */

// Fetch all reviews for a hotel
export const fetchHotelReviews = createAsyncThunk(
  "reviews/fetchHotelReviews",
  async (hotelId, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching reviews for hotel:", hotelId);
      const response = await api.getHotelReviews(hotelId);
      console.log("✅ Reviews fetched:", response);
      // Handle both array response and object with reviews property
      const reviewsData = Array.isArray(response) ? response : response.reviews || [];
      return { hotelId, reviews: reviewsData };
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
    }
  }
);

// Fetch review summary for a hotel
export const fetchHotelReviewSummary = createAsyncThunk(
  "reviews/fetchHotelReviewSummary",
  async (hotelId, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching review summary for hotel:", hotelId);
      const response = await api.getHotelReviewSummary(hotelId);
      console.log("✅ Review summary fetched:", response);
      return { hotelId, summary: response };
    } catch (error) {
      console.error("❌ Error fetching review summary:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch review summary");
    }
  }
);

// Fetch dashboard reviews
export const fetchDashboardReviews = createAsyncThunk(
  "reviews/fetchDashboardReviews",
  async (hotelId, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching dashboard reviews for hotel:", hotelId);
      const response = await api.getHotelReviewsDashboard(hotelId);
      console.log("✅ Dashboard reviews fetched:", response);
      // Handle both array response and object with reviews property
      const reviewsData = Array.isArray(response) ? response : response.reviews || [];
      return { hotelId, reviews: reviewsData };
    } catch (error) {
      console.error("❌ Error fetching dashboard reviews:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard reviews");
    }
  }
);

// Update review status
export const updateReviewStatus = createAsyncThunk(
  "reviews/updateReviewStatus",
  async ({ hotelId, reviewId, status }, { rejectWithValue }) => {
    try {
      console.log(`🔄 Updating review ${reviewId} status to:`, status);
      const response = await api.updateReviewStatus(hotelId, reviewId, status);
      console.log("✅ Review status updated:", response);
      return response;
    } catch (error) {
      console.error("❌ Error updating review status:", error);
      return rejectWithValue(error.response?.data?.message || "Failed to update review status");
    }
  }
);

/* ============================ SLICE ============================ */

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [], // All reviews for current hotel
    dashboardReviews: [], // Limited reviews for dashboard
    summary: null, // Review summary with averages
    currentHotelId: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    clearReviews: (state) => {
      state.reviews = [];
      state.dashboardReviews = [];
      state.summary = null;
      state.currentHotelId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────────────── FETCH HOTEL REVIEWS ──────────────
      .addCase(fetchHotelReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.currentHotelId = action.payload.hotelId;
      })
      .addCase(fetchHotelReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH REVIEW SUMMARY ──────────────
      .addCase(fetchHotelReviewSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelReviewSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
      })
      .addCase(fetchHotelReviewSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH DASHBOARD REVIEWS ──────────────
      .addCase(fetchDashboardReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardReviews = action.payload.reviews;
      })
      .addCase(fetchDashboardReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── UPDATE REVIEW STATUS ──────────────
      .addCase(updateReviewStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReviewStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the review in both arrays
        const updatedReview = action.payload;

        const reviewIndex = state.reviews.findIndex(r => r.reviewId === updatedReview.reviewId);
        if (reviewIndex !== -1) {
          state.reviews[reviewIndex] = updatedReview;
        }

        const dashIndex = state.dashboardReviews.findIndex(r => r.reviewId === updatedReview.reviewId);
        if (dashIndex !== -1) {
          state.dashboardReviews[dashIndex] = updatedReview;
        }
      })
      .addCase(updateReviewStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviewError, clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;

// Selectors
export const selectReviews = (state) => state.reviews.reviews;
export const selectDashboardReviews = (state) => state.reviews.dashboardReviews;
export const selectReviewSummary = (state) => state.reviews.summary;
export const selectReviewsLoading = (state) => state.reviews.loading;
export const selectReviewsError = (state) => state.reviews.error;

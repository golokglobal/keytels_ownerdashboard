import api from "../config/axiosConfig";

/**
 * Reviews API Service
 * Base URL: http://localhost:8084/api/partneredhotel/{hotelId}/reviews
 */

// Get all reviews for a hotel
export const getHotelReviews = (hotelId) =>
  api.get(`/api/partneredhotel/${hotelId}/reviews`).then(res => res.data);

// Get review summary statistics for a hotel
export const getHotelReviewSummary = (hotelId) =>
  api.get(`/api/partneredhotel/${hotelId}/reviews/summary`).then(res => res.data);

// Get reviews for dashboard display
export const getHotelReviewsDashboard = (hotelId) =>
  api.get(`/api/partneredhotel/${hotelId}/reviews/dashboard`).then(res => res.data);

// Update review status (ACTIVE/HIDDEN)
export const updateReviewStatus = (hotelId, reviewId, status) =>
  api.put(`/api/partneredhotel/${hotelId}/reviews/${reviewId}/status`, { status }).then(res => res.data);

import api from "../config/axiosConfig";

/**
 * Bookings API Service
 * Base URL: http://localhost:8084/api
 */

// Get all bookings for a hotel with filters
export const getHotelBookings = (hotelId, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.bookingStatus) queryParams.append('bookingStatus', params.bookingStatus);
  if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
  if (params.refundStatus) queryParams.append('refundStatus', params.refundStatus);

  const queryString = queryParams.toString();
  const url = `/hotels/${hotelId}/bookings${queryString ? `?${queryString}` : ''}`;

  return api.get(url).then(res => res.data);
};

// Get single booking by ID
export const getBookingById = (bookingId) =>
  api.get(`/bookings/${bookingId}`).then(res => res.data);

// Get today's check-ins
export const getTodayCheckIns = (hotelId) =>
  api.get(`/hotels/${hotelId}/checkins/today`).then(res => res.data);

// Get today's check-outs
export const getTodayCheckOuts = (hotelId) =>
  api.get(`/hotels/${hotelId}/checkouts/today`).then(res => res.data);

// Check-in a booking (PUT as per API spec)
export const checkInBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/checkin`).then(res => res.data);

// Check-out a booking (PUT as per API spec)
export const checkOutBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/checkout`).then(res => res.data);

// Cancel a booking
export const cancelBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/cancel`).then(res => res.data);

// Get booking summary for a hotel
export const getBookingSummary = (hotelId) =>
  api.get(`/hotels/${hotelId}/bookings/summary`).then(res => res.data);

// Get booking payment details
export const getBookingPaymentDetails = (bookingId) =>
  api.get(`/bookings/${bookingId}/payment`).then(res => res.data);

// Process payment for a booking
export const processPayment = (bookingId) =>
  api.post(`/bookings/${bookingId}/payment`).then(res => res.data);

// Get hotel revenue for a date range
export const getHotelRevenue = (hotelId, fromDate, toDate) => {
  const params = new URLSearchParams({
    fromDate,
    toDate,
  });

  return api.get(`/hotels/${hotelId}/revenue?${params}`).then(res => res.data);
};

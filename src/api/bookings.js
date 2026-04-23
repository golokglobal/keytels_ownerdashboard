import api from '../config/axiosConfig';

// ─── Hotel Bookings List ──────────────────────────────────────────────────────

// GET /hotels/{hotelId}/bookings[?bookingStatus=&paymentStatus=&refundStatus=]
// Response: BookingDto[] {
//   bookingId, hotelId, roomId, userId, guestName, guestEmail,
//   checkInDate, checkOutDate, bookingStatus, paymentStatus, refundStatus,
//   totalAmount, currency, createdAt, updatedAt
// }
export const getHotelBookings = (hotelId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.bookingStatus) queryParams.append('bookingStatus', params.bookingStatus);
  if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
  if (params.refundStatus)  queryParams.append('refundStatus',  params.refundStatus);

  const qs  = queryParams.toString();
  const url = `/hotels/${hotelId}/bookings${qs ? `?${qs}` : ''}`;
  return api.get(url).then(res => res.data);
};

// ─── Single Booking (Hotel Management View) ───────────────────────────────────

// GET /hotel-bookings/{bookingId}
// Hotel-staff view of a booking (HOTEL_OWNER / HOTEL_MANAGER / HOTEL_STAFF)
// Response: same BookingDto shape as above, may include additional staff fields
export const getBookingById = (bookingId) =>
  api.get(`/hotel-bookings/${bookingId}`).then(res => res.data);

// ─── Today's Check-ins / Check-outs ──────────────────────────────────────────

// GET /hotels/{hotelId}/checkins/today
// Response: BookingDto[] — bookings with checkInDate = today
export const getTodayCheckIns = (hotelId) =>
  api.get(`/hotels/${hotelId}/checkins/today`).then(res => res.data);

// GET /hotels/{hotelId}/checkouts/today
// Response: BookingDto[] — bookings with checkOutDate = today
export const getTodayCheckOuts = (hotelId) =>
  api.get(`/hotels/${hotelId}/checkouts/today`).then(res => res.data);

// ─── Booking Status Updates ───────────────────────────────────────────────────

// PUT /bookings/{bookingId}/checkin
// Response: updated BookingDto with bookingStatus = CHECKED_IN
export const checkInBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/checkin`).then(res => res.data);

// PUT /bookings/{bookingId}/checkout
// Response: updated BookingDto with bookingStatus = CHECKED_OUT
export const checkOutBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/checkout`).then(res => res.data);

// PUT /bookings/{bookingId}/cancel
// Response: updated BookingDto with bookingStatus = CANCELLED
export const cancelBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/cancel`).then(res => res.data);

// ─── Booking Summary & Revenue ────────────────────────────────────────────────

// GET /hotels/{hotelId}/bookings/summary
// Response: {
//   totalBookings, confirmedBookings, pendingBookings, cancelledBookings,
//   checkedInToday, checkedOutToday, totalRevenue, averageBookingValue
// }
export const getBookingSummary = (hotelId) =>
  api.get(`/hotels/${hotelId}/bookings/summary`).then(res => res.data);

// GET /hotels/{hotelId}/revenue?fromDate=&toDate=
// Response: { hotelId, fromDate, toDate, totalRevenue, revenuePoints: [{ date, revenue }] }
export const getHotelRevenue = (hotelId, fromDate, toDate) => {
  const params = new URLSearchParams({ fromDate, toDate });
  return api.get(`/hotels/${hotelId}/revenue?${params}`).then(res => res.data);
};

// ─── Booking Payment ─────────────────────────────────────────────────────────

// GET /bookings/{bookingId}/payment
// Response: PaymentDto { paymentId, bookingId, userId, amount, currency,
//                        stripePaymentId, status, createdAt, updatedAt }
export const getBookingPaymentDetails = (bookingId) =>
  api.get(`/bookings/${bookingId}/payment`).then(res => res.data);

// POST /payments/create — create/charge payment for a booking
// Body:     { bookingId, userId, amount, currency }
// Response: PaymentDto
export const processPayment = ({ bookingId, userId, amount, currency = 'usd' }) =>
  api.post('/payments/create', { bookingId, userId, amount, currency }).then(res => res.data);

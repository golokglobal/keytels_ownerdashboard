import api from '../config/axiosConfig';

const getOwnerId = () => localStorage.getItem('userId');

// ─── Subscription Invoices ────────────────────────────────────────────────────

// GET /owner-billing/{ownerId}/invoices
// Response: SubscriptionInvoiceDto[] {
//   invoiceRecordId, ownerId, stripeInvoiceId, stripeSubscriptionId,
//   stripeCustomerId, invoiceNumber, status, currency,
//   amountDue, amountPaid, amountRemaining,
//   periodStart, periodEnd, nextPaymentAttempt,
//   hostedInvoiceUrl, invoicePdf, billingReason,
//   paidAt, failedAt, createdAt, updatedAt
// }
export const fetchInvoices = async (filters = {}) => {
  const ownerId = getOwnerId();
  if (!ownerId) throw new Error('No owner ID found in session');

  const response = await api.get(`/owner-billing/${ownerId}/invoices`);
  let invoices = Array.isArray(response.data) ? response.data : [];

  if (filters.status) {
    invoices = invoices.filter(inv => inv.status === filters.status);
  }

  return { success: true, invoices };
};

// Fetch a single invoice by its Stripe invoice ID or record ID from the cached list.
export const fetchInvoiceById = async (id) => {
  const { invoices } = await fetchInvoices();
  const invoice = invoices.find(
    inv => inv.invoiceRecordId === id || inv.stripeInvoiceId === id || inv.invoiceNumber === id
  );
  if (!invoice) throw new Error('Invoice not found');
  return { success: true, invoice };
};

// ─── Payments ─────────────────────────────────────────────────────────────────

// GET /owner-billing/{ownerId}/payments
// Response: PaymentDto[] {
//   paymentId, bookingId, userId, amount, currency,
//   stripePaymentId, status, createdAt, updatedAt
// }
export const fetchPayments = async () => {
  const ownerId = getOwnerId();
  if (!ownerId) throw new Error('No owner ID found in session');

  const response = await api.get(`/owner-billing/${ownerId}/payments`);
  const payments = Array.isArray(response.data) ? response.data : [];

  return { success: true, payments };
};

// ─── Revenue (hotel-level) ────────────────────────────────────────────────────

// GET /hotels/{hotelId}/revenue?fromDate=&toDate=
// Response: { hotelId, fromDate, toDate, totalRevenue, revenuePoints: [{ date, revenue }] }
export const fetchHotelRevenue = async (hotelId, fromDate, toDate) => {
  const params = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate)   params.toDate   = toDate;

  const response = await api.get(`/hotels/${hotelId}/revenue`, { params });
  return { success: true, data: response.data };
};

// ─── Booking Payments ─────────────────────────────────────────────────────────

// POST /payments/create
// Body:     { bookingId, userId, amount, currency }
// Response: { paymentId, bookingId, userId, amount, currency, stripePaymentId, status, createdAt }
export const createBookingPayment = async ({ bookingId, userId, amount, currency = 'usd' }) => {
  const response = await api.post('/payments/create', { bookingId, userId, amount, currency });
  return { success: true, payment: response.data };
};

// POST /payments/refund
// Body:     RefundRequestDto — refer to backend for exact shape
// Response: refund result object
export const refundPayment = async (refundData) => {
  const response = await api.post('/payments/refund', refundData);
  return { success: true, refund: response.data };
};

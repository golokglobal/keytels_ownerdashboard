import api from '../config/axiosConfig';

// ─── Owner Billing Status ─────────────────────────────────────────────────────

// GET /owner-billing/{ownerId}
// Response: OwnerBillingStatusDto {
//   ownerId, stripeAccountId, stripeCustomerId, subscriptionId,
//   subscriptionStatus, planCode, planName, currentPeriodStart, currentPeriodEnd,
//   cancelAtPeriodEnd, detailsSubmitted, chargesEnabled, payoutsEnabled, createdAt, updatedAt
// }
export const getOwnerBilling = async (ownerId) => {
  const response = await api.get(`/owner-billing/${ownerId}`);
  return response.data;
};

// ─── Owner Analytics Dashboard ────────────────────────────────────────────────

// GET /owner-billing/{ownerId}/dashboard?startDate=&endDate=
// Response: OwnerDashboardDto {
//   ownerId, ownerEmail, startDate, endDate, totalHotels, totalRevenue,
//   subscription (OwnerBillingStatusDto),
//   revenueByHotel: [{ hotelId, hotelName, revenue }],
//   dailyRevenue:   [{ date, revenue }],
//   monthlyRevenue: [{ date, revenue }]
// }
export const getOwnerDashboard = async (ownerId, startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate)   params.endDate   = endDate;

  const response = await api.get(`/owner-billing/${ownerId}/dashboard`, { params });
  return response.data;
};

// ─── Subscription Invoices & Payments ────────────────────────────────────────

// GET /owner-billing/{ownerId}/invoices
// Response: SubscriptionInvoiceDto[] {
//   invoiceRecordId, ownerId, stripeInvoiceId, stripeSubscriptionId,
//   invoiceNumber, status, currency, amountDue, amountPaid, amountRemaining,
//   periodStart, periodEnd, hostedInvoiceUrl, invoicePdf, paidAt, createdAt
// }
export const getOwnerInvoices = async (ownerId) => {
  const response = await api.get(`/owner-billing/${ownerId}/invoices`);
  return Array.isArray(response.data) ? response.data : [];
};

// GET /owner-billing/{ownerId}/payments
// Response: PaymentDto[] {
//   paymentId, bookingId, userId, amount, currency,
//   stripePaymentId, status, createdAt, updatedAt
// }
export const getOwnerPayments = async (ownerId) => {
  const response = await api.get(`/owner-billing/${ownerId}/payments`);
  return Array.isArray(response.data) ? response.data : [];
};

// ─── Subscription Plans ───────────────────────────────────────────────────────

// GET /owner-billing/plans
// Response: OwnerSubscriptionPlanDto[] {
//   planCode, planName, description, priceMonthly, priceYearly,
//   commissionRate, maxHotels, features: []
// }
export const listSubscriptionPlans = async () => {
  const response = await api.get('/owner-billing/plans');
  return Array.isArray(response.data) ? response.data : [];
};

// ─── Subscription Actions ─────────────────────────────────────────────────────

// POST /owner-billing/subscriptions/checkout
// Body:     { ownerId, planCode, priceId?, couponCode?, currentPropertyCount?, successUrl, cancelUrl }
// Response: OwnerSubscriptionCheckoutResponseDto { checkoutUrl, sessionId }
export const createSubscriptionCheckout = async ({ ownerId, planCode, priceId, couponCode, currentPropertyCount }) => {
  const base = window.location.origin;
  const response = await api.post('/owner-billing/subscriptions/checkout', {
    ownerId,
    planCode,
    ...(priceId          ? { priceId }          : {}),
    ...(couponCode       ? { couponCode }        : {}),
    ...(currentPropertyCount != null ? { currentPropertyCount } : {}),
    successUrl: `${base}/payment-success`,
    cancelUrl:  `${base}/choose-plan`,
  });
  return response.data;
};

// POST /owner-billing/subscriptions/change-plan
// Body:     { ownerId, planCode, priceId?, currentPropertyCount? }
// Response: OwnerBillingStatusDto (updated billing status)
export const changeSubscriptionPlan = async ({ ownerId, planCode, priceId, newPlanCode, newPriceId, currentPropertyCount }) => {
  const resolvedPlanCode = planCode ?? newPlanCode;
  const resolvedPriceId  = priceId  ?? newPriceId;
  if (!resolvedPlanCode) {
    throw new Error("planCode is required");
  }
  const response = await api.post('/owner-billing/subscriptions/change-plan', {
    ownerId,
    planCode: resolvedPlanCode,
    ...(resolvedPriceId      ? { priceId: resolvedPriceId }   : {}),
    ...(currentPropertyCount != null ? { currentPropertyCount } : {}),
  });
  return response.data;
};

// POST /owner-billing/subscriptions/cancel
// Body:     { ownerId, cancelImmediately?, reason? }
// Response: OwnerBillingStatusDto (updated billing status)
export const cancelSubscription = async ({ ownerId, cancelImmediately = false, reason }) => {
  const response = await api.post('/owner-billing/subscriptions/cancel', {
    ownerId,
    cancelAtPeriodEnd: !cancelImmediately,
    ...(reason ? { reason } : {}),
  });
  return response.data;
};

// ─── Booking Payments ─────────────────────────────────────────────────────────

// POST /payments/create
// Body:     { bookingId, userId, amount, currency }
// Response: PaymentDto { paymentId, bookingId, userId, amount, currency, stripePaymentId, status, createdAt }
export const createPaymentWithCommission = async ({ bookingId, userId, amount, currency = 'usd' }) => {
  const response = await api.post('/payments/create', { bookingId, userId, amount, currency });
  return response.data;
};

// POST /payments/refund
// Body:     RefundRequestDto (bookingId, paymentId, amount, reason)
// Response: refund result object
export const refundPayment = async (refundData) => {
  const response = await api.post('/payments/refund', refundData);
  return response.data;
};

// ─── Checkout Sync (webhook-independent) ─────────────────────────────────────

// POST /owner-billing/{ownerId}/sync-checkout?sessionId=xxx
// Retrieves the Stripe session and updates subscriptionId + status in DB without needing a webhook.
export const syncCheckout = async (ownerId, sessionId) => {
  const response = await api.post(`/owner-billing/${ownerId}/sync-checkout?sessionId=${encodeURIComponent(sessionId)}`);
  return response.data;
};

// ─── Property Subscription Adjustments ───────────────────────────────────────

// POST /owner-billing/{ownerId}/add-property
// Called automatically by duffel-service on hotel create; can also be called directly.
// Response: OwnerBillingStatusDto
export const addPropertyToSubscription = async (ownerId) => {
  const response = await api.post(`/owner-billing/${ownerId}/add-property`);
  return response.data;
};

// POST /owner-billing/{ownerId}/remove-property
// Called automatically by duffel-service on hotel delete; can also be called directly.
// Response: OwnerBillingStatusDto
export const removePropertyFromSubscription = async (ownerId) => {
  const response = await api.post(`/owner-billing/${ownerId}/remove-property`);
  return response.data;
};

// ─── Owner Billing Provision ──────────────────────────────────────────────────

// POST /owner-billing/provision
// Body:     { ownerId, firstName, lastName, email, refreshUrl, returnUrl }
// Response: OwnerBillingProvisionResponseDto { stripeAccountId, onboardingUrl }
export const provisionOwnerBilling = async ({ ownerId, email, firstName, lastName, refreshUrl, returnUrl }) => {
  const base = window.location.origin;
  const response = await api.post('/owner-billing/provision', {
    ownerId,
    email,
    firstName,
    lastName,
    refreshUrl: refreshUrl || `${base}/subscription`,
    returnUrl:  returnUrl  || `${base}/subscription`,
  });
  return response.data;
};

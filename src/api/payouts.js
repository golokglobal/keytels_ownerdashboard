import api from '../config/axiosConfig';

/**
 * Payout API Service for Hotel Owners
 * Manages payout requests to transfer funds from platform to hotel owner
 */

// ─── Send Payout ──────────────────────────────────────────────────────────────

/**
 * Request a payout to hotel owner's connected Stripe account
 * POST /payouts/send
 * Body: {
 *   hotelOwnerId: UUID,
 *   stripeAccountId: string,
 *   amount: number,
 *   currency: string (default: 'usd'),
 *   firstName: string,
 *   lastName: string,
 *   description?: string
 * }
 * Response: {
 *   payoutId: string,
 *   amount: number,
 *   currency: string,
 *   status: string,
 *   arrivalDate: number (timestamp),
 *   message: string
 * }
 */
export const sendPayout = async ({
  hotelOwnerId,
  stripeAccountId,
  amount,
  currency = 'usd',
  firstName,
  lastName,
  description
}) => {
  if (!hotelOwnerId) throw new Error('Hotel owner ID is required');
  if (!stripeAccountId) throw new Error('Stripe account ID is required');
  if (!amount || amount <= 0) throw new Error('Valid payout amount is required');
  if (!firstName || !lastName) throw new Error('Owner name is required');

  try {
    const payload = {
      hotelOwnerId,
      stripeAccountId,
      amount,
      currency,
      firstName,
      lastName,
      ...(description && { description })
    };

    console.log('📤 REQUEST [POST /payouts/send]:', payload);
    const response = await api.post('/payouts/send', payload);
    console.log('📥 RESPONSE:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ ERROR [POST /payouts/send]:', error.response || error);
    throw error;
  }
};

/**
 * Get payout history for an owner
 * Note: This endpoint would need to be added to backend if not exists
 * GET /owner-billing/{ownerId}/payouts
 * Response: [{
 *   payoutId, amount, currency, status, created, arrivalDate, method, description
 * }]
 */
export const getOwnerPayoutHistory = async (ownerId) => {
  if (!ownerId) throw new Error('Owner ID is required');

  try {
    console.log(`📤 REQUEST [GET /owner-billing/${ownerId}/payouts]`);
    const response = await api.get(`/owner-billing/${ownerId}/payouts`);
    console.log('📥 RESPONSE:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array
    if (error.response?.status === 404) {
      console.warn('⚠️ Payout history endpoint not yet implemented');
      return [];
    }
    console.error(`❌ ERROR [GET /owner-billing/${ownerId}/payouts]:`, error.response || error);
    throw error;
  }
};

/**
 * Get a one-time Stripe Express dashboard login link.
 * For Express/Standard accounts, owners manage bank accounts on Stripe directly.
 * GET /owner-billing/{ownerId}/stripe-dashboard
 */
export const getStripeDashboardLink = async (ownerId) => {
  if (!ownerId) throw new Error('Owner ID is required');
  try {
    const response = await api.get(`/owner-billing/${ownerId}/stripe-dashboard`);
    return response.data; // { status: "redirect", dashboardUrl: "..." }
  } catch (error) {
    console.error(`❌ ERROR [GET /owner-billing/${ownerId}/stripe-dashboard]:`, error.response || error);
    throw error;
  }
};

/**
 * List all external bank accounts linked to the owner's Stripe Connect account.
 * GET /owner-billing/{ownerId}/bank-accounts
 */
export const getOwnerBankAccounts = async (ownerId) => {
  if (!ownerId) throw new Error('Owner ID is required');
  try {
    const response = await api.get(`/owner-billing/${ownerId}/bank-accounts`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    console.error(`❌ ERROR [GET /owner-billing/${ownerId}/bank-accounts]:`, error.response || error);
    throw error;
  }
};

/**
 * Add a new external bank account to the owner's Stripe Connect account.
 * POST /owner-billing/{ownerId}/bank-accounts
 * @param {string} ownerId
 * @param {{ country, currency, accountNumber, routingNumber, accountHolderName, accountHolderType, setDefault }} bankDetails
 */
export const addOwnerBankAccount = async (ownerId, bankDetails) => {
  if (!ownerId) throw new Error('Owner ID is required');
  try {
    const response = await api.post(`/owner-billing/${ownerId}/bank-accounts`, bankDetails);
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [POST /owner-billing/${ownerId}/bank-accounts]:`, error.response || error);
    throw error;
  }
};

/**
 * Withdraw the owner's full available balance to a specific bank account.
 * POST /owner-billing/{ownerId}/withdraw-to
 * @param {string} ownerId
 * @param {string} bankAccountId  Stripe ba_xxx ID
 */
export const withdrawToSpecificAccount = async (ownerId, bankAccountId) => {
  if (!ownerId) throw new Error('Owner ID is required');
  if (!bankAccountId) throw new Error('Bank account ID is required');
  try {
    const response = await api.post(`/owner-billing/${ownerId}/withdraw-to`, { bankAccountId });
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [POST /owner-billing/${ownerId}/withdraw-to]:`, error.response || error);
    throw error;
  }
};

/**
 * Payout status constants
 */
export const PAYOUT_STATUS = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'canceled'
};

export default {
  sendPayout,
  getOwnerPayoutHistory,
  getOwnerBankAccounts,
  addOwnerBankAccount,
  withdrawToSpecificAccount,
  getStripeDashboardLink,
  PAYOUT_STATUS
};

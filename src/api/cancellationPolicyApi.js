import api from "./api";

/**
 * Cancellation Policy API Service for Hotel Owners
 * Manages cancellation policies and refund rules
 */

/**
 * Create a new cancellation policy for a hotel
 * POST /api/hotels/{hotelId}/cancellation-policies
 * Body: CancellationPolicyDto
 * Returns: CancellationPolicyDto
 */
export const createCancellationPolicy = async (hotelId, policyData) => {
  if (!hotelId) throw new Error("Hotel ID is required");
  if (!policyData) throw new Error("Policy data is required");

  try {
    console.log(`📤 REQUEST [POST /hotels/${hotelId}/cancellation-policies]:`, policyData);
    const response = await api.post(`/hotels/${hotelId}/cancellation-policies`, policyData);
    console.log("📥 RESPONSE:", response);
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [POST /hotels/${hotelId}/cancellation-policies]:`, error.response || error);
    throw error;
  }
};

/**
 * Get all cancellation policies for a hotel
 * GET /api/hotels/{hotelId}/cancellation-policies?activeOnly=false
 * Returns: [CancellationPolicyDto]
 */
export const getHotelCancellationPolicies = async (hotelId, activeOnly = false) => {
  if (!hotelId) throw new Error("Hotel ID is required");

  try {
    console.log(`📤 REQUEST [GET /hotels/${hotelId}/cancellation-policies]`);
    const response = await api.get(`/hotels/${hotelId}/cancellation-policies`, {
      params: { activeOnly }
    });
    console.log("📥 RESPONSE:", response);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`❌ ERROR [GET /hotels/${hotelId}/cancellation-policies]:`, error.response || error);
    return [];
  }
};

/**
 * Get a specific cancellation policy by ID
 * GET /api/cancellation-policies/{policyId}
 * Returns: CancellationPolicyDto
 */
export const getCancellationPolicy = async (policyId) => {
  if (!policyId) throw new Error("Policy ID is required");

  try {
    console.log(`📤 REQUEST [GET /cancellation-policies/${policyId}]`);
    const response = await api.get(`/cancellation-policies/${policyId}`);
    console.log("📥 RESPONSE:", response);
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [GET /cancellation-policies/${policyId}]:`, error.response || error);
    throw error;
  }
};

/**
 * Update an existing cancellation policy
 * PUT /api/cancellation-policies/{policyId}
 * Body: CancellationPolicyDto
 * Returns: CancellationPolicyDto
 */
export const updateCancellationPolicy = async (policyId, policyData) => {
  if (!policyId) throw new Error("Policy ID is required");
  if (!policyData) throw new Error("Policy data is required");

  try {
    console.log(`📤 REQUEST [PUT /cancellation-policies/${policyId}]:`, policyData);
    const response = await api.put(`/cancellation-policies/${policyId}`, policyData);
    console.log("📥 RESPONSE:", response);
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [PUT /cancellation-policies/${policyId}]:`, error.response || error);
    throw error;
  }
};

/**
 * Delete (deactivate) a cancellation policy
 * DELETE /api/cancellation-policies/{policyId}
 * Returns: void
 */
export const deleteCancellationPolicy = async (policyId) => {
  if (!policyId) throw new Error("Policy ID is required");

  try {
    console.log(`📤 REQUEST [DELETE /cancellation-policies/${policyId}]`);
    const response = await api.delete(`/cancellation-policies/${policyId}`);
    console.log("📥 RESPONSE:", response);
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [DELETE /cancellation-policies/${policyId}]:`, error.response || error);
    throw error;
  }
};

/**
 * Calculate refund for a booking based on policy
 * POST /api/cancellation-policies/{policyId}/calculate-refund
 * Params: { checkInDate, bookingAmount }
 * Returns: RefundCalculationDto
 */
export const calculateRefund = async (policyId, checkInDate, bookingAmount) => {
  if (!policyId) throw new Error("Policy ID is required");
  if (!checkInDate) throw new Error("Check-in date is required");
  if (!bookingAmount) throw new Error("Booking amount is required");

  try {
    console.log(`📤 REQUEST [POST /cancellation-policies/${policyId}/calculate-refund]`);
    const response = await api.post(`/cancellation-policies/${policyId}/calculate-refund`, null, {
      params: { checkInDate, bookingAmount }
    });
    console.log("📥 RESPONSE:", response);
    return response.data;
  } catch (error) {
    console.error(`❌ ERROR [POST /cancellation-policies/${policyId}/calculate-refund]:`, error.response || error);
    throw error;
  }
};

/**
 * Policy type constants
 */
export const POLICY_TYPES = {
  FLEXIBLE: "FLEXIBLE",
  MODERATE: "MODERATE",
  STRICT: "STRICT",
  NON_REFUNDABLE: "NON_REFUNDABLE",
  CUSTOM: "CUSTOM"
};

/**
 * Default policy templates
 */
export const POLICY_TEMPLATES = {
  FLEXIBLE: {
    policyName: "Flexible",
    policyType: "FLEXIBLE",
    fullRefundEnabled: true,
    fullRefundDaysBefore: 1,
    partialRefundEnabled: false,
    refundProcessingFee: 0,
    policyDescription: "Full refund if cancelled at least 24 hours before check-in"
  },
  MODERATE: {
    policyName: "Moderate",
    policyType: "MODERATE",
    fullRefundEnabled: true,
    fullRefundDaysBefore: 5,
    partialRefundEnabled: true,
    partialRefundPercentage: 50,
    partialRefundDaysBefore: 2,
    refundProcessingFee: 10,
    policyDescription: "Full refund 5+ days before, 50% refund 2-5 days before, no refund within 2 days"
  },
  STRICT: {
    policyName: "Strict",
    policyType: "STRICT",
    fullRefundEnabled: true,
    fullRefundDaysBefore: 14,
    partialRefundEnabled: true,
    partialRefundPercentage: 50,
    partialRefundDaysBefore: 7,
    refundProcessingFee: 25,
    policyDescription: "Full refund 14+ days before, 50% refund 7-14 days before, no refund within 7 days"
  },
  NON_REFUNDABLE: {
    policyName: "Non-Refundable",
    policyType: "NON_REFUNDABLE",
    fullRefundEnabled: false,
    partialRefundEnabled: false,
    refundProcessingFee: 0,
    policyDescription: "No refunds under any circumstances"
  }
};

export default {
  createCancellationPolicy,
  getHotelCancellationPolicies,
  getCancellationPolicy,
  updateCancellationPolicy,
  deleteCancellationPolicy,
  calculateRefund,
  POLICY_TYPES,
  POLICY_TEMPLATES
};

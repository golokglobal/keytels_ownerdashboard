import api from '../config/axiosConfig';

// Base URL is already /api — do NOT prefix with /api here
export const getOwnerBilling = async (ownerId) => {
  const response = await api.get(`/owner-billing/${ownerId}`);
  return response.data;
};

export const createSubscriptionCheckout = async ({ ownerId, priceId }) => {
  const response = await api.post('/owner-billing/subscriptions/checkout', {
    ownerId,
    priceId,
  });
  return response.data;
};

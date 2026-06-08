import api from '../config/axiosConfig';

// All support ticket endpoints go to admin-service (port 8082) via /api/support-tickets
// Proxied in vite.config.js: /api/support-tickets → http://localhost:8082

const BASE = '/support-tickets';

/**
 * Fetch tickets relevant to this owner:
 * - Tickets they raised (about payout/billing/platform)
 * - Tickets about their hotel assigned to them (room/facility issues from guests)
 * Optional: pass hotelId to also fetch hotel-assigned tickets
 */
export const fetchTickets = async (filters = {}) => {
  const endpoint = filters.hotelId
    ? `${BASE}/hotel?hotelId=${filters.hotelId}`
    : `${BASE}/mine`;
  const res = await api.get(endpoint);
  let tickets = Array.isArray(res.data) ? res.data : [];
  if (filters.status) {
    tickets = tickets.filter(t => t.status?.toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.priority) {
    tickets = tickets.filter(t => t.priority?.toLowerCase() === filters.priority.toLowerCase());
  }
  return { success: true, tickets };
};

export const fetchTicketById = async (id) => {
  const res = await api.get(`${BASE}/${id}`);
  return { success: true, ticket: res.data };
};

/**
 * Owner submits a ticket. Category determines routing:
 * - PAYOUT / BILLING / PLATFORM / OTHER → Admin handles
 * - ROOM / HOTEL_ISSUE / MAINTENANCE + hotelId → Owner handles (their hotel, for guest-raised tickets)
 *
 * Body: { subject, description, category, priority?, hotelId? }
 */
export const createTicket = async (ticketData) => {
  const res = await api.post(BASE, ticketData);
  return { success: true, ticket: res.data };
};

export const updateTicket = async (id, updates) => {
  // Owners can't update tickets in the unified system — updates are done by admin
  // This is kept for UI compatibility (status update for owner-side tickets)
  const res = await api.patch(`${BASE}/${id}/status`, { status: updates.status });
  return { success: true, ticket: res.data };
};

export const updateTicketStatus = async (id, status) => {
  const res = await api.patch(`${BASE}/${id}/status`, { status });
  return { success: true, ticket: res.data };
};

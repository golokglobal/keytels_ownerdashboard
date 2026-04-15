import api from "../config/axiosConfig";

/**
 * Staff API Service
 * Base URL: http://localhost:8083/staff
 */

// Create new hotel staff member (HOTEL_STAFF role)
// POST /staff — payload: { name, email, role, password, hotelId, permissionName }
export const createStaff = (staffData) =>
  api.post('/staff', staffData).then(res => res.data);

// Get all staff (for current user's hotel, based on token)
export const getAllStaff = () =>
  api.get('/staff').then(res => res.data);

// Get all staff for a specific hotel (HOTEL_STAFF only)
export const getHotelStaff = (hotelId) =>
  api.get(`/staff/hotel/${hotelId}`).then(res => res.data);

// Get single staff member by ID
export const getStaffById = (staffId) =>
  api.get(`/staff/${staffId}`).then(res => res.data);

// Update staff member
export const updateStaff = (staffId, staffData) =>
  api.put(`/staff/${staffId}`, staffData).then(res => res.data);

// Delete staff member
export const deleteStaff = (staffId) =>
  api.delete(`/staff/${staffId}`).then(res => res.data);

// Get staff filtered by role for a specific hotel
export const getStaffByRoleAndHotel = (role, hotelId) =>
  api.get(`/staff/role/${role}/hotel/${hotelId}`).then(res => res.data);

/* ─────────────────────────────────────────────────────────
 * Hotel Manager API  (GET/POST/PUT/DELETE /hotel-managers)
 * ───────────────────────────────────────────────────────── */

// GET /hotel-managers — list all hotel managers
export const getAllManagers = () =>
  api.get('/hotel-managers').then(res => res.data);

// POST /staff/hotel-managers/create — create a hotel manager (role must be HOTEL_MANAGER)
export const createManager = (managerData) =>
  api.post('/staff/hotel-managers/create', managerData).then(res => res.data);

// GET /hotel-managers/{id} — get one hotel manager
export const getManagerById = (managerId) =>
  api.get(`/hotel-managers/${managerId}`).then(res => res.data);

// PUT /hotel-managers/{id} — update a hotel manager
export const updateManager = (managerId, managerData) =>
  api.put(`/hotel-managers/${managerId}`, managerData).then(res => res.data);

// DELETE /hotel-managers/{id} — delete a hotel manager
export const deleteManager = (managerId) =>
  api.delete(`/hotel-managers/${managerId}`).then(res => res.data);

// GET /hotel-managers/hotel/{hotelId} — list managers for one hotel
export const getHotelManagers = (hotelId) =>
  api.get(`/hotel-managers/hotel/${hotelId}`).then(res => res.data);

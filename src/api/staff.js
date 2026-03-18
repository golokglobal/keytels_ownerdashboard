import api from "../config/axiosConfig";

/**
 * Staff API Service
 * Base URL: http://localhost:8083/staff
 */

// Create new hotel staff member (HOTEL_STAFF role)
// POST /staff — payload: { name, email, role, password, hotelId, permissionName }
export const createStaff = (staffData) =>
  api.post('/staff', staffData).then(res => res.data);

// Create new hotel manager (HOTEL_MANAGER role)
// POST /staff/hotel-managers/create — payload: { name, email, role, password, hotelId }
export const createManager = (managerData) =>
  api.post('/staff/hotel-managers/create', managerData).then(res => res.data);

// Get all staff (for current user's hotel, based on token)
export const getAllStaff = () =>
  api.get('/staff').then(res => res.data);

// Get all staff for a specific hotel
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

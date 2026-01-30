import api from "../config/axiosConfig";

/**
 * Staff API Service
 * Base URL: http://localhost:8083/api/staff
 */

// Create new staff member
export const createStaff = (staffData) =>
  api.post('/api/staff', staffData).then(res => res.data);

// Get all staff for a hotel
export const getHotelStaff = (hotelId) =>
  api.get(`/api/staff/hotel/${hotelId}`).then(res => res.data);

// Get single staff member by ID
export const getStaffById = (staffId) =>
  api.get(`/api/staff/${staffId}`).then(res => res.data);

// Update staff member
export const updateStaff = (staffId, staffData) =>
  api.put(`/api/staff/${staffId}`, staffData).then(res => res.data);

// Delete staff member
export const deleteStaff = (staffId) =>
  api.delete(`/api/staff/${staffId}`).then(res => res.data);

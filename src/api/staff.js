import api from "../config/axiosConfig";

/**
 * Staff API Service
 * Base URL: http://localhost:8083/staff
 */

// Create new staff member
export const createStaff = (staffData) =>
  api.post('/staff', staffData).then(res => res.data);

// Get all staff for a hotel
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

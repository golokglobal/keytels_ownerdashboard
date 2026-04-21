import api from '../config/axiosConfig';

// ─── Hotel Staff (HOTEL_STAFF role) ──────────────────────────────────────────
// All endpoints require HOTEL_OWNER role in JWT.

// POST /staff
// Body:     StaffRequest { name, email, password, role: "HOTEL_STAFF", hotelId, permissionName? }
// Response: { message, staff: StaffResponse, timestamp }
//           StaffResponse { id, name, email, role, hotelId, status, createdAt }
export const createStaff = (staffData) =>
  api.post('/staff', staffData).then(res => res.data);

// GET /staff  — returns HOTEL_STAFF members only (backend filters)
// Response: StaffResponse[]
export const getAllStaff = () =>
  api.get('/staff').then(res => res.data);

// GET /staff/hotel/{hotelId}  — HOTEL_STAFF for a specific hotel
// Response: StaffResponse[]
export const getHotelStaff = (hotelId) =>
  api.get(`/staff/hotel/${hotelId}`).then(res => res.data);

// GET /staff/{id}  — single HOTEL_STAFF member
// Response: StaffResponse
export const getStaffById = (staffId) =>
  api.get(`/staff/${staffId}`).then(res => res.data);

// PUT /staff/{id}
// Body:     StaffRequest (role must remain HOTEL_STAFF)
// Response: { message, staff: StaffResponse, timestamp }
export const updateStaff = (staffId, staffData) =>
  api.put(`/staff/${staffId}`, staffData).then(res => res.data);

// DELETE /staff/{id}
// Response: { message, staffId, timestamp }
export const deleteStaff = (staffId) =>
  api.delete(`/staff/${staffId}`).then(res => res.data);

// GET /staff/role/{role}/hotel/{hotelId}
// NOTE: backend only returns HOTEL_STAFF regardless of role param.
//       Use getHotelManagers() below to list managers.
export const getStaffByRoleAndHotel = (role, hotelId) =>
  api.get(`/staff/role/${role}/hotel/${hotelId}`).then(res => res.data);

// ─── Hotel Managers (HOTEL_MANAGER role) ─────────────────────────────────────
// Create via staff-service (HOTEL_OWNER role required).
// List / update / delete managers requires ADMIN role (admin-service).
// If the logged-in user is not an admin, GET/PUT/DELETE calls below will return 403.

// POST /staff/hotel-managers/create
// Body:     StaffRequest { name, email, password, role: "HOTEL_MANAGER", hotelId, permissionName? }
// Response: { message, hotelManager: StaffResponse, timestamp }
export const createManager = (managerData) =>
  api.post('/staff/hotel-managers/create', {
    ...managerData,
    role: 'HOTEL_MANAGER',
  }).then(res => res.data);

// GET /admin/hotel-managers  — requires ADMIN role
// Response: StaffResponse[]
export const getAllManagers = () =>
  api.get('/admin/hotel-managers').then(res => res.data);

// GET /admin/hotel-managers/{id}  — requires ADMIN role
// Response: StaffResponse
export const getManagerById = (managerId) =>
  api.get(`/admin/hotel-managers/${managerId}`).then(res => res.data);

// PUT /admin/hotel-managers/{id}  — requires ADMIN role
// Body:     StaffRequest
// Response: StaffResponse
export const updateManager = (managerId, managerData) =>
  api.put(`/admin/hotel-managers/${managerId}`, managerData).then(res => res.data);

// DELETE /admin/hotel-managers/{id}  — requires ADMIN role
// Response: 204 No Content
export const deleteManager = (managerId) =>
  api.delete(`/admin/hotel-managers/${managerId}`).then(res => res.data);

// GET /admin/hotel-managers/hotel/{hotelId}  — requires ADMIN role
// Response: StaffResponse[]
export const getHotelManagers = (hotelId) =>
  api.get(`/admin/hotel-managers/hotel/${hotelId}`).then(res => res.data);

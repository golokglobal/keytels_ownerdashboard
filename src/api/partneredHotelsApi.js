import api from "../config/axiosConfig";

/* ============================ OWNER HOTELS ============================ */

// Get all hotels belonging to the authenticated owner
export const getOwnerHotels = (page = 0, size = 50) =>
  api.get(`/partneredhotel/owners/hotels?page=${page}&size=${size}`).then(res => res.data);

/* ============================ HOTELS ============================ */

// Create Hotel (owner info embedded in payload)
export const createPartneredHotel = (data) =>
  api.post("/partneredhotel/create", data).then(res => res.data);

// Get Hotel by ID
export const getPartneredHotelById = (hotelId) =>
  api.get(`/partneredhotel/${hotelId}`).then(res => res.data);

// Update Hotel
export const updatePartneredHotel = (hotelId, data) =>
  api.put(`/partneredhotel/update/${hotelId}`, data).then(res => res.data);

// Deactivate Hotel
export const deactivatePartneredHotel = (hotelId) =>
  api.delete(`/partneredhotel/${hotelId}`).then(res => res.data);


/* ============================ ROOMS ============================ */

// Create Room
export const createRoom = (hotelId, data) =>
  api.post(`/partneredhotel/${hotelId}/rooms`, data).then(res => res.data);

// Get Rooms by Hotel
export const getRoomsByHotel = (hotelId, available = true) =>
  api.get(`/partneredhotel/${hotelId}/rooms${available ? "?available=true" : ""}`).then(res => res.data);

// Get Room by ID
export const getRoomById = (roomId) =>
  api.get(`/partneredhotel/rooms/${roomId}`).then(res => res.data);

// Update Room
export const updateRoom = (roomId, data) =>
  api.put(`/partneredhotel/rooms/${roomId}`, data).then(res => res.data);

// Delete Room
export const deleteRoom = (roomId) =>
  api.delete(`/partneredhotel/rooms/${roomId}`).then(res => res.data);


/* ============================ BOOKINGS ============================ */

// Create a booking
export const createPartneredHotelBooking = (bookingData) =>
  api.post('/bookings', bookingData).then(res => res.data);


/* ============================ ROOM IMAGES ============================ */

// Get Room Images (204 No Content when empty → return [])
export const getRoomImages = (roomId) =>
  api.get(`/partneredhotel/rooms/${roomId}/images`).then(res => res.data ?? []).catch(err => {
    if (err.response?.status === 204) return [];
    throw err;
  });

// Upload Room Image
export const uploadRoomImage = (roomId, data) =>
  api.post(`/partneredhotel/rooms/${roomId}/images`, data).then(res => res.data);

// Delete Room Image
export const deleteRoomImage = (imageId) =>
  api.delete(`/partneredhotel/rooms/images/${imageId}`).then(res => res.data);

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
export const getRoomsByHotel = (hotelId) =>
  api.get(`/partneredhotel/${hotelId}/rooms`).then(res => res.data);

// Get Room by ID
export const getRoomById = (roomId) =>
  api.get(`/partneredhotel/rooms/${roomId}`).then(res => res.data);

// Update Room
export const updateRoom = (roomId, data) =>
  api.put(`/partneredhotel/rooms/${roomId}`, data).then(res => res.data);

// Delete Room
export const deleteRoom = (roomId) =>
  api.delete(`/partneredhotel/rooms/${roomId}`).then(res => res.data);


/* ============================ HOTEL IMAGES ============================ */

// GET /partneredhotel/{hotelId}/images → [{ imageId, imageUrl }]
export const getHotelImages = (hotelId) =>
  api.get(`/partneredhotel/${hotelId}/images`)
    .then(res => Array.isArray(res.data) ? res.data : [])
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/{hotelId}/images  multipart/form-data (field: "file") → { imageId, imageUrl }
export const uploadHotelImage = (hotelId, formData) =>
  api.post(`/partneredhotel/${hotelId}/images`, formData).then(res => res.data);

// GET /partneredhotel/hotel-images/{imageId}/download → binary / redirect
export const downloadHotelImage = (imageId) =>
  api.get(`/partneredhotel/hotel-images/${imageId}/download`, { responseType: 'blob' })
    .then(res => res.data);

// DELETE /partneredhotel/hotel-images/{imageId} → { message }
export const deleteHotelImage = (imageId) =>
  api.delete(`/partneredhotel/hotel-images/${imageId}`).then(res => res.data);


/* ============================ BOOKINGS ============================ */

// Create a booking
export const createPartneredHotelBooking = (bookingData) =>
  api.post('/bookings', bookingData).then(res => res.data);


/* ============================ ROOM IMAGES ============================ */

// GET /partneredhotel/rooms/{roomId}/images → [{ imageId, imageUrl }]
export const getRoomImages = (roomId) =>
  api.get(`/partneredhotel/rooms/${roomId}/images`)
    .then(res => Array.isArray(res.data) ? res.data : [])
    .catch(err => {
      if (err.response?.status === 204) return [];
      throw err;
    });

// POST /partneredhotel/rooms/{roomId}/images  multipart/form-data (field: "file")
// → { imageId, imageUrl }
export const uploadRoomImage = (roomId, formData) =>
  api.post(`/partneredhotel/rooms/${roomId}/images`, formData).then(res => res.data);

// GET /partneredhotel/rooms/images/{imageId}/download → binary (used for explicit download)
export const downloadRoomImage = (imageId) =>
  api.get(`/partneredhotel/rooms/images/${imageId}/download`, { responseType: 'blob' })
    .then(res => res.data);

// DELETE /partneredhotel/rooms/images/{imageId} → { message }
export const deleteRoomImage = (imageId) =>
  api.delete(`/partneredhotel/rooms/images/${imageId}`).then(res => res.data);

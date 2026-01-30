  import api from "../config/axiosConfig";

  /* ============================ HOTELS ============================ */

  // Get all hotels for the logged-in owner
  export const getAllOwnerHotels = () =>
    api.get("/api/partneredhotel/owner/hotels").then(res => res.data);

  // Create Hotel
  export const createPartneredHotel = (data) =>
    api.post("/api/partneredhotel/create", data).then(res => res.data);

  // Get Hotel by ID
  export const getPartneredHotelById = (hotelId) =>
    api.get(`/api/partneredhotel/${hotelId}`).then(res => res.data);

  // Update Hotel
  export const updatePartneredHotel = (hotelId, data) =>
    api.put(`/api/partneredhotel/${hotelId}`, data).then(res => res.data);

  // Delete Hotel
  export const deletePartneredHotel = (hotelId) =>
    api.delete(`/api/partneredhotel/${hotelId}`).then(res => res.data);


  /* ============================ ROOMS ============================ */

  // Create Room
  export const createRoom = (hotelId, data) =>
    api.post(`/api/partneredhotel/${hotelId}/rooms`, data).then(res => res.data);

  // Get Rooms by Hotel
  export const getRoomsByHotel = (hotelId) =>
    api.get(`/api/partneredhotel/${hotelId}/rooms`).then(res => res.data);

  // Get Room by ID
  export const getRoomById = (roomId) =>
    api.get(`/api/partneredhotel/rooms/${roomId}`).then(res => res.data);

  // Update Room
  export const updateRoom = (roomId, data) =>
    api.put(`/api/partneredhotel/rooms/${roomId}`, data).then(res => res.data);

  // Delete Room
  export const deleteRoom = (roomId) =>
    api.delete(`/api/partneredhotel/rooms/${roomId}`).then(res => res.data);


  /* ============================ ROOM IMAGES ============================ */

  // Get Room Images
  export const getRoomImages = (roomId) =>
    api.get(`/api/partneredhotel/rooms/${roomId}/images`).then(res => res.data);

  // Upload Room Image
  export const uploadRoomImage = (roomId, data) =>
    api.post(`/api/partneredhotel/rooms/${roomId}/images`, data).then(res => res.data);

  // Delete Room Image
  export const deleteRoomImage = (imageId) =>
    api.delete(`/api/partneredhotel/rooms/images/${imageId}`).then(res => res.data);
 
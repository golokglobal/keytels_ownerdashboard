import api from '../config/axiosConfig';

// GET /partneredhotel/getAll  — aggregates all hotels then extracts their rooms
// Response: HotelDto[] (each with rooms array)
export const getAllRooms = async () => {
  try {
    const response = await api.get('/partneredhotel/getAll');
    const hotels = Array.isArray(response.data) ? response.data : [];
    return hotels.flatMap(hotel => hotel.rooms || []);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};

// GET /partneredhotel/{hotelId}/rooms[?available=&checkIn=&checkOut=&adults=]
// Response: RoomDto[] {
//   roomId, hotelId, roomType, bedType, description, capacity, totalRooms,
//   pricePerNight, isAvailable, status, cancellationPolicy, images
// }
export const getRoomsByHotelId = async (hotelId) => {
  try {
    const response = await api.get(`/partneredhotel/${hotelId}/rooms`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response?.status === 204) return [];
    throw new Error(error.response?.data?.message || `Failed to fetch rooms for hotel ${hotelId}`);
  }
};

// GET /partneredhotel/rooms/{roomId}
// Response: RoomDto
export const getRoomById = async (roomId) => {
  try {
    const response = await api.get(`/partneredhotel/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || `Failed to fetch room ${roomId}`);
  }
};

// POST /partneredhotel/{hotelId}/rooms  — HOTEL_OWNER / HOTEL_MANAGER / ADMIN
// Body:     RoomDto { roomType, bedType, description, capacity, totalRooms,
//                     pricePerNight, isAvailable, status, cancellationPolicy }
// Response: RoomDto with roomId populated (HTTP 201)
export const createRoom = async (hotelId, roomData) => {
  if (!hotelId) throw new Error('hotelId is required to create a room');
  try {
    const response = await api.post(`/partneredhotel/${hotelId}/rooms`, roomData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create room');
  }
};

// PUT /partneredhotel/rooms/{roomId}  — HOTEL_OWNER / HOTEL_MANAGER / ADMIN
// Body:     RoomDto (full update)
// Response: updated RoomDto (HTTP 200)
export const updateRoom = async (roomId, roomData) => {
  if (!roomId) throw new Error('roomId is required to update a room');
  try {
    const response = await api.put(`/partneredhotel/rooms/${roomId}`, roomData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || `Failed to update room ${roomId}`);
  }
};

// DELETE /partneredhotel/rooms/{roomId}  — HOTEL_OWNER / HOTEL_MANAGER / ADMIN
// Response: 200/204
export const deleteRoom = async (roomId) => {
  if (!roomId) throw new Error('roomId is required to delete a room');
  try {
    const response = await api.delete(`/partneredhotel/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || `Failed to delete room ${roomId}`);
  }
};

// Update room availability/status via a full PUT (no PATCH endpoint exists in backend).
// Fetches the current room first, then sends full RoomDto with the new status/availability.
export const updateRoomStatus = async (roomId, status) => {
  if (!roomId) throw new Error('roomId is required');
  const current = await getRoomById(roomId);
  const updated = await updateRoom(roomId, { ...current, status });
  return updated;
};

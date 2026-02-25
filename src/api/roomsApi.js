import api from '../config/axiosConfig';

// Use centralized axios instance
const roomsApi = api;

// Fetch all rooms from all hotels
export const getAllRooms = async () => {
  try {
    const response = await roomsApi.get('/partneredhotel/getAll');
    console.log('All hotels fetched:', response.data);

    // Extract all rooms from all hotels
    const hotels = Array.isArray(response.data) ? response.data : [];
    const allRooms = hotels.flatMap(hotel => hotel.rooms || []);

    console.log(`Total rooms from ${hotels.length} hotels:`, allRooms.length);
    return allRooms;
  } catch (error) {
    console.error('Error fetching all rooms:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};

// Fetch rooms by hotel ID - gets hotel data and extracts rooms array
export const getRoomsByHotelId = async (hotelId) => {
  try {
    console.log(`🔍 Fetching hotel and rooms for hotel ID: ${hotelId}`);

    // Fetch hotel data which includes rooms
    const response = await roomsApi.get(`/partneredhotel/${hotelId}`);
    console.log('✅ Hotel data fetched successfully:', response.data);

    // Extract rooms array from hotel data
    const hotel = response.data;
    const rooms = hotel.rooms || [];

    console.log(`📦 Found ${rooms.length} rooms for hotel:`, rooms);
    return rooms;
  } catch (error) {
    console.error(`❌ Error fetching rooms for hotel ${hotelId}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      fullURL: error.config?.baseURL + error.config?.url,
    });
    throw new Error(error.response?.data?.message || error.message || `Failed to fetch rooms for hotel ID ${hotelId}`);
  }
};

// Fetch a single room by ID
export const getRoomById = async (id) => {
  try {
    const response = await roomsApi.get(`/partneredhotel/rooms/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching room ${id}:`, error);
    throw new Error(error.response?.data?.message || `Failed to fetch room ID ${id}`);
  }
};

// Create a new room
// Note: If rooms are nested in hotels, you may need to update the hotel instead
export const createRoom = async (roomData) => {
  try {
    console.log('Creating room with data:', roomData);
    // Try creating via partnered hotel update endpoint
    // You may need to adjust this based on your backend structure
    const response = await roomsApi.post('/partneredhotel/create', roomData);
    console.log('Room created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating room:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw new Error(error.response?.data?.message || error.message || 'Failed to create room');
  }
};

// Update an existing room by ID
// Since rooms are nested in hotels, we need to update the hotel
export const updateRoom = async (roomId, roomData) => {
  try {
    console.log(`Updating room ${roomId} with data:`, roomData);

    // Get the hotel ID from the room data
    const hotelId = roomData.hotelId || roomData.partneredHotelId;

    if (!hotelId) {
      throw new Error('Hotel ID not found in room data. Cannot update room.');
    }

    // Fetch the current hotel data
    console.log(`Fetching hotel ${hotelId} to update room...`);
    const hotelResponse = await roomsApi.get(`/${hotelId}`);
    const hotel = hotelResponse.data;

    // Find and update the room in the rooms array
    const roomIndex = hotel.rooms.findIndex(r => r.id === roomId);

    if (roomIndex === -1) {
      throw new Error(`Room ${roomId} not found in hotel ${hotelId}`);
    }

    // Update the room
    hotel.rooms[roomIndex] = { ...hotel.rooms[roomIndex], ...roomData };

    // Update the hotel with the modified rooms array
    console.log(`Updating hotel ${hotelId} with modified room data...`);
    const response = await roomsApi.put(`/partneredhotel/update/${hotelId}`, hotel);
    console.log('Room updated successfully via hotel update:', response.data);

    return response.data;
  } catch (error) {
    console.error(`Error updating room ${roomId}:`, error);
    throw new Error(error.response?.data?.message || error.message || `Failed to update room ID ${roomId}`);
  }
};

// Delete a room by ID
// Since rooms are nested in hotels, we need to update the hotel
export const deleteRoom = async (roomId, hotelId) => {
  try {
    console.log(`Deleting room ${roomId} from hotel ${hotelId}`);

    if (!hotelId) {
      throw new Error('Hotel ID is required to delete a room.');
    }

    // Fetch the current hotel data
    console.log(`Fetching hotel ${hotelId} to delete room...`);
    const hotelResponse = await roomsApi.get(`/${hotelId}`);
    const hotel = hotelResponse.data;

    // Filter out the room to delete
    const updatedRooms = hotel.rooms.filter(r => r.id !== roomId);

    if (updatedRooms.length === hotel.rooms.length) {
      throw new Error(`Room ${roomId} not found in hotel ${hotelId}`);
    }

    // Update the hotel with the room removed
    hotel.rooms = updatedRooms;

    console.log(`Updating hotel ${hotelId} with room ${roomId} removed...`);
    const response = await roomsApi.put(`/partneredhotel/update/${hotelId}`, hotel);
    console.log('Room deleted successfully via hotel update:', response.data);

    return response.data;
  } catch (error) {
    console.error(`Error deleting room ${roomId}:`, error);
    throw new Error(error.response?.data?.message || error.message || `Failed to delete room ID ${roomId}`);
  }
};

// Update room status
export const updateRoomStatus = async (id, status) => {
  try {
    const response = await roomsApi.patch(`/partneredhotel/${id}/status`, { status });
    console.log('Room status updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating room status for ${id}:`, error);
    throw new Error(error.response?.data?.message || `Failed to update room status for ID ${id}`);
  }
};

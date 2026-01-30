import api from '../config/axiosConfig';

// Use centralized axios instance
const hotelApi = api;

// Get all partnered hotels
export const fetchAllHotels = async () => {
  try {
    const response = await hotelApi.get('/partneredhotel/getAll');
    return {
      success: true,
      hotels: response.data,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch hotels');
  }
};

// Get hotel by ID
export const fetchHotelById = async (hotelId) => {
  try {
    const response = await hotelApi.get(`/partneredhotel/${hotelId}`);
    return {
      success: true,
      hotel: response.data,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch hotel');
  }
};

// Create new partnered hotel
export const createHotel = async (hotelData) => {
  try {
    const response = await hotelApi.post('/partneredhotel/create', hotelData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create hotel');
  }
};

// Update hotel
export const updateHotel = async (hotelId, hotelData) => {
  try {
    const response = await hotelApi.put(`/partneredhotel/update/${hotelId}`, hotelData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update hotel');
  }
};

// Delete hotel
export const deleteHotel = async (hotelId) => {
  try {
    const response = await hotelApi.delete(`/partneredhotel/${hotelId}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete hotel');
  }
};

// Get all rooms from a hotel
export const fetchRoomsByHotelId = async (hotelId) => {
  try {
    const response = await hotelApi.get(`/partneredhotel/${hotelId}`);
    return {
      success: true,
      rooms: response.data.rooms || [],
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};

// Helper function to get rooms from all hotels
export const fetchAllRooms = async () => {
  try {
    const hotelsResponse = await fetchAllHotels();
    const allRooms = [];

    hotelsResponse.hotels.forEach(hotel => {
      if (hotel.rooms && hotel.rooms.length > 0) {
        hotel.rooms.forEach(room => {
          allRooms.push({
            ...room,
            hotelId: hotel.id,
            hotelName: hotel.hotelName,
            city: hotel.city,
            state: hotel.state,
          });
        });
      }
    });

    return {
      success: true,
      rooms: allRooms,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};

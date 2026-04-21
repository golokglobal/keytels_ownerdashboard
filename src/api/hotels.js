import api from '../config/axiosConfig';

/**
 * Hotel API — endpoints per official spec:
 *   POST /api/partneredhotel/create          — Create Hotel
 *   PUT  /api/partneredhotel/update/{id}     — Update Hotel
 *   GET  /api/partneredhotel/{hotelId}        — Get Hotel by ID
 *   GET  /api/partneredhotel/getAll           — Get all hotels
 *   DELETE /api/partneredhotel/{hotelId}      — Deactivate Hotel
 *
 * Request/Response DTO: PartneredHotelDto
 *   name, description, location, propertyType, latitude, longitude,
 *   brandId, isPartnered, discountPercentage, status, amenities,
 *   minPrice, imageUrl, policies, hotelImages, ownerPlan, priorityListing
 *
 * Note: For HOTEL_OWNER — do NOT send owner field (JWT resolves it).
 *       For ADMIN — send owner: { ownerId: "<uuid>" }.
 */

// Get all partnered hotels
export const fetchAllHotels = async () => {
  try {
    const response = await api.get('/partneredhotel/getAll');
    return { success: true, hotels: Array.isArray(response.data) ? response.data : [] };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch hotels');
  }
};

// Get hotel by ID (includes nested rooms and hotelImages)
export const fetchHotelById = async (hotelId) => {
  try {
    const response = await api.get(`/partneredhotel/${hotelId}`);
    return { success: true, hotel: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch hotel');
  }
};

/**
 * Create a new partnered hotel
 * POST /api/partneredhotel/create
 * Body: PartneredHotelDto (owner field omitted — JWT resolves it for HOTEL_OWNER)
 * Response: { message, hotelId }
 */
export const createHotel = async (hotelData) => {
  try {
    const response = await api.post('/partneredhotel/create', hotelData);
    return { success: true, data: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create hotel');
  }
};

/**
 * Update an existing hotel
 * PUT /api/partneredhotel/update/{hotelId}
 * Body: PartneredHotelDto
 * Response: { message, hotelId }
 */
export const updateHotel = async (hotelId, hotelData) => {
  try {
    const response = await api.put(`/partneredhotel/update/${hotelId}`, hotelData);
    return { success: true, data: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update hotel');
  }
};

// Deactivate hotel
export const deleteHotel = async (hotelId) => {
  try {
    const response = await api.delete(`/partneredhotel/${hotelId}`);
    return { success: true, message: response.data?.message };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to deactivate hotel');
  }
};

// Get rooms for a hotel (via dedicated rooms endpoint)
export const fetchRoomsByHotelId = async (hotelId) => {
  try {
    const response = await api.get(`/partneredhotel/${hotelId}/rooms`);
    return { success: true, rooms: Array.isArray(response.data) ? response.data : [] };
  } catch (error) {
    if (error.response?.status === 204) return { success: true, rooms: [] };
    throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
  }
};

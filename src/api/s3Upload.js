/**
 * S3 upload helpers — send files to backend endpoints.
 * The backend receives the file, uploads to the appropriate
 * S3 path (hotels/ | rooms/ | users/) and returns the URL.
 */
import api from '../config/axiosConfig';

/**
 * Upload a hotel image file.
 * POST /partneredhotel/{hotelId}/images   multipart/form-data
 * Returns: string (public S3 URL)
 */
export const uploadHotelImageFile = async (hotelId, file) => {
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await api.post(`/partneredhotel/${hotelId}/images`, fd);
  return data?.imageUrl || data?.url || data;
};

/**
 * Upload a room image file.
 * POST /partneredhotel/rooms/{roomId}/images   multipart/form-data
 * Returns: { imageId, imageUrl }
 */
export const uploadRoomImageFile = async (roomId, file) => {
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await api.post(`/partneredhotel/rooms/${roomId}/images`, fd);
  return data; // { imageId, imageUrl }
};

/**
 * Upload a user profile photo file.
 * POST /users/profile/photo   multipart/form-data
 * Returns: string (public S3 URL)
 */
export const uploadUserPhotoFile = async (file) => {
  const fd = new FormData();
  fd.append('photo', file);
  const { data } = await api.post('/users/profile/photo', fd);
  return data?.profileImageUrl || data?.imageUrl || data?.url || data;
};

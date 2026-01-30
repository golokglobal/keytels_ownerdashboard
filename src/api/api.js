// This file is deprecated - use ../config/axiosConfig.js instead
// Kept for backward compatibility
import api from '../config/axiosConfig';
export const API_BASE_URL = api.defaults.baseURL;

export default api;

// Simulated network delay for mock APIs (if needed)
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API error handler
export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    // Server responded with error
    return {
      success: false,
      message: error.response.data?.message || error.response.statusText || 'Something went wrong',
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      message: 'No response from server. Please check your connection.',
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'Something went wrong',
    };
  }
};

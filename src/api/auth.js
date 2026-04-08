// ============================================================================
// FILE 3: src/api/auth.js
// ============================================================================
import api, { setTokenCache, clearTokenCache } from '../config/axiosConfig';

export const loginApi = async (endpoint, payload) => {
  try {
    console.log("=================== LOGIN REQUEST ===================");
    console.log("🔹 Endpoint:", endpoint);
    console.log("🔹 Payload:", JSON.stringify(payload, null, 2));
    console.log("🔹 Base URL:", api.defaults.baseURL);
    console.log("====================================================");

    const response = await api.post(endpoint, payload);

    console.log("=================== LOGIN RESPONSE ==================");
    console.log("✅ Status:", response.status);
    console.log("✅ Data:", JSON.stringify(response.data, null, 2));
    console.log("====================================================");

    const { user, accessToken, refreshToken, tokenType, expiresIn } = response.data;

    if (!user || !accessToken) {
      throw new Error("Invalid response from server: missing user or accessToken");
    }

    // Store session
    setTokenCache(accessToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken || "");
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userId", user.id || user._id || "");
    localStorage.setItem("userRole", user.role || "");

    // Staff / Manager: single hotelId
    if (user.hotelId) {
      localStorage.setItem("hotelId", user.hotelId);
      localStorage.setItem("hotelIds", JSON.stringify([user.hotelId]));
    }

    // Owner: hotels array
    if (user.hotels?.length > 0) {
      const ids = user.hotels.map(h => h._id || h.partneredHotelId || h.id).filter(Boolean);
      localStorage.setItem("hotelIds", JSON.stringify(ids));
      if (ids[0]) localStorage.setItem("hotelId", ids[0]);
    }

    console.log("✅ Login successful! User:", user.username, "Role:", user.role);

    return {
      user,
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
    };
  } catch (error) {
    console.log("=================== LOGIN ERROR ====================");
    console.log("❌ Status:", error.response?.status);
    console.log("❌ Status Text:", error.response?.statusText);
    console.log("❌ Backend Error:", JSON.stringify(error.response?.data, null, 2));
    console.log("❌ Request URL:", error.config?.url);
    console.log("❌ Request Method:", error.config?.method?.toUpperCase());
    console.log("❌ Request Data:", error.config?.data);
    console.log("❌ Request Headers:", JSON.stringify(error.config?.headers, null, 2));
    console.log("====================================================");

    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Invalid credentials";

    throw new Error(msg);
  }
};

export const registerApi = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return {
      success: true,
      user: response.data.user,
      token: response.data.accessToken,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const forgotPasswordApi = async (email) => {
  try {
    const response = await api.post('/users/forgot-password', { email });
    return {
      success: true,
      message: response.data.message || 'Password reset link sent to your email',
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send reset link');
  }
};

export const logoutApi = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/users/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    clearTokenCache();
    localStorage.clear();
    return { success: true };
  }
};

export const getUserByUsername = async (username) => {
  try {
    const response = await api.get(`/users/username/${username}`);
    return { success: true, user: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'User not found');
  }
};

export const getUserByEmail = async (email) => {
  try {
    const response = await api.get(`/users/email/${email}`);
    return { success: true, user: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'User not found');
  }
};

export const getTokenInfo = async () => {
  try {
    const response = await api.get('/users/token-info');
    return { success: true, tokenInfo: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get token info');
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getUserRole = () => localStorage.getItem('userRole');

export const getProfileApi = async () => {
  try {
    const response = await api.get('/users/profile');
    localStorage.setItem('user', JSON.stringify(response.data));
    return { success: true, user: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

export const updateProfileApi = async (profileData) => {
  try {
    const response = await api.put('/users/profile', profileData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return { success: true, user: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to update profile');
  }
};

export const uploadProfilePhotoApi = async (photoUrl) => {
  try {
    if (typeof photoUrl !== 'string' || !photoUrl.trim()) {
      throw new Error('Photo URL must be a valid string');
    }
    if (photoUrl.startsWith('data:')) {
      throw new Error('Please use an actual image URL (http:// or https://), not base64');
    }

    const response = await api.put('/users/profile/photo', null, {
      params: { photoUrl },
    });

    localStorage.setItem('user', JSON.stringify(response.data));
    return { success: true, user: response.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile photo');
  }
};

export const getOwnerWallet = async () => {
  const response = await api.get('/owners/wallet');
  return response.data;
};

export const changePasswordApi = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await api.put('/users/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return {
      success: true,
      message: response.data.message || 'Password changed successfully',
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

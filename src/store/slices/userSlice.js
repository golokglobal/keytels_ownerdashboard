// src/store/slices/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginApi,
  registerApi,
  logoutApi,
  getProfileApi,
  updateProfileApi,
  uploadProfilePhotoApi,
  changePasswordApi,
  getUserByUsername,
  getUserByEmail,
} from "../../api/auth";

// ── THUNKS ────────────────────────────────────────────────────────────────
export const signupUser = createAsyncThunk(
  "user/signupUser",
  async (
    { username, email, password, firstName, lastName, phoneNumber },
    { rejectWithValue }
  ) => {
    try {
      const response = await registerApi({
        username,
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Sign up failed");
    }
  }
);

export const signinUser = createAsyncThunk(
  "user/signinUser",
  async ({ username, password, role }, { rejectWithValue }) => {
    try {
      // All staff (including managers) use the same login endpoint
      const endpoint = "/api/staff/login";
      console.log("[SIGNIN] → endpoint:", endpoint, "username:", username, "role:", role);
      const response = await loginApi(endpoint, { username, password });
      return response;
    } catch (error) {
      console.error("[SIGNIN] Failed:", error);
      return rejectWithValue(error.message || "Invalid credentials");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getProfileApi();
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch current user");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async ({ firstName, lastName, phoneNumber }, { rejectWithValue }) => {
    try {
      const response = await updateProfileApi({ firstName, lastName, phoneNumber });
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update profile");
    }
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  "user/uploadProfilePhoto",
  async (photoUrl, { rejectWithValue }) => {
    try {
      const response = await uploadProfilePhotoApi(photoUrl);
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update profile photo");
    }
  }
);

export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (
    { currentPassword, newPassword, confirmPassword },
    { rejectWithValue }
  ) => {
    try {
      const response = await changePasswordApi(
        currentPassword,
        newPassword,
        confirmPassword
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to change password");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      return true;
    } catch (error) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const fetchUserByUsername = createAsyncThunk(
  "user/fetchUserByUsername",
  async (username, { rejectWithValue }) => {
    try {
      const response = await getUserByUsername(username);
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || "User not found");
    }
  }
);

export const fetchUserByEmail = createAsyncThunk(
  "user/fetchUserByEmail",
  async (email, { rejectWithValue }) => {
    try {
      const response = await getUserByEmail(email);
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || "User not found");
    }
  }
);

// ── SLICE ─────────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  userId: localStorage.getItem("userId") || null,
  userRole: localStorage.getItem("userRole") || null,
  hotelId: localStorage.getItem("hotelId") || null,          // legacy single id
  hotelIds: JSON.parse(localStorage.getItem("hotelIds") || "[]"), // preferred array
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    restoreUser: (state) => {
      const userStr = localStorage.getItem("user");
      const accessToken = localStorage.getItem("accessToken");

      if (userStr && accessToken) {
        try {
          const user = JSON.parse(userStr);
          state.user = user;
          state.userId = user.id || user._id || null;
          state.userRole = user.role || null;

          // Hotel IDs priority: stored array > user.hotels > legacy hotelId
          let hotelIds = JSON.parse(localStorage.getItem("hotelIds") || "[]");

          if (hotelIds.length === 0 && user.hotels?.length > 0) {
            hotelIds = user.hotels
              .map(h => h._id || h.partneredHotelId || h.id)
              .filter(Boolean);
            if (hotelIds.length > 0) {
              localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
            }
          }

          if (hotelIds.length === 0) {
            const legacyId = user.hotelId || localStorage.getItem("hotelId");
            if (legacyId) {
              hotelIds = [legacyId];
              localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
            }
          }

          state.hotelIds = hotelIds;
          state.hotelId = hotelIds[0] || null;

          state.accessToken = accessToken;
          state.refreshToken = localStorage.getItem("refreshToken") || null;
          state.isAuthenticated = true;

          localStorage.setItem("userId", state.userId || "");
          localStorage.setItem("userRole", state.userRole || "");
          localStorage.setItem("hotelId", state.hotelId || "");
        } catch (err) {
          console.error("Failed to restore user from localStorage", err);
          localStorage.clear();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // SIGNUP
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload;
        state.user = user;
        state.accessToken = token;
        state.userId = user?.id || user?._id || null;
        state.userRole = user?.role || null;
        state.hotelId = user?.hotelId || null;
        state.hotelIds = user?.hotels?.map(h => h._id || h.partneredHotelId || h.id).filter(Boolean) || [];
        state.isAuthenticated = true;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", token || "");
        localStorage.setItem("userId", state.userId || "");
        localStorage.setItem("userRole", state.userRole || "");
        if (state.hotelIds.length > 0) {
          localStorage.setItem("hotelIds", JSON.stringify(state.hotelIds));
          localStorage.setItem("hotelId", state.hotelIds[0]);
        }
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SIGNIN
      .addCase(signinUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signinUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.userId = user?.id || user?._id || null;
        state.userRole = user?.role || null;
        state.hotelId = user?.hotelId || null;

        // Prefer array from backend if available
        state.hotelIds = user?.hotels?.map(h => h._id || h.partneredHotelId || h.id).filter(Boolean) || [];

        state.isAuthenticated = true;
        state.error = null;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken || "");
        localStorage.setItem("refreshToken", refreshToken || "");
        localStorage.setItem("userId", state.userId || "");
        localStorage.setItem("userRole", state.userRole || "");

        if (state.hotelIds.length > 0) {
          localStorage.setItem("hotelIds", JSON.stringify(state.hotelIds));
          localStorage.setItem("hotelId", state.hotelIds[0]);
        } else if (state.hotelId) {
          localStorage.setItem("hotelIds", JSON.stringify([state.hotelId]));
        }
      })
      .addCase(signinUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ... (keep your other cases: fetchCurrentUser, updateProfile, logoutUser, etc.)

      // Generic matchers
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || "Operation failed";
        }
      );
  },
});

export const { clearError, restoreUser } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.user.user;
export const selectUserId = (state) => state.user.userId;
export const selectUserRole = (state) => state.user.userRole;
export const selectHotelIds = (state) => state.user.hotelIds || [];
export const selectPrimaryHotelId = (state) => state.user.hotelId || state.user.hotelIds?.[0] || null;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectIsHotelManager = (state) =>
  ["HOTELMANAGER", "manager"].includes(state.user.userRole);
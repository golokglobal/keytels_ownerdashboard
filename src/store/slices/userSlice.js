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
  getOwnerWallet,
  getOwnerProfileApi,
  updateOwnerProfileApi,
  changeOwnerPasswordApi,
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
      const endpoint = "/staff/login";
      const response = await loginApi(endpoint, { username, password });
      return response;
    } catch (error) {
      console.error("[SIGNIN] Failed:", error);
      return rejectWithValue(error.message || "Invalid credentials");
    }
  }
);

export const signinOwner = createAsyncThunk(
  "user/signinOwner",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const endpoint = "/owners/login";
      const response = await loginApi(endpoint, { username, password });
      return response;
    } catch (error) {
      console.error("[OWNER SIGNIN] Failed:", error);
      return rejectWithValue(error.message || "Invalid credentials");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { rejectWithValue, getState }) => {
    try {
      const role = getState().user.userRole;
      const response = role === "HOTEL_OWNER"
        ? await getOwnerProfileApi()
        : await getProfileApi();
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch current user");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async ({ firstName, lastName, phoneNumber }, { rejectWithValue, getState }) => {
    try {
      const role = getState().user.userRole;
      const response = role === "HOTEL_OWNER"
        ? await updateOwnerProfileApi({ firstName, lastName, phoneNumber })
        : await updateProfileApi({ firstName, lastName, phoneNumber });
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
    { rejectWithValue, getState }
  ) => {
    try {
      const role = getState().user.userRole;
      const response = role === "HOTEL_OWNER"
        ? await changeOwnerPasswordApi(currentPassword, newPassword, confirmPassword)
        : await changePasswordApi(currentPassword, newPassword, confirmPassword);
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

export const fetchOwnerWallet = createAsyncThunk(
  "user/fetchOwnerWallet",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getOwnerWallet();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch wallet data"
      );
    }
  }
);

// ── SLICE ─────────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  userId: localStorage.getItem("userId") || null,
  userRole: localStorage.getItem("userRole") || null,
  permission: JSON.parse(localStorage.getItem("userPermission") || "null"), // staff permission
  hotelId: localStorage.getItem("hotelId") || null,          // legacy single id
  hotelIds: JSON.parse(localStorage.getItem("hotelIds") || "[]"), // preferred array
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,
  wallet: null,
  walletLoading: false,
  walletError: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveHotelId: (state, action) => {
      state.hotelId = action.payload || null;
      localStorage.setItem("hotelId", state.hotelId || "");
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
          state.permission = user.permission || null;

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
          const storedActive = localStorage.getItem("hotelId");
          state.hotelId = (storedActive && hotelIds.includes(storedActive)) ? storedActive : (hotelIds[0] || null);

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
        state.hotelIds = user?.hotels?.map(h => h._id || h.partneredHotelId || h.id).filter(Boolean) || [];
        state.hotelId = state.hotelIds[0] || user?.hotelId || null;
        state.isAuthenticated = true;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", token || "");
        localStorage.setItem("userId", state.userId || "");
        localStorage.setItem("userRole", state.userRole || "");
        if (state.hotelIds.length > 0) {
          localStorage.setItem("hotelIds", JSON.stringify(state.hotelIds));
          localStorage.setItem("hotelId", state.hotelIds[0]);
        } else if (state.hotelId) {
          localStorage.setItem("hotelIds", JSON.stringify([state.hotelId]));
          localStorage.setItem("hotelId", state.hotelId);
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
        // Staff: permission object present; Manager: null
        state.permission = user?.permission || null;

        // Prefer array from backend if available
        state.hotelIds = user?.hotels?.map(h => h._id || h.partneredHotelId || h.id).filter(Boolean) || [];
        state.hotelId = state.hotelIds[0] || user?.hotelId || null;

        state.isAuthenticated = true;
        state.error = null;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken || "");
        localStorage.setItem("refreshToken", refreshToken || "");
        localStorage.setItem("userId", state.userId || "");
        localStorage.setItem("userRole", state.userRole || "");
        localStorage.setItem("userPermission", JSON.stringify(state.permission));

        if (state.hotelIds.length > 0) {
          localStorage.setItem("hotelIds", JSON.stringify(state.hotelIds));
          localStorage.setItem("hotelId", state.hotelIds[0]);
        } else if (state.hotelId) {
          // Staff/Manager: hotelId comes directly from user.hotelId, no hotels array
          state.hotelIds = [state.hotelId];
          localStorage.setItem("hotelIds", JSON.stringify([state.hotelId]));
          localStorage.setItem("hotelId", state.hotelId);
        }
      })
      .addCase(signinUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // OWNER SIGNIN
      .addCase(signinOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signinOwner.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.userId = user?.id || user?._id || null;
        state.userRole = user?.role || null;
        state.hotelIds = user?.hotels?.map(h => h._id || h.partneredHotelId || h.id).filter(Boolean) || [];
        state.hotelId = state.hotelIds[0] || user?.hotelId || null;
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
          state.hotelIds = [state.hotelId];
          localStorage.setItem("hotelIds", JSON.stringify([state.hotelId]));
          localStorage.setItem("hotelId", state.hotelId);
        }
      })
      .addCase(signinOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.userId = null;
        state.userRole = null;
        state.permission = null;
        state.hotelId = null;
        state.hotelIds = [];
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.wallet = null;
      })

      // FETCH CURRENT USER
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE PROFILE
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })

      // UPLOAD PROFILE PHOTO
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })

      // FETCH OWNER WALLET
      .addCase(fetchOwnerWallet.pending, (state) => {
        state.walletLoading = true;
        state.walletError = null;
      })
      .addCase(fetchOwnerWallet.fulfilled, (state, action) => {
        state.walletLoading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchOwnerWallet.rejected, (state, action) => {
        state.walletLoading = false;
        state.walletError = action.payload;
      })

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

export const { clearError, restoreUser, setActiveHotelId } = userSlice.actions;
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
export const selectIsHotelManager = (state) => state.user.userRole === "HOTEL_MANAGER";
export const selectIsHotelStaff = (state) => state.user.userRole === "HOTEL_STAFF";
export const selectIsHotelOwner = (state) => state.user.userRole === "HOTEL_OWNER";
export const selectUserPermission = (state) => state.user.permission;
export const selectWallet = (state) => state.user.wallet;
export const selectWalletLoading = (state) => state.user.walletLoading;
export const selectWalletError = (state) => state.user.walletError;

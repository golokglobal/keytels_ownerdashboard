import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/staff';

/* ============================ MANAGER THUNKS ============================ */

// Fetch all managers for a hotel — GET /hotel-managers/hotel/{hotelId}
export const fetchHotelManagers = createAsyncThunk(
  'staff/fetchHotelManagers',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await api.getHotelManagers(hotelId);
      return Array.isArray(response) ? response : response.managers || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel managers');
    }
  }
);

// Create new hotel manager — POST /hotel-managers
export const createManagerMember = createAsyncThunk(
  'staff/createManagerMember',
  async (managerData, { rejectWithValue }) => {
    try {
      const response = await api.createManager(managerData);
      return response.hotelManager || response.manager || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to create hotel manager');
    }
  }
);

// Update a hotel manager — PUT /hotel-managers/{id}
export const updateManagerMember = createAsyncThunk(
  'staff/updateManagerMember',
  async ({ staffId, staffData }, { rejectWithValue }) => {
    try {
      const response = await api.updateManager(staffId, staffData);
      return response.hotelManager || response.manager || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to update hotel manager');
    }
  }
);

// Delete a hotel manager — DELETE /hotel-managers/{id}
export const deleteManagerMember = createAsyncThunk(
  'staff/deleteManagerMember',
  async (staffId, { rejectWithValue }) => {
    try {
      await api.deleteManager(staffId);
      return staffId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || 'Failed to delete hotel manager');
    }
  }
);

/* ============================ STAFF THUNKS ============================ */

// Fetch all staff for a hotel
export const fetchHotelStaff = createAsyncThunk(
  'staff/fetchHotelStaff',
  async (hotelId, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching staff for hotel:', hotelId);
      const response = await api.getHotelStaff(hotelId);
      console.log('✅ Staff fetched:', response);
      return Array.isArray(response) ? response : response.staff || [];
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff');
    }
  }
);

// Create new staff member
export const createStaffMember = createAsyncThunk(
  'staff/createStaffMember',
  async (staffData, { rejectWithValue }) => {
    try {
      console.log('🔄 Creating staff member:', staffData);
      const response = await api.createStaff(staffData);
      console.log('✅ Staff member created:', response);
      return response.staff || response;
    } catch (error) {
      console.error('❌ Error creating staff:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create staff member');
    }
  }
);

// Update staff member
export const updateStaffMember = createAsyncThunk(
  'staff/updateStaffMember',
  async ({ staffId, staffData }, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating staff member:', staffId, staffData);
      const response = await api.updateStaff(staffId, staffData);
      console.log('✅ Staff member updated:', response);
      return response.staff || response;
    } catch (error) {
      console.error('❌ Error updating staff:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update staff member');
    }
  }
);

// Delete staff member
export const deleteStaffMember = createAsyncThunk(
  'staff/deleteStaffMember',
  async (staffId, { rejectWithValue }) => {
    try {
      console.log('🔄 Deleting staff member:', staffId);
      await api.deleteStaff(staffId);
      console.log('✅ Staff member deleted');
      return staffId;
    } catch (error) {
      console.error('❌ Error deleting staff:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete staff member');
    }
  }
);

// Fetch staff filtered by role for a hotel
export const fetchStaffByRole = createAsyncThunk(
  'staff/fetchStaffByRole',
  async ({ role, hotelId }, { rejectWithValue }) => {
    try {
      const response = await api.getStaffByRoleAndHotel(role, hotelId);
      return Array.isArray(response) ? response : response.staff || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff by role');
    }
  }
);

// Fetch single staff member by ID
export const fetchStaffById = createAsyncThunk(
  'staff/fetchStaffById',
  async (staffId, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching staff member:', staffId);
      const response = await api.getStaffById(staffId);
      console.log('✅ Staff member fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching staff member:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff member');
    }
  }
);

/* ============================ SLICE ============================ */

const initialState = {
  staff: [],
  selectedStaff: null,
  loading: false,
  error: null,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearStaffError: (state) => {
      state.error = null;
    },
    clearStaff: (state) => {
      state.staff = [];
      state.selectedStaff = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────────────── FETCH HOTEL STAFF ──────────────
      .addCase(fetchHotelStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchHotelStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── CREATE STAFF MEMBER ──────────────
      .addCase(createStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        state.staff.push(action.payload);
      })
      .addCase(createStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH HOTEL MANAGERS ──────────────
      .addCase(fetchHotelManagers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelManagers.fulfilled, (state, action) => {
        state.loading = false;
        // Merge managers into staff list, replacing any existing manager entries
        const nonManagers = state.staff.filter(s => s.role !== 'HOTEL_MANAGER');
        state.staff = [...nonManagers, ...action.payload];
      })
      .addCase(fetchHotelManagers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── CREATE MANAGER MEMBER ──────────────
      .addCase(createManagerMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManagerMember.fulfilled, (state, action) => {
        state.loading = false;
        state.staff.push(action.payload);
      })
      .addCase(createManagerMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── UPDATE MANAGER MEMBER ──────────────
      .addCase(updateManagerMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateManagerMember.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.staff.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.staff[index] = action.payload;
        }
      })
      .addCase(updateManagerMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── DELETE MANAGER MEMBER ──────────────
      .addCase(deleteManagerMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteManagerMember.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = state.staff.filter(s => s.id !== action.payload);
      })
      .addCase(deleteManagerMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── UPDATE STAFF MEMBER ──────────────
      .addCase(updateStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.staff.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.staff[index] = action.payload;
        }
      })
      .addCase(updateStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── DELETE STAFF MEMBER ──────────────
      .addCase(deleteStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = state.staff.filter(s => s.id !== action.payload);
      })
      .addCase(deleteStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH STAFF BY ROLE ──────────────
      .addCase(fetchStaffByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchStaffByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ────────────── FETCH STAFF BY ID ──────────────
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.selectedStaff = action.payload;
      });
  },
});

export const { clearStaffError, clearStaff } = staffSlice.actions;
export default staffSlice.reducer;

// Selectors
export const selectStaff = (state) => state.staff.staff;
export const selectSelectedStaff = (state) => state.staff.selectedStaff;
export const selectStaffLoading = (state) => state.staff.loading;
export const selectStaffError = (state) => state.staff.error;

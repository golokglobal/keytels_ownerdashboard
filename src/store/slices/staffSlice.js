import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/staff';

/* ============================ MANAGER THUNK ============================ */

// Create new hotel manager (uses /staff/hotel-managers/create endpoint)
export const createManagerMember = createAsyncThunk(
  'staff/createManagerMember',
  async (managerData, { rejectWithValue }) => {
    try {
      console.log('🔄 Creating hotel manager:', managerData);
      const response = await api.createManager(managerData);
      console.log('✅ Hotel manager created:', response);
      return response.hotelManager || response;
    } catch (error) {
      console.error('❌ Error creating manager:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create hotel manager');
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

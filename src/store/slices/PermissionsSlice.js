import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as permissionsApi from '../../api/permissionsApi';

// Helper function to extract error message
const getErrorMessage = (error, defaultMessage) =>
  error.response?.data?.message || error.message || defaultMessage;

// --- ASYNC THUNKS ---

export const fetchPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await permissionsApi.getAllPermissions();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch permissions'));
    }
  }
);

export const fetchPermissionById = createAsyncThunk(
  'permissions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await permissionsApi.getPermissionById(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch permission'));
    }
  }
);

export const fetchPermissionsByCategory = createAsyncThunk(
  'permissions/fetchByCategory',
  async (category, { rejectWithValue }) => {
    try {
      return await permissionsApi.getPermissionsByCategory(category);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch by category'));
    }
  }
);

export const createPermission = createAsyncThunk(
  'permissions/create',
  async (permissionData, { rejectWithValue }) => {
    try {
      return await permissionsApi.createPermission(permissionData);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create permission'));
    }
  }
);

export const updatePermission = createAsyncThunk(
  'permissions/update',
  async ({ id, ...restData }, { rejectWithValue }) => {
    try {
      return await permissionsApi.updatePermission(id, restData);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update permission'));
    }
  }
);

export const deletePermission = createAsyncThunk(
  'permissions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await permissionsApi.deletePermission(id);
      return { id };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete permission'));
    }
  }
);

// --- SLICE ---

const initialState = {
  list: [],
  selectedPermission: null,
  categoryPermissions: [],
  loading: false,
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetStatus: (state) => {
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
      state.deleteStatus = 'idle';
    },
    clearSelected: (state) => {
      state.selectedPermission = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH BY ID
      .addCase(fetchPermissionById.fulfilled, (state, action) => {
        state.selectedPermission = action.payload;
      })

      // FETCH BY CATEGORY
      .addCase(fetchPermissionsByCategory.fulfilled, (state, action) => {
        state.categoryPermissions = action.payload;
      })

      // CREATE
      .addCase(createPermission.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createPermission.fulfilled, (state) => {
        state.createStatus = 'succeeded';
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updatePermission.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null;
      })
      .addCase(updatePermission.fulfilled, (state) => {
        state.updateStatus = 'succeeded';
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload;
      })

      // DELETE
      .addCase(deletePermission.pending, (state) => {
        state.deleteStatus = 'loading';
        state.error = null;
      })
      .addCase(deletePermission.fulfilled, (state) => {
        state.deleteStatus = 'succeeded';
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearError, resetStatus, clearSelected } = permissionsSlice.actions;
export default permissionsSlice.reducer;

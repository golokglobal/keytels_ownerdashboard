// src/store/slices/permissionsSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axiosConfig';

// --- AXIOS CONFIGURATION ---

// Use centralized axios instance
const permissionsApi = api;

// Helper function to extract error message
const getErrorMessage = (error, defaultMessage) => {
    // Improved error handling to safely access nested properties
    return error.response?.data?.message || error.message || defaultMessage;
};

// --- ASYNC THUNKS (All paths adjusted) ---

const PERMISSIONS_URL = '/api/permissions'; // Define the full resource path

// GET /api/permissions - Fetch all permissions
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // CORRECTED PATH: Request now goes to /api/permissions
      const response = await permissionsApi.get(PERMISSIONS_URL); 
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch permissions');
      return rejectWithValue(message);
    }
  }
);

// GET /api/permissions/:id - Fetch single permission
export const fetchPermissionById = createAsyncThunk(
  'permissions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      // CORRECTED PATH: Request goes to /api/permissions/:id
      const response = await permissionsApi.get(`${PERMISSIONS_URL}/${id}`);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch permission');
      return rejectWithValue(message);
    }
  }
);

// GET /api/permissions/category/:category - Fetch by category
export const fetchPermissionsByCategory = createAsyncThunk(
  'permissions/fetchByCategory',
  async (category, { rejectWithValue }) => {
    try {
      // CORRECTED PATH: Request goes to /api/permissions/category/:category
      const response = await permissionsApi.get(`${PERMISSIONS_URL}/category/${category}`);
      return response.data.permissions;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch by category');
      return rejectWithValue(message);
    }
  }
);

// POST /api/permissions - Create new permission
export const createPermission = createAsyncThunk(
  'permissions/create',
  async (permissionData, { rejectWithValue }) => {
    try {
      // CORRECTED PATH: POST request to /api/permissions (resolves 404 for POST)
      const response = await permissionsApi.post(PERMISSIONS_URL, permissionData);
      return response.data.permission || response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create permission');
      return rejectWithValue(message);
    }
  }
);

// PUT /api/permissions/:id - Update a permission
export const updatePermission = createAsyncThunk(
  'permissions/update',
  async ({ id, ...restData }, { rejectWithValue }) => {
    try {
      // CORRECTED PATH: PUT request to /api/permissions/:id
      const response = await permissionsApi.put(`${PERMISSIONS_URL}/${id}`, restData);
      return response.data.permission || response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update permission');
      return rejectWithValue(message);
    }
  }
);

// DELETE /api/permissions/:id - Delete a permission
export const deletePermission = createAsyncThunk(
  'permissions/delete',
  async (id, { rejectWithValue }) => {
    try {
      // CORRECTED PATH: DELETE request to /api/permissions/:id
      const response = await permissionsApi.delete(`${PERMISSIONS_URL}/${id}`);
      return { id, message: response.data.message || 'Permission deleted successfully' };
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete permission');
      return rejectWithValue(message);
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
        state.error = null; // Clear previous error on new attempt
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createPermission.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null; // Clear previous error on new attempt
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        // Note: The list update logic here relies on the re-fetch in Permissions.jsx
        // state.list.push(action.payload); // Removed, relied on refetch
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updatePermission.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null; // Clear previous error on new attempt
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        // Note: The list update logic here relies on the re-fetch in Permissions.jsx
        /* const index = state.list.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        */
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload;
      })

      // DELETE
      .addCase(deletePermission.pending, (state) => {
        state.deleteStatus = 'loading';
        state.error = null; // Clear previous error on new attempt
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        // Note: The list update logic here relies on the re-fetch in Permissions.jsx
        // state.list = state.list.filter((p) => p.id !== action.payload.id); // Removed, relied on refetch
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload;
      })
      
      // Keep other fetch cases simple, as they don't affect main UI loop
      .addCase(fetchPermissionById.fulfilled, (state, action) => {
         state.selectedPermission = action.payload;
      })
      .addCase(fetchPermissionsByCategory.fulfilled, (state, action) => {
         state.categoryPermissions = action.payload;
      });
  },
});

export const { clearError, resetStatus, clearSelected } = permissionsSlice.actions;
export default permissionsSlice.reducer;
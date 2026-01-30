// // src/store/slices/permissionsSlice.js

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // --- AXIOS CONFIGURATION ---

// // Create axios instance for the permissions API (port 8081)
// const permissionsApi = axios.create({
//   // Base URL provided in the request: https://desiney.berymo.com/api/permissions
//   baseURL: 'https://desiney.berymo.com/api/permissions', 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor to add auth token (from localStorage)
// permissionsApi.interceptors.request.use(
//   (config) => {
//     // Note: The previous code used getTokens(), but we switch to localStorage 
//     // to match the pattern of the hotelsApi example you provided.
//     const token = localStorage.getItem('accessToken'); 
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Helper function to extract error message
// const getErrorMessage = (error, defaultMessage) => {
//     return error.response?.data?.message || error.message || defaultMessage;
// };

// // --- ASYNC THUNKS ---

// // GET /api/permissions - Fetch all permissions
// export const fetchPermissions = createAsyncThunk(
//   'permissions/fetchAll',
//   async (_, { rejectWithValue }) => {
//     try {
//       // GET request to baseURL: https://desiney.berymo.com/api/permissions
//       const response = await permissionsApi.get('/'); 
//       return response.data;
//     } catch (error) {
//       const message = getErrorMessage(error, 'Failed to fetch permissions');
//       return rejectWithValue(message);
//     }
//   }
// );

// // GET /api/permissions/:id - Fetch single permission
// export const fetchPermissionById = createAsyncThunk(
//   'permissions/fetchById',
//   async (id, { rejectWithValue }) => {
//     try {
//       // GET request to /:id
//       const response = await permissionsApi.get(`/${id}`);
//       return response.data;
//     } catch (error) {
//       const message = getErrorMessage(error, 'Failed to fetch permission');
//       return rejectWithValue(message);
//     }
//   }
// );

// // GET /api/permissions/category/:category - Fetch by category
// export const fetchPermissionsByCategory = createAsyncThunk(
//   'permissions/fetchByCategory',
//   async (category, { rejectWithValue }) => {
//     try {
//       // GET request to /category/:category
//       const response = await permissionsApi.get(`/category/${category}`);
//       return response.data.permissions;
//     } catch (error) {
//       const message = getErrorMessage(error, 'Failed to fetch by category');
//       return rejectWithValue(message);
//     }
//   }
// );

// // POST /api/permissions - Create new permission (Admin only)
// export const createPermission = createAsyncThunk(
//   'permissions/create',
//   async (permissionData, { rejectWithValue }) => {
//     try {
//       // POST request to / with permissionData as body
//       const response = await permissionsApi.post('/', permissionData);

//       // Handle both response formats if necessary, matching the original logic
//       return response.data.permission || response.data;
//     } catch (error) {
//       const message = getErrorMessage(error, 'Failed to create permission');
//       return rejectWithValue(message);
//     }
//   }
// );

// // PUT /api/permissions/:id - Update a permission (Admin only)
// export const updatePermission = createAsyncThunk(
//   'permissions/update',
//   async ({ id, ...restData }, { rejectWithValue }) => {
//     try {
//       // PUT request to /:id with restData as body
//       const response = await permissionsApi.put(`/${id}`, restData);
      
//       return response.data.permission || response.data;
//     } catch (error) {
//       const message = getErrorMessage(error, 'Failed to update permission');
//       return rejectWithValue(message);
//     }
//   }
// );

// // DELETE /api/permissions/:id - Delete a permission (Admin only)
// export const deletePermission = createAsyncThunk(
//   'permissions/delete',
//   async (id, { rejectWithValue }) => {
//     try {
//       // DELETE request to /:id
//       const response = await permissionsApi.delete(`/${id}`);
//       return { id, message: response.data.message || 'Permission deleted successfully' };
//     } catch (error) {
//       const message = getErrorMessage(error, 'Failed to delete permission');
//       return rejectWithValue(message);
//     }
//   }
// );

// // --- SLICE (Remains the same as it handles state logic, not API logic) ---

// const initialState = {
//   list: [],
//   selectedPermission: null,
//   categoryPermissions: [],
//   loading: false,
//   createStatus: 'idle',
//   updateStatus: 'idle',
//   deleteStatus: 'idle',
//   error: null,
// };

// const permissionsSlice = createSlice({
//   name: 'permissions',
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//     resetStatus: (state) => {
//       state.createStatus = 'idle';
//       state.updateStatus = 'idle';
//       state.deleteStatus = 'idle';
//     },
//     clearSelected: (state) => {
//       state.selectedPermission = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // FETCH ALL
//       .addCase(fetchPermissions.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchPermissions.fulfilled, (state, action) => {
//         state.loading = false;
//         state.list = action.payload;
//       })
//       .addCase(fetchPermissions.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // FETCH BY ID
//       .addCase(fetchPermissionById.fulfilled, (state, action) => {
//         state.selectedPermission = action.payload;
//       })

//       // FETCH BY CATEGORY
//       .addCase(fetchPermissionsByCategory.fulfilled, (state, action) => {
//         state.categoryPermissions = action.payload;
//       })

//       // CREATE
//       .addCase(createPermission.pending, (state) => {
//         state.createStatus = 'loading';
//       })
//       .addCase(createPermission.fulfilled, (state, action) => {
//         state.createStatus = 'succeeded';
//         state.list.push(action.payload);
//       })
//       .addCase(createPermission.rejected, (state, action) => {
//         state.createStatus = 'failed';
//         state.error = action.payload;
//       })

//       // UPDATE
//       .addCase(updatePermission.pending, (state) => {
//         state.updateStatus = 'loading';
//       })
//       .addCase(updatePermission.fulfilled, (state, action) => {
//         state.updateStatus = 'succeeded';
//         const index = state.list.findIndex((p) => p.id === action.payload.id);
//         if (index !== -1) state.list[index] = action.payload;
//       })
//       .addCase(updatePermission.rejected, (state, action) => {
//         state.updateStatus = 'failed';
//         state.error = action.payload;
//       })

//       // DELETE
//       .addCase(deletePermission.pending, (state) => {
//         state.deleteStatus = 'loading';
//       })
//       .addCase(deletePermission.fulfilled, (state, action) => {
//         state.deleteStatus = 'succeeded';
//         state.list = state.list.filter((p) => p.id !== action.payload.id);
//       })
//       .addCase(deletePermission.rejected, (state, action) => {
//         state.deleteStatus = 'failed';
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearError, resetStatus, clearSelected } = permissionsSlice.actions;
// export default permissionsSlice.reducer;
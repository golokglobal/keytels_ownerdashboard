import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/catalogApi";

/* ── Fetch thunks ── */
export const fetchPropertyTypes = createAsyncThunk(
  "catalog/fetchPropertyTypes",
  async (_, { rejectWithValue }) => {
    try {
      return await api.getPropertyTypes();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch property types");
    }
  }
);

export const fetchRoomTypes = createAsyncThunk(
  "catalog/fetchRoomTypes",
  async (_, { rejectWithValue }) => {
    try {
      return await api.getRoomTypes();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch room types");
    }
  }
);

export const fetchBedTypes = createAsyncThunk(
  "catalog/fetchBedTypes",
  async (_, { rejectWithValue }) => {
    try {
      return await api.getBedTypes();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bed types");
    }
  }
);

/* ── Create thunks (Admin) ──
   POST /partneredhotel/catalog/property-types  body: { name }
   POST /partneredhotel/catalog/room-types      body: { name }
   POST /partneredhotel/catalog/bed-types       body: { name }
   Response 201: { id, name, status, createdAt, updatedAt }
*/
export const createPropertyType = createAsyncThunk(
  "catalog/createPropertyType",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createPropertyType(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || "Failed to create property type"
      );
    }
  }
);

export const createRoomType = createAsyncThunk(
  "catalog/createRoomType",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createRoomType(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || "Failed to create room type"
      );
    }
  }
);

export const createBedType = createAsyncThunk(
  "catalog/createBedType",
  async (data, { rejectWithValue }) => {
    try {
      return await api.createBedType(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || "Failed to create bed type"
      );
    }
  }
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState: {
    propertyTypes: [],
    roomTypes: [],
    bedTypes: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* fetch */
      .addCase(fetchPropertyTypes.fulfilled, (state, action) => {
        state.propertyTypes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRoomTypes.fulfilled, (state, action) => {
        state.roomTypes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBedTypes.fulfilled, (state, action) => {
        state.bedTypes = Array.isArray(action.payload) ? action.payload : [];
      })
      /* create — append new item returned by API */
      .addCase(createPropertyType.fulfilled, (state, action) => {
        state.propertyTypes.push(action.payload);
      })
      .addCase(createRoomType.fulfilled, (state, action) => {
        state.roomTypes.push(action.payload);
      })
      .addCase(createBedType.fulfilled, (state, action) => {
        state.bedTypes.push(action.payload);
      })
      .addMatcher(
        (action) => action.type.startsWith("catalog/") && action.type.endsWith("/pending"),
        (state) => { state.loading = true; state.error = null; }
      )
      .addMatcher(
        (action) => action.type.startsWith("catalog/") && action.type.endsWith("/fulfilled"),
        (state) => { state.loading = false; }
      )
      .addMatcher(
        (action) => action.type.startsWith("catalog/") && action.type.endsWith("/rejected"),
        (state, action) => { state.loading = false; state.error = action.payload; }
      );
  },
});

export default catalogSlice.reducer;

export const selectPropertyTypes = (state) => state.catalog.propertyTypes;
export const selectRoomTypes = (state) => state.catalog.roomTypes;
export const selectBedTypes = (state) => state.catalog.bedTypes;

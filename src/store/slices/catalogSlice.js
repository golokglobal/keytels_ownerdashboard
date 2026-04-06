import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/catalogApi";

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
      .addCase(fetchPropertyTypes.fulfilled, (state, action) => {
        state.propertyTypes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRoomTypes.fulfilled, (state, action) => {
        state.roomTypes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBedTypes.fulfilled, (state, action) => {
        state.bedTypes = Array.isArray(action.payload) ? action.payload : [];
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

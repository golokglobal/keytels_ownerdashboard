// src/features/partneredHotel/PartnerHotelslice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/partneredHotelsApi";

/* ============================ HOTEL THUNKS ============================ */

// Fetch hotels — owner gets all via owners/hotels, staff gets their assigned hotel by ID
export const fetchOwnerHotels = createAsyncThunk(
  "partneredHotel/fetchOwnerHotels",
  async ({ page = 0, size = 50 } = {}, { rejectWithValue }) => {
    try {
      const role = localStorage.getItem("userRole") || "";
      const isStaff = role === "HOTEL_STAFF" || role === "STAFF" || role === "MANAGER" || role === "HOTEL_MANAGER";

      if (isStaff) {
        const hotelId = localStorage.getItem("hotelId");
        if (!hotelId) return rejectWithValue("No hotel assigned to this staff account");
        const hotel = await api.getPartneredHotelById(hotelId);
        return [hotel]; // wrap in array to match owner response shape
      }

      const response = await api.getOwnerHotels(page, size);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch hotels"
      );
    }
  }
);

export const fetchHotelById = createAsyncThunk(
  "partneredHotel/fetchHotelById",
  async (hotelId) => {
    const response = await api.getPartneredHotelById(hotelId);
    return response;
  }
);

export const createHotel = createAsyncThunk(
  "partneredHotel/createHotel",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.createPartneredHotel(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create hotel"
      );
    }
  }
);

export const updateHotel = createAsyncThunk(
  "partneredHotel/updateHotel",
  async ({ hotelId, data }, { rejectWithValue }) => {
    try {
      const response = await api.updatePartneredHotel(hotelId, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update hotel"
      );
    }
  }
);

export const deleteHotel = createAsyncThunk(
  "partneredHotel/deleteHotel",
  async (hotelId, { rejectWithValue }) => {
    try {
      await api.deactivatePartneredHotel(hotelId);
      return hotelId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to deactivate hotel"
      );
    }
  }
);

/* ============================ ROOM THUNKS ============================ */
export const createHotelRoom = createAsyncThunk(
  "partneredHotel/createRoom",
  async ({ hotelId, data }, { rejectWithValue }) => {
    try {
      const room = await api.createRoom(hotelId, data);
      return { hotelId, room };
    } catch (error) {
      console.error("❌ Error creating room:", error);
      const errData = error.response?.data;
      const status = error.response?.status;

      const friendlyMessage =
        errData?.message ||
        errData?.error ||
        (status === 400 ? "Invalid request – check room data or authorization header" :
         status === 401 ? "Authentication required – please log in again" :
         status === 403 ? "Forbidden – you don't have permission" :
         "Failed to create room");

      return rejectWithValue(friendlyMessage);
    }
  }
);

export const fetchRoomsByHotel = createAsyncThunk(
  "partneredHotel/fetchRoomsByHotel",
  async (hotelId) => {
    const rooms = await api.getRoomsByHotel(hotelId);
    return { hotelId, rooms };
  }
);

export const fetchRoomById = createAsyncThunk(
  "partneredHotel/fetchRoomById",
  async (roomId) => {
    const response = await api.getRoomById(roomId);
    return response;
  }
);

export const updateHotelRoom = createAsyncThunk(
  "partneredHotel/updateRoom",
  async ({ roomId, data }, { rejectWithValue }) => {
    try {
      const response = await api.updateRoom(roomId, data);
      return response;
    } catch (error) {
      const errData = error.response?.data;
      const message = errData?.message || errData?.error || error.message || "Failed to update room";
      return rejectWithValue(message);
    }
  }
);

export const deleteHotelRoom = createAsyncThunk(
  "partneredHotel/deleteRoom",
  async (roomId, { rejectWithValue }) => {
    try {
      await api.deleteRoom(roomId);
      return roomId;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete room";
      return rejectWithValue(message);
    }
  }
);

/* ============================ HOTEL IMAGE THUNKS ============================ */

// GET /partneredhotel/{hotelId}/images
export const fetchHotelImages = createAsyncThunk(
  "partneredHotel/fetchHotelImages",
  async (hotelId, { rejectWithValue }) => {
    try {
      const images = await api.getHotelImages(hotelId);
      return { hotelId, images: Array.isArray(images) ? images : [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch hotel images");
    }
  }
);

// POST /partneredhotel/{hotelId}/images  multipart → { imageId, imageUrl }
export const uploadHotelImageFile = createAsyncThunk(
  "partneredHotel/uploadHotelImage",
  async ({ hotelId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const response = await api.uploadHotelImage(hotelId, fd);
      return { hotelId, image: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload hotel image");
    }
  }
);

// DELETE /partneredhotel/hotel-images/{imageId}
export const deleteHotelImageFile = createAsyncThunk(
  "partneredHotel/deleteHotelImage",
  async ({ imageId, hotelId }, { rejectWithValue }) => {
    try {
      await api.deleteHotelImage(imageId);
      return { imageId, hotelId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete hotel image");
    }
  }
);

/* ============================ ROOM IMAGE THUNKS ============================ */

// GET /rooms/{roomId}/images → [{ imageId, imageUrl }]
export const fetchRoomImages = createAsyncThunk(
  "partneredHotel/fetchRoomImages",
  async (roomId, { rejectWithValue }) => {
    try {
      const images = await api.getRoomImages(roomId);
      return { roomId, images: Array.isArray(images) ? images : [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch images");
    }
  }
);

// POST /rooms/{roomId}/images  multipart (field: "file") → { imageId, imageUrl }
export const uploadRoomImage = createAsyncThunk(
  "partneredHotel/uploadRoomImage",
  async ({ roomId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const response = await api.uploadRoomImage(roomId, fd);
      // response: { imageId, imageUrl }
      return { roomId, image: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload image");
    }
  }
);

// DELETE /rooms/images/{imageId} → { message }
export const deleteRoomImage = createAsyncThunk(
  "partneredHotel/deleteRoomImage",
  async ({ imageId, roomId }, { rejectWithValue }) => {
    try {
      await api.deleteRoomImage(imageId);
      return { imageId, roomId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete image");
    }
  }
);

/* ============================ SLICE ============================ */
const partneredHotelSlice = createSlice({
  name: "partneredHotel",
  initialState: {
    hotels: [],
    selectedHotel: null,
    selectedRoom: null,
    hotelRooms: [], // Rooms for the currently selected hotel
    roomImages: {}, // { roomId: [images] }
    hotelImages: {}, // { hotelId: [images] }
    loading: false,
    error: null,
  },
  reducers: {
    clearHotelError: (state) => {
      state.error = null;
    },
    clearSelectedRoom: (state) => {
      state.selectedRoom = null;
    },
    clearSelectedHotel: (state) => {
      state.selectedHotel = null;
      state.hotelRooms = [];
    },
    clearAllHotels: (state) => {
      state.hotels = [];
      state.selectedHotel = null;
      state.selectedRoom = null;
      state.hotelRooms = [];
      state.roomImages = {};
      state.hotelImages = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────────────── HOTELS ──────────────
      .addCase(fetchOwnerHotels.fulfilled, (state, action) => {
        // API returns an array of hotels
        state.hotels = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.selectedHotel = action.payload;
        if (action.payload.rooms) {
          state.hotelRooms = action.payload.rooms;
        }
        // Also add to hotels array if not already present (for single hotel display)
        const hotelId = action.payload.partneredHotelId || action.payload.id;
        if (hotelId && !state.hotels.find(h => (h.partneredHotelId || h.id) === hotelId)) {
          state.hotels.push(action.payload);
        }
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.hotels.push(action.payload);
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        const index = state.hotels.findIndex(
          (h) => h.partneredHotelId === action.payload.partneredHotelId
        );
        if (index !== -1) state.hotels[index] = action.payload;
        if (state.selectedHotel?.partneredHotelId === action.payload.partneredHotelId) {
          state.selectedHotel = action.payload;
        }
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.hotels = state.hotels.filter(
          (h) => h.partneredHotelId !== action.payload
        );
        if (state.selectedHotel?.partneredHotelId === action.payload) {
          state.selectedHotel = null;
          state.hotelRooms = [];
        }
      })

      // ────────────── ROOMS ──────────────
      .addCase(fetchRoomsByHotel.fulfilled, (state, action) => {
        state.hotelRooms = action.payload.rooms;
        if (state.selectedHotel?.partneredHotelId === action.payload.hotelId) {
          state.selectedHotel.rooms = action.payload.rooms;
        }
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.selectedRoom = action.payload;
      })
      .addCase(createHotelRoom.fulfilled, (state, action) => {
        state.hotelRooms.push(action.payload.room);
        if (state.selectedHotel?.partneredHotelId === action.payload.hotelId) {
          state.selectedHotel.rooms = [...(state.selectedHotel.rooms || []), action.payload.room];
        }
      })
      .addCase(updateHotelRoom.fulfilled, (state, action) => {
        const updatedId = action.payload.roomId || action.payload.id;
        const roomIndex = state.hotelRooms.findIndex((r) => (r.roomId || r.id) === updatedId);
        if (roomIndex !== -1) state.hotelRooms[roomIndex] = action.payload;

        if (state.selectedHotel?.rooms) {
          const hotelRoomIndex = state.selectedHotel.rooms.findIndex((r) => (r.roomId || r.id) === updatedId);
          if (hotelRoomIndex !== -1) {
            state.selectedHotel.rooms[hotelRoomIndex] = action.payload;
          }
        }
      })
      .addCase(deleteHotelRoom.fulfilled, (state, action) => {
        state.hotelRooms = state.hotelRooms.filter((r) => (r.roomId || r.id) !== action.payload);
        if (state.selectedHotel?.rooms) {
          state.selectedHotel.rooms = state.selectedHotel.rooms.filter(
            (r) => (r.roomId || r.id) !== action.payload
          );
        }
        delete state.roomImages[action.payload];
      })

      // ────────────── HOTEL IMAGES ──────────────
      .addCase(fetchHotelImages.fulfilled, (state, action) => {
        state.hotelImages[action.payload.hotelId] = action.payload.images;
      })
      .addCase(uploadHotelImageFile.fulfilled, (state, action) => {
        const { hotelId, image } = action.payload;
        state.hotelImages[hotelId] = [...(state.hotelImages[hotelId] || []), image];
        // also update the hotel's hotelImages array if it's loaded
        const hotel = state.hotels.find(h => (h.partneredHotelId || h.id) === hotelId);
        if (hotel) {
          hotel.hotelImages = [...(hotel.hotelImages || []), image];
        }
        if (state.selectedHotel && (state.selectedHotel.partneredHotelId || state.selectedHotel.id) === hotelId) {
          state.selectedHotel.hotelImages = [...(state.selectedHotel.hotelImages || []), image];
        }
      })
      .addCase(deleteHotelImageFile.fulfilled, (state, action) => {
        const { imageId, hotelId } = action.payload;
        if (state.hotelImages[hotelId]) {
          state.hotelImages[hotelId] = state.hotelImages[hotelId].filter(
            (img) => img.imageId !== imageId && img.id !== imageId
          );
        }
        const hotel = state.hotels.find(h => (h.partneredHotelId || h.id) === hotelId);
        if (hotel?.hotelImages) {
          hotel.hotelImages = hotel.hotelImages.filter(
            (img) => img.imageId !== imageId && img.id !== imageId
          );
        }
        if (state.selectedHotel) {
          state.selectedHotel.hotelImages = (state.selectedHotel.hotelImages || []).filter(
            (img) => img.imageId !== imageId && img.id !== imageId
          );
        }
      })

      // ────────────── ROOM IMAGES ──────────────
      .addCase(fetchRoomImages.fulfilled, (state, action) => {
        state.roomImages[action.payload.roomId] = action.payload.images;
      })
      .addCase(uploadRoomImage.fulfilled, (state, action) => {
        const { roomId, image } = action.payload;
        state.roomImages[roomId] = [...(state.roomImages[roomId] || []), image];
      })
      .addCase(deleteRoomImage.fulfilled, (state, action) => {
        const { imageId, roomId } = action.payload;
        if (state.roomImages[roomId]) {
          state.roomImages[roomId] = state.roomImages[roomId].filter(
            (img) => img.id !== imageId && img.imageId !== imageId
          );
        }
      })

      // ────────────── COMMON MATCHERS ──────────────
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message || "Something went wrong";
          console.error("❌ Redux Error:", action.payload || action.error);
        }
      );
  },
});

export const { clearHotelError, clearSelectedRoom, clearSelectedHotel, clearAllHotels } = partneredHotelSlice.actions;
export default partneredHotelSlice.reducer;

export const selectHotelImages = (hotelId) => (state) =>
  state.partneredHotel.hotelImages[hotelId] || [];
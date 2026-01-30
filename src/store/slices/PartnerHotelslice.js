// src/features/partneredHotel/PartnerHotelslice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/partneredHotelsApi";

/* ============================ HOTEL THUNKS ============================ */
export const fetchAllOwnerHotels = createAsyncThunk(
  "partneredHotel/fetchAllOwnerHotels",
  async () => {
    console.log("🔄 Fetching all hotels for owner");
    const response = await api.getAllOwnerHotels();
    console.log("✅ Fetch All Owner Hotels Response:", response);
    return response;
  }
);

export const fetchHotelById = createAsyncThunk(
  "partneredHotel/fetchHotelById",
  async (hotelId) => {
    console.log("🔄 Fetching hotel by ID:", hotelId);
    const response = await api.getPartneredHotelById(hotelId);
    console.log("✅ Fetch Hotel By ID Response:", response);
    return response;
  }
);

export const createHotel = createAsyncThunk(
  "partneredHotel/createHotel",
  async (data) => {
    console.log("🔄 Creating hotel with data:", JSON.stringify(data, null, 2));
    const response = await api.createPartneredHotel(data);
    console.log("✅ Create Hotel Response:", JSON.stringify(response, null, 2));
    return response;
  }
);

export const updateHotel = createAsyncThunk(
  "partneredHotel/updateHotel",
  async ({ hotelId, data }) => {
    console.log("🔄 Updating hotel ID:", hotelId, "with data:", JSON.stringify(data, null, 2));
    const response = await api.updatePartneredHotel(hotelId, data);
    console.log("✅ Update Hotel Response:", JSON.stringify(response, null, 2));
    return response;
  }
);

export const deleteHotel = createAsyncThunk(
  "partneredHotel/deleteHotel",
  async (hotelId) => {
    console.log("🔄 Deleting hotel ID:", hotelId);
    await api.deletePartneredHotel(hotelId);
    console.log("✅ Delete Hotel Success - Hotel ID:", hotelId);
    return hotelId;
  }
);

/* ============================ ROOM THUNKS ============================ */
export const createHotelRoom = createAsyncThunk(
  "partneredHotel/createRoom",
  async ({ hotelId, data }, { rejectWithValue }) => {
    try {
      console.log("🔄 Creating room for hotel ID:", hotelId, "with data:", JSON.stringify(data, null, 2));
      const room = await api.createRoom(hotelId, data);
      console.log("✅ Create Room Response:", JSON.stringify(room, null, 2));
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

      console.error("Error details:", { status, response: errData });
      return rejectWithValue(friendlyMessage);
    }
  }
);

export const fetchRoomsByHotel = createAsyncThunk(
  "partneredHotel/fetchRoomsByHotel",
  async (hotelId) => {
    console.log("🔄 Fetching rooms for hotel ID:", hotelId);
    const rooms = await api.getRoomsByHotel(hotelId);
    console.log("✅ Fetch Rooms Response:", JSON.stringify(rooms, null, 2));
    return { hotelId, rooms };
  }
);

export const fetchRoomById = createAsyncThunk(
  "partneredHotel/fetchRoomById",
  async (roomId) => {
    console.log("🔄 Fetching room by ID:", roomId);
    const response = await api.getRoomById(roomId);
    console.log("✅ Fetch Room By ID Response:", JSON.stringify(response, null, 2));
    return response;
  }
);

export const updateHotelRoom = createAsyncThunk(
  "partneredHotel/updateRoom",
  async ({ roomId, data }, { rejectWithValue }) => {
    try {
      console.log("🔄 Updating room ID:", roomId, "with data:", JSON.stringify(data, null, 2));
      const response = await api.updateRoom(roomId, data);
      console.log("✅ Update Room Response:", JSON.stringify(response, null, 2));
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
      console.log("🔄 Deleting room ID:", roomId);
      await api.deleteRoom(roomId);
      console.log("✅ Delete Room Success - Room ID:", roomId);
      return roomId;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete room";
      return rejectWithValue(message);
    }
  }
);

/* ============================ ROOM IMAGE THUNKS ============================ */
export const fetchRoomImages = createAsyncThunk(
  "partneredHotel/fetchRoomImages",
  async (roomId) => {
    console.log("🔄 Fetching images for room ID:", roomId);
    const images = await api.getRoomImages(roomId);
    console.log("✅ Fetch Room Images Response:", images);
    return { roomId, images };
  }
);

export const uploadRoomImage = createAsyncThunk(
  "partneredHotel/uploadRoomImage",
  async ({ roomId, formData }) => {
    console.log("🔄 Uploading image for room ID:", roomId);
    const response = await api.uploadRoomImage(roomId, formData);
    console.log("✅ Upload Room Image Response:", response);
    return { roomId, image: response };
  }
);

export const deleteRoomImage = createAsyncThunk(
  "partneredHotel/deleteRoomImage",
  async ({ imageId, roomId }) => {
    console.log("🔄 Deleting image ID:", imageId);
    await api.deleteRoomImage(imageId);
    console.log("✅ Delete Room Image Success - Image ID:", imageId);
    return { imageId, roomId };
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
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ────────────── HOTELS ──────────────
      .addCase(fetchAllOwnerHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOwnerHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = Array.isArray(action.payload) ? action.payload : [];
        console.log("✅ Hotels loaded into state:", state.hotels.length);
      })
      .addCase(fetchAllOwnerHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch hotels";
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
        const roomIndex = state.hotelRooms.findIndex((r) => r.id === action.payload.id);
        if (roomIndex !== -1) state.hotelRooms[roomIndex] = action.payload;

        if (state.selectedHotel?.rooms) {
          const hotelRoomIndex = state.selectedHotel.rooms.findIndex((r) => r.id === action.payload.id);
          if (hotelRoomIndex !== -1) {
            state.selectedHotel.rooms[hotelRoomIndex] = action.payload;
          }
        }
      })
      .addCase(deleteHotelRoom.fulfilled, (state, action) => {
        state.hotelRooms = state.hotelRooms.filter((r) => r.id !== action.payload);
        if (state.selectedHotel?.rooms) {
          state.selectedHotel.rooms = state.selectedHotel.rooms.filter(
            (r) => r.id !== action.payload
          );
        }
        delete state.roomImages[action.payload];
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
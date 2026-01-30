import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rooms: [],
  selectedRoom: null,
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setRooms: (state, action) => {
      state.rooms = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    selectRoom: (state, action) => {
      state.selectedRoom = action.payload;
    },
    updateRoom: (state, action) => {
      const index = state.rooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setRooms, setLoading, selectRoom, updateRoom, setError } = propertySlice.actions;
export default propertySlice.reducer;

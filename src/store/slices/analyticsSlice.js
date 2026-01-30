import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: null,
  revenueData: [],
  occupancyData: [],
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setRevenueData: (state, action) => {
      state.revenueData = action.payload;
    },
    setOccupancyData: (state, action) => {
      state.occupancyData = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setStats, setRevenueData, setOccupancyData, setLoading, setError } = analyticsSlice.actions;
export default analyticsSlice.reducer;

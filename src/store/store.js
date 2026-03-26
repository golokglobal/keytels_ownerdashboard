import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import propertyReducer from './slices/propertySlice';
import analyticsReducer from './slices/analyticsSlice';
import guestReducer from './slices/guestSlice';
import financialReducer from './slices/financialSlice';
import supportReducer from './slices/supportSlice';
import partneredHotelsReducer from './slices/PartnerHotelslice';
import partneredHotelBookingsReducer from './slices/partneredHotelBookingsSlice';
import permissionsReducer from './slices/PermissionsSlice';
import userReducer from './slices/userSlice';
import reviewReducer from './slices/reviewSlice';
import staffReducer from './slices/staffSlice';
import paymentsReducer from './slices/paymentsSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    property: propertyReducer,
    analytics: analyticsReducer,
    guests: guestReducer,
    financials: financialReducer,
    partneredhotels: partneredHotelsReducer,
    partneredHotelBookings: partneredHotelBookingsReducer,
    support: supportReducer,
    permissions: permissionsReducer,
    user: userReducer,
    reviews: reviewReducer,
    staff: staffReducer,
    payments: paymentsReducer,
  },
});

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { PrivateRoute } from './components/Layout/PrivateRoute';
import { Login } from './pages/Auth/Login';
import { OwnerLogin } from './pages/Auth/OwnerLogin';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { RoomsManagement } from './pages/Rooms';
import { Guests } from './pages/Guests';
import { Financials } from './pages/Financials';
import { Reviews } from './pages/Reviews';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { AddHotel } from './pages/AddHotel';
import { HotelList } from './pages/HotelList';
import { Permissions } from './pages/Permissions';
import { Staff } from './pages/Staff';
import Profile from './pages/Profile';
import { restoreUser } from './store/slices/userSlice';



function App() {
  const dispatch = useDispatch();

  // Restore user from localStorage on app initialization
  useEffect(() => {
    dispatch(restoreUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/owner-login" element={<OwnerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="rooms" element={<RoomsManagement />} />
          <Route path="guests" element={<Guests />} />
          <Route path="financials" element={<Financials />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="hotels" element={<HotelList />} />
          <Route path="add-hotel" element={<AddHotel />} />
          <Route path="add-hotel/:hotelId" element={<AddHotel />} />
          <Route path="hotels/edit/:hotelId" element={<AddHotel />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="staff" element={<Staff />} />
          <Route path="profile" element={<Profile />} />


        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

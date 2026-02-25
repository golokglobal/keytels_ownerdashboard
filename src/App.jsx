import { useEffect, Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { PrivateRoute } from './components/Layout/PrivateRoute';
import { Loader } from './components/common/Loader';
import { restoreUser } from './store/slices/userSlice';

// Auth pages — small, load eagerly
import { Login } from './pages/Auth/Login';
import { OwnerLogin } from './pages/Auth/OwnerLogin';
import { ForgotPassword } from './pages/Auth/ForgotPassword';

// Protected pages — lazy loaded for code splitting
const Dashboard      = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Bookings       = lazy(() => import('./pages/Bookings').then(m => ({ default: m.Bookings })));
const RoomsManagement = lazy(() => import('./pages/Rooms').then(m => ({ default: m.RoomsManagement })));
const Guests         = lazy(() => import('./pages/Guests').then(m => ({ default: m.Guests })));
const Financials     = lazy(() => import('./pages/Financials').then(m => ({ default: m.Financials })));
const Reviews        = lazy(() => import('./pages/Reviews').then(m => ({ default: m.Reviews })));
const Support        = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const Settings       = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const AddHotel       = lazy(() => import('./pages/AddHotel').then(m => ({ default: m.AddHotel })));
const HotelList      = lazy(() => import('./pages/HotelList').then(m => ({ default: m.HotelList })));
const Permissions    = lazy(() => import('./pages/Permissions').then(m => ({ default: m.Permissions })));
const Staff          = lazy(() => import('./pages/Staff').then(m => ({ default: m.Staff })));
const Profile        = lazy(() => import('./pages/Profile'));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/owner-login" element={<OwnerLogin />} />
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

          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

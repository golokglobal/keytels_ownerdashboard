import { useEffect, Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { PrivateRoute } from './components/Layout/PrivateRoute';
import { BillingGate } from './components/Layout/BillingGate';
import { Loader } from './components/common/Loader';
import { restoreUser } from './store/slices/userSlice';
import { Landing } from './pages/Landing';

// Auth pages — small, load eagerly
import { Login } from './pages/Auth/Login';
import { OwnerLogin } from './pages/Auth/OwnerLogin';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { PaymentSuccess } from './pages/Onboarding/PaymentSuccess';
import { ChoosePlan } from './pages/Onboarding/ChoosePlan';

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
const Staff          = lazy(() => import('./pages/Staff').then(m => ({ default: m.Staff })));
const Profile        = lazy(() => import('./pages/Profile'));
const CheckinsOuts   = lazy(() => import('./pages/CheckinsOuts').then(m => ({ default: m.CheckinsOuts })));
const CatalogManagement = lazy(() => import('./pages/CatalogManagement').then(m => ({ default: m.CatalogManagement })));
const HotelDetail       = lazy(() => import('./pages/HotelDetail').then(m => ({ default: m.HotelDetail })));
const Marketing         = lazy(() => import('./pages/Marketing').then(m => ({ default: m.Marketing })));
const Subscription      = lazy(() => import('./pages/Subscription').then(m => ({ default: m.Subscription })));

/* Listens for auth:logout events fired by the axios interceptor */
function AuthLogoutListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => navigate('/', { replace: true });
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [navigate]);
  return null;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AuthLogoutListener />
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Public — always accessible */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/owner-login" element={<OwnerLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected — authenticated partners only */}
          <Route
            element={
              <PrivateRoute>
                <BillingGate>
                  <MainLayout />
                </BillingGate>
              </PrivateRoute>
            }
          >
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
            <Route path="staff" element={<Staff />} />
            <Route path="checkins-outs" element={<CheckinsOuts />} />
            <Route path="profile" element={<Profile />} />
            <Route path="catalog" element={<CatalogManagement />} />
            <Route path="hotels/:hotelId" element={<HotelDetail />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>

          {/* Stripe redirect — must be public (user lands here from Stripe) */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/choose-plan" element={<ChoosePlan />} />

          <Route path="/register" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

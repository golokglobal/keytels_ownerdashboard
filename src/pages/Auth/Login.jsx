// ============================================================================
// FILE 5: src/pages/auth/Login.jsx
// ============================================================================
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hotel, User, Lock, ArrowRight, Shield, Users, Crown, Eye, EyeOff } from 'lucide-react';
import { signinUser, signinOwner } from '../../store/slices/userSlice';
import { Loader } from '../../components/common/Loader';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff', // default
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let resultAction;

      // Use different action based on selected role
      if (formData.role === 'owner') {
        resultAction = await dispatch(
          signinOwner({
            username: formData.username.trim(),
            password: formData.password,
          })
        );
      } else {
        resultAction = await dispatch(
          signinUser({
            username: formData.username.trim(),
            password: formData.password,
            role: formData.role,
          })
        );
      }

      const isSuccess = formData.role === 'owner'
        ? signinOwner.fulfilled.match(resultAction)
        : signinUser.fulfilled.match(resultAction);

      if (isSuccess) {
        const user = resultAction.payload?.user;

        if (!user?.role) {
          throw new Error('No role received from server');
        }

        const roleFromServer = user.role.toUpperCase().trim();
        console.log('✅ Login success → Role from server:', roleFromServer);

        // Validate selected role matches server role
        const roleMap = {
          owner: 'HOTEL_OWNER',
          manager: 'HOTEL_MANAGER',
          staff: 'HOTEL_STAFF',
        };
        const expectedRole = roleMap[formData.role];

        if (roleFromServer !== expectedRole) {
          // Clear any stored auth since this login attempt is rejected
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('hotelId');
          localStorage.removeItem('hotelIds');
          setError(`Access denied. Your account does not have ${formData.role} privileges.`);
          return;
        }

        // Small delay to ensure Redux state is fully updated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));

        // All roles use the same dashboard
        if (['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF'].includes(roleFromServer)) {
          navigate('/dashboard', { replace: true });
        } else {
          console.warn('⚠️ Unknown role:', roleFromServer);
          setError('Unknown role. Contact support.');
        }
      } else {
        // Handle rejected action — payload may be a string or object
        const p = resultAction.payload;
        const errMsg =
          (typeof p === 'string' ? p : p?.message || p?.error) ||
          resultAction.error?.message ||
          'Login failed – check username/password';
        setError(errMsg);
        console.warn('❌ Login rejected:', errMsg);
      }
    } catch (err) {
      console.error('❌ Login error:', err);

      if (err.message?.includes('Network') || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Is backend running?');
      } else if (err.message?.includes('ECONNREFUSED')) {
        setError('Backend server is not running or unreachable.');
      } else {
        setError(err.message || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Keytels
            </h1>
          </div>
          <p className="text-slate-600">Welcome back! Please login to continue.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Login as
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'staff' })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'staff'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Users className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'manager' })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'manager'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Shield className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'owner' })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'owner'
                      ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Crown className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Owner</span>
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Hint: Use lowercase (e.g., jane.manager33)
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-slate-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.username.trim() || !formData.password}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
                formData.role === 'owner'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  : formData.role === 'manager'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              } disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]`}
            >
              {loading ? <Loader size="sm" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

        </div>

    
      </motion.div>
    </div>
  );
};

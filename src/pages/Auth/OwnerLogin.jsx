import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hotel, Mail, Lock, ArrowRight, Eye, EyeOff, Crown, Shield, Clock } from 'lucide-react';
import { signinOwner, googleSigninOwner } from '../../store/slices/userSlice';
import { GoogleLogin } from '@react-oauth/google';
import { Loader } from '../../components/common/Loader';

export const OwnerLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resultAction = await dispatch(
        signinOwner({
          username: formData.username.trim(),
          password: formData.password,
        })
      );

      if (signinOwner.fulfilled.match(resultAction)) {
        const user = resultAction.payload?.user;

        if (!user?.role) {
          throw new Error('No role received from server');
        }

        const roleFromServer = user.role.toUpperCase().trim();
        console.log('✅ Owner Login success → Role from server:', roleFromServer);

        // Redirect to owner dashboard
        if (roleFromServer === 'HOTEL_OWNER') {
          console.log('🔀 Redirecting to:', redirectTo);
          navigate(redirectTo);
        } else {
          console.warn('⚠️ Unexpected role for owner login:', roleFromServer);
          setError('Invalid account type. Please use the correct login page.');
        }
      } else {
        // Handle rejected action
        const errMsg =
          resultAction.payload?.message ||
          resultAction.error?.message ||
          'Login failed – check your credentials';
        setError(errMsg);
        console.warn('❌ Owner login rejected:', errMsg);
      }
    } catch (err) {
      console.error('❌ Owner login error:', err);

      if (err.message?.includes('Network') || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please check your connection.');
      } else if (err.message?.includes('ECONNREFUSED')) {
        setError('Backend server is not running or unreachable.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setError('');
    setLoading(true);
    try {
      const result = await dispatch(googleSigninOwner(credentialResponse.credential));
      if (googleSigninOwner.fulfilled.match(result)) {
        navigate(redirectTo);
      } else {
        setError(result.payload || 'Google sign-in failed. Ensure your Google account has Owner access.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Desiney
            </h1>
          </div>
          <p className="text-slate-600 text-lg font-medium">Hotel Owner Portal</p>
          <p className="text-slate-500 text-sm mt-1">Manage your hotels with ease</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (() => {
              const isLocked = error.includes('temporarily locked');
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-lg text-sm flex items-start gap-3 border-l-4 ${
                    isLocked
                      ? 'bg-amber-50 border border-amber-200 border-l-amber-500 text-amber-800'
                      : 'bg-red-50 border border-red-200 border-l-red-500 text-red-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isLocked ? 'bg-amber-200' : 'bg-red-200'
                  }`}>
                    {isLocked
                      ? <Clock className="w-3.5 h-3.5 text-amber-700" />
                      : <span className="text-xs font-bold">!</span>
                    }
                  </div>
                  {isLocked ? (
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Access temporarily locked</p>
                      <p className="text-amber-800">Too many failed login attempts from this device. Please try again in 15 minutes.</p>
                    </div>
                  ) : (
                    <span>{error}</span>
                  )}
                </motion.div>
              );
            })()}

            {/* Username/Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  placeholder="Enter your email or username"
                  required
                  autoComplete="username"
                />
              </div>
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
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-slate-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-amber-600 hover:text-amber-800 font-medium transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.username.trim() || !formData.password || !!(error?.includes('temporarily locked'))}
              className="w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {loading ? (
                <Loader size="sm" />
              ) : (
                <>
                  Sign In as Owner <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In */}
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 whitespace-nowrap">or continue with Google</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                width="368"
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>
          </div>

          {/* Staff Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Are you a staff member?{' '}
              <Link
                to="/login"
                className="text-amber-600 hover:text-amber-800 font-medium transition"
              >
                Staff Login
              </Link>
            </p>
          </div>
        </div>

        {/* Test Credentials Helper */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-800">i</span>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-amber-900 mb-2">Test Credentials:</p>
              <p className="text-amber-800">
                <strong>Email:</strong> fardheen.ahmad@hotelgolok.com
              </p>
              <p className="text-amber-800 mt-1">
                <strong>Password:</strong> manikanta@11
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 grid grid-cols-3 gap-3 text-center"
        >
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <Hotel className="w-6 h-6 mx-auto mb-1 text-amber-600" />
            <p className="text-xs text-slate-600 font-medium">Multi-Hotel</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <Crown className="w-6 h-6 mx-auto mb-1 text-amber-600" />
            <p className="text-xs text-slate-600 font-medium">Full Control</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <Shield className="w-6 h-6 mx-auto mb-1 text-amber-600" />
            <p className="text-xs text-slate-600 font-medium">Secure</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

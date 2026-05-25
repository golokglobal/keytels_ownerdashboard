import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hotel,
  User,
  Lock,
  ArrowRight,
  Shield,
  Users,
  Crown,
  Eye,
  EyeOff,
  Star,
  BadgeCheck,
  TrendingUp,
  BarChart3,
  Headphones,
  ChevronLeft,
} from 'lucide-react';
import { signinUser, signinOwner } from '../../store/slices/userSlice';
import { Loader } from '../../components/common/Loader';

const ROLE_OPTIONS = [
  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
    description: 'Front desk & operations',
    activeClass: 'border-teal-500 bg-teal-500/10 text-teal-400',
  },
  {
    id: 'manager',
    label: 'Manager',
    icon: Shield,
    description: 'Property management',
    activeClass: 'border-teal-500 bg-teal-500/10 text-teal-400',
  },
  {
    id: 'owner',
    label: 'Owner',
    icon: Crown,
    description: 'Full portal access',
    activeClass: 'border-teal-500 bg-teal-500/10 text-teal-400',
  },
];

const FEATURES = [
  { icon: BarChart3, text: 'Real-time revenue & occupancy analytics' },
  { icon: TrendingUp, text: 'Multi-property management in one portal' },
  { icon: BadgeCheck, text: 'Verified partner onboarding & support' },
  { icon: Headphones, text: '24/7 priority partner care' },
];

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [formData, setFormData] = useState({ username: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let resultAction;

      if (formData.role === 'owner') {
        resultAction = await dispatch(
          signinOwner({ username: formData.username.trim(), password: formData.password })
        );
      } else {
        resultAction = await dispatch(
          signinUser({ username: formData.username.trim(), password: formData.password, role: formData.role })
        );
      }

      const isSuccess =
        formData.role === 'owner'
          ? signinOwner.fulfilled.match(resultAction)
          : signinUser.fulfilled.match(resultAction);

      if (isSuccess) {
        const user = resultAction.payload?.user;
        if (!user?.role) throw new Error('No role received from server');

        const roleFromServer = user.role.toUpperCase().trim();
        const roleMap = { owner: 'HOTEL_OWNER', manager: 'HOTEL_MANAGER', staff: 'HOTEL_STAFF' };
        const expectedRole = roleMap[formData.role];

        if (roleFromServer !== expectedRole) {
          ['accessToken', 'refreshToken', 'user', 'userId', 'userRole', 'hotelId', 'hotelIds'].forEach((k) =>
            localStorage.removeItem(k)
          );
          setError(`Access denied. Your account does not have ${formData.role} privileges.`);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF'].includes(roleFromServer)) {
          navigate(redirectTo, { replace: true });
        } else {
          setError('Unknown role. Contact support.');
        }
      } else {
        const p = resultAction.payload;
        const errMsg =
          (typeof p === 'string' ? p : p?.message || p?.error) ||
          resultAction.error?.message ||
          'Login failed – check username/password';
        setError(errMsg);
      }
    } catch (err) {
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
    <div className="min-h-screen flex bg-[#0b1728]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden px-12 py-10">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[100px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Desiney</p>
            <p className="text-teal-400 text-[10px] font-semibold uppercase tracking-widest">Partner Hub</p>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative my-auto">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Your partner portal.<br />
            <span className="text-teal-400">All in one place.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Manage properties, track revenue, and grow your hospitality business with Desiney.
          </p>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-sm text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex gap-0.5 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-300 italic leading-relaxed">
              "Our occupancy rose 19% within 60 days after onboarding to Desiney. The portal is the best we've used."
            </p>
            <p className="text-xs text-slate-500 mt-3">— Alpine Suites, Aspen</p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-auto grid grid-cols-3 gap-3">
          {[
            { value: '4,200+', label: 'Partners' },
            { value: '+31%', label: 'Avg RevPAR' },
            { value: '52', label: 'Markets' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="text-sm text-slate-500">
            Not a partner?{' '}
            <Link to="/#request" className="text-teal-600 font-semibold hover:text-teal-700">
              Request access
            </Link>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Desiney Partner Hub</p>
                <p className="text-teal-600 text-[10px] font-semibold uppercase tracking-widest">Secure Access</p>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Partner Sign In</h1>
            <p className="text-slate-500 text-sm mb-8">
              Access your partner dashboard securely.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Access level</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.id })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                        formData.role === r.id
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <r.icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">Use lowercase (e.g., jane.manager33)</p>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 accent-teal-600" />
                <span className="text-sm text-slate-600">Remember me on this device</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !formData.username.trim() || !formData.password}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-teal-100 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              By signing in, you agree to Desiney Partner Terms and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

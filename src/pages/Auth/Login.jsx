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
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { signinUser, signinOwner, googleSigninUser, googleSigninOwner } from '../../store/slices/userSlice';
import { GoogleLogin } from '@react-oauth/google';
import { Loader } from '../../components/common/Loader';

const ROLE_OPTIONS = [
  { id: 'staff',   label: 'Staff',   icon: Users,  description: 'Front desk & ops' },
  { id: 'manager', label: 'Manager', icon: Shield, description: 'Property management' },
  { id: 'owner',   label: 'Owner',   icon: Crown,  description: 'Full portal access' },
];

const FEATURES = [
  { icon: BarChart3,   text: 'Real-time revenue & occupancy analytics' },
  { icon: TrendingUp,  text: 'Multi-property management in one portal' },
  { icon: BadgeCheck,  text: 'Verified partner onboarding & support' },
  { icon: Headphones,  text: '24/7 priority partner care' },
];

export const Login = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [formData, setFormData]         = useState({ username: '', password: '', role: 'staff' });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let resultAction;
      if (formData.role === 'owner') {
        resultAction = await dispatch(signinOwner({ username: formData.username.trim(), password: formData.password }));
      } else {
        resultAction = await dispatch(signinUser({ username: formData.username.trim(), password: formData.password, role: formData.role }));
      }

      const isSuccess = formData.role === 'owner'
        ? signinOwner.fulfilled.match(resultAction)
        : signinUser.fulfilled.match(resultAction);

      if (isSuccess) {
        const user = resultAction.payload?.user;
        if (!user?.role) throw new Error('No role received from server');

        const roleFromServer = user.role.toUpperCase().trim();
        const roleMap = { owner: 'HOTEL_OWNER', manager: 'HOTEL_MANAGER', staff: 'HOTEL_STAFF' };
        const expectedRole = roleMap[formData.role];

        if (roleFromServer !== expectedRole) {
          ['accessToken','refreshToken','user','userId','userRole','hotelId','hotelIds'].forEach(k => localStorage.removeItem(k));
          setError(`Access denied. Your account does not have ${formData.role} privileges.`);
          return;
        }

        await new Promise(r => setTimeout(r, 100));
        navigate(redirectTo, { replace: true });
      } else {
        const p = resultAction.payload;
        setError(
          (typeof p === 'string' ? p : p?.message || p?.error) ||
          resultAction.error?.message ||
          'Login failed – check username/password'
        );
      }
    } catch (err) {
      if (err.message?.includes('Network') || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Is backend running?');
      } else {
        setError(err.message || 'Something went wrong. Try again.');
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
      const thunk = formData.role === 'owner' ? googleSigninOwner : googleSigninUser;
      const result = await dispatch(thunk(credentialResponse.credential));
      const isSuccess = formData.role === 'owner'
        ? googleSigninOwner.fulfilled.match(result)
        : googleSigninUser.fulfilled.match(result);

      if (isSuccess) {
        const roleFromServer = result.payload?.user?.role?.toUpperCase();
        const roleMap = { owner: 'HOTEL_OWNER', manager: 'HOTEL_MANAGER', staff: 'HOTEL_STAFF' };
        if (roleFromServer !== roleMap[formData.role]) {
          setError(`Access denied. Your Google account does not have ${formData.role} privileges.`);
          return;
        }
        navigate(redirectTo, { replace: true });
      } else {
        setError(result.payload || 'Google sign-in failed.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .lf-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .lf-input {
          width: 100%; padding: 11px 16px 11px 42px;
          border: 1.5px solid #e7e5e4; border-radius: 12px;
          font-size: 14px; font-family: 'Outfit', sans-serif;
          background: #fff; color: #1c1917; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lf-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
        .lf-input::placeholder { color: #a8a29e; }
        .lf-input-pw {
          width: 100%; padding: 11px 42px;
          border: 1.5px solid #e7e5e4; border-radius: 12px;
          font-size: 14px; font-family: 'Outfit', sans-serif;
          background: #fff; color: #1c1917; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lf-input-pw:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
        .lf-input-pw::placeholder { color: #a8a29e; }
        .lf-role-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 11px 6px; border-radius: 12px; border: 1.5px solid #e7e5e4;
          background: #fff; cursor: pointer; transition: all 0.18s;
          font-family: 'Outfit', sans-serif;
        }
        .lf-role-btn:hover { border-color: #fcd34d; background: #fffbeb; }
        .lf-role-btn.active { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
        .lf-role-btn.active .lf-role-icon { color: #d97706; }
        .lf-role-icon { color: #d1cdc9; transition: color 0.18s; }
        .lf-submit {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff; font-weight: 700; font-size: 14px;
          font-family: 'Outfit', sans-serif;
          border: none; border-radius: 12px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; box-shadow: 0 4px 16px rgba(245,158,11,0.3);
        }
        .lf-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #d97706, #b45309);
          box-shadow: 0 6px 24px rgba(245,158,11,0.4); transform: translateY(-1px);
        }
        .lf-submit:active:not(:disabled) { transform: translateY(0); }
        .lf-submit:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>

      {/* ── LEFT — hotel imagery ── */}
      <div className="hidden lg:flex flex-col w-[460px] shrink-0 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=85"
          alt="Luxury hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(10,6,2,0.9) 0%, rgba(10,6,2,0.6) 60%, rgba(10,6,2,0.4) 100%)' }} />

        <div className="relative flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Hotel size={19} color="#fff" />
            </div>
            <div>
              <p className="lf-display font-black text-white text-xl leading-none">Desiney</p>
              <p style={{ color: '#fcd34d', fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>
                Owner Portal
              </p>
            </div>
          </div>

          {/* Copy */}
          <div className="my-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
              <Sparkles size={12} color="#fcd34d" />
              <span style={{ color: '#fcd34d', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Official Partner Portal
              </span>
            </div>

            <h2 className="lf-display font-black text-white leading-tight mb-3" style={{ fontSize: 30 }}>
              Your hotel.<br />
              <span style={{ color: '#fbbf24' }}>Your revenue.</span><br />
              Our platform.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Manage properties, track revenue, and grow your hospitality business with Desiney.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FEATURES.map((f) => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <f.icon size={15} color="#fbbf24" />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-8 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />)}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>
                "Our occupancy rose 19% within 60 days. The Desiney portal is the best we've used across any OTA."
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 10 }}>— Alpine Suites, Partner since 2024</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[{ value: '4,200+', label: 'Partners' }, { value: '+31%', label: 'Avg RevPAR' }, { value: '52', label: 'Markets' }].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="lf-display font-black text-white" style={{ fontSize: 18, lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — form ── */}
      <div className="flex-1 flex flex-col" style={{ background: '#faf8f5' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid #e7e5e4', background: '#fff' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#78716c', textDecoration: 'none' }}
            className="hover:text-stone-900 transition-colors">
            <ChevronLeft size={15} /> Back to home
          </Link>
          <div style={{ fontSize: 13, color: '#78716c' }}>
            Not a partner?{' '}
            <Link to="/#request" style={{ color: '#d97706', fontWeight: 700, textDecoration: 'none' }} className="hover:text-amber-800 transition-colors">
              Request access
            </Link>
          </div>
        </div>

        {/* Form body */}
        <div className="flex-1 flex items-center justify-center" style={{ padding: '40px 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hotel size={16} color="#fff" />
              </div>
              <div>
                <p className="lf-display font-black text-stone-900" style={{ fontSize: 16, lineHeight: 1 }}>Desiney</p>
                <p style={{ color: '#d97706', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Owner Portal</p>
              </div>
            </div>

            <h1 className="lf-display font-black text-stone-900" style={{ fontSize: 28, marginBottom: 4 }}>
              Partner Sign In
            </h1>
            <p style={{ color: '#78716c', fontSize: 14, marginBottom: 28 }}>
              Access your partner dashboard securely.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Error */}
              {error && (() => {
                const isLocked = error.includes('temporarily locked');
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5 border-l-4 ${
                      isLocked
                        ? 'bg-amber-50 border border-amber-200 border-l-amber-500'
                        : 'bg-red-50 border border-red-200 border-l-red-500'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" className="shrink-0 mt-0.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <div>
                          <p className="font-bold text-amber-900 mb-1">Access temporarily locked</p>
                          <p className="text-amber-800 leading-relaxed">Too many failed login attempts from this device. Please try again in 15 minutes.</p>
                        </div>
                      </>
                    ) : (
                      <span className="text-red-700">{error}</span>
                    )}
                  </motion.div>
                );
              })()}

              {/* Role selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 8 }}>
                  Access level
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.id })}
                      className={`lf-role-btn ${formData.role === r.id ? 'active' : ''}`}
                    >
                      <r.icon size={18} className="lf-role-icon" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#292524' }}>{r.label}</span>
                      <span style={{ fontSize: 10, color: '#a8a29e' }}>{r.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 6 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#a8a29e"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="lf-input"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                  />
                </div>
                <p style={{ marginTop: 4, fontSize: 11, color: '#a8a29e' }}>Use lowercase (e.g., jane.manager33)</p>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#44403c' }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: '#d97706', fontWeight: 600, textDecoration: 'none' }}
                    className="hover:text-amber-800 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#a8a29e"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="lf-input-pw"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 24, fontSize: 13, color: '#78716c' }}>
                <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#f59e0b' }} />
                Remember me on this device
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !formData.username.trim() || !formData.password || !!(error?.includes('temporarily locked'))}
                className="lf-submit"
              >
                {loading ? <Loader size="sm" /> : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Google Sign In */}
            <div style={{ margin: '16px 0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e7e5e4' }} />
              <span style={{ fontSize: 11, color: '#a8a29e', whiteSpace: 'nowrap' }}>or continue with Google</span>
              <div style={{ flex: 1, height: 1, background: '#e7e5e4' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 4px' }}>
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

            <p style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#a8a29e' }}>
              By signing in, you agree to Desiney Partner Terms and Privacy Policy.
            </p>

            {/* Owner portal shortcut */}
            <div style={{
              marginTop: 20, padding: '14px 16px',
              background: '#fff', border: '1px solid #e7e5e4', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#292524' }}>Hotel Owner?</p>
                <p style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>Use dedicated owner login</p>
              </div>
              <Link to="/owner-login" style={{ fontSize: 12, fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                className="hover:text-amber-800 transition-colors">
                Owner Login <ChevronRight size={13} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

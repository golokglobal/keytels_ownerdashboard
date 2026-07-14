import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hotel,
  Globe,
  LineChart,
  Users,
  Headphones,
  ShieldCheck,
  Building2,
  BadgeCheck,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Lock,
  Star,
  ChevronDown,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Zap,
  Award,
  Clock,
  Play,
  ChevronRight,
  Sparkles,
  Wifi,
  CreditCard,
  BellRing,
} from 'lucide-react';
import { submitPartnerRequest } from '../api/partnerRequests';

const NAV_LINKS = [
  { label: 'About', href: '#why' },
  { label: 'How It Works', href: '#how' },
  { label: 'Partners', href: '#stories' },
  { label: 'Request Access', href: '#request' },
];

const STATS = [
  { value: '4,200+', label: 'Partner Properties', icon: Building2 },
  { value: '52', label: 'Markets Worldwide', icon: Globe },
  { value: '₹2.4B+', label: 'Partner Revenue', icon: TrendingUp },
  { value: '94%', label: 'Partner Retention', icon: Award },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Real-Time Revenue Analytics',
    text: 'Live RevPAR, ADR, and occupancy dashboards built for operators — not guests.',
    span: 'lg:col-span-2',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    dark: true,
  },
  {
    icon: Globe,
    title: 'Multi-Channel Distribution',
    text: 'Push rates instantly. No manual updates, no parity issues.',
    span: 'lg:col-span-1',
    img: null,
    dark: false,
  },
  {
    icon: Building2,
    title: 'Multi-Property Management',
    text: 'Every property. One portal. Switch hotels in a single click.',
    span: 'lg:col-span-1',
    img: null,
    dark: false,
  },
  {
    icon: ShieldCheck,
    title: 'Verified Partner Onboarding',
    text: 'Dedicated onboarding team, compliance checks, and go-live support — all included.',
    span: 'lg:col-span-1',
    img: null,
    dark: false,
  },
  {
    icon: Headphones,
    title: '24/7 Partner Support',
    text: 'Priority access to our partner care team. Average response under 2 hours.',
    span: 'lg:col-span-2',
    img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    dark: true,
  },
];

const STEPS = [
  { num: '01', title: 'Submit Request', text: 'Fill in your business and property info. Takes under 3 minutes.', icon: Mail },
  { num: '02', title: 'Verification', text: 'Our team verifies your business and gets you onboarded within 72 hours.', icon: ShieldCheck },
  { num: '03', title: 'Go Live & Grow', text: 'Access your portal, connect inventory, and start receiving bookings.', icon: Zap },
];

const TESTIMONIALS = [
  {
    name: 'Rajeev Sharma',
    role: 'Managing Director',
    company: 'Aspen Stay Group',
    text: 'We saw 18% occupancy lift in the first month. The partner portal is the most intuitive we\'ve used across any OTA.',
    stat: '+18% Occupancy',
    rating: 5,
    avatar: 'RS',
    avatarColor: 'from-orange-500 to-red-500',
  },
  {
    name: 'Priya Mehta',
    role: 'Revenue Head',
    company: 'Vista Retreats',
    text: 'Managing 5 properties from one dashboard was a dream. Desiney made it reality. Support responds in under an hour.',
    stat: '5 Hotels, 1 Portal',
    rating: 5,
    avatar: 'PM',
    avatarColor: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Arjun Nair',
    role: 'CEO',
    company: 'Urban Nest Hotels',
    text: 'The payout tracking finally matches our finance workflow. No more chasing numbers across spreadsheets.',
    stat: '+31% RevPAR',
    rating: 5,
    avatar: 'AN',
    avatarColor: 'from-yellow-500 to-amber-500',
  },
];

const ORG_TYPES = [
  'Hotel Group', 'Independent Hotel', 'Resort', 'Boutique Property',
  'Service Apartments', 'Hostel / Budget Stay', 'Other',
];

// Video modal component
const VideoModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.85)' }}
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <iframe
        className="w-full h-full"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
        title="Desiney Partner Portal Demo"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

export const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '', organizationType: '', contactName: '',
    email: '', phoneNumber: '', city: '', propertyCount: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goLogin = () => navigate('/login');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(''); setSubmitSuccess(''); setSubmitting(true);
    try {
      const extra = [
        formData.city ? `City: ${formData.city}` : null,
        formData.propertyCount ? `Properties: ${formData.propertyCount}` : null,
      ].filter(Boolean).join(' | ');
      const composedMessage = [formData.message?.trim(), extra].filter(Boolean).join(' — ');
      const payload = {
        businessName: formData.businessName.trim(),
        organizationType: formData.organizationType.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        message: composedMessage || 'Requesting partnership access.',
      };
      const res = await submitPartnerRequest(payload);
      const requestId = res?.request?.requestId;
      setSubmitSuccess(
        requestId
          ? `Request submitted! Reference: ${requestId}. Our team will reach out within 24 hours.`
          : 'Request submitted! Our partner team will reach out within 24 hours.'
      );
      setFormData({ businessName: '', organizationType: '', contactName: '', email: '', phoneNumber: '', city: '', propertyCount: '', message: '' });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 antialiased" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body { font-family: 'Outfit', sans-serif; }
        .hero-img-overlay { background: linear-gradient(135deg, rgba(15,10,5,0.82) 0%, rgba(15,10,5,0.4) 60%, rgba(15,10,5,0.15) 100%); }
        .bento-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .bento-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }
        .btn-amber { background: #f59e0b; color: #fff; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; }
        .btn-amber:hover { background: #d97706; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,158,11,0.35); }
        .btn-amber:active { transform: translateY(0); }
        .stat-card { background: white; border: 1px solid #e7e5e4; }
        .step-line::after {
          content: ''; position: absolute; top: 2.5rem; left: calc(50% + 2.5rem);
          width: calc(100% - 5rem); height: 1px; background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }
        .video-btn { backdrop-filter: blur(12px); }
        input:focus, select:focus, textarea:focus {
          outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        }
        .fade-in { animation: fadeUp 0.5s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── VIDEO MODAL ── */}
      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}

      {/* ── NAV ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300 font-body"
        style={{
          background: scrolled ? 'rgba(255,252,247,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Hotel size={18} color="#fff" />
            </div>
            <div className="leading-tight">
              <span className={`font-bold text-lg tracking-tight ${scrolled ? 'text-stone-900' : 'text-white'}`} style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Desiney
              </span>
              <span className={`block text-[9px] font-semibold uppercase tracking-[0.15em] -mt-0.5 ${scrolled ? 'text-amber-600' : 'text-amber-300'}`}>
                Owner Portal
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  scrolled ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={goLogin}
              className={`px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-stone-600 hover:text-stone-900' : 'text-white/70 hover:text-white'}`}>
              Partner Login
            </button>
            <a href="#request" className="btn-amber px-5 py-2 text-sm font-semibold rounded-xl">
              Request Access
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(v => !v)}
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-stone-700 hover:bg-stone-100' : 'text-white hover:bg-white/10'}`}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white/98 border-t border-stone-100 px-5 pb-4 pt-2 font-body">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-3 text-stone-600 hover:text-stone-900 text-sm border-b border-stone-50 last:border-0">
                {l.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={goLogin}
                className="py-2.5 text-sm font-medium text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
                Partner Login
              </button>
              <a href="#request" onClick={() => setMenuOpen(false)}
                className="btn-amber py-2.5 text-sm font-semibold text-center rounded-xl">
                Request Access
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background hotel image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=85"
            alt="Luxury hotel"
            className="w-full h-full object-cover"
          />
          <div className="hero-img-overlay absolute inset-0" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 pt-28 pb-16 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 fade-in"
              style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <Sparkles size={13} color="#fbbf24" />
              <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Official Partner Program 2026
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight fade-in" style={{ animationDelay: '0.1s' }}>
              Your hotel.<br />
              <span style={{ color: '#fbbf24' }}>Your revenue.</span><br />
              Our platform.
            </h1>

            <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-xl font-body fade-in" style={{ animationDelay: '0.2s' }}>
              Desiney Owner Portal gives hotel operators, chains, and boutique properties
              everything they need to list, manage, and grow — in one powerful dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 fade-in" style={{ animationDelay: '0.3s' }}>
              <a href="#request"
                className="btn-amber inline-flex items-center gap-2.5 px-7 py-3.5 font-semibold rounded-xl text-sm shadow-xl">
                Become a Partner
                <ArrowRight size={16} />
              </a>
              <button
                onClick={() => setVideoOpen(true)}
                className="video-btn inline-flex items-center gap-2.5 px-7 py-3.5 font-semibold rounded-xl text-sm text-white transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Play size={12} color="#fff" fill="#fff" />
                </div>
                Watch Platform Demo
              </button>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4 fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex -space-x-2">
                {['AS', 'PM', 'AN', 'CR', 'VR'].map((initials, i) => (
                  <div key={initials}
                    className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${30 + i * 12},90%,50%), hsl(${50 + i * 12},80%,45%))` }}>
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />)}
                </div>
                <p className="text-white/60 text-xs">Trusted by <strong className="text-white">4,200+</strong> properties</p>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="mt-20 flex justify-start">
            <a href="#stats" className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors text-xs font-body">
              <ChevronDown size={16} className="animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-stone-100">
            {STATS.map((s) => (
              <div key={s.label} className="py-8 px-6 text-center group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500 transition-colors">
                  <s.icon size={18} className="text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <p className="font-display text-3xl font-black text-stone-900">{s.value}</p>
                <p className="text-sm text-stone-400 mt-1 font-body">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAND ── */}
      <section className="bg-stone-50 border-b border-stone-200 py-5 overflow-hidden">
        <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 font-body">
          Trusted by leading hotel groups
        </p>
        <div className="flex flex-wrap justify-center gap-3 px-4">
          {['Aspen Stay Group', 'Vista Retreats', 'Coastal Suites', 'Urban Nest Hotels', 'Peak Resorts', 'Blue Horizon'].map((brand) => (
            <div key={brand} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-600 font-semibold shadow-sm font-body">
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT + IMAGE SPLIT ── */}
      <section id="why" className="py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.15em] mb-4 font-body">
                About Desiney Partner Portal
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-black text-stone-900 leading-[1.1]">
                Built for hotel operators,<br />
                <span className="text-amber-500">not guests.</span>
              </h2>
              <p className="mt-5 text-stone-500 text-lg leading-relaxed font-body">
                Desiney Owner Portal is the B2B engine behind our platform. We built every feature
                around the real pain points of hotel owners — from occupancy gaps to payout delays
                to managing multiple properties across cities.
              </p>
              <p className="mt-4 text-stone-500 leading-relaxed font-body">
                Unlike general OTA dashboards, our portal gives you operator-grade tools: dynamic pricing
                intelligence, channel-by-channel revenue attribution, real-time booking feeds, and
                financial reporting that actually makes sense to your accounting team.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: Wifi, label: 'Live Booking Feed', desc: 'Instant notifications per booking' },
                  { icon: CreditCard, label: 'Transparent Payouts', desc: 'Weekly cycle, no hidden cuts' },
                  { icon: BarChart3, label: 'Revenue Intelligence', desc: 'Market benchmarking built in' },
                  { icon: BellRing, label: 'Smart Alerts', desc: 'Overbooking & rate parity alerts' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <item.icon size={15} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 font-body">{item.label}</p>
                      <p className="text-xs text-stone-400 mt-0.5 font-body">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="#request" className="mt-8 btn-amber inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl text-sm">
                Join as a Partner <ArrowRight size={15} />
              </a>
            </div>

            {/* Right — stacked images */}
            <div className="relative hidden lg:block">
              <div className="rounded-3xl overflow-hidden h-96 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85"
                  alt="Hotel lobby"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-56 h-44 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=85"
                  alt="Hotel room"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-40 h-32 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=85"
                  alt="Hotel pool"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute bottom-8 right-4 bg-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrendingUp size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 font-body">Avg. Revenue Growth</p>
                  <p className="font-display font-black text-stone-900 text-lg leading-none">+31%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section className="py-20 bg-stone-50 border-y border-stone-200">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.15em] mb-3 font-body">Platform features</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-stone-900">
              Everything you need, nothing you don't
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Row 1 */}
            <div className="lg:col-span-2 rounded-3xl overflow-hidden relative min-h-64 bento-hover cursor-default"
              style={{ background: 'linear-gradient(135deg, #1c1108, #2d1a0a)' }}>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Analytics"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative p-8 flex flex-col justify-between h-full">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <BarChart3 size={20} color="#fbbf24" />
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-2xl font-bold text-white mb-2">Real-Time Revenue Analytics</h3>
                  <p className="text-white/60 text-sm font-body leading-relaxed">
                    Live RevPAR, ADR, occupancy, and channel performance dashboards built for operators — not OTA guests.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden bg-white border border-stone-200 p-7 flex flex-col justify-between bento-hover cursor-default">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Globe size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-2">Multi-Channel Distribution</h3>
                <p className="text-stone-500 text-sm font-body leading-relaxed">Push rates and availability to premium demand channels instantly — no manual updates, no parity issues.</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="rounded-3xl overflow-hidden bg-white border border-stone-200 p-7 flex flex-col justify-between bento-hover cursor-default">
              <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                <Building2 size={20} className="text-stone-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-2">Multi-Property Management</h3>
                <p className="text-stone-500 text-sm font-body leading-relaxed">Every property, one portal. Switch hotels in a single click with a unified inventory view.</p>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden bg-white border border-stone-200 p-7 flex flex-col justify-between bento-hover cursor-default">
              <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <ShieldCheck size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-2">Verified Onboarding</h3>
                <p className="text-stone-500 text-sm font-body leading-relaxed">Dedicated team, compliance checks, and go-live support — all included from day one.</p>
              </div>
            </div>

            <div className="lg:col-span-1 rounded-3xl overflow-hidden relative min-h-56 bento-hover cursor-default"
              style={{ background: 'linear-gradient(135deg, #0e1a2e, #1a2e4a)' }}>
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
                alt="Support"
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              <div className="relative p-7 flex flex-col justify-between h-full">
                <div className="w-11 h-11 rounded-xl bg-blue-400/20 border border-blue-400/30 flex items-center justify-center">
                  <Headphones size={20} color="#93c5fd" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">24/7 Partner Support</h3>
                  <p className="text-white/55 text-sm font-body">Priority partner care. &lt;2 hour response SLA, any day.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <section className="relative py-0 overflow-hidden">
        <div className="relative h-[500px]">
          <img
            src="https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=1800&q=85"
            alt="Hotel conference"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4 font-body">Platform walkthrough</p>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-white mb-6">
              See the portal in action
            </h2>
            <p className="text-white/60 text-base mb-8 max-w-lg font-body">
              Watch a 4-minute walkthrough of the Desiney Owner Portal — from onboarding to your first payout.
            </p>
            <button
              onClick={() => setVideoOpen(true)}
              className="group flex items-center gap-4 px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)' }}
            >
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:bg-amber-400 transition-colors">
                <Play size={18} color="#fff" fill="#fff" className="ml-0.5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-body">Watch Demo — 4 min</p>
                <p className="text-xs text-white/50 font-body mt-0.5">Full platform walkthrough</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.15em] mb-3 font-body">Simple onboarding</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-stone-900">Go live in 3 steps</h2>
            <p className="mt-4 text-stone-500 font-body">From request to first booking — our team handles the heavy lifting.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center group">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-3rem)] h-px"
                    style={{ background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }} />
                )}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 mx-auto transition-all group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '2px solid #f59e0b' }}>
                  <s.icon size={28} className="text-amber-700" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center font-body">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900 mb-2">{s.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto font-body">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a href="#request" className="btn-amber inline-flex items-center gap-2 px-7 py-3.5 font-semibold rounded-xl text-sm shadow-lg">
              Start your application <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ── METRICS BAND ── */}
      <section className="py-20 overflow-hidden relative">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1800&q=80" alt="Hotel exterior" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(10,6,2,0.82)' }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.15em] mb-4 font-body">Partner results</p>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white">Real numbers from real partners</h2>
              <p className="mt-4 text-white/55 font-body leading-relaxed">
                After 90 days on Desiney, our average partner sees measurable uplift across all key metrics.
              </p>
              <div className="mt-6 space-y-2.5">
                {[
                  { label: 'Revenue growth (avg 90 days)', value: '+31% RevPAR' },
                  { label: 'Occupancy improvement', value: '+17% Occ.' },
                  { label: 'Cancellation rate reduction', value: '↓ 9%' },
                  { label: 'Channel conversion rate', value: '4.8%' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-sm text-white/60 font-body">{row.label}</span>
                    <span className="text-sm font-bold text-amber-400 font-body">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Avg. onboarding time', value: '3 days', icon: Clock },
                { label: 'Support response SLA', value: '< 2 hrs', icon: Headphones },
                { label: 'Rate parity monitoring', value: 'Real-time', icon: ShieldCheck },
                { label: 'Markets covered', value: '52', icon: Globe },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <m.icon size={22} className="text-amber-400 mb-3" />
                  <p className="font-display text-2xl font-black text-white">{m.value}</p>
                  <p className="text-xs text-white/45 mt-1 font-body">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="stories" className="py-20 bg-[#faf8f5]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.15em] mb-3 font-body">Partner stories</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-stone-900">What our partners say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.company} className="bg-white rounded-3xl border border-stone-200 p-7 hover:shadow-lg transition-shadow bento-hover">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed italic mb-6 font-body">"{t.text}"</p>
                <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm font-body">{t.name}</p>
                      <p className="text-xs text-stone-400 font-body">{t.role}, {t.company}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 font-body">
                    {t.stat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER REQUEST FORM ── */}
      <section id="request" className="py-20 bg-white border-t border-stone-200">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-14 items-start">

            {/* Left */}
            <div className="lg:sticky lg:top-24">
              <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.15em] mb-4 font-body">Partner application</p>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
                Ready to list your property?
              </h2>
              <p className="mt-4 text-stone-500 leading-relaxed font-body">
                Submit your details below. Our partner team reviews every application personally
                and responds within <strong className="text-stone-700">24 business hours</strong>.
              </p>

              {/* Hotel image */}
              <div className="mt-7 rounded-2xl overflow-hidden h-40">
                <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80" alt="Partner hotel" className="w-full h-full object-cover" />
              </div>

              <div className="mt-6 space-y-3">
                {[
                  'Dedicated onboarding manager assigned',
                  'Verification completed in 72 hours',
                  'No setup fees — ever',
                  'Full portal access from day one',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-stone-600 font-body">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 p-5 rounded-2xl bg-stone-900 text-white">
                <p className="text-xs text-stone-400 mb-1 font-body">Already a partner?</p>
                <p className="font-semibold mb-3 font-body">Sign in to your owner portal</p>
                <button onClick={goLogin}
                  className="btn-amber inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm">
                  <Lock size={14} /> Partner Login
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-2 text-sm text-stone-500 font-body">
                <div className="flex items-center gap-2"><Phone size={14} className="text-stone-400" /><span>+91 98765 43210</span></div>
                <div className="flex items-center gap-2"><Mail size={14} className="text-stone-400" /><span>partners@desiney.com</span></div>
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-stone-50 rounded-3xl border border-stone-200 p-8 shadow-sm">
              <h3 className="font-display text-2xl font-bold text-stone-900 mb-1">Partner Request Form</h3>
              <p className="text-sm text-stone-400 mb-6 font-body">All fields marked <span className="text-red-500">*</span> are required.</p>

              {submitError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 font-body">
                  <X size={14} className="shrink-0 mt-0.5" />{submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2 font-body">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />{submitSuccess}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4 font-body">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Business / Hotel name <span className="text-red-500">*</span></label>
                  <input name="businessName" value={formData.businessName} onChange={handleChange} required
                    placeholder="e.g. Sunrise Hotels Pvt. Ltd."
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Organization type <span className="text-red-500">*</span></label>
                    <select name="organizationType" value={formData.organizationType} onChange={handleChange} required
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white text-stone-700 appearance-none transition">
                      <option value="">Select type</option>
                      {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Number of properties</label>
                    <input name="propertyCount" value={formData.propertyCount} onChange={handleChange}
                      placeholder="e.g. 3" type="number" min="1"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Contact person <span className="text-red-500">*</span></label>
                    <input name="contactName" value={formData.contactName} onChange={handleChange} required
                      placeholder="Full name"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">City / Location</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai"
                        className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Work email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input name="email" type="email" value={formData.email} onChange={handleChange} required
                        placeholder="you@company.com"
                        className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Tell us about your business</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} rows={4}
                    placeholder="Describe your hotel group, current challenges, and what you're hoping to achieve with Desiney..."
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-400 transition resize-none"
                  />
                </div>

                <button type="submit" disabled={submitting}
                  className="btn-amber w-full py-3.5 px-6 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg">
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>Submit Partnership Request <ArrowRight size={15} /></>
                  )}
                </button>

                <p className="text-xs text-stone-400 text-center">
                  By submitting, you agree to our Partner Terms and consent to being contacted about onboarding.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-stone-900 border-t border-white/10 font-body">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Hotel size={18} color="#fff" />
                </div>
                <div>
                  <span className="text-white font-bold text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Desiney</span>
                  <span className="block text-amber-400 text-[9px] font-semibold uppercase tracking-[0.15em]">Owner Portal</span>
                </div>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed">
                The B2B partner portal for hotel owners, chains, and hospitality groups.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-4">Platform</p>
              <ul className="space-y-2.5 text-sm text-stone-400">
                {['Owner Portal', 'Revenue Analytics', 'Inventory Management', 'Payout Tracking'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-amber-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-4">Company</p>
              <ul className="space-y-2.5 text-sm text-stone-400">
                {['About Us', 'Partner Stories', 'Press', 'Careers'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-amber-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-4">Support</p>
              <ul className="space-y-2.5 text-sm text-stone-400">
                {['Help Center', 'Partner Agreement', 'Privacy Policy', 'Security'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-amber-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
            <p>© 2026 Desiney Owner Portal. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-500" />
              <span>SOC 2 Compliant &nbsp;·&nbsp; PCI DSS Ready &nbsp;·&nbsp; GDPR Aligned</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

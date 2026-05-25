import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { submitPartnerRequest } from '../api/partnerRequests';

const NAV_LINKS = [
  { label: 'Why Desiney', href: '#why' },
  { label: 'How It Works', href: '#how' },
  { label: 'Partners', href: '#stories' },
  { label: 'Request Access', href: '#request' },
];

const STATS = [
  { value: '4,200+', label: 'Partner Properties' },
  { value: '52', label: 'Markets' },
  { value: '₹2.4B+', label: 'Partner Revenue' },
  { value: '94%', label: 'Partner Retention' },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Real-Time Revenue Analytics',
    text: 'Track RevPAR, ADR, occupancy, and channel performance with live dashboards built for hotel operators.',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Distribution',
    text: 'Push rates and availability to premium demand channels instantly. No manual updates, no parity issues.',
  },
  {
    icon: Building2,
    title: 'Multi-Property Management',
    text: 'Manage every property from one portal. Switch hotels in one click with a unified inventory view.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Partner Onboarding',
    text: 'Dedicated onboarding team, compliance checks, and go-live support — all included from day one.',
  },
  {
    icon: Headphones,
    title: '24/7 Partner Support',
    text: 'Priority access to our partner care team. Average response under 2 hours, any time, any day.',
  },
  {
    icon: TrendingUp,
    title: 'Pricing Intelligence',
    text: 'Market-rate signals, competitor benchmarking, and dynamic pricing recommendations built in.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Submit your request',
    text: 'Fill in your business details, property info, and contact. Takes under 3 minutes.',
    icon: Mail,
  },
  {
    num: '02',
    title: 'Verification & review',
    text: 'Our partner team verifies your business and listings within 72 hours and gets you onboarded.',
    icon: ShieldCheck,
  },
  {
    num: '03',
    title: 'Go live & grow',
    text: 'Access your partner portal, connect inventory, and start receiving bookings from day one.',
    icon: Zap,
  },
];

const TESTIMONIALS = [
  {
    name: 'Rajeev Sharma',
    role: 'Managing Director',
    company: 'Aspen Stay Group',
    text: 'We saw 18% occupancy lift in the first month. The partner portal is the most intuitive we\'ve used across any OTA integration.',
    stat: '+18% Occupancy',
    rating: 5,
  },
  {
    name: 'Priya Mehta',
    role: 'Revenue Head',
    company: 'Vista Retreats',
    text: 'Managing 5 properties from one dashboard was a dream. Desiney made it reality. Support responds in under an hour.',
    stat: '5 Hotels, 1 Portal',
    rating: 5,
  },
  {
    name: 'Arjun Nair',
    role: 'CEO',
    company: 'Urban Nest Hotels',
    text: 'The payout tracking finally matches our finance workflow. No more chasing numbers across spreadsheets.',
    stat: '31% RevPAR Growth',
    rating: 5,
  },
];

const ORG_TYPES = [
  'Hotel Group',
  'Independent Hotel',
  'Resort',
  'Boutique Property',
  'Service Apartments',
  'Hostel / Budget Stay',
  'Other',
];

export const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    organizationType: '',
    contactName: '',
    email: '',
    phoneNumber: '',
    city: '',
    propertyCount: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goLogin = () => {
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const extra = [
        formData.city ? `City: ${formData.city}` : null,
        formData.propertyCount ? `Properties: ${formData.propertyCount}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

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
          ? `Request submitted! Your reference ID is ${requestId}. Our partner team will reach out within 24 hours.`
          : 'Partner request submitted successfully. Our team will reach out within 24 hours.'
      );
      setFormData({
        businessName: '',
        organizationType: '',
        contactName: '',
        email: '',
        phoneNumber: '',
        city: '',
        propertyCount: '',
        message: '',
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to submit partner request.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">

      {/* ── NAV ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0b1728]/95 backdrop-blur-md shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-md">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-white font-bold text-lg tracking-tight">Desiney</span>
              <span className="block text-teal-400 text-[10px] font-medium uppercase tracking-widest -mt-0.5">Partner Hub</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors rounded-md hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={goLogin}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Partner Login
            </button>
            <a
              href="#request"
              className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors shadow-md"
            >
              Request Access
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0b1728]/98 backdrop-blur-md border-t border-white/10 px-4 pb-4 pt-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-slate-300 hover:text-white text-sm border-b border-white/5 last:border-0"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={goLogin}
                className="py-2.5 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Partner Login
              </button>
              <a
                href="#request"
                onClick={() => setMenuOpen(false)}
                className="py-2.5 text-sm font-semibold text-center bg-teal-500 text-white rounded-lg hover:bg-teal-400 transition-colors"
              >
                Request Access
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-[#0b1728] overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjMiIG9wYWNpdHk9IjAuMDgiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60" />
        <div className="absolute top-1/4 right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-widest mb-6">
                <BadgeCheck className="w-3.5 h-3.5" />
                Official Partner Program 2026
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Grow your hotel
                <span className="block text-teal-400">business with</span>
                <span className="block">Desiney.</span>
              </h1>

              <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-lg">
                The partner portal built for hotel operators, chains, and hospitality groups.
                List your properties, manage rates, track revenue — all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#request"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/25 text-sm"
                >
                  Become a Partner
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={goLogin}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 transition-colors text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Partner Login
                </button>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">
                <div className="flex -space-x-2">
                  {['AS', 'VR', 'UN', 'CR'].map((initials) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-blue-700 border-2 border-[#0b1728] flex items-center justify-center text-[10px] font-bold text-white"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span>Joined by <strong className="text-white">4,200+</strong> properties worldwide</span>
              </div>
            </div>

            {/* Right panel — dashboard mockup */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-[#0f2035] p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400">Partner Dashboard</p>
                      <p className="text-white font-semibold">Revenue Overview</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'This Month', value: '₹8.4L', change: '+12%' },
                      { label: 'Occupancy', value: '87%', change: '+5%' },
                      { label: 'Bookings', value: '342', change: '+18%' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                        <p className="text-[10px] text-slate-400">{m.label}</p>
                        <p className="text-lg font-bold text-white mt-1">{m.value}</p>
                        <p className="text-[10px] text-emerald-400 font-medium mt-0.5">{m.change}</p>
                      </div>
                    ))}
                  </div>

                  {/* Fake bar chart */}
                  <div className="rounded-xl bg-white/5 border border-white/8 p-3 mb-3">
                    <p className="text-[10px] text-slate-400 mb-3">Weekly revenue trend</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end">
                          <div
                            className="rounded-sm bg-teal-500/70"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1.5">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-teal-400">Next payout</p>
                      <p className="text-xl font-bold text-white">₹1,42,800</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scheduled Apr 14, 2026</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-teal-400" />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-xl px-3.5 py-2.5 shadow-xl text-xs font-medium flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Verified in 72 hours</span>
                </div>
                <div className="absolute -right-8 bottom-1/4 bg-white rounded-xl px-3.5 py-2.5 shadow-xl text-xs font-medium flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Premium partner tier</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex justify-center">
            <a href="#stats" className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-400 transition-colors text-xs">
              <span>Explore</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="bg-[#0d1f37] border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:px-8">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST LOGOS ── */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Trusted by leading hotel groups
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Aspen Stay Group', 'Vista Retreats', 'Coastal Suites', 'Urban Nest', 'Peak Resorts', 'Blue Horizon Hotels'].map((brand) => (
              <div key={brand} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium shadow-sm">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY DESINEY ── */}
      <section id="why" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
              Built for hospitality operators
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything your team needs, in one portal
            </h2>
            <p className="mt-4 text-slate-500 text-lg">
              Purpose-built for hotel owners and business partners — not OTA guests. Serious tools for serious operators.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-500 group-hover:border-teal-500 transition-colors">
                  <f.icon className="w-5 h-5 text-teal-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">Simple onboarding</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Go live in 3 steps
            </h2>
            <p className="mt-4 text-slate-500">
              From request to first booking — our team handles the heavy lifting.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />

            <div className="grid lg:grid-cols-3 gap-8">
              {STEPS.map((s, i) => (
                <div key={s.num} className="relative text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-2 border-teal-500 shadow-lg shadow-teal-100 mb-6 mx-auto">
                    <s.icon className="w-8 h-8 text-teal-600" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href="#request"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#0b1728] hover:bg-[#0d2040] text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
            >
              Start your application
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── METRICS BAND ── */}
      <section className="py-16 bg-[#0b1728]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-teal-400 text-sm font-semibold uppercase tracking-widest mb-3">Partner results</p>
              <h2 className="text-3xl font-extrabold text-white">
                Real numbers from real partners
              </h2>
              <p className="mt-4 text-slate-400">
                After 90 days on Desiney, our average partner sees measurable uplift across all key metrics.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { label: 'Revenue growth (avg 90 days)', value: '+31% RevPAR' },
                  { label: 'Occupancy improvement', value: '+17% Occ.' },
                  { label: 'Cancellation rate reduction', value: '↓ 9%' },
                  { label: 'Channel conversion rate', value: '4.8%' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl bg-white/8 border border-white/10 px-4 py-3">
                    <span className="text-sm text-slate-300">{row.label}</span>
                    <span className="text-sm font-bold text-teal-400">{row.value}</span>
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
                <div key={m.label} className="rounded-2xl bg-white/8 border border-white/10 p-5">
                  <m.icon className="w-6 h-6 text-teal-400 mb-3" />
                  <p className="text-2xl font-extrabold text-white">{m.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="stories" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">Partner stories</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              What our partners say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.company} className="rounded-2xl border border-slate-200 p-6 bg-white hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic mb-5">"{t.text}"</p>
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}, {t.company}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                    {t.stat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER REQUEST FORM ── */}
      <section id="request" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-start">

            {/* Left info */}
            <div className="lg:sticky lg:top-24">
              <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">
                Partner application
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Ready to list your property?
              </h2>
              <p className="mt-4 text-slate-500 leading-relaxed">
                Submit your business details below. Our partner team reviews every application personally and responds within <strong>24 business hours</strong>.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: CheckCircle2, text: 'Dedicated onboarding manager assigned' },
                  { icon: CheckCircle2, text: 'Verification completed in 72 hours' },
                  { icon: CheckCircle2, text: 'No setup fees — ever' },
                  { icon: CheckCircle2, text: 'Full portal access from day one' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-[#0b1728] text-white">
                <p className="text-xs text-slate-400 mb-1">Already a partner?</p>
                <p className="font-semibold mb-3">Sign in to your partner portal</p>
                <button
                  onClick={goLogin}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Partner Login
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>partners@desiney.com</span>
                </div>
              </div>
            </div>

            {/* Right form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Partner Request Form</h3>
              <p className="text-sm text-slate-500 mb-6">
                All fields marked <span className="text-red-500">*</span> are required.
              </p>

              {submitError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  {submitSuccess}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Business / Hotel name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Sunrise Hotels Pvt. Ltd."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Organization type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="organizationType"
                      value={formData.organizationType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition bg-white text-slate-700 appearance-none"
                    >
                      <option value="">Select type</option>
                      {ORG_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Number of properties
                    </label>
                    <input
                      name="propertyCount"
                      value={formData.propertyCount}
                      onChange={handleChange}
                      placeholder="e.g. 3"
                      type="number"
                      min="1"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Contact person <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      placeholder="Full name"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      City / Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Mumbai"
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Work email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@company.com"
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tell us about your business
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your hotel group, current challenges, and what you're hoping to achieve with Desiney..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-100"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Partnership Request
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  By submitting, you agree to our Partner Terms and consent to being contacted about onboarding.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0b1728] border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-white font-bold text-base">Desiney</span>
                  <span className="block text-teal-400 text-[10px] font-medium uppercase tracking-widest">Partner Hub</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                The B2B partner portal for hotel owners, chains, and hospitality groups.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Platform</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {['Partner Portal', 'Revenue Analytics', 'Inventory Management', 'Payout Tracking'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {['About Us', 'Partner Stories', 'Press', 'Careers'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Support</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {['Help Center', 'Partner Agreement', 'Privacy Policy', 'Security'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2026 Desiney Partner Hub. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>SOC 2 Compliant &nbsp;·&nbsp; PCI DSS Ready &nbsp;·&nbsp; GDPR Aligned</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

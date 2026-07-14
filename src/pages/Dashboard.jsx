import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, Calendar, TrendingUp, Bed, Star,
  ArrowRight, LogIn, LogOut, Users, CheckCircle2,
  AlertCircle, Building2, BarChart2, RefreshCw, ExternalLink, Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { HotelSelector } from '../components/shared/HotelSelector';
import { DataTable } from '../components/shared/DataTable';
import { DashboardSkeleton } from '../components/common/Skeleton';
import {
  fetchHotelBookings, fetchBookingSummary,
  fetchTodayCheckIns, fetchTodayCheckOuts,
  fetchHotelRevenue, selectPaymentsTotal,
  selectRevenue, clearBookings,
} from '../store/slices/bookingSlice';
import { fetchDashboardReviews, fetchHotelReviewSummary, clearReviews } from '../store/slices/reviewSlice';
import { selectPrimaryHotelId, selectUserId, selectCurrentUser, selectIsHotelOwner } from '../store/slices/userSlice';
import {
  fetchOwnerDashboardAnalytics,
  fetchOwnerBilling,
  selectOwnerDashboard,
  selectOwnerDashboardLoading,
  selectBilling,
} from '../store/slices/paymentsSlice';
import { provisionOwnerBilling } from '../api/payments';
import { isBillingSubscriptionActive } from '../utils/subscriptionUtils';

const getGuestName = (b) => {
  if (b.guest) {
    const { firstName, lastName } = b.guest;
    if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
    return 'Guest';
  }
  return b.guestName || 'Guest';
};

const fmtCurrency = (v) =>
  v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : '—';

const BOOKING_STATUS_CONFIG = {
  BOOKED:      { color: 'bg-emerald-100 text-emerald-700' },
  CHECKED_IN:  { color: 'bg-blue-100 text-blue-700' },
  CHECKED_OUT: { color: 'bg-slate-100 text-slate-700' },
  CANCELLED:   { color: 'bg-red-100 text-red-700' },
  PENDING:     { color: 'bg-amber-100 text-amber-700' },
};

const PAYMENT_TEXT_COLORS = {
  PAID:    'text-emerald-600 font-semibold',
  PENDING: 'text-amber-600 font-semibold',
  FAILED:  'text-red-600 font-semibold',
};

const bookingColumns = [
  { header: 'Booking ID', render: (r) => <span className="font-mono text-xs text-slate-500">{r.bookingId?.substring(0, 8)}…</span> },
  { header: 'Guest',      render: (r) => <span className="font-medium text-slate-800">{getGuestName(r)}</span> },
  { header: 'Check-in',  render: (r) => new Date(r.checkInDate).toLocaleDateString() },
  { header: 'Check-out', render: (r) => new Date(r.checkOutDate).toLocaleDateString() },
  { header: 'Status',    render: (r) => {
    const cfg = BOOKING_STATUS_CONFIG[r.bookingStatus] || { color: 'bg-slate-100 text-slate-600' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{r.bookingStatus}</span>;
  }},
  { header: 'Payment',   render: (r) => <span className={`text-xs ${PAYMENT_TEXT_COLORS[r.paymentStatus] || 'text-slate-500'}`}>{r.paymentStatus}</span> },
  { header: 'Amount',    render: (r) => <span className="font-semibold text-slate-900">{fmtCurrency(r.totalAmount)}</span> },
];

export const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookings, todayCheckIns, todayCheckOuts, summary: bookingSummary } = useSelector((s) => s.bookings);
  const { dashboardReviews, summary: reviewSummary } = useSelector((s) => s.reviews);
  const paymentsTotal  = useSelector(selectPaymentsTotal);
  const revenue        = useSelector(selectRevenue);
  const activeHotelId  = useSelector(selectPrimaryHotelId);
  const ownerId        = useSelector(selectUserId);
  const currentUser    = useSelector(selectCurrentUser);
  const isOwner        = useSelector(selectIsHotelOwner);
  const billing        = useSelector(selectBilling);
  const ownerDashboard = useSelector(selectOwnerDashboard);
  const ownerLoading   = useSelector(selectOwnerDashboardLoading);
  const [loading, setLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);

  // Backend sets stripeOnboardingComplete=true when detailsSubmitted=true — use it as source of truth
  const stripeNeedsOnboarding = isOwner && billing && billing.stripeOnboardingComplete === false;

  const handleCompleteOnboarding = async () => {
    setOnboardingLoading(true);
    setOnboardingError(null);
    try {
      const result = await provisionOwnerBilling({
        ownerId,
        email: currentUser?.email,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName,
      });
      if (result?.onboardingUrl) {
        window.location.href = result.onboardingUrl;
      } else {
        setOnboardingError('Could not generate onboarding link. Please try again.');
      }
    } catch {
      setOnboardingError('Failed to connect to Stripe. Please try again.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  const now        = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today      = now.toISOString().split('T')[0];

  useEffect(() => {
    if (!ownerId) return;
    const from = new Date(); from.setDate(from.getDate() - 30);
    dispatch(fetchOwnerDashboardAnalytics({ ownerId, startDate: from.toISOString().split('T')[0], endDate: today }));
    if (isOwner && !billing) dispatch(fetchOwnerBilling(ownerId));
  }, [ownerId]);

  const loadData = async (hid) => {
    setLoading(true);
    try {
      await Promise.allSettled([
        dispatch(fetchHotelBookings({ hotelId: hid, filters: {} })),
        dispatch(fetchBookingSummary(hid)),
        dispatch(fetchTodayCheckIns(hid)),
        dispatch(fetchTodayCheckOuts(hid)),
        dispatch(fetchDashboardReviews(hid)),
        dispatch(fetchHotelReviewSummary(hid)),
        dispatch(fetchHotelRevenue({ hotelId: hid, fromDate: monthStart, toDate: today })),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeHotelId) {
      dispatch(clearBookings());
      dispatch(clearReviews());
      loadData(activeHotelId);
    } else {
      setLoading(false);
    }
  }, [activeHotelId]);

  if (loading && activeHotelId) return <DashboardSkeleton />;

  const hotelRevenue = revenue?.totalRevenue ?? revenue?.revenue ?? revenue?.amount ?? paymentsTotal ?? 0;

  // Subscription alert state
  const subStatus = billing?.subscriptionStatus?.toUpperCase();
  const isSubscriptionActive = isBillingSubscriptionActive(billing);
  const isPastDue  = isSubscriptionActive && subStatus === 'PAST_DUE';
  const isCancelled = !isSubscriptionActive && (subStatus === 'CANCELLED' || subStatus === 'CANCELED' || !!billing?.subscriptionCurrentPeriodEnd);
  const isTrialing  = subStatus === 'TRIALING';
  const periodEnd   = billing?.subscriptionCurrentPeriodEnd;
  const daysToEnd   = periodEnd
    ? Math.max(0, Math.ceil((new Date(periodEnd) - new Date()) / 86400000))
    : null;
  const trialEndingSoon = isTrialing && daysToEnd != null && daysToEnd <= 7;

  return (
    <div className="space-y-8">

      {/* ═══════════════════════════════════════════════════════════
          SUBSCRIPTION ALERT BANNERS
      ═══════════════════════════════════════════════════════════ */}

      {isPastDue && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Subscription payment failed — action required</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Your subscription is past due. Update your payment method to avoid service interruption.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/subscription')}
              className="shrink-0 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
              Update Payment Method
            </button>
          </div>
        </motion.div>
      )}

      {isCancelled && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Your subscription has been cancelled</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Reactivate your subscription to continue listing your properties and receiving bookings.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/subscription')}
              className="shrink-0 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
              Reactivate Subscription
            </button>
          </div>
        </motion.div>
      )}

      {trialEndingSoon && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Trial ending in {daysToEnd} day{daysToEnd !== 1 ? 's' : ''}</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Add a payment method before your trial ends to keep your listings active.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/subscription')}
              className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
              Add Payment Method
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STRIPE ONBOARDING BANNERS
      ═══════════════════════════════════════════════════════════ */}

      {/* Owner hasn't submitted details — action required */}
      {stripeNeedsOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Complete your Stripe setup to receive payouts</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your Stripe account details are missing. You will not receive payments until setup is complete.
                </p>
                {onboardingError && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{onboardingError}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleCompleteOnboarding}
              disabled={onboardingLoading}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-amber-200"
            >
              {onboardingLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                : <><ExternalLink className="w-4 h-4" /> Complete Stripe Setup</>
              }
            </button>
          </div>
        </motion.div>
      )}


      {/* ═══════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back — here's your portfolio at a glance.</p>
        </div>
        <button
          onClick={() => activeHotelId && loadData(activeHotelId)}
          disabled={loading || !activeHotelId}
          className="self-start flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all disabled:opacity-40 text-sm shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PORTFOLIO OVERVIEW — all properties
      ═══════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

        {/* Section label */}
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-violet-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Portfolio Overview</h2>
          <span className="text-xs text-slate-400">· last 30 days</span>
        </div>

        {/* Revenue total card + monthly cards */}
        {ownerLoading && !ownerDashboard ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : ownerDashboard && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total revenue — dark gradient */}
              <div className="sm:col-span-1 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-violet-200">
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5" />
                <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-3xl font-black">{fmtCurrency(ownerDashboard.totalRevenue)}</p>
                <p className="text-violet-300 text-xs mt-2 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {ownerDashboard.totalHotels ?? 0} properties
                </p>
              </div>

              {/* Monthly revenue cards */}
              {ownerDashboard.monthlyRevenue?.slice(0, 2).map((m, i) => {
                const gradients = [
                  'from-cyan-500 to-blue-500 shadow-cyan-200',
                  'from-emerald-500 to-teal-500 shadow-emerald-200',
                ];
                return (
                  <div key={m.label} className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${gradients[i]} text-white shadow-lg`}>
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                      {new Date(m.label + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-3xl font-black">{fmtCurrency(m.revenue)}</p>
                    <p className="text-white/60 text-xs mt-2">Monthly revenue</p>
                  </div>
                );
              })}
            </div>

            {/* Hotel selector — placed right below total revenue */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
              <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
              <span className="text-sm font-medium text-slate-600 shrink-0">View hotel:</span>
              <HotelSelector />
            </div>

            {/* Daily revenue bar chart */}
            {ownerDashboard.dailyRevenue?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-violet-600" />
                  </span>
                  Daily Revenue — All Properties
                </p>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={ownerDashboard.dailyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                      width={54}
                    />
                    <Tooltip
                      formatter={(v) => [fmtCurrency(v), 'Revenue']}
                      labelFormatter={(l) => new Date(l).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Revenue by property table */}
            {ownerDashboard.revenueByHotel?.filter(h => h.revenue > 0).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  <p className="text-sm font-bold text-slate-800">Revenue by Property</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-violet-50 to-indigo-50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-violet-600 px-6 py-3 uppercase tracking-wider">Property</th>
                      <th className="text-left text-xs font-semibold text-violet-600 px-6 py-3 uppercase tracking-wider">Revenue</th>
                      <th className="text-left text-xs font-semibold text-violet-600 px-6 py-3 uppercase tracking-wider">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ownerDashboard.revenueByHotel.filter(h => h.revenue > 0).map((h, i) => {
                      const pct = ownerDashboard.totalRevenue > 0
                        ? ((h.revenue / ownerDashboard.totalRevenue) * 100).toFixed(1) : '0.0';
                      const barColors = ['bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                      return (
                        <tr key={h.hotelId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-slate-800">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full ${barColors[i % barColors.length]}`} />
                              {h.hotelName ?? h.hotelId}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-900">{fmtCurrency(h.revenue)}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-100 rounded-full h-2">
                                <div className={`${barColors[i % barColors.length]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 font-medium">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          NO HOTEL SELECTED nudge
      ═══════════════════════════════════════════════════════════ */}
      {!activeHotelId && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-7 h-7 text-blue-500" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Select a hotel above</h3>
          <p className="text-sm text-slate-500">Pick a property to load bookings, check-ins, and reviews.</p>
        </div>
      )}

      {activeHotelId && (
        <>
          {/* ── TODAY ACTIVITY BAR ──────────────────────────────────── */}
          {(todayCheckIns?.length > 0 || todayCheckOuts?.length > 0 || bookingSummary?.booked > 0) && (
            <div className="flex flex-wrap gap-3 px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl text-white text-sm shadow-lg shadow-slate-200">
              <span className="font-bold text-white/60 mr-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Today:
              </span>
              {todayCheckIns?.length > 0 && (
                <span className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full">
                  <LogIn className="w-3.5 h-3.5 text-blue-300" />
                  <span className="font-medium">{todayCheckIns.length} arrival{todayCheckIns.length !== 1 ? 's' : ''}</span>
                </span>
              )}
              {todayCheckOuts?.length > 0 && (
                <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full">
                  <LogOut className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="font-medium">{todayCheckOuts.length} departure{todayCheckOuts.length !== 1 ? 's' : ''}</span>
                </span>
              )}
              {bookingSummary?.booked > 0 && (
                <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-medium">{bookingSummary.booked} pending check-in{bookingSummary.booked !== 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
          )}

          {/* ── HOTEL STAT CARDS ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue This Month', value: fmtCurrency(hotelRevenue), icon: DollarSign, from: 'from-blue-500', to: 'to-cyan-500', shadow: 'shadow-blue-200' },
              { label: 'Total Bookings',     value: bookingSummary?.totalBookings ?? bookings.length ?? 0, icon: Calendar,   from: 'from-emerald-500', to: 'to-teal-500',   shadow: 'shadow-emerald-200' },
              { label: 'Checked In',         value: bookingSummary?.checkedIn  ?? 0, icon: TrendingUp, from: 'from-violet-500', to: 'to-purple-500', shadow: 'shadow-violet-200' },
              { label: 'Checked Out',        value: bookingSummary?.checkedOut ?? 0, icon: Bed,        from: 'from-amber-500',  to: 'to-orange-500', shadow: 'shadow-amber-200'  },
            ].map(({ label, value, icon: Icon, from, to, shadow }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${from} ${to} text-white shadow-lg ${shadow}`}
              >
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-black">{value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── BOOKINGS SUMMARY ────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bookings Summary</h2>
                <p className="text-xs text-slate-500 mt-0.5">Live snapshot of your reservation activity</p>
              </div>
              <button onClick={() => navigate('/bookings')}
                className="text-sm text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
                Manage <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-5 pb-4">
              {(() => {
                const booked     = bookingSummary?.booked      || 0;
                const checkedIn  = bookingSummary?.checkedIn   || 0;
                const checkedOut = bookingSummary?.checkedOut  || 0;
                const cancelled  = bookingSummary?.cancelled   || 0;
                const total      = booked + checkedIn + checkedOut + cancelled || 1;
                const pct        = (n) => ((n / total) * 100).toFixed(1);
                return (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-0.5">
                      {booked     > 0 && <div style={{ width: `${pct(booked)}%`     }} className="bg-emerald-400" />}
                      {checkedIn  > 0 && <div style={{ width: `${pct(checkedIn)}%`  }} className="bg-blue-500" />}
                      {checkedOut > 0 && <div style={{ width: `${pct(checkedOut)}%` }} className="bg-purple-400" />}
                      {cancelled  > 0 && <div style={{ width: `${pct(cancelled)}%`  }} className="bg-rose-400" />}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Booked',      value: booked,     p: pct(booked),     from: 'from-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
                        { label: 'Checked In',  value: checkedIn,  p: pct(checkedIn),  from: 'from-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
                        { label: 'Checked Out', value: checkedOut, p: pct(checkedOut), from: 'from-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-400'  },
                        { label: 'Cancelled',   value: cancelled,  p: pct(cancelled),  from: 'from-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
                      ].map(({ label, value, p, from, border, text, dot }) => (
                        <div key={label} className={`bg-gradient-to-b ${from} to-white border ${border} rounded-xl p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${dot}`} />
                            <span className="text-xs font-semibold text-slate-600">{label}</span>
                          </div>
                          <p className={`text-2xl font-black ${text}`}>{value}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{p}% of total</p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Today arrivals / departures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100">
              {/* Arrivals */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                      <LogIn className="w-4 h-4 text-blue-600" />
                    </span>
                    Arrivals Today
                  </h3>
                  <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{todayCheckIns?.length || 0}</span>
                </div>
                {todayCheckIns?.length > 0 ? (
                  <div className="space-y-2">
                    {todayCheckIns.slice(0, 4).map((b, i) => (
                      <motion.div key={b.bookingId} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{getGuestName(b)}</p>
                          <p className="text-xs text-slate-500">Until {new Date(b.checkOutDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${b.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {b.bookingStatus === 'CHECKED_IN' ? 'In' : 'Due'}
                        </span>
                      </motion.div>
                    ))}
                    {todayCheckIns.length > 4 && <p className="text-xs text-slate-400 text-center pt-1">+{todayCheckIns.length - 4} more arrivals</p>}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">No arrivals scheduled</p>
                  </div>
                )}
              </div>

              {/* Departures */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-emerald-600" />
                    </span>
                    Departures Today
                  </h3>
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{todayCheckOuts?.length || 0}</span>
                </div>
                {todayCheckOuts?.length > 0 ? (
                  <div className="space-y-2">
                    {todayCheckOuts.slice(0, 4).map((b, i) => (
                      <motion.div key={b.bookingId} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{getGuestName(b)}</p>
                          <p className="text-xs text-slate-500">Stayed from {new Date(b.checkInDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.paymentStatus}
                        </span>
                      </motion.div>
                    ))}
                    {todayCheckOuts.length > 4 && <p className="text-xs text-slate-400 text-center pt-1">+{todayCheckOuts.length - 4} more departures</p>}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">No departures scheduled</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-3.5 bg-amber-50 border-t border-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                Pending actions?{' '}
                <button onClick={() => navigate('/bookings')} className="font-bold hover:underline">Go to Bookings</button>
              </p>
            </div>
          </motion.div>

          {/* ── RECENT BOOKINGS ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-blue-500" />
                Recent Bookings
              </h2>
              <button onClick={() => navigate('/bookings')}
                className="text-sm text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {bookings?.length > 0 ? (
              <DataTable columns={bookingColumns} data={bookings.slice(0, 10)} />
            ) : (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-100 p-10 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No bookings found for this hotel</p>
              </div>
            )}
          </motion.div>

          {/* ── REVIEWS ─────────────────────────────────────────────── */}
          {reviewSummary && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Summary */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-6 text-white shadow-lg shadow-orange-200">
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold">Guest Reviews</h2>
                  <button onClick={() => navigate('/reviews')}
                    className="text-xs font-bold text-white/80 hover:text-white flex items-center gap-1">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-black">{reviewSummary.overallAverageRating?.toFixed(1) || '0.0'}</p>
                    <div className="flex gap-1 mt-1 justify-center">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= (reviewSummary.overallAverageRating || 0) ? 'fill-white text-white' : 'text-white/40'}`} />
                      ))}
                    </div>
                    <p className="text-white/80 text-xs mt-1">{reviewSummary.totalReviews || 0} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {reviewSummary.categoryAverages?.slice(0, 3).map((c) => (
                      <div key={c.category} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white/80 w-20 truncate">{c.category.replace('_', ' ')}</span>
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${(c.averageRating / 5) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-white w-7">{c.averageRating.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent reviews */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-amber-400" /> Recent Reviews
                </h3>
                <div className="space-y-4">
                  {dashboardReviews?.length > 0 ? dashboardReviews.slice(0, 3).map((r) => (
                    <div key={r.reviewId} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.overallRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(r.reviewDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{r.overallComment}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-4">No reviews yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

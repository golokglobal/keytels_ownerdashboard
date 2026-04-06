import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Bed,
  Star,
  ArrowRight,
  LogIn,
  LogOut,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '../components/shared/StatCard';
import { DataTable } from '../components/shared/DataTable';
import { DashboardSkeleton } from '../components/common/Skeleton';
import {
  fetchHotelBookings,
  fetchBookingSummary,
  fetchTodayCheckIns,
  fetchTodayCheckOuts,
  fetchHotelRevenue,
  selectPaymentsTotal,
  selectRevenue,
  clearBookings,
} from '../store/slices/bookingSlice';
import { fetchDashboardReviews, fetchHotelReviewSummary, clearReviews } from '../store/slices/reviewSlice';
import { selectPrimaryHotelId } from '../store/slices/userSlice';

const getGuestName = (booking) => {
  if (booking.guest) {
    const { firstName, lastName } = booking.guest;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return 'Guest';
  }
  return booking.guestName || 'Guest';
};

const BOOKING_STATUS_CONFIG = {
  BOOKED: { color: 'bg-green-100 text-green-700' },
  CHECKED_IN: { color: 'bg-blue-100 text-blue-700' },
  CHECKED_OUT: { color: 'bg-slate-100 text-slate-700' },
  CANCELLED: { color: 'bg-red-100 text-red-700' },
  PENDING: { color: 'bg-yellow-100 text-yellow-700' },
};

const PAYMENT_TEXT_COLORS = {
  PAID: 'text-green-600',
  PENDING: 'text-yellow-600',
  FAILED: 'text-red-600',
};

const bookingColumns = [
  {
    header: 'Booking ID',
    render: (row) => (
      <span className="font-mono text-xs text-slate-600">
        {row.bookingId?.substring(0, 8)}...
      </span>
    ),
  },
  {
    header: 'Guest',
    render: (row) => getGuestName(row),
  },
  {
    header: 'Check-in',
    render: (row) => new Date(row.checkInDate).toLocaleDateString(),
  },
  {
    header: 'Check-out',
    render: (row) => new Date(row.checkOutDate).toLocaleDateString(),
  },
  {
    header: 'Status',
    render: (row) => {
      const config = BOOKING_STATUS_CONFIG[row.bookingStatus] || { color: 'bg-gray-100 text-gray-700' };
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {row.bookingStatus}
        </span>
      );
    },
  },
  {
    header: 'Payment',
    render: (row) => (
      <span className={`text-xs font-medium ${PAYMENT_TEXT_COLORS[row.paymentStatus] || 'text-gray-600'}`}>
        {row.paymentStatus}
      </span>
    ),
  },
  {
    header: 'Amount',
    render: (row) => `$${row.totalAmount?.toLocaleString() || '0'}`,
  },
];

export const Dashboard = () => {
  const dispatch = useDispatch();
  const { bookings, todayCheckIns, todayCheckOuts, summary: bookingSummary } = useSelector((state) => state.bookings);
  const { dashboardReviews, summary: reviewSummary } = useSelector((state) => state.reviews);
  const paymentsTotal = useSelector(selectPaymentsTotal);
  const revenue = useSelector(selectRevenue);
  const activeHotelId = useSelector(selectPrimaryHotelId);
  const [loading, setLoading] = useState(true);

  // Current month date range for revenue
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().split('T')[0];

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
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
  }, [activeHotelId, dispatch]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!activeHotelId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
          <p className="text-slate-600">Welcome back! Here's what's happening with your hotel today.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Select a hotel</h3>
          <p className="text-slate-600">Choose a hotel from the header to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
          <p className="text-slate-600">Welcome back! Here's what's happening with your hotel today.</p>
        </div>
        <button onClick={() => activeHotelId && loadData(activeHotelId)}
          disabled={loading || !activeHotelId}
          className="self-start flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all disabled:opacity-50 text-sm">
          <TrendingUp className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Today's quick-action bar */}
      {(todayCheckIns?.length > 0 || todayCheckOuts?.length > 0 || bookingSummary?.booked > 0) && (
        <div className="flex flex-wrap gap-3 p-4 bg-[#1a1f36] rounded-xl text-white text-sm">
          <span className="font-semibold text-white/70 mr-1">Today:</span>
          {todayCheckIns?.length > 0 && (
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
              <LogIn className="w-3.5 h-3.5 text-blue-300" />
              <span>{todayCheckIns.length} arrival{todayCheckIns.length !== 1 ? 's' : ''}</span>
            </span>
          )}
          {todayCheckOuts?.length > 0 && (
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
              <LogOut className="w-3.5 h-3.5 text-green-300" />
              <span>{todayCheckOuts.length} departure{todayCheckOuts.length !== 1 ? 's' : ''}</span>
            </span>
          )}
          {bookingSummary?.booked > 0 && (
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-300" />
              <span>{bookingSummary.booked} pending check-in{bookingSummary.booked !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      )}

      {/* Stats Grid - Using Real Booking Summary Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenue This Month"
          value={`$${(revenue?.totalRevenue ?? revenue?.revenue ?? revenue?.amount ?? paymentsTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total Bookings"
          value={bookingSummary?.totalBookings || bookings.length || 0}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Checked In"
          value={bookingSummary?.checkedIn || 0}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Checked Out"
          value={bookingSummary?.checkedOut || 0}
          icon={Bed}
          color="orange"
        />
      </div>

      {/* ── BOOKINGS SUMMARY ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bookings Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live snapshot of your reservation activity</p>
          </div>
          <button
            onClick={() => window.location.href = '/bookings'}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Manage <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status breakdown */}
        <div className="px-6 pt-5 pb-3">
          {(() => {
            const booked    = bookingSummary?.booked      || 0;
            const checkedIn = bookingSummary?.checkedIn   || 0;
            const checkedOut= bookingSummary?.checkedOut  || 0;
            const cancelled = bookingSummary?.cancelled   || 0;
            const total     = booked + checkedIn + checkedOut + cancelled || 1;
            const pct = (n) => ((n / total) * 100).toFixed(1);

            return (
              <>
                {/* Stacked progress bar */}
                <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-px">
                  {booked     > 0 && <div style={{ width: `${pct(booked)}%`     }} className="bg-green-400 transition-all" />}
                  {checkedIn  > 0 && <div style={{ width: `${pct(checkedIn)}%`  }} className="bg-blue-500 transition-all" />}
                  {checkedOut > 0 && <div style={{ width: `${pct(checkedOut)}%` }} className="bg-slate-400 transition-all" />}
                  {cancelled  > 0 && <div style={{ width: `${pct(cancelled)}%`  }} className="bg-red-400 transition-all" />}
                </div>

                {/* Four status tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Booked',       value: booked,     pct: pct(booked),     bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-400'  },
                    { label: 'Checked In',   value: checkedIn,  pct: pct(checkedIn),  bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
                    { label: 'Checked Out',  value: checkedOut, pct: pct(checkedOut), bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  dot: 'bg-slate-400'  },
                    { label: 'Cancelled',    value: cancelled,  pct: pct(cancelled),  bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-400'    },
                  ].map(({ label, value, pct: p, bg, border, text, dot }) => (
                    <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        <span className="text-xs font-medium text-slate-600">{label}</span>
                      </div>
                      <p className={`text-2xl font-black ${text}`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p}% of total</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Today's activity strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 mt-2">
          {/* Arrivals */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <LogIn className="w-4 h-4 text-blue-600" />
                </span>
                Arrivals Today
              </h3>
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {todayCheckIns?.length || 0}
              </span>
            </div>

            {todayCheckIns?.length > 0 ? (
              <div className="space-y-2">
                {todayCheckIns.slice(0, 4).map((b, i) => (
                  <motion.div
                    key={b.bookingId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{getGuestName(b)}</p>
                      <p className="text-xs text-slate-500">
                        Until {new Date(b.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.bookingStatus === 'CHECKED_IN'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {b.bookingStatus === 'CHECKED_IN' ? 'In' : 'Due'}
                    </span>
                  </motion.div>
                ))}
                {todayCheckIns.length > 4 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{todayCheckIns.length - 4} more arrivals
                  </p>
                )}
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
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-green-600" />
                </span>
                Departures Today
              </h3>
              <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {todayCheckOuts?.length || 0}
              </span>
            </div>

            {todayCheckOuts?.length > 0 ? (
              <div className="space-y-2">
                {todayCheckOuts.slice(0, 4).map((b, i) => (
                  <motion.div
                    key={b.bookingId}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{getGuestName(b)}</p>
                      <p className="text-xs text-slate-500">
                        Stayed from {new Date(b.checkInDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </motion.div>
                ))}
                {todayCheckOuts.length > 4 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{todayCheckOuts.length - 4} more departures
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No departures scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick-action footer */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500">
            Pending check-ins or check-outs? Head to{' '}
            <button
              onClick={() => window.location.href = '/bookings'}
              className="text-blue-600 hover:underline font-medium"
            >
              Bookings
            </button>{' '}
            to take action.
          </p>
        </div>
      </motion.div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Bookings</h2>
          <button
            onClick={() => window.location.href = '/bookings'}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {bookings && bookings.length > 0 ? (
          <DataTable columns={bookingColumns} data={bookings.slice(0, 10)} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No bookings found</p>
          </div>
        )}
      </motion.div>

      {/* Reviews Summary Section */}
      {reviewSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Review Summary Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Guest Reviews</h2>
              <button
                onClick={() => window.location.href = '/reviews'}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-5xl font-black text-slate-900 mb-2">
                  {reviewSummary.overallAverageRating?.toFixed(1) || '0.0'}
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (reviewSummary.overallAverageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  {reviewSummary.totalReviews || 0} reviews
                </p>
              </div>

              <div className="flex-1 space-y-2">
                {reviewSummary.categoryAverages?.slice(0, 3).map((category) => (
                  <div key={category.category} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 w-24">
                      {category.category.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                        style={{ width: `${(category.averageRating / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 w-8">
                      {category.averageRating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Reviews</h3>
            <div className="space-y-4">
              {dashboardReviews && dashboardReviews.length > 0 ? (
                dashboardReviews.slice(0, 3).map((review) => (
                  <div key={review.reviewId} className="border-b border-slate-200 pb-3 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.overallRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{review.overallComment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No reviews yet</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Bed,
  Star,
  ArrowRight,
  XCircle,
  LogIn,
  LogOut,
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
  fetchHotelPayments,
  selectPaymentsTotal,
} from '../store/slices/bookingSlice';
import { fetchDashboardReviews, fetchHotelReviewSummary } from '../store/slices/reviewSlice';

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
  const hotelId = useSelector((state) => state.user.hotelId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hotelId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [hotelId]);

  const loadData = async () => {
    try {
      // Calculate date range for revenue (last 30 days)
      const toDate = format(new Date(), 'yyyy-MM-dd');
      const fromDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      // Load real data from backend APIs in parallel
      await Promise.allSettled([
        dispatch(fetchHotelBookings({ hotelId, filters: {} })),
        dispatch(fetchBookingSummary(hotelId)),
        dispatch(fetchTodayCheckIns(hotelId)),
        dispatch(fetchTodayCheckOuts(hotelId)),
        dispatch(fetchHotelRevenue({ hotelId, fromDate, toDate })),
        dispatch(fetchHotelPayments(hotelId)),
        dispatch(fetchDashboardReviews(hotelId)),
        dispatch(fetchHotelReviewSummary(hotelId)),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your hotel today.</p>
      </div>

      {/* Stats Grid - Using Real Booking Summary Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(paymentsTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

      {/* Secondary Stats - Using Real API Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Check-ins Today</p>
            <LogIn className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayCheckIns?.length || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Check-outs Today</p>
            <LogOut className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayCheckOuts?.length || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Booked</p>
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{bookingSummary?.booked || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Cancelled</p>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{bookingSummary?.cancelled || 0}</p>
        </motion.div>
      </div>

      {/* Today's Check-ins and Check-outs Lists */}
      {(todayCheckIns?.length > 0 || todayCheckOuts?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Check-ins */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-600" />
                Today's Check-ins
              </h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {todayCheckIns?.length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {todayCheckIns?.slice(0, 5).map((booking) => (
                <div key={booking.bookingId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{getGuestName(booking)}</p>
                    <p className="text-sm text-slate-500">
                      Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.bookingStatus === 'BOOKED' ? 'bg-green-100 text-green-700' :
                    booking.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.bookingStatus}
                  </span>
                </div>
              ))}
              {(!todayCheckIns || todayCheckIns.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No check-ins scheduled for today</p>
              )}
            </div>
          </motion.div>

          {/* Today's Check-outs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-green-600" />
                Today's Check-outs
              </h3>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {todayCheckOuts?.length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {todayCheckOuts?.slice(0, 5).map((booking) => (
                <div key={booking.bookingId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{getGuestName(booking)}</p>
                    <p className="text-sm text-slate-500">
                      Checked in: {new Date(booking.checkInDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                    booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              ))}
              {(!todayCheckOuts || todayCheckOuts.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">No check-outs scheduled for today</p>
              )}
            </div>
          </motion.div>
        </div>
      )}

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

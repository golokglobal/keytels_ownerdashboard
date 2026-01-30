import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Bed,
  Users,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/shared/StatCard';
import { DataTable } from '../components/shared/DataTable';
import { Loader } from '../components/common/Loader';
import { setStats, setRevenueData } from '../store/slices/analyticsSlice';
import { setBookings } from '../store/slices/bookingSlice';
import { fetchDashboardStats, fetchRevenueData } from '../api/analytics';
import { fetchHotelBookings, fetchBookingSummary, fetchTodayCheckIns, fetchTodayCheckOuts } from '../store/slices/bookingSlice';
import { fetchDashboardReviews, fetchHotelReviewSummary } from '../store/slices/reviewSlice';

export const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, revenueData } = useSelector((state) => state.analytics);
  const { bookings, todayCheckIns, todayCheckOuts, summary: bookingSummary } = useSelector((state) => state.bookings);
  const { dashboardReviews, summary: reviewSummary } = useSelector((state) => state.reviews);
  const hotelId = useSelector((state) => state.user.hotelId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load analytics data (mock data - should work)
      try {
        const [statsRes, revenueRes] = await Promise.all([
          fetchDashboardStats(),
          fetchRevenueData(),
        ]);
        dispatch(setStats(statsRes.stats));
        dispatch(setRevenueData(revenueRes.data));
      } catch (error) {
        console.warn('Analytics data failed:', error);
      }

      // Load real data from backend if hotelId is available
      if (hotelId) {
        // Try each API call independently - don't let one failure break others

        // Try to fetch bookings
        dispatch(fetchHotelBookings({ hotelId, filters: { bookingStatus: 'BOOKED' } }))
          .catch(err => console.warn('Bookings API not available:', err.message));

        // Try to fetch booking summary
        dispatch(fetchBookingSummary(hotelId))
          .catch(err => console.warn('Booking summary API not available:', err.message));

        // Try to fetch today's check-ins
        dispatch(fetchTodayCheckIns(hotelId))
          .catch(err => console.warn('Check-ins API not available:', err.message));

        // Try to fetch today's check-outs
        dispatch(fetchTodayCheckOuts(hotelId))
          .catch(err => console.warn('Check-outs API not available:', err.message));

        // Try to fetch dashboard reviews
        dispatch(fetchDashboardReviews(hotelId))
          .catch(err => console.warn('Dashboard reviews API not available:', err.message));

        // Try to fetch review summary
        dispatch(fetchHotelReviewSummary(hotelId))
          .catch(err => console.warn('Review summary API not available:', err.message));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const bookingColumns = [
    { header: 'Booking ID', accessor: 'bookingId' },
    { header: 'Guest', accessor: 'guestName' },
    {
      header: 'Check-in',
      render: (row) => new Date(row.checkInDate).toLocaleDateString(),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.bookingStatus === 'BOOKED'
              ? 'bg-green-100 text-green-700'
              : row.bookingStatus === 'PENDING'
              ? 'bg-yellow-100 text-yellow-700'
              : row.bookingStatus === 'CHECKED_IN'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.bookingStatus}
        </span>
      ),
    },
    {
      header: 'Amount',
      render: (row) => `$${row.totalAmount?.toLocaleString() || '0'}`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your hotel today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(bookingSummary?.totalRevenue || stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="blue"
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Total Bookings"
          value={bookingSummary?.totalBookings || stats?.totalBookings || 0}
          icon={Calendar}
          color="green"
          trend="up"
          trendValue="+8.2%"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${bookingSummary?.occupancyRate || stats?.occupancyRate || 0}%`}
          icon={TrendingUp}
          color="purple"
          trend="up"
          trendValue="+5.4%"
        />
        <StatCard
          title="Available Rooms"
          value={bookingSummary?.availableRooms || stats?.availableRooms || 0}
          icon={Bed}
          color="orange"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Check-ins Today</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayCheckIns?.length || stats?.checkInsToday || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Check-outs Today</p>
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayCheckOuts?.length || stats?.checkOutsToday || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Total Guests</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{bookingSummary?.totalGuests || stats?.totalGuests || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Average Rating</p>
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{reviewSummary?.overallAverageRating?.toFixed(1) || stats?.averageRating || 0} / 5</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-600">Last 30 days</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View Report
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Daily Bookings</h3>
              <p className="text-sm text-slate-600">Last 30 days</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Bookings</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <DataTable columns={bookingColumns} data={bookings} />
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

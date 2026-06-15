import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Filter,
  Search,
  LogIn,
  LogOut,
  XCircle,
  Eye,
  X,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { HotelSelector } from '../components/shared/HotelSelector';
import { DataTable } from '../components/shared/DataTable';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { BookingsSkeleton } from '../components/common/Skeleton';
import {
  fetchHotelBookings,
  fetchBookingSummary,
  setSelectedBooking,
  clearPaymentDetails,
  fetchBookingById,
  checkIn,
  checkOut,
  cancelBooking,
  fetchBookingPaymentDetails,
} from '../store/slices/bookingSlice';
import { selectPrimaryHotelId } from '../store/slices/userSlice';

const BOOKING_STATUS_COLORS = {
  BOOKED: 'bg-green-100 text-green-700',
  CHECKED_IN: 'bg-blue-100 text-blue-700',
  CHECKED_OUT: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

const PAYMENT_STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
};

export const Bookings = () => {
  const dispatch = useDispatch();
  const {
    bookings,
    loading,
    summary,
    selectedBooking,
    paymentDetails,
    checkInLoading,
    checkOutLoading,
    cancelLoading,
  } = useSelector((state) => state.bookings);
  const activeHotelId = useSelector(selectPrimaryHotelId);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [refundFilter, setRefundFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState({ open: false, bookingId: null });

  const loadBookings = useCallback(async () => {
    if (!activeHotelId) return;
    try {
      const filters = {};
      if (statusFilter !== 'all') filters.bookingStatus = statusFilter;
      if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter;
      if (refundFilter !== 'all') filters.refundStatus = refundFilter;
      await dispatch(fetchHotelBookings({ hotelId: activeHotelId, filters })).unwrap();
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  }, [activeHotelId, statusFilter, paymentFilter, refundFilter, dispatch]);

  useEffect(() => {
    if (activeHotelId) {
      loadBookings();
      dispatch(fetchBookingSummary(activeHotelId));
    }
  }, [activeHotelId, statusFilter, paymentFilter, refundFilter]);

  // Helper to get guest display name
  const getGuestName = (booking) => {
    if (booking.guest) {
      const { firstName, lastName, email, phoneNumber } = booking.guest;
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
      if (email) return email;
      if (phoneNumber) return phoneNumber;
      return 'Guest';
    }
    return booking.guestName || 'Guest';
  };

  // Filter bookings by search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;

    const query = searchQuery.toLowerCase();
    return bookings.filter((booking) => {
      const guestName = getGuestName(booking).toLowerCase();
      const bookingId = booking.bookingId?.toLowerCase() || '';
      const roomId = booking.roomId?.toLowerCase() || '';
      return (
        guestName.includes(query) ||
        bookingId.includes(query) ||
        roomId.includes(query)
      );
    });
  }, [bookings, searchQuery]);

  const handleCheckIn = useCallback(async (bookingId) => {
    try {
      await dispatch(checkIn(bookingId)).unwrap();
      toast.success('Guest checked in successfully');
      loadBookings();
    } catch (error) {
      toast.error(error || 'Failed to check in');
    }
  }, [dispatch, loadBookings]);

  const handleCheckOut = useCallback(async (bookingId) => {
    try {
      await dispatch(checkOut(bookingId)).unwrap();
      toast.success('Guest checked out successfully');
      loadBookings();
    } catch (error) {
      toast.error(error || 'Failed to check out');
    }
  }, [dispatch, loadBookings]);

  const handleCancelBooking = useCallback((bookingId) => {
    setConfirmCancel({ open: true, bookingId });
  }, []);

  const confirmCancelBooking = useCallback(async () => {
    const { bookingId } = confirmCancel;
    setConfirmCancel({ open: false, bookingId: null });
    try {
      await dispatch(cancelBooking(bookingId)).unwrap();
      toast.success('Booking cancelled successfully');
      loadBookings();
    } catch (error) {
      toast.error(error || 'Failed to cancel booking');
    }
  }, [confirmCancel, dispatch, loadBookings]);

  const handleViewDetails = useCallback((bookingId) => {
    const booking = bookings.find((b) => b.bookingId === bookingId);
    dispatch(setSelectedBooking(booking || null));
    setShowDetailsModal(true);
    dispatch(fetchBookingById(bookingId));
    dispatch(fetchBookingPaymentDetails(bookingId));
  }, [bookings, dispatch]);

  // Get status counts from API summary
  const statusCounts = useMemo(() => ({
    all: summary?.totalBookings ?? bookings.length,
    BOOKED: summary?.booked ?? 0,
    CHECKED_IN: summary?.checkedIn ?? 0,
    CHECKED_OUT: summary?.checkedOut ?? 0,
    CANCELLED: summary?.cancelled ?? 0,
  }), [summary, bookings.length]);

  const columns = useMemo(() => [
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
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{getGuestName(row)}</p>
          {row.guest?.email && (
            <p className="text-xs text-slate-500">{row.guest.email}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Room ID',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.roomId?.substring(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Check-in',
      render: (row) => (
        <div>
          <p className="text-sm">{new Date(row.checkInDate).toLocaleDateString()}</p>
          {row.actualCheckInTime && (
            <p className="text-xs text-green-600">
              {new Date(row.actualCheckInTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Check-out',
      render: (row) => (
        <div>
          <p className="text-sm">{new Date(row.checkOutDate).toLocaleDateString()}</p>
          {row.actualCheckOutTime && (
            <p className="text-xs text-green-600">
              {new Date(row.actualCheckOutTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Booking Status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[row.bookingStatus] || 'bg-gray-100 text-gray-700'}`}>
          {row.bookingStatus}
        </span>
      ),
    },
    {
      header: 'Payment',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${PAYMENT_STATUS_COLORS[row.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetails(row.bookingId)}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.bookingStatus === 'BOOKED' && (
            <>
              <button
                onClick={() => handleCheckIn(row.bookingId)}
                disabled={checkInLoading}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                title="Check In"
              >
                <LogIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCancelBooking(row.bookingId)}
                disabled={cancelLoading}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Cancel Booking"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {row.bookingStatus === 'CHECKED_IN' && (
            <button
              onClick={() => handleCheckOut(row.bookingId)}
              disabled={checkOutLoading}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Check Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ], [handleViewDetails, handleCheckIn, handleCheckOut, handleCancelBooking, checkInLoading, checkOutLoading, cancelLoading]);

  if (loading && bookings.length === 0) {
    return <BookingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage reservations and booking actions</p>
          <div className="mt-2">
            <HotelSelector />
          </div>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!activeHotelId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-14 h-14 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">No hotel selected</h3>
          <p className="text-sm text-slate-500">Use the hotel selector above to view bookings for a property.</p>
        </div>
      )}

      {activeHotelId && <>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: 'all', label: 'All Bookings', color: 'slate' },
          { key: 'BOOKED', label: 'Booked', color: 'green' },
          { key: 'CHECKED_IN', label: 'Checked In', color: 'blue' },
          { key: 'CHECKED_OUT', label: 'Checked Out', color: 'gray' },
          { key: 'CANCELLED', label: 'Cancelled', color: 'red' },
        ].map((status, index) => (
          <motion.button
            key={status.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setStatusFilter(status.key)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              statusFilter === status.key
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-sm text-slate-600 mb-1">{status.label}</p>
            <p className="text-2xl font-bold text-slate-900">{statusCounts[status.key]}</p>
          </motion.button>
        ))}
      </div>

      {/* Search & Advanced Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by guest name, booking ID, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            showFilters ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {(paymentFilter !== 'all' || refundFilter !== 'all') && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {[paymentFilter !== 'all', refundFilter !== 'all'].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Refund Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Refund Status
                </label>
                <select
                  value={refundFilter}
                  onChange={(e) => setRefundFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All</option>
                  <option value="NOT_REQUESTED">Not Requested</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPaymentFilter('all');
                    setRefundFilter('all');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {filteredBookings.length > 0 ? (
        <DataTable columns={columns} data={filteredBookings} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No bookings found</h3>
          <p className="text-slate-600">
            {searchQuery ? 'Try adjusting your search query' : 'No bookings match the current filters'}
          </p>
        </div>
      )}

      {/* Cancel Booking Confirm Modal */}
      <ConfirmModal
        isOpen={confirmCancel.open}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Cancel Booking"
        loading={cancelLoading}
        onConfirm={confirmCancelBooking}
        onCancel={() => setConfirmCancel({ open: false, bookingId: null })}
      />

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => { setShowDetailsModal(false); dispatch(setSelectedBooking(null)); dispatch(clearPaymentDetails()); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Booking Details</h2>
                  {selectedBooking && (
                    <p className="text-sm text-slate-500 font-mono">{selectedBooking.bookingId}</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowDetailsModal(false); dispatch(setSelectedBooking(null)); dispatch(clearPaymentDetails()); }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              {!selectedBooking ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
                </div>
              ) : (
              <>
              <div className="p-6 space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedBooking.bookingStatus === 'BOOKED' ? 'bg-green-100 text-green-700' :
                    selectedBooking.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                    selectedBooking.bookingStatus === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedBooking.bookingStatus}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedBooking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                    selectedBooking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Payment: {selectedBooking.paymentStatus}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedBooking.refundStatus === 'NOT_REQUESTED' ? 'bg-slate-100 text-slate-700' :
                    selectedBooking.refundStatus === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    selectedBooking.refundStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    selectedBooking.refundStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                    selectedBooking.refundStatus === 'NOT_ELIGIBLE' ? 'bg-gray-100 text-gray-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    Refund: {selectedBooking.refundStatus}
                  </span>
                </div>

                {/* Guest Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Guest Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="font-medium text-slate-900">{getGuestName(selectedBooking)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{selectedBooking.guest?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{selectedBooking.guest?.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Guest ID</p>
                      <p className="font-mono text-xs text-slate-600">{selectedBooking.guest?.guestId?.substring(0, 12)}...</p>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LogIn className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-medium text-slate-700">Check-in</h3>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                    </p>
                    {selectedBooking.actualCheckInTime && (
                      <p className="text-sm text-green-600 mt-1">
                        Actual: {new Date(selectedBooking.actualCheckInTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LogOut className="w-4 h-4 text-green-600" />
                      <h3 className="text-sm font-medium text-slate-700">Check-out</h3>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
                    </p>
                    {selectedBooking.actualCheckOutTime && (
                      <p className="text-sm text-green-600 mt-1">
                        Actual: {new Date(selectedBooking.actualCheckOutTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-medium text-slate-700">Payment Details</h3>
                  </div>
                  {!paymentDetails ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" />
                    </div>
                  ) : (
                  <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Amount</p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${paymentDetails.totalAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Refund Amount</p>
                      <p className="text-lg font-bold text-slate-900">
                        ${paymentDetails.refundAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                  {paymentDetails.refundPolicy && (
                    <p className="text-xs text-slate-500 mt-3 p-2 bg-white rounded border border-slate-200">
                      {paymentDetails.refundPolicy}
                    </p>
                  )}
                  </>
                  )}
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Created At</p>
                    <p className="text-slate-700">
                      {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last Updated</p>
                    <p className="text-slate-700">
                      {selectedBooking.updatedAt ? new Date(selectedBooking.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Staff Info */}
                {(selectedBooking.checkedInBy || selectedBooking.checkedOutBy) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.checkedInBy && (
                      <div>
                        <p className="text-xs text-slate-500">Checked In By</p>
                        <p className="font-mono text-xs text-slate-600">{selectedBooking.checkedInBy}</p>
                      </div>
                    )}
                    {selectedBooking.checkedOutBy && (
                      <div>
                        <p className="text-xs text-slate-500">Checked Out By</p>
                        <p className="font-mono text-xs text-slate-600">{selectedBooking.checkedOutBy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer - Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                {selectedBooking.bookingStatus === 'BOOKED' && (
                  <>
                    <button
                      onClick={() => {
                        handleCheckIn(selectedBooking.bookingId);
                        setShowDetailsModal(false);
                      }}
                      disabled={checkInLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" />
                      Check In
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleCancelBooking(selectedBooking.bookingId);
                      }}
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
                {selectedBooking.bookingStatus === 'CHECKED_IN' && (
                  <button
                    onClick={() => {
                      handleCheckOut(selectedBooking.bookingId);
                      setShowDetailsModal(false);
                    }}
                    disabled={checkOutLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>}
    </div>
  );
};

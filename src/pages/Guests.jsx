import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Phone,
  Search,
  X,
  LogIn,
  LogOut,
} from 'lucide-react';
import { HotelSelector } from '../components/shared/HotelSelector';
import { GuestsSkeleton } from '../components/common/Skeleton';
import { loadGuests } from '../store/slices/guestSlice';
import {
  fetchBookingById,
  fetchBookingPaymentDetails,
  setSelectedBooking,
  clearPaymentDetails,
  selectSelectedBooking,
  selectPaymentDetails,
} from '../store/slices/bookingSlice';

export const Guests = () => {
  const dispatch = useDispatch();
  const { guests, loading, error } = useSelector((state) => state.guests);
  const hotelId = useSelector((state) => state.user.hotelId);
  const selectedBooking = useSelector(selectSelectedBooking);
  const paymentDetails = useSelector(selectPaymentDetails);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (hotelId) {
      dispatch(loadGuests(hotelId));
    }
  }, [hotelId]);

  const getGuestName = (guest) => {
    const first = guest.firstName || '';
    const last = guest.lastName || '';
    const full = `${first} ${last}`.trim();
    return full || 'Unknown Guest';
  };

  const getInitials = (guest) => {
    const first = guest.firstName?.[0] || '';
    const last = guest.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  // Determine guest's current booking status (latest booking)
  const getGuestStatus = (guest) => {
    if (!guest.bookings?.length) return 'none';
    const sorted = [...guest.bookings].sort(
      (a, b) => new Date(b.checkInDate) - new Date(a.checkInDate)
    );
    return sorted[0].bookingStatus;
  };

  const statusColors = {
    BOOKED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-green-100 text-green-700',
    CHECKED_OUT: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabels = {
    BOOKED: 'Booked',
    CHECKED_IN: 'Checked In',
    CHECKED_OUT: 'Checked Out',
    CANCELLED: 'Cancelled',
    PENDING: 'Pending',
  };

  // Compute status once per guest — avoids repeated sort/spread in filter + stats
  const guestsWithStatus = useMemo(() =>
    guests.map((guest) => ({ ...guest, _status: getGuestStatus(guest) })),
    [guests]
  );

  const filteredGuests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return guestsWithStatus.filter((guest) => {
      const matchesSearch =
        !searchQuery ||
        getGuestName(guest).toLowerCase().includes(q) ||
        (guest.email || '').toLowerCase().includes(q) ||
        (guest.phoneNumber || '').toLowerCase().includes(q) ||
        (guest.guestId || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || guest._status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [guestsWithStatus, searchQuery, statusFilter]);

  const statCards = useMemo(() => {
    let booked = 0, checkedIn = 0, checkedOut = 0;
    for (const g of guestsWithStatus) {
      if (g._status === 'BOOKED') booked++;
      else if (g._status === 'CHECKED_IN') checkedIn++;
      else if (g._status === 'CHECKED_OUT') checkedOut++;
    }
    return [
      { label: 'Total Guests', value: guestsWithStatus.length, color: 'text-slate-900' },
      { label: 'Booked', value: booked, color: 'text-blue-600' },
      { label: 'Checked In', value: checkedIn, color: 'text-green-600' },
      { label: 'Checked Out', value: checkedOut, color: 'text-slate-500' },
    ];
  }, [guestsWithStatus]);

  const openBookingDetails = (booking) => {
    if (!booking?.bookingId) return;
    dispatch(setSelectedBooking(booking));
    dispatch(fetchBookingById(booking.bookingId));
    dispatch(fetchBookingPaymentDetails(booking.bookingId));
    setShowBookingModal(true);
  };

  const closeBookingDetails = () => {
    setShowBookingModal(false);
    dispatch(clearPaymentDetails());
  };

  if (loading) {
    return <GuestsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guests</h1>
          <p className="text-slate-500 text-sm mt-0.5">View guest profiles from bookings</p>
          <div className="mt-2">
            <HotelSelector />
          </div>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-lg border border-slate-200 p-6"
          >
            <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'BOOKED', label: 'Booked' },
          { key: 'CHECKED_IN', label: 'Checked In' },
          { key: 'CHECKED_OUT', label: 'Checked Out' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGuests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No guests found</h3>
          <p className="text-slate-500 text-sm">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Guest data will appear once bookings are made.'}
          </p>
        </div>
      )}

      {/* Guests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest, index) => {
          const status = guest._status;
          return (
            <motion.div
              key={guest.guestId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedGuest(guest)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Avatar + Name */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {getInitials(guest)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1 truncate">
                    {getGuestName(guest)}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      statusColors[status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {statusLabels[status] || status || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{guest.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{guest.phoneNumber || 'No phone'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
                  <p className="text-lg font-bold text-slate-900">{guest.totalBookings}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Check-in</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {guest.lastCheckIn
                      ? new Date(guest.lastCheckIn).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Guest Detail Modal */}
      <AnimatePresence>
        {selectedGuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGuest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(selectedGuest)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {getGuestName(selectedGuest)}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Guest ID: {selectedGuest.guestId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
                {/* Contact Details */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                    Contact Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">
                        {selectedGuest.email || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">
                        {selectedGuest.phoneNumber || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking History */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                    Booking History ({selectedGuest.bookings?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedGuest.bookings
                      ?.sort(
                        (a, b) => new Date(b.checkInDate) - new Date(a.checkInDate)
                      )
                      .map((booking) => (
                        <div
                          key={booking.bookingId}
                          onClick={() => openBookingDetails(booking)}
                          className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 font-mono">
                              {booking.bookingId.slice(0, 8)}...
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                statusColors[booking.bookingStatus] ||
                                'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {statusLabels[booking.bookingStatus] || booking.bookingStatus}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <LogIn className="w-3.5 h-3.5" />
                              <span>{booking.checkInDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <LogOut className="w-3.5 h-3.5" />
                              <span>{booking.checkOutDate}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>Room: {booking.roomId.slice(0, 8)}...</span>
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                booking.paymentStatus === 'PAID'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {booking.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    {(!selectedGuest.bookings || selectedGuest.bookings.length === 0) && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No booking history available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {showBookingModal && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeBookingDetails}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Booking Details</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedBooking.bookingId}
                  </p>
                </div>
                <button
                  onClick={closeBookingDetails}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-88px)]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.bookingStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Payment</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Check-in</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.checkInDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Check-out</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.checkOutDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Room</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.roomId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Refund</p>
                    <p className="font-semibold text-slate-900">{selectedBooking.refundStatus || 'NA'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Payment Details</h3>
                  {!paymentDetails ? (
                    <p className="text-sm text-slate-500">Loading payment details…</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total Amount</p>
                        <p className="font-semibold text-slate-900">
                          ${paymentDetails.totalAmount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Refund Amount</p>
                        <p className="font-semibold text-slate-900">
                          ${paymentDetails.refundAmount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      {paymentDetails.refundPolicy && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 mb-1">Refund Policy</p>
                          <p className="text-sm text-slate-700">{paymentDetails.refundPolicy}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

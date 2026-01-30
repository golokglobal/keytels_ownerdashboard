import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Calendar, Filter, Plus, Search } from 'lucide-react';
import { DataTable } from '../components/shared/DataTable';
import { Loader } from '../components/common/Loader';
import { fetchHotelBookings } from '../store/slices/bookingSlice';

export const Bookings = () => {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.bookings);
  const hotelId = useSelector((state) => state.user.hotelId);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (hotelId) {
      loadBookings();
    }
  }, [filter, hotelId]);

  const loadBookings = async () => {
    try {
      const filters = filter !== 'all' ? { bookingStatus: filter } : {};
      await dispatch(fetchHotelBookings({ hotelId, filters })).unwrap();
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const columns = [
    { header: 'Booking ID', accessor: 'bookingId' },
    { header: 'Guest Name', accessor: 'guestName' },
    { header: 'Room Type', accessor: 'roomType' },
    { header: 'Room #', accessor: 'roomNumber' },
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
        const colors = {
          BOOKED: 'bg-green-100 text-green-700',
          CHECKED_IN: 'bg-blue-100 text-blue-700',
          CHECKED_OUT: 'bg-slate-100 text-slate-700',
          CANCELLED: 'bg-red-100 text-red-700',
          PENDING: 'bg-yellow-100 text-yellow-700',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[row.bookingStatus] || 'bg-gray-100 text-gray-700'}`}>
            {row.bookingStatus}
          </span>
        );
      },
    },
    {
      header: 'Amount',
      render: (row) => `$${row.totalAmount?.toLocaleString() || '0'}`,
    },
  ];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bookings</h1>
          <p className="text-slate-600">Manage all your hotel bookings</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['all', 'BOOKED', 'CHECKED_IN', 'PENDING'].map((status, index) => {
          const count = status === 'all' ? bookings.length : bookings.filter(b => b.bookingStatus === status).length;
          const displayName = status === 'all' ? 'All Bookings' : status.replace('_', ' ');
          return (
            <motion.button
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setFilter(status)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                filter === status
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-sm text-slate-600 mb-1 capitalize">{displayName}</p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </button>
        <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date Range
        </button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={bookings} />
    </div>
  );
};

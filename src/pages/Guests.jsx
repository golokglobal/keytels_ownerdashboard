import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Star } from 'lucide-react';
import { Loader } from '../components/common/Loader';
import { setGuests, setLoading } from '../store/slices/guestSlice';
import { fetchGuests } from '../api/guests';

export const Guests = () => {
  const dispatch = useDispatch();
  const { guests, loading } = useSelector((state) => state.guests);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    dispatch(setLoading(true));
    try {
      const response = await fetchGuests();
      dispatch(setGuests(response.guests));
    } catch (error) {
      console.error('Failed to load guests:', error);
    }
  };

  const vipBadgeColors = {
    platinum: 'bg-slate-900 text-white',
    gold: 'bg-yellow-500 text-white',
    silver: 'bg-slate-400 text-white',
    regular: 'bg-slate-200 text-slate-700',
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Guests</h1>
        <p className="text-slate-600">Manage guest profiles and history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-slate-200 p-6"
        >
          <p className="text-slate-600 text-sm mb-1">Total Guests</p>
          <p className="text-3xl font-bold text-slate-900">{guests.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-slate-200 p-6"
        >
          <p className="text-slate-600 text-sm mb-1">Platinum</p>
          <p className="text-3xl font-bold text-slate-900">
            {guests.filter(g => g.vipStatus === 'platinum').length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-slate-200 p-6"
        >
          <p className="text-slate-600 text-sm mb-1">Gold</p>
          <p className="text-3xl font-bold text-slate-900">
            {guests.filter(g => g.vipStatus === 'gold').length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-slate-200 p-6"
        >
          <p className="text-slate-600 text-sm mb-1">Silver</p>
          <p className="text-3xl font-bold text-slate-900">
            {guests.filter(g => g.vipStatus === 'silver').length}
          </p>
        </motion.div>
      </div>

      {/* Guests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests.map((guest, index) => (
          <motion.div
            key={guest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4 mb-4">
              <img
                src={guest.avatar}
                alt={guest.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">{guest.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${vipBadgeColors[guest.vipStatus]}`}>
                  {guest.vipStatus}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                {guest.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                {guest.phone}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
                <p className="text-lg font-bold text-slate-900">{guest.totalBookings}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Spent</p>
                <p className="text-lg font-bold text-green-600">${guest.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Save, Bell, Lock, User, Building, Clock, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import {
  fetchHotelById,
  updateHotel,
} from '../store/slices/PartnerHotelslice';

export const Settings = () => {
  const dispatch = useDispatch();
  const { hotels, loading: hotelLoading, error: hotelError } = useSelector((state) => state.partneredhotels);
  const { hotelId } = useSelector((state) => state.user);

  const [settings, setSettings] = useState({
    hotelName: '',
    email: '',
    phone: '',
    address: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    currency: 'USD',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  const [activeHotelId, setActiveHotelId] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch hotel data on mount using GET /partneredhotel/{hotelId}
  useEffect(() => {
    const loadHotel = async () => {
      if (!hotelId) return;
      try {
        await dispatch(fetchHotelById(hotelId)).unwrap();
      } catch (err) {
        console.error('[Settings] Failed to load hotel:', err);
      }
    };
    loadHotel();
  }, [dispatch, hotelId]);

  // Populate form once hotels are loaded
  useEffect(() => {
    if (hotels && hotels.length > 0) {
      // Find matching hotel by hotelId from user state, or use first
      const match = hotelId
        ? hotels.find((h) => (h.partneredHotelId || h.id) === hotelId)
        : null;
      const hotel = match || hotels[0];
      const resolvedId = hotel.partneredHotelId || hotel.id;
      setActiveHotelId(resolvedId);
      setSettings((prev) => ({
        ...prev,
        hotelName: hotel.hotelName || hotel.name || '',
        email: hotel.email || '',
        phone: hotel.phone || hotel.phoneNumber || '',
        address: hotel.address || [hotel.city, hotel.state].filter(Boolean).join(', ') || '',
        checkInTime: hotel.checkInTime || '15:00',
        checkOutTime: hotel.checkOutTime || '11:00',
        currency: hotel.currency || 'USD',
        timezone: hotel.timezone || 'America/New_York',
      }));
    }
  }, [hotels, hotelId]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await dispatch(updateHotel({
        hotelId: activeHotelId,
        data: {
          hotelName: settings.hotelName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          checkInTime: settings.checkInTime,
          checkOutTime: settings.checkOutTime,
          currency: settings.currency,
          timezone: settings.timezone,
        },
      })).unwrap();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err?.message || String(err) || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your hotel and account settings</p>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-green-200 rounded-xl shadow-xl p-4 flex items-center gap-3 text-green-700">
          <div className="bg-green-100 rounded-full p-1.5">
            <Check size={16} />
          </div>
          <p className="font-medium text-sm">Settings saved successfully!</p>
          <button onClick={() => setSaveSuccess(false)}><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            {[
              { icon: Building, label: 'Hotel Information', id: 'hotel' },
              { icon: User, label: 'Account Settings', id: 'account' },
              { icon: Clock, label: 'Business Hours', id: 'hours' },
              { icon: Bell, label: 'Notifications', id: 'notifications' },
              { icon: Lock, label: 'Security', id: 'security' },
            ].map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <item.icon className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Loading state */}
          {hotelLoading && !hotels.length && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={18} className="animate-spin" />
              <span>Loading hotel details...</span>
            </div>
          )}

          {/* API error */}
          {hotelError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{hotelError}</p>
            </div>
          )}

          {/* Save error */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-sm flex-1">{saveError}</p>
              <button onClick={() => setSaveError(null)}><X size={16} /></button>
            </div>
          )}

          {/* Hotel Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Hotel Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Name</label>
                <input
                  type="text"
                  value={settings.hotelName}
                  onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter hotel name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="hotel@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="123 Street, City, State"
                />
              </div>
            </div>
          </motion.div>

          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Business Hours
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Check-in Time</label>
                <input
                  type="time"
                  value={settings.checkInTime}
                  onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Check-out Time</label>
                <input
                  type="time"
                  value={settings.checkOutTime}
                  onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 capitalize">{key} Notifications</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, [key]: e.target.checked },
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>
              ))}
            </div>
          </motion.div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || hotelLoading || !activeHotelId}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

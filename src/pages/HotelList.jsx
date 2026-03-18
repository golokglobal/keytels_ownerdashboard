import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchHotelById,
  fetchOwnerHotels,
  deleteHotel,
  clearHotelError,
  clearAllHotels,
} from '../store/slices/PartnerHotelslice';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Plus,
  Building2,
  MapPin,
  BedDouble,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Percent,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hotel card image carousel
const HotelImageCarousel = ({ images = [], hotelImages = [] }) => {
  const [current, setCurrent] = useState(0);

  const allImages = [];
  if (hotelImages?.length > 0) {
    hotelImages.forEach((img) => {
      if (img.imageUrl || img.url) allImages.push(img);
    });
  }
  images.forEach((room) => {
    if (room.images?.length > 0) {
      room.images.forEach((img) => {
        if (img.imageUrl || img.url) allImages.push(img);
      });
    }
  });

  if (allImages.length === 0) {
    return (
      <div className="w-full h-56 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
        <span className="text-xs text-slate-400 font-medium">No images available</span>
      </div>
    );
  }

  const displayImages = allImages.slice(0, 8);

  return (
    <div className="relative w-full h-56 group overflow-hidden">
      <img
        src={displayImages[current]?.imageUrl || displayImages[current]?.url}
        alt="Hotel"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => {
          e.target.src = '';
          e.target.onerror = null;
          e.target.parentElement.innerHTML =
            '<div class="w-full h-full bg-slate-100 flex items-center justify-center"><span class="text-xs text-slate-400">Image unavailable</span></div>';
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {displayImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === 0 ? displayImages.length - 1 : p - 1));
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === displayImages.length - 1 ? 0 : p + 1));
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={`rounded-full transition-all ${
                  i === current ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Stat card component
const StatCard = ({ label, value, icon: Icon, color, bg, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  </motion.div>
);

export const HotelList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loading, error } = useSelector(
    (state) => state.partneredhotels
  );

  const userId = useSelector((state) => state.user.userId);
  const managerHotelId = useSelector((state) => state.user.hotelId);
  const userRole = useSelector((state) => state.user.userRole);
  const isHotelOwner = userRole === 'HOTEL_OWNER';
  const isHotelManager =
    userRole === 'HOTEL_MANAGER' ||
    userRole === 'HOTELMANAGER' ||
    userRole === 'manager';

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  const getHotelId = (hotel) =>
    hotel?.partneredHotelId || hotel?.id || hotel?._id || hotel?.hotelId || null;

  useEffect(() => {
    const loadHotels = async () => {
      dispatch(clearAllHotels());
      try {
        if (isHotelOwner) {
          // Owner: fetch all hotels belonging to this owner
          await dispatch(fetchOwnerHotels()).unwrap();
        } else if (managerHotelId) {
          // Manager: fetch the single assigned hotel
          await dispatch(fetchHotelById(managerHotelId)).unwrap();
        } else {
          toast.error('No hotel assigned to your account');
        }
      } catch (err) {
        console.error('[HotelList] Load error:', err);
        toast.error(err.message || err.toString() || 'Failed to load hotels');
      }
    };

    if (userId) loadHotels();
    return () => { dispatch(clearHotelError()); };
  }, [dispatch, isHotelOwner, isHotelManager, managerHotelId, userId]);

  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const id = getHotelId(hotelToDelete);
    if (!id) return;
    try {
      await dispatch(deleteHotel(id)).unwrap();
      toast.success('Hotel deactivated successfully');
      setShowDeleteModal(false);
      setHotelToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete hotel');
    }
  };

  const totalHotels = hotels.length;
  const totalRooms = hotels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);
  const activeHotels = hotels.filter((h) => h.status?.toUpperCase() === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isHotelManager ? 'My Hotel' : 'Hotels'}
              </h1>
            </div>
            <p className="text-slate-500 text-sm ml-13 pl-0.5">
              {isHotelManager
                ? 'Manage your assigned property'
                : 'Manage your partnered properties'}
            </p>
          </div>
          {!isHotelManager && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/add-hotel')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Hotel
            </motion.button>
          )}
        </div>

        {/* Stats */}
        {hotels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Hotels" value={totalHotels} icon={Building2} color="text-slate-700" bg="bg-slate-100" delay={0} />
            <StatCard label="Total Rooms" value={totalRooms} icon={BedDouble} color="text-blue-600" bg="bg-blue-50" delay={0.05} />
            <StatCard label="Active Hotels" value={activeHotels} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" delay={0.1} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
              <p className="text-slate-500 text-sm font-medium">Loading hotels...</p>
            </div>
          </div>
        ) : hotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotels.map((hotel, index) => {
              const id = getHotelId(hotel);
              if (!id) return null;

              const name = hotel.name || hotel.hotelName || 'Unnamed Hotel';
              const location = hotel.location || '';
              const description = hotel.description || '';
              const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
              const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
              const status = hotel.status?.toUpperCase() || 'UNKNOWN';
              const isActive = status === 'ACTIVE';
              const discount = hotel.discountPercentage || 0;

              const prices = rooms
                .map((r) => Number(r.pricePerNight || r.basePrice || 0))
                .filter((p) => p > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
              const totalCapacity = rooms.reduce((s, r) => s + (r.capacity || 0), 0);

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  {/* Image + Status badge */}
                  <div className="relative">
                    <HotelImageCarousel images={rooms} hotelImages={hotel.hotelImages} />
                    <span
                      className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                        isActive
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-700/80 text-white'
                      }`}
                    >
                      {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isActive ? 'Active' : status}
                    </span>
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/90 text-amber-900 backdrop-blur-sm">
                        <Percent className="w-3 h-3" />
                        {discount}% off
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5 gap-4">
                    {/* Hotel name + location */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{name}</h3>
                      {location && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {description && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                        {description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: BedDouble, label: 'Rooms', value: rooms.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Users, label: 'Guests', value: totalCapacity, color: 'text-violet-600', bg: 'bg-violet-50' },
                        {
                          icon: DollarSign,
                          label: 'From/night',
                          value: minPrice > 0 ? (minPrice === maxPrice ? `$${minPrice}` : `$${minPrice}+`) : 'N/A',
                          color: 'text-emerald-600',
                          bg: 'bg-emerald-50',
                        },
                      ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                          <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                          <p className={`text-base font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Amenities */}
                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {amenities.slice(0, 4).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg font-medium capitalize"
                          >
                            {typeof amenity === 'string' ? amenity : amenity?.name || ''}
                          </span>
                        ))}
                        {amenities.length > 4 && (
                          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-400 text-xs rounded-lg font-medium">
                            +{amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Owner info */}
                    {hotel.owner && (
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                        {hotel.owner.profileImageUrl ? (
                          <img
                            src={hotel.owner.profileImageUrl}
                            alt={hotel.owner.firstName}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xs font-bold text-white">
                            {(hotel.owner.firstName?.[0] || '') + (hotel.owner.lastName?.[0] || '')}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {[hotel.owner.firstName, hotel.owner.lastName].filter(Boolean).join(' ') || 'Owner'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{hotel.owner.email || ''}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/hotels/edit/${id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Hotel
                      </motion.button>
                      {!isHotelManager && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleDeleteClick(hotel)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {isHotelManager ? 'No Hotel Assigned' : 'No Hotels Yet'}
            </h3>
            <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
              {isHotelManager
                ? 'Contact your admin to assign a hotel to your account.'
                : 'Start building your portfolio by adding your first property.'}
            </p>
            {!isHotelManager && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/add-hotel')}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Hotel
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && hotelToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowDeleteModal(false); setHotelToDelete(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7"
            >
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-red-100 mb-4">
                  <Trash2 className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Deactivate Hotel?</h3>
                <p className="text-slate-600 text-sm mb-2">
                  You're about to deactivate{' '}
                  <span className="font-semibold text-slate-900">
                    {hotelToDelete.name || hotelToDelete.hotelName || 'this hotel'}
                  </span>
                </p>
                <p className="text-xs text-red-500 font-medium bg-red-50 py-2 px-3 rounded-lg">
                  The hotel will be deactivated and hidden from guests.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setHotelToDelete(null); }}
                  className="flex-1 px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-sm text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deactivating...' : 'Yes, Deactivate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

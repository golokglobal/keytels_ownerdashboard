import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAllOwnerHotels,
  fetchHotelById,
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
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hotel card image carousel
const HotelImageCarousel = ({ images = [], hotelImages = [] }) => {
  const [current, setCurrent] = useState(0);

  // Combine room images and hotel images for display
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
      <div className="w-full h-52 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
        <span className="text-xs text-slate-400">No images</span>
      </div>
    );
  }

  // Limit to 8 images max for the dots
  const displayImages = allImages.slice(0, 8);

  return (
    <div className="relative w-full h-52 group">
      <img
        src={displayImages[current]?.imageUrl || displayImages[current]?.url}
        alt="Hotel"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = '';
          e.target.onerror = null;
          e.target.parentElement.innerHTML =
            '<div class="w-full h-full bg-slate-100 flex items-center justify-center"><span class="text-xs text-slate-400">Image unavailable</span></div>';
        }}
      />
      {displayImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === 0 ? displayImages.length - 1 : p - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === displayImages.length - 1 ? 0 : p + 1));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {displayImages.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const HotelList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loading, error } = useSelector(
    (state) => state.partneredhotels
  );

  const userId = useSelector((state) => state.user.userId);
  const managerHotelId = useSelector((state) => state.user.hotelId);
  const isHotelManager = useSelector(
    (state) =>
      state.user.userRole === 'HOTELMANAGER' ||
      state.user.userRole === 'manager'
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  const getHotelId = (hotel) =>
    hotel?.partneredHotelId || hotel?.id || hotel?._id || hotel?.hotelId || null;

  useEffect(() => {
    const loadHotels = async () => {
      dispatch(clearAllHotels());

      try {
        if (isHotelManager) {
          if (managerHotelId) {
            await dispatch(fetchHotelById(managerHotelId)).unwrap();
          } else {
            toast.error('No hotel assigned to your account');
          }
        } else {
          try {
            await dispatch(fetchAllOwnerHotels()).unwrap();
          } catch (apiErr) {
            if (managerHotelId) {
              await dispatch(fetchHotelById(managerHotelId)).unwrap();
            } else {
              throw apiErr;
            }
          }
        }
      } catch (err) {
        console.error('[HotelList] Load error:', err);
        const errorMessage =
          err.message || err.toString() || 'Failed to load hotels';
        toast.error(errorMessage);
      }
    };

    if (userId) {
      loadHotels();
    }

    return () => {
      dispatch(clearHotelError());
    };
  }, [dispatch, isHotelManager, managerHotelId, userId]);

  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const id = getHotelId(hotelToDelete);
    if (!id) return;

    try {
      await dispatch(deleteHotel(id)).unwrap();
      toast.success('Hotel deleted successfully');
      setShowDeleteModal(false);
      setHotelToDelete(null);
    } catch (err) {
      console.error('[HotelList] Delete failed:', err);
      toast.error(err.message || 'Failed to delete hotel');
    }
  };

  // Stats
  const totalHotels = hotels.length;
  const totalRooms = hotels.reduce(
    (sum, h) => sum + (h.rooms?.length || 0),
    0
  );
  const activeHotels = hotels.filter(
    (h) => h.status?.toUpperCase() === 'ACTIVE'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isHotelManager ? 'My Hotel' : 'Hotels'}
          </h1>
          <p className="text-slate-600">
            {isHotelManager
              ? 'Manage your assigned property'
              : 'Manage your partnered properties'}
          </p>
        </div>
        {!isHotelManager && (
          <button
            onClick={() => navigate('/add-hotel')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Hotel
          </button>
        )}
      </div>

      {/* Stats */}
      {hotels.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Hotels', value: totalHotels, color: 'text-slate-900' },
            { label: 'Total Rooms', value: totalRooms, color: 'text-blue-600' },
            { label: 'Active', value: activeHotels, color: 'text-green-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg border border-slate-200 p-5"
            >
              <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent"></div>
        </div>
      ) : hotels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel, index) => {
            const id = getHotelId(hotel);
            if (!id) return null;

            const name = hotel.name || hotel.hotelName || 'Unnamed Hotel';
            const location = hotel.location || '';
            const description = hotel.description || '';
            const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
            const amenities = Array.isArray(hotel.amenities)
              ? hotel.amenities
              : [];
            const status = hotel.status?.toUpperCase() || 'UNKNOWN';
            const isActive = status === 'ACTIVE';
            const discount = hotel.discountPercentage || 0;

            const prices = rooms
              .map((r) => Number(r.pricePerNight || r.basePrice || 0))
              .filter((p) => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Image */}
                <HotelImageCarousel
                  images={rooms}
                  hotelImages={hotel.hotelImages}
                />

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg truncate">
                        {name}
                      </h3>
                      {location && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                        isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {isActive ? 'Active' : status}
                    </span>
                  </div>

                  {/* Description */}
                  {description && (
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <BedDouble className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {rooms.length}
                      </p>
                      <p className="text-xs text-slate-500">Rooms</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {rooms.reduce((s, r) => s + (r.capacity || 0), 0)}
                      </p>
                      <p className="text-xs text-slate-500">Capacity</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {minPrice > 0
                          ? minPrice === maxPrice
                            ? `$${minPrice}`
                            : `$${minPrice}+`
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">From/night</p>
                    </div>
                  </div>

                  {/* Discount */}
                  {discount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                      <Percent className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {discount}% partner discount
                      </span>
                    </div>
                  )}

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {amenities.slice(0, 5).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium capitalize"
                        >
                          {typeof amenity === 'string'
                            ? amenity
                            : amenity?.name || ''}
                        </span>
                      ))}
                      {amenities.length > 5 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md font-medium">
                          +{amenities.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Owner Info */}
                  {hotel.owner && (
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                      {hotel.owner.profileImageUrl ? (
                        <img
                          src={hotel.owner.profileImageUrl}
                          alt={hotel.owner.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {(hotel.owner.firstName?.[0] || '') +
                            (hotel.owner.lastName?.[0] || '')}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {[hotel.owner.firstName, hotel.owner.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Owner'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {hotel.owner.email || ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => navigate(`/hotels/edit/${id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {!isHotelManager && (
                      <button
                        onClick={() => handleDeleteClick(hotel)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {isHotelManager ? 'No Hotel Assigned' : 'No Hotels Yet'}
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {isHotelManager
              ? 'Contact support or admin to assign a hotel to your account.'
              : 'Start building your portfolio by adding your first property.'}
          </p>
          {!isHotelManager && (
            <button
              onClick={() => navigate('/add-hotel')}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Hotel
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && hotelToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setHotelToDelete(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Delete Hotel?
                </h3>
                <p className="text-slate-600 text-sm mb-1">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900">
                    {hotelToDelete.name || hotelToDelete.hotelName || 'this hotel'}
                  </span>
                  ?
                </p>
                <p className="text-xs text-red-500 font-medium">
                  This action cannot be undone. All rooms and data will be lost.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setHotelToDelete(null);
                  }}
                  className="flex-1 px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

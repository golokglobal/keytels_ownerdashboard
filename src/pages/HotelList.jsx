// src/pages/HotelList.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOwnerHotels, fetchHotelById, deleteHotel, clearHotelError, clearAllHotels } from '../store/slices/PartnerHotelslice';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Building2, MapPin, Sparkles, DollarSign, BedDouble, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const HotelList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loading, error } = useSelector((state) => state.partneredhotels);

  const userRole = useSelector((state) => state.user.userRole);
  const userId = useSelector((state) => state.user.userId);
  const managerHotelId = useSelector((state) => state.user.hotelId);
  const isHotelManager = useSelector((state) =>
    state.user.userRole === 'HOTELMANAGER' ||
    state.user.userRole === 'manager' ||
    state.user.userRole === 'HOTELMANAGER'
  );

  // Helper: get consistent hotel ID
  const getHotelId = (hotel) =>
    hotel?.partneredHotelId ||
    hotel?.id ||
    hotel?._id ||
    hotel?.hotelId ||
    null;

  useEffect(() => {
    const loadHotels = async () => {
      // Clear previous user's hotels before loading new ones
      dispatch(clearAllHotels());

      try {
        if (isHotelManager) {
          // Manager: fetch single hotel by ID
          if (managerHotelId) {
            console.log(`[HotelList] Manager ${userId} loading assigned hotel ID: ${managerHotelId}`);
            await dispatch(fetchHotelById(managerHotelId)).unwrap();
          } else {
            console.warn('[HotelList] Manager has no hotelId in state');
            toast.error('No hotel assigned to your account');
          }
        } else {
          // Owner: try to fetch all hotels
          console.log(`[HotelList] Owner ${userId} loading hotels`);

          try {
            await dispatch(fetchAllOwnerHotels()).unwrap();
          } catch (apiErr) {
            // Fallback: If API doesn't exist, try using hotelId from login response
            console.warn('[HotelList] fetchAllOwnerHotels failed, trying fallback with hotelId from login');

            if (managerHotelId) {
              console.log(`[HotelList] Fallback: Loading hotel ${managerHotelId} from login response`);
              await dispatch(fetchHotelById(managerHotelId)).unwrap();
              toast.info('Using hotel from your account. Backend should implement GET /api/partneredhotel/owner/hotels for multiple hotels');
            } else {
              throw apiErr; // Re-throw if no fallback available
            }
          }
        }
      } catch (err) {
        console.error('[HotelList] Load error:', err);
        const errorMessage = err.message || err.toString() || 'Failed to load hotels';

        // Check if backend endpoint doesn't exist yet
        if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          toast.error('Backend endpoint not implemented yet. Please add GET /api/partneredhotel/owner/hotels');
        } else {
          toast.error(errorMessage);
        }
      }
    };

    // Only load if user is authenticated
    if (userId) {
      loadHotels();
    }

    return () => {
      dispatch(clearHotelError());
    };
  }, [dispatch, isHotelManager, managerHotelId, userId]);

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Delete this hotel permanently? This cannot be undone.')) return;

    try {
      await dispatch(deleteHotel(hotelId)).unwrap();
      toast.success('Hotel deleted successfully');
    } catch (err) {
      console.error('[HotelList] Delete failed:', err);
      toast.error(err.message || 'Failed to delete hotel');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {isHotelManager ? 'My Hotel' : 'My Hotels'}
              </h1>
            </div>
            <p className="text-slate-600 text-lg ml-16">
              {isHotelManager
                ? 'Manage your assigned property'
                : 'Manage your partnered properties'}
            </p>
          </div>

          {!isHotelManager && (
            <button
              onClick={() => navigate('/add-hotel')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5" /> Add New Hotel
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex gap-3 items-start shadow-md">
            <div className="text-red-600 font-semibold">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading hotels...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.length > 0 ? (
              hotels.map((hotel) => {
                const id = getHotelId(hotel);
                if (!id) {
                  console.warn('[HotelList] Hotel missing ID → skipping', hotel);
                  return null;
                }

                // More flexible field extraction
                const name = hotel.hotelName || hotel.name || hotel.title || 'Unnamed Hotel';
                const city = hotel.city || hotel.location?.city || hotel.address?.city || '—';
                const country = hotel.country || hotel.location?.country || hotel.address?.country || '—';

                const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
                const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];

                const prices = rooms
                  .map((r) => Number(r.pricePerNight || r.basePrice || r.price || 0))
                  .filter((p) => p > 0);

                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                return (
                  <div
                    key={id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-300"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                      <div className="relative">
                        <h3 className="text-2xl font-bold text-white mb-1">{name}</h3>
                        <div className="flex items-center gap-2 text-indigo-100">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {city}, {country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <BedDouble className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900">Rooms</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{rooms.length}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-900">Amenities</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">{amenities.length}</p>
                        </div>
                      </div>

                      {/* Price Range */}
                      {prices.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-bold text-green-900">Price Range</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-green-600">${minPrice}</span>
                            <span className="text-slate-500">-</span>
                            <span className="text-3xl font-black text-green-600">${maxPrice}</span>
                            <span className="text-sm text-slate-600 font-medium">/ night</span>
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {amenities.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Featured Amenities
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {amenities.slice(0, 4).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs rounded-full font-semibold border border-indigo-200"
                              >
                                {typeof amenity === 'string' ? amenity : amenity?.name || '—'}
                              </span>
                            ))}
                            {amenities.length > 4 && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-semibold border border-slate-200">
                                +{amenities.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Temporary debug – remove after confirming data shows */}
                      {/* <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                        <pre>{JSON.stringify(hotel, null, 2)}</pre>
                      </div> */}
                    </div>

                    {/* Footer - Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={() => navigate(`/hotels/edit/${id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all hover:shadow-lg font-semibold group-hover:scale-105 transform duration-200"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all hover:shadow-lg font-semibold group-hover:scale-105 transform duration-200"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="bg-white rounded-3xl shadow-xl p-16 text-center border-2 border-dashed border-slate-300">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {isHotelManager ? 'No Hotel Assigned' : 'No Hotels Yet'}
                    </h3>
                    <p className="text-slate-600 mb-8 text-lg">
                      {isHotelManager
                        ? 'Contact support or admin to assign a hotel to your account.'
                        : 'Start building your portfolio by adding your first property!'}
                    </p>
                    {!isHotelManager && (
                      <button
                        onClick={() => navigate('/add-hotel')}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center gap-3 font-bold text-lg"
                      >
                        <Plus className="w-6 h-6" /> Add Your First Hotel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
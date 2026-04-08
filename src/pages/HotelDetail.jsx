import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  fetchHotelById,
  fetchRoomsByHotel,
  fetchRoomImages,
} from '../store/slices/PartnerHotelslice';
import {
  ArrowLeft, Building2, MapPin, BedDouble, Users, DollarSign,
  CheckCircle, XCircle, Percent, Image as ImageIcon, Edit,
  Star, Wifi, Car, Dumbbell, UtensilsCrossed, Sparkles, Coffee,
  Bath, Hash, Wrench, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ── helpers ── */
const getHotelId = (h) => h?.partneredHotelId || h?.id || h?._id || h?.hotelId || null;
const getRoomId  = (r) => r?.roomId || r?.id || null;

const AMENITY_ICONS = {
  wifi: Wifi, parking: Car, gym: Dumbbell, restaurant: UtensilsCrossed,
  spa: Sparkles, pool: Bath, bar: Coffee, concierge: Star,
};
const getAmenityIcon = (a) => AMENITY_ICONS[a?.toLowerCase()] || Star;

const STATUS_ROOM = {
  active:      { label: 'Active',      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: CheckCircle },
  maintenance: { label: 'Maintenance', cls: 'bg-amber-100 text-amber-700 border-amber-200',       Icon: Wrench      },
  inactive:    { label: 'Inactive',    cls: 'bg-slate-100 text-slate-500 border-slate-200',       Icon: XCircle     },
};
const normalizeRoomStatus = (isAvailable, status) => {
  if (status?.toLowerCase() === 'maintenance') return 'maintenance';
  if (isAvailable === false) return 'inactive';
  return 'active';
};

/* ── Image carousel ── */
const ImageCarousel = ({ images = [], height = 'h-52' }) => {
  const [idx, setIdx] = useState(0);
  if (!images.length)
    return (
      <div className={`w-full ${height} bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center`}>
        <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
        <span className="text-xs text-slate-400">No images</span>
      </div>
    );
  const src = images[idx]?.imageUrl || images[idx]?.url;
  return (
    <div className={`relative w-full ${height} group overflow-hidden`}>
      <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => { e.target.style.display = 'none'; }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIdx((p) => (p === 0 ? images.length - 1 : p - 1)); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIdx((p) => (p === images.length - 1 ? 0 : p + 1)); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   HOTEL DETAIL PAGE
══════════════════════════════════════════════════════════ */
export const HotelDetail = () => {
  const { hotelId } = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { hotels, roomImages } = useSelector((s) => s.partneredhotels);

  const [hotel, setHotel]           = useState(null);
  const [rooms, setRooms]           = useState([]);
  const [hotelLoading, setHotelLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);

  /* ── Load hotel ── */
  useEffect(() => {
    if (!hotelId) return;
    const cached = hotels.find((h) => getHotelId(h) === hotelId);
    if (cached) {
      setHotel(cached);
      setRooms(Array.isArray(cached.rooms) ? cached.rooms : []);
      setHotelLoading(false);
    } else {
      setHotelLoading(true);
    }
    dispatch(fetchHotelById(hotelId))
      .unwrap()
      .then((data) => {
        setHotel(data);
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
        setHotelLoading(false);
      })
      .catch(() => setHotelLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  /* ── Load rooms separately ── */
  useEffect(() => {
    if (!hotelId) return;
    setRoomsLoading(true);
    dispatch(fetchRoomsByHotel(hotelId))
      .unwrap()
      .then((res) => {
        setRooms(Array.isArray(res.rooms) ? res.rooms : []);
        setRoomsLoading(false);
      })
      .catch(() => setRoomsLoading(false));
  }, [hotelId, dispatch]);

  /* ── Load room images ── */
  useEffect(() => {
    rooms.forEach((r) => {
      const rid = getRoomId(r);
      if (rid && !roomImages[rid]) dispatch(fetchRoomImages(rid));
    });
  }, [rooms, dispatch, roomImages]);

  /* ── Loading state ── */
  if (hotelLoading && !hotel) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
          <p className="text-slate-500 text-sm">Loading hotel…</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Hotel not found.</p>
          <button onClick={() => navigate('/hotels')} className="text-sm text-slate-700 underline">Back to Hotels</button>
        </div>
      </div>
    );
  }

  const name      = hotel.name || hotel.hotelName || 'Unnamed Hotel';
  const location  = hotel.location || '—';
  const status    = hotel.status?.toUpperCase() || 'UNKNOWN';
  const isActive  = status === 'ACTIVE';
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
  const discount  = hotel.discountPercentage || 0;
  const prices    = rooms.map((r) => Number(r.pricePerNight || r.basePrice || 0)).filter((p) => p > 0);
  const minP      = prices.length ? Math.min(...prices) : 0;
  const maxP      = prices.length ? Math.max(...prices) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Back + actions ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/hotels')}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Hotels
          </button>
          <button
            onClick={() => navigate(`/hotels/edit/${hotelId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Hotel
          </button>
        </div>

        {/* ── Hotel hero card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Hotel images strip */}
          {hotel.hotelImages?.length > 0 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {hotel.hotelImages.map((img, i) => (
                <img key={i} src={img.imageUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }}
                  className="h-32 w-48 shrink-0 rounded-xl object-cover ring-1 ring-slate-100" />
              ))}
            </div>
          )}

          <div className="px-6 py-5 space-y-4">
            {/* Name + meta */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                    <Building2 className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                  {discount > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      <Percent className="w-3 h-3" />{discount}% off
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm text-slate-500">{location}</span>
                </div>
                {hotel.propertyType && (
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                    {hotel.propertyType}
                  </span>
                )}
              </div>

              {/* Status + price */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {isActive ? 'Active' : status}
                </span>
                {minP > 0 && (
                  <p className="text-sm text-slate-500">
                    <span className="font-bold text-emerald-600 text-base">${minP}</span>
                    {maxP > minP && <span> – ${maxP}</span>}
                    <span className="text-xs"> /night</span>
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {hotel.description && (
              <p className="text-sm text-slate-500 leading-relaxed">{hotel.description}</p>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((a, i) => {
                    const Icon = getAmenityIcon(typeof a === 'string' ? a : a?.name || '');
                    return (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium capitalize">
                        <Icon className="w-3 h-3 text-slate-400" />
                        {typeof a === 'string' ? a : a?.name || ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owner */}
            {hotel.owner && (
              <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
                {hotel.owner.profileImageUrl ? (
                  <img src={hotel.owner.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(hotel.owner.firstName?.[0] || '') + (hotel.owner.lastName?.[0] || '')}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {[hotel.owner.firstName, hotel.owner.lastName].filter(Boolean).join(' ') || 'Owner'}
                  </p>
                  {hotel.owner.email && <p className="text-xs text-slate-400">{hotel.owner.email}</p>}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Rooms section ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <BedDouble className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Rooms</h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{rooms.length}</span>
          </div>

          {roomsLoading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-900 border-t-transparent" />
                <p className="text-slate-500 text-sm">Loading rooms…</p>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No rooms added yet</p>
              <button
                onClick={() => navigate(`/hotels/edit/${hotelId}`)}
                className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Hotel to Add Rooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room, idx) => {
                const rid       = getRoomId(room);
                const statusKey = normalizeRoomStatus(room.isAvailable, room.status);
                const { label: sLabel, cls: sCls, Icon: SIcon } = STATUS_ROOM[statusKey] || STATUS_ROOM.active;
                const imgs      = roomImages[rid] || room.images || [];

                return (
                  <motion.div
                    key={rid || idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 220, damping: 22 }}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden">
                      <ImageCarousel images={imgs} height="h-44" />
                      <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-sm ${sCls}`}>
                        <SIcon className="w-2.5 h-2.5" /> {sLabel}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col p-4 gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm capitalize">{room.roomType}</h3>
                        {room.bedType && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                            <BedDouble className="w-3 h-3" /> {room.bedType}
                          </span>
                        )}
                        {room.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                          <Users className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-blue-700">{room.capacity}</p>
                          <p className="text-[10px] text-slate-400">Guests</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-emerald-700">${room.pricePerNight || room.basePrice || 0}</p>
                          <p className="text-[10px] text-slate-400">/night</p>
                        </div>
                        <div className="bg-violet-50 rounded-xl p-2.5 text-center">
                          <Hash className="w-3.5 h-3.5 text-violet-500 mx-auto mb-0.5" />
                          <p className="text-xs font-bold text-violet-700">{room.totalRooms || 1}</p>
                          <p className="text-[10px] text-slate-400">Units</p>
                        </div>
                      </div>

                      {/* Cancellation policy */}
                      {room.cancellationPolicy && (
                        <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[11px] text-amber-700 font-medium">{room.cancellationPolicy}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;

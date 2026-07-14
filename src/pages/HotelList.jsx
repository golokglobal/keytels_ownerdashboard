import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchRoomsByHotel, fetchRoomImages } from '../store/slices/PartnerHotelslice';
import {
  fetchHotelById,
  fetchOwnerHotels,
  deleteHotel,
  clearHotelError,
  clearAllHotels,
} from '../store/slices/PartnerHotelslice';
import { useNavigate } from 'react-router-dom';
import {
  Edit, Trash2, Plus, Building2, MapPin, BedDouble,
  CheckCircle, XCircle, Percent, Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from '../components/common/ConfirmModal';

/* ── helpers ── */
const getHotelId = (h) => h?.partneredHotelId || h?.id || h?._id || h?.hotelId || null;
const getRoomId  = (r) => r?.roomId || r?.id || null;

const inputCls =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all bg-white';

/* ── Tiny hotel thumbnail ── */
const HotelThumb = ({ hotel }) => {
  const img =
    hotel.hotelImages?.[0]?.imageUrl ||
    hotel.rooms?.find((r) => r.images?.[0])?.images?.[0]?.imageUrl ||
    null;
  return img ? (
    <img src={img} alt={hotel.name} className="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
  ) : (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
      <Building2 className="w-5 h-5 text-slate-400" />
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   HOTEL DETAIL PANEL — shown when a hotel row is expanded
══════════════════════════════════════════════════════════ */
const HotelDetailPanel = ({ hotel, isManager, onEditHotel, onDeleteHotel }) => {
  const dispatch = useDispatch();
  const { roomImages } = useSelector((s) => s.partneredhotels);
  const sliceLoading = useSelector((s) => s.partneredhotels.loading);

  const hotelId = getHotelId(hotel);
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];

  const [rooms, setRooms] = useState(Array.isArray(hotel.rooms) ? hotel.rooms : []);
  const [roomsLoading, setRoomsLoading] = useState(false);

  /* room modals */
  const EMPTY = { roomType: '', description: '', capacity: '', pricePerNight: '', isAvailable: true, totalRooms: '1' };
  const [showAdd,    setShowAdd]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editRoom,   setEditRoom]   = useState(null);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [showDel,    setShowDel]    = useState(false);
  const [roomForm,   setRoomForm]   = useState(EMPTY);
  const [formErr,    setFormErr]    = useState('');

  const refresh = async () => {
    setRoomsLoading(true);
    try {
      const res = await dispatch(fetchRoomsByHotel(hotelId)).unwrap();
      setRooms(Array.isArray(res.rooms) ? res.rooms : []);
    } catch { /* silent */ }
    finally { setRoomsLoading(false); }
  };

  /* load images for all rooms */
  useEffect(() => {
    rooms.forEach((r) => {
      const rid = getRoomId(r);
      if (rid && !roomImages[rid]) dispatch(fetchRoomImages(rid));
    });
  }, [rooms, dispatch, roomImages]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomType || !roomForm.capacity || !roomForm.pricePerNight) {
      setFormErr('Room type, capacity and price are required.'); return;
    }
    try {
      await dispatch(createHotelRoom({
        hotelId,
        data: {
          roomType: roomForm.roomType,
          description: roomForm.description || '',
          capacity: Number(roomForm.capacity),
          pricePerNight: Number(roomForm.pricePerNight),
          isAvailable: roomForm.isAvailable,
          totalRooms: Number(roomForm.totalRooms) || 1,
        },
      })).unwrap();
      toast.success('Room added!');
      setShowAdd(false); setRoomForm(EMPTY); setFormErr('');
      await refresh();
    } catch (err) { toast.error(err?.message || 'Failed to add room'); }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const rid = getRoomId(editRoom);
    if (!rid) { toast.error('Invalid room ID'); return; }
    try {
      await dispatch(updateHotelRoom({
        roomId: rid,
        data: {
          roomType: editRoom.roomType,
          description: editRoom.description || '',
          capacity: Number(editRoom.capacity),
          pricePerNight: Number(editRoom.pricePerNight || editRoom.basePrice),
          isAvailable: editRoom.isAvailable ?? true,
          totalRooms: Number(editRoom.totalRooms) || 1,
          status: editRoom.status || 'ACTIVE',
        },
      })).unwrap();
      toast.success('Room updated!');
      setShowEdit(false); setEditRoom(null);
      await refresh();
    } catch (err) { toast.error(err?.message || 'Failed to update room'); }
  };

  const handleDeleteRoom = async () => {
    const rid = getRoomId(deleteRoom);
    if (!rid) return;
    try {
      await dispatch(deleteHotelRoom(rid)).unwrap();
      toast.success('Room deactivated!');
      setShowDel(false); setDeleteRoom(null);
      await refresh();
    } catch (err) { toast.error(err?.message || 'Failed to deactivate room'); }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/60">
      {/* ── Hotel info strip ── */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Hotel images strip */}
          {(hotel.hotelImages?.length > 0) && (
            <div className="flex gap-2 shrink-0">
              {hotel.hotelImages.slice(0, 3).map((img, i) => (
                <img key={i} src={img.imageUrl} alt="" className="w-20 h-16 rounded-xl object-cover ring-1 ring-slate-200" onError={(e)=>{e.target.style.display='none';}} />
              ))}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-3">
            {hotel.description && (
              <p className="text-sm text-slate-500 leading-relaxed">{hotel.description}</p>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((a, i) => {
                  const Icon = getAmenityIcon(typeof a === 'string' ? a : a?.name || '');
                  return (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-medium capitalize">
                      <Icon className="w-3 h-3 text-slate-400" />
                      {typeof a === 'string' ? a : a?.name || ''}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Owner info */}
            {hotel.owner && (
              <div className="flex items-center gap-2.5 pt-1">
                {hotel.owner.profileImageUrl ? (
                  <img src={hotel.owner.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" onError={(e)=>{e.target.style.display='none';}} />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(hotel.owner.firstName?.[0] || '') + (hotel.owner.lastName?.[0] || '')}
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-slate-700">
                    {[hotel.owner.firstName, hotel.owner.lastName].filter(Boolean).join(' ') || 'Owner'}
                  </span>
                  {hotel.owner.email && (
                    <span className="text-xs text-slate-400 ml-1.5">· {hotel.owner.email}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hotel action buttons */}
          {!isManager && (
            <div className="flex gap-2 shrink-0">
              <button onClick={onEditHotel}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                <Edit className="w-3.5 h-3.5" /> Edit Hotel
              </button>
              <button onClick={onDeleteHotel}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Rooms section ── */}
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-slate-500" /> Rooms
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {rooms.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={roomsLoading}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${roomsLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setRoomForm(EMPTY); setFormErr(''); setShowAdd(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Room
            </button>
          </div>
        </div>

        {/* Rooms loading */}
        {roomsLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-7 w-7 border-4 border-slate-900 border-t-transparent" />
          </div>
        )}

        {/* Room cards grid */}
        {!roomsLoading && rooms.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium mb-4">No rooms added yet</p>
            <button
              onClick={() => { setRoomForm(EMPTY); setFormErr(''); setShowAdd(true); }}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Add First Room
            </button>
          </div>
        )}

        {!roomsLoading && rooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room, idx) => {
              const rid = getRoomId(room);
              const statusKey = normalizeRoomStatus(room.isAvailable, room.status);
              const { label: sLabel, cls: sCls, Icon: SIcon } = STATUS_ROOM[statusKey] || STATUS_ROOM.active;
              const imgs = roomImages[rid] || room.images || [];

              return (
                <motion.div
                  key={rid || idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, type: 'spring', stiffness: 220, damping: 22 }}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <RoomThumb images={imgs} />
                    <span className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sCls}`}>
                      <SIcon className="w-2.5 h-2.5" /> {sLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col p-4 gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm capitalize leading-tight">{room.roomType}</h4>
                      {room.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{room.description}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <Users className="w-3 h-3 text-blue-500 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-blue-700">{room.capacity}</p>
                        <p className="text-[10px] text-slate-400">Guests</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2 text-center">
                        <DollarSign className="w-3 h-3 text-emerald-500 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-emerald-700">${room.pricePerNight || room.basePrice || 0}</p>
                        <p className="text-[10px] text-slate-400">/night</p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-2 text-center">
                        <Hash className="w-3 h-3 text-violet-500 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-violet-700">{room.totalRooms || 1}</p>
                        <p className="text-[10px] text-slate-400">Units</p>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => { setEditRoom({ ...room }); setShowEdit(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => { setDeleteRoom(room); setShowDel(true); }}
                        className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Room Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <Modal title="Add New Room" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAddRoom} className="space-y-4">
              {formErr && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formErr}</p>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Type *">
                  <input value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}
                    placeholder="e.g. Deluxe Queen" className={inputCls} required />
                </Field>
                <Field label="Total Units">
                  <input type="number" min="1" value={roomForm.totalRooms}
                    onChange={(e) => setRoomForm((p) => ({ ...p, totalRooms: e.target.value }))}
                    placeholder="1" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity *">
                  <input type="number" min="1" value={roomForm.capacity}
                    onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))}
                    placeholder="2" className={inputCls} required />
                </Field>
                <Field label="Price / Night *">
                  <input type="number" min="0" step="0.01" value={roomForm.pricePerNight}
                    onChange={(e) => setRoomForm((p) => ({ ...p, pricePerNight: e.target.value }))}
                    placeholder="180.00" className={inputCls} required />
                </Field>
              </div>
              <Field label="Description">
                <textarea value={roomForm.description}
                  onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Spacious room with garden view..." rows="2" className={`${inputCls} resize-none`} />
              </Field>
              <Field label="Availability">
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button"
                      onClick={() => setRoomForm((p) => ({ ...p, isAvailable: val }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        roomForm.isAvailable === val
                          ? val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}>
                      {val ? 'Available' : 'Unavailable'}
                    </button>
                  ))}
                </div>
              </Field>
              <ModalFooter onCancel={() => setShowAdd(false)} label="Add Room" loading={sliceLoading} />
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Edit Room Modal ── */}
      <AnimatePresence>
        {showEdit && editRoom && (
          <Modal title="Edit Room" onClose={() => { setShowEdit(false); setEditRoom(null); }}>
            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Type *">
                  <input value={editRoom.roomType || ''} onChange={(e) => setEditRoom((p) => ({ ...p, roomType: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Total Units">
                  <input type="number" min="1" value={editRoom.totalRooms || 1}
                    onChange={(e) => setEditRoom((p) => ({ ...p, totalRooms: e.target.value }))}
                    className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity *">
                  <input type="number" min="1" value={editRoom.capacity || ''}
                    onChange={(e) => setEditRoom((p) => ({ ...p, capacity: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Price / Night *">
                  <input type="number" min="0" step="0.01"
                    value={editRoom.pricePerNight || editRoom.basePrice || ''}
                    onChange={(e) => setEditRoom((p) => ({ ...p, pricePerNight: e.target.value }))}
                    className={inputCls} required />
                </Field>
              </div>
              <Field label="Description">
                <textarea value={editRoom.description || ''}
                  onChange={(e) => setEditRoom((p) => ({ ...p, description: e.target.value }))}
                  rows="2" className={`${inputCls} resize-none`} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={editRoom.status || 'ACTIVE'}
                    onChange={(e) => setEditRoom((p) => ({ ...p, status: e.target.value }))}
                    className={inputCls}>
                    <option value="ACTIVE">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </Field>
                <Field label="Availability">
                  <select value={String(editRoom.isAvailable ?? true)}
                    onChange={(e) => setEditRoom((p) => ({ ...p, isAvailable: e.target.value === 'true' }))}
                    className={inputCls}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </Field>
              </div>
              <ModalFooter onCancel={() => { setShowEdit(false); setEditRoom(null); }} label="Save Changes" loading={sliceLoading} />
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Confirm Deactivate Room ── */}
      <ConfirmModal
        isOpen={showDel}
        title="Deactivate Room"
        message={`Deactivate "${deleteRoom?.roomType}"? It will be hidden from guests.`}
        confirmLabel="Deactivate"
        loading={sliceLoading}
        onConfirm={handleDeleteRoom}
        onCancel={() => { setShowDel(false); setDeleteRoom(null); }}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export const HotelList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels, loading, error } = useSelector((s) => s.partneredhotels);

  const userId         = useSelector((s) => s.user.userId);
  const managerHotelId = useSelector((s) => s.user.hotelId);
  const userRole       = useSelector((s) => s.user.userRole);
  const isHotelOwner   = userRole === 'HOTEL_OWNER';
  const isHotelManager = ['HOTEL_MANAGER', 'HOTELMANAGER', 'manager'].includes(userRole);

  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      dispatch(clearAllHotels());
      try {
        if (isHotelOwner) {
          await dispatch(fetchOwnerHotels()).unwrap();
        } else if (managerHotelId) {
          await dispatch(fetchHotelById(managerHotelId)).unwrap();
        } else {
          toast.error('No hotel assigned to your account');
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to load hotels');
      }
    };
    if (userId) load();
    return () => { dispatch(clearHotelError()); };
  }, [dispatch, isHotelOwner, isHotelManager, managerHotelId, userId]);

  const handleDeleteConfirm = async () => {
    const id = getHotelId(deleteTarget);
    if (!id) return;
    try {
      await dispatch(deleteHotel(id)).unwrap();
      toast.success('Hotel deactivated successfully');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to deactivate hotel');
    }
  };

  const totalHotels  = hotels.length;
  const totalRooms   = hotels.reduce((s, h) => s + (h.rooms?.length || 0), 0);
  const activeHotels = hotels.filter((h) => h.status?.toUpperCase() === 'ACTIVE').length;

  /* ── Group hotels by propertyType ── */
  const grouped = hotels.reduce((acc, hotel) => {
    const key = hotel.propertyType || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(hotel);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort();

  /* ── Single hotel row ── */
  const HotelRow = ({ hotel, index }) => {
    const id       = getHotelId(hotel);
    if (!id) return null;
    const name     = hotel.name || hotel.hotelName || 'Unnamed Hotel';
    const location = hotel.location || '—';
    const rooms    = Array.isArray(hotel.rooms) ? hotel.rooms : [];
    const status   = hotel.status?.toUpperCase() || 'UNKNOWN';
    const isActive = status === 'ACTIVE';
    const discount = hotel.discountPercentage || 0;
    const prices   = rooms.map((r) => Number(r.pricePerNight || r.basePrice || 0)).filter((p) => p > 0);
    const minP     = prices.length ? Math.min(...prices) : 0;

    return (
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        onClick={() => navigate(`/hotels/${id}`)}
        className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[48px_1fr_140px_100px_80px_120px] gap-3 sm:gap-4 items-center px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0"
      >
        {/* Thumbnail */}
        <HotelThumb hotel={hotel} />

        {/* Name */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm truncate">{name}</h3>
            {discount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                <Percent className="w-2.5 h-2.5" />{discount}% off
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate sm:hidden">{location}</p>
          {minP > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              From <span className="font-semibold text-emerald-600">${minP}</span>/night
            </p>
          )}
          {hotel.createdAt && (
            <p className="text-[10px] text-slate-300 mt-0.5">
              Listed {new Date(hotel.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="hidden sm:flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate text-xs text-slate-500">{location}</span>
        </div>

        {/* Rooms count */}
        <div className="hidden sm:flex items-center gap-1.5">
          <BedDouble className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-xs text-slate-700">{rooms.length}</span>
          <span className="text-slate-400 text-xs">room{rooms.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Status */}
        <div className="hidden sm:block">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isActive ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
            {isActive ? 'Active' : status}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/hotels/edit/${id}`); }}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Edit className="w-3 h-3" /> Edit
          </button>
          {!isHotelManager && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(hotel); setShowDeleteModal(true); }}
              className="hidden sm:flex items-center justify-center p-1.5 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isHotelManager ? 'My Hotel' : 'Hotels'}
              </h1>
              <p className="text-slate-500 text-sm">
                {isHotelManager ? 'Manage your assigned property' : 'Manage your properties'}
              </p>
            </div>
          </div>
          {!isHotelManager && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/add-hotel')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> Add Hotel
            </motion.button>
          )}
        </div>

        {/* ── Stats ── */}
        {hotels.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Hotels', value: totalHotels,  Icon: Building2,  color: 'text-slate-700',    bg: 'bg-slate-100'  },
              { label: 'Total Rooms',  value: totalRooms,   Icon: BedDouble,  color: 'text-blue-600',     bg: 'bg-blue-50'    },
              { label: 'Active',       value: activeHotels, Icon: CheckCircle,color: 'text-emerald-600',  bg: 'bg-emerald-50' },
            ].map(({ label, value, Icon, color, bg }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>
        )}

        {/* ── Loading ── */}
        {loading && hotels.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
              <p className="text-slate-500 text-sm font-medium">Loading hotels…</p>
            </div>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && hotels.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
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
              <button onClick={() => navigate('/add-hotel')}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-sm text-sm">
                <Plus className="w-4 h-4" /> Add Your First Hotel
              </button>
            )}
          </motion.div>
        )}

        {/* ── Hotels grouped by property type ── */}
        {!loading && hotels.length > 0 && (
          <div className="space-y-8">
            {groupKeys.map((type) => (
              <div key={type}>
                {/* Group heading */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{type}</h2>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {grouped[type].length}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-[48px_1fr_140px_100px_80px_120px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
                    <div />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hotel</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rooms</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</span>
                  </div>
                  {grouped[type].map((hotel, i) => (
                    <HotelRow key={getHotelId(hotel)} hotel={hotel} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirm Deactivate Hotel ── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Deactivate Hotel"
        message={`Deactivate "${deleteTarget?.name || deleteTarget?.hotelName || 'this hotel'}"? It will be hidden from guests.`}
        confirmLabel="Deactivate"
        loading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />
    </div>
  );
};

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchOwnerHotels,
  fetchRoomsByHotel,
  createHotelRoom,
  updateHotelRoom,
  deleteHotelRoom,
  fetchRoomImages,
  deleteRoomImage,
} from "../store/slices/PartnerHotelslice";
import {
  BedDouble,
  Edit,
  Trash2,
  X,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Image as ImageIcon,
  Wrench,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Hash,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/common/ConfirmModal";

/* ── Shared input class ── */
const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all bg-white";

/* ── Status helpers ── */
const normalizeStatus = (isAvailable, status) => {
  if (status?.toLowerCase() === "maintenance") return "maintenance";
  if (isAvailable === false) return "inactive";
  return "active";
};

const STATUS_CONFIG = {
  active:      { label: "Active",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle },
  maintenance: { label: "Maintenance", cls: "bg-amber-100 text-amber-700 border-amber-200",       Icon: Wrench      },
  inactive:    { label: "Inactive",    cls: "bg-slate-100 text-slate-500 border-slate-200",       Icon: XCircle     },
};

/* ── Room image carousel ── */
const RoomImageCarousel = ({ images = [] }) => {
  const [idx, setIdx] = useState(0);
  if (!images.length)
    return (
      <div className="w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
        <ImageIcon className="w-8 h-8 text-slate-300 mb-1.5" />
        <span className="text-xs text-slate-400">No images</span>
      </div>
    );
  return (
    <div className="relative w-full h-44 group overflow-hidden">
      <img
        src={images[idx]?.imageUrl || images[idx]?.url}
        alt="Room"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
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
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Empty blank field ── */
const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

/* ══════════════════════ MAIN COMPONENT ══════════════════════ */
export const RoomsManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { hotels: ownerHotels, roomImages, loading } = useSelector(
    (state) => state.partneredhotels
  );

  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  /* modals */
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom]     = useState(null);
  const [roomToDelete, setRoomToDelete]   = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal]   = useState(false);
  const [selectedRoomForImages, setSelectedRoomForImages] = useState(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState({ open: false, imageId: null });

  /* room form */
  const EMPTY_ROOM = { roomType: "", description: "", capacity: "", pricePerNight: "", isAvailable: true, totalRooms: "1" };
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [formError, setFormError] = useState("");

  /* ── Load owner hotels on mount ── */
  useEffect(() => {
    dispatch(fetchOwnerHotels());
  }, [dispatch]);

  /* ── Auto-select first hotel ── */
  useEffect(() => {
    if (ownerHotels.length > 0 && !selectedHotelId) {
      const firstId = ownerHotels[0].partneredHotelId || ownerHotels[0].id;
      setSelectedHotelId(firstId);
    }
  }, [ownerHotels, selectedHotelId]);

  /* ── Fetch rooms when hotel selected ── */
  useEffect(() => {
    if (!selectedHotelId) { setRooms([]); return; }
    const load = async () => {
      setRoomsLoading(true);
      try {
        const result = await dispatch(fetchRoomsByHotel(selectedHotelId)).unwrap();
        setRooms(Array.isArray(result.rooms) ? result.rooms : []);
      } catch {
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };
    load();
  }, [selectedHotelId, dispatch]);

  const refreshRooms = async () => {
    if (!selectedHotelId) return;
    setRoomsLoading(true);
    try {
      const result = await dispatch(fetchRoomsByHotel(selectedHotelId)).unwrap();
      setRooms(Array.isArray(result.rooms) ? result.rooms : []);
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  /* ── Add Room ── */
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomType || !roomForm.capacity || !roomForm.pricePerNight) {
      setFormError("Room type, capacity and price are required.");
      return;
    }
    try {
      await dispatch(createHotelRoom({
        hotelId: selectedHotelId,
        data: {
          roomType: roomForm.roomType,
          description: roomForm.description || "",
          capacity: Number(roomForm.capacity),
          pricePerNight: Number(roomForm.pricePerNight),
          isAvailable: roomForm.isAvailable,
          totalRooms: Number(roomForm.totalRooms) || 1,
        },
      })).unwrap();
      toast.success("Room added successfully!");
      setShowAddModal(false);
      setRoomForm(EMPTY_ROOM);
      setFormError("");
      await refreshRooms();
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Failed to add room");
    }
  };

  /* ── Update Room ── */
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const roomId = editingRoom?.roomId || editingRoom?.id;
    if (!roomId) { toast.error("Invalid room ID"); return; }
    try {
      await dispatch(updateHotelRoom({
        roomId,
        data: {
          roomType: editingRoom.roomType,
          description: editingRoom.description || "",
          capacity: Number(editingRoom.capacity),
          pricePerNight: Number(editingRoom.pricePerNight || editingRoom.basePrice),
          isAvailable: editingRoom.isAvailable ?? true,
          totalRooms: Number(editingRoom.totalRooms) || 1,
          status: editingRoom.status || "ACTIVE",
        },
      })).unwrap();
      toast.success("Room updated successfully!");
      setShowEditModal(false);
      setEditingRoom(null);
      await refreshRooms();
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Failed to update room");
    }
  };

  /* ── Deactivate Room ── */
  const handleDeleteRoom = async () => {
    const roomId = roomToDelete?.roomId || roomToDelete?.id;
    if (!roomId) return;
    try {
      await dispatch(deleteHotelRoom(roomId)).unwrap();
      toast.success("Room deactivated successfully!");
      setShowDeleteModal(false);
      setRoomToDelete(null);
      await refreshRooms();
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Failed to deactivate room");
    }
  };

  /* ── Room Images ── */
  const handleOpenImageModal = async (room) => {
    setSelectedRoomForImages(room);
    setShowImageModal(true);
    try {
      await dispatch(fetchRoomImages(room.roomId || room.id)).unwrap();
    } catch { /* 204 returns [] already */ }
  };

  const handleDeleteImage = (imageId) => setConfirmDeleteImage({ open: true, imageId });

  const confirmImageDelete = async () => {
    const { imageId } = confirmDeleteImage;
    const roomId = selectedRoomForImages?.roomId || selectedRoomForImages?.id;
    setConfirmDeleteImage({ open: false, imageId: null });
    try {
      await dispatch(deleteRoomImage({ imageId, roomId })).unwrap();
      toast.success("Image removed!");
    } catch (err) {
      toast.error(err?.message || "Image not found");
    }
  };

  /* ── Stats ── */
  const totalRooms       = rooms.reduce((s, r) => s + (r.totalRooms || 1), 0);
  const availableRooms   = rooms.filter((r) => r.isAvailable !== false).length;
  const maintenanceRooms = rooms.filter((r) => r.status?.toLowerCase() === "maintenance").length;

  const currentImages = selectedRoomForImages
    ? roomImages[selectedRoomForImages.roomId || selectedRoomForImages.id] || []
    : [];

  /* ════════════════════════════════════════ RENDER ════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rooms</h1>
              <p className="text-slate-500 text-sm">Manage rooms across your properties</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshRooms}
              disabled={!selectedHotelId || roomsLoading}
              className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${roomsLoading ? "animate-spin" : ""}`} />
            </button>
            {selectedHotelId ? (
              <button
                onClick={() => { setRoomForm(EMPTY_ROOM); setFormError(""); setShowAddModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            ) : (
              <button
                onClick={() => navigate("/add-hotel")}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors"
              >
                <Building2 className="w-4 h-4" /> Add Hotel
              </button>
            )}
          </div>
        </div>

        {/* ── Hotel Selector ── */}
        {ownerHotels.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 className="w-4 h-4 text-slate-500" /> Select Hotel
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ownerHotels.map((hotel) => {
                const hid = hotel.partneredHotelId || hotel.id;
                const selected = hid === selectedHotelId;
                return (
                  <button
                    key={hid}
                    type="button"
                    onClick={() => setSelectedHotelId(hid)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <p className={`font-semibold text-sm truncate ${selected ? "text-white" : "text-slate-900"}`}>
                      {hotel.name}
                    </p>
                    <p className={`text-xs mt-1 truncate ${selected ? "text-slate-300" : "text-slate-500"}`}>
                      {hotel.location || "No location"}
                    </p>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      hotel.status === "ACTIVE"
                        ? selected ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-100 text-emerald-700"
                        : selected ? "bg-white/20 text-white/70" : "bg-slate-200 text-slate-500"
                    }`}>
                      {hotel.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {hotel.status}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        {selectedHotelId && rooms.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Rooms",  value: totalRooms,       color: "text-slate-900",   bg: "bg-slate-100"   },
              { label: "Available",    value: availableRooms,   color: "text-emerald-700", bg: "bg-emerald-100" },
              { label: "Maintenance",  value: maintenanceRooms, color: "text-amber-700",   bg: "bg-amber-100"   },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Empty / Loading / Grid ── */}
        {!selectedHotelId ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BedDouble className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Select a Hotel</h3>
            <p className="text-slate-500 text-sm">Choose a hotel above to manage its rooms.</p>
          </div>
        ) : roomsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
              <p className="text-slate-500 text-sm">Loading rooms…</p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BedDouble className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Rooms Yet</h3>
            <p className="text-slate-500 text-sm mb-6">Add your first room to get started.</p>
            <button
              onClick={() => { setRoomForm(EMPTY_ROOM); setFormError(""); setShowAddModal(true); }}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {rooms.map((room, index) => {
              const rid = room.roomId || room.id;
              const statusKey = normalizeStatus(room.isAvailable, room.status);
              const { label, cls, Icon: StatusIcon } = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;
              const imgs = roomImages[rid] || room.images || [];

              return (
                <motion.div
                  key={rid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Image */}
                  <div className="relative">
                    <RoomImageCarousel images={imgs} />
                    <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${cls}`}>
                      <StatusIcon className="w-3 h-3" /> {label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5 gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg capitalize">{room.roomType}</h3>
                      {room.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{room.description}</p>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-blue-700">{room.capacity}</p>
                        <p className="text-xs text-slate-500">Guests</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <DollarSign className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-emerald-700">${room.pricePerNight}</p>
                        <p className="text-xs text-slate-500">/ night</p>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3 text-center">
                        <Hash className="w-4 h-4 text-violet-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-violet-700">{room.totalRooms || 1}</p>
                        <p className="text-xs text-slate-500">Units</p>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenImageModal(room)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Images {imgs.length > 0 && `(${imgs.length})`}
                      </button>
                      <button
                        onClick={() => { setEditingRoom({ ...room }); setShowEditModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setRoomToDelete(room); setShowDeleteModal(true); }}
                        className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════ ADD ROOM MODAL ══════════════════ */}
      <AnimatePresence>
        {showAddModal && (
          <Modal title="Add New Room" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddRoom} className="space-y-4">
              {formError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Type *">
                  <input value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}
                    placeholder="e.g. Deluxe Queen" className={inputCls} required />
                </Field>
                <Field label="Total Units">
                  <input type="number" min="1" value={roomForm.totalRooms}
                    onChange={(e) => setRoomForm((p) => ({ ...p, totalRooms: e.target.value }))}
                    placeholder="e.g. 3" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity (guests) *">
                  <input type="number" min="1" value={roomForm.capacity}
                    onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))}
                    placeholder="e.g. 2" className={inputCls} required />
                </Field>
                <Field label="Price / Night *">
                  <input type="number" min="0" step="0.01" value={roomForm.pricePerNight}
                    onChange={(e) => setRoomForm((p) => ({ ...p, pricePerNight: e.target.value }))}
                    placeholder="e.g. 180.00" className={inputCls} required />
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
                          ? val ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-700 text-white border-slate-700"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}>
                      {val ? "Available" : "Unavailable"}
                    </button>
                  ))}
                </div>
              </Field>
              <ModalFooter onCancel={() => setShowAddModal(false)} label="Add Room" loading={loading} />
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══════════════════ EDIT ROOM MODAL ══════════════════ */}
      <AnimatePresence>
        {showEditModal && editingRoom && (
          <Modal title="Edit Room" onClose={() => { setShowEditModal(false); setEditingRoom(null); }}>
            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Type *">
                  <input value={editingRoom.roomType || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, roomType: e.target.value }))}
                    placeholder="e.g. Deluxe Queen" className={inputCls} required />
                </Field>
                <Field label="Total Units">
                  <input type="number" min="1" value={editingRoom.totalRooms || 1}
                    onChange={(e) => setEditingRoom((p) => ({ ...p, totalRooms: e.target.value }))}
                    className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity *">
                  <input type="number" min="1" value={editingRoom.capacity || ""}
                    onChange={(e) => setEditingRoom((p) => ({ ...p, capacity: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Price / Night *">
                  <input type="number" min="0" step="0.01"
                    value={editingRoom.pricePerNight || editingRoom.basePrice || ""}
                    onChange={(e) => setEditingRoom((p) => ({ ...p, pricePerNight: e.target.value }))}
                    className={inputCls} required />
                </Field>
              </div>
              <Field label="Description">
                <textarea value={editingRoom.description || ""}
                  onChange={(e) => setEditingRoom((p) => ({ ...p, description: e.target.value }))}
                  rows="2" className={`${inputCls} resize-none`} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={editingRoom.status || "ACTIVE"}
                    onChange={(e) => setEditingRoom((p) => ({ ...p, status: e.target.value }))}
                    className={inputCls}>
                    <option value="ACTIVE">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </Field>
                <Field label="Availability">
                  <select value={String(editingRoom.isAvailable ?? true)}
                    onChange={(e) => setEditingRoom((p) => ({ ...p, isAvailable: e.target.value === "true" }))}
                    className={inputCls}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </Field>
              </div>
              <ModalFooter onCancel={() => { setShowEditModal(false); setEditingRoom(null); }} label="Save Changes" loading={loading} />
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ══════════════════ IMAGES MODAL ══════════════════ */}
      <AnimatePresence>
        {showImageModal && selectedRoomForImages && (
          <Modal title={`Images — ${selectedRoomForImages.roomType}`}
            onClose={() => { setShowImageModal(false); setSelectedRoomForImages(null); }}>
            <div className="space-y-4">
              {currentImages.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No images for this room yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {currentImages.map((img) => {
                    const imgId = img.imageId || img.id;
                    return (
                      <div key={imgId} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                        <img src={img.imageUrl || img.url} alt="Room" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imgId)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-slate-400 text-center">
                To add images, use the room edit form or upload via your hotel management system.
              </p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Confirm Deactivate ── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Deactivate Room"
        message={`Deactivate "${roomToDelete?.roomType}"? It will be hidden from guests.`}
        confirmLabel="Deactivate"
        loading={loading}
        onConfirm={handleDeleteRoom}
        onCancel={() => { setShowDeleteModal(false); setRoomToDelete(null); }}
      />

      {/* ── Confirm Delete Image ── */}
      <ConfirmModal
        isOpen={confirmDeleteImage.open}
        title="Remove Image"
        message="Remove this image from the room?"
        confirmLabel="Remove"
        onConfirm={confirmImageDelete}
        onCancel={() => setConfirmDeleteImage({ open: false, imageId: null })}
      />
    </div>
  );
};

/* ── Shared modal wrapper ── */
const Modal = ({ title, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button type="button" onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </motion.div>
);

/* ── Modal footer ── */
const ModalFooter = ({ onCancel, label, loading }) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel}
      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
      Cancel
    </button>
    <button type="submit" disabled={loading}
      className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
      {loading
        ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Saving…</>
        : label}
    </button>
  </div>
);

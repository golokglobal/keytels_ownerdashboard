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
  uploadRoomImage,
} from "../store/slices/PartnerHotelslice";
import { fetchRoomTypes, fetchBedTypes, selectRoomTypes, selectBedTypes } from "../store/slices/catalogSlice";
import {
  BedDouble, Edit, Trash2, X, Building2, Users,
  CheckCircle, XCircle, Plus, Image as ImageIcon, Wrench,
  ChevronLeft, ChevronRight, DollarSign, Hash, RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { selectPrimaryHotelId } from "../store/slices/userSlice";
import { S3ImageUpload } from "../components/shared/S3ImageUpload";

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

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════
   ROOM PANEL — expanded content for one hotel row
══════════════════════════════════════════════════════════ */
const RoomPanel = ({ hotel }) => {
  const dispatch = useDispatch();
  const { roomImages, loading: sliceLoading } = useSelector((s) => s.partneredhotels);
  const roomTypes = useSelector(selectRoomTypes);
  const bedTypes = useSelector(selectBedTypes);

  const hotelId = hotel?.partneredHotelId || hotel?.id;

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  /* modals */
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [showDel, setShowDel] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [showImages, setShowImages] = useState(false);
  const [imageRoom, setImageRoom] = useState(null);
  const [confirmDelImg, setConfirmDelImg] = useState({ open: false, imageId: null });

  const EMPTY = { roomType: "", bedType: "", description: "", capacity: "", pricePerNight: "", totalRooms: "1", isAvailable: true, cancellationPolicy: "" };
  const [roomForm, setRoomForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchRoomTypes());
    dispatch(fetchBedTypes());
  }, [dispatch]);

  const refresh = async () => {
    if (!hotelId) return;
    setRoomsLoading(true);
    try {
      const result = await dispatch(fetchRoomsByHotel(hotelId)).unwrap();
      setRooms(Array.isArray(result.rooms) ? result.rooms : []);
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched) return;
    setHasFetched(true);
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Add Room ── */
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomType || !roomForm.bedType || !roomForm.capacity || !roomForm.pricePerNight || !roomForm.totalRooms) {
      setFormError("Room type, bed type, capacity, price and total units are required.");
      return;
    }
    try {
      await dispatch(createHotelRoom({
        hotelId,
        data: {
          roomType: roomForm.roomType,
          bedType: roomForm.bedType,
          description: roomForm.description || "",
          capacity: Number(roomForm.capacity),
          totalRooms: Number(roomForm.totalRooms) || 1,
          pricePerNight: Number(roomForm.pricePerNight),
          isAvailable: roomForm.isAvailable,
          cancellationPolicy: roomForm.cancellationPolicy || "",
        },
      })).unwrap();
      toast.success("Room added!");
      setShowAdd(false);
      setRoomForm(EMPTY);
      setFormError("");
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to add room");
    }
  };

  /* ── Edit Room ── */
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const rid = editRoom?.roomId || editRoom?.id;
    if (!rid) { toast.error("Invalid room ID"); return; }
    try {
      await dispatch(updateHotelRoom({
        roomId: rid,
        data: {
          roomType: editRoom.roomType,
          bedType: editRoom.bedType || "",
          description: editRoom.description || "",
          capacity: Number(editRoom.capacity),
          totalRooms: Number(editRoom.totalRooms) || 1,
          pricePerNight: Number(editRoom.pricePerNight || editRoom.basePrice),
          isAvailable: editRoom.isAvailable ?? true,
          status: editRoom.status || "ACTIVE",
          cancellationPolicy: editRoom.cancellationPolicy || "",
        },
      })).unwrap();
      toast.success("Room updated!");
      setShowEdit(false);
      setEditRoom(null);
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to update room");
    }
  };

  /* ── Delete Room ── */
  const handleDeleteRoom = async () => {
    const rid = deleteRoom?.roomId || deleteRoom?.id;
    if (!rid) return;
    try {
      await dispatch(deleteHotelRoom(rid)).unwrap();
      toast.success("Room deactivated!");
      setShowDel(false);
      setDeleteRoom(null);
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate room");
    }
  };

  /* ── Images ── */
  const handleOpenImages = async (room) => {
    setImageRoom(room);
    setShowImages(true);
    try { await dispatch(fetchRoomImages(room.roomId || room.id)).unwrap(); }
    catch { /* noop */ }
  };

  const confirmImgDelete = async () => {
    const { imageId } = confirmDelImg;
    const rid = imageRoom?.roomId || imageRoom?.id;
    setConfirmDelImg({ open: false, imageId: null });
    try {
      await dispatch(deleteRoomImage({ imageId, roomId: rid })).unwrap();
      toast.success("Image removed!");
    } catch (err) {
      toast.error(err?.message || "Image not found");
    }
  };

  const currentImages = imageRoom ? roomImages[imageRoom.roomId || imageRoom.id] || [] : [];
  const totalRooms = rooms.reduce((s, r) => s + (r.totalRooms || 1), 0);
  const availableRooms = rooms.filter((r) => r.isAvailable !== false).length;
  const maintenanceRooms = rooms.filter((r) => r.status?.toLowerCase() === "maintenance").length;

  return (
    <div className="border-t border-slate-100 bg-slate-50/60">
      {/* Header row */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Stats pills */}
          {rooms.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                <Hash className="w-3 h-3" /> {totalRooms} room{totalRooms !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-3 h-3" /> {availableRooms} available
              </span>
              {maintenanceRooms > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  <Wrench className="w-3 h-3" /> {maintenanceRooms} maintenance
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={roomsLoading}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${roomsLoading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => { setRoomForm(EMPTY); setFormError(""); setShowAdd(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium text-xs hover:bg-slate-800 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Room
          </button>
        </div>
      </div>

      {/* Room cards */}
      <div className="p-6">
        {roomsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-900 border-t-transparent" />
              <p className="text-slate-500 text-sm">Loading rooms…</p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BedDouble className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium mb-4">No rooms yet for this hotel.</p>
            <button onClick={() => { setRoomForm(EMPTY); setFormError(""); setShowAdd(true); }}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
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
                <motion.div key={rid}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, type: "spring", stiffness: 200, damping: 22 }}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
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
                      <h3 className="font-bold text-slate-900 text-base capitalize">{room.roomType}</h3>
                      {room.bedType && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                          <BedDouble className="w-3 h-3" /> {room.bedType}
                        </span>
                      )}
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
                        <p className="text-sm font-bold text-emerald-700">${room.pricePerNight || room.basePrice}</p>
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
                      <button onClick={() => handleOpenImages(room)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Images {imgs.length > 0 && `(${imgs.length})`}
                      </button>
                      <button onClick={() => { setEditRoom({ ...room }); setShowEdit(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => { setDeleteRoom(room); setShowDel(true); }}
                        className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
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

      {/* ── Add Room Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <Modal title="Add New Room" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAddRoom} className="space-y-4">
              {formError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Type *">
                  {roomTypes.length > 0 ? (
                    <select value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}
                      className={inputCls} required>
                      <option value="">Select room type</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.name}>{rt.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}
                      placeholder="e.g. Deluxe Queen" className={inputCls} required />
                  )}
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
              <Field label="Bed Type *">
                {bedTypes.length > 0 ? (
                  <select value={roomForm.bedType} onChange={(e) => setRoomForm((p) => ({ ...p, bedType: e.target.value }))}
                    className={inputCls} required>
                    <option value="">Select bed type</option>
                    {bedTypes.map((bt) => (
                      <option key={bt.id} value={bt.name}>{bt.name}</option>
                    ))}
                  </select>
                ) : (
                  <input value={roomForm.bedType} onChange={(e) => setRoomForm((p) => ({ ...p, bedType: e.target.value }))}
                    placeholder="e.g. King, Twin" className={inputCls} required />
                )}
              </Field>
              <Field label="Cancellation Policy">
                <input value={roomForm.cancellationPolicy}
                  onChange={(e) => setRoomForm((p) => ({ ...p, cancellationPolicy: e.target.value }))}
                  placeholder="e.g. Free cancellation 48h before check-in" className={inputCls} />
              </Field>
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
                  {roomTypes.length > 0 ? (
                    <select value={editRoom.roomType || ""} onChange={(e) => setEditRoom((p) => ({ ...p, roomType: e.target.value }))}
                      className={inputCls} required>
                      <option value="">Select room type</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.name}>{rt.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={editRoom.roomType || ""} onChange={(e) => setEditRoom((p) => ({ ...p, roomType: e.target.value }))}
                      placeholder="e.g. Deluxe Queen" className={inputCls} required />
                  )}
                </Field>
                <Field label="Total Units">
                  <input type="number" min="1" value={editRoom.totalRooms || 1}
                    onChange={(e) => setEditRoom((p) => ({ ...p, totalRooms: e.target.value }))}
                    className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity *">
                  <input type="number" min="1" value={editRoom.capacity || ""}
                    onChange={(e) => setEditRoom((p) => ({ ...p, capacity: e.target.value }))}
                    className={inputCls} required />
                </Field>
                <Field label="Price / Night *">
                  <input type="number" min="0" step="0.01"
                    value={editRoom.pricePerNight || editRoom.basePrice || ""}
                    onChange={(e) => setEditRoom((p) => ({ ...p, pricePerNight: e.target.value }))}
                    className={inputCls} required />
                </Field>
              </div>
              <Field label="Bed Type">
                {bedTypes.length > 0 ? (
                  <select value={editRoom.bedType || ""} onChange={(e) => setEditRoom((p) => ({ ...p, bedType: e.target.value }))}
                    className={inputCls}>
                    <option value="">Select bed type</option>
                    {bedTypes.map((bt) => (
                      <option key={bt.id} value={bt.name}>{bt.name}</option>
                    ))}
                  </select>
                ) : (
                  <input value={editRoom.bedType || ""} onChange={(e) => setEditRoom((p) => ({ ...p, bedType: e.target.value }))}
                    placeholder="e.g. King, Twin" className={inputCls} />
                )}
              </Field>
              <Field label="Cancellation Policy">
                <input value={editRoom.cancellationPolicy || ""}
                  onChange={(e) => setEditRoom((p) => ({ ...p, cancellationPolicy: e.target.value }))}
                  placeholder="e.g. Free cancellation 48h before check-in" className={inputCls} />
              </Field>
              <Field label="Description">
                <textarea value={editRoom.description || ""}
                  onChange={(e) => setEditRoom((p) => ({ ...p, description: e.target.value }))}
                  rows="2" className={`${inputCls} resize-none`} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={editRoom.status || "ACTIVE"}
                    onChange={(e) => setEditRoom((p) => ({ ...p, status: e.target.value }))}
                    className={inputCls}>
                    <option value="ACTIVE">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </Field>
                <Field label="Availability">
                  <select value={String(editRoom.isAvailable ?? true)}
                    onChange={(e) => setEditRoom((p) => ({ ...p, isAvailable: e.target.value === "true" }))}
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

      {/* ── Images Modal ── */}
      <AnimatePresence>
        {showImages && imageRoom && (
          <Modal title={`Images — ${imageRoom.roomType}`}
            onClose={() => { setShowImages(false); setImageRoom(null); }}>
            <div className="space-y-4">
              {/* Upload new image */}
              <S3ImageUpload
                label="Upload room photo"
                uploadFn={async (file) => {
                  const rid = imageRoom.roomId || imageRoom.id;
                  const fd = new FormData();
                  fd.append('file', file);
                  const result = await dispatch(uploadRoomImage({ roomId: rid, formData: fd })).unwrap();
                  dispatch(fetchRoomImages(rid));
                  return result?.imageUrl || result?.url || '';
                }}
                onUploaded={() => {}}
              />

              {/* Existing images */}
              {currentImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {currentImages.map((img) => {
                    const imgId = img.imageId || img.id;
                    return (
                      <div key={imgId} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                        <img src={img.imageUrl || img.url} alt="Room" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setConfirmDelImg({ open: true, imageId: imgId })}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Confirm Deactivate ── */}
      <ConfirmModal
        isOpen={showDel}
        title="Deactivate Room"
        message={`Deactivate "${deleteRoom?.roomType}"? It will be hidden from guests.`}
        confirmLabel="Deactivate"
        loading={sliceLoading}
        onConfirm={handleDeleteRoom}
        onCancel={() => { setShowDel(false); setDeleteRoom(null); }}
      />

      {/* ── Confirm Delete Image ── */}
      <ConfirmModal
        isOpen={confirmDelImg.open}
        title="Remove Image"
        message="Remove this image from the room?"
        confirmLabel="Remove"
        onConfirm={confirmImgDelete}
        onCancel={() => setConfirmDelImg({ open: false, imageId: null })}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — tab-based hotel selector
══════════════════════════════════════════════════════════ */
export const RoomsManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotels: ownerHotels, loading } = useSelector((s) => s.partneredhotels);
  const activeHotelId = useSelector(selectPrimaryHotelId);

  useEffect(() => {
    dispatch(fetchOwnerHotels());
  }, [dispatch]);

  const activeHotel = ownerHotels.find(
    (h) => (h.partneredHotelId || h.id) === activeHotelId
  ) || null;

  return (
    <div className="space-y-6">

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
        <button onClick={() => navigate("/add-hotel")}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors">
          <Building2 className="w-4 h-4" /> Add Hotel
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && ownerHotels.length === 0 && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
            <p className="text-slate-500 text-sm">Loading hotels…</p>
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && ownerHotels.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Hotels Yet</h3>
          <p className="text-slate-500 text-sm mb-6">Add your first hotel to manage its rooms.</p>
          <button onClick={() => navigate("/add-hotel")}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Hotel
          </button>
        </div>
      )}

      {!activeHotelId && ownerHotels.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Select a hotel</h3>
          <p className="text-slate-600 text-sm">Choose a hotel from the header to manage rooms.</p>
        </div>
      )}

      {/* Room panel for active hotel */}
      {ownerHotels.length > 0 && activeHotelId && (
        <AnimatePresence mode="wait">
          {activeHotel && (
            <motion.div
              key={activeHotelId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <RoomPanel hotel={activeHotel} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
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

import { useDispatch, useSelector } from "react-redux";
import {
  createHotel,
  updateHotel,
  deleteHotel,
  fetchHotelById,
  clearHotelError,
  createHotelRoom,
  updateHotelRoom,
  deleteHotelRoom,
} from "../store/slices/PartnerHotelslice";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LocationPicker } from "../components/common/LocationPicker";
import {
  X,
  AlertCircle,
  MapPin,
  BedDouble,
  Info,
  Trash2,
  Edit,
  Plus,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Percent,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/common/ConfirmModal";

/* ── shared input className ── */
const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all bg-white";

/* ── section card ── */
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
      <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const AMENITY_PRESETS = ["wifi", "parking", "gym", "restaurant", "spa", "pool", "bar", "concierge"];

/* ── Room form fields — MUST be outside AddHotel to avoid remount on every render ── */
const RoomFormFields = ({ data, onChange, validationError }) => (
  <div className="space-y-3">
    {validationError && (
      <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{validationError}</p>
    )}
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Room Type *</label>
        <input
          placeholder="e.g. Deluxe Suite"
          value={data.roomType}
          onChange={(e) => onChange({ ...data, roomType: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bed Type</label>
        <input
          placeholder="e.g. King"
          value={data.bedType}
          onChange={(e) => onChange({ ...data, bedType: e.target.value })}
          className={inputCls}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capacity *</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 2"
          value={data.capacity}
          onChange={(e) => onChange({ ...data, capacity: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price / Night *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 149"
          value={data.basePrice}
          onChange={(e) => onChange({ ...data, basePrice: e.target.value })}
          className={inputCls}
        />
      </div>
    </div>
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Size</label>
      <input
        placeholder="e.g. 350 sq ft"
        value={data.size}
        onChange={(e) => onChange({ ...data, size: e.target.value })}
        className={inputCls}
      />
    </div>
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
      <textarea
        placeholder="Room description..."
        value={data.description}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        rows="2"
        className={`${inputCls} resize-none`}
      />
    </div>
  </div>
);

export const AddHotel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const isUpdateMode = !!hotelId;

  const { loading, error, selectedHotel } = useSelector((state) => state.partneredhotels);
  /* ─────────────────────── STATE ─────────────────────── */
  const [formData, setFormData] = useState({
    hotelName: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    discountPercent: "",
    status: "ACTIVE",
    amenities: [],
    hotelImages: [],
    rooms: [],
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [roomValidationError, setRoomValidationError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingRooms, setExistingRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDeleteHotel, setConfirmDeleteHotel] = useState(false);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState({ open: false, roomId: null });
  const formPopulated = useRef(false);

  const [roomData, setRoomData] = useState({
    roomType: "",
    capacity: "",
    basePrice: "",
    available: true,
    description: "",
    size: "",
    bedType: "",
    images: [],
  });

  /* ─────────────────────── FETCH FOR EDIT ─────────────────────── */
  useEffect(() => {
    if (isUpdateMode) dispatch(fetchHotelById(hotelId));
    return () => dispatch(clearHotelError());
  }, [dispatch, hotelId, isUpdateMode]);

  useEffect(() => {
    if (isUpdateMode && selectedHotel) {
      setExistingRooms(selectedHotel.rooms || []);
      if (formPopulated.current) return;
      formPopulated.current = true;
      setFormData({
        hotelName: selectedHotel.name || "",
        description: selectedHotel.description || "",
        location: selectedHotel.location || "",
        latitude: selectedHotel.latitude || "",
        longitude: selectedHotel.longitude || "",
        discountPercent: selectedHotel.discountPercentage || "",
        status: selectedHotel.status || "ACTIVE",
        amenities: selectedHotel.amenities || [],
        hotelImages: selectedHotel.hotelImages || [],
        rooms: [],
      });
    }
  }, [selectedHotel, isUpdateMode]);

  /* ─────────────────────── HANDLERS ─────────────────────── */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (updateSuccess) setUpdateSuccess(null);
  };

  const handleAddAmenity = (val) => {
    const value = (val || amenityInput).trim().toLowerCase();
    if (!value || formData.amenities.includes(value)) return;
    setFormData((prev) => ({ ...prev, amenities: [...prev.amenities, value] }));
    setAmenityInput("");
  };

  const handleRemoveAmenity = (amenity) =>
    setFormData((prev) => ({ ...prev, amenities: prev.amenities.filter((a) => a !== amenity) }));

  const handleAddHotelImage = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setFormData((prev) => ({ ...prev, hotelImages: [...prev.hotelImages, { imageUrl: url }] }));
    setImageUrlInput("");
  };

  const handleRemoveHotelImage = (index) =>
    setFormData((prev) => ({ ...prev, hotelImages: prev.hotelImages.filter((_, i) => i !== index) }));

  const handleAddRoom = () => {
    if (!roomData.roomType || !roomData.capacity || !roomData.basePrice) {
      setRoomValidationError("Room type, capacity and price are required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        { ...roomData, capacity: Number(roomData.capacity), basePrice: Number(roomData.basePrice), id: Date.now() },
      ],
    }));
    setRoomData({ roomType: "", capacity: "", basePrice: "", available: true, description: "", size: "", bedType: "", images: [] });
    setRoomValidationError("");
  };

  const handleRemoveRoom = (id) =>
    setFormData((prev) => ({ ...prev, rooms: prev.rooms.filter((r) => r.id !== id) }));

  const handleDeleteHotel = () => setConfirmDeleteHotel(true);

  const confirmHotelDelete = async () => {
    setConfirmDeleteHotel(false);
    try {
      await dispatch(deleteHotel(hotelId)).unwrap();
      toast.success("Hotel deactivated successfully");
      navigate("/hotels");
    } catch (err) {
      toast.error(err.message || "Failed to deactivate hotel");
    }
  };

  const handleEditExistingRoom = (room) => {
    setEditingRoom({ ...room });
    setShowEditModal(true);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const roomId = editingRoom?.roomId || editingRoom?.id;
    if (!roomId) { toast.error("Invalid room ID"); return; }
    try {
      await dispatch(updateHotelRoom({
        roomId,
        data: {
          roomType: editingRoom.roomType,
          capacity: Number(editingRoom.capacity),
          basePrice: Number(editingRoom.basePrice || editingRoom.pricePerNight),
          available: editingRoom.available ?? true,
          description: editingRoom.description || "",
          size: editingRoom.size || "",
          bedType: editingRoom.bedType || "",
          roomNumber: editingRoom.roomNumber || "",
          floor: editingRoom.floor || "",
          status: editingRoom.status || "available",
        },
      })).unwrap();
      toast.success("Room updated successfully");
      await dispatch(fetchHotelById(hotelId)).unwrap().catch(() => {});
      setShowEditModal(false);
      setEditingRoom(null);
    } catch (err) {
      toast.error(err.message || "Failed to update room");
    }
  };

  const handleDeleteExistingRoom = (roomId) => setConfirmDeleteRoom({ open: true, roomId });

  const confirmRoomDelete = async () => {
    const { roomId } = confirmDeleteRoom;
    setConfirmDeleteRoom({ open: false, roomId: null });
    if (!roomId) return;
    try {
      await dispatch(deleteHotelRoom(roomId)).unwrap();
      toast.success("Room deleted successfully");
      setExistingRooms((prev) => prev.filter((r) => (r.roomId || r.id) !== roomId));
      if (hotelId) await dispatch(fetchHotelById(hotelId)).unwrap().catch(() => {});
    } catch (err) {
      toast.error(err.message || "Failed to delete room");
    }
  };

  /* ─────────────────────── SUBMIT ─────────────────────── */
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!isUpdateMode && formData.rooms.length === 0) {
      toast.error("Please add at least one room.");
      return;
    }

    setSubmitting(true);

    const pendingImages = imageUrlInput.trim()
      ? [...formData.hotelImages, { imageUrl: imageUrlInput.trim() }]
      : formData.hotelImages;
    if (imageUrlInput.trim()) setImageUrlInput("");

    /* Request body matching the API spec exactly */
    const dataToSend = {
      name: formData.hotelName,
      description: formData.description,
      location: formData.location,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      isPartnered: true,
      discountPercentage: parseFloat(formData.discountPercent) || 0,
      status: formData.status || "ACTIVE",
      amenities: formData.amenities,
      hotelImages: pendingImages,
    };

    try {
      if (isUpdateMode) {
        const result = dispatch(updateHotel({ hotelId, data: dataToSend }));
        const resolved = await result;
        if (resolved.meta.requestStatus === "fulfilled") {
          let successMsg = "Hotel updated successfully!";
          if (formData.rooms.length > 0) {
            const results = await Promise.all(
              formData.rooms.map((room) =>
                dispatch(createHotelRoom({
                  hotelId,
                  data: {
                    roomType: room.roomType,
                    capacity: Number(room.capacity),
                    pricePerNight: Number(room.basePrice),
                    isAvailable: room.available ?? true,
                    description: room.description || "",
                    size: room.size || "",
                    bedType: room.bedType || "",
                    images: room.images || [],
                  },
                }))
              )
            );
            const ok = results.filter((r) => r.meta.requestStatus === "fulfilled").length;
            const fail = results.length - ok;
            successMsg = fail > 0
              ? `Hotel updated! ${ok} room(s) added, ${fail} failed.`
              : `Hotel updated and ${ok} new room(s) added!`;
            await dispatch(fetchHotelById(hotelId)).unwrap().catch(() => {});
            setFormData((prev) => ({ ...prev, rooms: [] }));
          }
          localStorage.setItem("currentHotelId", hotelId);
          setUpdateSuccess(successMsg);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          throw new Error(resolved.error?.message || "Failed to update hotel");
        }
      } else {
        const hotelResult = await dispatch(createHotel(dataToSend)).unwrap().then(
          (payload) => ({ ok: true, payload }),
          (err) => ({ ok: false, error: err })
        );
        if (hotelResult.ok) {
          const createdHotel = hotelResult.payload;
          const createdHotelId = createdHotel.hotelId || createdHotel.partneredHotelId || createdHotel.id;
          if (!createdHotelId) throw new Error("Hotel created but ID not found in response");

          /* Create rooms separately */
          const roomResults = await Promise.all(
            formData.rooms.map((room) =>
              dispatch(createHotelRoom({
                hotelId: createdHotelId,
                data: {
                  roomType: room.roomType,
                  capacity: Number(room.capacity),
                  pricePerNight: Number(room.basePrice),
                  isAvailable: room.available ?? true,
                  description: room.description || "",
                  size: room.size || "",
                  bedType: room.bedType || "",
                  images: room.images || [],
                },
              }))
            )
          );

          const ok = roomResults.filter((r) => r.meta.requestStatus === "fulfilled").length;
          const fail = roomResults.length - ok;

          const hotelIds = JSON.parse(localStorage.getItem("hotelIds") || "[]");
          if (!hotelIds.includes(createdHotelId)) {
            hotelIds.push(createdHotelId);
            localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
          }
          localStorage.setItem("currentHotelId", createdHotelId);

          fail > 0
            ? toast.success(`Hotel created! ${ok} room(s) added, ${fail} failed.`)
            : toast.success(`Hotel and ${ok} room(s) created successfully!`);

          navigate("/hotels");
        } else {
          throw new Error(hotelResult.error?.message || "Failed to create hotel");
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to save hotel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────── LOADING STATE ─────────────────────── */
  if (isUpdateMode && !selectedHotel && loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent" />
          <p className="text-slate-500 text-sm">Loading hotel...</p>
        </div>
      </div>
    );
  }

  /* ─────────────────────── EDIT MODE ─────────────────────── */
  if (isUpdateMode) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/hotels")}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Hotel</h1>
                <p className="text-slate-500 text-sm">Update hotel details and manage rooms</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDeleteHotel}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Deactivate
            </button>
          </div>

          {updateSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-800 text-sm">Changes saved</p>
                <p className="text-emerald-700 text-sm mt-0.5">{updateSuccess}</p>
              </div>
              <button type="button" onClick={() => setUpdateSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">

            {/* Basic Info */}
            <Section icon={Info} title="Basic Information">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hotel Name *</label>
                <input name="hotelName" placeholder="e.g. Mountain Vista Retreat" value={formData.hotelName} onChange={handleFormChange} className={inputCls} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
                <textarea name="description" placeholder="Describe the hotel..." value={formData.description} onChange={handleFormChange} className={`${inputCls} resize-none`} rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Discount %</label>
                  <div className="relative">
                    <input name="discountPercent" type="number" placeholder="0" value={formData.discountPercent} onChange={handleFormChange} className={`${inputCls} pr-8`} min="0" max="100" />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange} className={inputCls}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${formData.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {formData.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {formData.status}
                </span>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Amenities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. pool, spa"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => handleAddAmenity()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm hover:bg-slate-800 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium capitalize">
                        {a}
                        <button type="button" onClick={() => handleRemoveAmenity(a)}><X size={11} className="hover:text-red-500" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* Location */}
            <Section icon={MapPin} title="Location">
              <LocationPicker
                value={{ location: formData.location, latitude: formData.latitude, longitude: formData.longitude }}
                onChange={({ location, latitude, longitude }) => setFormData((prev) => ({ ...prev, location, latitude, longitude }))}
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location String</label>
                <input name="location" placeholder="e.g. San Diego, California, USA" value={formData.location} onChange={handleFormChange} className={inputCls} />
                <p className="text-xs text-slate-400">Auto-filled from map, or enter manually</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Latitude</label>
                  <input name="latitude" type="number" step="any" placeholder="e.g. 32.7157" value={formData.latitude} onChange={handleFormChange} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Longitude</label>
                  <input name="longitude" type="number" step="any" placeholder="e.g. -117.1611" value={formData.longitude} onChange={handleFormChange} className={inputCls} />
                </div>
              </div>
            </Section>

            {/* Hotel Images */}
            <Section icon={ImageIcon} title="Hotel Images">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHotelImage())}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text").trim();
                    if (pasted) {
                      e.preventDefault();
                      setFormData((prev) => ({ ...prev, hotelImages: [...prev.hotelImages, { imageUrl: pasted }] }));
                      setImageUrlInput("");
                    }
                  }}
                  className={inputCls}
                />
                <button type="button" onClick={handleAddHotelImage} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm hover:bg-slate-800 transition-colors shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.hotelImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {formData.hotelImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveHotelImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No images added yet</p>
                </div>
              )}
            </Section>

            {/* Existing Rooms */}
            {existingRooms.length > 0 && (
              <Section icon={BedDouble} title={`Rooms (${existingRooms.length})`}>
                <div className="space-y-2">
                  {existingRooms.map((room) => {
                    const rid = room.roomId || room.id;
                    return (
                      <div key={rid} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm capitalize">{room.roomType || "Room"}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {room.capacity} guests &bull; ${room.pricePerNight || room.basePrice || 0}/night
                            {room.bedType && ` · ${room.bedType}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${room.isAvailable !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {room.isAvailable !== false ? "Available" : "Unavailable"}
                          </span>
                          <button type="button" onClick={() => handleEditExistingRoom(room)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDeleteExistingRoom(rid)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add more rooms in edit mode */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add New Room</p>
                  <RoomFormFields data={roomData} onChange={setRoomData} validationError={roomValidationError} />
                  <button
                    type="button"
                    onClick={handleAddRoom}
                    className="w-full py-2.5 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl text-sm font-medium hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Room
                  </button>
                </div>
              </Section>
            )}

            {/* Submit */}
            <div className="flex gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate("/hotels")}
                className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || submitting}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-semibold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || submitting ? "Saving…" : updateSuccess ? "Save Again" : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Edit Room Modal */}
          {showEditModal && editingRoom && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowEditModal(false); setEditingRoom(null); }}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">Edit Room</h3>
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingRoom(null); }} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleUpdateRoom} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Room Type *</label>
                      <input value={editingRoom.roomType || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, roomType: e.target.value }))} placeholder="e.g. Deluxe Suite" required className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bed Type</label>
                      <input value={editingRoom.bedType || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, bedType: e.target.value }))} placeholder="e.g. King" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capacity *</label>
                      <input type="number" min="1" value={editingRoom.capacity || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, capacity: e.target.value }))} required className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price / Night *</label>
                      <input type="number" min="0" step="0.01" value={editingRoom.basePrice || editingRoom.pricePerNight || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, basePrice: e.target.value, pricePerNight: e.target.value }))} required className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Size</label>
                      <input value={editingRoom.size || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, size: e.target.value }))} placeholder="e.g. 450 sq ft" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                      <select value={editingRoom.status || "available"} onChange={(e) => setEditingRoom((p) => ({ ...p, status: e.target.value }))} className={inputCls}>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
                    <textarea value={editingRoom.description || ""} onChange={(e) => setEditingRoom((p) => ({ ...p, description: e.target.value }))} rows="2" placeholder="Room description..." className={`${inputCls} resize-none`} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setShowEditModal(false); setEditingRoom(null); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
                      {loading ? "Saving…" : "Save Room"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <ConfirmModal isOpen={confirmDeleteHotel} title="Deactivate Hotel" message="The hotel will be deactivated and hidden from guests." confirmLabel="Deactivate" loading={loading} onConfirm={confirmHotelDelete} onCancel={() => setConfirmDeleteHotel(false)} />
          <ConfirmModal isOpen={confirmDeleteRoom.open} title="Delete Room" message="Are you sure you want to delete this room?" confirmLabel="Delete Room" onConfirm={confirmRoomDelete} onCancel={() => setConfirmDeleteRoom({ open: false, roomId: null })} />
        </div>
      </div>
    );
  }

  /* ─────────────────────── CREATE MODE ─────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/hotels")}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Hotel</h1>
            <p className="text-slate-500 text-sm">Fill in the details to register a new property</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">

          {/* Basic Info */}
          <Section icon={Info} title="Basic Information">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hotel Name *</label>
              <input name="hotelName" placeholder="e.g. Ocean Breeze Resort" value={formData.hotelName} onChange={handleFormChange} className={inputCls} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
              <textarea name="description" placeholder="Describe the hotel experience..." value={formData.description} onChange={handleFormChange} className={`${inputCls} resize-none`} rows="3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Discount %</label>
                <div className="relative">
                  <input name="discountPercent" type="number" placeholder="0" value={formData.discountPercent} onChange={handleFormChange} className={`${inputCls} pr-8`} min="0" max="100" />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} className={inputCls}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Amenities</label>
              {/* Quick-add presets */}
              <div className="flex flex-wrap gap-1.5">
                {AMENITY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddAmenity(preset)}
                    disabled={formData.amenities.includes(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize border transition-all ${
                      formData.amenities.includes(preset)
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Custom amenity..."
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                  className={inputCls}
                />
                <button type="button" onClick={() => handleAddAmenity()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm hover:bg-slate-800 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.amenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-medium capitalize">
                      {a}
                      <button type="button" onClick={() => handleRemoveAmenity(a)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Location */}
          <Section icon={MapPin} title="Location">
            <LocationPicker
              value={{ location: formData.location, latitude: formData.latitude, longitude: formData.longitude }}
              onChange={({ location, latitude, longitude }) => setFormData((prev) => ({ ...prev, location, latitude, longitude }))}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location *</label>
              <input name="location" placeholder="e.g. San Diego, California, USA" value={formData.location} onChange={handleFormChange} className={inputCls} required />
              <p className="text-xs text-slate-400">Auto-filled from map, or enter manually</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Latitude</label>
                <input name="latitude" type="number" step="any" placeholder="e.g. 32.7157" value={formData.latitude} onChange={handleFormChange} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Longitude</label>
                <input name="longitude" type="number" step="any" placeholder="e.g. -117.1611" value={formData.longitude} onChange={handleFormChange} className={inputCls} />
              </div>
            </div>
          </Section>

          {/* Hotel Images */}
          <Section icon={ImageIcon} title="Hotel Images">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHotelImage())}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text").trim();
                  if (pasted) {
                    e.preventDefault();
                    setFormData((prev) => ({ ...prev, hotelImages: [...prev.hotelImages, { imageUrl: pasted }] }));
                    setImageUrlInput("");
                  }
                }}
                className={inputCls}
              />
              <button type="button" onClick={handleAddHotelImage} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm hover:bg-slate-800 transition-colors shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.hotelImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {formData.hotelImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveHotelImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No images added yet</p>
                <p className="text-xs text-slate-300 mt-1">Paste a URL above to add hotel photos</p>
              </div>
            )}
          </Section>

          {/* Rooms */}
          <Section icon={BedDouble} title="Rooms">
            <RoomFormFields data={roomData} onChange={setRoomData} validationError={roomValidationError} />
            <button
              type="button"
              onClick={handleAddRoom}
              className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Room
            </button>

            {formData.rooms.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Added Rooms ({formData.rooms.length})</p>
                {formData.rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm capitalize">{room.roomType}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {room.capacity} guests &bull; ${room.basePrice}/night
                        {room.bedType && ` · ${room.bedType}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleRemoveRoom(room.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate("/hotels")}
              className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || submitting}
              className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-semibold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading || submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating Hotel…
                </>
              ) : (
                "Create Hotel"
              )}
            </button>
          </div>
        </form>

        <ConfirmModal isOpen={confirmDeleteHotel} title="Deactivate Hotel" message="The hotel will be deactivated and hidden from guests." confirmLabel="Deactivate" loading={loading} onConfirm={confirmHotelDelete} onCancel={() => setConfirmDeleteHotel(false)} />
        <ConfirmModal isOpen={confirmDeleteRoom.open} title="Delete Room" message="Are you sure you want to delete this room?" confirmLabel="Delete Room" onConfirm={confirmRoomDelete} onCancel={() => setConfirmDeleteRoom({ open: false, roomId: null })} />
      </div>
    </div>
  );
};

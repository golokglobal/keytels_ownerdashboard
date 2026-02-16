import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchHotelById,
  createHotelRoom,
  updateHotelRoom,
  deleteHotelRoom,
  clearSelectedHotel,
  fetchRoomImages,
  uploadRoomImage,
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
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Upload,
  MapPin,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Normalize status values from API to display-friendly format
const normalizeStatus = (status) => {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s === "active" || s === "available") return "ACTIVE";
  if (s === "maintenance") return "maintenance";
  if (s === "occupied" || s === "booked") return "occupied";
  if (s === "inactive") return "inactive";
  return s;
};

const statusConfig = {
  ACTIVE: {
    label: "Active",
    bg: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Wrench,
  },
  occupied: {
    label: "Occupied",
    bg: "bg-blue-100 text-blue-700 border-blue-200",
    icon: XCircle,
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    icon: XCircle,
  },
  unknown: {
    label: "Unknown",
    bg: "bg-slate-100 text-slate-500 border-slate-200",
    icon: AlertCircle,
  },
};

// Small image carousel for room cards
const RoomImageCarousel = ({ images = [] }) => {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
        <span className="text-xs text-slate-400">No images</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 group">
      <img
        src={images[current]?.imageUrl || images[current]?.url}
        alt="Room"
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => {
          e.target.src = "";
          e.target.onerror = null;
          e.target.parentElement.innerHTML =
            '<div class="w-full h-full bg-slate-100 flex items-center justify-center"><span class="text-xs text-slate-400">Image unavailable</span></div>';
        }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === 0 ? images.length - 1 : p - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/40 hover:bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === images.length - 1 ? 0 : p + 1));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/40 hover:bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const RoomsManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { hotelRooms, roomImages, loading, error } = useSelector(
    (state) => state.partneredhotels
  );

  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [userHotels, setUserHotels] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedRoomForImages, setSelectedRoomForImages] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [roomData, setRoomData] = useState({
    roomType: "",
    capacity: "",
    basePrice: "",
    available: true,
    description: "",
    size: "",
    bedType: "",
    roomNumber: "",
    floor: "",
    status: "ACTIVE",
    totalRooms: "1",
  });

  const [roomValidationError, setRoomValidationError] = useState("");

  // Use rooms from selectedHotel directly (API data), fallback to Redux hotelRooms
  const rooms = selectedHotel?.rooms?.length ? selectedHotel.rooms : hotelRooms;

  // Load all user hotels
  useEffect(() => {
    const loadAllHotels = async () => {
      let hotelIds = JSON.parse(localStorage.getItem("hotelIds") || "[]");

      if (hotelIds.length === 0) {
        const currentHotelId = localStorage.getItem("currentHotelId");
        if (currentHotelId) {
          hotelIds = [currentHotelId];
          localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
        }
      }

      if (hotelIds.length === 0) {
        setUserHotels([]);
        return;
      }

      try {
        const hotelPromises = hotelIds.map((id) =>
          dispatch(fetchHotelById(id)).unwrap()
        );
        const loadedHotels = await Promise.all(hotelPromises);
        const validHotels = loadedHotels.filter(Boolean);

        setUserHotels(validHotels);

        if (validHotels.length > 0) {
          const firstHotelId =
            validHotels[0].partneredHotelId ||
            validHotels[0]._id ||
            validHotels[0].id;
          setSelectedHotelId(firstHotelId);
          setSelectedHotel(validHotels[0]);
        }
      } catch (err) {
        console.error("Failed to load hotels:", err);
        toast.error("Failed to load hotels");
      }
    };

    loadAllHotels();

    return () => {
      dispatch(clearSelectedHotel());
    };
  }, [dispatch]);

  const handleHotelSelect = async (e) => {
    const hotelId = e.target.value;

    if (!hotelId) {
      setSelectedHotelId("");
      setSelectedHotel(null);
      return;
    }

    setSelectedHotelId(hotelId);

    const foundHotel = userHotels.find(
      (h) => (h.partneredHotelId || h._id || h.id) === hotelId
    );

    if (foundHotel) {
      setSelectedHotel(foundHotel);
      toast.success(`Switched to: ${foundHotel.name || foundHotel.hotelName}`);
    } else {
      try {
        const hotelData = await dispatch(fetchHotelById(hotelId)).unwrap();
        setSelectedHotel(hotelData);
        toast.success(
          `Loaded hotel: ${hotelData.name || hotelData.hotelName}`
        );
      } catch (err) {
        console.error("Failed to fetch hotel:", err);
        toast.error("Failed to load hotel details");
      }
    }
  };

  const handleOpenAddRoomModal = () => {
    if (!selectedHotelId) {
      toast.error("Please select a hotel first");
      return;
    }
    setShowAddRoomModal(true);
    setRoomData({
      roomType: "",
      capacity: "",
      basePrice: "",
      available: true,
      description: "",
      size: "",
      bedType: "",
      roomNumber: "",
      floor: "",
      status: "ACTIVE",
      totalRooms: "1",
    });
    setRoomValidationError("");
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();

    if (!roomData.roomType || !roomData.capacity || !roomData.basePrice) {
      setRoomValidationError("Room type, capacity and price are required.");
      return;
    }

    if (!selectedHotelId) {
      toast.error("No hotel selected");
      return;
    }

    let createData = null;

    try {
      createData = {
        roomType: roomData.roomType,
        capacity: Number(roomData.capacity),
        pricePerNight: Number(roomData.basePrice),
        isAvailable: roomData.available ?? true,
        description: roomData.description || "",
        totalRooms: Number(roomData.totalRooms) || 1,
      };

      if (roomData.size) createData.size = roomData.size;
      if (roomData.bedType) createData.bedType = roomData.bedType;
      if (roomData.roomNumber) createData.roomNumber = roomData.roomNumber;
      if (roomData.floor) createData.floor = roomData.floor;
      if (roomData.status) createData.status = roomData.status;

      await dispatch(
        createHotelRoom({ hotelId: selectedHotelId, data: createData })
      ).unwrap();

      toast.success("Room added successfully!");
      setShowAddRoomModal(false);
      setRoomValidationError("");

      setRoomData({
        roomType: "",
        capacity: "",
        basePrice: "",
        available: true,
        description: "",
        size: "",
        bedType: "",
        roomNumber: "",
        floor: "",
        status: "ACTIVE",
        totalRooms: "1",
      });

      const updatedHotel = await dispatch(
        fetchHotelById(selectedHotelId)
      ).unwrap();
      setSelectedHotel(updatedHotel);
    } catch (err) {
      console.error("Failed to create room:", err);
      let errorMessage = "Failed to create room";
      if (typeof err === "string") errorMessage = err;
      else if (err?.response?.data) {
        const d = err.response.data;
        errorMessage = d.message || d.error || JSON.stringify(d);
      } else if (err?.message) errorMessage = err.message;
      toast.error(errorMessage);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom({ ...room });
    setShowEditModal(true);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const roomId = editingRoom?.roomId || editingRoom?.id;

    if (!roomId) {
      toast.error("Invalid room ID");
      return;
    }

    try {
      const updateData = {
        roomType: editingRoom.roomType,
        capacity: Number(editingRoom.capacity),
        pricePerNight: Number(
          editingRoom.basePrice || editingRoom.pricePerNight
        ),
        isAvailable: editingRoom.available ?? editingRoom.isAvailable ?? true,
        description: editingRoom.description || "",
      };

      if (editingRoom.size) updateData.size = editingRoom.size;
      if (editingRoom.bedType) updateData.bedType = editingRoom.bedType;
      if (editingRoom.roomNumber)
        updateData.roomNumber = editingRoom.roomNumber;
      if (editingRoom.floor) updateData.floor = editingRoom.floor;
      if (editingRoom.status) updateData.status = editingRoom.status;

      await dispatch(
        updateHotelRoom({ roomId, data: updateData })
      ).unwrap();

      toast.success("Room updated successfully!");
      setShowEditModal(false);
      setEditingRoom(null);

      if (selectedHotelId) {
        const updatedHotel = await dispatch(
          fetchHotelById(selectedHotelId)
        ).unwrap();
        setSelectedHotel(updatedHotel);
      }
    } catch (err) {
      console.error("Failed to update room:", err);
      let errorMessage = "Failed to update room";
      if (typeof err === "string") errorMessage = err;
      else if (err?.response?.data) {
        const d = err.response.data;
        errorMessage = d.message || d.error || JSON.stringify(d);
      } else if (err?.message) errorMessage = err.message;
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const handleDeleteRoom = async () => {
    const roomId = roomToDelete?.roomId || roomToDelete?.id;

    if (!roomId) {
      toast.error("Invalid room ID");
      return;
    }

    try {
      await dispatch(deleteHotelRoom(roomId)).unwrap();
      toast.success("Room deleted successfully!");
      setShowDeleteModal(false);
      setRoomToDelete(null);

      if (selectedHotelId) {
        const updatedHotel = await dispatch(
          fetchHotelById(selectedHotelId)
        ).unwrap();
        setSelectedHotel(updatedHotel);
      }
    } catch (err) {
      console.error("Failed to delete room:", err);
      let errorMessage = "Failed to delete room";
      if (typeof err === "string") errorMessage = err;
      else if (err?.response?.data) {
        const d = err.response.data;
        errorMessage = d.message || d.error || JSON.stringify(d);
      } else if (err?.message) errorMessage = err.message;
      toast.error(errorMessage);
    }
  };

  const handleOpenImageModal = async (room) => {
    const roomId = room.roomId || room.id;
    setSelectedRoomForImages(room);
    setShowImageModal(true);

    try {
      await dispatch(fetchRoomImages(roomId)).unwrap();
    } catch (err) {
      console.error("Failed to fetch room images:", err);
    }
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      toast.error("Please select an image file");
      return;
    }

    const roomId =
      selectedRoomForImages?.roomId || selectedRoomForImages?.id;
    if (!roomId) {
      toast.error("Invalid room ID");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      await dispatch(uploadRoomImage({ roomId, formData })).unwrap();
      toast.success("Image uploaded successfully!");
      setImageFile(null);

      const fileInput = document.getElementById("image-upload-input");
      if (fileInput) fileInput.value = "";

      await dispatch(fetchRoomImages(roomId)).unwrap();

      // Also refresh hotel to get updated images on cards
      if (selectedHotelId) {
        const updatedHotel = await dispatch(
          fetchHotelById(selectedHotelId)
        ).unwrap();
        setSelectedHotel(updatedHotel);
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast.error(err.message || "Failed to upload image");
    }
  };

  const handleDeleteImage = async (imageId) => {
    const roomId =
      selectedRoomForImages?.roomId || selectedRoomForImages?.id;

    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await dispatch(deleteRoomImage({ imageId, roomId })).unwrap();
      toast.success("Image deleted successfully!");

      // Refresh hotel to update card images
      if (selectedHotelId) {
        const updatedHotel = await dispatch(
          fetchHotelById(selectedHotelId)
        ).unwrap();
        setSelectedHotel(updatedHotel);
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
      toast.error(err.message || "Failed to delete image");
    }
  };

  // Stats from rooms
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(
    (r) => normalizeStatus(r.status) === "ACTIVE"
  ).length;
  const maintenanceRooms = rooms.filter(
    (r) => normalizeStatus(r.status) === "maintenance"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Rooms</h1>
          <p className="text-slate-600">Manage rooms across your hotels</p>
        </div>
        <div className="flex gap-3">
          {selectedHotelId ? (
            <button
              onClick={handleOpenAddRoomModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </button>
          ) : (
            <button
              onClick={() => navigate("/add-hotel")}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Add Hotel
            </button>
          )}
        </div>
      </div>

      {/* Hotel Selector */}
      {userHotels.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-500" />
            <label className="text-sm font-semibold text-slate-700">
              Select Hotel
            </label>
          </div>
          <select
            value={selectedHotelId}
            onChange={handleHotelSelect}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm font-medium text-slate-900 transition-all bg-white cursor-pointer"
          >
            <option value="">-- Choose a hotel --</option>
            {userHotels.map((hotel) => {
              const hid =
                hotel.partneredHotelId || hotel._id || hotel.id;
              const name = hotel.name || hotel.hotelName;
              const rc = hotel.rooms?.length || 0;
              return (
                <option key={hid} value={hid}>
                  {name} - {rc} room{rc !== 1 ? "s" : ""}
                </option>
              );
            })}
          </select>

          {/* Hotel Info Bar */}
          {selectedHotel && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {selectedHotel.location && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-700">
                    {selectedHotel.location}
                  </span>
                </div>
              )}
              {selectedHotel.amenities?.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-medium text-slate-700">
                    {selectedHotel.amenities.length} amenities
                  </span>
                </div>
              )}
              {selectedHotel.discountPercentage > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium text-green-700">
                    {selectedHotel.discountPercentage}% discount
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {selectedHotelId && rooms.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              label: "Total Rooms",
              value: totalRooms,
              color: "text-slate-900",
            },
            {
              label: "Active",
              value: activeRooms,
              color: "text-green-600",
            },
            {
              label: "Maintenance",
              value: maintenanceRooms,
              color: "text-orange-600",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg border border-slate-200 p-5"
            >
              <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Rooms Grid */}
      {selectedHotelId ? (
        loading && rooms.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Rooms Found
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              This hotel doesn't have any rooms yet.
            </p>
            <button
              onClick={handleOpenAddRoomModal}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Add First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => {
              const status = normalizeStatus(room.status);
              const cfg = statusConfig[status] || statusConfig.unknown;
              const StatusIcon = cfg.icon;

              return (
                <motion.div
                  key={room.roomId || room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Room Image */}
                  <RoomImageCarousel images={room.images} />

                  {/* Room Content */}
                  <div className="p-5 space-y-4">
                    {/* Room Type + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg truncate">
                          {room.roomType || "Standard Room"}
                        </h3>
                        {room.roomNumber && (
                          <span className="text-xs text-slate-500">
                            Room #{room.roomNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenImageModal(room)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                          title="Manage Images"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(room)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">
                        ${room.pricePerNight || room.basePrice || "0"}
                      </span>
                      <span className="text-sm text-slate-500">/ night</span>
                    </div>

                    {/* Room Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>
                          {room.capacity || "N/A"} guest
                          {room.capacity !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {room.bedType && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <BedDouble className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{room.bedType}</span>
                        </div>
                      )}
                      {room.size && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{room.size} sqft</span>
                        </div>
                      )}
                      {room.floor && (
                        <div className="text-sm text-slate-600">
                          Floor {room.floor}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {room.description && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {/* Status + Availability */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          room.isAvailable !== false
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                      >
                        {room.isAvailable !== false
                          ? "Available"
                          : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hotel selected
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Select a hotel from the dropdown above or create a new one.
          </p>
          <button
            onClick={() => navigate("/add-hotel")}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Add Hotel
          </button>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddRoomModal(false);
              setRoomValidationError("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Add New Room
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selectedHotel?.name || "Hotel"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomValidationError("");
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form
                onSubmit={handleAddRoom}
                className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]"
              >
                {roomValidationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {roomValidationError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Room Type *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Deluxe Suite"
                      value={roomData.roomType}
                      onChange={(e) =>
                        setRoomData({ ...roomData, roomType: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Room Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 101"
                      value={roomData.roomNumber}
                      onChange={(e) =>
                        setRoomData({
                          ...roomData,
                          roomNumber: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Capacity (Guests) *
                    </label>
                    <input
                      type="number"
                      placeholder="Max guests"
                      value={roomData.capacity}
                      onChange={(e) =>
                        setRoomData({ ...roomData, capacity: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Price Per Night ($) *
                    </label>
                    <input
                      type="number"
                      placeholder="Price"
                      value={roomData.basePrice}
                      onChange={(e) =>
                        setRoomData({ ...roomData, basePrice: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Total Rooms *
                    </label>
                    <input
                      type="number"
                      placeholder="Number of rooms"
                      value={roomData.totalRooms}
                      onChange={(e) =>
                        setRoomData({
                          ...roomData,
                          totalRooms: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={roomData.status}
                      onChange={(e) =>
                        setRoomData({ ...roomData, status: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Floor
                    </label>
                    <input
                      type="number"
                      placeholder="Floor number"
                      value={roomData.floor}
                      onChange={(e) =>
                        setRoomData({ ...roomData, floor: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Size (sqft)
                    </label>
                    <input
                      type="number"
                      placeholder="Room size"
                      value={roomData.size}
                      onChange={(e) =>
                        setRoomData({ ...roomData, size: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Bed Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., King Size"
                      value={roomData.bedType}
                      onChange={(e) =>
                        setRoomData({ ...roomData, bedType: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Availability
                    </label>
                    <select
                      value={roomData.available ? "true" : "false"}
                      onChange={(e) =>
                        setRoomData({
                          ...roomData,
                          available: e.target.value === "true",
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    >
                      <option value="true">Available</option>
                      <option value="false">Not Available</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Room description..."
                    value={roomData.description}
                    onChange={(e) =>
                      setRoomData({
                        ...roomData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRoomModal(false);
                      setRoomValidationError("");
                    }}
                    className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Room"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Room Modal */}
      <AnimatePresence>
        {showEditModal && editingRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEditModal(false);
              setEditingRoom(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Edit Room</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoom(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form
                onSubmit={handleUpdateRoom}
                className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Room Type *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Deluxe Suite"
                      value={editingRoom.roomType || ""}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          roomType: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Room Number
                    </label>
                    <input
                      type="text"
                      placeholder="Room Number"
                      value={editingRoom.roomNumber || ""}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          roomNumber: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Capacity (Guests) *
                    </label>
                    <input
                      type="number"
                      placeholder="Max guests"
                      value={editingRoom.capacity || ""}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          capacity: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Price Per Night ($) *
                    </label>
                    <input
                      type="number"
                      placeholder="Price"
                      value={
                        editingRoom.basePrice ||
                        editingRoom.pricePerNight ||
                        ""
                      }
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          basePrice: e.target.value,
                          pricePerNight: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Floor
                    </label>
                    <input
                      type="number"
                      placeholder="Floor number"
                      value={editingRoom.floor || ""}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          floor: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Size (sqft)
                    </label>
                    <input
                      type="number"
                      placeholder="Room size"
                      value={editingRoom.size || ""}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          size: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Bed Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., King Size"
                      value={editingRoom.bedType || ""}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          bedType: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={editingRoom.status || "ACTIVE"}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Room description..."
                    value={editingRoom.description || ""}
                    onChange={(e) =>
                      setEditingRoom({
                        ...editingRoom,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm transition-all"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingRoom(null);
                    }}
                    className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Room"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && roomToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setRoomToDelete(null);
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
                  Delete Room?
                </h3>
                <p className="text-slate-600 text-sm mb-1">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-900">
                    {roomToDelete.roomType}
                  </span>
                  {roomToDelete.roomNumber &&
                    ` (Room #${roomToDelete.roomNumber})`}
                  ?
                </p>
                <p className="text-xs text-red-500 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRoomToDelete(null);
                  }}
                  className="flex-1 px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Management Modal */}
      <AnimatePresence>
        {showImageModal && selectedRoomForImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowImageModal(false);
              setSelectedRoomForImages(null);
              setImageFile(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Room Images
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selectedRoomForImages.roomType}
                    {selectedRoomForImages.roomNumber &&
                      ` - Room #${selectedRoomForImages.roomNumber}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedRoomForImages(null);
                    setImageFile(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Upload Section */}
                <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-500" />
                    Upload New Image
                  </h3>
                  <form onSubmit={handleUploadImage} className="space-y-3">
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!imageFile || loading}
                      className="w-full px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Uploading..." : "Upload Image"}
                    </button>
                  </form>
                </div>

                {/* Images Gallery */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Current Images (
                    {roomImages[
                      selectedRoomForImages.roomId ||
                        selectedRoomForImages.id
                    ]?.length || 0}
                    )
                  </h3>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-900 border-t-transparent"></div>
                    </div>
                  ) : roomImages[
                      selectedRoomForImages.roomId ||
                        selectedRoomForImages.id
                    ]?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {roomImages[
                        selectedRoomForImages.roomId ||
                          selectedRoomForImages.id
                      ].map((image) => (
                        <div
                          key={image.id || image.imageId}
                          className="relative group bg-slate-100 rounded-lg overflow-hidden aspect-video"
                        >
                          <img
                            src={image.imageUrl || image.url}
                            alt="Room"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() =>
                                handleDeleteImage(
                                  image.id || image.imageId
                                )
                              }
                              className="p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">
                        No images uploaded yet
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => {
                      setShowImageModal(false);
                      setSelectedRoomForImages(null);
                      setImageFile(null);
                    }}
                    className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

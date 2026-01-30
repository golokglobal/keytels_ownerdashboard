import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Upload,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const RoomsManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { hotelRooms, roomImages, loading, error } = useSelector(
    (state) => state.partneredhotels
  );

  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [userHotels, setUserHotels] = useState([]); // All hotels for this user
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedRoomForImages, setSelectedRoomForImages] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Room form state for adding new rooms
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
    status: "available",
    totalRooms: "1", // Default to 1 room
  });

  const [roomValidationError, setRoomValidationError] = useState("");

  // Load all user hotels and auto-select first hotel
  useEffect(() => {
    console.log("🏨 Rooms Management - Component mounted");

    const loadAllHotels = async () => {
      // Get all hotel IDs from localStorage
      let hotelIds = JSON.parse(localStorage.getItem("hotelIds") || "[]");

      // Migration: If no hotelIds but currentHotelId exists, migrate it
      if (hotelIds.length === 0) {
        const currentHotelId = localStorage.getItem("currentHotelId");
        if (currentHotelId) {
          console.log("🔄 Migrating currentHotelId to hotelIds array:", currentHotelId);
          hotelIds = [currentHotelId];
          localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
        }
      }

      if (hotelIds.length === 0) {
        console.log("⚠️ No hotel IDs found in localStorage");
        setUserHotels([]);
        return;
      }

      try {
        // Fetch all hotels
        const hotelPromises = hotelIds.map(id =>
          dispatch(fetchHotelById(id)).unwrap()
        );
        const loadedHotels = await Promise.all(hotelPromises);
        const validHotels = loadedHotels.filter(Boolean);

        console.log("✅ Loaded all hotels:", validHotels);
        setUserHotels(validHotels);

        // Auto-select first hotel if none selected
        if (validHotels.length > 0) {
          const firstHotelId = validHotels[0].partneredHotelId || validHotels[0]._id || validHotels[0].id;
          setSelectedHotelId(firstHotelId);
          setSelectedHotel(validHotels[0]);
          console.log("✅ Auto-selected first hotel:", validHotels[0].name);
        }
      } catch (error) {
        console.error("❌ Failed to load hotels:", error);
        toast.error("Failed to load hotels");
      }
    };

    loadAllHotels();

    return () => {
      dispatch(clearSelectedHotel());
    };
  }, [dispatch]);

  // Handle hotel selection from dropdown
  const handleHotelSelect = async (e) => {
    const hotelId = e.target.value;
    console.log("🏨 Selected Hotel ID:", hotelId);

    if (!hotelId) {
      setSelectedHotelId("");
      setSelectedHotel(null);
      return;
    }

    setSelectedHotelId(hotelId);

    // Find hotel in userHotels first (to avoid unnecessary API call)
    const foundHotel = userHotels.find(h =>
      (h.partneredHotelId || h._id || h.id) === hotelId
    );

    if (foundHotel) {
      console.log("✅ Hotel found in cache:", foundHotel);
      setSelectedHotel(foundHotel);
      toast.success(`Switched to: ${foundHotel.name || foundHotel.hotelName}`);
    } else {
      // Fallback: Fetch hotel by ID if not in cache
      console.log("🛏️ Fetching hotel with rooms:", hotelId);
      try {
        const hotelData = await dispatch(fetchHotelById(hotelId)).unwrap();
        console.log("✅ Hotel data received:", hotelData);
        setSelectedHotel(hotelData);
        toast.success(`Loaded hotel: ${hotelData.name || hotelData.hotelName}`);
      } catch (error) {
        console.error("❌ Failed to fetch hotel:", error);
        toast.error("Failed to load hotel details");
      }
    }
  };

  // Handle open add room modal
  const handleOpenAddRoomModal = () => {
    if (!selectedHotelId) {
      toast.error("Please select a hotel first");
      return;
    }
    console.log("➕ Opening Add Room Modal for hotel:", selectedHotelId);
    setShowAddRoomModal(true);
    // Reset room data
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
      status: "available",
    });
    setRoomValidationError("");
  };

  // Handle add room
  const handleAddRoom = async (e) => {
    e.preventDefault();

    console.log("➕ ADD ROOM HANDLER CALLED");
    console.log("Room data:", roomData);

    if (!roomData.roomType || !roomData.capacity || !roomData.basePrice) {
      setRoomValidationError("Room type, capacity and price are required.");
      return;
    }

    if (!selectedHotelId) {
      toast.error("No hotel selected");
      return;
    }

    // Declare createData outside try block to make it available in catch block
    let createData = null;

    try {
      // Match the exact format that works in Postman
      createData = {
        roomType: roomData.roomType,
        capacity: Number(roomData.capacity),
        pricePerNight: Number(roomData.basePrice),
        isAvailable: roomData.available ?? true,
        description: roomData.description || "",
        totalRooms: Number(roomData.totalRooms) || 1, // REQUIRED by backend
      };

      // Only add optional fields if they have values (backend might reject empty strings)
      if (roomData.size) createData.size = roomData.size;
      if (roomData.bedType) createData.bedType = roomData.bedType;
      if (roomData.roomNumber) createData.roomNumber = roomData.roomNumber;
      if (roomData.floor) createData.floor = roomData.floor;
      if (roomData.status) createData.status = roomData.status;

      console.log("📤 Creating room for hotel ID:", selectedHotelId, "with data:", createData);

      const result = await dispatch(
        createHotelRoom({
          hotelId: selectedHotelId,
          data: createData,
        })
      ).unwrap();

      console.log("✅ Room creation result:", result);

      toast.success("Room added successfully!");
      setShowAddRoomModal(false);
      setRoomValidationError("");

      // Reset form
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
        status: "available",
        totalRooms: "1",
      });

      // Refresh hotel data (includes rooms)
      console.log("🔄 Refreshing hotel data:", selectedHotelId);
      const updatedHotel = await dispatch(fetchHotelById(selectedHotelId)).unwrap();
      setSelectedHotel(updatedHotel);
    } catch (error) {
      console.error("❌ Failed to create room:", error);
      console.error("Error details:", error);

      // Extract detailed error message
      let errorMessage = "Failed to create room";

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      console.error("📋 Detailed error for debugging:", {
        message: errorMessage,
        hotelId: selectedHotelId,
        requestData: createData,
        fullError: error
      });
    }
  };

  // Handle edit room
  const handleEditRoom = (room) => {
    console.log("✏️ Editing room:", room);
    setEditingRoom({ ...room });
    setShowEditModal(true);
  };

  // Handle update room
  const handleUpdateRoom = async (e) => {
    e.preventDefault();

    console.log("🔄 UPDATE ROOM HANDLER CALLED");
    console.log("Editing room data:", editingRoom);

    // Support both 'id' and 'roomId' field names
    const roomId = editingRoom?.roomId || editingRoom?.id;

    if (!roomId) {
      console.error("❌ No room ID found:", editingRoom);
      toast.error("Invalid room ID");
      return;
    }

    try {
      // Match the exact format that works in Postman
      const updateData = {
        roomType: editingRoom.roomType,
        capacity: Number(editingRoom.capacity),
        pricePerNight: Number(editingRoom.basePrice || editingRoom.pricePerNight),
        isAvailable: editingRoom.available ?? true,
        description: editingRoom.description || "",
      };

      // Only add optional fields if they have values (backend might reject empty strings)
      if (editingRoom.size) updateData.size = editingRoom.size;
      if (editingRoom.bedType) updateData.bedType = editingRoom.bedType;
      if (editingRoom.roomNumber) updateData.roomNumber = editingRoom.roomNumber;
      if (editingRoom.floor) updateData.floor = editingRoom.floor;
      if (editingRoom.status) updateData.status = editingRoom.status;

      console.log("📤 Updating room ID:", roomId, "with data:", updateData);

      const result = await dispatch(updateHotelRoom({
        roomId: roomId,
        data: updateData
      })).unwrap();

      console.log("✅ Room update result:", result);

      toast.success("Room updated successfully!");
      setShowEditModal(false);
      setEditingRoom(null);

      // Refresh hotel data (includes rooms)
      if (selectedHotelId) {
        console.log("🔄 Refreshing hotel data:", selectedHotelId);
        const updatedHotel = await dispatch(fetchHotelById(selectedHotelId)).unwrap();
        setSelectedHotel(updatedHotel);
      }
    } catch (error) {
      console.error("❌ Failed to update room:", error);
      console.error("Error details:", error);

      // Extract detailed error message
      let errorMessage = "Failed to update room";

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      console.error("📋 Detailed error for debugging:", {
        message: errorMessage,
        roomId: roomId,
        requestData: updateData,
        fullError: error
      });
    }
  };

  // Handle delete room confirmation
  const handleDeleteClick = (room) => {
    console.log("🗑️ Preparing to delete room:", room);
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  // Handle delete room
  const handleDeleteRoom = async () => {
    // Support both 'id' and 'roomId' field names
    const roomId = roomToDelete?.roomId || roomToDelete?.id;

    if (!roomId) {
      console.error("❌ No room ID found in:", roomToDelete);
      toast.error("Invalid room ID");
      return;
    }

    console.log("🔄 Deleting room ID:", roomId);
    console.log("Room to delete object:", roomToDelete);

    try {
      const result = await dispatch(deleteHotelRoom(roomId)).unwrap();
      console.log("✅ Room delete result:", result);

      toast.success("Room deleted successfully!");
      setShowDeleteModal(false);
      setRoomToDelete(null);

      // Refresh hotel data (includes rooms)
      if (selectedHotelId) {
        console.log("🔄 Refreshing hotel data:", selectedHotelId);
        const updatedHotel = await dispatch(fetchHotelById(selectedHotelId)).unwrap();
        setSelectedHotel(updatedHotel);
      }
    } catch (error) {
      console.error("❌ Failed to delete room:", error);
      console.error("Error details:", error);

      // Extract detailed error message
      let errorMessage = "Failed to delete room";

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      console.error("📋 Detailed error for debugging:", {
        message: errorMessage,
        roomId: roomId,
        fullError: error
      });
    }
  };

  // Handle open image modal
  const handleOpenImageModal = async (room) => {
    const roomId = room.roomId || room.id;
    console.log("🖼️ Opening image modal for room:", roomId);
    setSelectedRoomForImages(room);
    setShowImageModal(true);

    // Fetch images for this room
    try {
      await dispatch(fetchRoomImages(roomId)).unwrap();
    } catch (error) {
      console.error("❌ Failed to fetch room images:", error);
      toast.error("Failed to load room images");
    }
  };

  // Handle upload image
  const handleUploadImage = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      toast.error("Please select an image file");
      return;
    }

    const roomId = selectedRoomForImages?.roomId || selectedRoomForImages?.id;
    if (!roomId) {
      toast.error("Invalid room ID");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      console.log("📤 Uploading image for room ID:", roomId);
      await dispatch(uploadRoomImage({ roomId, formData })).unwrap();

      toast.success("Image uploaded successfully!");
      setImageFile(null);

      // Reset file input
      const fileInput = document.getElementById("image-upload-input");
      if (fileInput) fileInput.value = "";

      // Refresh images
      await dispatch(fetchRoomImages(roomId)).unwrap();
    } catch (error) {
      console.error("❌ Failed to upload image:", error);
      toast.error(error.message || "Failed to upload image");
    }
  };

  // Handle delete image
  const handleDeleteImage = async (imageId) => {
    const roomId = selectedRoomForImages?.roomId || selectedRoomForImages?.id;

    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting image ID:", imageId);
      await dispatch(deleteRoomImage({ imageId, roomId })).unwrap();
      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("❌ Failed to delete image:", error);
      toast.error(error.message || "Failed to delete image");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <BedDouble className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Rooms Management
                </h1>
              </div>
              <p className="text-slate-600 text-lg ml-16">
                Manage rooms across all your hotels
              </p>
            </div>
            <div className="flex gap-3">
              {/* Show Add New Room button if hotel is selected */}
              {selectedHotelId ? (
                <button
                  onClick={handleOpenAddRoomModal}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Add New Room
                </button>
              ) : (
                <button
                  onClick={() => navigate("/add-hotel")}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all shadow-md"
                >
                  <Building2 className="w-5 h-5" />
                  Add New Hotel
                </button>
              )}
            </div>
          </div>

          {/* Hotel Selection Dropdown - Integrated in Header */}
          {userHotels.length > 0 && (
            <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-100">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <label className="text-sm font-bold text-slate-800">
                  Select Hotel to Manage
                </label>
              </div>
              <select
                value={selectedHotelId}
                onChange={handleHotelSelect}
                className="w-full px-4 py-3.5 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 outline-none font-semibold text-slate-900 transition-all bg-white hover:border-indigo-300 cursor-pointer shadow-sm"
              >
                <option value="" className="text-slate-500">-- Choose a hotel --</option>
                {userHotels.map((hotel) => {
                  const hotelId = hotel.partneredHotelId || hotel._id || hotel.id;
                  const hotelName = hotel.name || hotel.hotelName;
                  const roomCount = hotel.rooms?.length || 0;
                  return (
                    <option key={hotelId} value={hotelId} className="font-semibold">
                      {hotelName} • {roomCount} room{roomCount !== 1 ? 's' : ''}
                    </option>
                  );
                })}
              </select>
              {selectedHotel && (
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-100 rounded-lg border border-indigo-200">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-indigo-900">
                      {selectedHotel.city}, {selectedHotel.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 rounded-lg border border-purple-200">
                    <BedDouble className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">
                      {hotelRooms.length} room{hotelRooms.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-pink-100 rounded-lg border border-pink-200">
                      <Sparkles className="w-4 h-4 text-pink-600" />
                      <span className="font-medium text-pink-900">
                        {selectedHotel.amenities.length} amenities
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Rooms Display */}
        {selectedHotelId ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                  <BedDouble className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Room Details
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : hotelRooms.length === 0 ? (
              <div className="text-center py-20">
                <BedDouble className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No Rooms Found
                </h3>
                <p className="text-slate-500 mb-6">
                  This hotel doesn't have any rooms yet.
                </p>
                <button
                  onClick={handleOpenAddRoomModal}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Add First Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotelRooms.map((room) => (
                  <div
                    key={room.roomId || room.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-300"
                  >
                    {/* Room Header with Gradient Background */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
                      <div className="relative flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {room.roomType || "Standard Room"}
                          </h3>
                          {room.roomNumber && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg backdrop-blur-sm">
                              <span className="text-xs font-bold text-white">
                                Room #{room.roomNumber}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Quick Actions */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenImageModal(room)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                            title="Manage Images"
                          >
                            <ImageIcon className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                            title="Edit Room"
                          >
                            <Edit className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(room)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="p-5 space-y-4">
                      {/* Price Highlight */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-green-700 font-medium">Price per night</p>
                              <p className="text-2xl font-black text-green-600">
                                ${room.pricePerNight || room.basePrice || "0"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Capacity */}
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-900">Guests</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {room.capacity || room.maxGuests || "N/A"}
                          </p>
                        </div>

                        {/* Bed Type */}
                        {room.bedType && (
                          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <BedDouble className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-900">Bed</span>
                            </div>
                            <p className="text-sm font-bold text-purple-600 truncate">
                              {room.bedType}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-2">
                        {room.size && (
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 rounded-lg p-2">
                            <Building2 className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium">{room.size} sqft</span>
                          </div>
                        )}

                        {room.floor && (
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 rounded-lg p-2">
                            <span className="text-sm font-medium">Floor {room.floor}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      {room.status && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">Status</span>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                              room.status === "available"
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                                : room.status === "occupied"
                                ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200"
                                : "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200"
                            }`}
                          >
                            {room.status === "available" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {room.description && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {room.description}
                          </p>
                        </div>
                      )}

                      {/* Amenities - Display hotel amenities */}
                      {selectedHotel?.amenities && selectedHotel.amenities.length > 0 && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Hotel Amenities</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedHotel.amenities.slice(0, 4).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100"
                              >
                                {amenity}
                              </span>
                            ))}
                            {selectedHotel.amenities.length > 4 && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                +{selectedHotel.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-700 mb-2">
              No hotel selected
            </h3>
            <p className="text-slate-500 mb-6">
              Please select a hotel from the dropdown above or create a new one
            </p>
            <button
              onClick={() => navigate("/add-hotel")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Add New Hotel
            </button>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Add New Room</h2>
                  <p className="text-green-100 text-sm mt-1">
                    {selectedHotel?.name || "Hotel"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomValidationError("");
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddRoom} className="p-8 space-y-6">
              {roomValidationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  {roomValidationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 101"
                    value={roomData.roomNumber}
                    onChange={(e) =>
                      setRoomData({ ...roomData, roomNumber: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Room Type *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Deluxe Suite"
                    value={roomData.roomType}
                    onChange={(e) =>
                      setRoomData({ ...roomData, roomType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Capacity (Guests) *
                  </label>
                  <input
                    type="number"
                    placeholder="Max Guests"
                    value={roomData.capacity}
                    onChange={(e) =>
                      setRoomData({ ...roomData, capacity: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Price Per Night ($) *
                  </label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={roomData.basePrice}
                    onChange={(e) =>
                      setRoomData({ ...roomData, basePrice: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Total Rooms *
                  </label>
                  <input
                    type="number"
                    placeholder="Number of rooms"
                    value={roomData.totalRooms}
                    onChange={(e) =>
                      setRoomData({ ...roomData, totalRooms: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={roomData.status}
                    onChange={(e) =>
                      setRoomData({ ...roomData, status: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Floor
                  </label>
                  <input
                    type="number"
                    placeholder="Floor Number"
                    value={roomData.floor}
                    onChange={(e) =>
                      setRoomData({ ...roomData, floor: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Size (sqft)
                  </label>
                  <input
                    type="number"
                    placeholder="Room Size"
                    value={roomData.size}
                    onChange={(e) =>
                      setRoomData({ ...roomData, size: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Bed Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., King Size"
                    value={roomData.bedType}
                    onChange={(e) =>
                      setRoomData({ ...roomData, bedType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={roomData.available ? "true" : "false"}
                    onChange={(e) =>
                      setRoomData({ ...roomData, available: e.target.value === "true" })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                  >
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Room description..."
                  value={roomData.description}
                  onChange={(e) =>
                    setRoomData({ ...roomData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setRoomValidationError("");
                  }}
                  className="px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && editingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Edit Room</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoom(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateRoom} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="Room Number"
                    value={editingRoom.roomNumber || ""}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Room Type *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Deluxe Suite"
                    value={editingRoom.roomType || ""}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, roomType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Capacity (Guests) *
                  </label>
                  <input
                    type="number"
                    placeholder="Max Guests"
                    value={editingRoom.capacity || ""}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, capacity: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Price Per Night ($) *
                  </label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={editingRoom.basePrice || editingRoom.pricePerNight || ""}
                    onChange={(e) =>
                      setEditingRoom({
                        ...editingRoom,
                        basePrice: e.target.value,
                        pricePerNight: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Floor
                  </label>
                  <input
                    type="number"
                    placeholder="Floor Number"
                    value={editingRoom.floor || ""}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, floor: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Size (sqft)
                  </label>
                  <input
                    type="number"
                    placeholder="Room Size"
                    value={editingRoom.size || ""}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, size: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Bed Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., King Size"
                    value={editingRoom.bedType || ""}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, bedType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingRoom.status || "available"}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, status: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Room description..."
                  value={editingRoom.description || ""}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Delete Room?
              </h3>
              <p className="text-slate-600 mb-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900">
                  {roomToDelete.roomType}
                </span>
                {roomToDelete.roomNumber && ` (Room #${roomToDelete.roomNumber})`}?
              </p>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRoomToDelete(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {showImageModal && selectedRoomForImages && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Manage Room Images</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    {selectedRoomForImages.roomType} {selectedRoomForImages.roomNumber && `- Room #${selectedRoomForImages.roomNumber}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedRoomForImages(null);
                    setImageFile(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Upload Section */}
              <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  Upload New Image
                </h3>
                <form onSubmit={handleUploadImage} className="space-y-4">
                  <div>
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!imageFile || loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Uploading..." : "Upload Image"}
                  </button>
                </form>
              </div>

              {/* Images Gallery */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Current Images ({roomImages[selectedRoomForImages.roomId || selectedRoomForImages.id]?.length || 0})
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                  </div>
                ) : roomImages[selectedRoomForImages.roomId || selectedRoomForImages.id]?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {roomImages[selectedRoomForImages.roomId || selectedRoomForImages.id].map((image) => (
                      <div
                        key={image.id || image.imageId}
                        className="relative group bg-slate-100 rounded-xl overflow-hidden aspect-video"
                      >
                        <img
                          src={image.imageUrl || image.url}
                          alt="Room"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteImage(image.id || image.imageId)}
                            className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No images uploaded yet</p>
                    <p className="text-sm text-slate-400 mt-2">Upload your first image using the form above</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedRoomForImages(null);
                    setImageFile(null);
                  }}
                  className="px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
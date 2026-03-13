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
  CreditCard,
  Trash2,
  Edit,
  Plus,
  Image as ImageIcon,
  Globe,
  Tag,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/common/ConfirmModal";

export const AddHotel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const isUpdateMode = !!hotelId;

  const { loading, error, selectedHotel } = useSelector(
    (state) => state.partneredhotels
  );

  /* -------------------------------------------------------------------------- */
  /*                                  STATE                                     */
  /* -------------------------------------------------------------------------- */

  const [formData, setFormData] = useState({
    hotelName: "",
    description: "",
    location: "",
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: "",
    longitude: "",
    discountPercent: "",
    status: "ACTIVE",
    amenities: [],
    hotelImages: [],
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
    stripeAccountId: "",
    payoutPreference: "bank",
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

  /* -------------------------------------------------------------------------- */
  /*                               FETCH FOR EDIT                               */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (isUpdateMode) {
      console.log("🔄 Update mode - Fetching hotel ID:", hotelId);
      dispatch(fetchHotelById(hotelId));
    }
    return () => dispatch(clearHotelError());
  }, [dispatch, hotelId, isUpdateMode]);

  useEffect(() => {
    // Only populate the form once on initial load.
    // Subsequent selectedHotel updates (e.g. after room ops) only refresh existingRooms
    // so user-entered values like hotelImages are never wiped.
    if (isUpdateMode && selectedHotel) {
      setExistingRooms(selectedHotel.rooms || []);

      if (formPopulated.current) return;
      formPopulated.current = true;

      const locationParts = selectedHotel.location ? selectedHotel.location.split(",").map(s => s.trim()) : [];
      let parsedAddress = "";
      let parsedCity = "";
      let parsedState = "";

      if (locationParts.length === 3) {
        parsedAddress = locationParts[0];
        parsedCity = locationParts[1];
        parsedState = locationParts[2];
      } else if (locationParts.length === 2) {
        parsedCity = locationParts[0];
        parsedState = locationParts[1];
      } else if (locationParts.length === 1) {
        parsedAddress = locationParts[0];
      }

      setFormData({
        hotelName: selectedHotel.name || "",
        description: selectedHotel.description || "",
        location: selectedHotel.location || "",
        address: parsedAddress || "",
        city: parsedCity || selectedHotel.city || "",
        state: parsedState || selectedHotel.state || "",
        country: selectedHotel.country || "",
        latitude: selectedHotel.latitude || "",
        longitude: selectedHotel.longitude || "",
        discountPercent: selectedHotel.discountPercentage || "",
        status: selectedHotel.status || "ACTIVE",
        amenities: selectedHotel.amenities || [],
        hotelImages: selectedHotel.hotelImages || [],
        ownerFirstName: selectedHotel.owner?.firstName || "",
        ownerLastName: selectedHotel.owner?.lastName || "",
        ownerEmail: selectedHotel.owner?.email || "",
        ownerPhone: selectedHotel.owner?.phoneNumber || "",
        stripeAccountId: selectedHotel.owner?.stripeAccountId || "",
        payoutPreference: selectedHotel.owner?.payoutPreference || "bank",
        rooms: [],
      });
    }
  }, [selectedHotel, isUpdateMode]);

  /* -------------------------------------------------------------------------- */
  /*                                 HANDLERS                                   */
  /* -------------------------------------------------------------------------- */

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (updateSuccess) setUpdateSuccess(null);
  };

  const handleAddAmenity = () => {
    const value = amenityInput.trim();
    if (!value || formData.amenities.includes(value)) return;

    setFormData((prev) => ({
      ...prev,
      amenities: [...prev.amenities, value],
    }));
    setAmenityInput("");
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  const handleAddHotelImage = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      hotelImages: [...prev.hotelImages, { imageUrl: url }],
    }));
    setImageUrlInput("");
  };

  const handleRemoveHotelImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      hotelImages: prev.hotelImages.filter((_, i) => i !== index),
    }));
  };

  const handleAddRoom = () => {
    if (!roomData.roomType || !roomData.capacity || !roomData.basePrice) {
      setRoomValidationError("Room type, capacity and price are required.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          ...roomData,
          capacity: Number(roomData.capacity),
          basePrice: Number(roomData.basePrice),
          id: Date.now(),
        },
      ],
    }));

    setRoomData({
      roomType: "",
      capacity: "",
      basePrice: "",
      available: true,
      description: "",
      size: "",
      bedType: "",
      images: [],
    });

    setRoomValidationError("");
  };

  const handleRemoveRoom = (roomId) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
    }));
  };

  const handleDeleteHotel = () => {
    setConfirmDeleteHotel(true);
  };

  const confirmHotelDelete = async () => {
    setConfirmDeleteHotel(false);
    try {
      await dispatch(deleteHotel(hotelId)).unwrap();
      toast.success("Hotel deleted successfully");
      navigate("/hotels");
    } catch (error) {
      console.error("Failed to delete hotel:", error);
      toast.error("Failed to delete hotel");
    }
  };

  const handleEditExistingRoom = (room) => {
    console.log("✏️ EDIT ROOM HANDLER CALLED");
    console.log("Room to edit:", room);
    setEditingRoom({ ...room });
    setShowEditModal(true);
  };

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
      const updateData = {
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
      };

      console.log("📤 Updating room ID:", roomId, "with data:", updateData);

      const result = await dispatch(
        updateHotelRoom({
          roomId: roomId,
          data: updateData,
        })
      ).unwrap();

      console.log("✅ Room update result:", result);

      toast.success("Room updated successfully");

      // Refresh hotel data to get updated rooms
      await dispatch(fetchHotelById(hotelId)).unwrap().catch(() => {});

      setShowEditModal(false);
      setEditingRoom(null);
    } catch (error) {
      console.error("❌ Failed to update room:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error(error.message || "Failed to update room");
    }
  };

  const handleDeleteExistingRoom = (roomId) => {
    console.log("🗑️ DELETE ROOM HANDLER CALLED - Room ID:", roomId);
    setConfirmDeleteRoom({ open: true, roomId });
  };

  const confirmRoomDelete = async () => {
    const { roomId } = confirmDeleteRoom;
    setConfirmDeleteRoom({ open: false, roomId: null });

    if (!roomId) {
      console.error("❌ No room ID provided");
      toast.error("Invalid room ID");
      return;
    }

    try {
      console.log("📤 Deleting room ID:", roomId);
      const result = await dispatch(deleteHotelRoom(roomId)).unwrap();
      console.log("✅ Room delete result:", result);

      toast.success("Room deleted successfully");

      // Update local state - check both roomId and id fields
      setExistingRooms((prev) => prev.filter((r) => (r.roomId || r.id) !== roomId));

      // Optionally refresh hotel data
      if (hotelId) {
        await dispatch(fetchHotelById(hotelId)).unwrap().catch(() => {});
      }
    } catch (error) {
      console.error("❌ Failed to delete room:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error(error.message || "Failed to delete room");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   SUBMIT                                   */
  /* -------------------------------------------------------------------------- */

  const onSubmit = async (e) => {
    e.preventDefault();

    console.log("=== FORM SUBMISSION STARTED ===");

    if (!isUpdateMode && formData.rooms.length === 0) {
      console.error("Validation failed: No rooms added");
      toast.error("Please add at least one room.");
      return;
    }

    console.log("Total new rooms to create:", formData.rooms.length);

    setSubmitting(true);

    const locationStr = isUpdateMode
      ? (formData.location || [formData.address, formData.city, formData.state].filter(Boolean).join(", "))
      : [formData.address, formData.city, formData.state].filter(Boolean).join(", ");

    // Auto-include any URL still sitting in the image input box
    const pendingImages = imageUrlInput.trim()
      ? [...formData.hotelImages, { imageUrl: imageUrlInput.trim() }]
      : formData.hotelImages;
    if (imageUrlInput.trim()) setImageUrlInput("");

    const dataToSend = {
      name: formData.hotelName,
      description: formData.description,
      location: locationStr,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      isPartnered: true,
      discountPercentage: parseFloat(formData.discountPercent) || 0,
      status: formData.status || "ACTIVE",
      amenities: formData.amenities,
      hotelImages: pendingImages,
    };

    if (!isUpdateMode) {
      dataToSend.city = formData.city;
      dataToSend.state = formData.state;
      dataToSend.country = formData.country;
      dataToSend.owner = {
        firstName: formData.ownerFirstName,
        lastName: formData.ownerLastName,
        email: formData.ownerEmail,
        phoneNumber: formData.ownerPhone || "+15551234567",
        stripeAccountId: formData.stripeAccountId,
        payoutPreference: formData.payoutPreference,
      };
    }

    if (!isUpdateMode) {
      dataToSend.rooms = formData.rooms.map((room) => ({
        roomType: room.roomType,
        capacity: Number(room.capacity),
        pricePerNight: Number(room.basePrice),
        isAvailable: room.available ?? true,
        description: room.description || "",
        size: room.size || "",
        bedType: room.bedType || "",
        images: room.images || [],
      }));
    }

    console.log("📤 DATA TO SEND:", JSON.stringify(dataToSend, null, 2));

    try {
      if (isUpdateMode) {
        console.log("🔄 UPDATE MODE - Hotel ID:", hotelId);

        const result = await /** @type {Promise<any>} */ (dispatch(updateHotel({ hotelId, data: dataToSend })));

        console.log("📥 UPDATE RESULT:", result);

        if (result.meta.requestStatus === "fulfilled") {
          console.log("✅ Hotel updated successfully");

          let successMsg = "Hotel updated successfully!";

          if (formData.rooms.length > 0) {
            const roomPromises = formData.rooms.map((room) =>
              dispatch(
                createHotelRoom({
                  hotelId: hotelId,
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
                })
              )
            );

            const roomResults = await Promise.all(roomPromises);
            const successfulRooms = roomResults.filter(
              (r) => r.meta.requestStatus === "fulfilled"
            );
            const failedRooms = roomResults.filter(
              (r) => r.meta.requestStatus === "rejected"
            );

            if (failedRooms.length > 0) {
              successMsg = `Hotel updated! ${successfulRooms.length} room(s) added, ${failedRooms.length} failed.`;
            } else {
              successMsg = `Hotel updated and ${successfulRooms.length} new room(s) added!`;
            }

            // Refresh rooms list
            await dispatch(fetchHotelById(hotelId)).unwrap().catch(() => {});
            setFormData((prev) => ({ ...prev, rooms: [] }));
          }

          localStorage.setItem("currentHotelId", hotelId);
          setUpdateSuccess(successMsg);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          console.error("❌ Update failed:", result);
          throw new Error(result.error?.message || "Failed to update hotel");
        }
      } else {
        console.log("🆕 CREATE MODE - Creating new hotel with rooms");

        const hotelResult = await /** @type {Promise<any>} */ (dispatch(createHotel(dataToSend)));

        console.log("📥 CREATE HOTEL RESULT:", hotelResult);
        console.log(
          "📥 FULL RESPONSE PAYLOAD:",
          JSON.stringify(hotelResult.payload, null, 2)
        );

        if (hotelResult.meta.requestStatus === "fulfilled") {
          const createdHotel = hotelResult.payload;
          console.log("✅ Hotel created successfully!");
          console.log("🏨 Created Hotel Object:", createdHotel);

          const createdHotelId =
            createdHotel.partneredHotelId || createdHotel.id || createdHotel.hotelId;

          console.log("🔑 Extracted Hotel ID:", createdHotelId);

          if (!createdHotelId) {
            console.error("❌ No hotel ID found in response");
            console.error("Available keys:", Object.keys(createdHotel));
            throw new Error("Hotel created but ID not found in response");
          }

          if (createdHotel.rooms && createdHotel.rooms.length > 0) {
            console.log("✅ Rooms were created WITH the hotel!");
            console.log("🛏️ Rooms in response:", createdHotel.rooms);
            console.log("Number of rooms created:", createdHotel.rooms.length);

            // Store the hotel ID in the list of all hotel IDs
            const hotelIds = JSON.parse(localStorage.getItem("hotelIds") || "[]");
            if (!hotelIds.includes(createdHotelId)) {
              hotelIds.push(createdHotelId);
              localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
            }
            // Also store as current hotel for Rooms page
            localStorage.setItem("currentHotelId", createdHotelId);

            toast.success("Hotel and rooms created successfully!");
            navigate("/rooms");
          } else {
            console.warn("⚠️ Rooms NOT in hotel response, creating separately...");
            console.log("Rooms field in response:", createdHotel.rooms);

            console.log("🛏️ Starting separate room creation...");
            const roomPromises = formData.rooms.map((room, index) => {
              console.log(
                `📤 Creating room ${index + 1}/${formData.rooms.length}:`,
                {
                  hotelId: createdHotelId,
                  roomData: room,
                }
              );

              return dispatch(
                createHotelRoom({
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
                })
              ).then((result) => {
                console.log(`📥 Room ${index + 1} creation result:`, result);
                return result;
              });
            });

            console.log("⏳ Waiting for all room creation promises...");
            const roomResults = await Promise.all(roomPromises);

            console.log("📥 ALL ROOM RESULTS:", roomResults);

            const successfulRooms = roomResults.filter(
              (result) => result.meta.requestStatus === "fulfilled"
            );
            const failedRooms = roomResults.filter(
              (result) => result.meta.requestStatus === "rejected"
            );

            console.log(`✅ Successful rooms: ${successfulRooms.length}`);
            console.log(`❌ Failed rooms: ${failedRooms.length}`);

            if (successfulRooms.length > 0) {
              console.log(
                "Successful room details:",
                successfulRooms.map((r) => r.payload)
              );
            }

            if (failedRooms.length > 0) {
              console.error(
                "❌ Failed room details:",
                failedRooms.map((r) => ({
                  error: r.error,
                  meta: r.meta,
                }))
              );

              toast.success(
                `Hotel created successfully! ${successfulRooms.length} room(s) created. ${failedRooms.length} room(s) failed. Check console for details.`
              );
            } else {
              console.log("🎉 All rooms created successfully!");
              toast.success(
                `Hotel and all ${successfulRooms.length} rooms created successfully!`
              );
            }

            // Store the hotel ID in the list of all hotel IDs
            const hotelIds = JSON.parse(localStorage.getItem("hotelIds") || "[]");
            if (!hotelIds.includes(createdHotelId)) {
              hotelIds.push(createdHotelId);
              localStorage.setItem("hotelIds", JSON.stringify(hotelIds));
            }
            // Also store as current hotel for Rooms page
            localStorage.setItem("currentHotelId", createdHotelId);

            navigate("/rooms");
          }
        } else {
          console.error("❌ Hotel creation failed:", hotelResult);
          console.error("Error details:", hotelResult.error);
          throw new Error(hotelResult.error?.message || "Failed to create hotel");
        }
      }

      console.log("=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===");
    } catch (error) {
      console.error("❌ ERROR DURING SUBMISSION:", error);
      console.error("Error stack:", error.stack);
      toast.error(`Failed to save hotel: ${error.message || "Please try again."}`);
    } finally {
      setSubmitting(false);
      console.log("=== FORM SUBMISSION ENDED ===");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  // For update mode (already registered hotel), show full hotel edit form
  if (isUpdateMode && selectedHotel) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Edit Hotel</h1>
              <p className="text-slate-500 mt-1 text-sm">Update hotel details and manage rooms</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteHotel}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Hotel
            </button>
          </div>

          {updateSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-800 text-sm">Changes saved</p>
                <p className="text-green-700 text-sm mt-0.5">{updateSuccess}</p>
              </div>
              <button
                type="button"
                onClick={() => setUpdateSuccess(null)}
                className="text-green-500 hover:text-green-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* BASIC INFO */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-3">
              <Info className="w-4 h-4 text-slate-500" /> Basic Information
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hotel Name *</label>
              <input
                name="hotelName"
                placeholder="e.g. Mountain Vista Retreat"
                value={formData.hotelName}
                onChange={handleFormChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
              <textarea
                name="description"
                placeholder="Describe the hotel..."
                value={formData.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 resize-none"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Discount %</label>
                <input
                  name="discountPercent"
                  type="number"
                  placeholder="0"
                  value={formData.discountPercent}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            {/* Status badge preview */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${formData.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
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
                  placeholder="e.g. wifi, pool, spa"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium capitalize"
                    >
                      {amenity}
                      <button type="button" onClick={() => handleRemoveAmenity(amenity)}>
                        <X size={12} className="hover:text-red-500 transition-colors" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* LOCATION */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-slate-500" /> Location
            </div>

            <LocationPicker
              value={{
                location: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
              }}
              onChange={({ location, latitude, longitude }) =>
                setFormData((prev) => ({ ...prev, location, latitude, longitude }))
              }
            />

            {/* Manual overrides */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 39.1911"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. -106.8175"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location String</label>
              <input
                name="location"
                placeholder="e.g. Aspen, Colorado, USA"
                value={formData.location}
                onChange={handleFormChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
              <p className="text-xs text-slate-400">Auto-filled from map selection, or edit manually</p>
            </div>
          </section>

          {/* HOTEL IMAGES */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-3">
              <ImageIcon className="w-4 h-4 text-slate-500" /> Hotel Images
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL and press Enter or click +"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHotelImage())}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text").trim();
                  if (pasted) {
                    e.preventDefault();
                    setFormData((prev) => ({
                      ...prev,
                      hotelImages: [...prev.hotelImages, { imageUrl: pasted }],
                    }));
                    setImageUrlInput("");
                    if (updateSuccess) setUpdateSuccess(null);
                  }
                }}
                className={`flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-colors ${
                  imageUrlInput ? "border-blue-400 focus:border-blue-500" : "border-slate-200 focus:border-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={handleAddHotelImage}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  imageUrlInput
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.hotelImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {formData.hotelImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img
                      src={img.imageUrl}
                      alt={`Hotel image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHotelImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{img.imageUrl}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No images added yet</p>
              </div>
            )}
          </section>

          {/* EXISTING ROOMS */}
          {existingRooms.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <BedDouble className="w-4 h-4 text-slate-500" /> Rooms ({existingRooms.length})
                </div>
              </div>
              <div className="space-y-3">
                {existingRooms.map((room) => {
                  const rid = room.roomId || room.id;
                  return (
                    <div key={rid} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm capitalize">{room.roomType || "Room"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Capacity: {room.capacity} &bull; ${room.pricePerNight || room.basePrice || 0}/night
                          {room.bedType && ` · ${room.bedType}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${room.isAvailable !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {room.isAvailable !== false ? "Available" : "Unavailable"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditExistingRoom(room)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingRoom(rid)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SUBMIT */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/hotels")}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || submitting}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || submitting ? "Saving changes…" : updateSuccess ? "Save Again" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Edit Room Modal */}
        {showEditModal && editingRoom && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowEditModal(false); setEditingRoom(null); }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Edit Room</h3>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingRoom(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateRoom} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Room Type *</label>
                    <input
                      value={editingRoom.roomType || ""}
                      onChange={(e) => setEditingRoom((p) => ({ ...p, roomType: e.target.value }))}
                      placeholder="e.g. Deluxe Suite"
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bed Type</label>
                    <input
                      value={editingRoom.bedType || ""}
                      onChange={(e) => setEditingRoom((p) => ({ ...p, bedType: e.target.value }))}
                      placeholder="e.g. King"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capacity *</label>
                    <input
                      type="number"
                      min="1"
                      value={editingRoom.capacity || ""}
                      onChange={(e) => setEditingRoom((p) => ({ ...p, capacity: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price / Night *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingRoom.basePrice || editingRoom.pricePerNight || ""}
                      onChange={(e) => setEditingRoom((p) => ({ ...p, basePrice: e.target.value, pricePerNight: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Size (sqft)</label>
                    <input
                      value={editingRoom.size || ""}
                      onChange={(e) => setEditingRoom((p) => ({ ...p, size: e.target.value }))}
                      placeholder="e.g. 450"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                    <select
                      value={editingRoom.status || "available"}
                      onChange={(e) => setEditingRoom((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none bg-white"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
                  <textarea
                    value={editingRoom.description || ""}
                    onChange={(e) => setEditingRoom((p) => ({ ...p, description: e.target.value }))}
                    rows="2"
                    placeholder="Room description..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditingRoom(null); }}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save Room"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Hotel Confirm Modal */}
        <ConfirmModal
          isOpen={confirmDeleteHotel}
          title="Delete Hotel"
          message="Are you sure you want to delete this hotel? This action cannot be undone."
          confirmLabel="Delete Hotel"
          loading={loading}
          onConfirm={confirmHotelDelete}
          onCancel={() => setConfirmDeleteHotel(false)}
        />

        {/* Delete Room Confirm Modal */}
        <ConfirmModal
          isOpen={confirmDeleteRoom.open}
          title="Delete Room"
          message="Are you sure you want to delete this room? This action cannot be undone."
          confirmLabel="Delete Room"
          onConfirm={confirmRoomDelete}
          onCancel={() => setConfirmDeleteRoom({ open: false, roomId: null })}
        />
      </div>
    );
  }

  // For create mode (new hotel registration), show all sections
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Register Partner Hotel
            </h1>
            <p className="text-gray-600 mt-1">
              Complete all sections to register a new hotel
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-2 text-red-700">
            <AlertCircle /> {error}
          </div>
        )}

        {/* BASIC INFO */}
        <section className="bg-white p-6 rounded border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-lg border-b border-gray-200 pb-3">
            <Info className="w-5 h-5" /> Basic Information
          </div>

          <input
            name="hotelName"
            placeholder="Hotel Name *"
            value={formData.hotelName}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            rows="4"
          />

          <input
            name="discountPercent"
            type="number"
            placeholder="Discount %"
            value={formData.discountPercent}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            min="0"
            max="100"
          />

          {/* Amenities */}
          <div className="space-y-2">
            <label className="font-medium text-sm text-gray-700">Amenities</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add amenity (e.g., WiFi, Pool)"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddAmenity())
                }
                className="flex-1 p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {formData.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm flex items-center gap-2 border border-gray-300"
                  >
                    {amenity}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-red-600"
                      onClick={() => handleRemoveAmenity(amenity)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* OWNER */}
        <section className="bg-white p-6 rounded border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-lg border-b border-gray-200 pb-3">
            <CreditCard className="w-5 h-5" /> Owner Details
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              name="ownerFirstName"
              placeholder="First Name *"
              value={formData.ownerFirstName}
              onChange={handleFormChange}
              className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              name="ownerLastName"
              placeholder="Last Name"
              value={formData.ownerLastName}
              onChange={handleFormChange}
              className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>

          <input
            name="ownerEmail"
            type="email"
            placeholder="Email *"
            value={formData.ownerEmail}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            required
          />
          <input
            name="ownerPhone"
            placeholder="Phone *"
            value={formData.ownerPhone}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            required
          />
          <input
            name="stripeAccountId"
            placeholder="Stripe Account ID (optional)"
            value={formData.stripeAccountId}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </section>

        {/* LOCATION */}
        <section className="bg-white p-6 rounded border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-lg border-b border-gray-200 pb-3">
            <MapPin className="w-5 h-5" /> Location
          </div>

          <LocationPicker
            value={{
              location: formData.location,
              latitude: formData.latitude,
              longitude: formData.longitude,
            }}
            onChange={({ location, latitude, longitude }) =>
              setFormData((prev) => ({ ...prev, location, latitude, longitude }))
            }
          />

          {/* Manual address fields for create */}
          <div className="grid grid-cols-1 gap-3 pt-1">
            <input
              name="address"
              placeholder="Street Address"
              value={formData.address}
              onChange={handleFormChange}
              className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleFormChange}
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
              <input
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleFormChange}
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <input
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleFormChange}
              className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="latitude"
                type="number"
                step="any"
                placeholder="Latitude (auto-filled)"
                value={formData.latitude}
                onChange={handleFormChange}
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
              <input
                name="longitude"
                type="number"
                step="any"
                placeholder="Longitude (auto-filled)"
                value={formData.longitude}
                onChange={handleFormChange}
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ROOMS */}
        <section className="bg-white p-6 rounded border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-lg border-b border-gray-200 pb-3">
            <BedDouble className="w-5 h-5" /> Rooms Management
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Rooms (Required)
            </h3>

            {roomValidationError && (
              <p className="text-red-600 text-sm">{roomValidationError}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Room Type *"
                value={roomData.roomType}
                onChange={(e) =>
                  setRoomData({ ...roomData, roomType: e.target.value })
                }
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Capacity *"
                value={roomData.capacity}
                onChange={(e) =>
                  setRoomData({ ...roomData, capacity: e.target.value })
                }
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                min="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Base Price *"
                value={roomData.basePrice}
                onChange={(e) =>
                  setRoomData({ ...roomData, basePrice: e.target.value })
                }
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                min="0"
                step="0.01"
              />
              <input
                placeholder="Bed Type"
                value={roomData.bedType}
                onChange={(e) =>
                  setRoomData({ ...roomData, bedType: e.target.value })
                }
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>

            <input
              placeholder="Size (e.g., 250 sq ft)"
              value={roomData.size}
              onChange={(e) => setRoomData({ ...roomData, size: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />

            <textarea
              placeholder="Room Description"
              value={roomData.description}
              onChange={(e) =>
                setRoomData({ ...roomData, description: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              rows="3"
            />

            <button
              type="button"
              onClick={handleAddRoom}
              className="w-full bg-blue-600 text-white py-2.5 rounded hover:bg-blue-700 transition-colors"
            >
              Add Room
            </button>

            {/* Display Added Rooms */}
            {formData.rooms.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium text-gray-700">
                  Added Rooms ({formData.rooms.length})
                </h3>
                {formData.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3 border border-gray-300 rounded bg-gray-50 flex justify-between items-start"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{room.roomType}</h4>
                      <p className="text-sm text-gray-600">
                        Capacity: {room.capacity} | Price: ${room.basePrice}
                      </p>
                      {room.bedType && (
                        <p className="text-sm text-gray-600">Bed: {room.bedType}</p>
                      )}
                      {room.size && (
                        <p className="text-sm text-gray-600">Size: {room.size}</p>
                      )}
                      {room.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(room.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading || submitting}
          className="w-full py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading || submitting ? "Creating Hotel..." : "Create Hotel"}
        </button>
      </form>

      {/* Delete Hotel Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDeleteHotel}
        title="Delete Hotel"
        message="Are you sure you want to delete this hotel? This action cannot be undone."
        confirmLabel="Delete Hotel"
        loading={loading}
        onConfirm={confirmHotelDelete}
        onCancel={() => setConfirmDeleteHotel(false)}
      />

      {/* Delete Room Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDeleteRoom.open}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmLabel="Delete Room"
        onConfirm={confirmRoomDelete}
        onCancel={() => setConfirmDeleteRoom({ open: false, roomId: null })}
      />
    </div>
  );
};
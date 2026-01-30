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
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "react-hot-toast";

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
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: "",
    longitude: "",
    discountPercent: "",
    amenities: [],
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
    stripeAccountId: "",
    payoutPreference: "bank",
    rooms: [],
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [roomValidationError, setRoomValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRooms, setExistingRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    if (isUpdateMode && selectedHotel) {
      console.log("✅ Selected hotel loaded:", selectedHotel);

      // Parse location string (e.g., "123 Main St, Orlando, FL" or "Lake Buena Vista, FL")
      const locationParts = selectedHotel.location ? selectedHotel.location.split(",").map(s => s.trim()) : [];
      let parsedAddress = "";
      let parsedCity = "";
      let parsedState = "";

      if (locationParts.length === 3) {
        // Format: "address, city, state"
        parsedAddress = locationParts[0];
        parsedCity = locationParts[1];
        parsedState = locationParts[2];
      } else if (locationParts.length === 2) {
        // Format: "city, state"
        parsedCity = locationParts[0];
        parsedState = locationParts[1];
      } else if (locationParts.length === 1) {
        parsedAddress = locationParts[0];
      }

      setFormData({
        hotelName: selectedHotel.name || "",
        description: selectedHotel.description || "",
        address: parsedAddress || "",
        city: parsedCity || selectedHotel.city || "",
        state: parsedState || selectedHotel.state || "",
        country: selectedHotel.country || "",
        latitude: selectedHotel.latitude || "",
        longitude: selectedHotel.longitude || "",
        discountPercent: selectedHotel.discountPercentage || "",
        amenities: selectedHotel.amenities || [],
        ownerFirstName: selectedHotel.owner?.firstName || "",
        ownerLastName: selectedHotel.owner?.lastName || "",
        ownerEmail: selectedHotel.owner?.email || "",
        ownerPhone: selectedHotel.owner?.phoneNumber || "",
        stripeAccountId: selectedHotel.owner?.stripeAccountId || "",
        payoutPreference: selectedHotel.owner?.payoutPreference || "bank",
        rooms: [],
      });
      setExistingRooms(selectedHotel.rooms || []);

      console.log("📝 Form data populated:", {
        hotelName: selectedHotel.name,
        address: parsedAddress,
        city: parsedCity,
        state: parsedState,
      });
    }
  }, [selectedHotel, isUpdateMode]);

  /* -------------------------------------------------------------------------- */
  /*                                 HANDLERS                                   */
  /* -------------------------------------------------------------------------- */

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleDeleteHotel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this hotel? This action cannot be undone."
      )
    ) {
      return;
    }

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
      console.log("🔄 Refreshing hotel data for hotel ID:", hotelId);
      await dispatch(fetchHotelById(hotelId));

      setShowEditModal(false);
      setEditingRoom(null);
    } catch (error) {
      console.error("❌ Failed to update room:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error(error.message || "Failed to update room");
    }
  };

  const handleDeleteExistingRoom = async (roomId) => {
    console.log("🗑️ DELETE ROOM HANDLER CALLED - Room ID:", roomId);

    if (!window.confirm("Are you sure you want to delete this room?")) {
      console.log("❌ User cancelled deletion");
      return;
    }

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
        console.log("🔄 Refreshing hotel data for hotel ID:", hotelId);
        await dispatch(fetchHotelById(hotelId));
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

    const dataToSend = {
      name: formData.hotelName,
      description: formData.description,
      location: `${formData.address}, ${formData.city}, ${formData.state}`,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      isPartnered: true,
      discountPercentage: parseFloat(formData.discountPercent) || 0,
      amenities: formData.amenities,
      owner: {
        firstName: formData.ownerFirstName,
        lastName: formData.ownerLastName,
        email: formData.ownerEmail,
        phoneNumber: formData.ownerPhone || "+15551234567",
        stripeAccountId: formData.stripeAccountId,
        payoutPreference: formData.payoutPreference,
      },
    };

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

        const result = await dispatch(updateHotel({ hotelId, data: dataToSend }));

        console.log("📥 UPDATE RESULT:", result);

        if (result.meta.requestStatus === "fulfilled") {
          console.log("✅ Hotel updated successfully");

          if (formData.rooms.length > 0) {
            console.log("🛏️ Creating new rooms for existing hotel...");
            const roomPromises = formData.rooms.map((room, index) => {
              console.log(`📤 Creating room ${index + 1}/${formData.rooms.length}`);

              return dispatch(
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
              );
            });

            const roomResults = await Promise.all(roomPromises);
            const successfulRooms = roomResults.filter(
              (r) => r.meta.requestStatus === "fulfilled"
            );
            const failedRooms = roomResults.filter(
              (r) => r.meta.requestStatus === "rejected"
            );

            if (failedRooms.length > 0) {
              console.error("❌ Some rooms failed to create:", failedRooms);
              toast.error(
                `Hotel updated! ${successfulRooms.length} room(s) created, ${failedRooms.length} failed.`
              );
            } else {
              console.log("✅ All new rooms created successfully");
              toast.success(
                `Hotel and ${successfulRooms.length} new room(s) updated successfully!`
              );
            }
          } else {
            toast.success("Hotel updated successfully!");
          }

          // Store the hotel ID for auto-loading in Rooms page
          localStorage.setItem("currentHotelId", hotelId);

          navigate("/rooms");
        } else {
          console.error("❌ Update failed:", result);
          throw new Error(result.error?.message || "Failed to update hotel");
        }
      } else {
        console.log("🆕 CREATE MODE - Creating new hotel with rooms");

        const hotelResult = await dispatch(createHotel(dataToSend));

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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Hotel
              </h1>
              <p className="text-gray-600 mt-1">Update hotel details and manage rooms</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteHotel}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Hotel
            </button>
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

            <input
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleFormChange}
              className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <input
                name="latitude"
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={handleFormChange}
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
              <input
                name="longitude"
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={handleFormChange}
                className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading || submitting
              ? "Updating..."
              : "Update Hotel"}
          </button>
        </form>
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

          <input
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleFormChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <input
              name="latitude"
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleFormChange}
              className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
            <input
              name="longitude"
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleFormChange}
              className="p-2.5 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
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
    </div>
  );
};
// src/pages/UpdateHotel.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  updatePartneredHotel,
  fetchPartneredHotelById,
  clearMessage,
  clearError,
} from '../store/slices/PartnerHotelslice';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Update = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentHotel, loading, message, error } = useSelector((state) => state.partneredhotels);

  const [formData, setFormData] = useState({
    hotelName: '', address: '', city: '', state: '', country: '',
    latitude: '', longitude: '', discountPercent: '', amenities: [],
    ownerName: '', ownerEmail: '', stripeAccountId: '', rooms: [],
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [roomData, setRoomData] = useState({ roomType: '', capacity: '', basePrice: '', available: true, description: '', size: '', bedType: '', images: [] });
  const [roomImageInput, setRoomImageInput] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch hotel on mount
  useEffect(() => {
    dispatch(fetchPartneredHotelById(id));
  }, [dispatch, id]);

  // Populate form when hotel loads
  useEffect(() => {
    if (currentHotel) {
      setFormData({
        hotelName: currentHotel.hotelName || '',
        address: currentHotel.address || '',
        city: currentHotel.city || '',
        state: currentHotel.state || '',
        country: currentHotel.country || '',
        latitude: currentHotel.latitude?.toString() || '',
        longitude: currentHotel.longitude?.toString() || '',
        discountPercent: currentHotel.discountPercent?.toString() || '',
        amenities: currentHotel.amenities || [],
        ownerName: currentHotel.ownerName || '',
        ownerEmail: currentHotel.ownerEmail || '',
        stripeAccountId: currentHotel.stripeAccountId || '',
        rooms: currentHotel.rooms || [],
      });
    }
  }, [currentHotel]);

  useEffect(() => {
    return () => { dispatch(clearMessage()); dispatch(clearError()); };
  }, [dispatch]);

  // Re-use all handlers from AddHotel
  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAddAmenity = () => amenityInput.trim() && setFormData(prev => ({ ...prev, amenities: [...prev.amenities, amenityInput.trim()] })) && setAmenityInput('');
  const handleRemoveAmenity = (i) => setFormData(prev => ({ ...prev, amenities: prev.amenities.filter((_, idx) => idx !== i) }));
  const handleRoomChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleAddRoomImage = () => roomImageInput.trim() && setRoomData(prev => ({ ...prev, images: [...prev.images, roomImageInput.trim()] })) && setRoomImageInput('');
  const handleRemoveRoomImage = (i) => setRoomData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  const handleAddRoom = () => {
    if (!roomData.roomType || !roomData.capacity || !roomData.basePrice) { toast.error('Please fill all required room fields'); return; }
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, { ...roomData, capacity: +roomData.capacity, basePrice: +roomData.basePrice }],
    }));
    setRoomData({ roomType: '', capacity: '', basePrice: '', available: true, description: '', size: '', bedType: '', images: [] });
  };
  const handleRemoveRoom = (i) => setFormData(prev => ({ ...prev, rooms: prev.rooms.filter((_, idx) => idx !== i) }));

  const validateForm = () => {
    const err = {};
    if (!formData.hotelName.trim()) err.hotelName = 'Required';
    if (!formData.city.trim()) err.city = 'Required';
    if (!formData.country.trim()) err.country = 'Required';
    if (!formData.ownerName.trim()) err.ownerName = 'Required';
    if (!formData.ownerEmail.trim()) err.ownerEmail = 'Required';
    if (formData.rooms.length === 0) err.rooms = 'Add at least one room';
    setValidationErrors(err);
    return Object.keys(err).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSend = {
      ...formData,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      discountPercent: parseFloat(formData.discountPercent) || 0,
    };

    const result = await dispatch(updatePartneredHotel({ id, hotelData: dataToSend }));
    if (updatePartneredHotel.fulfilled.match(result)) {
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  if (!currentHotel && loading !== 'pending') return <div>Hotel not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Edit Hotel</h1>

        {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-green-800">{message}</span></div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-600" /> <span className="text-red-800">{error}</span></div>}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Copy entire form from AddHotel.jsx here – just change title & button */}
          {/* ... same JSX structure ... */}
          <div className="flex gap-4 justify-end mt-8">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading === 'pending'} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-70 flex items-center gap-2">
              {loading === 'pending' ? 'Updating...' : 'Update Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
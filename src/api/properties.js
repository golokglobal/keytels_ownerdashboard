import { delay } from './api';

const mockRooms = [
  {
    id: 'R101',
    roomNumber: '101',
    type: 'Standard Room',
    status: 'available',
    floor: 1,
    pricePerNight: 150,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    description: 'Comfortable standard room with modern amenities',
    size: '300 sq ft',
  },
  {
    id: 'R102',
    roomNumber: '102',
    type: 'Standard Room',
    status: 'occupied',
    floor: 1,
    pricePerNight: 150,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
    description: 'Comfortable standard room with modern amenities',
    size: '300 sq ft',
  },
  {
    id: 'R201',
    roomNumber: '201',
    type: 'Deluxe Suite',
    status: 'available',
    floor: 2,
    pricePerNight: 280,
    capacity: 3,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Living Area'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    description: 'Spacious suite with separate living area and balcony',
    size: '550 sq ft',
  },
  {
    id: 'R202',
    roomNumber: '202',
    type: 'Deluxe Suite',
    status: 'maintenance',
    floor: 2,
    pricePerNight: 280,
    capacity: 3,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Living Area'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    description: 'Spacious suite with separate living area and balcony',
    size: '550 sq ft',
  },
  {
    id: 'R301',
    roomNumber: '301',
    type: 'Ocean View',
    status: 'available',
    floor: 3,
    pricePerNight: 350,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Ocean View', 'Jacuzzi'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    description: 'Stunning ocean view room with private jacuzzi',
    size: '400 sq ft',
  },
  {
    id: 'R302',
    roomNumber: '302',
    type: 'Ocean View',
    status: 'occupied',
    floor: 3,
    pricePerNight: 350,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Ocean View', 'Jacuzzi'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    description: 'Stunning ocean view room with private jacuzzi',
    size: '400 sq ft',
  },
  {
    id: 'R401',
    roomNumber: '401',
    type: 'Presidential Suite',
    status: 'available',
    floor: 4,
    pricePerNight: 650,
    capacity: 4,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Ocean View', 'Jacuzzi', 'Kitchen', 'Dining Area', 'Butler Service'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    description: 'Luxury presidential suite with all premium amenities',
    size: '1200 sq ft',
  },
  {
    id: 'R501',
    roomNumber: '501',
    type: 'Family Room',
    status: 'occupied',
    floor: 5,
    pricePerNight: 220,
    capacity: 5,
    amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Bunk Beds', 'Play Area'],
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
    description: 'Perfect for families with children',
    size: '650 sq ft',
  },
];

export const fetchRooms = async (filters = {}) => {
  await delay();

  let filtered = [...mockRooms];

  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }

  if (filters.type) {
    filtered = filtered.filter(r => r.type === filters.type);
  }

  return {
    success: true,
    rooms: filtered,
  };
};

export const fetchRoomById = async (id) => {
  await delay();
  const room = mockRooms.find(r => r.id === id);

  if (!room) {
    throw new Error('Room not found');
  }

  return { success: true, room };
};

export const updateRoom = async (id, updates) => {
  await delay();

  const index = mockRooms.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error('Room not found');
  }

  mockRooms[index] = { ...mockRooms[index], ...updates };

  return { success: true, room: mockRooms[index] };
};

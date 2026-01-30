import { delay } from './api';
import { subDays, format } from 'date-fns';

const mockGuests = [
  {
    id: 'G001',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 555-0101',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    totalBookings: 12,
    totalSpent: 8450,
    lastVisit: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    joinedDate: '2023-03-15',
    vipStatus: 'gold',
    preferences: 'Non-smoking, High floor',
    nationality: 'USA',
  },
  {
    id: 'G002',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 555-0102',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    totalBookings: 8,
    totalSpent: 5200,
    lastVisit: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    joinedDate: '2023-05-20',
    vipStatus: 'silver',
    preferences: 'Ocean view preferred',
    nationality: 'Canada',
  },
  {
    id: 'G003',
    name: 'Emma Williams',
    email: 'emma.w@email.com',
    phone: '+1 555-0103',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    totalBookings: 15,
    totalSpent: 12300,
    lastVisit: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    joinedDate: '2022-11-10',
    vipStatus: 'platinum',
    preferences: 'Late checkout, Room service',
    nationality: 'UK',
  },
  {
    id: 'G004',
    name: 'David Martinez',
    email: 'd.martinez@email.com',
    phone: '+1 555-0104',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    totalBookings: 5,
    totalSpent: 3100,
    lastVisit: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
    joinedDate: '2023-08-22',
    vipStatus: 'regular',
    preferences: 'Quiet room',
    nationality: 'Spain',
  },
  {
    id: 'G005',
    name: 'Lisa Anderson',
    email: 'lisa.a@email.com',
    phone: '+1 555-0105',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    totalBookings: 20,
    totalSpent: 15800,
    lastVisit: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    joinedDate: '2022-06-05',
    vipStatus: 'platinum',
    preferences: 'Suite preferred, Extra pillows',
    nationality: 'USA',
  },
];

export const fetchGuests = async (filters = {}) => {
  await delay();

  let filtered = [...mockGuests];

  if (filters.vipStatus) {
    filtered = filtered.filter(g => g.vipStatus === filters.vipStatus);
  }

  return {
    success: true,
    guests: filtered.sort((a, b) => b.totalSpent - a.totalSpent),
  };
};

export const fetchGuestById = async (id) => {
  await delay();
  const guest = mockGuests.find(g => g.id === id);

  if (!guest) {
    throw new Error('Guest not found');
  }

  // Add booking history
  const bookingHistory = Array.from({ length: guest.totalBookings }, (_, i) => ({
    id: `BK${String(i + 1).padStart(5, '0')}`,
    checkIn: format(subDays(new Date(), (i + 1) * 30), 'yyyy-MM-dd'),
    checkOut: format(subDays(new Date(), (i + 1) * 30 - 3), 'yyyy-MM-dd'),
    roomType: ['Standard Room', 'Deluxe Suite', 'Ocean View'][Math.floor(Math.random() * 3)],
    amount: 450 + Math.floor(Math.random() * 500),
    status: 'completed',
  }));

  return {
    success: true,
    guest: { ...guest, bookingHistory },
  };
};

export const updateGuest = async (id, updates) => {
  await delay();

  const index = mockGuests.findIndex(g => g.id === id);
  if (index === -1) {
    throw new Error('Guest not found');
  }

  mockGuests[index] = { ...mockGuests[index], ...updates };

  return { success: true, guest: mockGuests[index] };
};

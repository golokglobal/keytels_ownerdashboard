import { delay } from './api';
import { subDays, format } from 'date-fns';

const generateRevenueData = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    return {
      date: format(date, 'MMM dd'),
      revenue: 2000 + Math.floor(Math.random() * 3000),
      bookings: 5 + Math.floor(Math.random() * 15),
    };
  });
};

const generateOccupancyData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: format(new Date(2024, i, 1), 'MMM'),
    occupancy: 60 + Math.floor(Math.random() * 35),
  }));
};

export const fetchDashboardStats = async () => {
  await delay();

  return {
    success: true,
    stats: {
      totalRevenue: 245680,
      totalBookings: 456,
      occupancyRate: 78,
      availableRooms: 12,
      checkInsToday: 8,
      checkOutsToday: 5,
      pendingPayments: 34500,
      averageRating: 4.7,
      totalGuests: 1243,
      activeBookings: 45,
    },
  };
};

export const fetchRevenueData = async (period = '30days') => {
  await delay();

  return {
    success: true,
    data: generateRevenueData(),
  };
};

export const fetchOccupancyData = async () => {
  await delay();

  return {
    success: true,
    data: generateOccupancyData(),
  };
};

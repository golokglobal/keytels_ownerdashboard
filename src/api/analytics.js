import api from '../config/axiosConfig';
import { format, subDays } from 'date-fns';

const getOwnerId = () => localStorage.getItem('userId');

// GET /owner-billing/{ownerId}/dashboard?startDate=&endDate=
// Response: OwnerDashboardDto {
//   ownerId, ownerEmail, startDate, endDate,
//   totalHotels, totalRevenue, subscription (OwnerBillingStatusDto),
//   revenueByHotel: [{ hotelId, hotelName, revenue }],
//   dailyRevenue:   [{ date, revenue }],
//   monthlyRevenue: [{ date, revenue }]
// }
export const fetchOwnerDashboard = async (startDate, endDate) => {
  const ownerId = getOwnerId();
  if (!ownerId) throw new Error('No owner ID found in session');

  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate)   params.endDate   = endDate;

  const response = await api.get(`/owner-billing/${ownerId}/dashboard`, { params });
  return response.data;
};

// GET /hotels/{hotelId}/bookings/summary
// Response: { totalBookings, confirmedBookings, pendingBookings, cancelledBookings,
//             checkedInToday, checkedOutToday, totalRevenue, averageBookingValue }
export const fetchBookingSummary = async (hotelId) => {
  const response = await api.get(`/hotels/${hotelId}/bookings/summary`);
  return response.data;
};

// GET /hotels/{hotelId}/revenue?fromDate=&toDate=
// Response: { hotelId, fromDate, toDate, totalRevenue, revenuePoints: [{ date, revenue }] }
export const fetchHotelRevenue = async (hotelId, fromDate, toDate) => {
  const params = { fromDate, toDate };
  const response = await api.get(`/hotels/${hotelId}/revenue`, { params });
  return response.data;
};

// Aggregated dashboard stats across all owner's hotels.
// Combines /owner-billing/{ownerId}/dashboard + per-hotel booking summary.
export const fetchDashboardStats = async (hotelIds = []) => {
  const ownerId = getOwnerId();
  if (!ownerId) throw new Error('No owner ID found in session');

  const [dashboardData, ...summaries] = await Promise.all([
    fetchOwnerDashboard(),
    ...hotelIds.map(id => fetchBookingSummary(id).catch(() => null)),
  ]);

  const validSummaries = summaries.filter(Boolean);
  const checkInsToday   = validSummaries.reduce((acc, s) => acc + (s.checkedInToday  ?? 0), 0);
  const checkOutsToday  = validSummaries.reduce((acc, s) => acc + (s.checkedOutToday ?? 0), 0);
  const activeBookings  = validSummaries.reduce((acc, s) => acc + (s.confirmedBookings ?? 0), 0);
  const totalBookings   = validSummaries.reduce((acc, s) => acc + (s.totalBookings ?? 0), 0);

  return {
    success: true,
    stats: {
      totalRevenue:    dashboardData.totalRevenue ?? 0,
      totalHotels:     dashboardData.totalHotels  ?? 0,
      totalBookings,
      checkInsToday,
      checkOutsToday,
      activeBookings,
      subscription:    dashboardData.subscription ?? null,
      revenueByHotel:  dashboardData.revenueByHotel  ?? [],
      dailyRevenue:    dashboardData.dailyRevenue     ?? [],
      monthlyRevenue:  dashboardData.monthlyRevenue   ?? [],
    },
  };
};

// Revenue chart data for a single hotel over the last N days.
// Falls back to dailyRevenue from owner dashboard when no hotelId supplied.
export const fetchRevenueData = async (hotelId, days = 30) => {
  if (hotelId) {
    const toDate   = format(new Date(), 'yyyy-MM-dd');
    const fromDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
    const data     = await fetchHotelRevenue(hotelId, fromDate, toDate);
    return {
      success: true,
      data: (data.revenuePoints ?? []).map(p => ({
        date:     p.date,
        revenue:  p.revenue  ?? 0,
        bookings: p.bookings ?? 0,
      })),
      totalRevenue: data.totalRevenue ?? 0,
    };
  }

  // No hotelId — pull from owner dashboard for all hotels combined
  const toDate   = format(new Date(), 'yyyy-MM-dd');
  const fromDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const data     = await fetchOwnerDashboard(fromDate, toDate);
  return {
    success: true,
    data: (data.dailyRevenue ?? []).map(p => ({
      date:    p.date,
      revenue: p.revenue ?? 0,
    })),
    totalRevenue: data.totalRevenue ?? 0,
  };
};

// Monthly revenue from owner dashboard (monthlyRevenue array).
export const fetchOccupancyData = async () => {
  const data = await fetchOwnerDashboard();
  return {
    success: true,
    data: (data.monthlyRevenue ?? []).map(p => ({
      month:   p.date,
      revenue: p.revenue ?? 0,
    })),
  };
};

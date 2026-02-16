import api from '../config/axiosConfig';

/**
 * Fetch all bookings for a hotel and extract unique guests
 * with their booking stats.
 */
export const fetchGuests = async (hotelId) => {
  const response = await api.get(`/api/hotels/${hotelId}/bookings`);
  const bookings = response.data;

  // Group bookings by guestId to build unique guest list
  const guestMap = new Map();

  bookings.forEach((booking) => {
    const guest = booking.guest;
    if (!guest?.guestId) return;

    if (guestMap.has(guest.guestId)) {
      const existing = guestMap.get(guest.guestId);
      existing.totalBookings += 1;
      existing.bookings.push(booking);

      // Update guest info if current booking has non-null values
      if (guest.firstName) existing.firstName = guest.firstName;
      if (guest.lastName) existing.lastName = guest.lastName;
      if (guest.email) existing.email = guest.email;
      if (guest.phoneNumber) existing.phoneNumber = guest.phoneNumber;

      // Track latest check-in date
      if (booking.checkInDate > existing.lastCheckIn) {
        existing.lastCheckIn = booking.checkInDate;
      }
    } else {
      guestMap.set(guest.guestId, {
        guestId: guest.guestId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phoneNumber: guest.phoneNumber,
        totalBookings: 1,
        lastCheckIn: booking.checkInDate || null,
        bookings: [booking],
      });
    }
  });

  return Array.from(guestMap.values());
};

import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User, LogOut, Settings, BookOpen, Users, Bed, X } from 'lucide-react';
import { logoutUser } from '../../store/slices/userSlice';
import { clearAllHotels } from '../../store/slices/PartnerHotelslice';

export const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const bookings = useSelector((state) => state.bookings.bookings);
  const guests = useSelector((state) => state.guests.guests);
  const rooms = useSelector((state) => state.property.rooms);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.trim().toLowerCase();

  const matchedBookings = q
    ? bookings.filter((b) => {
        const name = b.guest
          ? `${b.guest.firstName || ''} ${b.guest.lastName || ''}`.toLowerCase()
          : (b.guestName || '').toLowerCase();
        return (
          name.includes(q) ||
          (b.bookingId || '').toLowerCase().includes(q) ||
          (b.bookingStatus || '').toLowerCase().includes(q)
        );
      }).slice(0, 4)
    : [];

  const matchedGuests = q
    ? guests.filter((g) =>
        `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase().includes(q) ||
        (g.email || '').toLowerCase().includes(q) ||
        (g.phoneNumber || '').toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedRooms = q
    ? rooms.filter((r) =>
        (r.roomType || '').toLowerCase().includes(q) ||
        String(r.roomNumber || '').toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const hasResults = matchedBookings.length > 0 || matchedGuests.length > 0 || matchedRooms.length > 0;

  const go = (path) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      dispatch(clearAllHotels());
      // Clear all localStorage
      localStorage.clear();
      // Force reload to clear all Redux state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      dispatch(clearAllHotels());
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div ref={searchRef} className="hidden md:block relative w-96">
            <div className="flex items-center bg-slate-100 rounded-lg px-4 py-2">
              <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => q && setShowResults(true)}
                placeholder="Search bookings, guests, rooms..."
                className="bg-transparent outline-none text-sm w-full"
              />
              {query && (
                <button onClick={() => { setQuery(''); setShowResults(false); }}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {showResults && q && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-96 overflow-y-auto">
                {!hasResults && (
                  <p className="text-sm text-slate-500 text-center py-6">No results for "{query}"</p>
                )}

                {matchedBookings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bookings</span>
                    </div>
                    {matchedBookings.map((b) => {
                      const name = b.guest
                        ? `${b.guest.firstName || ''} ${b.guest.lastName || ''}`.trim()
                        : (b.guestName || 'Guest');
                      return (
                        <button
                          key={b.bookingId}
                          onClick={() => go('/bookings')}
                          className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">{name}</p>
                            <p className="text-xs text-slate-400 font-mono">{b.bookingId?.slice(0, 8)}…</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            b.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                            b.bookingStatus === 'BOOKED' ? 'bg-green-100 text-green-700' :
                            b.bookingStatus === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-600' :
                            'bg-red-100 text-red-600'
                          }`}>{b.bookingStatus}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {matchedGuests.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Guests</span>
                    </div>
                    {matchedGuests.map((g) => (
                      <button
                        key={g.guestId}
                        onClick={() => go('/guests')}
                        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {`${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guest'}
                          </p>
                          <p className="text-xs text-slate-400">{g.email || g.phoneNumber || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {matchedRooms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rooms</span>
                    </div>
                    {matchedRooms.map((r) => (
                      <button
                        key={r.id || r.roomId}
                        onClick={() => go('/rooms')}
                        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {r.roomType}{r.roomNumber ? ` — #${r.roomNumber}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-6 h-6 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-800">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || 'Owner'}
                </p>
                <p className="text-xs text-slate-500">{user?.role || 'Hotel Owner'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 w-full text-left transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 w-full text-left transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <hr className="my-2 border-slate-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 w-full text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

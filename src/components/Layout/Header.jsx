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
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
        setShowSearch(false);
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
    setShowSearch(false);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      dispatch(clearAllHotels());
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      dispatch(clearAllHotels());
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-[#1a1f36] sticky top-0 z-30 w-full">
      <div className="flex items-center h-12 px-3 lg:px-4 gap-3">
        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onMenuClick}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5 text-white/80" />
          </button>
          <div className="leading-none select-none">
            <p className="text-sm font-bold text-white tracking-tight">Keytels</p>
            <p className="text-[9px] text-white/45 font-medium uppercase tracking-widest mt-0.5">owner central</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: search, bell, user */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <div ref={searchRef} className="relative">
            {showSearch ? (
              <div className="flex items-center bg-white/15 border border-white/25 rounded px-3 py-1 gap-2 w-64">
                <Search className="w-4 h-4 text-white/60 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                  placeholder="Search bookings, guests, rooms..."
                  className="bg-transparent outline-none text-xs text-white placeholder-white/50 w-full"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setShowResults(false); }}>
                    <X className="w-3.5 h-3.5 text-white/50 hover:text-white" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                <Search className="w-5 h-5 text-white/80" />
              </button>
            )}

            {/* Search results */}
            {showResults && q && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-80 overflow-y-auto">
                {!hasResults && (
                  <p className="text-sm text-slate-500 text-center py-6">No results for "{query}"</p>
                )}
                {matchedBookings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <BookOpen className="w-3 h-3 text-slate-400" />
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
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Guests</span>
                    </div>
                    {matchedGuests.map((g) => (
                      <button
                        key={g.guestId}
                        onClick={() => go('/guests')}
                        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {`${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Guest'}
                        </p>
                        <p className="text-xs text-slate-400">{g.email || g.phoneNumber || ''}</p>
                      </button>
                    ))}
                  </div>
                )}
                {matchedRooms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <Bed className="w-3 h-3 text-slate-400" />
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

          {/* Notifications */}
          <button className="relative p-1.5 hover:bg-white/10 rounded-md transition-colors">
            <Bell className="w-5 h-5 text-white/80" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-400 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-md transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.username || 'Owner'}
                    </p>
                    <p className="text-xs text-slate-500">{user?.role || 'Hotel Owner'}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 w-full text-left transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Profile</span>
                  </button>
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 w-full text-left transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Settings</span>
                  </button>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 w-full text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
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

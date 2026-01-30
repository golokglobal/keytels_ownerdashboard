import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { logoutUser } from '../../store/slices/userSlice';
import { clearAllHotels } from '../../store/slices/PartnerHotelslice';

export const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-4 py-2 w-96">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search bookings, guests, rooms..."
              className="bg-transparent outline-none text-sm w-full"
            />
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

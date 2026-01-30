import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Bed,
  Users,
  DollarSign,
  Star,
  HeadphonesIcon,
  Settings,
  Hotel,
  X,
  UserCog,
  Shield,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/hotels', icon: Hotel, label: 'Hotels' },
  { path: '/bookings', icon: Calendar, label: 'Bookings' },
  { path: '/rooms', icon: Bed, label: 'Rooms' },
  { path: '/guests', icon: Users, label: 'Guests' },
  { path: '/staff', icon: UserCog, label: 'Staff' },
  { path: '/financials', icon: DollarSign, label: 'Financials' },
  { path: '/reviews', icon: Star, label: 'Reviews' },
  { path: '/support', icon: HeadphonesIcon, label: 'Support' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/permissions', icon: Shield, label: 'Permissions' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white z-50 lg:static shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Hotel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Desiney World
              </h1>
              <p className="text-xs text-slate-400">Owner Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30'
                    : 'hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
            <p className="text-sm font-medium mb-1">Need Help?</p>
            <p className="text-xs text-slate-400 mb-2">Check our documentation</p>
            <button className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors w-full">
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

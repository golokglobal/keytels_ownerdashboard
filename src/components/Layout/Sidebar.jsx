import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  LogIn,
  Bed,
  Users,
  DollarSign,
  Star,
  HeadphonesIcon,
  Settings,
  Hotel,
  X,
  UserCog,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const DOCS = [
  {
    title: 'Dashboard',
    content: 'The Dashboard gives you a live snapshot of your hotel — total revenue, bookings by status, today\'s arrivals and departures, and recent guest reviews. Use the Refresh button to reload all data.',
  },
  {
    title: 'Hotels',
    content: 'Add and manage your hotel properties. Each hotel has its own rooms, bookings, staff, and financials. Select the active hotel from the header dropdown to switch context across all pages.',
  },
  {
    title: 'Bookings',
    content: 'View all reservations for the selected hotel. Filter by booking or payment status. Use the eye icon to view details, the arrow-in icon to check in a guest, and the X to cancel. Checked-in guests can be checked out from the same row.',
  },
  {
    title: 'Rooms',
    content: 'Manage room inventory — add, edit, or remove rooms. Each room has a type, number, price, and availability status. Room data is used when guests make bookings.',
  },
  {
    title: 'Guests',
    content: 'Browse the full guest directory for your hotel. Guest profiles are created automatically when a booking is made. You can search by name, email, or phone number.',
  },
  {
    title: 'Staff',
    content: 'Manage hotel staff accounts. Staff members are assigned roles (e.g. Manager, Receptionist) and can log into the system to handle check-ins, check-outs, and bookings.',
  },
  {
    title: 'Check-ins & Outs',
    content: 'A focused view for front-desk operations. See guests arriving and departing today. Quickly perform check-in or check-out actions without navigating through the full bookings list.',
  },
  {
    title: 'Financials',
    content: 'Manage your Keytels subscription and view hotel revenue. The top section shows your Stripe account status and active plan — if you have no subscription, choose a plan and click Subscribe to be redirected to Stripe checkout. The bottom section lets you search hotel revenue and booking summaries by date range.',
  },
  {
    title: 'Reviews',
    content: 'Read and respond to guest reviews. The summary card shows your overall average rating and per-category scores. Individual reviews list the guest comment, rating, and date.',
  },
  {
    title: 'Support',
    content: 'Raise and track support tickets with the Keytels team. Create a new ticket using the New Ticket button, and monitor its status (Open → In Progress → Resolved) from the tickets table.',
  },
  {
    title: 'Settings',
    content: 'Update your account details, notification preferences, and hotel configuration. Changes here apply globally across your Keytels owner account.',
  },
];

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/hotels', icon: Hotel, label: 'Hotels' },
  { path: '/bookings', icon: Calendar, label: 'Bookings' },
  { path: '/rooms', icon: Bed, label: 'Rooms' },
  { path: '/guests', icon: Users, label: 'Guests' },
  { path: '/staff', icon: UserCog, label: 'Staff' },
  { path: '/checkins-outs', icon: LogIn, label: 'Check-ins & Outs' },
  { path: '/financials', icon: DollarSign, label: 'Financials' },
  { path: '/reviews', icon: Star, label: 'Reviews' },
  { path: '/support', icon: HeadphonesIcon, label: 'Support' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const [showDocs, setShowDocs] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

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
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:static`}
      >
        {/* 🔹 FLEX COLUMN WRAPPER (IMPORTANT) */}
        <div className="flex h-full flex-col">

          {/* 🔹 HEADER (FIXED) */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Hotel className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Keytels
                </h1>
                <p className="text-xs text-slate-400">Owner Dashboard</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 🔹 SCROLLABLE NAV (THIS FIXES IT) */}
         <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 hide-scrollbar">

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
                      className={`w-5 h-5 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      } transition-transform`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 🔹 FOOTER (FIXED) */}
          <div className="shrink-0 p-4 border-t border-slate-700/50">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
              <p className="text-sm font-medium">Need Help?</p>
              <p className="text-xs text-slate-400 mb-2">Check our documentation</p>
              <button
                onClick={() => setShowDocs(true)}
                className="w-full text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Get Support
              </button>
            </div>
          </div>

          {/* Documentation Modal */}
          {showDocs && (
            <>
              <div
                className="fixed inset-0 bg-black/60 z-[60]"
                onClick={() => { setShowDocs(false); setOpenIndex(null); }}
              />
              <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white shadow-2xl flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-white" />
                    <h2 className="text-lg font-bold text-white">Documentation</h2>
                  </div>
                  <button
                    onClick={() => { setShowDocs(false); setOpenIndex(null); }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <p className="px-6 py-3 text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  Click any section to learn how it works.
                </p>

                {/* Accordion */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {DOCS.map((doc, i) => (
                    <div key={doc.title}>
                      <button
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-800">{doc.title}</span>
                        {openIndex === i
                          ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        }
                      </button>
                      {openIndex === i && (
                        <div className="px-6 pb-4">
                          <p className="text-sm text-slate-600 leading-relaxed">{doc.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </aside>
    </>
  );
};

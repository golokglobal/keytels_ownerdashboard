import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  TrendingUp,
  Bed,
  Tag,
  Calendar,
  Users,
  DollarSign,
  Building2,
  BarChart2,
  Activity,
  Shield,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

const DOCS = [
  {
    title: 'Dashboard',
    content: 'The Dashboard gives you a live snapshot of your hotel — total revenue, bookings by status, today\'s arrivals and departures, and recent guest reviews.',
  },
  {
    title: 'Hotels',
    content: 'Add and manage your hotel properties. Each hotel has its own rooms, bookings, staff, and financials.',
  },
  {
    title: 'Bookings',
    content: 'View all reservations for the selected hotel. Filter by booking or payment status. Check in, check out, or cancel from this view.',
  },
  {
    title: 'Rooms',
    content: 'Manage room inventory — add, edit, or remove rooms. Each room has a type, number, price, and availability status.',
  },
  {
    title: 'Guests',
    content: 'Browse the full guest directory for your hotel. Search by name, email, or phone number.',
  },
  {
    title: 'Staff',
    content: 'Manage hotel staff accounts and roles (Manager, Receptionist, etc.).',
  },
  {
    title: 'Check-ins & Outs',
    content: 'A focused view for front-desk operations. See guests arriving and departing today.',
  },
  {
    title: 'Financials',
    content: 'Manage your Keytels subscription and view hotel revenue. Search revenue and booking summaries by date range.',
  },
  {
    title: 'Reviews',
    content: 'Read and respond to guest reviews. The summary card shows your overall average rating and per-category scores.',
  },
  {
    title: 'Support',
    content: 'Raise and track support tickets with the Keytels team.',
  },
  {
    title: 'Settings',
    content: 'Update your account details, notification preferences, and hotel configuration.',
  },
];

/* Badge component — matches Expedia dark pill style */
const Badge = ({ count, variant = 'count' }) => {
  if (!count && count !== 0) return null;
  if (variant === 'new') {
    return (
      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1a1f36] text-white leading-none">
        New
      </span>
    );
  }
  return (
    <span className="ml-auto text-[10px] font-semibold min-w-[18px] text-center px-1 py-0.5 rounded bg-[#1a1f36] text-white leading-none">
      {count}
    </span>
  );
};

const NavItem = ({ item, onClose, selectedKey, onSelectKey }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Group is active only when a child of THIS group was explicitly selected
  // AND the current route still matches that child's path
  const isChildActive = selectedKey
    ? selectedKey.startsWith(`${item.label}__`) &&
      (() => {
        const childLabel = selectedKey.split('__')[1];
        const child = item.children?.find((c) => c.label === childLabel);
        return child?.path === location.pathname;
      })()
    : false;

  const [expanded, setExpanded] = useState(
    item.children?.some((c) => c.path && location.pathname === c.path) ?? false
  );

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-150 text-left
            ${isChildActive
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-[#1a1f36] hover:bg-slate-100'
            }`}
        >
          <item.icon
            className={`w-4 h-4 shrink-0 mr-3 ${isChildActive ? 'text-indigo-600' : 'text-slate-500'}`}
          />
          <span className="text-sm font-medium flex-1 leading-snug">{item.label}</span>
          {item.badge !== undefined && <Badge count={item.badge} />}
          {item.badgeNew && <Badge variant="new" />}
          <span className="ml-1.5 shrink-0">
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            }
          </span>
        </button>

        {expanded && (
          <div className="mt-0.5 ml-7 border-l border-slate-200 pl-3 space-y-0.5">
            {item.children.map((child, ci) => {
              const key = `${item.label}__${child.label}`;
              const isSelected = selectedKey === key;

              if (!child.path) {
                return (
                  <div
                    key={key + ci}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-slate-400 cursor-default select-none"
                  >
                    <span>{child.label}</span>
                    {child.badge !== undefined && <Badge count={child.badge} />}
                    {child.badgeNew && <Badge variant="new" />}
                  </div>
                );
              }

              return (
                <button
                  key={key + ci}
                  onClick={() => {
                    onSelectKey(key);
                    navigate(child.path);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md text-sm transition-colors text-left
                    ${isSelected
                      ? 'text-indigo-700 font-medium bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <span>{child.label}</span>
                  {child.badge !== undefined && <Badge count={child.badge} />}
                  {child.badgeNew && <Badge variant="new" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={() => {
        onSelectKey(null);
        if (window.innerWidth < 1024) onClose();
      }}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-lg transition-all duration-150
        ${isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-[#1a1f36] hover:bg-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-4 h-4 shrink-0 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
          <span className="text-sm font-medium flex-1">{item.label}</span>
          {item.badge !== undefined && <Badge count={item.badge} />}
          {item.badgeNew && <Badge variant="new" />}
        </>
      )}
    </NavLink>
  );
};

export const Sidebar = ({ isOpen, onClose }) => {
  const [showDocs, setShowDocs] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const bookings = useSelector((state) => state.bookings?.bookings || []);
  const guests = useSelector((state) => state.guests?.guests || []);

  const pendingBookings = bookings.filter(
    (b) => b.bookingStatus === 'BOOKED' || b.bookingStatus === 'PENDING'
  ).length || undefined;

  const totalGuests = guests.length || undefined;

  const menuGroups = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Home',
    },
    {
      path: '/bookings',
      icon: TrendingUp,
      label: 'Opportunities',
      badge: pendingBookings,
    },
    {
      label: 'Rooms and rates',
      icon: Bed,
      children: [
        { path: '/rooms', label: 'Rates and availability' },
        { path: '/rooms', label: 'Room types and rate plans' },
        { path: '/rooms', label: 'Rate and availability observations' },
        { path: '/checkins-outs', label: 'Bulk inventory and availability' },
        { path: '/checkins-outs', label: 'Open and close rooms' },
        { path: '/rooms', label: 'Bulk rates and restrictions' },
        { path: '/settings', label: 'Cancellation policies' },
        { path: '/settings', label: 'Cancellation penalty waiver' },
        { path: '/financials', label: 'Guest and occupancy fees' },
        { path: '/rooms', label: 'Rates and availability report' },
        { path: '/rooms', label: 'Automatic rate match' },
        { path: '/settings', label: 'Auto renewal' },
        { path: '/support', label: 'Connectivity provider guide' },
        { path: '/hotels', label: 'View change history' },
      ],
    },
    {
      label: 'Marketing',
      icon: Tag,
      children: [
        { path: '/dashboard', label: 'Overview' },
        { path: '/financials', label: 'Promotions' },
        { path: '/financials', label: 'Campaigns' },
        { path: '/financials', label: 'Accelerator' },
        { path: '/financials', label: 'TravelAds' },
      ],
    },
    {
      path: '/bookings',
      icon: Calendar,
      label: 'Reservations',
    },
    {
      label: 'Guest relations',
      icon: Users,
      badge: totalGuests,
      children: [
        { path: '/guests', label: 'Messages' },
        { path: '/guests', label: 'In-house feedback' },
        { path: '/reviews', label: 'Post-stay reviews' },
        { path: '/reviews', label: 'Awards and downloads' },
      ],
    },
    {
      path: '/financials',
      icon: DollarSign,
      label: 'Payments',
    },
    {
      label: 'Property details',
      icon: Building2,
      children: [
        { path: '/hotels', label: 'Overview' },
        { path: '/hotels', label: 'Property administration' },
        { path: '/add-hotel', label: 'Photos' },
        { path: '/add-hotel', label: 'Property amenities' },
        { path: '/rooms', label: 'Room amenities' },
        { path: '/hotels', label: 'Points of interest' },
        { path: '/settings', label: 'Fees, policies and settings' },
        { path: '/hotels', label: 'Renovations and closures' },
        { path: '/hotels', label: 'Change history' },
        { path: '/hotels', label: 'Photos administration' },
      ],
    },
    {
      path: '/financials',
      icon: BarChart2,
      label: 'Revenue management',
    },
    {
      path: '/dashboard',
      icon: Activity,
      label: 'Data and insights',
      badgeNew: true,
    },
    {
      label: 'Administration',
      icon: Shield,
      children: [
        { path: '/staff', label: 'Staff' },
        { path: '/settings', label: 'Settings' },
        { path: '/add-hotel', label: 'Add a property' },
      ],
    },
    {
      path: '/support',
      icon: HelpCircle,
      label: 'Help and support',
    },
  ];

  return (
    <>
      <aside className="w-56 h-full bg-white border-r border-slate-200 flex flex-col">
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 hide-scrollbar">
          {menuGroups.map((item, i) => (
            <NavItem
              key={item.label || item.path || i}
              item={item}
              onClose={onClose}
              selectedKey={selectedKey}
              onSelectKey={setSelectedKey}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-100">
          <button
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help &amp; Documentation
          </button>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            <button className="underline hover:text-slate-600 transition-colors">Terms of use</button>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
            © {new Date().getFullYear()} Keytels. All rights reserved.
          </p>
        </div>

        {/* Documentation Modal */}
        {showDocs && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => { setShowDocs(false); setOpenIndex(null); }}
            />
            <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-[#1a1f36]">
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
      </aside>
    </>
  );
};

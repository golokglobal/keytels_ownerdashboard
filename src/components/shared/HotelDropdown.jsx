import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, MapPin, Search, X } from 'lucide-react';

export const HOTEL_COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500', ring: 'ring-violet-200' },
  { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500',   ring: 'ring-blue-200'   },
  { bg: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-300',dot: 'bg-emerald-500',ring: 'ring-emerald-200'},
  { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500',  ring: 'ring-amber-200'  },
  { bg: 'bg-rose-500',   light: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-300',   dot: 'bg-rose-500',   ring: 'ring-rose-200'   },
  { bg: 'bg-cyan-500',   light: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-300',   dot: 'bg-cyan-500',   ring: 'ring-cyan-200'   },
  { bg: 'bg-fuchsia-500',light: 'bg-fuchsia-50',text: 'text-fuchsia-700',border: 'border-fuchsia-300',dot: 'bg-fuchsia-500',ring: 'ring-fuchsia-200'},
  { bg: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-300',   dot: 'bg-teal-500',   ring: 'ring-teal-200'   },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500', ring: 'ring-orange-200' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500', ring: 'ring-indigo-200' },
];

export const getHotelColor = (idx) => HOTEL_COLORS[idx % HOTEL_COLORS.length];
export const getHotelId   = (h) => h?.partneredHotelId || h?.id || h?._id || null;
export const getHotelName = (h) => h?.name || h?.hotelName || 'Unnamed Hotel';
export const getHotelLoc  = (h) => h?.location || h?.address?.city || h?.city || null;

/**
 * Colorful searchable hotel dropdown.
 *
 * Props:
 *   hotels    – array of hotel objects
 *   activeId  – currently selected hotel id
 *   onChange  – (id) => void
 *   size      – 'sm' | 'md' (default 'md')
 *   className – optional wrapper class
 */
export const HotelDropdown = ({
  hotels = [],
  activeId,
  onChange,
  size = 'md',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const activeIdx = hotels.findIndex((h) => getHotelId(h) === activeId);
  const activeHotel = activeIdx >= 0 ? hotels[activeIdx] : null;
  const activeColor = getHotelColor(activeIdx >= 0 ? activeIdx : 0);

  const filtered = hotels.filter((h) => {
    const q = query.toLowerCase();
    return (
      getHotelName(h).toLowerCase().includes(q) ||
      (getHotelLoc(h) || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQuery('');
  }, [open]);

  const isSm = size === 'sm';

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-3 w-full border-2 rounded-xl bg-white shadow-sm transition-all
          ${isSm ? 'px-3 py-2' : 'px-4 py-3'}
          ${open
            ? `${activeColor.border} ring-2 ${activeColor.ring}`
            : `${activeColor.border} hover:shadow-md`
          }`}
      >
        {/* Color dot */}
        <span className={`w-3 h-3 rounded-full shrink-0 ${activeColor.dot}`} />

        {/* Name + location */}
        <div className="flex-1 min-w-0 text-left">
          <p className={`font-semibold truncate text-slate-900 ${isSm ? 'text-sm' : 'text-sm'}`}>
            {activeHotel ? getHotelName(activeHotel) : 'Select hotel…'}
          </p>
          {activeHotel && getHotelLoc(activeHotel) && (
            <p className="text-xs text-slate-400 flex items-center gap-1 truncate mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {getHotelLoc(activeHotel)}
            </p>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute z-40 top-full mt-2 w-full min-w-[260px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hotel or location…"
                className="flex-1 text-sm outline-none placeholder-slate-400 text-slate-800 bg-transparent"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hotel list */}
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-400">No hotels found</li>
              ) : (
                filtered.map((h) => {
                  const hid = getHotelId(h);
                  const idx = hotels.findIndex((x) => getHotelId(x) === hid);
                  const color = getHotelColor(idx);
                  const isSelected = hid === activeId;
                  const loc = getHotelLoc(h);
                  return (
                    <li key={hid}>
                      <button
                        type="button"
                        onClick={() => { onChange(hid); setOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                          ${isSelected ? color.light : 'hover:bg-slate-50'}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? color.text : 'text-slate-800'}`}>
                            {getHotelName(h)}
                          </p>
                          {loc && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {loc}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check className={`w-4 h-4 shrink-0 ${color.text}`} />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

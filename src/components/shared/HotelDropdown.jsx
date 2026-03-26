import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, CheckCircle, MapPin, Search, XCircle } from 'lucide-react';

/**
 * Searchable hotel selector dropdown.
 *
 * Props:
 *   hotels   – array of hotel objects
 *   activeId – currently selected hotel id
 *   onChange – (id) => void
 *   className – optional extra class on the trigger wrapper
 */
export const HotelDropdown = ({
  hotels = [],
  activeId,
  onChange,
  className = '',
  variant = 'default',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const active = hotels.find((h) => (h.partneredHotelId || h.id) === activeId);

  const filtered = hotels.filter((h) => {
    const name = (h.name || h.hotelName || '').toLowerCase();
    const loc  = (h.location || h.address || '').toLowerCase();
    const q    = query.toLowerCase();
    return name.includes(q) || loc.includes(q);
  });

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* focus search input when dropdown opens */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [open]);

  const isHeader = variant === 'header';

  return (
    <div ref={ref} className={`relative w-full ${isHeader ? 'sm:w-72' : 'sm:w-80'} ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center gap-3 ${isHeader ? 'px-3.5 py-2 h-10 bg-slate-100' : 'px-4 py-3 bg-white'} border rounded-xl text-sm font-medium transition-all shadow-sm ${
          open
            ? 'border-slate-900 ring-2 ring-slate-900/10'
            : `${isHeader ? 'border-slate-100 hover:border-slate-200' : 'border-slate-200 hover:border-slate-400'}`
        }`}
      >
        <div className={`${isHeader ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg bg-slate-100 flex items-center justify-center shrink-0`}>
          <Building2 className={`${isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-500`} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-slate-900 font-semibold truncate ${isHeader ? 'text-sm' : ''}`}>
            {active ? (active.name || active.hotelName) : 'Select hotel…'}
          </p>
          {active && (active.location || active.address) && (
            <p className={`text-xs text-slate-400 truncate flex items-center gap-1 ${isHeader ? 'mt-0' : 'mt-0.5'}`}>
              <MapPin className={`${isHeader ? 'w-2.5 h-2.5' : 'w-3 h-3'} shrink-0`} />
              {active.location || active.address}
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={`absolute z-30 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ${isHeader ? 'min-w-[260px]' : ''}`}
          >
            {/* Search */}
            <div className={`flex items-center gap-2 px-3 ${isHeader ? 'py-2' : 'py-2.5'} border-b border-slate-100`}>
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hotel or location…"
                className="flex-1 text-sm outline-none placeholder-slate-400 text-slate-800"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Options */}
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-400">No hotels found</li>
              ) : (
                filtered.map((h) => {
                  const hid = h.partneredHotelId || h.id;
                  const isSelected = hid === activeId;
                  const isActive   = h.status === 'ACTIVE';
                  return (
                    <li key={hid}>
                      <button
                        type="button"
                        onClick={() => { onChange(hid); setOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                            {h.name || h.hotelName}
                          </p>
                          {(h.location || h.address) && (
                            <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {h.location || h.address}
                            </p>
                          )}
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 text-slate-900 shrink-0" />}
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

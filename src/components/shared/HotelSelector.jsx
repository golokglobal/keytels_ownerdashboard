import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, ChevronDown, Check, MapPin } from 'lucide-react';
import { fetchOwnerHotels } from '../../store/slices/PartnerHotelslice';
import { setActiveHotelId, selectPrimaryHotelId, selectUserRole } from '../../store/slices/userSlice';

const getHotelId = (h) => h?.partneredHotelId || h?.id || h?._id || h?.hotelId || null;
const getHotelName = (h) => h?.hotelName || h?.name || 'Unnamed Hotel';
const getHotelCity = (h) => h?.address?.city || h?.city || h?.location || null;

export const HotelSelector = ({ className = '' }) => {
  const dispatch = useDispatch();
  const hotels = useSelector((s) => s.partneredhotels.hotels) || [];
  const loading = useSelector((s) => s.partneredhotels.loading);
  const activeHotelId = useSelector(selectPrimaryHotelId);
  const userRole = useSelector(selectUserRole);
  const isOwner = userRole === 'HOTEL_OWNER';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Load hotels if not yet fetched
  useEffect(() => {
    if (hotels.length === 0 && !loading) {
      dispatch(fetchOwnerHotels());
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeHotel = hotels.find((h) => getHotelId(h) === activeHotelId) || null;
  const city = activeHotel ? getHotelCity(activeHotel) : null;

  const handleSelect = (hotel) => {
    dispatch(setActiveHotelId(getHotelId(hotel)));
    setOpen(false);
  };

  // ── Staff / Manager: static badge, no dropdown ──────────────────────────
  if (!isOwner) {
    if (loading && !activeHotel) {
      return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-400 ${className}`}>
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Loading…</span>
        </div>
      );
    }
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm ${className}`}>
        <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate">
          {activeHotel ? getHotelName(activeHotel) : 'No hotel assigned'}
        </span>
        {city && (
          <span className="text-slate-400 text-xs flex items-center gap-1 truncate hidden sm:flex">
            · <MapPin className="w-3 h-3 shrink-0" /> {city}
          </span>
        )}
      </div>
    );
  }

  // ── Owner: interactive dropdown ──────────────────────────────────────────
  if (hotels.length === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-400 ${className}`}>
        <Building2 className="w-4 h-4 shrink-0" />
        <span>{loading ? 'Loading hotels…' : 'No hotels found'}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm text-slate-700 shadow-sm max-w-xs"
      >
        <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="truncate font-medium">
          {activeHotel ? getHotelName(activeHotel) : 'Select a hotel'}
        </span>
        {activeHotel && city && (
          <span className="text-slate-400 text-xs truncate hidden sm:inline">
            · {city}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Your Properties</p>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {hotels.map((hotel) => {
              const hid = getHotelId(hotel);
              const isActive = hid === activeHotelId;
              const hCity = getHotelCity(hotel);
              return (
                <li key={hid}>
                  <button
                    onClick={() => handleSelect(hotel)}
                    className={`flex items-start justify-between w-full px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                      isActive ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                          {getHotelName(hotel)}
                        </p>
                        {hCity && (
                          <p className="text-xs text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {hCity}
                          </p>
                        )}
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

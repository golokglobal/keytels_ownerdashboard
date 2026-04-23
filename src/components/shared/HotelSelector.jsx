import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, MapPin } from 'lucide-react';
import { fetchOwnerHotels } from '../../store/slices/PartnerHotelslice';
import { setActiveHotelId, selectPrimaryHotelId, selectUserRole } from '../../store/slices/userSlice';
import { HotelDropdown, getHotelId, getHotelName, getHotelLoc } from './HotelDropdown';

/**
 * Global hotel selector — syncs selection to Redux.
 * Owners see a colorful searchable dropdown.
 * Staff/Managers see a static badge showing their assigned hotel.
 */
export const HotelSelector = ({ className = '', size = 'sm' }) => {
  const dispatch = useDispatch();
  const hotels   = useSelector((s) => s.partneredhotels.hotels) || [];
  const loading  = useSelector((s) => s.partneredhotels.loading);
  const activeId = useSelector(selectPrimaryHotelId);
  const userRole = useSelector(selectUserRole);
  const isOwner  = userRole === 'HOTEL_OWNER';

  useEffect(() => {
    if (hotels.length === 0 && !loading) dispatch(fetchOwnerHotels());
  }, []);

  const activeHotel = hotels.find((h) => getHotelId(h) === activeId) || null;

  // Staff / Manager — static badge only
  if (!isOwner) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm ${className}`}>
        <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="font-semibold text-slate-800 truncate">
          {loading && !activeHotel ? 'Loading…' : activeHotel ? getHotelName(activeHotel) : 'No hotel assigned'}
        </span>
        {activeHotel && getHotelLoc(activeHotel) && (
          <span className="text-slate-400 text-xs hidden sm:flex items-center gap-1 truncate">
            · <MapPin className="w-3 h-3 shrink-0" /> {getHotelLoc(activeHotel)}
          </span>
        )}
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-400 ${className}`}>
        <Building2 className="w-4 h-4 shrink-0" />
        <span>{loading ? 'Loading hotels…' : 'No hotels found'}</span>
      </div>
    );
  }

  return (
    <HotelDropdown
      hotels={hotels}
      activeId={activeId}
      onChange={(id) => dispatch(setActiveHotelId(id))}
      size={size}
      className={className}
    />
  );
};

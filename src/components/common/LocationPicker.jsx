import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, X, Navigation } from "lucide-react";

/* ─── Leaflet lazy-loaded to avoid SSR issues ─── */
let L = null;
let mapInstance = null;

const NOMINATIM = "https://nominatim.openstreetmap.org";

/**
 * LocationPicker — OpenStreetMap / Leaflet (no API key required)
 *
 * Props:
 *   value    – { location: string, latitude: number|string, longitude: number|string }
 *   onChange – ({ location, latitude, longitude }) => void
 */
export const LocationPicker = ({ value = {}, onChange }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const hasPosition = !!(value.latitude && value.longitude);

  /* ── Load Leaflet once ── */
  useEffect(() => {
    let destroyed = false;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      /* Dynamic import so Leaflet doesn't run on SSR */
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      L = leaflet.default || leaflet;

      /* Fix default marker icons broken by Vite */
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (destroyed || mapRef.current) return;

      const startLat = value.latitude ? parseFloat(value.latitude) : 20;
      const startLng = value.longitude ? parseFloat(value.longitude) : 0;
      const startZoom = hasPosition ? 14 : 2;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: startZoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      /* Place initial marker if coords available */
      if (hasPosition) {
        const m = L.marker([startLat, startLng], { draggable: true }).addTo(map);
        m.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          reverseGeocode(lat, lng);
        });
        markerRef.current = m;
      }

      /* Click to place / move marker */
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        placeMarker(map, lat, lng);
        reverseGeocode(lat, lng);
      });

      mapRef.current = map;
      if (!destroyed) setMapReady(true);
    };

    initMap();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Place / move marker helper ── */
  const placeMarker = useCallback((map, lat, lng) => {
    if (!L) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const m = L.marker([lat, lng], { draggable: true }).addTo(map);
      m.on("dragend", (e) => {
        const { lat: la, lng: ln } = e.target.getLatLng();
        reverseGeocode(la, ln);
      });
      markerRef.current = m;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fly to lat/lng (from parent update) ── */
  useEffect(() => {
    if (mapRef.current && L && value.latitude && value.longitude) {
      const lat = parseFloat(value.latitude);
      const lng = parseFloat(value.longitude);
      mapRef.current.setView([lat, lng], 14, { animate: true });
      placeMarker(mapRef.current, lat, lng);
    }
  }, [value.latitude, value.longitude, placeMarker]);

  /* ── Reverse geocode using Nominatim ── */
  const reverseGeocode = useCallback(
    async (lat, lng) => {
      try {
        const res = await fetch(
          `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        const locationStr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onChange({ location: locationStr, latitude: lat, longitude: lng });
      } catch {
        onChange({ location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, latitude: lat, longitude: lng });
      }
    },
    [onChange]
  );

  /* ── Autocomplete search with debounce ── */
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (mapRef.current && L) {
      mapRef.current.setView([lat, lng], 14, { animate: true });
      placeMarker(mapRef.current, lat, lng);
    }
    onChange({ location: item.display_name, latitude: lat, longitude: lng });
    setSearchQuery("");
    setSuggestions([]);
  };

  const clearSelection = () => {
    onChange({ location: "", latitude: "", longitude: "" });
    if (markerRef.current && mapRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      mapRef.current.setView([20, 0], 2, { animate: true });
    }
  };

  /* ── Use browser geolocation ── */
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        if (mapRef.current && L) {
          mapRef.current.setView([lat, lng], 14, { animate: true });
          placeMarker(mapRef.current, lat, lng);
        }
        reverseGeocode(lat, lng);
      },
      () => {}
    );
  };

  return (
    <div className="space-y-3">

      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for a city or address…"
              value={searchQuery}
              onChange={handleSearchChange}
              autoComplete="off"
              className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 bg-white transition-all"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
            {!searching && searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            title="Use my location"
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item.place_id || idx}
                type="button"
                onClick={() => selectSuggestion(item)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-700 line-clamp-2 leading-snug">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100"
        style={{ height: "300px" }}
      />

      {!mapReady && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading map…
        </div>
      )}

      {/* Selected location pill */}
      {hasPosition && value.location && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 line-clamp-1">{value.location}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {parseFloat(value.latitude).toFixed(6)}, {parseFloat(value.longitude).toFixed(6)}
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!hasPosition && mapReady && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          Search for a place, click the map, or use the location button
        </p>
      )}
    </div>
  );
};

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, useLoadScript, Autocomplete } from "@react-google-maps/api";
import { MapPin, Search, Loader2, AlertCircle } from "lucide-react";

const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "320px" };
const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 14;

/**
 * LocationPicker
 *
 * Props:
 *   value        – { location: string, latitude: number|string, longitude: number|string }
 *   onChange     – (fields: { location, latitude, longitude }) => void
 */
export const LocationPicker = ({ value = {}, onChange }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const [marker, setMarker] = useState(
    value.latitude && value.longitude
      ? { lat: parseFloat(value.latitude), lng: parseFloat(value.longitude) }
      : null
  );
  const [mapCenter, setMapCenter] = useState(
    value.latitude && value.longitude
      ? { lat: parseFloat(value.latitude), lng: parseFloat(value.longitude) }
      : DEFAULT_CENTER
  );
  const [mapZoom, setMapZoom] = useState(
    value.latitude && value.longitude ? SELECTED_ZOOM : DEFAULT_ZOOM
  );

  // Keep marker in sync if parent updates lat/lng externally
  useEffect(() => {
    if (value.latitude && value.longitude) {
      const pos = { lat: parseFloat(value.latitude), lng: parseFloat(value.longitude) };
      setMarker(pos);
      setMapCenter(pos);
      setMapZoom(SELECTED_ZOOM);
    }
  }, [value.latitude, value.longitude]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Click on map → place marker + reverse geocode
  const onMapClick = useCallback(
    async (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const pos = { lat, lng };
      setMarker(pos);

      // Reverse geocode to get a human-readable location string
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
          const locationStr =
            status === "OK" && results[0]
              ? results[0].formatted_address
              : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onChange({ location: locationStr, latitude: lat, longitude: lng });
        });
      } catch {
        onChange({ location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, latitude: lat, longitude: lng });
      }
    },
    [onChange]
  );

  // Place selected in autocomplete → fill all fields
  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const pos = { lat, lng };

    setMarker(pos);
    setMapCenter(pos);
    setMapZoom(SELECTED_ZOOM);

    onChange({
      location: place.formatted_address || place.name || "",
      latitude: lat,
      longitude: lng,
    });
  }, [onChange]);

  if (loadError) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Failed to load Google Maps. Check your API key in <code className="font-mono bg-red-100 px-1 rounded">.env</code>.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading map…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for a place…"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </Autocomplete>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControlOptions: { position: 9 }, // RIGHT_CENTER
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable
              onDragEnd={(e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                const pos = { lat, lng };
                setMarker(pos);
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                  const locationStr =
                    status === "OK" && results[0]
                      ? results[0].formatted_address
                      : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                  onChange({ location: locationStr, latitude: lat, longitude: lng });
                });
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Selected location display */}
      {marker && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 truncate">{value.location || "Selected location"}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {parseFloat(marker.lat).toFixed(6)}, {parseFloat(marker.lng).toFixed(6)}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Search for a place or click anywhere on the map. Drag the pin to fine-tune.
      </p>
    </div>
  );
};

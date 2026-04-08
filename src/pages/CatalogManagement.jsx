import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPropertyTypes,
  fetchRoomTypes,
  fetchBedTypes,
  createPropertyType,
  createRoomType,
  createBedType,
  selectPropertyTypes,
  selectRoomTypes,
  selectBedTypes,
} from "../store/slices/catalogSlice";
import { Building2, BedDouble, Tag, Plus, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all bg-white";

const STATUS_BADGE = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
};

/* ── Single catalog section (property types / room types / bed types) ── */
const CatalogSection = ({ icon: Icon, title, items, onAdd, loading }) => {
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    setAdding(true);
    try {
      await onAdd({ name });
      toast.success(`"${name}" added successfully`);
      setInput("");
    } catch (err) {
      toast.error(err?.message || `Failed to add ${title.toLowerCase()}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
          <p className="text-xs text-slate-500">{items.length} type{items.length !== 1 ? "s" : ""} defined</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Add form
            POST body: { "name": string }
            Response 201: { id, name, status, createdAt, updatedAt }
        */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Enter new ${title.toLowerCase().replace(" types", " type")} name…`}
            className={inputCls}
            disabled={adding}
          />
          <button
            type="submit"
            disabled={!input.trim() || adding}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>

        {/* List */}
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
            <p className="text-sm text-slate-400">No {title.toLowerCase()} yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const statusKey = item.status || "ACTIVE";
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    {statusKey === "ACTIVE" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-slate-800">{item.name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[statusKey] || STATUS_BADGE.INACTIVE}`}>
                    {statusKey}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   CATALOG MANAGEMENT PAGE
   API endpoints used:
     GET  /api/partneredhotel/catalog/property-types
     POST /api/partneredhotel/catalog/property-types  body: { name }
     GET  /api/partneredhotel/catalog/room-types
     POST /api/partneredhotel/catalog/room-types      body: { name }
     GET  /api/partneredhotel/catalog/bed-types
     POST /api/partneredhotel/catalog/bed-types       body: { name }

   All POST responses (201): { id, name, status: "ACTIVE", createdAt, updatedAt }
══════════════════════════════════════════════════════════ */
export const CatalogManagement = () => {
  const dispatch = useDispatch();
  const propertyTypes = useSelector(selectPropertyTypes);
  const roomTypes = useSelector(selectRoomTypes);
  const bedTypes = useSelector(selectBedTypes);
  const { loading } = useSelector((s) => s.catalog);

  useEffect(() => {
    dispatch(fetchPropertyTypes());
    dispatch(fetchRoomTypes());
    dispatch(fetchBedTypes());
  }, [dispatch]);

  const handleCreatePropertyType = async (data) => {
    const result = await dispatch(createPropertyType(data)).unwrap();
    return result;
  };

  const handleCreateRoomType = async (data) => {
    const result = await dispatch(createRoomType(data)).unwrap();
    return result;
  };

  const handleCreateBedType = async (data) => {
    const result = await dispatch(createBedType(data)).unwrap();
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalog Management</h1>
          <p className="text-slate-500 text-sm">Define hotel property types, room types and bed types</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700">
        <strong>Admin only.</strong> Types defined here appear as dropdown options when creating hotels and rooms. Names are normalised (uppercase, spaces → underscores) by the backend.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CatalogSection
          icon={Building2}
          title="Property Types"
          items={propertyTypes}
          onAdd={handleCreatePropertyType}
          loading={loading}
        />
        <CatalogSection
          icon={BedDouble}
          title="Room Types"
          items={roomTypes}
          onAdd={handleCreateRoomType}
          loading={loading}
        />
        <CatalogSection
          icon={Tag}
          title="Bed Types"
          items={bedTypes}
          onAdd={handleCreateBedType}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CatalogManagement;

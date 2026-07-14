/**
 * RoomInventoryCalendar
 *
 * Industry-standard 30-day inventory calendar for a single room type.
 * Features:
 *  - Colour-coded daily cells: AVAILABLE (green) | PARTIAL (amber) | FULL (red) | BLOCKED (slate) | CLOSED (dark)
 *  - Click a cell to inspect or set a rate override for that date
 *  - "Block dates" form to create maintenance / owner-hold / blackout blocks
 *  - List of existing blocks with inline delete
 *  - Rate override form (single date or range)
 */

import { useState, useEffect, useCallback } from "react";
import api from "../../config/axiosConfig";
import {
  CalendarDays, Lock, DollarSign, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Plus, RefreshCw, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

/* ── helpers ── */
const fmt = (d) => d?.toISOString().slice(0, 10);        // yyyy-MM-dd
const fmtDisplay = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtFull    = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const CELL_CONFIG = {
  AVAILABLE: { bg: "bg-emerald-100 hover:bg-emerald-200 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
  PARTIAL:   { bg: "bg-amber-100  hover:bg-amber-200  border-amber-200",   text: "text-amber-800",   dot: "bg-amber-400"   },
  FULL:      { bg: "bg-red-100    hover:bg-red-200    border-red-200",     text: "text-red-800",     dot: "bg-red-400"     },
  BLOCKED:   { bg: "bg-slate-200  hover:bg-slate-300  border-slate-300",   text: "text-slate-600",   dot: "bg-slate-400"   },
  CLOSED:    { bg: "bg-neutral-800 border-neutral-900",                    text: "text-neutral-300", dot: "bg-neutral-600" },
};

const BLOCK_TYPES = ["MAINTENANCE", "OWNER_HOLD", "BLACKOUT", "OTA_HOLD", "OTHER"];
const RATE_TYPES  = ["CUSTOM", "WEEKEND", "HOLIDAY", "PEAK_SEASON", "DISCOUNT"];

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return fmt(d);
}

/* ══════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════ */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white text-slate-800";
const btnPrimary = "px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors";
const btnGhost   = "px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors";

/* ══════════════════════════════════════════════
   CELL DETAIL POPOVER
══════════════════════════════════════════════ */
const CellDetail = ({ day, roomBasePrice, onAddBlock, onEditRate, onDeleteRate, onClose }) => {
  if (!day) return null;
  const cfg = CELL_CONFIG[day.cellStatus] || CELL_CONFIG.AVAILABLE;
  const hasOverride = day.hasRateOverride && day.rateOverride;

  return (
    <div className="absolute z-40 left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm">
      <button onClick={onClose} className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-md">
        <X className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <p className="font-semibold text-slate-800 mb-3">{fmtFull(day.date)}</p>
      <div className="space-y-1.5 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Status</span>
          <span className={`font-medium ${cfg.text}`}>{day.cellStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total rooms</span>
          <span className="font-medium">{day.totalRooms}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Booked</span>
          <span className="font-medium text-red-600">{day.bookedRooms}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Blocked</span>
          <span className="font-medium text-slate-600">{day.blockedRooms}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Available</span>
          <span className="font-medium text-emerald-600">{day.availableRooms}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
          <span className="text-slate-500">Base price</span>
          <span className="font-medium">${roomBasePrice?.toFixed(2) ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Effective price</span>
          <span className={`font-medium ${hasOverride ? "text-indigo-600" : ""}`}>
            ${day.effectivePrice?.toFixed(2) ?? "—"}
            {hasOverride && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded">{day.rateOverride.rateType}</span>}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={onAddBlock}
          className="w-full py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors">
          <Lock className="w-3.5 h-3.5" /> Block this date
        </button>
        {hasOverride ? (
          <button onClick={onDeleteRate}
            className="w-full py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Remove rate override
          </button>
        ) : (
          <button onClick={onEditRate}
            className="w-full py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-colors">
            <DollarSign className="w-3.5 h-3.5" /> Set rate override
          </button>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function RoomInventoryCalendar({ room, onClose }) {
  const roomId = room?.roomId;

  const today = fmt(new Date());
  const [fromDate, setFromDate] = useState(today);
  const [calendarDays, setCalendarDays]   = useState([]);
  const [blocks, setBlocks]               = useState([]);
  const [loading, setLoading]             = useState(false);
  const [activeCell, setActiveCell]       = useState(null); // date string of open popover
  const [activeCellData, setActiveCellData] = useState(null);

  /* block modal */
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    startDate: "", endDate: "", roomsBlocked: 1, blockType: "MAINTENANCE", reason: ""
  });
  const [blockSaving, setBlockSaving] = useState(false);

  /* rate override modal */
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateForm, setRateForm] = useState({
    overrideDate: "", priceOverride: "", rateType: "CUSTOM", reason: ""
  });
  const [rateSaving, setRateSaving] = useState(false);

  const WINDOW = 30;

  /* ── Fetch calendar ── */
  const fetchCalendar = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const to = addDays(fromDate, WINDOW - 1);
      const [calRes, blockRes] = await Promise.all([
        api.get(`/v1/inventory/rooms/${roomId}/calendar`, { params: { from: fromDate, to } }),
        api.get(`/v1/inventory/rooms/${roomId}/blocks`),
      ]);
      setCalendarDays(calRes.data || []);
      setBlocks(blockRes.data || []);
    } catch (err) {
      toast.error("Failed to load inventory calendar");
    } finally {
      setLoading(false);
    }
  }, [roomId, fromDate]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  /* ── Nav ── */
  const prevWindow = () => setFromDate(addDays(fromDate, -WINDOW));
  const nextWindow = () => setFromDate(addDays(fromDate, WINDOW));
  const resetWindow = () => setFromDate(today);

  /* ── Cell click ── */
  const handleCellClick = (day) => {
    if (activeCell === day.date) {
      setActiveCell(null);
      setActiveCellData(null);
    } else {
      setActiveCell(day.date);
      setActiveCellData(day);
    }
  };

  /* ── Block CRUD ── */
  const openBlockModal = (date) => {
    setBlockForm({ startDate: date || activeCell || today, endDate: date || activeCell || today, roomsBlocked: 1, blockType: "MAINTENANCE", reason: "" });
    setActiveCell(null);
    setShowBlockModal(true);
  };

  const saveBlock = async () => {
    if (!blockForm.startDate || !blockForm.endDate) { toast.error("Select start and end dates"); return; }
    if (blockForm.endDate < blockForm.startDate) { toast.error("End date must be after start date"); return; }
    setBlockSaving(true);
    try {
      await api.post(`/v1/inventory/rooms/${roomId}/blocks`, {
        ...blockForm,
        roomsBlocked: Number(blockForm.roomsBlocked) || 1,
      });
      toast.success("Block created");
      setShowBlockModal(false);
      fetchCalendar();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create block");
    } finally {
      setBlockSaving(false);
    }
  };

  const deleteBlock = async (blockId) => {
    try {
      await api.delete(`/v1/inventory/blocks/${blockId}`);
      toast.success("Block removed");
      fetchCalendar();
    } catch {
      toast.error("Failed to remove block");
    }
  };

  /* ── Rate override CRUD ── */
  const openRateModal = (date) => {
    setRateForm({ overrideDate: date || activeCell || today, priceOverride: room?.pricePerNight ?? "", rateType: "CUSTOM", reason: "" });
    setActiveCell(null);
    setShowRateModal(true);
  };

  const saveRate = async () => {
    if (!rateForm.overrideDate) { toast.error("Select a date"); return; }
    if (!rateForm.priceOverride || isNaN(rateForm.priceOverride)) { toast.error("Enter a valid price"); return; }
    setRateSaving(true);
    try {
      await api.post(`/v1/inventory/rooms/${roomId}/rates`, {
        overrideDate: rateForm.overrideDate,
        priceOverride: Number(rateForm.priceOverride),
        rateType: rateForm.rateType,
        reason: rateForm.reason || null,
      });
      toast.success("Rate override saved");
      setShowRateModal(false);
      fetchCalendar();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save rate override");
    } finally {
      setRateSaving(false);
    }
  };

  const deleteRate = async (day) => {
    if (!day?.rateOverride?.overrideId) return;
    try {
      await api.delete(`/v1/inventory/rates/${day.rateOverride.overrideId}`);
      toast.success("Rate override removed");
      setActiveCell(null);
      fetchCalendar();
    } catch {
      toast.error("Failed to remove rate override");
    }
  };

  /* ── Render ── */
  const endDate = addDays(fromDate, WINDOW - 1);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            Inventory Calendar
            <span className="font-normal text-slate-400 text-xs">·</span>
            <span className="text-xs font-medium text-slate-500">{room?.roomType} · Base ${room?.pricePerNight?.toFixed(2)}/night</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{fmtDisplay(fromDate)} — {fmtDisplay(endDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWindow} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={resetWindow} className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">Today</button>
          <button onClick={nextWindow} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={fetchCalendar} disabled={loading} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => openBlockModal()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
            <Lock className="w-3.5 h-3.5" /> Block dates
          </button>
          <button onClick={() => openRateModal()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors">
            <DollarSign className="w-3.5 h-3.5" /> Set rate
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
        {Object.entries(CELL_CONFIG).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${v.dot}`} />
            <span className="text-slate-500">{k.charAt(0) + k.slice(1).toLowerCase()}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-300" />
          <span className="text-slate-500">Rate override</span>
        </span>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading calendar…</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {/* Day-of-week headers */}
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-slate-400 pb-1">{d}</div>
            ))}
            {/* Offset padding for first day */}
            {calendarDays.length > 0 && (() => {
              const firstDay = new Date(calendarDays[0].date + "T00:00:00").getDay();
              return Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} />);
            })()}
            {/* Calendar cells */}
            {calendarDays.map((day) => {
              const cfg = CELL_CONFIG[day.cellStatus] || CELL_CONFIG.AVAILABLE;
              const isActive = activeCell === day.date;
              const dayNum = parseInt(day.date.slice(8), 10);
              const isToday = day.date === today;

              return (
                <div key={day.date} className="relative">
                  <button
                    onClick={() => handleCellClick(day)}
                    className={`
                      w-full aspect-square rounded-xl border text-left flex flex-col justify-between p-1.5 transition-all
                      ${cfg.bg}
                      ${isActive ? "ring-2 ring-slate-700 ring-offset-1" : ""}
                      ${day.hasRateOverride ? "border-indigo-300" : ""}
                    `}
                  >
                    <span className={`text-[11px] font-semibold ${cfg.text} ${isToday ? "underline" : ""}`}>{dayNum}</span>
                    <div className="space-y-0.5">
                      <div className="text-[9px] leading-tight text-slate-600">{day.availableRooms}/{day.totalRooms}</div>
                      {day.hasRateOverride && (
                        <div className="text-[9px] text-indigo-600 font-medium">${day.effectivePrice?.toFixed(0)}</div>
                      )}
                    </div>
                  </button>
                  {isActive && (
                    <CellDetail
                      day={activeCellData}
                      roomBasePrice={room?.pricePerNight}
                      onAddBlock={() => openBlockModal(activeCell)}
                      onEditRate={() => openRateModal(activeCell)}
                      onDeleteRate={() => deleteRate(activeCellData)}
                      onClose={() => { setActiveCell(null); setActiveCellData(null); }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active blocks list */}
      {blocks.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Active Blocks
          </h4>
          <div className="space-y-2">
            {blocks.map((b) => (
              <div key={b.blockId} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-700">
                      {fmtDisplay(b.startDate)} – {fmtDisplay(b.endDate)}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">{b.blockType}</span>
                    <span className="text-[10px] text-slate-500">{b.roomsBlocked} room{b.roomsBlocked > 1 ? "s" : ""}</span>
                  </div>
                  {b.reason && <p className="text-xs text-slate-400 mt-0.5 truncate">{b.reason}</p>}
                </div>
                <button
                  onClick={() => deleteBlock(b.blockId)}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Block modal ── */}
      {showBlockModal && (
        <Modal title="Block Room Dates" onClose={() => setShowBlockModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <input type="date" value={blockForm.startDate}
                  onChange={e => setBlockForm(p => ({ ...p, startDate: e.target.value }))}
                  className={inputCls} min={today} />
              </Field>
              <Field label="End date">
                <input type="date" value={blockForm.endDate}
                  onChange={e => setBlockForm(p => ({ ...p, endDate: e.target.value }))}
                  className={inputCls} min={blockForm.startDate || today} />
              </Field>
            </div>
            <Field label="Block type">
              <select value={blockForm.blockType}
                onChange={e => setBlockForm(p => ({ ...p, blockType: e.target.value }))}
                className={inputCls}>
                {BLOCK_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label={`Rooms to block (max ${room?.totalRooms ?? 1})`}>
              <input type="number" min={1} max={room?.totalRooms ?? 1}
                value={blockForm.roomsBlocked}
                onChange={e => setBlockForm(p => ({ ...p, roomsBlocked: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Reason (optional)">
              <textarea value={blockForm.reason}
                onChange={e => setBlockForm(p => ({ ...p, reason: e.target.value }))}
                className={`${inputCls} resize-none`} rows={2} placeholder="e.g. Renovation, maintenance…" />
            </Field>
            <div className="flex gap-2 pt-1">
              <button onClick={saveBlock} disabled={blockSaving} className={btnPrimary}>
                {blockSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                Create Block
              </button>
              <button onClick={() => setShowBlockModal(false)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Rate override modal ── */}
      {showRateModal && (
        <Modal title="Set Rate Override" onClose={() => setShowRateModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
              Override the nightly price for a specific date. Base price: <strong>${room?.pricePerNight?.toFixed(2)}/night</strong>
            </div>
            <Field label="Date">
              <input type="date" value={rateForm.overrideDate}
                onChange={e => setRateForm(p => ({ ...p, overrideDate: e.target.value }))}
                className={inputCls} min={today} />
            </Field>
            <Field label="Override price (per night)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" min={0} step="0.01"
                  value={rateForm.priceOverride}
                  onChange={e => setRateForm(p => ({ ...p, priceOverride: e.target.value }))}
                  className={`${inputCls} pl-6`} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Rate type">
              <select value={rateForm.rateType}
                onChange={e => setRateForm(p => ({ ...p, rateType: e.target.value }))}
                className={inputCls}>
                {RATE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Reason (optional)">
              <textarea value={rateForm.reason}
                onChange={e => setRateForm(p => ({ ...p, reason: e.target.value }))}
                className={`${inputCls} resize-none`} rows={2} placeholder="e.g. Peak season pricing…" />
            </Field>
            <div className="flex gap-2 pt-1">
              <button onClick={saveRate} disabled={rateSaving} className={btnPrimary}>
                {rateSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                Save Override
              </button>
              <button onClick={() => setShowRateModal(false)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

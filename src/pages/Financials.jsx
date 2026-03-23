import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  DollarSign, Calendar, RefreshCw, TrendingUp, BookOpen,
  LogIn, LogOut, XCircle, Search, Building2, MapPin,
} from "lucide-react";
import {
  fetchHotelRevenue,
  fetchBookingSummary,
  fetchHotelPayments,
  selectBookingSummary,
  selectBookingsLoading,
  selectPaymentsTotal,
  selectRevenue,
} from "../store/slices/bookingSlice";
import { fetchOwnerHotels } from "../store/slices/PartnerHotelslice";

const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const Financials = () => {
  const dispatch = useDispatch();
  const summary = useSelector(selectBookingSummary);
  const loading = useSelector(selectBookingsLoading);
  const paymentsTotal = useSelector(selectPaymentsTotal);
  const revenue = useSelector(selectRevenue);
  const primaryHotelId = useSelector((state) => state.user.hotelId);
  const { hotels: ownerHotels } = useSelector((state) => state.partneredhotels);

  const [activeHotelId, setActiveHotelId] = useState(null);
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(today());
  const [hasSearched, setHasSearched] = useState(false);

  /* ── Load owner hotels ── */
  useEffect(() => {
    if (ownerHotels.length === 0) dispatch(fetchOwnerHotels());
  }, []);

  useEffect(() => {
    if (!activeHotelId && primaryHotelId) setActiveHotelId(primaryHotelId);
  }, [primaryHotelId]);

  useEffect(() => {
    if (!activeHotelId && ownerHotels.length > 0) {
      setActiveHotelId(ownerHotels[0].partneredHotelId || ownerHotels[0].id);
    }
  }, [ownerHotels]);

  /* ── Initial data load when hotel is ready (lightweight — no payment scan) ── */
  useEffect(() => {
    if (activeHotelId) {
      dispatch(fetchBookingSummary(activeHotelId));
    }
  }, [activeHotelId]);

  const fetchData = (hid = activeHotelId) => {
    if (!hid) return;
    dispatch(fetchHotelRevenue({ hotelId: hid, fromDate, toDate }));
    dispatch(fetchBookingSummary(hid));
    dispatch(fetchHotelPayments(hid));  // heavier call — only on explicit Search
    setHasSearched(true);
  };

  /* ── Active hotel info ── */
  const activeHotel = ownerHotels.find(
    (h) => (h.partneredHotelId || h.id) === activeHotelId
  );

  /* Revenue from the dedicated revenue endpoint */
  const revenueAmount = revenue?.totalRevenue ?? revenue?.revenue ?? revenue?.amount ?? null;

  const summaryCards = [
    { label: "Total Bookings", value: summary?.totalBookings ?? "—", icon: BookOpen,  color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200" },
    { label: "Booked",         value: summary?.booked        ?? "—", icon: Calendar,  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"  },
    { label: "Checked In",     value: summary?.checkedIn     ?? "—", icon: LogIn,     color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
    { label: "Checked Out",    value: summary?.checkedOut    ?? "—", icon: LogOut,    color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200"},
    { label: "Cancelled",      value: summary?.cancelled     ?? "—", icon: XCircle,   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"   },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Financials</h1>
        <p className="text-slate-500 text-sm">Revenue and booking summary per hotel</p>
      </div>

      {/* Hotel Selector */}
      {ownerHotels.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" /> Select Hotel
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ownerHotels.map((h) => {
              const hid = h.partneredHotelId || h.id;
              const selected = hid === activeHotelId;
              return (
                <button key={hid} type="button" onClick={() => { setActiveHotelId(hid); setHasSearched(false); }}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-700"
                  }`}>
                  <p className={`text-sm font-semibold truncate ${selected ? "text-white" : "text-slate-900"}`}>
                    {h.name || h.hotelName}
                  </p>
                  {(h.location || h.address) && (
                    <p className={`text-xs flex items-center gap-1 mt-0.5 truncate ${selected ? "text-slate-300" : "text-slate-500"}`}>
                      <MapPin className="w-3 h-3 shrink-0" /> {h.location || h.address}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single hotel name tag (when only 1 hotel) */}
      {ownerHotels.length === 1 && activeHotel && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{activeHotel.name || activeHotel.hotelName}</span>
          {(activeHotel.location || activeHotel.address) && (
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {activeHotel.location || activeHotel.address}
            </span>
          )}
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" /> Revenue Date Range
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">From Date</label>
            <input type="date" value={fromDate} max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">To Date</label>
            <input type="date" value={toDate} min={fromDate} max={today()}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
          <button onClick={() => fetchData()} disabled={loading || !activeHotelId}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      {hasSearched && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Revenue from dedicated endpoint */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium mb-1">Hotel Revenue</p>
                <p className="text-4xl font-bold tracking-tight">
                  ${revenueAmount != null
                    ? Number(revenueAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "—"}
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  {fromDate} → {toDate}
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Total payments sum */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Total Payments Collected</p>
                <p className="text-4xl font-bold tracking-tight">
                  ${paymentsTotal != null
                    ? paymentsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "0.00"}
                </p>
                <p className="text-emerald-200 text-xs mt-2">Sum of all booking payments</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Booking Summary Cards */}
      {(summary && hasSearched) && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Booking Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {summaryCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={`${card.bg} border ${card.border} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Select a date range and click Search to view revenue</p>
        </div>
      )}
    </div>
  );
};

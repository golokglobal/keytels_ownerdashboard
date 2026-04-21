import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Calendar, TrendingUp, BookOpen,
  LogIn, LogOut, XCircle, Search, CreditCard,
  RefreshCw, FileText, Loader2, ExternalLink, Building2,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { HotelSelector } from "../components/shared/HotelSelector";
import {
  fetchHotelRevenue,
  fetchBookingSummary,
  fetchHotelBookings,
  selectBookingSummary,
  selectBookingsLoading,
  selectPaymentsTotal,
  selectRevenue,
} from "../store/slices/bookingSlice";
import { selectPrimaryHotelId, selectUserId } from "../store/slices/userSlice";
import {
  fetchOwnerDashboardAnalytics,
  fetchOwnerInvoices,
  fetchOwnerPayments,
  selectOwnerDashboard,
  selectOwnerDashboardLoading,
  selectInvoices,
  selectInvoicesLoading,
  selectOwnerPayments,
  selectOwnerPaymentsLoading,
} from "../store/slices/paymentsSlice";

const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

const fmtCurrency = (amount, currency = "usd") =>
  amount != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount)
    : "—";

/* ── Invoice Status Badge ─────────────────────────────────────────────── */
const INVOICE_STATUS = {
  paid:          { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Paid" },
  open:          { cls: "bg-blue-50 text-blue-700 border-blue-200",          label: "Open" },
  draft:         { cls: "bg-slate-100 text-slate-600 border-slate-200",      label: "Draft" },
  uncollectible: { cls: "bg-orange-50 text-orange-700 border-orange-200",    label: "Uncollectible" },
  void:          { cls: "bg-red-50 text-red-600 border-red-200",             label: "Void" },
};

function InvoiceStatusBadge({ status }) {
  const cfg = INVOICE_STATUS[status?.toLowerCase()] ?? { cls: "bg-slate-100 text-slate-600 border-slate-200", label: status ?? "Unknown" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/* ── Payment Status Badge ─────────────────────────────────────────────── */
const PAYMENT_STATUS = {
  succeeded: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Succeeded" },
  pending:   { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",    label: "Pending" },
  failed:    { cls: "bg-red-50 text-red-700 border-red-200",             label: "Failed" },
  refunded:  { cls: "bg-purple-50 text-purple-700 border-purple-200",    label: "Refunded" },
};

function PaymentStatusBadge({ status }) {
  const cfg = PAYMENT_STATUS[status?.toLowerCase()] ?? { cls: "bg-slate-100 text-slate-600 border-slate-200", label: status ?? "Unknown" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export const Financials = () => {
  const dispatch = useDispatch();
  const ownerId       = useSelector(selectUserId);
  const activeHotelId = useSelector(selectPrimaryHotelId);

  // All-properties dashboard (owner-level)
  const ownerDashboard        = useSelector(selectOwnerDashboard);
  const ownerDashboardLoading = useSelector(selectOwnerDashboardLoading);
  const [allFromDate, setAllFromDate] = useState(daysAgo(30));
  const [allToDate, setAllToDate]     = useState(today());

  // Selected hotel revenue
  const summary       = useSelector(selectBookingSummary);
  const loading       = useSelector(selectBookingsLoading);
  const paymentsTotal = useSelector(selectPaymentsTotal);
  const revenue       = useSelector(selectRevenue);
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate]     = useState(today());
  const [hasSearched, setHasSearched] = useState(false);

  // Invoices & Payments
  const invoices             = useSelector(selectInvoices);
  const invoicesLoading      = useSelector(selectInvoicesLoading);
  const ownerPayments        = useSelector(selectOwnerPayments);
  const ownerPaymentsLoading = useSelector(selectOwnerPaymentsLoading);
  const [tab, setTab] = useState("invoices");

  // Load all-properties revenue on mount
  useEffect(() => {
    if (!ownerId) return;
    dispatch(fetchOwnerDashboardAnalytics({ ownerId, startDate: allFromDate, endDate: allToDate }));
    dispatch(fetchOwnerInvoices(ownerId));
    dispatch(fetchOwnerPayments(ownerId));
  }, [ownerId, dispatch]);

  // Reset hotel revenue when hotel changes
  useEffect(() => {
    if (activeHotelId) {
      dispatch(fetchBookingSummary(activeHotelId));
      setHasSearched(false);
    }
  }, [activeHotelId, dispatch]);

  const searchAllProperties = () => {
    if (!ownerId) return;
    dispatch(fetchOwnerDashboardAnalytics({ ownerId, startDate: allFromDate, endDate: allToDate }));
  };

  const searchHotelRevenue = () => {
    if (!activeHotelId) return;
    dispatch(fetchHotelRevenue({ hotelId: activeHotelId, fromDate, toDate }));
    dispatch(fetchHotelBookings({ hotelId: activeHotelId, filters: {} }));
    setHasSearched(true);
  };

  const revenueAmount = revenue?.totalRevenue ?? revenue?.revenue ?? revenue?.amount ?? null;

  const summaryCards = [
    { label: "Total Bookings", value: summary?.totalBookings ?? "—", icon: BookOpen, color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200" },
    { label: "Booked",         value: summary?.booked        ?? "—", icon: Calendar, color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"  },
    { label: "Checked In",     value: summary?.checkedIn     ?? "—", icon: LogIn,    color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
    { label: "Checked Out",    value: summary?.checkedOut    ?? "—", icon: LogOut,   color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200"},
    { label: "Cancelled",      value: summary?.cancelled     ?? "—", icon: XCircle,  color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"   },
  ];

  return (
    <div className="space-y-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financials</h1>
        <p className="text-slate-500 text-sm mt-0.5">Hotel revenue, invoices, and payment history</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — ALL PROPERTIES REVENUE (from owner dashboard API)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" /> All Properties Revenue
          </h2>
        </div>

        {/* Date filter for all-properties */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">From Date</label>
              <input
                type="date"
                value={allFromDate}
                max={allToDate}
                onChange={(e) => setAllFromDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">To Date</label>
              <input
                type="date"
                value={allToDate}
                min={allFromDate}
                max={today()}
                onChange={(e) => setAllToDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={searchAllProperties}
              disabled={ownerDashboardLoading || !ownerId}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
            >
              {ownerDashboardLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {ownerDashboardLoading ? "Loading…" : "Search"}
            </button>
          </div>
        </div>

        {ownerDashboardLoading && !ownerDashboard && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Loader2 className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Loading revenue…</p>
          </div>
        )}

        {ownerDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white sm:col-span-1">
                <p className="text-slate-300 text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold tracking-tight">{fmtCurrency(ownerDashboard.totalRevenue)}</p>
                <p className="text-slate-400 text-xs mt-2">
                  {ownerDashboard.totalHotels ?? 0} propert{ownerDashboard.totalHotels !== 1 ? "ies" : "y"} · {allFromDate} → {allToDate}
                </p>
              </div>
              {ownerDashboard.monthlyRevenue?.map((m) => (
                <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-6">
                  <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">
                    {new Date(m.label + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{fmtCurrency(m.revenue)}</p>
                  <p className="text-slate-400 text-xs mt-1">Monthly revenue</p>
                </div>
              ))}
            </div>

            {/* Daily Revenue Bar Chart */}
            {ownerDashboard.dailyRevenue?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-slate-400" /> Daily Revenue
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ownerDashboard.dailyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                      width={52}
                    />
                    <Tooltip
                      formatter={(v) => [fmtCurrency(v), "Revenue"]}
                      labelFormatter={(l) => new Date(l).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Bar dataKey="revenue" fill="#1e293b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per-hotel breakdown table */}
            {ownerDashboard.revenueByHotel?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">Revenue by Property</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 uppercase tracking-wider">Property</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 uppercase tracking-wider">Revenue</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 uppercase tracking-wider">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ownerDashboard.revenueByHotel.map((h) => {
                      const pct = ownerDashboard.totalRevenue > 0
                        ? ((h.revenue / ownerDashboard.totalRevenue) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <tr key={h.hotelId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              {h.hotelName ?? h.hotelId}
                            </div>
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{fmtCurrency(h.revenue)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[80px]">
                                <div
                                  className="bg-slate-800 h-1.5 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — SELECTED HOTEL REVENUE
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-500" /> Selected Hotel Revenue
        </h2>

        <div className="mt-1">
          <HotelSelector />
        </div>

        {!activeHotelId ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Select a hotel</h3>
            <p className="text-slate-600 text-sm">Choose a hotel from above to view its revenue.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHotelId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              {/* Date Range Filter */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Revenue Date Range
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate}
                      max={today()}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    onClick={searchHotelRevenue}
                    disabled={loading || !activeHotelId}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? "Loading…" : "Search"}
                  </button>
                </div>
              </div>

              {/* Revenue Cards */}
              {hasSearched && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl p-6 text-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-indigo-100 text-sm font-medium mb-1">Hotel Revenue</p>
                        <p className="text-4xl font-bold tracking-tight">
                          {revenueAmount != null
                            ? fmtCurrency(revenueAmount)
                            : "—"}
                        </p>
                        <p className="text-indigo-200 text-xs mt-2">{fromDate} → {toDate}</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium mb-1">Total Payments Collected</p>
                        <p className="text-4xl font-bold tracking-tight">
                          {paymentsTotal != null
                            ? fmtCurrency(paymentsTotal)
                            : "$0.00"}
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
              {summary && hasSearched && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Booking Summary</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {summaryCards.map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <motion.div
                          key={card.label}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`${card.bg} border ${card.border} rounded-xl p-4`}
                        >
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
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — INVOICES & PAYMENTS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" /> Invoices & Payments
          </h2>
          <button
            onClick={() => {
              if (!ownerId) return;
              dispatch(fetchOwnerInvoices(ownerId));
              dispatch(fetchOwnerPayments(ownerId));
            }}
            disabled={invoicesLoading || ownerPaymentsLoading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(invoicesLoading || ownerPaymentsLoading) ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {["invoices", "payments"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize
                ${tab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Invoices */}
        {tab === "invoices" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {invoicesLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Loading invoices…</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Invoice #", "Period", "Amount Due", "Amount Paid", "Status", "Paid At", ""].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.invoiceRecordId ?? inv.stripeInvoiceId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {inv.invoiceNumber ?? inv.stripeInvoiceId?.slice(0, 14) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmt(inv.periodStart)} – {fmt(inv.periodEnd)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{fmtCurrency(inv.amountDue, inv.currency)}</td>
                        <td className="px-4 py-3 text-emerald-700 font-medium">{fmtCurrency(inv.amountPaid, inv.currency)}</td>
                        <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{fmt(inv.paidAt)}</td>
                        <td className="px-4 py-3 flex gap-3">
                          {inv.hostedInvoiceUrl && (
                            <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {inv.invoicePdf && (
                            <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium">
                              PDF <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {ownerPaymentsLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Loading payments…</p>
              </div>
            ) : ownerPayments.length === 0 ? (
              <div className="p-10 text-center">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Payment ID", "Booking ID", "Amount", "Currency", "Status", "Date"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ownerPayments.map((pay) => (
                      <tr key={pay.paymentId ?? pay.stripePaymentId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {pay.stripePaymentId?.slice(0, 20) ?? pay.paymentId?.slice(0, 8) ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{pay.bookingId?.slice(0, 8) ?? "—"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{fmtCurrency(pay.amount, pay.currency)}</td>
                        <td className="px-4 py-3 text-slate-500 uppercase text-xs">{pay.currency ?? "—"}</td>
                        <td className="px-4 py-3"><PaymentStatusBadge status={pay.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{fmt(pay.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

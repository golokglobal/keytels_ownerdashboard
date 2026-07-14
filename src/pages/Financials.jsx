import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Calendar, TrendingUp, BookOpen,
  LogIn, LogOut, XCircle, Search, CreditCard,
  RefreshCw, FileText, Loader2, ExternalLink, Building2,
  BarChart2, Send, AlertCircle, CheckCircle, Wallet, Clock,
  ArrowDownToLine, Banknote, ShieldOff, Plus, X, Landmark,
  ChevronDown, Star,
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
import { selectPrimaryHotelId, selectUserId, selectCurrentUser } from "../store/slices/userSlice";
import {
  fetchOwnerBilling,
  fetchOwnerDashboardAnalytics,
  fetchOwnerInvoices,
  fetchOwnerPayments,
  withdrawBalance,
  selectOwnerDashboard,
  selectOwnerDashboardLoading,
  selectInvoices,
  selectInvoicesLoading,
  selectOwnerPayments,
  selectOwnerPaymentsLoading,
  selectBilling,
  selectBillingLoading,
  selectWithdrawLoading,
  selectWithdrawError,
} from "../store/slices/paymentsSlice";
import { sendPayout, getOwnerPayoutHistory, getOwnerBankAccounts, addOwnerBankAccount, withdrawToSpecificAccount, getStripeDashboardLink } from "../api/payouts";
import { getStripeOnboardingLink } from "../api/payments";
import { getHotelBookings } from "../api/bookings";
import { toast } from "react-toastify";

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

/**
 * fmtCurrency — format an amount in the given currency using locale-aware formatting.
 * All platform amounts are stored in USD; pass `currency` override when invoice/payout
 * specifies a different currency.
 */
const fmtCurrency = (amount, currency = "USD", locale = "en-US") => {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
};

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
  const currentUser   = useSelector(selectCurrentUser);
  const billing       = useSelector(selectBilling);

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

  const billingLoading = useSelector(selectBillingLoading);

  // Stripe onboarding
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const handleCompleteStripeSetup = async () => {
    if (!ownerId) return;
    setOnboardingLoading(true);
    try {
      const { url } = await getStripeOnboardingLink(ownerId);
      if (url) window.location.href = url;
      else toast.error("Could not retrieve onboarding link. Please try again.");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to get onboarding link.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Withdraw / payout functionality
  const withdrawLoading = useSelector(selectWithdrawLoading);
  const withdrawError   = useSelector(selectWithdrawError);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  // Legacy manual amount payout (admin-facing, kept for backward compat)
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState(null);

  const availableBalance = parseFloat(billing?.availableBalanceUsd ?? 0);
  const lastPayoutAt     = billing?.lastPayoutAt;
  const nextAutoPayoutAt = billing?.nextAutoPayoutAt;

  const handleWithdraw = async () => {
    if (!ownerId) return;
    setWithdrawSuccess(false);
    try {
      await dispatch(withdrawBalance(ownerId)).unwrap();
      setWithdrawSuccess(true);
      dispatch(fetchOwnerBilling(ownerId));
      toast.success("Withdrawal initiated! Funds arrive in 2–7 business days.");
    } catch (err) {
      toast.error(err || "Withdrawal failed. Please try again.");
    }
  };

  // Payout history
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [payoutHistoryLoading, setPayoutHistoryLoading] = useState(false);

  // Bank account management
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(null); // null = default (auto-selected by Stripe)
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [addBankLoading, setAddBankLoading] = useState(false);
  const [bankForm, setBankForm] = useState({
    country: "IN",
    currency: "inr",
    accountNumber: "",
    routingNumber: "",
    accountHolderName: "",
    accountHolderType: "individual",
    setDefault: false,
  });

  // Load payout history
  const loadPayoutHistory = async () => {
    if (!ownerId) return;
    setPayoutHistoryLoading(true);
    try {
      const data = await getOwnerPayoutHistory(ownerId);
      setPayoutHistory(Array.isArray(data) ? data : []);
    } catch {
      setPayoutHistory([]);
    } finally {
      setPayoutHistoryLoading(false);
    }
  };

  // Load linked bank accounts
  const loadBankAccounts = async () => {
    if (!ownerId) return;
    setBankAccountsLoading(true);
    try {
      const data = await getOwnerBankAccounts(ownerId);
      setBankAccounts(Array.isArray(data) ? data : []);
    } catch {
      setBankAccounts([]);
    } finally {
      setBankAccountsLoading(false);
    }
  };

  // Open Stripe Express dashboard so owner can manage bank accounts there
  const [stripeDashboardLoading, setStripeDashboardLoading] = useState(false);
  const openStripeDashboard = async () => {
    if (!ownerId) return;
    setStripeDashboardLoading(true);
    try {
      const result = await getStripeDashboardLink(ownerId);
      if (result?.dashboardUrl) {
        window.open(result.dashboardUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(result?.error || "Could not open Stripe dashboard.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Could not open Stripe dashboard.");
    } finally {
      setStripeDashboardLoading(false);
    }
  };

  // Handle "Add Bank Account" form submit
  // For Express accounts the backend returns { status: "redirect", dashboardUrl }
  // and we open the Stripe Express dashboard instead.
  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    if (!ownerId) return;
    setAddBankLoading(true);
    try {
      const result = await addOwnerBankAccount(ownerId, bankForm);
      if (result?.status === "redirect" && result?.dashboardUrl) {
        // Express account — open Stripe dashboard to manage bank accounts
        setShowAddBankModal(false);
        window.open(result.dashboardUrl, "_blank", "noopener,noreferrer");
        toast.info("Opening your Stripe dashboard — add or change bank accounts there, then come back and refresh.");
      } else if (result?.status === "success") {
        toast.success(`Bank account added! ****${result.last4 ?? ""}`);
        setShowAddBankModal(false);
        setBankForm({ country: "IN", currency: "inr", accountNumber: "", routingNumber: "", accountHolderName: "", accountHolderType: "individual", setDefault: false });
        loadBankAccounts();
      } else {
        toast.error(result?.error || "Failed to add bank account.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to add bank account.");
    } finally {
      setAddBankLoading(false);
    }
  };

  // Withdraw to selected bank account
  const handleWithdrawToAccount = async () => {
    if (!ownerId || !selectedBankId) return;
    setWithdrawSuccess(false);
    try {
      const result = await withdrawToSpecificAccount(ownerId, selectedBankId);
      if (result?.status === "success") {
        setWithdrawSuccess(true);
        dispatch(fetchOwnerBilling(ownerId));
        toast.success("Withdrawal initiated! Funds arrive in 2–7 business days.");
      } else {
        toast.error(result?.error || "Withdrawal failed.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Withdrawal failed.");
    }
  };

  // Cancelled bookings
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [cancelledLoading, setCancelledLoading]   = useState(false);

  const loadCancelledBookings = async (hotelId) => {
    if (!hotelId) return;
    setCancelledLoading(true);
    try {
      const data = await getHotelBookings(hotelId, { bookingStatus: "CANCELLED" });
      setCancelledBookings(Array.isArray(data) ? data : []);
    } catch {
      setCancelledBookings([]);
    } finally {
      setCancelledLoading(false);
    }
  };

  // Load all-properties revenue on mount
  useEffect(() => {
    if (!ownerId) return;
    dispatch(fetchOwnerBilling(ownerId));          // ← must be first so billing/payouts banner is correct on refresh
    dispatch(fetchOwnerDashboardAnalytics({ ownerId, startDate: allFromDate, endDate: allToDate }));
    dispatch(fetchOwnerInvoices(ownerId));
    dispatch(fetchOwnerPayments(ownerId));
    loadPayoutHistory();
    loadBankAccounts();
  }, [ownerId, dispatch]);

  // Reset hotel revenue + load cancellations when hotel changes
  useEffect(() => {
    if (activeHotelId) {
      dispatch(fetchBookingSummary(activeHotelId));
      setHasSearched(false);
      loadCancelledBookings(activeHotelId);
    }
  }, [activeHotelId, dispatch]); // eslint-disable-line

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
                {/* Commission deduction */}
                {billing?.plan?.commissionRate != null && ownerDashboard.totalRevenue > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <p className="text-slate-400 text-xs">
                      Platform commission ({Math.round(billing.plan.commissionRate * 100)}%):
                      <span className="text-red-300 font-semibold ml-1">
                        -{fmtCurrency(ownerDashboard.totalRevenue * billing.plan.commissionRate)}
                      </span>
                    </p>
                    <p className="text-emerald-300 text-sm font-bold mt-1">
                      Net earnings: {fmtCurrency(ownerDashboard.totalRevenue * (1 - billing.plan.commissionRate))}
                    </p>
                  </div>
                )}
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
          {["invoices", "payments", "payouts", "cancellations"].map((t) => (
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
                      {["Invoice #", "Description", "Period", "Amount Due", "Amount Paid", "Status", "Paid At", ""].map((h) => (
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
                        <td className="px-4 py-3 max-w-xs">
                          {/* Line items breakdown — shows what each charge covers */}
                          {inv.lineItemsSummary ? (
                            <span className="text-xs text-slate-600 leading-relaxed">{inv.lineItemsSummary}</span>
                          ) : inv.billingReason ? (
                            <span className="text-xs text-slate-400 italic">
                              {inv.billingReason === "subscription_create"  ? "New subscription"
                                : inv.billingReason === "subscription_cycle"  ? "Monthly renewal"
                                : inv.billingReason === "subscription_update" ? "Plan / property change"
                                : inv.billingReason === "manual"              ? "Manual charge"
                                : inv.billingReason}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(inv.periodStart)} – {fmt(inv.periodEnd)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{fmtCurrency(inv.amountDue, inv.currency)}</td>
                        <td className="px-4 py-3 text-emerald-700 font-medium">{fmtCurrency(inv.amountPaid, inv.currency)}</td>
                        <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(inv.paidAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
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
                          </div>
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

        {/* Payouts */}
        {tab === "payouts" && (
          <div className="space-y-5">

            {/* ── Available Balance Card ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-0.5">Earnings Wallet</h3>
                  <p className="text-sm text-slate-500">
                    Balance from completed guest check-ins. Withdraw anytime — or we auto-pay you every 7 days.
                  </p>
                </div>
              </div>

              {/* Balance display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1">Available to Withdraw</p>
                  <p className="text-3xl font-black text-violet-900">
                    {fmtCurrency(availableBalance, "USD")}
                  </p>
                  <p className="text-xs text-violet-500 mt-1">
                    {availableBalance === 0 ? "Credited after each guest check-in" : "Ready to send to your bank"}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last Payout
                  </p>
                  <p className="text-base font-bold text-slate-700 mt-1">{lastPayoutAt ? fmt(lastPayoutAt) : "—"}</p>
                  <p className="text-xs text-slate-400 mt-1">{lastPayoutAt ? "Bank transfer" : "No payouts yet"}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Next Auto-Payout
                  </p>
                  <p className="text-base font-bold text-slate-700 mt-1">{nextAutoPayoutAt ? fmt(nextAutoPayoutAt) : "Every Sunday"}</p>
                  <p className="text-xs text-slate-400 mt-1">Auto-transfers every 7 days</p>
                </div>
              </div>

              {/* Stripe onboarding check — only show once billing has loaded; never flash on refresh */}
              {billing === null || billingLoading ? null : !billing.stripeAccountId || !billing.stripePayoutsEnabled ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900 mb-1">Stripe account setup required</p>
                      <p className="text-xs text-amber-700 mb-3">
                        Complete your Stripe Connect onboarding to receive payouts.
                        Your earned balance is accumulating — link a bank account to withdraw it.
                      </p>
                      <button
                        onClick={handleCompleteStripeSetup}
                        disabled={onboardingLoading || !ownerId}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {onboardingLoading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Opening Stripe…</>
                          : <><ExternalLink className="w-3.5 h-3.5" />Complete Stripe Setup</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Success / error banners */}
                  {withdrawSuccess && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Withdrawal initiated!</p>
                        <p className="text-xs text-emerald-700">Funds arrive in 2–7 business days. Balance reset to $0.00.</p>
                      </div>
                    </motion.div>
                  )}
                  {withdrawError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{withdrawError}</p>
                    </motion.div>
                  )}

                  {/* ── Bank account selector ── */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" /> Withdraw to bank account
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openStripeDashboard}
                          disabled={stripeDashboardLoading}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors disabled:opacity-50"
                          title="Manage bank accounts on Stripe"
                        >
                          {stripeDashboardLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                          Manage on Stripe
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={() => setShowAddBankModal(true)}
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add account
                        </button>
                      </div>
                    </div>

                    {bankAccountsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading accounts…
                      </div>
                    ) : bankAccounts.length === 0 ? (
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        No bank accounts linked yet. Add one to receive withdrawals.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Default (auto-select by Stripe) option */}
                        <label className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedBankId === null ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <input
                            type="radio"
                            name="bankAccount"
                            checked={selectedBankId === null}
                            onChange={() => setSelectedBankId(null)}
                            className="accent-violet-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              Default bank account
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            </p>
                            <p className="text-[10px] text-slate-400">Stripe auto-selects your primary account</p>
                          </div>
                        </label>
                        {/* Each linked account */}
                        {bankAccounts.map((ba) => (
                          <label key={ba.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedBankId === ba.id ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                            <input
                              type="radio"
                              name="bankAccount"
                              checked={selectedBankId === ba.id}
                              onChange={() => setSelectedBankId(ba.id)}
                              className="accent-violet-600"
                            />
                            <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">
                                {ba.bankName || "Bank"} ···· {ba.last4}
                                {ba.isDefault && <span className="ml-1.5 text-[10px] text-amber-600 font-medium">(default)</span>}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {ba.accountHolderName} · {ba.country} · {ba.currency?.toUpperCase()} · {ba.status}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Withdraw button — default or to specific account */}
                  {selectedBankId === null ? (
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawLoading || availableBalance < 0.50}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-200"
                    >
                      {withdrawLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                        : <><ArrowDownToLine className="w-4 h-4" />Withdraw {fmtCurrency(availableBalance, "USD")} to Default Bank</>}
                    </button>
                  ) : (
                    <button
                      onClick={handleWithdrawToAccount}
                      disabled={withdrawLoading || availableBalance < 0.50}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-200"
                    >
                      {withdrawLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                        : <><ArrowDownToLine className="w-4 h-4" />Withdraw {fmtCurrency(availableBalance, "USD")} to Selected Account</>}
                    </button>
                  )}

                  <p className="text-xs text-center text-slate-400">
                    Minimum withdrawal $0.50 · Or wait for Sunday auto-payout · 2–7 business days to your bank
                  </p>
                </div>
              )}
            </div>

            {/* Payout history */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Payout History</p>
                <button onClick={loadPayoutHistory} disabled={payoutHistoryLoading}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${payoutHistoryLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {payoutHistoryLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Loading payout history…</p>
                </div>
              ) : payoutHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Send className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No payouts yet</p>
                  <p className="text-xs text-slate-400 mt-1">Request a payout above to see it here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Transfer ID', 'Amount', 'Currency', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payoutHistory.map((p, i) => (
                        <tr key={p.id ?? i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{String(p.transferId ?? p.id ?? '—').slice(0, 24)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{fmtCurrency(p.amount != null ? p.amount / 100 : null)}</td>
                          <td className="px-4 py-3 text-slate-500 uppercase text-xs">{p.currency ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.status?.toLowerCase() === 'failed'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>{p.status ?? 'INITIATED'}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{fmt(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add Bank Account Modal ───────────────────────────────────── */}
        <AnimatePresence>
          {showAddBankModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={(e) => e.target === e.currentTarget && setShowAddBankModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-violet-600" />
                    <h3 className="text-base font-bold text-slate-900">Add Bank Account</h3>
                  </div>
                  <button onClick={() => setShowAddBankModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Modal body */}
                <form onSubmit={handleAddBankAccount} className="p-6 space-y-4">

                  {/* Country + Currency row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                      <select
                        value={bankForm.country}
                        onChange={(e) => {
                          const c = e.target.value;
                          setBankForm(f => ({ ...f, country: c, currency: c === "IN" ? "inr" : c === "GB" ? "gbp" : c === "AE" ? "aed" : c === "SG" ? "sgd" : c === "AU" ? "aud" : "usd" }));
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="IN">🇮🇳 India</option>
                        <option value="US">🇺🇸 USA</option>
                        <option value="GB">🇬🇧 UK</option>
                        <option value="AE">🇦🇪 UAE</option>
                        <option value="SG">🇸🇬 Singapore</option>
                        <option value="AU">🇦🇺 Australia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Currency</label>
                      <input
                        type="text"
                        value={bankForm.currency.toUpperCase()}
                        readOnly
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Account holder name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full name as on bank account"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm(f => ({ ...f, accountHolderName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Account number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder={bankForm.country === "IN" ? "e.g. 123456789012" : "e.g. 000123456789"}
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm(f => ({ ...f, accountNumber: e.target.value.replace(/\s/g, "") }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
                    />
                  </div>

                  {/* Routing / IFSC */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {bankForm.country === "IN" ? "IFSC Code *" : "Routing Number"}
                    </label>
                    <input
                      type="text"
                      required={bankForm.country === "IN"}
                      placeholder={bankForm.country === "IN" ? "e.g. SBIN0001234" : "e.g. 110000000"}
                      value={bankForm.routingNumber}
                      onChange={(e) => setBankForm(f => ({ ...f, routingNumber: e.target.value.trim().toUpperCase() }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono uppercase"
                    />
                  </div>

                  {/* Account holder type + set as default */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account Type</label>
                      <select
                        value={bankForm.accountHolderType}
                        onChange={(e) => setBankForm(f => ({ ...f, accountHolderType: e.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="individual">Individual</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-5">
                      <input
                        type="checkbox"
                        checked={bankForm.setDefault}
                        onChange={(e) => setBankForm(f => ({ ...f, setDefault: e.target.checked }))}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                      <span className="text-xs font-medium text-slate-600">Set as default</span>
                    </label>
                  </div>

                  {/* Info note */}
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                    Bank details are sent securely to Stripe via your connected account. Keytels does not store your account number.
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddBankModal(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addBankLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addBankLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</>
                        : <><Plus className="w-4 h-4" />Add Account</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cancellations & Refunds tab ───────────────────────────────── */}
        {tab === "cancellations" && (
          <div className="space-y-4">

            {/* Summary strip */}
            {cancelledBookings.length > 0 && (() => {
              const totalLost   = cancelledBookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
              const totalRefund = cancelledBookings.reduce((s, b) => s + (b.refundAmount ?? 0), 0);
              const hotelKept   = totalLost - totalRefund;
              return (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Cancelled Value", value: fmtCurrency(totalLost),   icon: XCircle,  cls: "text-slate-700", bg: "bg-slate-50",   border: "border-slate-200" },
                    { label: "Refunded to Guests",    value: fmtCurrency(totalRefund), icon: Banknote, cls: "text-blue-700",  bg: "bg-blue-50",    border: "border-blue-200"  },
                    { label: "Hotel Penalty Kept",    value: fmtCurrency(hotelKept),   icon: Wallet,   cls: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
                  ].map(({ label, value, icon: Icon, cls, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${cls}`} />
                        <span className={`text-xs font-semibold ${cls}`}>{label}</span>
                      </div>
                      <p className={`text-xl font-bold ${cls}`}>{value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Policy note */}
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <ShieldOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-semibold">How it works: </span>
                When a guest cancels, the cancellation policy determines their refund. The non-refunded
                portion (minus our platform commission) is credited to your wallet balance. Full refunds
                mean $0 credited; partial refunds credit your penalty share; non-refundable bookings
                credit your full earning.
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" /> Cancelled Bookings
                </p>
                <button
                  onClick={() => activeHotelId && loadCancelledBookings(activeHotelId)}
                  disabled={cancelledLoading}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cancelledLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {cancelledLoading ? (
                <div className="p-10 text-center">
                  <Loader2 className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Loading cancellations…</p>
                </div>
              ) : cancelledBookings.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium text-sm">No cancellations</p>
                  <p className="text-slate-400 text-xs mt-1">All bookings for this hotel are active</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Booking Ref", "Guest", "Dates", "Total Paid", "Refunded", "Hotel Penalty", "Refund Status", "Cancelled"].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cancelledBookings.map((b, i) => {
                        const totalAmt   = b.totalAmount  ?? 0;
                        const refundAmt  = b.refundAmount ?? 0;
                        const hotelShare = totalAmt - refundAmt;
                        const isFullRef  = refundAmt >= totalAmt && totalAmt > 0;
                        const isNoRef    = refundAmt === 0;
                        const refSt      = b.refundStatus ?? "—";

                        return (
                          <tr key={b.bookingId ?? i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                              {b.bookingReferenceNumber ?? "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="font-medium text-slate-800 text-xs">{b.guestName ?? "—"}</p>
                              {b.guestEmail && <p className="text-[10px] text-slate-400">{b.guestEmail}</p>}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {fmt(b.checkInDate)} → {fmt(b.checkOutDate)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                              {fmtCurrency(totalAmt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-semibold ${refundAmt > 0 ? "text-blue-700" : "text-slate-400"}`}>
                                {refundAmt > 0 ? fmtCurrency(refundAmt) : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-semibold ${hotelShare > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                                {hotelShare > 0 ? `≈ ${fmtCurrency(hotelShare)}` : "—"}
                              </span>
                              {hotelShare > 0 && (
                                <p className="text-[10px] text-slate-400">(before platform fee)</p>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                isFullRef                               ? "bg-blue-50 text-blue-700 border-blue-200"
                                : refSt.toUpperCase() === "PROCESSED"  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : refSt.toUpperCase() === "PENDING"    ? "bg-amber-50 text-amber-700 border-amber-200"
                                : refSt.toUpperCase() === "FAILED"     ? "bg-red-50 text-red-700 border-red-200"
                                : isNoRef                              ? "bg-slate-100 text-slate-500 border-slate-200"
                                :                                         "bg-gray-50 text-gray-500 border-gray-200"
                              }`}>
                                {isFullRef ? "Full Refund" : refSt.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {fmt(b.updatedAt ?? b.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

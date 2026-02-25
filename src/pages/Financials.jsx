import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  DollarSign,
  Calendar,
  RefreshCw,
  TrendingUp,
  BookOpen,
  LogIn,
  LogOut,
  XCircle,
  Search,
} from "lucide-react";
import {
  fetchHotelRevenue,
  fetchBookingSummary,
  fetchHotelPayments,
  selectBookingSummary,
  selectBookingsLoading,
  selectPaymentsTotal,
} from "../store/slices/bookingSlice";

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
  const hotelId = useSelector((state) => state.user.hotelId);

  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(today());
  const [hasSearched, setHasSearched] = useState(false);

  const fetchData = () => {
    if (!hotelId) return;
    dispatch(fetchHotelRevenue({ hotelId, fromDate, toDate }));
    dispatch(fetchBookingSummary(hotelId));
    setHasSearched(true);
  };

  useEffect(() => {
    if (hotelId) {
      fetchData();
      dispatch(fetchHotelPayments(hotelId));
    }
  }, [hotelId]);

  const summaryCards = [
    {
      label: "Total Bookings",
      value: summary?.totalBookings ?? "—",
      icon: BookOpen,
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
    {
      label: "Booked",
      value: summary?.booked ?? "—",
      icon: Calendar,
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      label: "Checked In",
      value: summary?.checkedIn ?? "—",
      icon: LogIn,
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      label: "Checked Out",
      value: summary?.checkedOut ?? "—",
      icon: LogOut,
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    {
      label: "Cancelled",
      value: summary?.cancelled ?? "—",
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Financials</h1>
        <p className="text-slate-500 text-sm">Revenue and booking summary for your hotel</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          Revenue Date Range
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
            onClick={fetchData}
            disabled={loading || !hotelId}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-300 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-4xl font-bold tracking-tight">
              ${paymentsTotal != null
                ? paymentsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "0.00"}
            </p>
            <p className="text-slate-400 text-xs mt-2">Sum of all payments</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Booking Summary Cards */}
      {(summary || hasSearched) && (
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
          <p className="text-slate-500 text-sm">Select a date range and click Search to view booking summary</p>
        </div>
      )}
    </div>
  );
};

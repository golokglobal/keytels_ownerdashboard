import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Calendar, RefreshCw, TrendingUp, BookOpen,
  LogIn, LogOut, XCircle, Search, CreditCard, CheckCircle2,
  AlertCircle, Clock, Zap, Shield, BarChart2, ExternalLink,
  Loader2,
} from "lucide-react";
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
  fetchOwnerBilling,
  startCheckout,
  selectBilling,
  selectBillingLoading,
  selectBillingError,
  selectCheckoutLoading,
  selectCheckoutError,
} from "../store/slices/paymentsSlice";

const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

// Available subscription plans
// priceId comes from your Stripe dashboard
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8",
    price: "$29",
    period: "/month",
    description: "Perfect for single-property owners",
    features: ["1 Hotel property", "Booking management", "Guest directory", "Basic financials"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8", // update with your actual Pro priceId
    price: "$79",
    period: "/month",
    description: "Best for growing hotel businesses",
    features: ["Up to 5 properties", "Advanced analytics", "Staff management", "Priority support"],
    highlight: true,
  },
];

/* ── Subscription Status Banner ─────────────────────────────────────── */
function SubscriptionBanner({ billing }) {
  const status = billing?.subscriptionStatus;

  if (status === "ACTIVE") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-semibold text-emerald-800">Subscription Active</span>
          <span className="text-emerald-600 ml-2">Your plan is running smoothly.</span>
        </div>
      </div>
    );
  }

  if (status === "CHECKOUT_PENDING") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
        <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
        <div>
          <span className="font-semibold text-yellow-800">Payment Pending</span>
          <span className="text-yellow-700 ml-2">Complete your payment on Stripe to activate your plan.</span>
        </div>
      </div>
    );
  }

  if (status === "CANCELLED" || status === "PAST_DUE") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <div>
          <span className="font-semibold text-red-800">
            {status === "CANCELLED" ? "Subscription Cancelled" : "Payment Overdue"}
          </span>
          <span className="text-red-700 ml-2">Please resubscribe to continue using Keytels.</span>
        </div>
      </div>
    );
  }

  return null;
}

/* ── Stripe Account Status Row ────────────────────────────────────────── */
function StripeStatusRow({ billing }) {
  const items = [
    { label: "Onboarding", ok: billing?.stripeOnboardingComplete },
    { label: "Details submitted", ok: billing?.stripeDetailsSubmitted },
    { label: "Charges enabled", ok: billing?.stripeChargesEnabled },
    { label: "Payouts enabled", ok: billing?.stripePayoutsEnabled },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ label, ok }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
            ${ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-slate-50 border-slate-200 text-slate-500"}`}
        >
          {ok
            ? <CheckCircle2 className="w-3.5 h-3.5" />
            : <Clock className="w-3.5 h-3.5" />}
          {label}
        </div>
      ))}
    </div>
  );
}

/* ── Plan Card ──────────────────────────────────────────────────────── */
function PlanCard({ plan, onSelect, loading, isCurrentPlan }) {
  return (
    <div className={`relative rounded-xl border-2 p-6 flex flex-col gap-4 transition-all
      ${plan.highlight
        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100"
        : "border-slate-200 bg-white"}`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
          Most Popular
        </span>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{plan.description}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-900">{plan.price}</span>
        <span className="text-slate-500 text-sm">{plan.period}</span>
      </div>

      <ul className="space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.priceId)}
        disabled={loading || isCurrentPlan}
        className={`mt-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed
          ${plan.highlight
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-slate-900 hover:bg-slate-800 text-white"}`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {isCurrentPlan ? "Current Plan" : "Subscribe"}
      </button>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */
export const Financials = () => {
  const dispatch = useDispatch();

  // Billing
  const ownerId = useSelector(selectUserId);
  const billing = useSelector(selectBilling);
  const billingLoading = useSelector(selectBillingLoading);
  const billingError = useSelector(selectBillingError);
  const checkoutLoading = useSelector(selectCheckoutLoading);
  const checkoutError = useSelector(selectCheckoutError);

  // Revenue / Bookings
  const summary = useSelector(selectBookingSummary);
  const loading = useSelector(selectBookingsLoading);
  const paymentsTotal = useSelector(selectPaymentsTotal);
  const revenue = useSelector(selectRevenue);
  const activeHotelId = useSelector(selectPrimaryHotelId);
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(today());
  const [hasSearched, setHasSearched] = useState(false);

  // Step 1 — fetch billing info on mount (when ownerId is ready)
  useEffect(() => {
    if (ownerId) {
      dispatch(fetchOwnerBilling(ownerId));
    }
  }, [ownerId, dispatch]);

  // Step 1b — reset revenue search when hotel changes
  useEffect(() => {
    if (activeHotelId) {
      dispatch(fetchBookingSummary(activeHotelId));
      setHasSearched(false);
    }
  }, [activeHotelId, dispatch]);

  // Step 2 — revenue search button
  const fetchData = () => {
    if (!activeHotelId) return;
    dispatch(fetchHotelRevenue({ hotelId: activeHotelId, fromDate, toDate }));
    dispatch(fetchHotelBookings({ hotelId: activeHotelId, filters: {} }));
    setHasSearched(true);
  };

  // Step 2 — subscribe: call checkout API then redirect to Stripe
  const handleSubscribe = async (priceId) => {
    if (!ownerId) return;
    const result = await dispatch(startCheckout({ ownerId, priceId }));
    if (startCheckout.fulfilled.match(result)) {
      const { checkoutUrl } = result.payload;
      if (checkoutUrl) window.location.href = checkoutUrl;
    }
  };

  const revenueAmount = revenue?.totalRevenue ?? revenue?.revenue ?? revenue?.amount ?? null;
  const subscriptionActive = billing?.subscriptionStatus === "ACTIVE";

  const summaryCards = [
    { label: "Total Bookings", value: summary?.totalBookings ?? "—", icon: BookOpen,  color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200" },
    { label: "Booked",         value: summary?.booked        ?? "—", icon: Calendar,  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"  },
    { label: "Checked In",     value: summary?.checkedIn     ?? "—", icon: LogIn,     color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
    { label: "Checked Out",    value: summary?.checkedOut    ?? "—", icon: LogOut,    color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200"},
    { label: "Cancelled",      value: summary?.cancelled     ?? "—", icon: XCircle,   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"   },
  ];

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financials & Billing</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your subscription, Stripe account, and hotel revenue</p>
        <div className="mt-2">
          <HotelSelector />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — BILLING & SUBSCRIPTION
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" /> Subscription & Billing
          </h2>
          {billing && (
            <button
              onClick={() => ownerId && dispatch(fetchOwnerBilling(ownerId))}
              disabled={billingLoading}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              {billingLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {billingLoading && !billing && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading billing information…</p>
          </div>
        )}

        {/* Error */}
        {billingError && !billing && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {billingError}
          </div>
        )}

        {/* Billing info card */}
        {billing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
          >
            {/* Status banner */}
            <SubscriptionBanner billing={billing} />

            {/* Stripe account health */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Stripe Account Status
              </p>
              <StripeStatusRow billing={billing} />
            </div>

            {/* Subscription details */}
            {subscriptionActive && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {[
                  { label: "Status", value: billing.subscriptionStatus },
                  { label: "Price ID", value: billing.subscriptionPriceId?.slice(0, 18) + "…" },
                  { label: "Started", value: billing.subscriptionStartedAt
                      ? new Date(billing.subscriptionStartedAt).toLocaleDateString()
                      : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{value ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Checkout error */}
            {checkoutError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" /> {checkoutError}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Plan picker (shown when no active subscription) ─────────── */}
        {billing && !subscriptionActive && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              Choose a Plan to get started
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSubscribe}
                  loading={checkoutLoading}
                  isCurrentPlan={
                    billing?.subscriptionPriceId === plan.priceId &&
                    billing?.subscriptionStatus === "ACTIVE"
                  }
                />
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <ExternalLink className="w-3.5 h-3.5" />
              You'll be redirected to Stripe's secure checkout page to complete your payment.
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — HOTEL REVENUE
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-500" /> Hotel Revenue
        </h2>

        {!activeHotelId && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Select a hotel</h3>
            <p className="text-slate-600">Choose a hotel from the header to view revenue.</p>
          </div>
        )}

        {activeHotelId && (
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
                    onClick={fetchData}
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
                    className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-300 text-sm font-medium mb-1">Hotel Revenue</p>
                        <p className="text-4xl font-bold tracking-tight">
                          ${revenueAmount != null
                            ? Number(revenueAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "—"}
                        </p>
                        <p className="text-slate-400 text-xs mt-2">{fromDate} → {toDate}</p>
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
    </div>
  );
};

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Hotel, Loader2, AlertCircle, Clock, LogIn,
  CheckCircle2, XCircle, RefreshCw, Percent, Info,
} from "lucide-react";
import {
  startCheckout,
  fetchSubscriptionPlans,
  selectPlans,
  selectPlansLoading,
  selectPlansError,
  selectCheckoutLoading,
  selectCheckoutError,
} from "../../store/slices/paymentsSlice";
import { selectUserId, selectCurrentUser } from "../../store/slices/userSlice";
import {
  PLAN_STYLE,
  getPriceDisplay,
  getEnabledFeatures,
  getDisabledFeatures,
  getBackendPriceId,
  isPaidSubscriptionPlan,
} from "../../utils/planUtils";

/* ── Skeleton card ── */
const PlanSkeleton = () => (
  <div className="rounded-2xl border border-white/10 bg-white/5 animate-pulse p-7 flex flex-col gap-4">
    <div className="h-4 w-1/3 bg-white/10 rounded" />
    <div className="h-3 w-1/2 bg-white/10 rounded" />
    <div className="h-10 w-2/5 bg-white/10 rounded mt-2" />
    <div className="space-y-2 mt-2">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-3 w-full bg-white/10 rounded" />)}
    </div>
    <div className="h-11 w-full bg-white/10 rounded-xl mt-auto" />
  </div>
);

/* ── Single plan card ── */
const PlanCard = ({ plan, onSubscribe, checkoutLoading, selectedCode, isLoggedIn, currentPropertyCount }) => {
  const style     = PLAN_STYLE[plan.code] || PLAN_STYLE.SINGLE;
  const price     = getPriceDisplay(plan);
  const enabled   = getEnabledFeatures(plan);
  const disabled  = getDisabledFeatures(plan);
  const isLoading = checkoutLoading && selectedCode === plan.code;
  const isFree    = plan.code === "FREE";

  // MULTI requires at least 1 hotel — block and guide the owner
  const isMultiBlocked = plan.code === "MULTI" && isLoggedIn && currentPropertyCount === 0;
  // FRANCHISE billing note — base fee charged immediately, per-property only as hotels are added
  const showFranchiseNote = plan.code === "FRANCHISE" && plan.baseFeeUsd != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl flex flex-col border transition-all
        ${style.highlight
          ? "border-blue-500/60 bg-gradient-to-b from-blue-600/20 to-purple-600/10 shadow-2xl shadow-blue-900/40"
          : isFree
            ? "border-white/10 bg-white/3"
            : "border-white/10 bg-white/5"}`}
    >
      {style.badge && (
        <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap
          ${style.highlight
            ? "bg-gradient-to-r from-blue-500 to-purple-500"
            : "bg-gradient-to-r from-purple-600 to-indigo-600"}`}>
          {style.badge}
        </span>
      )}

      {/* Header */}
      <div className={`px-6 pt-8 pb-5 border-b ${style.highlight ? "border-blue-500/20" : "border-white/10"}`}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          {plan.partnerType}
        </p>
        <h2 className="text-lg font-bold text-white">{plan.name}</h2>

        {/* Price */}
        <div className="mt-4 flex items-end gap-1.5">
          {isFree ? (
            <span className="text-4xl font-black text-white leading-none">{price.amount}</span>
          ) : (
            <>
              <span className="text-slate-400 text-xl font-bold leading-none">$</span>
              <span className="text-5xl font-black text-white leading-none">
                {price.amount.replace("$", "")}
              </span>
            </>
          )}
          {price.unit && (
            <span className="text-slate-400 text-xs mb-1 leading-tight">{price.unit}</span>
          )}
        </div>

        {/* FRANCHISE: explicit breakdown table */}
        {price.breakdown ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 divide-y divide-white/10 overflow-hidden">
            {price.breakdown.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        ) : price.sub ? (
          <p className={`text-xs mt-1.5 ${isFree ? "text-orange-400 font-medium" : "text-slate-400"}`}>
            {isFree && <Percent className="w-3 h-3 inline mr-1" />}
            {price.sub}
          </p>
        ) : null}

        {/* Property limit */}
        <p className="text-xs text-slate-500 mt-2">
          {plan.propertyLimit
            ? `${plan.propertyLimit} propert${plan.propertyLimit === 1 ? "y" : "ies"}`
            : "Unlimited properties"}
          {" · "}
          {plan.commissionRate > 0
            ? `${(plan.commissionRate * 100).toFixed(0)}% commission`
            : "No commission"}
        </p>
      </div>

      {/* Features */}
      <div className="px-6 py-5 flex-1 space-y-4">
        {/* Enabled */}
        {enabled.length > 0 && (
          <ul className="space-y-2">
            {enabled.map(({ key, label, Icon }) => (
              <li key={key} className="flex items-center gap-2.5 text-sm text-slate-300">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                  ${style.highlight ? "bg-blue-500/20" : "bg-emerald-500/15"}`}>
                  {Icon
                    ? <Icon className={`w-2.5 h-2.5 ${style.highlight ? "text-blue-400" : "text-emerald-400"}`} />
                    : <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                </div>
                {label}
              </li>
            ))}
          </ul>
        )}

        {/* Disabled (only show if some features are off — gives context) */}
        {disabled.length > 0 && enabled.length > 0 && (
          <ul className="space-y-1.5 opacity-50">
            {disabled.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-2.5 text-xs text-slate-500">
                <XCircle className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                {label}
              </li>
            ))}
          </ul>
        )}

        {/* If all features disabled (FREE) */}
        {enabled.length === 0 && (
          <p className="text-xs text-slate-500 italic">
            Commission-based access — no dashboard features included.
          </p>
        )}

        {/* FRANCHISE billing transparency note */}
        {showFranchiseNote && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg mt-2">
            <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-xs text-purple-300 leading-relaxed">
              Base fee is charged immediately. Per-property fee is only added to your subscription as you list hotels — nothing extra until you do.
            </p>
          </div>
        )}

        {/* MULTI blocked — no hotels yet */}
        {isMultiBlocked && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              Add at least 1 hotel to your account first, then subscribe to Multi.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-7">
        <button
          onClick={() => !isMultiBlocked && onSubscribe(plan)}
          disabled={checkoutLoading || isMultiBlocked}
          title={isMultiBlocked ? "Add a hotel first before subscribing to Multi" : undefined}
          className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all
            disabled:opacity-60 disabled:cursor-not-allowed
            ${style.highlight
              ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/30"
              : isFree
                ? "bg-white/8 hover:bg-white/15 text-slate-300 border border-white/10"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"}`}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe…</>
          ) : checkoutLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
          ) : !isLoggedIn ? (
            <><LogIn className="w-4 h-4" /> Login to get started</>
          ) : isMultiBlocked ? (
            <><Hotel className="w-4 h-4" /> Add a hotel first</>
          ) : isFree ? (
            <><Zap className="w-4 h-4" /> Start for free</>
          ) : (
            <><Zap className="w-4 h-4" /> Get {plan.name}</>
          )}
        </button>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════
   CHOOSE PLAN PAGE
══════════════════════════════════════════════ */
export const ChoosePlan = () => {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const ownerId              = useSelector(selectUserId);
  const user                 = useSelector(selectCurrentUser);
  const plans                = useSelector(selectPlans);
  const plansLoading         = useSelector(selectPlansLoading);
  const plansError           = useSelector(selectPlansError);
  const checkoutLoading      = useSelector(selectCheckoutLoading);
  const checkoutError        = useSelector(selectCheckoutError);
  const currentPropertyCount = useSelector((state) => state.partneredhotels.hotels.length);
  const [selectedCode, setSelectedCode] = useState(null);
  const [priceIdError, setPriceIdError] = useState(null);

  const isLoggedIn = !!ownerId;

  useEffect(() => {
    if (!plans.length) dispatch(fetchSubscriptionPlans());
  }, [dispatch, plans.length]);

  const handleSubscribe = async (plan) => {
    if (checkoutLoading) return;
    setPriceIdError(null);
    if (!isLoggedIn) {
      navigate(`/login?redirect=/choose-plan`);
      return;
    }
    setSelectedCode(plan.code);
    if (!isPaidSubscriptionPlan(plan)) {
      navigate("/dashboard");
      return;
    }
    const priceId = getBackendPriceId(plan);
    try {
      const data = await dispatch(
        startCheckout({ ownerId, planCode: plan.code, priceId: priceId || undefined, currentPropertyCount })
      ).unwrap();
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch {
      // error surfaced via checkoutError selector
    }
  };

  const cols = plans.length <= 2 ? "sm:grid-cols-2"
             : plans.length === 3 ? "sm:grid-cols-3"
             : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-white/10">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg">Desiney</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl"
        >
          {/* Heading */}
          <div className="text-center mb-10">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}
            </p>
            <h1 className="text-4xl font-black text-white mb-3">Choose your plan</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Subscription plans are billed monthly. Cancel anytime.
              You'll be redirected to Stripe's secure checkout.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 text-xs font-semibold">
                Monthly billing — no long-term commitment
              </span>
            </div>
          </div>

          {/* Error loading plans */}
          {plansError && !plans.length && (
            <div className="mb-6 flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Failed to load plans
              <button
                onClick={() => dispatch(fetchSubscriptionPlans())}
                className="ml-auto flex items-center gap-1 text-xs underline"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Plan grid */}
          <div className={`grid grid-cols-1 ${cols} gap-6`}>
            {plansLoading && !plans.length
              ? [1, 2, 3, 4].map((i) => <PlanSkeleton key={i} />)
              : plans.map((plan, i) => (
                  <motion.div key={plan.code} transition={{ delay: i * 0.07 }}>
                    <PlanCard
                      plan={plan}
                      onSubscribe={handleSubscribe}
                      checkoutLoading={checkoutLoading}
                      selectedCode={selectedCode}
                      isLoggedIn={isLoggedIn}
                      currentPropertyCount={currentPropertyCount}
                    />
                  </motion.div>
                ))}
          </div>

          {(checkoutError || priceIdError) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm max-w-md mx-auto"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {checkoutError || priceIdError}
            </motion.div>
          )}

          <p className="text-center text-slate-600 text-xs mt-8">
            Payments processed securely by Stripe · Cancel anytime from your account settings
          </p>
        </motion.div>
      </div>
    </div>
  );
};

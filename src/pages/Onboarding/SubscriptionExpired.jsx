import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AlertCircle, Hotel, Loader2, Zap, CheckCircle2,
  XCircle, RefreshCw, Percent,
} from "lucide-react";
import {
  startCheckout,
  fetchSubscriptionPlans,
  selectBilling,
  selectPlans,
  selectPlansLoading,
  selectPlansError,
  selectCheckoutLoading,
  selectCheckoutError,
} from "../../store/slices/paymentsSlice";
import { selectUserId } from "../../store/slices/userSlice";
import { PLAN_STYLE, getPriceDisplay, getEnabledFeatures } from "../../utils/planUtils";

const PlanSkeleton = () => (
  <div className="rounded-2xl border border-white/10 bg-white/5 animate-pulse p-6 flex flex-col gap-3">
    <div className="h-5 w-1/2 bg-white/10 rounded" />
    <div className="h-3 w-1/3 bg-white/10 rounded" />
    <div className="space-y-2 mt-1">
      {[1, 2, 3].map((i) => <div key={i} className="h-3 w-full bg-white/10 rounded" />)}
    </div>
    <div className="h-10 w-full bg-white/10 rounded-xl mt-auto" />
  </div>
);

export const SubscriptionExpired = () => {
  const dispatch        = useDispatch();
  const ownerId         = useSelector(selectUserId);
  const billing         = useSelector(selectBilling);
  const plans           = useSelector(selectPlans);
  const plansLoading    = useSelector(selectPlansLoading);
  const plansError      = useSelector(selectPlansError);
  const checkoutLoading = useSelector(selectCheckoutLoading);
  const checkoutError   = useSelector(selectCheckoutError);
  const [selectedCode, setSelectedCode] = useState(null);

  useEffect(() => {
    if (!plans.length) dispatch(fetchSubscriptionPlans());
  }, [dispatch, plans.length]);

  const isCancelled = billing?.subscriptionStatus === "CANCELLED";

  const handleReactivate = async (plan) => {
    if (!ownerId || checkoutLoading) return;
    setSelectedCode(plan.code);
    try {
      const data = await dispatch(
        startCheckout({ ownerId, planCode: plan.code })
      ).unwrap();
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch {
      // error in Redux state
    }
  };

  const cols = plans.length <= 2 ? "sm:grid-cols-2"
             : plans.length === 3 ? "sm:grid-cols-3"
             : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-white/10">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg">Keytels</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-5">
              {isCancelled
                ? <XCircle className="w-8 h-8 text-red-400" />
                : <AlertCircle className="w-8 h-8 text-orange-400" />}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">
              {isCancelled ? "Subscription Cancelled" : "Payment Overdue"}
            </h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {isCancelled
                ? "Your subscription was cancelled. Choose a plan below to regain access."
                : "Your last payment failed. Please resubscribe to restore full access."}
            </p>
          </div>

          {plansError && !plans.length && (
            <div className="mb-6 flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Failed to load plans
              <button onClick={() => dispatch(fetchSubscriptionPlans())} className="ml-auto underline text-xs flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Plan cards */}
          <div className={`grid grid-cols-1 ${cols} gap-5`}>
            {plansLoading && !plans.length
              ? [1, 2, 3, 4].map((i) => <PlanSkeleton key={i} />)
              : plans.map((plan, i) => {
                  const style    = PLAN_STYLE[plan.code] || PLAN_STYLE.SINGLE;
                  const price    = getPriceDisplay(plan);
                  const enabled  = getEnabledFeatures(plan);
                  const isLoading = checkoutLoading && selectedCode === plan.code;
                  const isFree   = plan.code === "FREE";

                  return (
                    <motion.div
                      key={plan.code}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`rounded-2xl p-6 border flex flex-col gap-4
                        ${style.highlight
                          ? "border-blue-500 bg-blue-600/10"
                          : "border-white/10 bg-white/5"}`}
                    >
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{plan.partnerType}</p>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white">{plan.name}</h3>
                          <span className="text-slate-300 font-semibold text-sm">
                            {isFree
                              ? "Free"
                              : price.amount !== "Free"
                                ? `${price.amount}${price.unit}`
                                : "Free"}
                          </span>
                        </div>
                        {price.sub && (
                          <p className={`text-xs mt-0.5 ${isFree ? "text-orange-400" : "text-slate-500"}`}>
                            {isFree && <Percent className="w-3 h-3 inline mr-0.5" />}
                            {price.sub}
                          </p>
                        )}
                      </div>

                      {enabled.length > 0 && (
                        <ul className="space-y-1.5">
                          {enabled.slice(0, 4).map(({ key, label }) => (
                            <li key={key} className="flex items-center gap-2 text-sm text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {label}
                            </li>
                          ))}
                          {enabled.length > 4 && (
                            <li className="text-xs text-slate-500 pl-5">+{enabled.length - 4} more</li>
                          )}
                        </ul>
                      )}

                      {enabled.length === 0 && (
                        <p className="text-xs text-slate-500 italic">Commission-based — no dashboard features</p>
                      )}

                      <button
                        onClick={() => handleReactivate(plan)}
                        disabled={checkoutLoading}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-auto
                          ${style.highlight
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                            : "bg-white/10 text-white hover:bg-white/20"}`}
                      >
                        {isLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                        ) : (
                          <><Zap className="w-4 h-4" /> {isFree ? "Start free" : `Get ${plan.name}`}</>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
          </div>

          {checkoutError && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm max-w-lg mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {checkoutError}
            </div>
          )}

          <p className="text-center text-slate-600 text-xs mt-6">
            Need help? Contact support@keytels.com
          </p>
        </motion.div>
      </div>
    </div>
  );
};

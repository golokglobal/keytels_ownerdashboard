import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AlertCircle, Hotel, Loader2, Zap, CheckCircle2,
  RefreshCw, XCircle,
} from "lucide-react";
import {
  startCheckout,
  selectBilling,
  selectCheckoutLoading,
  selectCheckoutError,
} from "../../store/slices/paymentsSlice";
import { selectUserId } from "../../store/slices/userSlice";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8",
    price: "$29/mo",
    features: ["1 Hotel", "Bookings", "Guests", "Financials"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8",
    price: "$79/mo",
    features: ["5 Hotels", "Analytics", "Staff", "Priority support"],
    highlight: true,
  },
];

export const SubscriptionExpired = () => {
  const dispatch = useDispatch();
  const ownerId = useSelector(selectUserId);
  const billing = useSelector(selectBilling);
  const checkoutLoading = useSelector(selectCheckoutLoading);
  const checkoutError = useSelector(selectCheckoutError);
  const [selectedId, setSelectedId] = useState(null);

  const isCancelled = billing?.subscriptionStatus === "CANCELLED";

  const handleReactivate = async (plan) => {
    if (!ownerId || checkoutLoading) return;
    setSelectedId(plan.id);
    const result = await dispatch(startCheckout({ ownerId, priceId: plan.priceId }));
    if (startCheckout.fulfilled.match(result)) {
      const { checkoutUrl } = result.payload;
      if (checkoutUrl) window.location.href = checkoutUrl;
    }
  };

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
          className="w-full max-w-2xl"
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
                ? "Your subscription was cancelled. Reactivate a plan below to regain access to Keytels."
                : "Your last payment failed. Please resubscribe to restore full access."}
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan, i) => {
              const isLoading = checkoutLoading && selectedId === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl p-6 border flex flex-col gap-4
                    ${plan.highlight
                      ? "border-blue-500 bg-blue-600/10"
                      : "border-white/10 bg-white/5"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <span className="text-slate-300 font-semibold text-sm">{plan.price}</span>
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleReactivate(plan)}
                    disabled={checkoutLoading}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50
                      ${plan.highlight
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                        : "bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                      : <><Zap className="w-4 h-4" /> Reactivate {plan.name}</>}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {checkoutError && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
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

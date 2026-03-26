import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Zap, CheckCircle2, Hotel, Loader2, AlertCircle,
  Shield, BarChart2, Users, Headphones, Star,
} from "lucide-react";
import {
  startCheckout,
  selectCheckoutLoading,
  selectCheckoutError,
} from "../../store/slices/paymentsSlice";
import { selectUserId, selectCurrentUser } from "../../store/slices/userSlice";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8",
    price: "$29",
    period: "/month",
    tagline: "Perfect for single-property owners",
    features: [
      { icon: Hotel,      text: "1 Hotel property" },
      { icon: BarChart2,  text: "Booking management" },
      { icon: Users,      text: "Guest directory" },
      { icon: Shield,     text: "Basic financials" },
    ],
    highlight: false,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8",
    price: "$79",
    period: "/month",
    tagline: "Best for growing hotel businesses",
    features: [
      { icon: Hotel,       text: "Up to 5 properties" },
      { icon: BarChart2,   text: "Advanced analytics" },
      { icon: Users,       text: "Staff management" },
      { icon: Headphones,  text: "Priority support" },
      { icon: Star,        text: "Review management" },
    ],
    highlight: true,
    badge: "Most Popular",
  },
];

export const ChoosePlan = () => {
  const dispatch = useDispatch();
  const ownerId = useSelector(selectUserId);
  const user = useSelector(selectCurrentUser);
  const checkoutLoading = useSelector(selectCheckoutLoading);
  const checkoutError = useSelector(selectCheckoutError);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const handleSubscribe = async (plan) => {
    if (!ownerId || checkoutLoading) return;
    setSelectedPlanId(plan.id);
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl"
        >
          {/* Heading */}
          <div className="text-center mb-10">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}
            </p>
            <h1 className="text-4xl font-black text-white mb-3">
              Choose your plan to get started
            </h1>
            <p className="text-slate-400 text-base max-w-md mx-auto">
              You're one step away from managing your hotel with Keytels. Pick a plan and you'll be redirected to Stripe's secure checkout.
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PLANS.map((plan, i) => {
              const isLoading = checkoutLoading && selectedPlanId === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-7 flex flex-col gap-5 border transition-all
                    ${plan.highlight
                      ? "border-blue-500 bg-gradient-to-br from-blue-600/20 to-purple-600/10 shadow-2xl shadow-blue-900/40"
                      : "border-white/10 bg-white/5"}`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    <p className="text-slate-400 text-sm mt-1">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        {text}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={checkoutLoading}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed
                      ${plan.highlight
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white/10 hover:bg-white/20 text-white"}`}
                  >
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe…</>
                      : <><Zap className="w-4 h-4" /> Subscribe to {plan.name}</>}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Error */}
          {checkoutError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {checkoutError}
            </motion.div>
          )}

          <p className="text-center text-slate-500 text-xs mt-7">
            Payments are processed securely by Stripe. You can cancel anytime.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Zap, Hotel, Loader2, AlertCircle,
  Shield, BarChart2, Users, Headphones, Star,
  Building2, Clock, CreditCard, Award,
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
    price: 29,
    tagline: "Perfect for single-property owners",
    badge: null,
    highlight: false,
    color: "slate",
    features: [
      { icon: Building2,  text: "1 Hotel property" },
      { icon: BarChart2,  text: "Booking management" },
      { icon: Users,      text: "Guest directory" },
      { icon: Shield,     text: "Basic financials" },
      { icon: Clock,      text: "Standard support" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "price_1TCPOfLgCEFS7xBBtcC5znq8",
    price: 79,
    tagline: "Best for growing hotel businesses",
    badge: "Most Popular",
    highlight: true,
    color: "blue",
    features: [
      { icon: Building2,   text: "Up to 5 properties" },
      { icon: BarChart2,   text: "Advanced analytics" },
      { icon: Users,       text: "Staff management" },
      { icon: Headphones,  text: "Priority support" },
      { icon: Star,        text: "Review management" },
      { icon: Award,       text: "Marketing tools" },
      { icon: CreditCard,  text: "Financial reports" },
    ],
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
    try {
      const data = await dispatch(startCheckout({ ownerId, priceId: plan.priceId })).unwrap();
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch {
      // error already in Redux state via checkoutError
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
              Choose your plan
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              All plans billed monthly. Cancel anytime. You'll be redirected to Stripe's secure checkout.
            </p>

            {/* Monthly badge */}
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 text-xs font-semibold">Monthly billing — no long-term commitment</span>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PLANS.map((plan, i) => {
              const isLoading = checkoutLoading && selectedPlanId === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl flex flex-col border transition-all
                    ${plan.highlight
                      ? "border-blue-500/60 bg-gradient-to-b from-blue-600/20 to-purple-600/10 shadow-2xl shadow-blue-900/40"
                      : "border-white/10 bg-white/5"}`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}

                  {/* Card header */}
                  <div className={`px-7 pt-8 pb-6 border-b ${plan.highlight ? "border-blue-500/20" : "border-white/10"}`}>
                    <h2 className="text-lg font-bold text-white mb-1">{plan.name}</h2>
                    <p className="text-slate-400 text-sm">{plan.tagline}</p>

                    {/* Price */}
                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-slate-400 text-xl font-bold">$</span>
                      <span className="text-5xl font-black text-white leading-none">{plan.price}</span>
                      <div className="mb-1 ml-1">
                        <p className="text-slate-400 text-xs font-medium leading-tight">per</p>
                        <p className="text-slate-400 text-xs font-medium leading-tight">month</p>
                      </div>
                    </div>

                    {/* Billed monthly note */}
                    <p className="text-slate-500 text-xs mt-2">
                      Billed monthly · ${plan.price}/mo
                    </p>
                  </div>

                  {/* Features */}
                  <div className="px-7 py-6 flex-1">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4">
                      What's included
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            plan.highlight ? "bg-blue-500/20" : "bg-white/10"
                          }`}>
                            <Icon className={`w-3 h-3 ${plan.highlight ? "text-blue-400" : "text-emerald-400"}`} />
                          </div>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-7 pb-7">
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={checkoutLoading}
                      className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed
                        ${plan.highlight
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/30"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/10"}`}
                    >
                      {isLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe…</>
                        : <><Zap className="w-4 h-4" /> Get {plan.name} — ${plan.price}/mo</>}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

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

          <p className="text-center text-slate-600 text-xs mt-7">
            Payments processed securely by Stripe · Cancel anytime from your account settings
          </p>
        </motion.div>
      </div>
    </div>
  );
};

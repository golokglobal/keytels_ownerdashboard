import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Hotel, Loader2 } from "lucide-react";
import { fetchOwnerBilling, syncCheckoutSession, selectBilling } from "../../store/slices/paymentsSlice";
import { selectUserId } from "../../store/slices/userSlice";

export const PaymentSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = useSelector(selectUserId);
  const billing = useSelector(selectBilling);
  const [checking, setChecking] = useState(true);
  const sessionId = searchParams.get("session_id");

  // Immediately sync from Stripe when session_id is in the URL — no webhook needed
  useEffect(() => {
    if (ownerId && sessionId) {
      dispatch(syncCheckoutSession({ ownerId, sessionId }));
    }
  }, [ownerId, sessionId, dispatch]);

  useEffect(() => {
    if (!ownerId) return;

    // Poll billing status — Stripe webhook may take a moment to update it
    let attempts = 0;
    const MAX = 12;
    const INTERVAL = 2500;

    const poll = async () => {
      attempts++;
      await dispatch(fetchOwnerBilling(ownerId));
    };

    const timer = setInterval(async () => {
      await poll();
      if (attempts >= MAX) {
        clearInterval(timer);
        setChecking(false);
        // Payment was confirmed by Stripe (we're on successUrl) — go to dashboard
        // regardless of webhook delay; BillingGate will auto-poll from there
        navigate("/dashboard", { replace: true });
      }
    }, INTERVAL);

    poll(); // immediate first check

    return () => clearInterval(timer);
  }, [ownerId, dispatch, navigate]);

  // Once billing shows ACTIVE, redirect to dashboard immediately
  useEffect(() => {
    if (billing?.subscriptionStatus === "ACTIVE") {
      const t = setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
      return () => clearTimeout(t);
    }
  }, [billing, navigate]);

  const isActive = billing?.subscriptionStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-white/10">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg">Keytels</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          {isActive ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h1 className="text-3xl font-black text-white mb-3">Payment Successful!</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Your subscription is now active. Taking you to your dashboard…
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting…
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-3xl font-black text-white mb-3">Confirming Payment…</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Payment received. Waiting for Stripe to confirm your subscription.
                This usually takes a few seconds.
              </p>
              {!checking && (
                <div className="mt-4 space-y-3">
                  <p className="text-slate-500 text-xs">
                    Taking longer than expected. You can go to the dashboard and refresh.
                  </p>
                  <button
                    onClick={() => navigate("/dashboard", { replace: true })}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </>
          )}

          {sessionId && (
            <p className="text-slate-700 text-xs mt-8 font-mono break-all">
              Session: {sessionId}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

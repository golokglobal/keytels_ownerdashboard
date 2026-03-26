import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Clock, Hotel, Loader2, RefreshCw, Zap, AlertCircle } from "lucide-react";
import {
  fetchOwnerBilling,
  startCheckout,
  selectBilling,
  selectBillingLoading,
  selectCheckoutLoading,
  selectCheckoutError,
} from "../../store/slices/paymentsSlice";
import { selectUserId } from "../../store/slices/userSlice";

export const PaymentPending = () => {
  const dispatch = useDispatch();
  const ownerId = useSelector(selectUserId);
  const billing = useSelector(selectBilling);
  const billingLoading = useSelector(selectBillingLoading);
  const checkoutLoading = useSelector(selectCheckoutLoading);
  const checkoutError = useSelector(selectCheckoutError);

  // Re-check billing status (in case Stripe has confirmed payment)
  const handleRefresh = () => {
    if (ownerId) dispatch(fetchOwnerBilling(ownerId));
  };

  // Create a new checkout session with the same priceId
  const handleNewCheckout = async () => {
    if (!ownerId || !billing?.subscriptionPriceId) return;
    const result = await dispatch(startCheckout({
      ownerId,
      priceId: billing.subscriptionPriceId,
    }));
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

      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3">
            Awaiting Payment Confirmation
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Your checkout session was created but payment hasn't been confirmed yet.
            Complete your payment on Stripe, then refresh to check status.
            If the session expired, start a new checkout below.
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Status: Checkout Pending
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRefresh}
              disabled={billingLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all disabled:opacity-50"
            >
              {billingLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />}
              {billingLoading ? "Checking…" : "Refresh Payment Status"}
            </button>

            <button
              onClick={handleNewCheckout}
              disabled={checkoutLoading || !billing?.subscriptionPriceId}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {checkoutLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                : <><Zap className="w-4 h-4" /> Start New Checkout Session</>}
            </button>
          </div>

          {checkoutError && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {checkoutError}
            </div>
          )}

          <p className="text-slate-600 text-xs mt-6">
            Need help? Contact support@keytels.com
          </p>
        </motion.div>
      </div>
    </div>
  );
};

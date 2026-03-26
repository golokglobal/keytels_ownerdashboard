import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Hotel, Loader2 } from "lucide-react";
import {
  fetchOwnerBilling,
  selectBilling,
  selectBillingLoading,
} from "../../store/slices/paymentsSlice";
import { selectUserId, selectUserRole } from "../../store/slices/userSlice";
import { ChoosePlan } from "../../pages/Onboarding/ChoosePlan";
import { PaymentPending } from "../../pages/Onboarding/PaymentPending";
import { SubscriptionExpired } from "../../pages/Onboarding/SubscriptionExpired";

/**
 * BillingGate wraps all protected routes for OWNER role.
 *
 * Decision tree (based on GET /api/owner-billing/:ownerId):
 *
 *  loading                          → full-screen spinner
 *  subscriptionStatus = null        → <ChoosePlan />        (no subscription at all)
 *  subscriptionStatus = CHECKOUT_PENDING → <PaymentPending /> (Stripe checkout started, not paid)
 *  subscriptionStatus = CANCELLED   → <SubscriptionExpired />
 *  subscriptionStatus = PAST_DUE    → <SubscriptionExpired />
 *  subscriptionStatus = ACTIVE      → render children (dashboard + all app routes)
 *
 * Non-owner roles (staff, manager) skip billing entirely.
 */
export const BillingGate = ({ children }) => {
  const dispatch = useDispatch();
  const ownerId = useSelector(selectUserId);
  const userRole = useSelector(selectUserRole);
  const billing = useSelector(selectBilling);
  const loading = useSelector(selectBillingLoading);

  const isOwner = userRole === "OWNER" || userRole === "owner";

  useEffect(() => {
    // Only fetch billing for owners, and only once
    if (isOwner && ownerId && !billing) {
      dispatch(fetchOwnerBilling(ownerId));
    }
  }, [isOwner, ownerId, billing, dispatch]);

  // Staff / manager roles — no billing gate
  if (!isOwner) return children;

  // Fetching billing for the first time
  if (loading && !billing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col items-center justify-center gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Hotel className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-slate-400 text-sm">Checking your subscription…</p>
      </div>
    );
  }

  const status = billing?.subscriptionStatus;

  // No subscription at all — must choose a plan
  if (!status) {
    return <ChoosePlan />;
  }

  // Stripe checkout created but payment not completed
  if (status === "CHECKOUT_PENDING") {
    return <PaymentPending />;
  }

  // Subscription cancelled or payment failed
  if (status === "CANCELLED" || status === "PAST_DUE") {
    return <SubscriptionExpired />;
  }

  // ACTIVE — allow access to the full dashboard
  return children;
};

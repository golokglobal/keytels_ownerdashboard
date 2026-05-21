import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  CreditCard, Zap, Loader2, AlertCircle, CheckCircle2,
  CheckCircle, XCircle, RefreshCw, Clock, Percent,
  TrendingUp, Users, BarChart2,
} from "lucide-react";
import {
  fetchOwnerBilling,
  fetchSubscriptionPlans,
  startCheckout,
  changePlan,
  cancelPlan,
  selectBilling,
  selectBillingLoading,
  selectPlans,
  selectPlansLoading,
  selectPlansError,
  selectCheckoutLoading,
  selectCheckoutError,
  selectPlanActionLoading,
  selectPlanActionError,
} from "../store/slices/paymentsSlice";
import { selectUserId } from "../store/slices/userSlice";
import {
  PLAN_STYLE,
  getPriceDisplay,
  getEnabledFeatures,
  getDisabledFeatures,
  getBackendPriceId,
  isPaidSubscriptionPlan,
} from "../utils/planUtils";

/* ── helpers ── */
const STATUS_CONFIG = {
  active:           { label: "Active",          cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle  },
  ACTIVE:           { label: "Active",          cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle  },
  trialing:         { label: "Trialing",        cls: "bg-blue-100 text-blue-700 border-blue-200",          Icon: TrendingUp   },
  past_due:         { label: "Past Due",        cls: "bg-orange-100 text-orange-700 border-orange-200",    Icon: AlertCircle  },
  PAST_DUE:         { label: "Past Due",        cls: "bg-orange-100 text-orange-700 border-orange-200",    Icon: AlertCircle  },
  canceled:         { label: "Cancelled",       cls: "bg-red-100 text-red-700 border-red-200",             Icon: XCircle      },
  CANCELLED:        { label: "Cancelled",       cls: "bg-red-100 text-red-700 border-red-200",             Icon: XCircle      },
  CHECKOUT_PENDING: { label: "Pending Payment", cls: "bg-yellow-100 text-yellow-700 border-yellow-200",    Icon: RefreshCw    },
  incomplete:       { label: "Incomplete",      cls: "bg-slate-100 text-slate-600 border-slate-200",       Icon: RefreshCw    },
};

const LEVEL_META = {
  NONE:     { cls: "text-slate-400",   label: "None"     },
  LIMITED:  { cls: "text-blue-600",    label: "Limited"  },
  STANDARD: { cls: "text-indigo-600",  label: "Standard" },
  FULL:     { cls: "text-emerald-600", label: "Full"     },
  ADVANCED: { cls: "text-purple-600",  label: "Advanced" },
  PREMIUM:  { cls: "text-amber-600",   label: "Premium"  },
  BASIC:    { cls: "text-slate-500",   label: "Basic"    },
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/* ── Skeleton ── */
const PlanSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 animate-pulse p-6 flex flex-col gap-3">
    <div className="h-3 w-1/3 bg-slate-200 rounded" />
    <div className="h-5 w-1/2 bg-slate-200 rounded" />
    <div className="h-8 w-1/3 bg-slate-200 rounded mt-1" />
    <div className="space-y-2 mt-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-3 w-full bg-slate-200 rounded" />)}
    </div>
    <div className="h-10 w-full bg-slate-200 rounded-xl mt-3" />
  </div>
);

/* ══════════════════════════════════════════════
   SUBSCRIPTION PAGE (inside dashboard)
══════════════════════════════════════════════ */
export const Subscription = () => {
  const dispatch        = useDispatch();
  const ownerId         = useSelector(selectUserId);
  const billing         = useSelector(selectBilling);
  const billingLoading  = useSelector(selectBillingLoading);
  const plans           = useSelector(selectPlans);
  const plansLoading    = useSelector(selectPlansLoading);
  const plansError      = useSelector(selectPlansError);
  const checkoutLoading    = useSelector(selectCheckoutLoading);
  const checkoutError      = useSelector(selectCheckoutError);
  const planActionLoading  = useSelector(selectPlanActionLoading);
  const planActionError    = useSelector(selectPlanActionError);
  const [selectedCode, setSelectedCode] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [priceIdError, setPriceIdError] = useState(null);

  useEffect(() => {
    if (ownerId && !billing)  dispatch(fetchOwnerBilling(ownerId));
    if (!plans.length)         dispatch(fetchSubscriptionPlans());
  }, [dispatch, ownerId, billing, plans.length]);

  const handleChangePlan = async (plan) => {
    if (!ownerId || checkoutLoading || planActionLoading) return;
    setPriceIdError(null);
    setSelectedCode(plan.code);
    if (!isPaidSubscriptionPlan(plan)) {
      setSelectedCode(null);
      return;
    }
    const priceId = getBackendPriceId(plan);
    if (!priceId) {
      setPriceIdError("This plan is missing a backend Stripe price ID. Refresh plans or check the backend plan configuration.");
      setSelectedCode(null);
      return;
    }
    try {
      if (billing?.subscriptionActive) {
        await dispatch(changePlan({ ownerId, newPlanCode: plan.code, newPriceId: priceId })).unwrap();
        dispatch(fetchOwnerBilling(ownerId));
      } else {
        const data = await dispatch(startCheckout({ ownerId, planCode: plan.code, priceId })).unwrap();
        if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
      }
    } catch {
      // error surfaced via planActionError / checkoutError selectors
    }
  };

  const handleCancelPlan = async () => {
    if (!ownerId || planActionLoading) return;
    try {
      await dispatch(cancelPlan({ ownerId, cancelImmediately: false })).unwrap();
      dispatch(fetchOwnerBilling(ownerId));
      setCancelConfirm(false);
    } catch {
      setCancelConfirm(false);
    }
  };

  const status      = billing?.subscriptionStatus;
  const statusConf  = status ? STATUS_CONFIG[status] : null;

  const currentCode = billing?.plan?.code;
  const pendingCode = (status === "CHECKOUT_PENDING" && billing?.subscriptionPlan !== currentCode)
    ? billing?.subscriptionPlan
    : null;

  const currentPlanMeta = plans.find((p) => p.code === currentCode);

  const cols = plans.length <= 2 ? "sm:grid-cols-2"
             : plans.length === 3 ? "sm:grid-cols-3"
             : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subscription</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your Keytels plan and billing details</p>
        </div>
        <button
          onClick={() => ownerId && dispatch(fetchOwnerBilling(ownerId))}
          disabled={billingLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${billingLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Current plan banner ── */}
      {billingLoading && !billing ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 animate-pulse h-40" />
      ) : billing ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left — plan identity */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Current Plan</p>
                <h2 className="text-xl font-bold text-slate-800 mt-0.5">
                  {currentPlanMeta?.name || billing.plan?.name || "—"}
                </h2>
                {currentPlanMeta && (() => {
                  const price = getPriceDisplay(currentPlanMeta);
                  return (
                    <p className="text-slate-500 text-sm mt-0.5">
                      {price.amount === "Free"
                        ? <span className="text-orange-500 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5" /> {price.sub || "Free plan"}
                          </span>
                        : `${price.amount}${price.unit}`}
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Right — status badge */}
            {statusConf && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConf.cls}`}>
                <statusConf.Icon className="w-3.5 h-3.5" />
                {statusConf.label}
              </span>
            )}
          </div>

          {/* Plan capability strip */}
          {currentPlanMeta && (
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-slate-400">Properties</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {currentPlanMeta.propertyLimit ? `Up to ${currentPlanMeta.propertyLimit}` : "Unlimited"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Commission</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {currentPlanMeta.commissionRate > 0
                    ? `${(currentPlanMeta.commissionRate * 100).toFixed(0)}% ${currentPlanMeta.commissionLabel}`
                    : "None"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Analytics</p>
                <p className={`text-sm font-semibold mt-0.5 ${(LEVEL_META[currentPlanMeta.analyticsLevel] || {}).cls || "text-slate-700"}`}>
                  {(LEVEL_META[currentPlanMeta.analyticsLevel] || {}).label || currentPlanMeta.analyticsLevel || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Staff Mgmt</p>
                <p className={`text-sm font-semibold mt-0.5 ${(LEVEL_META[currentPlanMeta.staffManagementLevel] || {}).cls || "text-slate-700"}`}>
                  {(LEVEL_META[currentPlanMeta.staffManagementLevel] || {}).label || currentPlanMeta.staffManagementLevel || "—"}
                </p>
              </div>
            </div>
          )}

          {/* Billing metadata */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-400">Period Start</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{fmt(billing.subscriptionCurrentPeriodStart)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Period End</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{fmt(billing.subscriptionCurrentPeriodEnd)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Stripe Customer</p>
              <p className="text-sm font-mono text-slate-500 mt-0.5 truncate">{billing.stripeCustomerId || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Auto-Renew</p>
              <p className="text-sm font-medium mt-0.5">
                {billing.subscriptionCancelAtPeriodEnd
                  ? <span className="text-orange-600">Cancels at period end</span>
                  : <span className="text-emerald-600">Enabled</span>}
              </p>
            </div>
          </div>

          {/* Cancel subscription */}
          {billing.subscriptionActive && !billing.subscriptionCancelAtPeriodEnd && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {cancelConfirm ? (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span>Cancel at period end ({fmt(billing.subscriptionCurrentPeriodEnd)})?</span>
                  <button
                    onClick={handleCancelPlan}
                    disabled={planActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {planActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Confirm cancel
                  </button>
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                  >
                    Keep plan
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          )}

          {/* Feature pills */}
          {currentPlanMeta && getEnabledFeatures(currentPlanMeta).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {getEnabledFeatures(currentPlanMeta).map(({ key, label, Icon }) => (
                <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100">
                  {Icon ? <Icon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {label}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ) : null}

      {/* ── Plans grid ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Available Plans</h2>
        <p className="text-sm text-slate-500 mb-5">
          Switch to a different plan at any time. You'll be redirected to Stripe's secure checkout.
        </p>

        {plansError && !plans.length && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Failed to load plans
            <button onClick={() => dispatch(fetchSubscriptionPlans())} className="ml-auto underline text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        <div className={`grid grid-cols-1 ${cols} gap-5`}>
          {plansLoading && !plans.length
            ? [1, 2, 3, 4].map((i) => <PlanSkeleton key={i} />)
            : plans.map((plan, i) => {
                const style       = PLAN_STYLE[plan.code] || PLAN_STYLE.SINGLE;
                const isCurrent   = currentCode === plan.code;
                const isPending   = pendingCode === plan.code;
                const isLoading   = selectedCode === plan.code && (checkoutLoading || planActionLoading);
                const anyLoading  = checkoutLoading || planActionLoading;
                const price       = getPriceDisplay(plan);
                const enabled     = getEnabledFeatures(plan);
                const disabled    = getDisabledFeatures(plan);
                const isFree      = plan.code === "FREE";

                return (
                  <motion.div
                    key={plan.code}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={`relative rounded-2xl border flex flex-col transition-all
                      ${isCurrent
                        ? "border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100"
                        : isPending
                          ? "border-yellow-400 bg-yellow-50/40 shadow-md shadow-yellow-100"
                          : style.highlight
                            ? "border-blue-300 bg-blue-50/50"
                            : "border-slate-200 bg-white"}`}
                  >
                    {/* Badges */}
                    {isCurrent && (
                      <span className="absolute -top-3 left-4 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow">
                        Current Plan
                      </span>
                    )}
                    {isPending && (
                      <span className="absolute -top-3 left-4 px-3 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full shadow">
                        Payment Pending
                      </span>
                    )}
                    {!isCurrent && !isPending && style.badge && (
                      <span className={`absolute -top-3 left-4 px-3 py-0.5 text-white text-[10px] font-bold rounded-full shadow
                        ${style.highlight ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-purple-600 to-indigo-600"}`}>
                        {style.badge}
                      </span>
                    )}

                    {/* Header */}
                    <div className={`px-5 pt-7 pb-4 border-b ${isCurrent ? "border-indigo-200" : "border-slate-100"}`}>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        {plan.partnerType}
                      </p>
                      <h3 className="text-base font-bold text-slate-800">{plan.name}</h3>

                      {/* Price */}
                      <div className="mt-3 flex items-end gap-1">
                        {isFree || price.amount === "Free" ? (
                          <span className="text-3xl font-black text-slate-800 leading-none">Free</span>
                        ) : (
                          <>
                            <span className="text-slate-400 text-base font-bold leading-none">$</span>
                            <span className="text-3xl font-black text-slate-800 leading-none">
                              {price.amount.replace("$", "").replace(/\.0+$/, "")}
                            </span>
                          </>
                        )}
                        {price.unit && (
                          <span className="text-slate-400 text-xs mb-0.5">{price.unit}</span>
                        )}
                      </div>
                      {price.sub && (
                        <p className={`text-xs mt-1 ${isFree ? "text-orange-500" : "text-slate-400"}`}>
                          {isFree && <Percent className="w-3 h-3 inline mr-0.5" />}
                          {price.sub}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5">
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
                    <div className="px-5 py-4 flex-1 space-y-3">
                      {/* Capabilities strip */}
                      <div className="flex gap-3 flex-wrap">
                        {plan.analyticsLevel && plan.analyticsLevel !== "NONE" && (
                          <span className={`text-xs font-medium flex items-center gap-1 ${(LEVEL_META[plan.analyticsLevel] || {}).cls || "text-slate-500"}`}>
                            <BarChart2 className="w-3 h-3" />
                            {(LEVEL_META[plan.analyticsLevel] || {}).label} analytics
                          </span>
                        )}
                        {plan.staffManagementLevel && plan.staffManagementLevel !== "NONE" && (
                          <span className={`text-xs font-medium flex items-center gap-1 ${(LEVEL_META[plan.staffManagementLevel] || {}).cls || "text-slate-500"}`}>
                            <Users className="w-3 h-3" />
                            {(LEVEL_META[plan.staffManagementLevel] || {}).label} staff
                          </span>
                        )}
                      </div>

                      {/* Enabled features */}
                      {enabled.length > 0 && (
                        <ul className="space-y-1.5">
                          {enabled.map(({ key, label, Icon }) => (
                            <li key={key} className="flex items-center gap-2 text-sm text-slate-600">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                                ${isCurrent ? "bg-indigo-100" : "bg-slate-100"}`}>
                                {Icon
                                  ? <Icon className={`w-2.5 h-2.5 ${isCurrent ? "text-indigo-600" : "text-slate-400"}`} />
                                  : <CheckCircle2 className="w-2.5 h-2.5 text-slate-400" />}
                              </div>
                              {label}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Disabled features (greyed out) */}
                      {disabled.length > 0 && enabled.length > 0 && (
                        <ul className="space-y-1 opacity-40">
                          {disabled.map(({ key, label }) => (
                            <li key={key} className="flex items-center gap-2 text-xs text-slate-400">
                              <XCircle className="w-3 h-3 shrink-0" />
                              {label}
                            </li>
                          ))}
                        </ul>
                      )}

                      {enabled.length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          Commission-based — limited dashboard access
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5">
                      {isCurrent ? (
                        <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-semibold cursor-default border border-indigo-200">
                          <CheckCircle className="w-4 h-4" />
                          Your current plan
                        </div>
                      ) : isPending ? (
                        <button
                          onClick={() => handleChangePlan(plan)}
                          disabled={anyLoading}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm bg-yellow-500 hover:bg-yellow-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                          ) : (
                            <><Clock className="w-4 h-4" /> Complete Payment</>
                          )}
                        </button>
                      ) : isFree && billing?.subscriptionActive ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center leading-snug">
                          Cancel your subscription to return to the free plan
                        </div>
                      ) : (
                        <button
                          onClick={() => handleChangePlan(plan)}
                          disabled={anyLoading}
                          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            ${style.highlight
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow shadow-blue-200"
                              : "bg-slate-800 hover:bg-slate-900 text-white"}`}
                        >
                          {isLoading ? (
                            billing?.subscriptionActive
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                              : <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                          ) : (
                            <><Zap className="w-4 h-4" /> {`Switch to ${plan.name}`}</>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
        </div>

        {(checkoutError || priceIdError) && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {checkoutError || priceIdError}
          </div>
        )}

        {planActionError && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {planActionError}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-400 pb-4">
        Payments are processed securely by Stripe. Upgrades and downgrades take effect immediately with proration.
        New subscriptions redirect to Stripe Checkout. Contact{" "}
        <a href="mailto:support@keytels.com" className="underline hover:text-slate-600">
          support@keytels.com
        </a>{" "}
        for billing questions.
      </p>
    </div>
  );
};

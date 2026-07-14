const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

const normalizeStatus = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const parseDateMs = (value) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

export const isBillingSubscriptionActive = (billing) => {
  if (!billing) return false;

  if (billing.subscriptionActive === false) return false;

  const status = normalizeStatus(billing.subscriptionStatus);
  const activeByStatus = billing.subscriptionActive === true || ACTIVE_STATUSES.has(status);
  if (!activeByStatus) return false;

  const periodEndMs = parseDateMs(
    billing.subscriptionCurrentPeriodEnd ?? billing.currentPeriodEnd ?? billing.subscriptionEndsAt
  );

  if (periodEndMs == null) return activeByStatus;

  return periodEndMs > Date.now();
};

export const getBillingPlanCode = (billing) =>
  isBillingSubscriptionActive(billing)
    ? billing?.plan?.code || billing?.subscriptionPlan || null
    : null;

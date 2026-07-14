import {
  Building2, BedDouble, Calendar, BookOpen, Star,
  Tag, BarChart2, Users, Zap, Package,
} from "lucide-react";

/* ── Feature key → icon & label ── */
export const FEATURE_META = {
  propertyManagement: { label: "Property management",  Icon: Building2  },
  roomManagement:     { label: "Room management",       Icon: BedDouble  },
  calendarPricing:    { label: "Calendar & pricing",    Icon: Calendar   },
  bookingManagement:  { label: "Booking management",    Icon: BookOpen   },
  reviewManagement:   { label: "Review management",     Icon: Star       },
  offersCoupons:      { label: "Offers & coupons",      Icon: Tag        },
  analytics:          { label: "Analytics",             Icon: BarChart2  },
  staffManagement:    { label: "Staff management",      Icon: Users      },
  priorityListing:    { label: "Priority listing",      Icon: Zap        },
  bulkManagement:     { label: "Bulk management",       Icon: Package    },
};

/* ── Visual style per plan code ── */
export const PLAN_STYLE = {
  FREE:      { highlight: false, badge: null,           theme: "slate"  },
  SINGLE:    { highlight: false, badge: null,           theme: "indigo" },
  MULTI:     { highlight: true,  badge: "Most Popular", theme: "blue"   },
  FRANCHISE: { highlight: false, badge: "Enterprise",   theme: "purple" },
};

/**
 * Build the price display from a plan object.
 * Returns: { amount, unit, sub } — never hardcodes values.
 *
 * FRANCHISE returns baseFeeUsd as the headline + per-property as the sub-line.
 */
export const getPriceDisplay = (plan) => {
  // FRANCHISE: base monthly fee + per-property fee — show both lines clearly
  if (plan.baseFeeUsd != null) {
    const perProp = plan.perPropertyMonthlyPriceUsd;
    return {
      amount: `$${plan.baseFeeUsd.toLocaleString()}`,
      unit: "/mo base fee",
      sub: perProp != null
        ? `+ $${perProp.toLocaleString()}/property/mo (added per hotel you list)`
        : "Base fee only — per-property fee added as you list hotels",
      breakdown: perProp != null
        ? [
            { label: "Base subscription", value: `$${plan.baseFeeUsd.toLocaleString()}/mo` },
            { label: "Per hotel listed",  value: `$${perProp.toLocaleString()}/mo each` },
          ]
        : null,
    };
  }
  // SINGLE: flat monthly fee
  if (plan.monthlyPriceUsd != null) {
    return {
      amount: `$${plan.monthlyPriceUsd.toLocaleString()}`,
      unit: "/mo",
      sub: null,
    };
  }
  // MULTI: per-property fee only
  if (plan.perPropertyMonthlyPriceUsd != null) {
    return {
      amount: `$${plan.perPropertyMonthlyPriceUsd.toLocaleString()}`,
      unit: "/property/mo",
      sub: "Billed per active property · requires 1+ hotels",
    };
  }
  // FREE / commission-only
  return {
    amount: "Free",
    unit: "",
    sub: plan.commissionRate
      ? `${(plan.commissionRate * 100).toFixed(0)}% commission on bookings`
      : null,
  };
};

export const isPaidSubscriptionPlan = (plan) => plan?.code && plan.code !== "FREE";

export const getBackendPriceId = (plan) => {
  const priceId = typeof plan?.priceId === "string" ? plan.priceId.trim() : "";
  return priceId || null;
};

/** True features (value === true) from the plan's features map */
export const getEnabledFeatures = (plan) => {
  if (!plan.features) return [];
  return Object.entries(plan.features)
    .filter(([, v]) => v === true)
    .map(([key]) => ({ key, ...(FEATURE_META[key] || { label: key, Icon: null }) }));
};

/** Disabled features (value === false) */
export const getDisabledFeatures = (plan) => {
  if (!plan.features) return [];
  return Object.entries(plan.features)
    .filter(([, v]) => v === false)
    .map(([key]) => ({ key, ...(FEATURE_META[key] || { label: key, Icon: null }) }));
};

/**
 * BillingGate — subscription is voluntary, not a gate.
 *
 * Owners can access the full dashboard regardless of subscription status.
 * They can subscribe via:
 *   - Public route: /choose-plan  (before or after login)
 *   - Dashboard route: /subscription  (inside the app, sidebar → Subscription)
 *
 * Non-owner roles (staff, manager) pass through untouched.
 */
export const BillingGate = ({ children }) => children;

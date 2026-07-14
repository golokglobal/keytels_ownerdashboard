import axios from "axios";

// Axios instance configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// In-memory token cache — avoids synchronous localStorage read on every request
let _cachedToken = localStorage.getItem("accessToken");

export const setTokenCache  = (token) => { _cachedToken = token; };
export const clearTokenCache = ()       => { _cachedToken = null; };

// Endpoints that are intentionally unauthenticated — no token sent, no logout on 401
const PUBLIC_ENDPOINTS = [
  "/staff/login",
  "/staff/auth/google",
  "/owners/login",
  "/owners/auth/google",
  "/users/register",
  "/users/forgot-password",
  "/users/reset-password",
  "/admin/partner-requests/submit",
  "/owner-billing/plans",           // plan catalog — public, no auth required
];

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  (config) => {
    // Remove Content-Type for GET & DELETE (no body)
    if (config.method === "get" || config.method === "delete") {
      delete config.headers["Content-Type"];
    }

    // For FormData uploads, let the browser set Content-Type with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((ep) =>
      config.url?.includes(ep)
    );

    if (!isPublicEndpoint && _cachedToken) {
      config.headers.Authorization = `Bearer ${_cachedToken}`;
      // Mark that we attached a real token — used by the 401 handler below
      config._hadAuthToken = true;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Prevents duplicate logout events when multiple requests fail simultaneously
let _logoutHandled = false;

const handleSessionExpired = () => {
  if (_logoutHandled) return;
  _logoutHandled = true;
  clearTokenCache();
  localStorage.clear();
  window.dispatchEvent(new CustomEvent("auth:logout"));
  setTimeout(() => { _logoutHandled = false; }, 5000);
};

// =========================
// RESPONSE INTERCEPTOR
// =========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url || "";

    // Login / register endpoints returning 401 = wrong credentials — do NOT logout
    const isAuthEndpoint = [
      "/staff/login",
      "/staff/auth/google",
      "/owners/login",
      "/owners/auth/google",
      "/users/register",
      "/users/forgot-password",
      "/users/reset-password",
    ].some((ep) => url.includes(ep));

    if (status === 401) {
      if (isAuthEndpoint) {
        // Expected — bad credentials, just report
        console.error("🔒 Authentication failed:", error.response?.data?.message || "Invalid credentials");
      } else if (error.config?._hadAuthToken) {
        // A token WAS sent but the server rejected it → token expired / revoked
        console.error("🔒 Token expired or invalid — logging out.");
        handleSessionExpired();
      } else {
        // No token was sent (unauthenticated request hit a protected endpoint).
        // Do NOT fire logout — user may be on a public page exploring plans.
        console.warn("🔒 Unauthenticated request returned 401:", url);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

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

export const setTokenCache = (token) => { _cachedToken = token; };
export const clearTokenCache = () => { _cachedToken = null; };

const PUBLIC_ENDPOINTS = [
  "/staff/login",
  "/owners/login",
  "/users/register",
  "/users/forgot-password",
  "/users/reset-password",
];

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  (config) => {
    // Remove Content-Type for GET & DELETE requests
    if (config.method === "get" || config.method === "delete") {
      delete config.headers["Content-Type"];
    }

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      if (_cachedToken) {
        config.headers.Authorization = `Bearer ${_cachedToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR
// =========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const authEndpoints = [
      "/staff/login",
      "/owners/login",
      "/users/register",
      "/users/forgot-password",
      "/users/reset-password",
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      url.includes(endpoint)
    );

    if (status === 401) {
      if (isAuthEndpoint) {
        console.error(
          "🔒 Authentication failed:",
          error.response?.data?.message || "Invalid credentials"
        );
      } else {
        console.error("🔒 Unauthorized: Token expired or invalid.");
        clearTokenCache();
        localStorage.clear();
        // Soft redirect via custom event so React Router handles navigation
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

// Axios instance configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});


// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  (config) => {
    // Remove Content-Type for GET & DELETE requests
    if (config.method === "get" || config.method === "delete") {
      delete config.headers["Content-Type"];
    }

    // Public (no-auth) endpoints
    const publicEndpoints = [
      "/api/staff/login",
      "/api/owners/login",
      "/api/users/register",
      "/api/users/forgot-password",
      "/api/users/reset-password",
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        // Standard JWT header
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        console.warn("⚠️ No access token found for protected route:", config.url);
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
      "/api/staff/login",
      "/api/owners/login",
      "/api/users/register",
      "/api/users/forgot-password",
      "/api/users/reset-password",
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
        console.error("🔒 Unauthorized: Token might be expired or invalid.");
        // Optional: redirect to login
        // window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

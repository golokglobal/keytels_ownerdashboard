import axios from "axios";
import { BASE_URL } from "./baseUrl";

// Cache buster: v1.1 - Added /api/owners/login to public endpoints

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.method === "get" || config.method === "delete") {
      delete config.headers["Content-Type"];
    }

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

    console.log(`[AXIOS] URL: ${config.url}, Is Public: ${isPublicEndpoint}`);

    if (isPublicEndpoint) {
      console.log(`[AXIOS] ✅ Public endpoint - no token required`);
      return config;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      // CRITICAL FIX: Changed from X-AUTH-TOKEN to Authorization Bearer
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    } else {
      console.warn("⚠️ No access token found for protected route:", config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // Check if this is a login/register endpoint
    const isAuthEndpoint = [
      "/api/staff/login",
      "/api/owners/login",
      "/api/users/register",
      "/api/users/forgot-password",
      "/api/users/reset-password",
    ].some((endpoint) => url.includes(endpoint));

    if (status === 401) {
      if (isAuthEndpoint) {
        // For login failures, log the actual error message from backend
        console.error("🔒 Authentication failed:", error.response?.data?.message || "Invalid credentials");
      } else {
        // For protected routes, token is expired/invalid
        console.error("🔒 Unauthorized: Token might be expired or invalid.");
        // Optionally redirect to login
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
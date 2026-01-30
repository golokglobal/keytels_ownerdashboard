// ============================================================================
// FILE 1: src/config/baseUrl.js
// ============================================================================
// Base URL configuration for all API calls
// In development: use empty string to let Vite proxy handle requests (avoids CORS)
// In production: use full URL
export const BASE_URL = import.meta.env.DEV ? "" : "https://desiney.berymo.com";

export default BASE_URL;


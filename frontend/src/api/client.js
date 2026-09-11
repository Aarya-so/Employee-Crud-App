import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("ems_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes FastAPI error shapes (plain string, {detail: "..."},
// or {detail: [{field, message}, ...]} from our validation handler)
// into one readable string for the UI.
export function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
      .join(" · ");
  }

  return "Something went wrong. Please try again.";
}

// Returns { field: message } when the backend responded with per-field
// validation errors (422 from our RequestValidationError handler), else null.
export function extractFieldErrors(error) {
  const detail = error?.response?.data?.detail;
  if (!Array.isArray(detail)) return null;

  const fieldErrors = {};
  detail.forEach((e) => {
    if (e.field) fieldErrors[e.field] = e.message;
  });
  return Object.keys(fieldErrors).length ? fieldErrors : null;
}

export default client;

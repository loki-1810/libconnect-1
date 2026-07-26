import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("libconnect_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(error) {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
  return detail || error.message || "Something went wrong. Please try again.";
}

export default api;

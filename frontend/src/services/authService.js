import api from "./api";

export const authService = {
  login: (payload) => api.post("/auth/login", payload).then((response) => response.data),
  register: (payload) => api.post("/auth/register", payload).then((response) => response.data),
  me: () => api.get("/auth/me").then((response) => response.data),
  updateProfile: (payload) => api.patch("/auth/me", payload).then((response) => response.data),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then((response) => response.data),
  resetPassword: (payload) => api.post("/auth/reset-password", payload).then((response) => response.data),
};

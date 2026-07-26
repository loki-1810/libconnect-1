import api from "./api";

export const dashboardService = {
  get: () => api.get("/dashboard").then((response) => response.data),
  report: () => api.get("/dashboard/reports/borrows").then((response) => response.data),
  notifications: () => api.get("/notifications").then((response) => response.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((response) => response.data),
  markAllRead: () => api.post("/notifications/read-all").then((response) => response.data),
  users: (params) => api.get("/users", { params }).then((response) => response.data),
  updateUser: (id, payload) => api.patch(`/users/${id}`, payload).then((response) => response.data),
};

import api from "./api";

export const dashboardService = {
  get: () => api.get("/dashboard").then((response) => response.data),
  report: () => api.get("/dashboard/reports/borrows").then((response) => response.data),
  notifications: (params) => api.get("/notifications", { params }).then((response) => response.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((response) => response.data),
  markAllRead: () => api.post("/notifications/read-all").then((response) => response.data),
  users: (params) => api.get("/users", { params }).then((response) => response.data),
  createLibrarian: (payload) => api.post("/users/create-librarian", payload).then((response) => response.data),
  assignLibrary: (userId, libraryId) => api.post(`/users/${userId}/assign-library`, { library_id: libraryId }).then((response) => response.data),
  toggleActive: (userId) => api.post(`/users/${userId}/toggle-active`).then((response) => response.data),
  updateUser: (id, payload) => api.patch(`/users/${id}`, payload).then((response) => response.data),
};

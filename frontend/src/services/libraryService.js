import api from "./api";

export const libraryService = {
  list: (params) => api.get("/libraries", { params }).then((response) => response.data),
  get: (id) => api.get(`/libraries/${id}`).then((response) => response.data),
  create: (payload) => api.post("/libraries", payload).then((response) => response.data),
  apply: (payload) => api.post("/libraries/apply", payload).then((response) => response.data),
  update: (id, payload) => api.patch(`/libraries/${id}`, payload).then((response) => response.data),
  remove: (id) => api.delete(`/libraries/${id}`).then((response) => response.data),
};

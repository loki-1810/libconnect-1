import api from "./api";

export const bookService = {
  list: (params) => api.get("/books", { params }).then((response) => response.data),
  filters: () => api.get("/books/filters").then((response) => response.data),
  get: (id) => api.get(`/books/${id}`).then((response) => response.data),
  create: (payload) => api.post("/books", payload).then((response) => response.data),
  update: (id, payload) => api.patch(`/books/${id}`, payload).then((response) => response.data),
  remove: (id) => api.delete(`/books/${id}`).then((response) => response.data),
};

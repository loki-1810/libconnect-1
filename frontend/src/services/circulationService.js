import api from "./api";

export const circulationService = {
  requestBorrow: (bookId) => api.post("/borrows", { book_id: bookId }).then((response) => response.data),
  myBorrows: (params) => api.get("/borrows/mine", { params }).then((response) => response.data),
  libraryBorrows: (params) => api.get("/borrows/library", { params }).then((response) => response.data),
  approve: (id, note) => api.post(`/borrows/${id}/approve`, { note }).then((response) => response.data),
  reject: (id, note) => api.post(`/borrows/${id}/reject`, { note }).then((response) => response.data),
  returnBook: (id, note) => api.post(`/borrows/${id}/return`, { note }).then((response) => response.data),
  fineStatus: () => api.get("/borrows/fine-status/me").then((response) => response.data),
  reserve: (bookId) => api.post("/reservations", { book_id: bookId }).then((response) => response.data),
  myReservations: (params) => api.get("/reservations/mine", { params }).then((response) => response.data),
  libraryReservations: (params) => api.get("/reservations/library", { params }).then((response) => response.data),
  cancelReservation: (id) => api.post(`/reservations/${id}/cancel`).then((response) => response.data),
  fulfillReservation: (id) => api.post(`/reservations/${id}/fulfill`).then((response) => response.data),
};

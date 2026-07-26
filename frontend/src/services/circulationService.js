import api from "./api";

export const circulationService = {
  requestBorrow: (bookId) => api.post("/borrows", { book_id: bookId }).then((response) => response.data),
  myBorrows: (params) => api.get("/borrows/mine", { params }).then((response) => response.data),
  libraryBorrows: (params) => api.get("/borrows/library", { params }).then((response) => response.data),
  approve: (id, note) => api.post(`/borrows/${id}/approve`, { note }).then((response) => response.data),
  reject: (id, note) => api.post(`/borrows/${id}/reject`, { note }).then((response) => response.data),
  schedulePickup: (id, pickup_date, pickup_time) => api.post(`/borrows/${id}/schedule-pickup`, { pickup_date, pickup_time }).then((response) => response.data),
  cancelRequest: (id) => api.post(`/borrows/${id}/cancel-request`).then((response) => response.data),
  cancelPickup: (id) => api.post(`/borrows/${id}/cancel-pickup`).then((response) => response.data),
  collect: (id, note) => api.post(`/borrows/${id}/collect`, { note }).then((response) => response.data),
  returnBook: (id, note) => api.post(`/borrows/${id}/return`, { note }).then((response) => response.data),
  fineStatus: () => api.get("/borrows/fine-status/me").then((response) => response.data),
  reserve: (bookId) => api.post("/reservations", { book_id: bookId }).then((response) => response.data),
  myReservations: (params) => api.get("/reservations/mine", { params }).then((response) => response.data),
  libraryReservations: (params) => api.get("/reservations/library", { params }).then((response) => response.data),
  cancelReservation: (id) => api.post(`/reservations/${id}/cancel`).then((response) => response.data),
  fulfillReservation: (id) => api.post(`/reservations/${id}/fulfill`).then((response) => response.data),
};

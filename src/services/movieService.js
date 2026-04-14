import api from './api'

// ─── MOVIES ──────────────────────────────────────────────────────────────────
export const movieService = {
  getAll:        ()           => api.get('/movies'),
  getNowShowing: ()           => api.get('/movies/now-showing'),
  getById:       (id)         => api.get(`/movies/${id}`),
  create:        (data)       => api.post('/movies', data),
  update:        (id, data)   => api.put(`/movies/${id}`, data),
  delete:        (id)         => api.delete(`/movies/${id}`),
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export const reviewService = {
  getByMovie:  (movieId) => api.get(`/reviews/movie/${movieId}`),
  create:      (data)    => api.post('/reviews', data),
  update:      (id, data) => api.put(`/reviews/${id}`, data),
  delete:      (id)      => api.delete(`/reviews/${id}`),
}

// ─── SHOWTIMES ───────────────────────────────────────────────────────────────
export const showtimeService = {
  getAll:       ()                          => api.get('/showtimes'),
  getUpcoming: ()                          => api.get('/showtimes/upcoming'),
  getById:     (id)                        => api.get(`/showtimes/${id}`),
  getSeats:    (id)                        => api.get(`/showtimes/${id}/seats`),
  create:      (data)                      => api.post('/showtimes', data),
  cancel:      (id)                        => api.put(`/showtimes/${id}/cancel`),
  search: (date, movieId, cinemaId) => {
    const params = new URLSearchParams({ date: date.toISOString() })
    if (movieId)  params.append('movieId', movieId) 
    if (cinemaId) params.append('cinemaId', cinemaId)
    return api.get(`/showtimes/search?${params}`)
  },
}

// ─── CINEMAS ─────────────────────────────────────────────────────────────────
export const cinemaService = {
  getAll:    ()           => api.get('/cinemas'),
  getById:   (id)         => api.get(`/cinemas/${id}`),
  create:    (data)       => api.post('/cinemas', data),
  update:    (id, data)   => api.put(`/cinemas/${id}`, data),
  delete:    (id)         => api.delete(`/cinemas/${id}`),
}

// ─── SCREENING ROOMS ─────────────────────────────────────────────────────────
export const roomService = {
  getAll:        ()          => api.get('/screeningrooms'),
  getByCinema:   (cinemaId)  => api.get(`/screeningrooms/cinema/${cinemaId}`),
  getById:       (id)        => api.get(`/screeningrooms/${id}`),
  create:        (data)      => api.post('/screeningrooms', data),
  update:        (id, data)  => api.put(`/screeningrooms/${id}`, data),
  delete:        (id)        => api.delete(`/screeningrooms/${id}`),
}

// ─── SEAT LAYOUTS ────────────────────────────────────────────────────────────
export const seatService = {
  getByRoom: (roomId) => api.get(`/seatlayouts/room/${roomId}`),
  generate:  (data)   => api.post('/seatlayouts/generate', data),
  update:   (data)    => api.put('/seatLayouts/update-seat-types', data),
}

// ─── FOOD ────────────────────────────────────────────────────────────────────
export const foodService = {
  getCategories:   ()          => api.get('/food/categories'),
  createCategory:  (data)      => api.post('/food/categories', data),
  updateCategory:  (id, data)  => api.put(`/food/categories/${id}`, data),

  getItems:        ()          => api.get('/food/items'),
  getItemsByCategory: (catId)  => api.get(`/food/items/category/${catId}`),
  getItemById:     (id)        => api.get(`/food/items/${id}`),
  createItem:      (data)      => api.post('/food/items', data),
  updateItem:      (id, data)  => api.put(`/food/items/${id}`, data),
  deleteItem:      (id)        => api.delete(`/food/items/${id}`),

  getComboItems:   (comboId)   => api.get(`/food/combos/${comboId}/items`),
  updateCombo:     (comboId, items) => api.post(`/food/combos/${comboId}/items`, items),
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
export const bookingService = {
  create:       (data)         => api.post('/bookings', data),
  getById:      (id)           => api.get(`/bookings/${id}`),
  addFood:      (id, items)    => api.put(`/bookings/${id}/food`, items),
  applyPromo:   (id, code)     => api.post(`/bookings/${id}/apply-promotion`, { promotionCode: code }),
  removePromo: (id) => api.delete(`/bookings/${id}/remove-promotion`),
  getAll:       ()             => api.get('/bookings'),
  getByUser:    (userId)       => api.get(`/users/${userId}/bookings`),
  clearPending: (showtimeId) => api.delete(`/bookings/clear-pending/${showtimeId}`)
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentService = {
  process:        (data)       => api.post('/payments/process', data),
  createVnPayUrl: (bookingId)  => api.post(`/payments/create-vnpay-url/${bookingId}`),
  verifyVnPayReturn: (queryString) => api.get(`/payments/vnpay-return${queryString}`)
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export const userService = {
  getAll:          ()              => api.get('/users'),
  getById:         (id)           => api.get(`/users/${id}`),
  changePassword:  (id, data)     => api.post(`/users/${id}/change-password`, data),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
  getBookings:     (id)           => api.get(`/users/${id}/bookings`),
  toggleLock:      (id)           => api.patch(`/users/${id}/toggle-lock`),
  updateRole:      (id, role)     => api.patch(`/users/${id}/role`, { role }),
}

// ─── MEMBERSHIP ──────────────────────────────────────────────────────────────
export const membershipService = {
  getMyCard:       ()             => api.get('/memberships/my-card'),
  getTransactions: ()             => api.get('/memberships/transactions'),
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notificationService = {
  getAll:         ()       => api.get('/notifications'),
  getUnreadCount: ()       => api.get('/notifications/unread-count'),
  markRead:       (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead:    ()       => api.patch('/notifications/read-all'),
}

// ─── GENRES ──────────────────────────────────────────────────────────────────
export const genreService = {
  getAll:   ()          => api.get('/genres'),
  create:   (data)      => api.post('/genres', data),
  update:   (id, data)  => api.put(`/genres/${id}`, data),
  delete:   (id)        => api.delete(`/genres/${id}`),
}

// ─── DIRECTORS ───────────────────────────────────────────────────────────────
export const directorService = {
  getAll:   ()          => api.get('/directors'),
  getById:  (id)        => api.get(`/directors/${id}`),
  create:   (data)      => api.post('/directors', data),
  update:   (id, data)  => api.put(`/directors/${id}`, data),
  delete:   (id)        => api.delete(`/directors/${id}`),
}

// ─── CAST MEMBERS ────────────────────────────────────────────────────────────
export const castService = {
  getAll:   ()          => api.get('/castmembers'),
  getById:  (id)        => api.get(`/castmembers/${id}`),
  create:   (data)      => api.post('/castmembers', data),
  update:   (id, data)  => api.put(`/castmembers/${id}`, data),
  delete:   (id)        => api.delete(`/castmembers/${id}`),
}

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────
export const promotionService = {
  getAll:   ()          => api.get('/promotions'),
  getById:  (id)        => api.get(`/promotions/${id}`),
  create:   (data)      => api.post('/promotions', data),
  update:   (id, data)  => api.put(`/promotions/${id}`, data),
  // DELETE thực chất là vô hiệu hóa (soft delete)
  disable:  (id)        => api.delete(`/promotions/${id}`),
}

// ─── PRICING ─────────────────────────────────────────────────────────────────
export const pricingService = {
  getRules:      ()          => api.get('/pricings/rules'),
  createRule:    (data)      => api.post('/pricings/rules', data),
  updateRule:    (id, data)  => api.put(`/pricings/rules/${id}`, data),
  toggleRule:    (id)        => api.patch(`/pricings/rules/${id}/toggle`),

  getHolidays:   ()          => api.get('/pricings/holidays'),
  createHoliday: (data)      => api.post('/pricings/holidays', data),
  updateHoliday: (id, data)  => api.put(`/pricings/holidays/${id}`, data),
  deleteHoliday: (id)        => api.delete(`/pricings/holidays/${id}`),
}

// ─── REVENUE (View) ──────────────────────────────────────────────────────────
export const revenueService = {
  getCinemaRevenue: ()  => api.get('/cinemarevenue'), // Hoặc '/revenue' tùy theo controller của bạn
  getMonthlyRevenue: (year) => api.get(`/cinemarevenue/monthly?year=${year}`),
  getWeeklyRevenue: ()  => api.get('/cinemarevenue/weekly'),
}

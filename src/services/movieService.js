import api from './api'

// ─── MOVIES ──────────────────────────────────────────────────────────────────
export const movieService = {
  getAll:        ()           => api.get('/Movies'),
  getNowShowing: ()           => api.get('/Movies/now-showing'),
  getById:       (id)         => api.get(`/Movies/${id}`),
  create:        (data)       => api.post('/Movies', data),
  update:        (id, data)   => api.put(`/Movies/${id}`, data),
  delete:        (id)         => api.delete(`/Movies/${id}`),
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export const reviewService = {
  getByMovie:  (movieId) => api.get(`/Reviews/movie/${movieId}`),
  create:      (data)    => api.post('/Reviews', data),
  update:      (id, data) => api.put(`/Reviews/${id}`, data),
  delete:      (id)      => api.delete(`/Reviews/${id}`),
}

// ─── SHOWTIMES ───────────────────────────────────────────────────────────────
export const showtimeService = {
  getAll:       ()                          => api.get('/Showtimes'),
  getUpcoming: ()                          => api.get('/Showtimes/upcoming'),
  getById:     (id)                        => api.get(`/Showtimes/${id}`),
  getSeats:    (id)                        => api.get(`/Showtimes/${id}/seats`),
  create:      (data)                      => api.post('/Showtimes', data),
  cancel:      (id)                        => api.put(`/Showtimes/${id}/cancel`),
  search: (date, movieId, cinemaId) => {
    const params = new URLSearchParams({ date: date.toISOString() })
    if (movieId)  params.append('movieId', movieId) 
    if (cinemaId) params.append('cinemaId', cinemaId)
    return api.get(`/Showtimes/search?${params}`)
  },
}

// ─── CINEMAS ─────────────────────────────────────────────────────────────────
export const cinemaService = {
  getAll:    ()           => api.get('/Cinemas'),
  getById:   (id)         => api.get(`/Cinemas/${id}`),
  create:    (data)       => api.post('/Cinemas', data),
  update:    (id, data)   => api.put(`/Cinemas/${id}`, data),
  delete:    (id)         => api.delete(`/Cinemas/${id}`),
}

// ─── SCREENING ROOMS ─────────────────────────────────────────────────────────
export const roomService = {
  getAll:        ()          => api.get('/ScreeningRooms'),
  getByCinema:   (cinemaId)  => api.get(`/ScreeningRooms/cinema/${cinemaId}`),
  getById:       (id)        => api.get(`/ScreeningRooms/${id}`),
  create:        (data)      => api.post('/ScreeningRooms', data),
  update:        (id, data)  => api.put(`/ScreeningRooms/${id}`, data),
  delete:        (id)        => api.delete(`/ScreeningRooms/${id}`),
}

// ─── SEAT LAYOUTS ────────────────────────────────────────────────────────────
export const seatService = {
  getByRoom: (roomId) => api.get(`/SeatLayouts/room/${roomId}`),
  generate:  (data)   => api.post('/SeatLayouts/generate', data),
  update:   (data)    => api.put('/SeatLayouts/update-seat-types', data),
}

// ─── FOOD ────────────────────────────────────────────────────────────────────
export const foodService = {
  getCategories:   ()          => api.get('/Food/Categories'),
  createCategory:  (data)      => api.post('/Food/Categories', data),
  updateCategory:  (id, data)  => api.put(`/Food/Categories/${id}`, data),

  getItems:        ()          => api.get('/Food/Items'),
  getItemsByCategory: (catId)  => api.get(`/Food/Items/Category/${catId}`),
  getItemById:     (id)        => api.get(`/Food/Items/${id}`),
  createItem:      (data)      => api.post('/Food/Items', data),
  updateItem:      (id, data)  => api.put(`/Food/Items/${id}`, data),
  deleteItem:      (id)        => api.delete(`/Food/Items/${id}`),

  getComboItems:   (comboId)   => api.get(`/Food/Combos/${comboId}/items`),
  updateCombo:     (comboId, items) => api.post(`/Food/Combos/${comboId}/items`, items),
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
export const bookingService = {
  create:       (data)         => api.post('/Bookings', data),
  getById:      (id)           => api.get(`/Bookings/${id}`),
  addFood:      (id, items)    => api.put(`/Bookings/${id}/food`, items),
  applyPromo:   (id, code)     => api.post(`/Bookings/${id}/apply-promotion`, { promotionCode: code }),
  removePromo: (id) => api.delete(`/Bookings/${id}/remove-promotion`),
  getAll:       ()             => api.get('/Bookings'),
  getByUser:    (userId)       => api.get(`/Users/${userId}/bookings`),
  clearPending: (showtimeId) => api.delete(`/Bookings/clear-pending/${showtimeId}`)
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentService = {
  process:        (data)       => api.post('/Payments/process', data),
  createVnPayUrl: (bookingId)  => api.post(`/Payments/create-vnpay-url/${bookingId}`),
  verifyVnPayReturn: (queryString) => api.get(`/Payments/vnpay-return${queryString}`)
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export const userService = {
  getAll:          ()              => api.get('/Users'),
  getById:         (id)           => api.get(`/Users/${id}`),
  changePassword:  (id, data)     => api.post(`/Users/${id}/change-password`, data),
  updateProfile: (id, data) => api.put(`/Users/${id}`, data),
  getBookings:     (id)           => api.get(`/Users/${id}/bookings`),
  toggleLock:      (id)           => api.patch(`/Users/${id}/toggle-lock`),
  updateRole:      (id, role)     => api.patch(`/Users/${id}/role`, { role }),
}

// ─── MEMBERSHIP ──────────────────────────────────────────────────────────────
export const membershipService = {
  getMyCard:       ()             => api.get('/Memberships/my-card'),
  getTransactions: ()             => api.get('/Memberships/transactions'),
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notificationService = {
  getAll:         ()       => api.get('/Notifications'),
  getUnreadCount: ()       => api.get('/Notifications/unread-count'),
  markRead:       (id)     => api.patch(`/Notifications/${id}/read`),
  markAllRead:    ()       => api.patch('/Notifications/read-all'),
}

// ─── GENRES ──────────────────────────────────────────────────────────────────
export const genreService = {
  getAll:   ()          => api.get('/Genres'),
  create:   (data)      => api.post('/Genres', data),
  update:   (id, data)  => api.put(`/Genres/${id}`, data),
  delete:   (id)        => api.delete(`/Genres/${id}`),
}

// ─── DIRECTORS ───────────────────────────────────────────────────────────────
export const directorService = {
  getAll:   ()          => api.get('/Directors'),
  getById:  (id)        => api.get(`/Directors/${id}`),
  create:   (data)      => api.post('/Directors', data),
  update:   (id, data)  => api.put(`/Directors/${id}`, data),
  delete:   (id)        => api.delete(`/Directors/${id}`),
}

// ─── CAST MEMBERS ────────────────────────────────────────────────────────────
export const castService = {
  getAll:   ()          => api.get('/CastMembers'),
  getById:  (id)        => api.get(`/CastMembers/${id}`),
  create:   (data)      => api.post('/CastMembers', data),
  update:   (id, data)  => api.put(`/CastMembers/${id}`, data),
  delete:   (id)        => api.delete(`/CastMembers/${id}`),
}

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────
export const promotionService = {
  getAll:   ()          => api.get('/Promotions'),
  getById:  (id)        => api.get(`/Promotions/${id}`),
  create:   (data)      => api.post('/Promotions', data),
  update:   (id, data)  => api.put(`/Promotions/${id}`, data),
  // DELETE thực chất là vô hiệu hóa (soft delete)
  disable:  (id)        => api.delete(`/Promotions/${id}`),
}

// ─── PRICING ─────────────────────────────────────────────────────────────────
export const pricingService = {
  getRules:      ()          => api.get('/Pricings/rules'),
  createRule:    (data)      => api.post('/Pricings/rules', data),
  updateRule:    (id, data)  => api.put(`/Pricings/rules/${id}`, data),
  toggleRule:    (id)        => api.patch(`/Pricings/rules/${id}/toggle`),

  getHolidays:   ()          => api.get('/Pricings/holidays'),
  createHoliday: (data)      => api.post('/Pricings/holidays', data),
  updateHoliday: (id, data)  => api.put(`/Pricings/holidays/${id}`, data),
  deleteHoliday: (id)        => api.delete(`/Pricings/holidays/${id}`),
}

// ─── REVENUE (View) ──────────────────────────────────────────────────────────
export const revenueService = {
  getCinemaRevenue: ()  => api.get('/CinemaRevenue'), // Hoặc '/revenue' tùy theo controller của bạn
  getMonthlyRevenue: (year) => api.get(`/CinemaRevenue/monthly?year=${year}`),
  getWeeklyRevenue: ()  => api.get('/CinemaRevenue/weekly'),
}

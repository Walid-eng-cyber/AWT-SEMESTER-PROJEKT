export const API_BASE = '/api/v1'

export const endpoints = {
  users: {
    me: `${API_BASE}/users/me`,
    list: `${API_BASE}/users`,
  },
  rooms: {
    list: `${API_BASE}/rooms`,
    byId: (roomId: string) => `${API_BASE}/rooms/${roomId}`,
    available: `${API_BASE}/rooms/available`,
  },
  bookings: {
    list: `${API_BASE}/bookings`,
    create: `${API_BASE}/bookings`,
    byId: (bookingId: string) => `${API_BASE}/bookings/${bookingId}`,
    cancel: (bookingId: string) => `${API_BASE}/bookings/${bookingId}/cancel`,
  },
  availability: {
    window: `${API_BASE}/availability`,
  },
  notifications: {
    list: `${API_BASE}/notifications`,
    markRead: (notificationId: string) => `${API_BASE}/notifications/${notificationId}/read`,
  },
}

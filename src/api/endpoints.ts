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
    update: (roomId: string) => `${API_BASE}/rooms/${roomId}`,
    setStatus: (roomId: string) => `${API_BASE}/rooms/${roomId}/status`,
  },
  appointments: {
    list: `${API_BASE}/appointments`,
    create: `${API_BASE}/appointments`,
    byId: (bookingId: string) => `${API_BASE}/appointments/${bookingId}`,
    confirm: (bookingId: string) => `${API_BASE}/appointments/${bookingId}/confirm`,
    cancel: (bookingId: string) => `${API_BASE}/appointments/${bookingId}/cancel`,
  },
  availability: {
    window: `${API_BASE}/availability`,
  },
  notifications: {
    list: `${API_BASE}/notifications`,
    markRead: (notificationId: string) => `${API_BASE}/notifications/${notificationId}/read`,
  },
}

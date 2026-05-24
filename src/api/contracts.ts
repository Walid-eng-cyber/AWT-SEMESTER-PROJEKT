export type UserRole = 'student' | 'staff' | 'admin'
export type UserStatus = 'active' | 'blocked'

export type RoomType = 'Seminar' | 'Lab' | 'Lecture' | 'Studio'
export type RoomStatus = 'active' | 'maintenance' | 'archived'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type SlotState = 'free' | 'occupied' | 'maintenance'

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'reminder'
  | 'system'

export interface PageMeta {
  page: number
  pageSize: number
  total: number
}

export interface PagedResponse<T> extends PageMeta {
  data: T[]
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  traceId?: string
}

export interface User {
  id: string
  email: string
  fullName: string
  universityId?: string
  role: UserRole
  status: UserStatus
}

export interface UpdateUserRequest {
  fullName?: string
}

export interface Room {
  id: string
  name: string
  building: string
  floor: string
  seats: number
  type: RoomType
  equipment: string[]
  status: RoomStatus
}

export interface Booking {
  id: string
  roomId: string
  userId: string
  startsAt: string
  endsAt: string
  purpose: string
  status: BookingStatus
  createdAt: string
}

export interface CreateBookingRequest {
  roomId: string
  startsAt: string
  endsAt: string
  purpose: string
}

export interface AvailabilitySlot {
  startsAt: string
  endsAt: string
  state: SlotState
}

export interface AvailabilityWindow {
  roomId: string
  from: string
  to: string
  slots: AvailabilitySlot[]
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}

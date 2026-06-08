import type { Booking, BookingStatus, CreateBookingRequest, PagedResponse } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson, postJson } from '../http'
import { assertValidCreateBookingRequest } from './bookingLifecycle'

type BackendAppointmentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

interface BackendAppointment {
  id: string
  roomId: string
  ownerUserId: string
  startsAt: string
  endsAt: string
  title: string
  status: BackendAppointmentStatus
  createdAt: string
}

function mapStatus(status: BackendAppointmentStatus): BookingStatus {
  if (status === 'CONFIRMED') return 'confirmed'
  if (status === 'CANCELLED') return 'cancelled'
  return 'pending'
}

function mapBooking(item: BackendAppointment): Booking {
  return {
    id: item.id,
    roomId: item.roomId,
    userId: item.ownerUserId,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    purpose: item.title,
    status: mapStatus(item.status),
    createdAt: item.createdAt,
  }
}

export interface BookingsFilter {
  status?: BookingStatus
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export function listBookings(filter: BookingsFilter = {}): Promise<PagedResponse<Booking>> {
  const backendStatus = filter.status === 'confirmed'
    ? 'CONFIRMED'
    : filter.status === 'cancelled'
      ? 'CANCELLED'
      : filter.status === 'pending'
        ? 'DRAFT'
        : undefined

  return getJson<BackendAppointment[]>(endpoints.appointments.list, {
    status: backendStatus,
    from: filter.from,
    to: filter.to,
  }).then(data => ({
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? data.length,
    total: data.length,
    data: data.map(mapBooking),
  }))
}

export function getBookingById(bookingId: string): Promise<Booking> {
  return getJson<BackendAppointment>(endpoints.appointments.byId(bookingId)).then(mapBooking)
}

export function createBooking(input: CreateBookingRequest, idempotencyKey: string): Promise<Booking> {
  assertValidCreateBookingRequest(input)

  const payload = {
    roomId: input.roomId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    title: input.purpose,
  }

  return postJson<BackendAppointment, typeof payload>(endpoints.appointments.create, payload, {
    'Idempotency-Key': idempotencyKey,
  }).then(mapBooking)
}

export function confirmBooking(bookingId: string): Promise<Booking> {
  return postJson<BackendAppointment>(endpoints.appointments.confirm(bookingId)).then(mapBooking)
}

export function cancelBooking(bookingId: string): Promise<Booking> {
  return postJson<BackendAppointment>(endpoints.appointments.cancel(bookingId)).then(mapBooking)
}

import type { Booking, BookingStatus, CreateBookingRequest, PagedResponse } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson, postJson } from '../http'

export interface BookingsFilter {
  status?: BookingStatus
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export function listBookings(filter: BookingsFilter = {}): Promise<PagedResponse<Booking>> {
  return getJson<PagedResponse<Booking>>(endpoints.bookings.list, {
    status: filter.status,
    from: filter.from,
    to: filter.to,
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? 20,
  })
}

export function getBookingById(bookingId: string): Promise<Booking> {
  return getJson<Booking>(endpoints.bookings.byId(bookingId))
}

export function createBooking(input: CreateBookingRequest, idempotencyKey: string): Promise<Booking> {
  return postJson<Booking, CreateBookingRequest>(endpoints.bookings.create, input, {
    'Idempotency-Key': idempotencyKey,
  })
}

export function cancelBooking(bookingId: string): Promise<Booking> {
  return postJson<Booking>(endpoints.bookings.cancel(bookingId))
}

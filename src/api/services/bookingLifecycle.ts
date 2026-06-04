import type { Booking, BookingStatus, CreateBookingRequest, ProblemDetails, UserRole } from '../contracts'

export type BookingAction = 'confirm' | 'cancel'

export interface TimeRange {
  startsAt: string
  endsAt: string
}

export interface BookingConflict {
  roomId: string
  requestedStartsAt: string
  requestedEndsAt: string
  conflictingBookingId: string
  conflictingStartsAt: string
  conflictingEndsAt: string
}

export class BookingLifecycleError extends Error {
  readonly code: 'INVALID_TIME_RANGE' | 'INVALID_TRANSITION' | 'FORBIDDEN' | 'CONFLICT'
  readonly status: number

  constructor(
    code: 'INVALID_TIME_RANGE' | 'INVALID_TRANSITION' | 'FORBIDDEN' | 'CONFLICT',
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'BookingLifecycleError'
    this.code = code
    this.status = status
  }

  toProblemDetails(typeBase = 'https://awt-roombooking.dev/problems'): ProblemDetails {
    return {
      type: `${typeBase}/${this.code.toLowerCase()}`,
      title: this.message,
      status: this.status,
      detail: this.message,
    }
  }
}

function parseDate(value: string): number {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw new BookingLifecycleError('INVALID_TIME_RANGE', `Invalid date-time: ${value}`, 400)
  }
  return timestamp
}

export function assertValidBookingWindow(range: TimeRange): void {
  const start = parseDate(range.startsAt)
  const end = parseDate(range.endsAt)

  if (end <= start) {
    throw new BookingLifecycleError(
      'INVALID_TIME_RANGE',
      'endsAt must be greater than startsAt for booking creation.',
      400,
    )
  }
}

export function assertValidCreateBookingRequest(input: CreateBookingRequest): void {
  assertValidBookingWindow({ startsAt: input.startsAt, endsAt: input.endsAt })
}

export function hasTimeOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = parseDate(a.startsAt)
  const aEnd = parseDate(a.endsAt)
  const bStart = parseDate(b.startsAt)
  const bEnd = parseDate(b.endsAt)

  return aStart < bEnd && bStart < aEnd
}

export function findBookingConflict(
  candidate: Pick<Booking, 'roomId' | 'startsAt' | 'endsAt'>,
  existing: Booking[],
): BookingConflict | null {
  for (const booking of existing) {
    if (booking.roomId !== candidate.roomId) continue
    if (booking.status === 'cancelled') continue

    if (hasTimeOverlap(candidate, booking)) {
      return {
        roomId: candidate.roomId,
        requestedStartsAt: candidate.startsAt,
        requestedEndsAt: candidate.endsAt,
        conflictingBookingId: booking.id,
        conflictingStartsAt: booking.startsAt,
        conflictingEndsAt: booking.endsAt,
      }
    }
  }

  return null
}

export function assertNoBookingConflict(
  candidate: Pick<Booking, 'roomId' | 'startsAt' | 'endsAt'>,
  existing: Booking[],
): void {
  const conflict = findBookingConflict(candidate, existing)
  if (conflict) {
    throw new BookingLifecycleError(
      'CONFLICT',
      `Room ${conflict.roomId} has an overlapping booking (${conflict.conflictingBookingId}).`,
      409,
    )
  }
}

export function canTransitionBookingStatus(status: BookingStatus, action: BookingAction): boolean {
  if (action === 'confirm') return status === 'pending'
  if (action === 'cancel') return status === 'pending' || status === 'confirmed'
  return false
}

export function canConfirmBooking(role: UserRole): boolean {
  return role === 'staff' || role === 'admin'
}

export function canCancelBooking(booking: Booking, actor: { role: UserRole; userId: string }): boolean {
  if (actor.role === 'admin' || actor.role === 'staff') return true
  return booking.userId === actor.userId
}

export function transitionBookingStatus(
  booking: Booking,
  action: BookingAction,
  actor: { role: UserRole; userId: string },
): BookingStatus {
  if (action === 'confirm' && !canConfirmBooking(actor.role)) {
    throw new BookingLifecycleError('FORBIDDEN', 'Only staff or admin can confirm bookings.', 403)
  }

  if (action === 'cancel' && !canCancelBooking(booking, actor)) {
    throw new BookingLifecycleError('FORBIDDEN', 'Booking can only be cancelled by owner, staff, or admin.', 403)
  }

  if (!canTransitionBookingStatus(booking.status, action)) {
    throw new BookingLifecycleError(
      'INVALID_TRANSITION',
      `Cannot ${action} a booking in status ${booking.status}.`,
      409,
    )
  }

  return action === 'confirm' ? 'confirmed' : 'cancelled'
}

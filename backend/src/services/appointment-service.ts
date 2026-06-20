import { AppointmentStatus, Prisma, RoomStatus } from '@prisma/client'
import { z } from 'zod'
import type { AuthenticatedUser } from '../auth/types.js'
import { prisma } from '../db/client.js'
import { badRequest, conflict, forbidden, notFound } from '../lib/api-error.js'
import { publishAppointmentCreated, publishAppointmentUpdated } from '../messaging/publisher.js'
import { publishRealtimeEvent } from '../realtime/event-bus.js'
import { ensureUserFromAuth } from './users-service.js'

export const appointmentStatusSchema = z.nativeEnum(AppointmentStatus)

export const createAppointmentSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  roomId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  participants: z.array(z.string().email()).default([]),
  status: appointmentStatusSchema.optional(),
})

export const updateAppointmentSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  roomId: z.string().min(1).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  participants: z.array(z.string().email()).optional(),
  status: appointmentStatusSchema.optional(),
}).refine(value => Object.keys(value).length > 0, 'At least one field is required for update.')

export const appointmentQuerySchema = z.object({
  roomId: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).default({})

function assertRange(start: Date, end: Date) {
  if (end <= start) {
    throw badRequest('endsAt must be greater than startsAt.')
  }
}

async function ensureRoomExists(roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) throw notFound(`Room ${roomId} not found.`)
  return room
}

function assertRoomReservable(status: RoomStatus) {
  if (status === RoomStatus.MAINTENANCE) {
    throw conflict('Room is blocked for maintenance and cannot be reserved.')
  }
}

async function assertNoConflict(roomId: string, startsAt: Date, endsAt: Date, excludeId?: string) {
  const overlapping = await prisma.appointment.findFirst({
    where: {
      roomId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: AppointmentStatus.CANCELLED },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  })

  if (overlapping) {
    throw conflict(`Time conflict with appointment ${overlapping.id} in room ${roomId}.`)
  }
}

function assertStudentOwnership(actor: AuthenticatedUser, ownerUserId: string) {
  if (actor.role === 'student' && actor.id !== ownerUserId) {
    throw forbidden('Students can access only their own appointments.')
  }
}

function assertCanSetConfirmed(actor: AuthenticatedUser, status?: AppointmentStatus) {
  if (status === AppointmentStatus.CONFIRMED && actor.role === 'student') {
    throw forbidden('Only staff or admin can confirm appointments.')
  }
}

function assertStudentDraftMutation(actor: AuthenticatedUser, currentStatus: AppointmentStatus, nextStatus?: AppointmentStatus) {
  if (actor.role !== 'student') return

  assertCanSetConfirmed(actor, nextStatus)

  if (currentStatus === AppointmentStatus.CONFIRMED && nextStatus !== AppointmentStatus.CANCELLED) {
    throw forbidden('Students can only update draft appointments or cancel confirmed ones.')
  }
}

function buildAppointmentUpdatedEventPayload(item: {
  id: string
  roomId: string
  title: string
  status: AppointmentStatus
  startsAt: Date
  endsAt: Date
}) {
  return {
    appointmentId: item.id,
    roomId: item.roomId,
    title: item.title,
    status: item.status,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
  }
}

export async function listAppointments(query: z.infer<typeof appointmentQuerySchema>, actor: AuthenticatedUser) {
  const overlapWhere: Prisma.AppointmentWhereInput = query.from && query.to
    ? {
        startsAt: { lt: query.to },
        endsAt: { gt: query.from },
      }
    : query.from
      ? { endsAt: { gt: query.from } }
      : query.to
        ? { startsAt: { lt: query.to } }
        : {}

  const where: Prisma.AppointmentWhereInput = {
    roomId: query.roomId,
    status: query.status,
    ownerUserId: actor.role === 'student' ? actor.id : undefined,
    ...overlapWhere,
  }

  return prisma.appointment.findMany({
    where,
    include: { room: true },
    orderBy: { startsAt: 'asc' },
  })
}

export async function getAppointmentById(appointmentId: string, actor: AuthenticatedUser) {
  const item = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { room: true },
  })

  if (!item) throw notFound(`Appointment ${appointmentId} not found.`)
  assertStudentOwnership(actor, item.ownerUserId)
  return item
}

export async function createAppointment(input: z.infer<typeof createAppointmentSchema>, actor: AuthenticatedUser) {
  assertRange(input.startsAt, input.endsAt)
  assertCanSetConfirmed(actor, input.status)
  await ensureUserFromAuth(actor)
  const room = await ensureRoomExists(input.roomId)
  assertRoomReservable(room.status)
  await assertNoConflict(input.roomId, input.startsAt, input.endsAt)

  const created = await prisma.appointment.create({
    data: {
      ownerUserId: actor.id,
      title: input.title,
      description: input.description,
      roomId: input.roomId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      participants: input.participants,
      status: input.status,
    },
    include: { room: true },
  })

  publishRealtimeEvent({
    type: 'appointment.created',
    data: {
      appointmentId: created.id,
      roomId: created.roomId,
      title: created.title,
      status: created.status,
      startsAt: created.startsAt.toISOString(),
      endsAt: created.endsAt.toISOString(),
    },
  })

  await publishAppointmentCreated({
    appointmentId: created.id,
    ownerUserId: created.ownerUserId,
    roomId: created.roomId,
    roomName: created.room.name,
    title: created.title,
    status: created.status,
    startsAt: created.startsAt,
    endsAt: created.endsAt,
  })

  return created
}

export async function updateAppointment(appointmentId: string, input: z.infer<typeof updateAppointmentSchema>, actor: AuthenticatedUser) {
  const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw notFound(`Appointment ${appointmentId} not found.`)
  assertStudentOwnership(actor, existing.ownerUserId)
  assertStudentDraftMutation(actor, existing.status, input.status)

  const roomId = input.roomId ?? existing.roomId
  const startsAt = input.startsAt ?? existing.startsAt
  const endsAt = input.endsAt ?? existing.endsAt

  assertRange(startsAt, endsAt)
  const room = await ensureRoomExists(roomId)
  assertRoomReservable(room.status)

  if (existing.status !== AppointmentStatus.CANCELLED && input.status !== AppointmentStatus.CANCELLED) {
    await assertNoConflict(roomId, startsAt, endsAt, appointmentId)
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      title: input.title,
      description: input.description,
      roomId,
      startsAt,
      endsAt,
      participants: input.participants,
      status: input.status,
    },
    include: { room: true },
  })

  publishRealtimeEvent({
    type: 'appointment.updated',
    data: buildAppointmentUpdatedEventPayload(updated),
  })

  await publishAppointmentUpdated({
    appointmentId: updated.id,
    ownerUserId: updated.ownerUserId,
    roomId: updated.roomId,
    roomName: updated.room.name,
    title: updated.title,
    status: updated.status,
    startsAt: updated.startsAt,
    endsAt: updated.endsAt,
    previousStatus: existing.status,
  })

  return updated
}

export async function deleteAppointment(appointmentId: string, actor: AuthenticatedUser) {
  const item = await getAppointmentById(appointmentId, actor)
  await prisma.appointment.delete({ where: { id: appointmentId } })

  publishRealtimeEvent({
    type: 'appointment.deleted',
    data: {
      appointmentId: item.id,
      roomId: item.roomId,
      title: item.title,
      status: item.status,
      startsAt: item.startsAt.toISOString(),
      endsAt: item.endsAt.toISOString(),
    },
  })
}

export async function confirmAppointment(appointmentId: string, actor: AuthenticatedUser) {
  if (actor.role === 'student') {
    throw forbidden('Only staff or admin can confirm appointments.')
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { room: true },
  })

  if (!existing) throw notFound(`Appointment ${appointmentId} not found.`)

  if (existing.status !== AppointmentStatus.DRAFT) {
    throw conflict('Only draft appointments can be confirmed.')
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CONFIRMED },
    include: { room: true },
  })

  publishRealtimeEvent({
    type: 'appointment.updated',
    data: buildAppointmentUpdatedEventPayload(updated),
  })

  await publishAppointmentUpdated({
    appointmentId: updated.id,
    ownerUserId: updated.ownerUserId,
    roomId: updated.roomId,
    roomName: updated.room.name,
    title: updated.title,
    status: updated.status,
    startsAt: updated.startsAt,
    endsAt: updated.endsAt,
    previousStatus: existing.status,
  })

  return updated
}

export async function cancelAppointment(appointmentId: string, actor: AuthenticatedUser) {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { room: true },
  })

  if (!existing) throw notFound(`Appointment ${appointmentId} not found.`)
  assertStudentOwnership(actor, existing.ownerUserId)

  if (existing.status === AppointmentStatus.CANCELLED) {
    throw conflict('Appointment is already cancelled.')
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELLED },
    include: { room: true },
  })

  publishRealtimeEvent({
    type: 'appointment.updated',
    data: buildAppointmentUpdatedEventPayload(updated),
  })

  await publishAppointmentUpdated({
    appointmentId: updated.id,
    ownerUserId: updated.ownerUserId,
    roomId: updated.roomId,
    roomName: updated.room.name,
    title: updated.title,
    status: updated.status,
    startsAt: updated.startsAt,
    endsAt: updated.endsAt,
    previousStatus: existing.status,
  })

  return updated
}

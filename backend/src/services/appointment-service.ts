import { AppointmentStatus, Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { badRequest, conflict, notFound } from '../lib/api-error.js'

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

export async function listAppointments(query: z.infer<typeof appointmentQuerySchema>) {
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
    ...overlapWhere,
  }

  return prisma.appointment.findMany({
    where,
    include: { room: true },
    orderBy: { startsAt: 'asc' },
  })
}

export async function getAppointmentById(appointmentId: string) {
  const item = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { room: true },
  })

  if (!item) throw notFound(`Appointment ${appointmentId} not found.`)
  return item
}

export async function createAppointment(input: z.infer<typeof createAppointmentSchema>) {
  assertRange(input.startsAt, input.endsAt)
  await ensureRoomExists(input.roomId)
  await assertNoConflict(input.roomId, input.startsAt, input.endsAt)

  return prisma.appointment.create({
    data: {
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
}

export async function updateAppointment(appointmentId: string, input: z.infer<typeof updateAppointmentSchema>) {
  const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw notFound(`Appointment ${appointmentId} not found.`)

  const roomId = input.roomId ?? existing.roomId
  const startsAt = input.startsAt ?? existing.startsAt
  const endsAt = input.endsAt ?? existing.endsAt

  assertRange(startsAt, endsAt)
  await ensureRoomExists(roomId)

  if (existing.status !== AppointmentStatus.CANCELLED && input.status !== AppointmentStatus.CANCELLED) {
    await assertNoConflict(roomId, startsAt, endsAt, appointmentId)
  }

  return prisma.appointment.update({
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
}

export async function deleteAppointment(appointmentId: string) {
  await getAppointmentById(appointmentId)
  await prisma.appointment.delete({ where: { id: appointmentId } })
}

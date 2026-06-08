import { RoomStatus, Prisma } from '@prisma/client'
import { z } from 'zod'
import type { AuthenticatedUser } from '../auth/types.js'
import { prisma } from '../db/client.js'
import { notFound } from '../lib/api-error.js'
import { publishRealtimeEvent } from '../realtime/event-bus.js'

export const roomStatusSchema = z.nativeEnum(RoomStatus)

export const createRoomSchema = z.object({
  name: z.string().min(2).max(120),
  location: z.string().min(2).max(160),
  capacity: z.number().int().positive(),
  equipment: z.array(z.string().min(1)).default([]),
  status: roomStatusSchema.optional(),
})

export const updateRoomSchema = createRoomSchema.partial().refine(
  value => Object.keys(value).length > 0,
  'At least one field is required for update.',
)

export const updateRoomStatusSchema = z.object({
  status: roomStatusSchema,
})

export const roomQuerySchema = z.object({
  location: z.string().optional(),
  status: roomStatusSchema.optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
}).default({})

export async function listRooms(query: z.infer<typeof roomQuerySchema>) {
  const where: Prisma.RoomWhereInput = {
    location: query.location ? { contains: query.location, mode: 'insensitive' } : undefined,
    status: query.status,
    capacity: query.minCapacity ? { gte: query.minCapacity } : undefined,
  }

  return prisma.room.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRoomById(roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) throw notFound(`Room ${roomId} not found.`)
  return room
}

export async function createRoom(input: z.infer<typeof createRoomSchema>) {
  return prisma.room.create({ data: input })
}

export async function updateRoom(roomId: string, input: z.infer<typeof updateRoomSchema>) {
  await getRoomById(roomId)
  return prisma.room.update({
    where: { id: roomId },
    data: input,
  })
}

export async function setRoomStatus(roomId: string, status: RoomStatus, actor: AuthenticatedUser) {
  const current = await getRoomById(roomId)
  const updated = await prisma.room.update({
    where: { id: roomId },
    data: { status },
  })

  if (current.status !== updated.status) {
    publishRealtimeEvent({
      type: 'room.status.changed',
      data: {
        roomId: updated.id,
        previousStatus: current.status,
        status: updated.status,
        name: updated.name,
        location: updated.location,
      },
    })
  }

  return updated
}

export async function deleteRoom(roomId: string) {
  await getRoomById(roomId)
  await prisma.room.delete({ where: { id: roomId } })
}

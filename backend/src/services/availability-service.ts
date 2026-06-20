import { AppointmentStatus, RoomStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { badRequest, notFound } from '../lib/api-error.js'

export const availabilityQuerySchema = z.object({
  roomId: z.string().min(1),
  from: z.coerce.date(),
  to: z.coerce.date(),
})

type SlotState = 'free' | 'occupied' | 'maintenance'

interface AvailabilitySlot {
  startsAt: string
  endsAt: string
  state: SlotState
}

interface AvailabilityWindow {
  roomId: string
  from: string
  to: string
  slots: AvailabilitySlot[]
}

function toIso(value: Date) {
  return value.toISOString()
}

export async function getAvailabilityWindow(query: z.infer<typeof availabilityQuerySchema>): Promise<AvailabilityWindow> {
  if (query.to <= query.from) {
    throw badRequest('to must be greater than from.')
  }

  const room = await prisma.room.findUnique({ where: { id: query.roomId } })
  if (!room) throw notFound(`Room ${query.roomId} not found.`)

  if (room.status === RoomStatus.MAINTENANCE) {
    return {
      roomId: room.id,
      from: toIso(query.from),
      to: toIso(query.to),
      slots: [{
        startsAt: toIso(query.from),
        endsAt: toIso(query.to),
        state: 'maintenance',
      }],
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      roomId: room.id,
      status: { not: AppointmentStatus.CANCELLED },
      startsAt: { lt: query.to },
      endsAt: { gt: query.from },
    },
    orderBy: { startsAt: 'asc' },
  })

  const slots: AvailabilitySlot[] = []
  let cursor = query.from

  for (const item of appointments) {
    const occupiedStart = item.startsAt > query.from ? item.startsAt : query.from
    const occupiedEnd = item.endsAt < query.to ? item.endsAt : query.to

    if (occupiedStart > cursor) {
      slots.push({
        startsAt: toIso(cursor),
        endsAt: toIso(occupiedStart),
        state: 'free',
      })
    }

    if (occupiedEnd > occupiedStart) {
      slots.push({
        startsAt: toIso(occupiedStart),
        endsAt: toIso(occupiedEnd),
        state: 'occupied',
      })
    }

    if (occupiedEnd > cursor) {
      cursor = occupiedEnd
    }
  }

  if (cursor < query.to) {
    slots.push({
      startsAt: toIso(cursor),
      endsAt: toIso(query.to),
      state: 'free',
    })
  }

  return {
    roomId: room.id,
    from: toIso(query.from),
    to: toIso(query.to),
    slots,
  }
}

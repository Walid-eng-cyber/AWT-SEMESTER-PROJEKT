import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { env } from '../config/env.js'
import { prisma } from '../db/client.js'
import { getDomainEventBroker } from '../messaging/broker.js'
import type { DomainEvent } from '../messaging/domain-events.js'
import { createNotification } from '../services/notifications-service.js'

const appointmentEventSchema = z.object({
  appointmentId: z.string().min(1),
  ownerUserId: z.string().min(1),
  roomId: z.string().min(1),
  roomName: z.string().min(1),
  title: z.string().min(1),
  status: z.nativeEnum(AppointmentStatus),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  previousStatus: z.nativeEnum(AppointmentStatus).optional(),
})

function mapAppointmentStatusToNotificationType(status: AppointmentStatus) {
  if (status === AppointmentStatus.CONFIRMED) return 'booking_confirmed' as const
  if (status === AppointmentStatus.CANCELLED) return 'booking_cancelled' as const
  return 'system' as const
}

async function handleAppointmentCreated(event: DomainEvent) {
  const data = appointmentEventSchema.parse(event.data)

  const approvers = await prisma.user.findMany({
    where: {
      role: { in: ['staff', 'admin'] },
      status: 'active',
    },
    select: { id: true },
  })

  const approverIds = approvers
    .map((item) => item.id)
    .filter((id) => id !== data.ownerUserId)

  await createNotification({
    userId: data.ownerUserId,
    type: 'system',
    title: 'Reservation request received',
    message: `Your request for ${data.roomName} is pending review (${data.status}).`,
  })

  await Promise.all(
    approverIds.map((userId) => createNotification({
      userId,
      type: 'system',
      title: 'New reservation request',
      message: `A new request for ${data.roomName} is waiting for review (${data.status}).`,
    })),
  )
}

async function handleAppointmentUpdated(event: DomainEvent) {
  const data = appointmentEventSchema.parse(event.data)

  if (!data.previousStatus || data.previousStatus === data.status) {
    return
  }

  await createNotification({
    userId: data.ownerUserId,
    type: mapAppointmentStatusToNotificationType(data.status),
    title: data.status === AppointmentStatus.CONFIRMED ? 'Reservation confirmed' : data.status === AppointmentStatus.CANCELLED ? 'Reservation cancelled' : 'Reservation status changed',
    message: data.status === AppointmentStatus.CONFIRMED
      ? `${data.title} has been confirmed for ${data.roomName}.`
      : data.status === AppointmentStatus.CANCELLED
        ? `${data.title} has been cancelled.`
        : `${data.title} is now ${data.status}.`,
  })
}

export async function startNotificationsConsumer() {
  const broker = getDomainEventBroker()

  await broker.subscribe({
    queueName: env.RABBITMQ_NOTIFICATIONS_QUEUE,
    routingKeys: ['appointment.created', 'appointment.updated'],
    handler: async (event) => {
      if (event.type === 'appointment.created') {
        await handleAppointmentCreated(event)
        return
      }

      if (event.type === 'appointment.updated') {
        await handleAppointmentUpdated(event)
      }
    },
  })
}

import type { AppointmentStatus } from '@prisma/client'
import { createDomainEvent } from './domain-events.js'
import { getDomainEventBroker } from './broker.js'

type AppointmentPublishPayload = {
  appointmentId: string
  ownerUserId: string
  roomId: string
  roomName: string
  title: string
  status: AppointmentStatus
  startsAt: Date
  endsAt: Date
  previousStatus?: AppointmentStatus
}

export async function publishAppointmentCreated(payload: AppointmentPublishPayload) {
  const broker = getDomainEventBroker()
  await broker.publish(
    createDomainEvent('appointment.created', {
      appointmentId: payload.appointmentId,
      ownerUserId: payload.ownerUserId,
      roomId: payload.roomId,
      roomName: payload.roomName,
      title: payload.title,
      status: payload.status,
      startsAt: payload.startsAt.toISOString(),
      endsAt: payload.endsAt.toISOString(),
      previousStatus: payload.previousStatus,
    }),
  )
}

export async function publishAppointmentUpdated(payload: AppointmentPublishPayload) {
  const broker = getDomainEventBroker()
  await broker.publish(
    createDomainEvent('appointment.updated', {
      appointmentId: payload.appointmentId,
      ownerUserId: payload.ownerUserId,
      roomId: payload.roomId,
      roomName: payload.roomName,
      title: payload.title,
      status: payload.status,
      startsAt: payload.startsAt.toISOString(),
      endsAt: payload.endsAt.toISOString(),
      previousStatus: payload.previousStatus,
    }),
  )
}

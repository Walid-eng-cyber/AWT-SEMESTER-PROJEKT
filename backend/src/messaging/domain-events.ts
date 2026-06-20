import { AppointmentStatus } from '@prisma/client'

export const DOMAIN_EVENT_SCHEMA_VERSION = 1

export type DomainEventType = 'appointment.created' | 'appointment.updated'

export interface AppointmentEventData {
  appointmentId: string
  ownerUserId: string
  roomId: string
  roomName: string
  title: string
  status: AppointmentStatus
  startsAt: string
  endsAt: string
  previousStatus?: AppointmentStatus
}

export interface DomainEvent<TType extends DomainEventType = DomainEventType, TData = AppointmentEventData> {
  id: string
  type: TType
  occurredAt: string
  schemaVersion: number
  data: TData
}

export function createDomainEvent<TType extends DomainEventType, TData>(
  type: TType,
  data: TData,
): DomainEvent<TType, TData> {
  return {
    id: crypto.randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    schemaVersion: DOMAIN_EVENT_SCHEMA_VERSION,
    data,
  }
}

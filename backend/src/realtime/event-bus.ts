type RealtimeEventType =
  | 'room.status.changed'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.deleted'

export const REALTIME_EVENT_VERSION = 1
export const REALTIME_SCHEMA_VERSION = 'v1'

export interface RealtimeEvent<T = Record<string, unknown>> {
  type: RealtimeEventType | 'system.connected'
  occurredAt: string
  eventVersion: number
  schemaVersion: string
  data: T
}

type RealtimeListener = (event: RealtimeEvent) => void
type RealtimePublishInput = Omit<RealtimeEvent, 'occurredAt' | 'eventVersion' | 'schemaVersion'>

const listeners = new Set<RealtimeListener>()

export function publishRealtimeEvent(event: RealtimePublishInput) {
  const enriched: RealtimeEvent = {
    ...event,
    eventVersion: REALTIME_EVENT_VERSION,
    schemaVersion: REALTIME_SCHEMA_VERSION,
    occurredAt: new Date().toISOString(),
  }

  listeners.forEach(listener => listener(enriched))
}

export function subscribeRealtimeEvents(listener: RealtimeListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

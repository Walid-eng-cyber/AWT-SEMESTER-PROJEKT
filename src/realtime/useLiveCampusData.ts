import { useEffect, useMemo, useRef, useState } from 'react'
import { getJson } from '../api/http'

type BackendRoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
type BackendAppointmentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

type RoomEventData = {
  roomId: string
  previousStatus: BackendRoomStatus
  status: BackendRoomStatus
  name: string
  location: string
}

type AppointmentEventData = {
  appointmentId: string
  roomId: string
  title: string
  status: BackendAppointmentStatus
  startsAt: string
  endsAt: string
}

type RealtimeEvent = {
  type: 'system.connected' | 'room.status.changed' | 'appointment.created' | 'appointment.updated' | 'appointment.deleted'
  occurredAt: string
  eventVersion: number
  schemaVersion: string
  data: Record<string, unknown>
}

export interface LiveRoom {
  id: string
  name: string
  location: string
  capacity: number
  equipment: string[]
  status: BackendRoomStatus
}

export interface LiveAppointment {
  id: string
  roomId: string
  title: string
  startsAt: string
  endsAt: string
  status: BackendAppointmentStatus
  roomName?: string
}

export interface LiveActivity {
  id: string
  msg: string
  ago: string
  type: 'success' | 'warning' | 'info'
}

const EVENT_VERSION = 1
const SCHEMA_VERSION = 'v1'

function resolveBackendBaseUrl() {
  const configured = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined
  return configured && configured.length > 0 ? configured : 'http://localhost:4000'
}

function resolveWebSocketUrl(baseUrl: string) {
  const configured = import.meta.env.VITE_BACKEND_WS_URL as string | undefined
  if (configured && configured.length > 0) return configured

  const url = new URL(baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.search = ''
  url.hash = ''
  return url.toString()
}

function formatAgo(timestamp: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  if (seconds < 60) return `${seconds}S AGO`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} MIN AGO`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} HRS AGO`

  const days = Math.floor(hours / 24)
  return `${days} D AGO`
}

function buildActivity(event: RealtimeEvent): LiveActivity {
  switch (event.type) {
    case 'room.status.changed': {
      const data = event.data as unknown as RoomEventData
      return {
        id: `${event.type}-${event.occurredAt}`,
        msg: `Room ${data.name} status changed to ${data.status}.`,
        ago: formatAgo(event.occurredAt),
        type: data.status === 'MAINTENANCE' ? 'warning' : 'success',
      }
    }
    case 'appointment.created': {
      const data = event.data as unknown as AppointmentEventData
      return {
        id: `${event.type}-${event.occurredAt}`,
        msg: `Appointment created: ${data.title}.`,
        ago: formatAgo(event.occurredAt),
        type: 'info',
      }
    }
    case 'appointment.updated': {
      const data = event.data as unknown as AppointmentEventData
      return {
        id: `${event.type}-${event.occurredAt}`,
        msg: `Appointment updated: ${data.title}.`,
        ago: formatAgo(event.occurredAt),
        type: 'info',
      }
    }
    case 'appointment.deleted': {
      const data = event.data as unknown as AppointmentEventData
      return {
        id: `${event.type}-${event.occurredAt}`,
        msg: `Appointment removed: ${data.title}.`,
        ago: formatAgo(event.occurredAt),
        type: 'warning',
      }
    }
    default:
      return {
        id: `${event.type}-${event.occurredAt}`,
        msg: 'Realtime connected.',
        ago: formatAgo(event.occurredAt),
        type: 'info',
      }
  }
}

export function useLiveCampusData() {
  const backendBaseUrl = useMemo(() => resolveBackendBaseUrl(), [])
  const apiBaseUrl = `${backendBaseUrl}/api/v1`
  const webSocketUrl = useMemo(() => resolveWebSocketUrl(backendBaseUrl), [backendBaseUrl])

  const [rooms, setRooms] = useState<LiveRoom[]>([])
  const [appointments, setAppointments] = useState<LiveAppointment[]>([])
  const [activity, setActivity] = useState<LiveActivity[]>([])
  const [connected, setConnected] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [realtimeError, setRealtimeError] = useState<string | null>(null)
  const roomNameByIdRef = useRef<Record<string, string>>({})

  useEffect(() => {
    roomNameByIdRef.current = rooms.reduce<Record<string, string>>((acc, room) => {
      acc[room.id] = room.name
      return acc
    }, {})
  }, [rooms])

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      try {
        const now = new Date()
        const weekAhead = new Date(now)
        weekAhead.setDate(now.getDate() + 7)

        const [roomsData, appointmentsData] = await Promise.all([
          getJson<LiveRoom[]>(`${apiBaseUrl}/rooms`),
          getJson<Array<{
          id: string
          roomId: string
          title: string
          startsAt: string
          endsAt: string
          status: BackendAppointmentStatus
          room?: { name: string }
        }>>(`${apiBaseUrl}/appointments`, {
            from: now.toISOString(),
            to: weekAhead.toISOString(),
          }),
        ])

        if (cancelled) return

        setRooms(roomsData)
        setAppointments(appointmentsData.map(item => ({
          id: item.id,
          roomId: item.roomId,
          title: item.title,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          status: item.status,
          roomName: item.room?.name,
        })))
        setLoadError(null)
      } catch (loadError) {
        if (!cancelled) {
          setLoadError(loadError instanceof Error ? loadError.message : 'Unknown loading error')
        }
      }
    }

    void loadInitial()
    const poll = window.setInterval(() => {
      void loadInitial()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    let disposed = false
    let activeSocket: WebSocket | null = null
    let reconnectTimer: number | null = null

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const scheduleReconnect = () => {
      if (disposed) return
      if (reconnectTimer !== null) return

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        connect()
      }, 2000)
    }

    const connect = () => {
      if (disposed) return

      const socket = new WebSocket(webSocketUrl)
      activeSocket = socket

      socket.onopen = () => {
        setConnected(true)
        setRealtimeError(null)
      }

      socket.onclose = () => {
        setConnected(false)
        scheduleReconnect()
      }

      socket.onerror = () => {
        setRealtimeError('Realtime connection error.')
      }

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data as string) as RealtimeEvent

          if (event.eventVersion !== EVENT_VERSION || event.schemaVersion !== SCHEMA_VERSION) {
            return
          }

          setActivity(prev => [buildActivity(event), ...prev].slice(0, 12))

          if (event.type === 'room.status.changed') {
            const data = event.data as unknown as RoomEventData
            setRooms(prev => prev.map(room => room.id === data.roomId ? { ...room, status: data.status } : room))
            return
          }

          if (event.type === 'appointment.created' || event.type === 'appointment.updated') {
            const data = event.data as unknown as AppointmentEventData
            setAppointments(prev => {
              const roomName = roomNameByIdRef.current[data.roomId]
              const next = {
                id: data.appointmentId,
                roomId: data.roomId,
                title: data.title,
                startsAt: data.startsAt,
                endsAt: data.endsAt,
                status: data.status,
                roomName,
              }
              const withoutCurrent = prev.filter(item => item.id !== next.id)
              return [...withoutCurrent, next].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
            })
            return
          }

          if (event.type === 'appointment.deleted') {
            const data = event.data as unknown as AppointmentEventData
            setAppointments(prev => prev.filter(item => item.id !== data.appointmentId))
          }
        } catch {
          // Ignore malformed realtime payloads.
        }
      }
    }

    connect()

    return () => {
      disposed = true
      clearReconnectTimer()
      activeSocket?.close()
    }
  }, [webSocketUrl])

  const error = realtimeError ?? loadError

  return {
    rooms,
    appointments,
    activity,
    connected,
    error,
  }
}

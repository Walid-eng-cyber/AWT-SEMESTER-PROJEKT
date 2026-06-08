import type { Server as HttpServer } from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import { REALTIME_EVENT_VERSION, REALTIME_SCHEMA_VERSION, subscribeRealtimeEvents } from './event-bus.js'

export function registerWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', socket => {
    socket.send(
      JSON.stringify({
        type: 'system.connected',
        occurredAt: new Date().toISOString(),
        eventVersion: REALTIME_EVENT_VERSION,
        schemaVersion: REALTIME_SCHEMA_VERSION,
        data: { message: 'Realtime channel connected' },
      }),
    )
  })

  const unsubscribe = subscribeRealtimeEvents(event => {
    const payload = JSON.stringify(event)

    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  })

  wss.on('close', unsubscribe)

  return wss
}

import { createServer } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/client.js'
import { registerGraphQL } from './graphql/gateway.js'
import { closeDomainEventBroker, getDomainEventBroker } from './messaging/broker.js'
import { startNotificationsConsumer } from './notifications/consumer.js'
import { registerWebSocketServer } from './realtime/ws-server.js'

async function bootstrap() {
  await prisma.$connect()
  getDomainEventBroker()

  try {
    await startNotificationsConsumer()
  } catch (error) {
    // Keep API online even if the consumer is unavailable (for example RabbitMQ down).
    console.warn('Notifications consumer could not start:', error)
  }

  const app = createApp()
  await registerGraphQL(app)

  const server = createServer(app)
  registerWebSocketServer(server)

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${env.PORT}`)
    console.log(`GraphQL Gateway on http://localhost:${env.PORT}/graphql`)
    console.log(`WebSocket on ws://localhost:${env.PORT}/ws`)
  })
}

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`Shutting down backend (${signal})...`)
  await closeDomainEventBroker()
  await prisma.$disconnect()
  process.exit(0)
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', error)
  process.exit(1)
})

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})

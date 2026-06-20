import { prisma } from '../db/client.js'
import { closeDomainEventBroker } from '../messaging/broker.js'
import { startNotificationsConsumer } from '../notifications/consumer.js'

async function bootstrap() {
  await prisma.$connect()
  await startNotificationsConsumer()

  // eslint-disable-next-line no-console
  console.log('Notifications consumer listening for appointment events...')
}

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`Stopping notifications consumer (${signal})...`)
  await closeDomainEventBroker()
  await prisma.$disconnect()
  process.exit(0)
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start notifications consumer:', error)
  process.exit(1)
})

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})

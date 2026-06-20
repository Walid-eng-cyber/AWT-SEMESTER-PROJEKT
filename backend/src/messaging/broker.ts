import { connect, type Channel, type ChannelModel } from 'amqplib'
import { env } from '../config/env.js'
import type { DomainEvent, DomainEventType } from './domain-events.js'

interface EventConsumer {
  queueName: string
  routingKeys: DomainEventType[]
  handler: (event: DomainEvent) => Promise<void>
}

export interface DomainEventBroker {
  publish(event: DomainEvent): Promise<void>
  subscribe(consumer: EventConsumer): Promise<void>
  close(): Promise<void>
}

type MockConsumer = {
  routingKeys: Set<DomainEventType>
  handler: (event: DomainEvent) => Promise<void>
}

const mockEventStore: DomainEvent[] = []
const mockConsumers = new Map<string, MockConsumer>()

function asyncDelay() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

class MockDomainEventBroker implements DomainEventBroker {
  async publish(event: DomainEvent): Promise<void> {
    mockEventStore.push(event)
    await Promise.all(
      Array.from(mockConsumers.values())
        .filter((consumer) => consumer.routingKeys.has(event.type))
        .map(async (consumer) => {
          await asyncDelay()
          await consumer.handler(event)
        }),
    )
  }

  async subscribe(consumer: EventConsumer): Promise<void> {
    mockConsumers.set(consumer.queueName, {
      routingKeys: new Set(consumer.routingKeys),
      handler: consumer.handler,
    })
  }

  async close(): Promise<void> {
    mockConsumers.clear()
  }
}

class RabbitMqDomainEventBroker implements DomainEventBroker {
  private connection: ChannelModel | null = null
  private channel: Channel | null = null

  private async ensureChannel() {
    if (this.channel) return this.channel

    const connection = await connect(env.RABBITMQ_URL)
    const channel = await connection.createChannel()
    await channel.assertExchange(env.RABBITMQ_EXCHANGE, 'topic', { durable: true })
    await channel.prefetch(env.RABBITMQ_PREFETCH)

    this.connection = connection
    this.channel = channel

    return channel
  }

  async publish(event: DomainEvent): Promise<void> {
    const channel = await this.ensureChannel()
    channel.publish(
      env.RABBITMQ_EXCHANGE,
      event.type,
      Buffer.from(JSON.stringify(event)),
      {
        contentType: 'application/json',
        persistent: true,
        messageId: event.id,
        timestamp: Date.now(),
      },
    )
  }

  async subscribe(consumer: EventConsumer): Promise<void> {
    const channel = await this.ensureChannel()
    await channel.assertQueue(consumer.queueName, { durable: true })

    await Promise.all(
      consumer.routingKeys.map((routingKey) =>
        channel.bindQueue(consumer.queueName, env.RABBITMQ_EXCHANGE, routingKey),
      ),
    )

    await channel.consume(consumer.queueName, async (message) => {
      if (!message) return

      try {
        const parsed = JSON.parse(message.content.toString()) as DomainEvent
        await consumer.handler(parsed)
        channel.ack(message)
      } catch {
        channel.nack(message, false, false)
      }
    })
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close()
      this.channel = null
    }

    if (this.connection) {
      await this.connection.close()
      this.connection = null
    }
  }
}

let brokerSingleton: DomainEventBroker | null = null

function createDomainEventBroker(): DomainEventBroker {
  if (env.MESSAGING_DRIVER === 'mock') {
    return new MockDomainEventBroker()
  }

  return new RabbitMqDomainEventBroker()
}

export function getDomainEventBroker() {
  if (!brokerSingleton) {
    brokerSingleton = createDomainEventBroker()
  }

  return brokerSingleton
}

export async function closeDomainEventBroker() {
  if (!brokerSingleton) return
  await brokerSingleton.close()
  brokerSingleton = null
}

export function getMockPublishedEvents() {
  return [...mockEventStore]
}

export function clearMockPublishedEvents() {
  mockEventStore.length = 0
}

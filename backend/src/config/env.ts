import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const defaultMessagingDriver = process.env.NODE_ENV === 'test' ? 'mock' : 'rabbitmq'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(16),
  HF_API_KEY: z.string().min(10).optional(),
  MESSAGING_DRIVER: z.enum(['rabbitmq', 'mock']).default(defaultMessagingDriver),
  RABBITMQ_URL: z.string().min(1).default('amqp://localhost:5672'),
  RABBITMQ_EXCHANGE: z.string().min(1).default('campus.events'),
  RABBITMQ_NOTIFICATIONS_QUEUE: z.string().min(1).default('notifications.service.queue'),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(20),
})

export const env = envSchema.parse(process.env)

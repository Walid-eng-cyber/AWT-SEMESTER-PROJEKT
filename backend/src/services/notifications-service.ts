import { z } from 'zod'
import { prisma } from '../db/client.js'
import { notFound } from '../lib/api-error.js'

export const notificationTypeSchema = z.enum(['booking_confirmed', 'booking_cancelled', 'reminder', 'system'])

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(800),
})

export const listNotificationsQuerySchema = z.object({
  read: z.coerce.boolean().optional(),
  type: notificationTypeSchema.optional(),
}).default({})

export async function listNotifications(userId: string, query: z.infer<typeof listNotificationsQuerySchema>) {
  return prisma.notification.findMany({
    where: {
      userId,
      read: query.read,
      type: query.type,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  })

  if (!existing) throw notFound(`Notification ${notificationId} not found.`)

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

export async function createNotification(input: z.infer<typeof createNotificationSchema>) {
  const payload = createNotificationSchema.parse(input)
  return prisma.notification.create({ data: payload })
}

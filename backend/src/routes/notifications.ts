import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler.js'
import {
  listNotifications,
  listNotificationsQuerySchema,
  markNotificationRead,
} from '../services/notifications-service.js'

export const notificationsRouter = Router()

notificationsRouter.get('/notifications', asyncHandler(async (req, res) => {
  const query = listNotificationsQuerySchema.parse(req.query)
  const data = await listNotifications(req.auth!.id, query)
  res.status(200).json(data)
}))

notificationsRouter.post('/notifications/:id/read', asyncHandler(async (req, res) => {
  const updated = await markNotificationRead(req.auth!.id, req.params.id)
  res.status(200).json(updated)
}))

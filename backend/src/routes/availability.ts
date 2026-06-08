import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler.js'
import { availabilityQuerySchema, getAvailabilityWindow } from '../services/availability-service.js'

export const availabilityRouter = Router()

availabilityRouter.get('/availability', asyncHandler(async (req, res) => {
  const query = availabilityQuerySchema.parse(req.query)
  const data = await getAvailabilityWindow(query)
  res.status(200).json(data)
}))

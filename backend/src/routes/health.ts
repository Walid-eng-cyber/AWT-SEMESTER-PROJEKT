import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'awt-roombooking-backend' })
})

import { Router } from 'express'
import { appointmentsRouter } from './appointments.js'
import { healthRouter } from './health.js'
import { roomsRouter } from './rooms.js'

export const apiRouter = Router()

apiRouter.use(healthRouter)
apiRouter.use(roomsRouter)
apiRouter.use(appointmentsRouter)

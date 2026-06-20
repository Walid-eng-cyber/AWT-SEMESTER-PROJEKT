import { Router } from 'express'
import { assistantRouter } from './assistant.js'
import { requireAuth } from '../middleware/auth.js'
import { availabilityRouter } from './availability.js'
import { appointmentsRouter } from './appointments.js'
import { authRouter } from './auth.js'
import { healthRouter } from './health.js'
import { notificationsRouter } from './notifications.js'
import { roomsRouter } from './rooms.js'
import { usersRouter } from './users.js'

export const apiRouter = Router()

apiRouter.use(healthRouter)
apiRouter.use(authRouter)
apiRouter.use(assistantRouter)
apiRouter.use(requireAuth)
apiRouter.use(usersRouter)
apiRouter.use(roomsRouter)
apiRouter.use(appointmentsRouter)
apiRouter.use(availabilityRouter)
apiRouter.use(notificationsRouter)

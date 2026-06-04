import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler.js'
import {
  appointmentQuerySchema,
  createAppointment,
  createAppointmentSchema,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment,
  updateAppointmentSchema,
} from '../services/appointment-service.js'

export const appointmentsRouter = Router()

appointmentsRouter.get('/appointments', asyncHandler(async (req, res) => {
  const query = appointmentQuerySchema.parse(req.query)
  const data = await listAppointments(query)
  res.status(200).json(data)
}))

appointmentsRouter.get('/appointments/:id', asyncHandler(async (req, res) => {
  const item = await getAppointmentById(req.params.id)
  res.status(200).json(item)
}))

appointmentsRouter.post('/appointments', asyncHandler(async (req, res) => {
  const payload = createAppointmentSchema.parse(req.body)
  const created = await createAppointment(payload)
  res.status(201).json(created)
}))

appointmentsRouter.patch('/appointments/:id', asyncHandler(async (req, res) => {
  const payload = updateAppointmentSchema.parse(req.body)
  const updated = await updateAppointment(req.params.id, payload)
  res.status(200).json(updated)
}))

appointmentsRouter.delete('/appointments/:id', asyncHandler(async (req, res) => {
  await deleteAppointment(req.params.id)
  res.status(204).send()
}))

import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler.js'
import { requireRole } from '../middleware/auth.js'
import {
  appointmentQuerySchema,
  cancelAppointment,
  confirmAppointment,
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
  const data = await listAppointments(query, req.auth!)
  res.status(200).json(data)
}))

appointmentsRouter.get('/appointments/:id', asyncHandler(async (req, res) => {
  const item = await getAppointmentById(req.params.id, req.auth!)
  res.status(200).json(item)
}))

appointmentsRouter.post('/appointments', requireRole('student', 'staff', 'admin'), asyncHandler(async (req, res) => {
  const payload = createAppointmentSchema.parse(req.body)
  const created = await createAppointment(payload, req.auth!)
  res.status(201).json(created)
}))

appointmentsRouter.patch('/appointments/:id', requireRole('student', 'staff', 'admin'), asyncHandler(async (req, res) => {
  const payload = updateAppointmentSchema.parse(req.body)
  const updated = await updateAppointment(req.params.id, payload, req.auth!)
  res.status(200).json(updated)
}))

appointmentsRouter.delete('/appointments/:id', requireRole('student', 'staff', 'admin'), asyncHandler(async (req, res) => {
  await deleteAppointment(req.params.id, req.auth!)
  res.status(204).send()
}))

appointmentsRouter.post('/appointments/:id/confirm', requireRole('staff', 'admin'), asyncHandler(async (req, res) => {
  const updated = await confirmAppointment(req.params.id, req.auth!)
  res.status(200).json(updated)
}))

appointmentsRouter.post('/appointments/:id/cancel', requireRole('student', 'staff', 'admin'), asyncHandler(async (req, res) => {
  const updated = await cancelAppointment(req.params.id, req.auth!)
  res.status(200).json(updated)
}))

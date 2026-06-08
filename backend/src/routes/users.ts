import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler.js'
import { requireRole } from '../middleware/auth.js'
import {
  adminUserUpdateSchema,
  getMyProfile,
  getUserById,
  listUsers,
  updateMeSchema,
  updateMyProfile,
  updateUserById,
} from '../services/users-service.js'

export const usersRouter = Router()

usersRouter.get('/users/me', asyncHandler(async (req, res) => {
  const profile = await getMyProfile(req.auth!)
  res.status(200).json(profile)
}))

usersRouter.patch('/users/me', asyncHandler(async (req, res) => {
  const payload = updateMeSchema.parse(req.body)
  const updated = await updateMyProfile(req.auth!, payload)
  res.status(200).json(updated)
}))

usersRouter.get('/users', requireRole('admin'), asyncHandler(async (_req, res) => {
  await getMyProfile(_req.auth!)
  const data = await listUsers()
  res.status(200).json(data)
}))

usersRouter.get('/users/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const item = await getUserById(req.params.id)
  res.status(200).json(item)
}))

usersRouter.patch('/users/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const payload = adminUserUpdateSchema.parse(req.body)
  const updated = await updateUserById(req.params.id, payload)
  res.status(200).json(updated)
}))

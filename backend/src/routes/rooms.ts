import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler.js'
import {
  createRoom,
  createRoomSchema,
  deleteRoom,
  getRoomById,
  listRooms,
  roomQuerySchema,
  setRoomStatus,
  updateRoom,
  updateRoomSchema,
  updateRoomStatusSchema,
} from '../services/room-service.js'

export const roomsRouter = Router()

roomsRouter.get('/rooms', asyncHandler(async (req, res) => {
  const query = roomQuerySchema.parse(req.query)
  const data = await listRooms(query)
  res.status(200).json(data)
}))

roomsRouter.get('/rooms/:id', asyncHandler(async (req, res) => {
  const room = await getRoomById(req.params.id)
  res.status(200).json(room)
}))

roomsRouter.post('/rooms', asyncHandler(async (req, res) => {
  const payload = createRoomSchema.parse(req.body)
  const created = await createRoom(payload)
  res.status(201).json(created)
}))

roomsRouter.patch('/rooms/:id', asyncHandler(async (req, res) => {
  const payload = updateRoomSchema.parse(req.body)
  const updated = await updateRoom(req.params.id, payload)
  res.status(200).json(updated)
}))

roomsRouter.patch('/rooms/:id/status', asyncHandler(async (req, res) => {
  const payload = updateRoomStatusSchema.parse(req.body)
  const updated = await setRoomStatus(req.params.id, payload.status)
  res.status(200).json(updated)
}))

roomsRouter.delete('/rooms/:id', asyncHandler(async (req, res) => {
  await deleteRoom(req.params.id)
  res.status(204).send()
}))

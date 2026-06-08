import { createServer, type Server } from 'node:http'
import { AddressInfo } from 'node:net'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { createApp } from '../../src/app.js'
import { prisma } from '../../src/db/client.js'
import { registerWebSocketServer } from '../../src/realtime/ws-server.js'

type Role = 'student' | 'staff' | 'admin'

type AuthResult = {
  token: string
  userId: string
  email: string
}

async function resetDatabase() {
  await prisma.notification.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.room.deleteMany()
  await prisma.user.deleteMany({ where: { id: { not: 'legacy-user' } } })
}

async function login(baseRequest: request.SuperTest<request.Test>, role: Role, tag: string): Promise<AuthResult> {
  const userId = `${role}-${tag}`
  const email = `${userId}@hs-mainz.de`

  const response = await baseRequest
    .post('/api/v1/auth/login')
    .send({ userId, email, role })
    .expect(200)

  return {
    token: response.body.accessToken,
    userId,
    email,
  }
}

async function createRoom(baseRequest: request.SuperTest<request.Test>, adminToken: string, tag: string) {
  const response = await baseRequest
    .post('/api/v1/rooms')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Integration Room ${tag}`,
      location: 'Main Campus',
      capacity: 10,
      status: 'AVAILABLE',
    })
    .expect(201)

  return response.body as { id: string }
}

async function createAppointment(
  baseRequest: request.SuperTest<request.Test>,
  token: string,
  roomId: string,
  tag: string,
) {
  const response = await baseRequest
    .post('/api/v1/appointments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      roomId,
      title: `Integration Appointment ${tag}`,
      startsAt: '2030-01-01T10:00:00.000Z',
      endsAt: '2030-01-01T11:00:00.000Z',
    })
    .expect(201)

  return response.body as { id: string }
}

describe('API integration: RBAC, lifecycle, ownership', () => {
  const app = createApp()
  const api = request(app)

  beforeAll(async () => {
    await prisma.$connect()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  afterAll(async () => {
    await resetDatabase()
    await prisma.$disconnect()
  })

  it('rejects student confirmation via RBAC guard', async () => {
    const suffix = Date.now().toString()
    const admin = await login(api, 'admin', `admin-${suffix}`)
    const student = await login(api, 'student', `student-${suffix}`)
    const room = await createRoom(api, admin.token, suffix)
    const appointment = await createAppointment(api, student.token, room.id, suffix)

    await api
      .post(`/api/v1/appointments/${appointment.id}/confirm`)
      .set('Authorization', `Bearer ${student.token}`)
      .expect(403)
  })

  it('enforces appointment lifecycle transitions', async () => {
    const suffix = (Date.now() + 1).toString()
    const admin = await login(api, 'admin', `admin-${suffix}`)
    const staff = await login(api, 'staff', `staff-${suffix}`)
    const student = await login(api, 'student', `student-${suffix}`)

    const room = await createRoom(api, admin.token, suffix)
    const appointment = await createAppointment(api, student.token, room.id, suffix)

    const confirmed = await api
      .post(`/api/v1/appointments/${appointment.id}/confirm`)
      .set('Authorization', `Bearer ${staff.token}`)
      .expect(200)

    expect(confirmed.body.status).toBe('CONFIRMED')

    await api
      .post(`/api/v1/appointments/${appointment.id}/confirm`)
      .set('Authorization', `Bearer ${staff.token}`)
      .expect(409)
  })

  it('enforces appointment ownership for students', async () => {
    const suffix = (Date.now() + 2).toString()
    const admin = await login(api, 'admin', `admin-${suffix}`)
    const studentA = await login(api, 'student', `student-a-${suffix}`)
    const studentB = await login(api, 'student', `student-b-${suffix}`)

    const room = await createRoom(api, admin.token, suffix)
    const appointment = await createAppointment(api, studentA.token, room.id, suffix)

    await api
      .patch(`/api/v1/appointments/${appointment.id}`)
      .set('Authorization', `Bearer ${studentB.token}`)
      .send({ title: 'Unauthorized edit attempt' })
      .expect(403)
  })
})

describe('Realtime integration', () => {
  let server: Server
  let api: request.SuperTest<request.Test>
  let wsBaseUrl = ''

  beforeAll(async () => {
    await prisma.$connect()
    const app = createApp()
    server = createServer(app)
    registerWebSocketServer(server)

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve())
    })

    const address = server.address() as AddressInfo
    wsBaseUrl = `ws://127.0.0.1:${address.port}`
    api = request(server)
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  afterAll(async () => {
    await resetDatabase()
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
    await prisma.$disconnect()
  })

  it('broadcasts appointment.created events to websocket clients', async () => {
    const suffix = (Date.now() + 3).toString()
    const admin = await login(api, 'admin', `admin-${suffix}`)
    const student = await login(api, 'student', `student-${suffix}`)
    const room = await createRoom(api, admin.token, suffix)

    const ws = new WebSocket(`${wsBaseUrl}/ws`)

    const eventPromise = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('Timed out waiting for appointment.created realtime event.'))
      }, 8000)

      ws.on('message', (raw) => {
        const payload = JSON.parse(raw.toString()) as { type: string }
        if (payload.type === 'appointment.created') {
          clearTimeout(timeout)
          ws.close()
          resolve(payload as Record<string, unknown>)
        }
      })

      ws.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve())
      ws.on('error', reject)
    })

    const created = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        roomId: room.id,
        title: `Realtime Appointment ${suffix}`,
        startsAt: '2030-01-01T12:00:00.000Z',
        endsAt: '2030-01-01T13:00:00.000Z',
      })
      .expect(201)

    const wsEvent = await eventPromise

    expect(wsEvent.type).toBe('appointment.created')
    expect((wsEvent.data as { appointmentId: string }).appointmentId).toBe(created.body.id)
  })
})

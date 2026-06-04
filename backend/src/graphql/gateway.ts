import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import type { Express } from 'express'
import { GraphQLError } from 'graphql'
import { env } from '../config/env.js'

type Room = {
  id: string
  name: string
  location: string
  capacity: number
  equipment: string[]
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  createdAt: string
  updatedAt: string
}

type Appointment = {
  id: string
  title: string
  description?: string | null
  roomId: string
  startsAt: string
  endsAt: string
  participants: string[]
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

const typeDefs = `#graphql
  type Room {
    id: ID!
    name: String!
    location: String!
    capacity: Int!
    equipment: [String!]!
    status: String!
    createdAt: String!
    updatedAt: String!
    appointments(from: String, to: String): [Appointment!]!
    nextAppointments(limit: Int = 1): [Appointment!]!
  }

  type Appointment {
    id: ID!
    title: String!
    description: String
    roomId: ID!
    startsAt: String!
    endsAt: String!
    participants: [String!]!
    status: String!
    createdAt: String!
    updatedAt: String!
    room: Room!
  }

  type RoomWithAppointments {
    room: Room!
    nextAppointments: [Appointment!]!
  }

  input CreateRoomInput {
    name: String!
    location: String!
    capacity: Int!
    equipment: [String!] = []
    status: String
  }

  input CreateAppointmentInput {
    title: String!
    description: String
    roomId: ID!
    startsAt: String!
    endsAt: String!
    participants: [String!] = []
    status: String
  }

  type Query {
    rooms(location: String, status: String, minCapacity: Int): [Room!]!
    room(id: ID!): Room!
    appointments(roomId: ID, status: String, from: String, to: String): [Appointment!]!
    appointment(id: ID!): Appointment!
    roomsWithNextAppointments(limitPerRoom: Int = 1): [RoomWithAppointments!]!
    appointmentsByRoom(roomId: ID!): [Appointment!]!
    freeRooms(from: String!, to: String!, minCapacity: Int): [Room!]!
  }

  type Mutation {
    createRoom(input: CreateRoomInput!): Room!
    createAppointment(input: CreateAppointmentInput!): Appointment!
  }
`

function baseUrl() {
  return `http://localhost:${env.PORT}/api/v1`
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${baseUrl()}${path}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url
}

async function restGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const response = await fetch(buildUrl(path, query), { method: 'GET' })
  if (!response.ok) {
    const errorBody = await response.text()
    throw new GraphQLError(`REST GET ${path} failed: ${errorBody}`, {
      extensions: { code: 'REST_GET_FAILED', status: response.status },
    })
  }
  return (await response.json()) as T
}

async function restPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new GraphQLError(`REST POST ${path} failed: ${errorBody}`, {
      extensions: { code: 'REST_POST_FAILED', status: response.status },
    })
  }

  return (await response.json()) as T
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd)
}

const resolvers = {
  Query: {
    rooms: async (_: unknown, args: { location?: string; status?: string; minCapacity?: number }) =>
      restGet<Room[]>('/rooms', {
        location: args.location,
        status: args.status,
        minCapacity: args.minCapacity,
      }),

    room: async (_: unknown, args: { id: string }) => restGet<Room>(`/rooms/${args.id}`),

    appointments: async (_: unknown, args: { roomId?: string; status?: string; from?: string; to?: string }) =>
      restGet<Appointment[]>('/appointments', {
        roomId: args.roomId,
        status: args.status,
        from: args.from,
        to: args.to,
      }),

    appointment: async (_: unknown, args: { id: string }) => restGet<Appointment>(`/appointments/${args.id}`),

    appointmentsByRoom: async (_: unknown, args: { roomId: string }) =>
      restGet<Appointment[]>('/appointments', { roomId: args.roomId }),

    roomsWithNextAppointments: async (_: unknown, args: { limitPerRoom?: number }) => {
      const rooms = await restGet<Room[]>('/rooms')
      const limit = args.limitPerRoom ?? 1

      const mapped = await Promise.all(
        rooms.map(async room => {
          const appointments = await restGet<Appointment[]>('/appointments', { roomId: room.id })
          const nextAppointments = appointments
            .filter(a => a.status !== 'CANCELLED' && new Date(a.startsAt) >= new Date())
            .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
            .slice(0, limit)

          return { room, nextAppointments }
        }),
      )

      return mapped
    },

    freeRooms: async (_: unknown, args: { from: string; to: string; minCapacity?: number }) => {
      const rooms = await restGet<Room[]>('/rooms', { minCapacity: args.minCapacity })
      const appointments = await restGet<Appointment[]>('/appointments', { from: args.from, to: args.to })

      return rooms.filter(room => {
        if (room.status !== 'AVAILABLE') return false

        const hasConflict = appointments.some(
          app =>
            app.roomId === room.id &&
            app.status !== 'CANCELLED' &&
            overlaps(app.startsAt, app.endsAt, args.from, args.to),
        )

        return !hasConflict
      })
    },
  },

  Mutation: {
    createRoom: async (_: unknown, args: { input: unknown }) => restPost<Room>('/rooms', args.input),
    createAppointment: async (_: unknown, args: { input: unknown }) =>
      restPost<Appointment>('/appointments', args.input),
  },

  Room: {
    appointments: async (room: Room, args: { from?: string; to?: string }) =>
      restGet<Appointment[]>('/appointments', {
        roomId: room.id,
        from: args.from,
        to: args.to,
      }),

    nextAppointments: async (room: Room, args: { limit?: number }) => {
      const limit = args.limit ?? 1
      const appointments = await restGet<Appointment[]>('/appointments', { roomId: room.id })

      return appointments
        .filter(a => a.status !== 'CANCELLED' && new Date(a.startsAt) >= new Date())
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
        .slice(0, limit)
    },
  },

  Appointment: {
    room: async (appointment: Appointment) => restGet<Room>(`/rooms/${appointment.roomId}`),
  },
}

export async function registerGraphQL(app: Express) {
  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start()

  app.use('/graphql', expressMiddleware(server))
}

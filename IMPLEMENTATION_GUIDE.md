# Campus Interaction Platform - Implementation Guide

## 1. Current Project Status

### ✅ Completed Components
- **Frontend (SPA)**: React + TypeScript + Vite + Tailwind CSS setup
- **Pages Structure**: Dashboard, LandingPage, MyBookings, RoomDetails, RoomSearch, SignIn, SignUp
- **Components**: Navbar, Sidebar, Footer, MobileBottomNav
- **Build Configuration**: Tailwind CSS, PostCSS, TypeScript

### ❌ Missing Components (Priority Order)
1. **Backend Services** (REST APIs)
   - Room Service (`/api/rooms`)
   - Appointment Service (`/api/appointments`)
   
2. **GraphQL Gateway**
   - Apollo Server for aggregating REST services
   - Schema definition
   - Resolvers
   
3. **WebSocket Server**
   - Real-time room status updates
   - Appointment change notifications
   
4. **Messaging System**
   - RabbitMQ or Kafka setup
   - Event publishers/subscribers
   - Notifications Service
   
5. **Database**
   - PostgreSQL schema design
   - ORM (Prisma, TypeORM, or similar)
   
6. **Testing**
   - Unit tests
   - Integration tests
   - End-to-end tests
   
7. **Documentation**
   - Architecture Decision Records (ADRs)
   - API documentation (OpenAPI/Swagger)
   - Deployment guide
   - Architecture diagrams

---

## 2. Architecture Decision: Monolith vs Microservices

### 🎯 Recommended: Modular Monolith Architecture

**Why?**
- Simpler deployment and operation for a semester project
- Easier debugging and development
- Can evolve to microservices later if needed
- All services in one codebase initially, but designed to be extractable

**Structure:**
```
backend/
├── src/
│   ├── services/
│   │   ├── room/          # Room Service (can be extracted to microservice)
│   │   ├── appointment/   # Appointment Service (can be extracted to microservice)
│   │   ├── notifications/ # Notifications Service
│   │   └── shared/        # Shared utilities
│   ├── graphql/           # GraphQL Gateway
│   ├── websocket/         # WebSocket Server
│   ├── messaging/         # Message Broker Integration
│   ├── database/          # Prisma/ORM
│   └── main.ts            # Entry point
├── docker-compose.yml     # PostgreSQL, RabbitMQ
├── tests/                 # Integration/E2E tests
└── package.json
```

---

## 3. Technology Stack & How Each Works

### 3.1 Backend: Express.js + TypeScript

**What is it?**
- Express: Lightweight Node.js web framework for building REST APIs
- TypeScript: Adds type safety to JavaScript

**How it works:**
```
Client Request 
  ↓
Express Router 
  ↓
Controller/Handler 
  ↓
Service Layer (business logic)
  ↓
ORM (database queries)
  ↓
PostgreSQL Database
  ↓
Response back to Client
```

**Why use it?**
- Fast and minimal overhead
- Large ecosystem
- Easy to test
- TypeScript prevents bugs

---

### 3.2 PostgreSQL Database

**What is it?**
- Relational database for storing structured data
- ACID compliance ensures data consistency

**Core Tables:**
```sql
-- Users (simplified for this project)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role ENUM('student', 'staff'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  capacity INT,
  equipment TEXT[], -- e.g., ["projector", "whiteboard"]
  status ENUM('available', 'occupied') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments/Bookings
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  room_id UUID NOT NULL REFERENCES rooms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  participants TEXT[], -- JSON array of participant IDs
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_overlapping_bookings UNIQUE(room_id, start_time, end_time)
);
```

**Why PostgreSQL?**
- ACID compliance prevents double-bookings
- Supports complex queries
- Scales well
- Free and open-source

---

### 3.3 ORM: Prisma

**What is it?**
- Object-Relational Mapping tool
- Bridges JavaScript and SQL database
- Type-safe database queries

**How it works:**
```typescript
// Define schema in prisma/schema.prisma
model Room {
  id        String   @id @default(uuid())
  name      String
  location  String
  capacity  Int
  appointments Appointment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Use in code
const rooms = await prisma.room.findMany();
const room = await prisma.room.create({
  data: { name: "Lecture Hall A", capacity: 50 }
});
```

**Benefits:**
- No SQL strings in your code
- Type safety
- Auto-migrations
- Built-in relationships

---

### 3.4 GraphQL with Apollo Server

**What is it?**
- Query language for APIs (alternative to REST)
- Strongly typed schema
- Clients request exactly what they need

**How it works:**
```typescript
// Define schema
const typeDefs = `
  type Room {
    id: ID!
    name: String!
    capacity: Int!
    appointments: [Appointment!]!
  }

  type Appointment {
    id: ID!
    title: String!
    room: Room!
    startTime: DateTime!
    endTime: DateTime!
  }

  type Query {
    rooms: [Room!]!
    room(id: ID!): Room
    appointmentsByRoom(roomId: ID!): [Appointment!]!
  }

  type Mutation {
    createAppointment(input: CreateAppointmentInput!): Appointment!
  }
`;

// Define resolvers (how to fetch data)
const resolvers = {
  Query: {
    rooms: async () => await prisma.room.findMany(),
    room: async (_, { id }) => await prisma.room.findUnique({ where: { id } })
  },
  Mutation: {
    createAppointment: async (_, { input }) => {
      return await prisma.appointment.create({ data: input });
    }
  }
};
```

**REST vs GraphQL Comparison:**
- **REST**: Fixed data shape, multiple endpoints, might overfetch/underfetch
- **GraphQL**: Flexible queries, single endpoint, get exactly what you ask for

**Example:**
```graphql
# GraphQL - Get only what you need
query {
  room(id: "123") {
    name
    appointments {
      title
      startTime
    }
  }
}

# REST - Get full room with all appointments
GET /api/rooms/123
```

---

### 3.5 WebSocket Communication

**What is it?**
- Real-time bidirectional communication
- Persistent connection between client and server
- Used for live updates without polling

**How it works:**
```
Client ←→ Server (persistent connection)
         ↓
    Server broadcasts updates to all connected clients
         ↓
    Client UI updates instantly (no page refresh needed)
```

**Use cases in this project:**
1. Room status changes (available → occupied)
2. New appointments created
3. Appointment cancellations
4. Live participant count

**Example Flow:**
```
User A books Room X
  ↓
REST API: POST /api/appointments
  ↓
Database: Insert new appointment
  ↓
Room status: available → occupied
  ↓
WebSocket broadcast: { "roomId": "X", "status": "occupied" }
  ↓
User B's browser gets instant update (no page refresh)
```

**Implementation with Socket.IO:**
```typescript
// Server
io.on('connection', (socket) => {
  socket.on('room_update', (data) => {
    io.emit('room_status_changed', data); // Broadcast to all clients
  });
});

// Client (React)
useEffect(() => {
  socket.on('room_status_changed', (data) => {
    setRooms(rooms => rooms.map(r => 
      r.id === data.roomId ? { ...r, status: data.status } : r
    ));
  });
}, []);
```

---

### 3.6 Message Brokers: RabbitMQ vs Kafka

#### **RabbitMQ** (Recommended for this project)

**What is it?**
- Message queue system
- Decouples services (sender doesn't wait for receiver)
- Guarantees message delivery

**How it works:**
```
Event Producer (Backend) 
  ↓
Message Queue in RabbitMQ
  ↓
Event Consumer (Notifications Service)
  ↓
Action (send email, etc.)
```

**Example workflow:**
```
1. User creates appointment
   → REST API receives request
   → Database updated
   → Publish "appointment.created" event to RabbitMQ
   → Return response immediately (don't wait for email)

2. Notifications Service (separate process)
   → Listens to "appointment.created" queue
   → Consumes event
   → Sends email to user
   → Sends reminder notifications
```

**RabbitMQ Concepts:**
- **Producer**: Sends messages (e.g., appointment service)
- **Queue**: Holds messages waiting for consumption
- **Consumer**: Reads and processes messages (e.g., notifications service)
- **Exchange**: Routes messages to queues based on rules
- **Binding**: Connects exchange to queue

**Message Types in this project:**
```typescript
// When appointment is created
{
  "type": "appointment.created",
  "data": {
    "appointmentId": "123",
    "roomId": "456",
    "title": "Team Meeting",
    "userId": "789",
    "startTime": "2024-01-15T10:00:00Z"
  }
}

// When room becomes occupied
{
  "type": "room.status_changed",
  "data": {
    "roomId": "456",
    "oldStatus": "available",
    "newStatus": "occupied"
  }
}
```

#### **Why RabbitMQ over Kafka for this project?**
- Simpler setup and configuration
- Easier to learn
- Perfect for notifications use case
- Better for request-reply patterns (if needed)

#### **Why Kafka (if you want complexity):**
- Event streaming for multiple consumers
- Event replay capability
- Better for audit logs
- Higher throughput
- Better for event-sourcing architecture

**For this semester project: Use RabbitMQ** ✅

---

### 3.7 Frontend: React + Apollo Client

**What is it?**
- Apollo Client: GraphQL client for React
- Manages server state, caching, subscriptions

**How it works with GraphQL Subscriptions:**
```typescript
// Server: GraphQL subscription endpoint
const typeDefs = `
  type Subscription {
    roomStatusChanged(roomId: ID!): RoomStatus!
    appointmentCreated: Appointment!
  }
`;

// Client: Listen for real-time updates
import { useSubscription, gql } from '@apollo/client';

const ROOM_STATUS_SUBSCRIPTION = gql`
  subscription OnRoomStatusChanged($roomId: ID!) {
    roomStatusChanged(roomId: $roomId) {
      id
      status
      updatedAt
    }
  }
`;

export function RoomLiveStatus({ roomId }) {
  const { data, loading } = useSubscription(ROOM_STATUS_SUBSCRIPTION, {
    variables: { roomId }
  });

  if (loading) return <p>Loading...</p>;
  
  return <p>Room is {data.roomStatusChanged.status}</p>;
}
```

---

## 4. Step-by-Step Implementation Roadmap

### 🔴 Phase 1: Set Up Backend Infrastructure (Week 1-2)

#### Step 1.1: Initialize Backend Project
```bash
mkdir backend
cd backend
npm init -y
npm install express typescript ts-node @types/express @types/node
npm install prisma @prisma/client
npm install -D @types/node tsx
```

#### Step 1.2: Set Up PostgreSQL
```bash
# Create docker-compose.yml
```

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: campus_user
      POSTGRES_PASSWORD: campus_password
      POSTGRES_DB: campus_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

#### Step 1.3: Configure Prisma
```bash
cd backend
npx prisma init
# Edit .env with database URL
# DATABASE_URL="postgresql://campus_user:campus_password@localhost:5432/campus_db"

# Create prisma/schema.prisma with models
```

#### Step 1.4: Express Server Setup
```typescript
// backend/src/main.ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Routes will be added here

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
```

---

### 🟡 Phase 2: Implement REST Services (Week 2-3)

#### Step 2.1: Create Room Service Endpoints

```typescript
// backend/src/services/room/controller.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/rooms - List all rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { appointments: true }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/rooms - Create new room
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, location, capacity, equipment } = req.body;
    
    // Validation
    if (!name || !capacity) {
      return res.status(400).json({ error: 'Name and capacity required' });
    }
    
    const room = await prisma.room.create({
      data: {
        name,
        location,
        capacity,
        equipment: equipment || [],
        status: 'available'
      }
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:id - Get specific room
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { appointments: true }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// PATCH /api/rooms/:id - Update room
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, location, capacity, equipment, status } = req.body;
    
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(capacity && { capacity }),
        ...(equipment && { equipment }),
        ...(status && { status })
      }
    });
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.room.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
```

#### Step 2.2: Create Appointment Service Endpoints

```typescript
// backend/src/services/appointment/controller.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Helper: Check room availability
async function isRoomAvailable(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      roomId,
      status: { not: 'cancelled' },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } }
      ]
    }
  });
  
  return !conflict;
}

// GET /api/appointments - List all appointments
router.get('/', async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { room: true }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments - Create new appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, roomId, userId, startTime, endTime, participants } = req.body;
    
    // Validation
    if (!title || !roomId || !userId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }
    
    // Check room availability
    const available = await isRoomAvailable(roomId, start, end);
    if (!available) {
      return res.status(409).json({ error: 'Room is not available at this time' });
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        roomId,
        userId,
        startTime: start,
        endTime: end,
        participants: participants || [],
        status: 'confirmed'
      },
      include: { room: true }
    });
    
    // TODO: Publish to RabbitMQ
    // await publishEvent('appointment.created', appointment);
    
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { room: true }
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { title, startTime, endTime, status } = req.body;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id }
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // If changing time, check availability
    if (startTime || endTime) {
      const start = new Date(startTime || appointment.startTime);
      const end = new Date(endTime || appointment.endTime);
      const available = await isRoomAvailable(
        appointment.roomId,
        start,
        end,
        appointment.id
      );
      
      if (!available) {
        return res.status(409).json({ error: 'Room is not available at this time' });
      }
    }
    
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status })
      },
      include: { room: true }
    });
    
    // TODO: Publish to RabbitMQ
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.appointment.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;
```

---

### 🟠 Phase 3: Set Up GraphQL Gateway (Week 3-4)

#### Step 3.1: Install Apollo Server
```bash
npm install apollo-server-express graphql
```

#### Step 3.2: Create GraphQL Schema
```typescript
// backend/src/graphql/schema.ts
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Room {
    id: ID!
    name: String!
    location: String
    capacity: Int!
    equipment: [String!]!
    status: RoomStatus!
    appointments: [Appointment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Appointment {
    id: ID!
    title: String!
    description: String
    room: Room!
    userId: String!
    startTime: String!
    endTime: String!
    participants: [String!]!
    status: AppointmentStatus!
    createdAt: String!
    updatedAt: String!
  }

  enum RoomStatus {
    available
    occupied
  }

  enum AppointmentStatus {
    pending
    confirmed
    cancelled
  }

  type Query {
    # Room queries
    rooms: [Room!]!
    room(id: ID!): Room
    availableRooms(startTime: String!, endTime: String!): [Room!]!
    
    # Appointment queries
    appointments: [Appointment!]!
    appointment(id: ID!): Appointment
    appointmentsByRoom(roomId: ID!): [Appointment!]!
    appointmentsByUser(userId: ID!): [Appointment!]!
  }

  type Mutation {
    # Room mutations
    createRoom(
      name: String!
      location: String
      capacity: Int!
      equipment: [String!]
    ): Room!
    
    updateRoom(
      id: ID!
      name: String
      location: String
      capacity: Int
      equipment: [String!]
      status: RoomStatus
    ): Room!
    
    deleteRoom(id: ID!): Boolean!
    
    # Appointment mutations
    createAppointment(
      title: String!
      description: String
      roomId: ID!
      userId: ID!
      startTime: String!
      endTime: String!
      participants: [String!]
    ): Appointment!
    
    updateAppointment(
      id: ID!
      title: String
      startTime: String
      endTime: String
      status: AppointmentStatus
    ): Appointment!
    
    deleteAppointment(id: ID!): Boolean!
  }

  type Subscription {
    roomStatusChanged(roomId: ID!): Room!
    appointmentCreated: Appointment!
    appointmentUpdated(roomId: ID!): Appointment!
  }
`;
```

#### Step 3.3: Create Resolvers
```typescript
// backend/src/graphql/resolvers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    rooms: async () => {
      return await prisma.room.findMany({
        include: { appointments: true }
      });
    },
    
    room: async (_, { id }) => {
      return await prisma.room.findUnique({
        where: { id },
        include: { appointments: true }
      });
    },
    
    availableRooms: async (_, { startTime, endTime }) => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const allRooms = await prisma.room.findMany();
      
      const available = await Promise.all(
        allRooms.map(async (room) => {
          const conflict = await prisma.appointment.findFirst({
            where: {
              roomId: room.id,
              status: { not: 'cancelled' },
              AND: [
                { startTime: { lt: end } },
                { endTime: { gt: start } }
              ]
            }
          });
          return !conflict ? room : null;
        })
      );
      
      return available.filter((r) => r !== null);
    },
    
    appointments: async () => {
      return await prisma.appointment.findMany({
        include: { room: true }
      });
    },
    
    appointment: async (_, { id }) => {
      return await prisma.appointment.findUnique({
        where: { id },
        include: { room: true }
      });
    },
    
    appointmentsByRoom: async (_, { roomId }) => {
      return await prisma.appointment.findMany({
        where: { roomId },
        include: { room: true }
      });
    },
    
    appointmentsByUser: async (_, { userId }) => {
      return await prisma.appointment.findMany({
        where: { userId },
        include: { room: true }
      });
    }
  },
  
  Mutation: {
    createRoom: async (_, { name, location, capacity, equipment }) => {
      return await prisma.room.create({
        data: {
          name,
          location,
          capacity,
          equipment: equipment || [],
          status: 'available'
        },
        include: { appointments: true }
      });
    },
    
    updateRoom: async (_, { id, ...updates }) => {
      return await prisma.room.update({
        where: { id },
        data: updates,
        include: { appointments: true }
      });
    },
    
    deleteRoom: async (_, { id }) => {
      try {
        await prisma.room.delete({ where: { id } });
        return true;
      } catch (error) {
        return false;
      }
    },
    
    createAppointment: async (_, { title, description, roomId, userId, startTime, endTime, participants }) => {
      // Validation and conflict check would go here
      return await prisma.appointment.create({
        data: {
          title,
          description,
          roomId,
          userId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          participants: participants || [],
          status: 'confirmed'
        },
        include: { room: true }
      });
    },
    
    updateAppointment: async (_, { id, ...updates }) => {
      const updateData = {
        ...(updates.title && { title: updates.title }),
        ...(updates.startTime && { startTime: new Date(updates.startTime) }),
        ...(updates.endTime && { endTime: new Date(updates.endTime) }),
        ...(updates.status && { status: updates.status })
      };
      
      return await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: { room: true }
      });
    },
    
    deleteAppointment: async (_, { id }) => {
      try {
        await prisma.appointment.delete({ where: { id } });
        return true;
      } catch (error) {
        return false;
      }
    }
  }
};
```

---

### 🟡 Phase 4: Implement WebSocket Server (Week 4)

#### Step 4.1: Install Socket.IO
```bash
npm install socket.io
```

#### Step 4.2: Create WebSocket Server
```typescript
// backend/src/websocket/server.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:5173'], // Vite dev server
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a room
    socket.on('join_room', (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // User leaves a room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Function to broadcast room status change
export function broadcastRoomStatusChange(
  io: SocketIOServer,
  roomId: string,
  newStatus: 'available' | 'occupied'
) {
  io.to(`room:${roomId}`).emit('room_status_changed', {
    roomId,
    status: newStatus,
    timestamp: new Date()
  });
}

// Function to broadcast new appointment
export function broadcastAppointmentCreated(
  io: SocketIOServer,
  roomId: string,
  appointment: any
) {
  io.to(`room:${roomId}`).emit('appointment_created', {
    appointment,
    timestamp: new Date()
  });
}
```

#### Step 4.3: Integrate with Main Server
```typescript
// backend/src/main.ts
import express from 'express';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import roomRouter from './services/room/controller';
import appointmentRouter from './services/appointment/controller';
import { typeDefs, resolvers } from './graphql';
import { initializeWebSocket, broadcastRoomStatusChange } from './websocket/server';

const app = express();
const httpServer = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST routes
app.use('/api/rooms', roomRouter);
app.use('/api/appointments', appointmentRouter);

// GraphQL setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { io } // Pass io to resolvers for subscriptions
});

await server.start();
server.applyMiddleware({ app });

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
  console.log(`GraphQL ready at http://localhost:${PORT}${server.graphqlPath}`);
});
```

---

### 🔴 Phase 5: Set Up Message Broker (RabbitMQ) (Week 4-5)

#### Step 5.1: Update docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: campus_user
      POSTGRES_PASSWORD: campus_password
      POSTGRES_DB: campus_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  rabbitmq_data:
```

```bash
docker-compose up -d
```

#### Step 5.2: Create Message Publisher
```typescript
// backend/src/messaging/publisher.ts
import amqp from 'amqplib';

let connection: amqp.Connection;
let channel: amqp.Channel;

export async function initializeMessaging() {
  connection = await amqp.connect('amqp://guest:guest@localhost');
  channel = await connection.createChannel();
  
  // Declare exchanges
  await channel.assertExchange('campus_events', 'topic', { durable: true });
}

export async function publishEvent(eventType: string, data: any) {
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
  
  channel.publish(
    'campus_events',
    eventType,
    Buffer.from(message)
  );
  
  console.log(`Published event: ${eventType}`);
}
```

#### Step 5.3: Create Notifications Service Consumer
```typescript
// backend/src/services/notifications/consumer.ts
import amqp from 'amqplib';
import nodemailer from 'nodemailer';

async function startNotificationsService() {
  const connection = await amqp.connect('amqp://guest:guest@localhost');
  const channel = await connection.createChannel();
  
  // Setup exchange and queue
  await channel.assertExchange('campus_events', 'topic', { durable: true });
  const queue = await channel.assertQueue('notifications_queue', { durable: true });
  
  // Bind to specific event types
  await channel.bindQueue(queue.queue, 'campus_events', 'appointment.*');
  await channel.bindQueue(queue.queue, 'campus_events', 'room.*');
  
  // Configure email sender
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Consume messages
  channel.consume(queue.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      
      console.log(`Received event: ${event.type}`);
      
      try {
        switch (event.type) {
          case 'appointment.created':
            await sendAppointmentNotification(transporter, event.data);
            break;
          case 'appointment.cancelled':
            await sendCancellationNotification(transporter, event.data);
            break;
          case 'room.status_changed':
            console.log(`Room ${event.data.roomId} is now ${event.data.newStatus}`);
            break;
        }
        
        // Acknowledge message
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing event:', error);
        // Requeue on error
        channel.nack(msg, false, true);
      }
    }
  });
}

async function sendAppointmentNotification(transporter: any, appointmentData: any) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: appointmentData.userEmail,
    subject: `New Appointment: ${appointmentData.title}`,
    html: `
      <h2>New Appointment Created</h2>
      <p><strong>Title:</strong> ${appointmentData.title}</p>
      <p><strong>Room:</strong> ${appointmentData.roomName}</p>
      <p><strong>Time:</strong> ${appointmentData.startTime} - ${appointmentData.endTime}</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${appointmentData.userEmail}`);
}

async function sendCancellationNotification(transporter: any, appointmentData: any) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: appointmentData.userEmail,
    subject: `Appointment Cancelled: ${appointmentData.title}`,
    html: `
      <h2>Your Appointment Has Been Cancelled</h2>
      <p><strong>Title:</strong> ${appointmentData.title}</p>
      <p>Room ${appointmentData.roomName} is no longer booked.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Start the service
startNotificationsService().catch(console.error);
```

---

### 🟡 Phase 6: Frontend Integration (Week 5-6)

#### Step 6.1: Install Apollo Client
```bash
npm install @apollo/client graphql
```

#### Step 6.2: Create Apollo Client Setup
```typescript
// src/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, Observable } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include'
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql'
  })
);

const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

#### Step 6.3: Create Query/Mutation Hooks
```typescript
// src/hooks/useRooms.ts
import { useQuery, gql } from '@apollo/client';

export const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      name
      location
      capacity
      equipment
      status
      appointments {
        id
        title
        startTime
        endTime
      }
    }
  }
`;

export function useRooms() {
  return useQuery(GET_ROOMS);
}
```

#### Step 6.4: Update React Components
```typescript
// src/pages/Dashboard.tsx
import { useRooms } from '../hooks/useRooms';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function Dashboard() {
  const { data, loading } = useRooms();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState(data?.rooms || []);
  
  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);
    
    newSocket.on('room_status_changed', (event) => {
      setRooms(rooms =>
        rooms.map(r =>
          r.id === event.roomId ? { ...r, status: event.status } : r
        )
      );
    });
    
    return () => newSocket.disconnect();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Room Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="border rounded p-4">
            <h2>{room.name}</h2>
            <p>Capacity: {room.capacity}</p>
            <p>Status: <span className={room.status === 'available' ? 'text-green-600' : 'text-red-600'}>
              {room.status}
            </span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 🔴 Phase 7: Testing (Week 6-7)

#### Step 7.1: Set Up Testing Infrastructure
```bash
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev supertest @types/supertest
npm install --save-dev testcontainers
```

#### Step 7.2: REST API Integration Tests
```typescript
// backend/tests/appointments.integration.test.ts
import request from 'supertest';
import { app } from '../src/main';
import { PrismaClient } from '@prisma/client';
import { GenericContainer } from 'testcontainers';

const prisma = new PrismaClient();

describe('Appointments Service', () => {
  let postgresContainer: any;

  beforeAll(async () => {
    // Start PostgreSQL container
    postgresContainer = await new GenericContainer('postgres:16')
      .withEnvironment('POSTGRES_PASSWORD', 'test')
      .withExposedPorts(5432)
      .start();
    
    // Update DATABASE_URL
    process.env.DATABASE_URL = `postgresql://postgres:test@localhost:${postgresContainer.getMappedPort(5432)}/test`;
    
    // Run migrations
    await prisma.$executeRawUnsafe('CREATE DATABASE test');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await postgresContainer.stop();
  });

  it('should create an appointment', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send({
        title: 'Team Meeting',
        roomId: 'room-123',
        userId: 'user-456',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString()
      });
    
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Team Meeting');
  });

  it('should reject overlapping appointments', async () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 3600000);
    
    // Create first appointment
    await request(app)
      .post('/api/appointments')
      .send({
        title: 'First Meeting',
        roomId: 'room-123',
        userId: 'user-456',
        startTime,
        endTime
      });
    
    // Try to create overlapping appointment
    const response = await request(app)
      .post('/api/appointments')
      .send({
        title: 'Second Meeting',
        roomId: 'room-123',
        userId: 'user-789',
        startTime,
        endTime
      });
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('not available');
  });
});
```

#### Step 7.3: GraphQL Tests
```typescript
// backend/tests/graphql.integration.test.ts
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { HttpLink } from '@apollo/client';
import fetch from 'cross-fetch';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch
  }),
  cache: new InMemoryCache()
});

describe('GraphQL Gateway', () => {
  it('should fetch all rooms', async () => {
    const { data } = await client.query({
      query: gql`
        query {
          rooms {
            id
            name
            capacity
          }
        }
      `
    });
    
    expect(data.rooms).toBeDefined();
    expect(Array.isArray(data.rooms)).toBe(true);
  });

  it('should create a room via mutation', async () => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation CreateRoom {
          createRoom(name: "Test Room", capacity: 30) {
            id
            name
            capacity
          }
        }
      `
    });
    
    expect(data.createRoom.name).toBe('Test Room');
  });
});
```

---

### 🟠 Phase 8: Documentation (Week 7-8)

#### Step 8.1: Create Architecture Diagram
```markdown
# Architecture Diagram

[Mermaid Diagram will be inserted here]

Frontend (React/TypeScript)
    ↓ GraphQL Queries/Mutations
Apollo Client
    ↓ WebSocket Subscriptions
    ├→ GraphQL Gateway (Apollo Server)
    │   ├→ Room Resolver
    │   ├→ Appointment Resolver
    │   └→ Subscription Handlers
    ├→ REST APIs
    │   ├→ /api/rooms (Room Service)
    │   └→ /api/appointments (Appointment Service)
    ├→ WebSocket Server (Socket.IO)
    │   └→ Real-time broadcasts
    └→ Message Broker (RabbitMQ)
            ↓
        Notifications Service
            ↓
        Email/In-App Notifications
            
Database: PostgreSQL
    ├→ rooms table
    └→ appointments table
```

#### Step 8.2: Create ADR Documents

**ADR-001: Monolith Architecture**
```markdown
# ADR-001: Adopt Modular Monolith Architecture

## Status
Accepted

## Context
For a semester project, we need to balance:
- Development speed
- Learning curve
- Future scalability
- Deployment complexity

## Decision
Use a modular monolith architecture where services are logically separated but deployed together initially.

## Rationale
- Simpler setup and deployment
- Easier debugging during development
- Can evolve to microservices later if needed
- Single database simplifies consistency

## Consequences
- Less service independence
- Single point of failure (mitigated with proper error handling)
- Easier to split into microservices later
```

**ADR-002: RabbitMQ Selection**
```markdown
# ADR-002: Use RabbitMQ for Event Messaging

## Status
Accepted

## Context
Need asynchronous event processing for:
- Email notifications
- Audit logging
- Future analytics

## Decision
Use RabbitMQ (not Kafka)

## Rationale
- Simpler setup for a semester project
- Better for request-reply patterns
- Easier to understand for learners
- Sufficient for our notification use cases

## Consequences
- Limited to single datacenter (can migrate to Kafka later)
- Lower throughput than Kafka (not needed here)
- Good learning path (can learn Kafka next course)
```

#### Step 8.3: API Documentation
```markdown
# API Documentation

## REST Endpoints

### Rooms

**GET /api/rooms**
- Returns all rooms
- Response: `Room[]`

**POST /api/rooms**
- Create new room
- Body:
  ```json
  {
    "name": string,
    "location": string,
    "capacity": number,
    "equipment": string[]
  }
  ```

**GET /api/rooms/:id**
- Get specific room by ID

**PATCH /api/rooms/:id**
- Update room properties

**DELETE /api/rooms/:id**
- Delete room

### Appointments

**GET /api/appointments**
- Returns all appointments

**POST /api/appointments**
- Create new appointment
- Body:
  ```json
  {
    "title": string,
    "description": string,
    "roomId": string,
    "userId": string,
    "startTime": ISO8601 datetime,
    "endTime": ISO8601 datetime,
    "participants": string[]
  }
  ```

[Continue with other endpoints...]
```

---

## 5. Development Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Infrastructure | PostgreSQL, Backend project setup, Prisma schema |
| 2-3 | REST APIs | Room controller, Appointment controller, validation |
| 3-4 | GraphQL | Apollo Server, schema, resolvers, subscriptions |
| 4 | WebSocket | Socket.IO integration, real-time broadcasts |
| 4-5 | Messaging | RabbitMQ setup, Publisher, Notifications service |
| 5-6 | Frontend | Apollo Client setup, components, real-time updates |
| 6-7 | Testing | Unit tests, integration tests, E2E tests |
| 7-8 | Documentation | ADRs, diagrams, API docs, deployment guide |

---

## 6. Key Implementation Checklist

### Backend Setup
- [ ] Initialize Node.js/TypeScript project
- [ ] Set up PostgreSQL (Docker)
- [ ] Configure Prisma ORM
- [ ] Create Prisma schema
- [ ] Run migrations

### REST Services
- [ ] Implement Room CRUD endpoints
- [ ] Implement Appointment CRUD endpoints
- [ ] Add validation and error handling
- [ ] Add availability checking logic

### GraphQL
- [ ] Set up Apollo Server
- [ ] Define TypeDefs schema
- [ ] Implement resolvers
- [ ] Test with Apollo Studio

### Real-time Features
- [ ] Set up Socket.IO
- [ ] Implement room subscriptions
- [ ] Implement appointment subscriptions
- [ ] Broadcast status changes

### Messaging
- [ ] Set up RabbitMQ (Docker)
- [ ] Create event publisher
- [ ] Create notifications service consumer
- [ ] Implement email sending

### Frontend
- [ ] Install Apollo Client
- [ ] Create Apollo Client setup
- [ ] Implement GraphQL queries/mutations
- [ ] Add WebSocket subscriptions
- [ ] Update React components
- [ ] Implement real-time UI updates

### Testing
- [ ] Set up Jest/Testing infrastructure
- [ ] Write REST API integration tests
- [ ] Write GraphQL tests
- [ ] Write WebSocket tests
- [ ] Write E2E tests with test containers

### Deployment
- [ ] Docker scripts for all services
- [ ] Docker Compose orchestration
- [ ] Environment configuration
- [ ] CI/CD pipeline (optional)

---

## 7. Important Notes

1. **Start small**: Get REST APIs working first
2. **Test early**: Write tests as you go
3. **Environment variables**: Use .env files for secrets
4. **Error handling**: Implement proper HTTP status codes
5. **Logging**: Add comprehensive logging for debugging
6. **API versioning**: Consider `/api/v1/` prefix for future versions
7. **CORS**: Configure correctly for frontend access
8. **Authentication**: Consider adding JWT if needed (not required for MVP)

---

## 8. Useful Resources

### Documentation
- Express: https://expressjs.com/
- Prisma: https://www.prisma.io/docs/
- Apollo Server: https://www.apollographql.com/docs/apollo-server/
- Socket.IO: https://socket.io/docs/
- RabbitMQ: https://www.rabbitmq.com/documentation.html

### Tools
- Postman: REST API testing
- Apollo Studio: GraphQL debugging
- Docker: Container management
- DBeaver: Database management

---

## 9. Next Steps

1. **This week**: Set up backend project and PostgreSQL
2. **Week 2**: Implement Room Service REST endpoints
3. **Week 3**: Implement Appointment Service REST endpoints
4. **Week 4**: Add GraphQL and WebSocket
5. **Week 5**: Integrate RabbitMQ for messaging
6. **Week 6**: Frontend integration with Apollo Client
7. **Week 7**: Testing and bug fixes
8. **Week 8**: Final documentation and demo preparation

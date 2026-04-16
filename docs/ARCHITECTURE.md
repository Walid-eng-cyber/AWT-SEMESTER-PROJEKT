# Campus Interaction Platform - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Responsibilities](#component-responsibilities)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Deployment Architecture](#deployment-architecture)
7. [Scalability Considerations](#scalability-considerations)

---

## Overview

The Campus Interaction Platform is designed as a **modular monolith** that can evolve into microservices. It combines real-time capabilities (WebSockets), asynchronous processing (RabbitMQ), flexible querying (GraphQL), and traditional REST APIs to create a comprehensive room booking and event management system for campus environments.

### Design Principles
- **Loose Coupling**: Services communicate through well-defined APIs
- **High Cohesion**: Related functionality grouped together
- **Testability**: Each component independently testable
- **Scalability**: Can be split into microservices with minimal changes
- **Real-time**: WebSocket support for live updates across all clients

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  React SPA       │    │   Web Browser    │                 │
│  │  (Frontend)      │    │   (JavaScript)   │                 │
│  └────────┬─────────┘    └───────┬──────────┘                 │
│           │                      │                             │
│           └──────────┬───────────┘                             │
│                      │                                         │
│        (HTTP/WebSocket/GraphQL)                               │
│                      │                                         │
└──────────────────────┼─────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Express.js HTTP Server (Port 4000)           │   │
│  │  ┌─────────────┬──────────────┬──────────────────┐     │   │
│  │  │  REST       │  GraphQL     │  WebSocket       │     │   │
│  │  │  Router     │  Apollo      │  Socket.IO       │     │   │
│  │  │  Endpoints  │  Server      │  Server          │     │   │
│  │  └─────────────┴──────────────┴──────────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────┬─────────────────────────────┬───────────────────┘
               │                             │
      ┌────────▼──────────┐           ┌─────▼────────────┐
      │  REST Services    │           │  WebSocket       │
      │                   │           │  Broadcaster     │
      │  • Room Service   │           │                  │
      │  • Appointment    │           │  (Real-time      │
      │    Service        │           │   Updates)       │
      └────────┬──────────┘           └─────┬────────────┘
               │                             │
└──────────────┼─────────────────────────────┼──────────────────┐
│              │                             │                  │
│              ▼                             ▼                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         APPLICATION/BUSINESS LOGIC LAYER             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ Room Service │  │Appointment   │  │Validation  │ │   │
│  │  │  Logic       │  │ Service      │  │ & Error    │ │   │
│  │  │              │  │ Logic        │  │ Handling   │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Event Publisher (RabbitMQ Integration)      │  │   │
│  │  │  - Publishes room.* events                   │  │   │
│  │  │  - Publishes appointment.* events            │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                   ┌──────────▼────────────┐
                   │   Prisma ORM Layer    │
                   │  (Database Abstraction)
                   └──────────┬────────────┘
                              │
                   ┌──────────▼────────────┐
                   │   PostgreSQL DB       │
                   │  (Port 5432)          │
                   │                       │
                   │  ┌──────────────────┐ │
                   │  │ rooms table      │ │
                   │  │ appointments tbl │ │
                   │  │ users table      │ │
                   │  └──────────────────┘ │
                   └───────────────────────┘
```

---

## Component Responsibilities

### 1. Frontend (React Client)

**Technology**: React 18 + TypeScript + Vite + Apollo Client

**Responsibilities**:
- Display room catalog and availability
- Allow users to book appointments
- Show real-time room status updates
- Provide booking management UI
- Handle user authentication/sessions (optional)

**Key Features**:
- GraphQL queries for flexible data fetching
- WebSocket subscriptions for real-time updates
- Responsive design with Tailwind CSS
- Navigation between pages

---

### 2. REST API Services

#### 2.1 Room Service (`/api/rooms/`)

**Responsibilities**:
- CRUD operations for rooms
- Room availability queries
- Room status management
- Equipment tracking

**Key Endpoints**:
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `PATCH /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

**Business Logic**:
- Validate room capacity (positive integer)
- Validate equipment array format
- Ensure room names are unique
- Track room availability based on appointments

---

#### 2.2 Appointment Service (`/api/appointments/`)

**Responsibilities**:
- CRUD operations for appointments/bookings
- Availability checking (prevent double-booking)
- Time conflict validation
- Appointment status management

**Key Endpoints**:
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/:id` - Get appointment details
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

**Business Logic**:
- Prevent overlapping bookings in same room
- Validate start time < end time
- Check room exists before booking
- Publish events to RabbitMQ
- Update room status (available/occupied)

---

### 3. GraphQL Gateway (Apollo Server)

**Responsibilities**:
- Aggregate REST services
- Provide flexible querying interface
- Handle subscriptions for real-time updates
- Serve as single endpoint for clients

**Key Capabilities**:
- Query rooms with their appointments
- Query appointments with room details
- Mutations for creating/updating data
- Subscriptions for real-time changes

**Why GraphQL?**
- Clients request exactly what they need (no over-fetching)
- Single endpoint simplifies client code
- Strong typing prevents errors
- Subscriptions for real-time updates

---

### 4. WebSocket Server (Socket.IO)

**Responsibilities**:
- Maintain persistent connections with clients
- Broadcast status changes in real-time
- Handle room-specific subscriptions
- Deliver appointment updates instantly

**Events Published**:
- `room_status_changed` - When room becomes occupied/available
- `appointment_created` - When new appointment is made
- `appointment_updated` - When appointment is modified
- `appointment_cancelled` - When appointment is deleted

**Architecture**:
```
1. Client connects to /socket.io
2. Client joins room: socket.emit('join_room', roomId)
3. Server adds client to room socket group
4. Any status change broadcasts to all clients in that room
5. Client receives update and refreshes UI
```

---

### 5. Message Broker (RabbitMQ)

**Responsibilities**:
- Decouple services with asynchronous events
- Guarantee message delivery
- Enable multiple consumers
- Audit trail of all events

**Event Types**:
- `appointment.created` - Triggers email notification
- `appointment.updated` - Notifies participants
- `appointment.cancelled` - Sends cancellation notice
- `room.status_changed` - Updates room dashboards

**Advantages of async messaging**:
- API responds immediately (don't wait for email)
- Services remain loosely coupled
- Can add new consumers (analytics, logging) without changes
- Better fault tolerance

---

### 6. Notifications Service (Separate Consumer)

**Responsibilities**:
- Listen to RabbitMQ events
- Send email notifications
- Log events to database
- Handle delivery failures

**Flow**:
```
1. Appointment Service publishes: appointment.created
2. RabbitMQ routes to notifications queue
3. Notifications Service consumes message
4. Sends email to user
5. Acknowledgment sent back to RabbitMQ
```

---

### 7. Database Layer (PostgreSQL + Prisma)

**Responsibilities**:
- Persist all application data
- Enforce data consistency
- Support complex queries
- Handle transactions

**Core Tables**:

**users**
```sql
id (UUID, PRIMARY KEY)
email (VARCHAR, UNIQUE)
name (VARCHAR)
role (ENUM: student, staff)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**rooms**
```sql
id (UUID, PRIMARY KEY)
name (VARCHAR, UNIQUE)
location (VARCHAR)
capacity (INTEGER, > 0)
equipment (TEXT[] - JSON array)
status (ENUM: available, occupied)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**appointments**
```sql
id (UUID, PRIMARY KEY)
title (VARCHAR)
description (TEXT)
room_id (UUID, FOREIGN KEY → rooms)
user_id (UUID, FOREIGN KEY → users)
start_time (TIMESTAMP)
end_time (TIMESTAMP)
participants (TEXT[] - JSON array)
status (ENUM: pending, confirmed, cancelled)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

CONSTRAINTS:
- start_time < end_time
- room_id + time window must be unique (no overlaps)
- FOREIGN KEY constraints referential integrity
```

---

## Data Flow

### Scenario 1: User Books a Room

```
Client (React)
    │
    ├─► Request: GraphQL Mutation (createAppointment)
    │   {
    │     title: "Team Meeting"
    │     roomId: "room-123"
    │     startTime: "2024-01-15T10:00:00Z"
    │     endTime: "2024-01-15T11:00:00Z"
    │   }
    │
    ▼
Apollo Server (GraphQL Gateway)
    │
    ├─► Validate input (times, room exists)
    │
    ├─► Call Appointment Service logic
    │
    ▼
Appointment Service
    │
    ├─► Check room availability
    │   (Query DB: any appointments at same time?)
    │
    ├─► If conflict: Return 409 error
    │
    ├─► If available:
    │   ├─ Create appointment in DB (Prisma)
    │   │
    │   ├─ Update room status to "occupied"
    │   │
    │   └─ Publish event to RabbitMQ
    │      {
    │        type: "appointment.created"
    │        data: { appointmentId, roomId, userId, ... }
    │      }
    │
    ▼
RabbitMQ (Message Broker)
    │
    ├─► Route to notifications queue
    │
    ▼
Notifications Service (Consumer)
    │
    ├─► Consume message
    │
    ├─► Send confirmation email
    │
    ├─► Send reminders (optional)
    │
    └─► Acknowledge message
```

**Simultaneously**:
```
WebSocket Server
    │
    ├─► Listen to DB changes (change stream or polling)
    │
    ├─► Broadcast to all connected clients
    │   event: room_status_changed
    │   data: { roomId, status: "occupied" }
    │
    ▼
Client (React)
    │
    ├─► Receive WebSocket update
    │
    ├─► Update local state
    │
    └─► Re-render UI (room now shows as occupied)
```

---

### Scenario 2: View Available Rooms (GraphQL Query)

```
Client (React)
    │
    ├─► Request: GraphQL Query
    │   query {
    │     availableRooms(startTime: "...", endTime: "...") {
    │       id, name, capacity, equipment, appointments { ... }
    │     }
    │   }
    │
    ▼
Apollo Server (GraphQL Gateway)
    │
    ├─► Parse query
    │
    ├─► Call availableRooms resolver
    │
    ▼
Database Query (via Prisma)
    │
    ├─► SELECT all rooms
    │
    ├─► For each room:
    │   ├─ Check if any appointments conflict with time window
    │   └─ If no conflict, include in results
    │
    ▼
Return results to Apollo Server
    │
    ├─► Format response (only requested fields)
    │
    ▼
Send to Client
    │
    └─► Client renders available rooms list
```

---

## Technology Stack

### Frontend
```
React 18
├── TypeScript (type safety)
├── Vite (fast build)
├── Tailwind CSS (styling)
├── React Router (navigation)
├── Apollo Client (GraphQL + subscriptions)
└── Socket.IO Client (WebSocket)
```

### Backend
```
Node.js + TypeScript
├── Express.js (REST API server)
├── Apollo Server (GraphQL gateway)
├── Socket.IO (WebSocket server)
├── Prisma (ORM)
├── ts-node (TypeScript execution)
└── Jest (testing)
```

### Data & Messaging
```
PostgreSQL 16
├── ACID compliance
├── JSON support
└── Triggers for audit logs

RabbitMQ 3
├── AMQP protocol
├── Exchange-Queue-Binding model
└── Message acknowledgment
```

### Infrastructure
```
Docker
├── PostgreSQL container
├── RabbitMQ container
└── Node.js backend (local or containerized)

docker-compose
└── Orchestrates all services locally
```

---

## Deployment Architecture

### Local Development
```
┌─────────────┐
│ Vite Dev    │
│ Server      │
│ Port 5173   │
└──────┬──────┘
       │
┌──────▼──────────────────┐
│ Your Machine             │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Node.js App          │ │
│ │ Port 4000            │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ PostgreSQL           │ │
│ │ Port 5432 (Docker)   │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ RabbitMQ             │ │
│ │ Port 5672 (Docker)   │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

Via `docker-compose up -d`:
- PostgreSQL starts on 5432
- RabbitMQ starts on 5672 (+ management UI on 15672)
- Both volumes persist data across restarts

### Production (Future)

Could be deployed as:
1. **Container orchestration** (Kubernetes):
   - Separate services in different pods
   - Auto-scaling for high load
   - Load balancing between instances

2. **Managed services**:
   - Database: AWS RDS, Azure Database
   - Messaging: AWS SQS, Azure Service Bus
   - Backend: AWS ECS, Heroku, Railway

3. **Monolith containerization**:
   - Single Docker image
   - Simple deployment
   - Scale with multiple containers

---

## Scalability Considerations

### Current Monolith
- **Pros**: Simple, unified database, easy to debug
- **Cons**: All components scale together, limited to single server for real-time

### Future Microservices Evolution
```
Phase 1 (Now): Modular Monolith
├─ Room Service (logical module)
├─ Appointment Service (logical module)
├─ Notifications Service (logical module)
└─ All deployed as single container

Phase 2: Extract Notifications
├─ Room + Appointment Service
├─ Notifications Service (separate container)
└─ RabbitMQ (shared message broker)

Phase 3: Full Microservices
├─ Room Service (separate container + DB)
├─ Appointment Service (separate container + DB)
├─ Notifications Service (separate container)
├─ GraphQL Gateway (API aggregator)
└─ RabbitMQ (message broker)
```

### Real-time Scalability
**Current**: Socket.IO in single server
- Fine for ~1000 concurrent connections

**Future scaling options**:
- Socket.IO Redis adapter (multiple server instances)
- Dedicated real-time service
- WebSocket gateway with message queue

---

## Architecture Decision Records (ADRs)

### ADR-001: Monolith vs Microservices

**Decision**: Start with modular monolith, extract to microservices only when needed

**Rationale**:
- Simpler development and deployment
- Easier debugging and testing
- Single database ensures consistency
- Can refactor incrementally

**Trade-offs**:
- All components scale together
- Tight coupling initially
- Harder to use different tech stacks

---

### ADR-002: RabbitMQ instead of Kafka

**Decision**: Use RabbitMQ for event messaging

**Rationale**:
- Simpler to set up and understand
- Better for request-reply patterns
- Lower operational complexity
- Sufficient for notification use case

**Trade-offs**:
- No event replay capability
- Lower throughput
- Single datacenter (no built-in cluster)

Could migrate to Kafka later if:
- Need event sourcing (replay history)
- Multiple datacenters required
- Throughput becomes bottleneck

---

### ADR-003: GraphQL Gateway Pattern

**Decision**: Use GraphQL as primary API with REST for webhooks/scripts

**Rationale**:
- Single endpoint beats multiple REST routes
- Type safety prevents errors
- Subscriptions for real-time
- Flexible querying

**Trade-offs**:
- Complexity of GraphQL server
- Steeper learning curve
- N+1 query problems (mitigated with dataloader)

---

## Security Considerations (Future)

As this project evolves, consider:

1. **Authentication**: JWT tokens or session-based
2. **Authorization**: Role-based access control (RBAC)
3. **API Rate Limiting**: Prevent abuse
4. **HTTPS/TLS**: Encrypt in transit
5. **Input Validation**: Sanitize all user inputs
6. **CORS**: Proper cross-origin configuration
7. **Database Security**: Parameterized queries (Prisma handles this)
8. **Secrets Management**: Environment variables for API keys

---

## Monitoring & Logging

### Frontend
- User action logging
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)

### Backend
- Request logging
- Error logging with stack traces
- Database query logging
- Message queue monitoring

### Infrastructure
- Container health checks
- Database connection pooling
- RabbitMQ queue depth monitoring

---

## Summary

The Campus Interaction Platform combines:
- **REST APIs** for standard CRUD operations
- **GraphQL** for flexible querying and real-time subscriptions
- **WebSockets** for instant UI updates
- **RabbitMQ** for async, decoupled processing
- **PostgreSQL** for reliable data storage

This architecture scales from a single monolith to a distributed system while maintaining code quality and testability throughout.

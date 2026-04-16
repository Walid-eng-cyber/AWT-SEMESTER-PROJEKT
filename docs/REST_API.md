# REST API - Complete Guide

## Table of Contents
1. [REST Fundamentals](#rest-fundamentals)
2. [RESTful Design Principles](#restful-design-principles)
3. [HTTP Status Codes](#http-status-codes)
4. [Request/Response Structure](#requestresponse-structure)
5. [Error Handling](#error-handling)
6. [Room Service API](#room-service-api)
7. [Appointment Service API](#appointment-service-api)
8. [Implementation Guide](#implementation-guide)
9. [Testing REST APIs](#testing-rest-apis)

---

## REST Fundamentals

### What is REST?

**REST** = **RE**presentational **S**tate **T**ransfer

REST is an **architectural style** for building web APIs that use HTTP requests to perform CRUD (Create, Read, Update, Delete) operations.

### Key Concepts

#### Resources
Everything is a **resource** identified by a URL:
```
/api/rooms          ← Collection of rooms (resource)
/api/rooms/123      ← Specific room with ID 123 (resource)
/api/appointments   ← Collection of appointments
/api/appointments/456  ← Specific appointment
```

#### HTTP Methods / Verbs
Operations performed on resources:

| Method | Purpose | Meaning |
|--------|---------|---------|
| GET | Read | Retrieve resource(s) |
| POST | Create | Create new resource |
| PATCH | Partial Update | Update specific fields |
| PUT | Full Replace | Replace entire resource |
| DELETE | Delete | Remove resource |

#### Example: Room Resource

```
GET /api/rooms              → Retrieve all rooms
POST /api/rooms             → Create new room
GET /api/rooms/123          → Get room with ID 123
PATCH /api/rooms/123        → Update room 123
DELETE /api/rooms/123       → Delete room 123
```

**Not REST** (incorrect patterns):
```
❌ GET /api/createRoom      (action in URL)
❌ POST /api/deleteRoom/123 (wrong method)
❌ GET /api/roomData1       (no consistent resource naming)
```

---

## RESTful Design Principles

### 1. Statelessness
Each request contains all information needed to process it. Server doesn't store client context.

```typescript
// ✅ GOOD - Request is complete
GET /api/rooms/123
Authorization: Bearer token123
Accept: application/json

// ❌ BAD - Relies on session state
GET /api/room
// (assumes server remembers which room from previous request)
```

### 2. Client-Server Separation
Frontend and backend are independent. Can be developed/deployed separately.

```
Frontend (React)     ← Network → Backend (Node.js)
                     HTTP/HTTPS
```

### 3. Uniform Interface
All endpoints follow same conventions:
- Standard HTTP methods
- Consistent URL patterns
- Consistent response format
- Standard status codes

### 4. Resource-Based URLs
URLs represent resources, not actions:

```typescript
// ✅ GOOD - Resource-based
POST /api/rooms              // Create room
GET /api/rooms/123           // Get room
PATCH /api/rooms/123         // Update room
DELETE /api/rooms/123        // Delete room

// ❌ BAD - Action-based (RPC style)
POST /api/createRoom
POST /api/updateRoom
POST /api/deleteRoom
GET /api/getRooms
```

### 5. Versioning (Optional but Recommended)
Include API version in URL:

```typescript
GET /api/v1/rooms           // Version 1
GET /api/v2/rooms           // Version 2 (backward compatible)
```

Benefits:
- Allows breaking changes in v2
- Clients can stick with v1
- Gradual migration path

---

## HTTP Status Codes

### 2xx Success Codes

| Code | Name | When to Use |
|------|------|------------|
| 200 | OK | GET, PATCH successful. Returning data |
| 201 | Created | POST successful. Resource created |
| 204 | No Content | DELETE successful. No body to return |

```typescript
// GET /api/rooms/123
200 OK
{
  "id": "123",
  "name": "Lecture Hall A",
  ...
}

// POST /api/rooms
201 Created
Location: /api/rooms/789  // URL of new resource
{
  "id": "789",
  "name": "New Room"
}

// DELETE /api/rooms/123
204 No Content
(empty body)
```

### 4xx Client Error Codes

Client made a mistake (bad request, not found, etc.)

| Code | Name | When to Use |
|------|------|------------|
| 400 | Bad Request | Missing/invalid fields, malformed JSON |
| 401 | Unauthorized | Authentication required/failed |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business logic violation (double-booking) |
| 422 | Unprocessable Entity | Validation errors |

```typescript
// POST /api/appointments with invalid time
400 Bad Request
{
  "error": "Start time must be before end time",
  "code": "INVALID_TIME_RANGE"
}

// GET /api/rooms/invalid-id
404 Not Found
{
  "error": "Room not found",
  "code": "ROOM_NOT_FOUND"
}

// POST /api/appointments (room already booked)
409 Conflict
{
  "error": "Room is not available during this time",
  "code": "ROOM_NOT_AVAILABLE",
  "conflictingAppointment": {
    "id": "456",
    "startTime": "2024-01-15T10:00:00Z"
  }
}
```

### 5xx Server Error Codes

Server made a mistake (shouldn't happen in normal operation)

| Code | Name | When to Use |
|------|------|------------|
| 500 | Internal Server Error | Unexpected error, database crash, etc. |
| 503 | Service Unavailable | Server temporarily down |

```typescript
// Database connection failed
500 Internal Server Error
{
  "error": "Failed to fetch rooms",
  "code": "DATABASE_ERROR"
}
```

---

## Request/Response Structure

### Standard Request Format

```typescript
// Request to server
POST /api/v1/rooms
Host: localhost:4000
Content-Type: application/json
Authorization: Bearer token (if needed)

{
  "name": "Conference Room A",
  "location": "Building 3, Floor 2",
  "capacity": 30,
  "equipment": ["projector", "whiteboard", "video_conference"]
}
```

### Standard Response Format

```typescript
// Success Response
200 OK / 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Conference Room A",
  "location": "Building 3, Floor 2",
  "capacity": 30,
  "equipment": ["projector", "whiteboard", "video_conference"],
  "status": "available",
  "createdAt": "2024-01-15T09:30:00Z",
  "updatedAt": "2024-01-15T09:30:00Z"
}
```

### Error Response Format

```typescript
// Error Response (consistent format)
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    // Optional: additional context
    "field": ["error for field"]
  },
  "timestamp": "2024-01-15T09:30:00Z"
}
```

### List Response Format

```typescript
// GET /api/rooms
200 OK

{
  "data": [
    {
      "id": "room-1",
      "name": "Room A",
      ...
    },
    {
      "id": "room-2",
      "name": "Room B",
      ...
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

---

## Error Handling

### Validation Errors (400)

```typescript
// Example: Missing required field
POST /api/rooms
{
  "location": "Building 3",  // name is missing
  "capacity": 30
}

Response: 400 Bad Request
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["Name is required"],
    "capacity": ["Capacity must be a positive number"]
  }
}
```

### Business Logic Errors (409)

```typescript
// Example: Double-booking
POST /api/appointments
{
  "title": "Team Meeting",
  "roomId": "room-123",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}

Response: 409 Conflict
{
  "error": "Room is not available at this time",
  "code": "ROOM_NOT_AVAILABLE",
  "conflictingAppointment": {
    "id": "apt-456",
    "title": "Existing Meeting",
    "startTime": "2024-01-15T10:30:00Z",
    "endTime": "2024-01-15T11:30:00Z"
  }
}
```

### Server Errors (500)

```typescript
// Something unexpected happened
Response: 500 Internal Server Error
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "req-12345"  // For debugging
}
```

### Custom Error Handling Strategy

```typescript
// backend/src/utils/errors.ts
export class ValidationError extends Error {
  constructor(public details: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class RoomNotAvailableError extends Error {
  constructor(public conflictingAppointment: any) {
    super('Room is not available at this time');
    this.name = 'RoomNotAvailableError';
  }
}

export class NotFoundError extends Error {
  constructor(public resourceType: string, public resourceId: string) {
    super(`${resourceType} not found`);
    this.name = 'NotFoundError';
  }
}
```

---

## Room Service API

### Base URL
```
http://localhost:4000/api/v1/rooms
```

### 1. GET /api/v1/rooms - List All Rooms

**Purpose**: Retrieve all rooms with optional filtering

**Request**:
```http
GET /api/v1/rooms?status=available&capacity=30
Authorization: Bearer token (optional)
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter: "available" or "occupied" |
| capacity | number | Filter: minimum capacity |
| location | string | Filter: partial location match |
| limit | number | Pagination: results per page (default 10) |
| offset | number | Pagination: skip N results (default 0) |

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Lecture Hall A",
      "location": "Building 1, Ground Floor",
      "capacity": 100,
      "equipment": ["projector", "whiteboard", "microphone"],
      "status": "available",
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T09:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Meeting Room B",
      "location": "Building 2, First Floor",
      "capacity": 20,
      "equipment": ["whiteboard", "video_conference"],
      "status": "occupied",
      "createdAt": "2024-01-15T09:15:00Z",
      "updatedAt": "2024-01-15T09:30:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

**Implementation**:
```typescript
// backend/src/services/room/controller.ts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, capacity, location, limit = 10, offset = 0 } = req.query;
    
    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (capacity) where.capacity = { gte: Number(capacity) };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    
    // Count total
    const total = await prisma.room.count({ where });
    
    // Fetch with pagination
    const rooms = await prisma.room.findMany({
      where,
      skip: Number(offset),
      take: Number(limit),
      include: { appointments: true }
    });
    
    res.json({
      data: rooms,
      pagination: { total, limit: Number(limit), offset: Number(offset) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms', code: 'DATABASE_ERROR' });
  }
});
```

---

### 2. POST /api/v1/rooms - Create Room

**Purpose**: Create a new room

**Request**:
```http
POST /api/v1/rooms
Content-Type: application/json

{
  "name": "Seminar Room C",
  "location": "Building 3, Second Floor",
  "capacity": 50,
  "equipment": ["projector", "whiteboard"]
}
```

**Request Body**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Must be unique, 1-255 chars |
| location | string | ❌ | Optional, 0-255 chars |
| capacity | number | ✅ | Must be > 0 |
| equipment | string[] | ❌ | Array of equipment types |

**Response (201 Created)**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "name": "Seminar Room C",
  "location": "Building 3, Second Floor",
  "capacity": 50,
  "equipment": ["projector", "whiteboard"],
  "status": "available",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["Name is required", "Name must be unique"],
    "capacity": ["Capacity must be greater than 0"]
  }
}
```

**Implementation**:
```typescript
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, location, capacity, equipment } = req.body;
    
    // Validation
    const errors: Record<string, string[]> = {};
    
    if (!name || name.trim().length === 0) {
      errors.name = ['Name is required'];
    }
    
    if (!capacity || capacity <= 0) {
      errors.capacity = ['Capacity must be greater than 0'];
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }
    
    // Check uniqueness
    const existing = await prisma.room.findUnique({
      where: { name }
    });
    
    if (existing) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { name: ['Room name already exists'] }
      });
    }
    
    // Create room
    const room = await prisma.room.create({
      data: {
        name,
        location: location || null,
        capacity,
        equipment: equipment || [],
        status: 'available'
      }
    });
    
    res.status(201).json(room);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room', code: 'DATABASE_ERROR' });
  }
});
```

---

### 3. GET /api/v1/rooms/:id - Get Specific Room

**Purpose**: Retrieve a single room with all its appointments

**Request**:
```http
GET /api/v1/rooms/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Lecture Hall A",
  "location": "Building 1, Ground Floor",
  "capacity": 100,
  "equipment": ["projector", "whiteboard"],
  "status": "available",
  "appointments": [
    {
      "id": "apt-001",
      "title": "Intro to Computer Science",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T11:30:00Z",
      "status": "confirmed"
    }
  ],
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

**Error (404 Not Found)**:
```json
{
  "error": "Room not found",
  "code": "ROOM_NOT_FOUND"
}
```

**Implementation**:
```typescript
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const room = await prisma.room.findUnique({
      where: { id },
      include: { appointments: true }
    });
    
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }
    
    res.json(room);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room', code: 'DATABASE_ERROR' });
  }
});
```

---

### 4. PATCH /api/v1/rooms/:id - Update Room

**Purpose**: Update specific fields of a room

**Request**:
```http
PATCH /api/v1/rooms/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "capacity": 120,
  "equipment": ["projector", "whiteboard", "video_conference"],
  "status": "occupied"
}
```

**Request Body** (all fields optional):
| Field | Type | Notes |
|-------|------|-------|
| name | string | Updated room name |
| location | string | Updated location |
| capacity | number | Must be > 0 |
| equipment | string[] | Replace equipment array |
| status | enum | "available" or "occupied" |

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Lecture Hall A",
  "location": "Building 1, Ground Floor",
  "capacity": 120,
  "equipment": ["projector", "whiteboard", "video_conference"],
  "status": "occupied",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Implementation**:
```typescript
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, equipment, status } = req.body;
    
    // Check room exists
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }
    
    // Build update object (only provided fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (capacity !== undefined) {
      if (capacity <= 0) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { capacity: ['Capacity must be greater than 0'] }
        });
      }
      updateData.capacity = capacity;
    }
    if (equipment !== undefined) updateData.equipment = equipment;
    if (status !== undefined) updateData.status = status;
    
    const room = await prisma.room.update({
      where: { id },
      data: updateData
    });
    
    res.json(room);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room', code: 'DATABASE_ERROR' });
  }
});
```

---

### 5. DELETE /api/v1/rooms/:id - Delete Room

**Purpose**: Delete a room

**Request**:
```http
DELETE /api/v1/rooms/550e8400-e29b-41d4-a716-446655440000
```

**Response (204 No Content)**:
```
(empty body)
```

**Error (404 Not Found)**:
```json
{
  "error": "Room not found",
  "code": "ROOM_NOT_FOUND"
}
```

**Implementation**:
```typescript
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check exists
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }
    
    // Delete
    await prisma.room.delete({ where: { id } });
    
    res.status(204).send();
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room', code: 'DATABASE_ERROR' });
  }
});
```

---

## Appointment Service API

### Base URL
```
http://localhost:4000/api/v1/appointments
```

### 1. GET /api/v1/appointments - List All Appointments

**Request**:
```http
GET /api/v1/appointments?roomId=550e8400-e29b-41d4-a716-446655440000&status=confirmed
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| roomId | string | Filter by room |
| userId | string | Filter by user |
| status | string | Filter: pending, confirmed, cancelled |
| limit | number | Pagination: default 10 |
| offset | number | Pagination: default 0 |

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "apt-001",
      "title": "Team Meeting",
      "description": "Weekly sync",
      "roomId": "room-123",
      "userId": "user-456",
      "room": {
        "id": "room-123",
        "name": "Meeting Room B",
        "capacity": 20
      },
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "participants": ["user-456", "user-789"],
      "status": "confirmed",
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 2. POST /api/v1/appointments - Create Appointment

**Purpose**: Create a new room booking

**Request**:
```http
POST /api/v1/appointments
Content-Type: application/json

{
  "title": "Project Review",
  "description": "Quarterly project review meeting",
  "roomId": "room-123",
  "userId": "user-456",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T15:00:00Z",
  "participants": ["user-456", "user-789", "user-999"]
}
```

**Request Body**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | ✅ | 1-255 chars |
| description | string | ❌ | Optional details |
| roomId | string (UUID) | ✅ | Must exist |
| userId | string (UUID) | ✅ | Organizer |
| startTime | ISO8601 | ✅ | Must be < endTime |
| endTime | ISO8601 | ✅ | Must be > startTime |
| participants | string[] | ❌ | List of user IDs |

**Response (201 Created)**:
```json
{
  "id": "apt-002",
  "title": "Project Review",
  "description": "Quarterly project review meeting",
  "roomId": "room-123",
  "userId": "user-456",
  "room": {
    "id": "room-123",
    "name": "Meeting Room B",
    "capacity": 20,
    "status": "occupied"
  },
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T15:00:00Z",
  "participants": ["user-456", "user-789", "user-999"],
  "status": "confirmed",
  "createdAt": "2024-01-15T13:30:00Z",
  "updatedAt": "2024-01-15T13:30:00Z"
}
```

**Error (409 Conflict - Room not available)**:
```json
{
  "error": "Room is not available during this time",
  "code": "ROOM_NOT_AVAILABLE",
  "conflictingAppointment": {
    "id": "apt-001",
    "title": "Existing Meeting",
    "startTime": "2024-01-15T14:30:00Z",
    "endTime": "2024-01-15T15:30:00Z"
  }
}
```

**Error (400 Bad Request - Invalid time)**:
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "time": ["Start time must be before end time"]
  }
}
```

**Implementation**:
```typescript
// Helper function: Check availability
async function isRoomAvailable(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      roomId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: { not: 'cancelled' },
      // Check for time overlap
      AND: [
        { startTime: { lt: endTime } },  // Existing starts before new ends
        { endTime: { gt: startTime } }   // Existing ends after new starts
      ]
    }
  });
  
  return !conflict;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, roomId, userId, startTime, endTime, participants } = req.body;
    
    // Validation
    const errors: Record<string, string[]> = {};
    
    if (!title || title.trim().length === 0) {
      errors.title = ['Title is required'];
    }
    
    if (!roomId) {
      errors.roomId = ['Room ID is required'];
    }
    
    if (!userId) {
      errors.userId = ['User ID is required'];
    }
    
    if (!startTime || !endTime) {
      errors.time = ['Start and end times are required'];
    } else {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        errors.time = ['Start time must be before end time'];
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }
    
    // Check room exists
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }
    
    // Check availability
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const available = await isRoomAvailable(roomId, start, end);
    if (!available) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          roomId,
          status: { not: 'cancelled' },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } }
          ]
        }
      });
      
      return res.status(409).json({
        error: 'Room is not available during this time',
        code: 'ROOM_NOT_AVAILABLE',
        conflictingAppointment: conflict
      });
    }
    
    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description: description || null,
        roomId,
        userId,
        startTime: start,
        endTime: end,
        participants: participants || [],
        status: 'confirmed'
      },
      include: { room: true }
    });
    
    // Publish event to RabbitMQ
    // await publishEvent('appointment.created', appointment);
    
    // Update room status
    await updateRoomStatus(roomId);
    
    res.status(201).json(appointment);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create appointment',
      code: 'DATABASE_ERROR'
    });
  }
});
```

---

### 3. GET /api/v1/appointments/:id - Get Specific Appointment

**Request**:
```http
GET /api/v1/appointments/apt-001
```

**Response (200 OK)**:
```json
{
  "id": "apt-001",
  "title": "Team Meeting",
  "description": "Weekly sync",
  "roomId": "room-123",
  "userId": "user-456",
  "room": {
    "id": "room-123",
    "name": "Meeting Room B",
    "capacity": 20,
    "location": "Building 2, First Floor"
  },
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "participants": ["user-456", "user-789"],
  "status": "confirmed",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

---

### 4. PATCH /api/v1/appointments/:id - Update Appointment

**Request**:
```http
PATCH /api/v1/appointments/apt-001
Content-Type: application/json

{
  "title": "Team Meeting - Updated",
  "endTime": "2024-01-15T12:00:00Z"
}
```

**Response (200 OK)**:
Updated appointment object

**Important**: If changing time/room, must re-check availability

---

### 5. DELETE /api/v1/appointments/:id - Cancel Appointment

**Request**:
```http
DELETE /api/v1/appointments/apt-001
```

**Response (204 No Content)**:
```
(empty body)
```

**Side effects**:
- Sets status to 'cancelled'
- Updates room status if no more active appointments
- Publishes 'appointment.cancelled' event

---

## Implementation Guide

### Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── config/
│   │   └── database.ts            # Prisma client setup
│   ├── services/
│   │   ├── room/
│   │   │   ├── controller.ts      # REST routes
│   │   │   ├── service.ts         # Business logic
│   │   │   └── schema.prisma      # DB models
│   │   └── appointment/
│   │       ├── controller.ts
│   │       ├── service.ts
│   │       └── validation.ts
│   ├── middleware/
│   │   ├── errorHandler.ts        # Error handling
│   │   └── logging.ts             # Request logging
│   └── utils/
│       ├── errors.ts              # Custom error classes
│       └── validators.ts          # Validation logic
├── prisma/
│   ├── schema.prisma              # ORM schema
│   └── migrations/                # Database migrations
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

### Step 1: Setup Express Server

```typescript
// backend/src/main.ts
import express from 'express';
import cors from 'cors';
import roomRouter from './services/room/controller';
import appointmentRouter from './services/appointment/controller';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173'], // Vite dev server
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/appointments', appointmentRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

const PORT =process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 2: Define Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Room {
  id            String   @id @default(uuid())
  name          String   @unique
  location      String?
  capacity      Int      @default(1)
  equipment     String[]
  status        RoomStatus @default(AVAILABLE)
  appointments  Appointment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
}

model Appointment {
  id            String   @id @default(uuid())
  title         String
  description   String?
  room          Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  roomId        String
  userId        String
  startTime     DateTime
  endTime       DateTime
  participants  String[]
  status        AppointmentStatus @default(CONFIRMED)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([roomId, startTime, endTime])
  @@index([roomId])
  @@index([userId])
  @@index([startTime])
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
}
```

### Step 3: Error Handling Middleware

```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, RoomNotAvailableError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details
    });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: `${err.resourceType} not found`,
      code: 'NOT_FOUND'
    });
  }
  
  if (err instanceof RoomNotAvailableError) {
    return res.status(409).json({
      error: 'Room is not available at this time',
      code: 'ROOM_NOT_AVAILABLE',
      conflictingAppointment: err.conflictingAppointment
    });
  }
  
  return res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR'
  });
}
```

---

## Testing REST APIs

### Using Postman/cURL

```bash
# Create room
curl -X POST http://localhost:4000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Room A","capacity":30}'

# Get all rooms
curl http://localhost:4000/api/v1/rooms

# Create appointment
curl -X POST http://localhost:4000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Meeting",
    "roomId":"room-id",
    "userId":"user-id",
    "startTime":"2024-01-15T10:00:00Z",
    "endTime":"2024-01-15T11:00:00Z"
  }'
```

### Jest Integration Tests

```typescript
// backend/tests/integration/rooms.test.ts
import request from 'supertest';
import { app } from '../../src/main';
import { prisma } from '../../src/config/database';

describe('Room Service', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterEach(async () => {
    // Clean up
    await prisma.appointment.deleteMany();
    await prisma.room.deleteMany();
  });

  describe('POST /api/v1/rooms', () => {
    it('should create a room', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({
          name: 'Test Room',
          capacity: 30
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Room');
      expect(response.body.status).toBe('available');
    });

    it('should reject duplicate name', async () => {
      await request(app)
        .post('/api/v1/rooms')
        .send({ name: 'Test Room', capacity: 30 });
      
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({ name: 'Test Room', capacity: 30 });
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('should prevent double-booking', async () => {
      // Create room
      const roomRes = await request(app)
        .post('/api/v1/rooms')
        .send({ name: 'Test Room', capacity: 30 });
      const roomId = roomRes.body.id;
      
      // Book appointment
      await request(app)
        .post('/api/v1/appointments')
        .send({
          title: 'Meeting 1',
          roomId,
          userId: 'user-1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z'
        });
      
      // Try overlapping booking
      const response = await request(app)
        .post('/api/v1/appointments')
        .send({
          title: 'Meeting 2',
          roomId,
          userId: 'user-2',
          startTime: '2024-01-15T10:30:00Z',
          endTime: '2024-01-15T11:30:00Z'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ROOM_NOT_AVAILABLE');
    });
  });
});
```

---

## Summary

REST APIs provide:
- ✅ Simple, stateless communication
- ✅ Standard HTTP methods
- ✅ Consistent error handling
- ✅ Easy to test and debug
- ✅ Browser-friendly (easy to test with cURL/Postman)

Your implementation should focus on:
1. **Stateless design** - Each request contains everything needed
2. **Proper status codes** - 2xx, 4xx, 5xx clearly indicate result
3. **Consistent response format** - Same structure for all endpoints
4. **Validation** - Check inputs before database operations
5. **Error details** - Help clients understand what went wrong
6. **Database constraints** - Prevent invalid state at DBMS level

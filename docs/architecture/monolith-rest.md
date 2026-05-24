# Monolith Architecture (REST First)

## Goal
Build a modular monolith backend with clear domain boundaries while keeping the frontend SPA unchanged.

## Recommended Architecture
- Deployment unit: one backend application (single deployable service)
- Internal design: module-per-domain with strict ownership
- API style: REST v1 under `/api/v1`
- Communication:
  - Sync: REST endpoints
  - Async (inside monolith now, external broker later): domain events

## Domain Boundaries

### Users
Owns identity profile and authorization context.
- Core responsibilities:
  - User profile (name, email, university id)
  - Role assignment (`student`, `staff`, `admin`)
  - Account state (`active`, `blocked`)
- Exposes:
  - Read/update own profile
  - Admin user listing and status changes

### Rooms
Owns room metadata and equipment catalog.
- Core responsibilities:
  - Room identity and location (building, floor)
  - Capacity, type, equipment
  - Room lifecycle state (`active`, `maintenance`, `archived`)
- Exposes:
  - Search/list rooms with filters
  - Room detail by id

### Bookings
Owns reservation lifecycle and business rules.
- Core responsibilities:
  - Create/cancel/confirm booking
  - Conflict prevention (no overlapping reservations)
  - Booking status transitions
- Exposes:
  - Booking CRUD-style commands/queries
  - User bookings history

### Availability
Owns computed free/occupied intervals and slot views.
- Core responsibilities:
  - Read model generated from rooms + bookings (+ maintenance blocks)
  - Time-window checks for a room
  - Search-oriented availability responses
- Exposes:
  - `GET /availability` for one room/time window
  - `GET /rooms/available` for filtered lists

### Notifications
Owns user-facing messages triggered by domain events.
- Core responsibilities:
  - Create notifications on booking events
  - Read/unread state per user
  - Delivery metadata (in-app now; email/sms later)
- Exposes:
  - List user notifications
  - Mark as read

## Ownership Rules
- Users module is source of truth for roles and account status.
- Rooms module is source of truth for room metadata.
- Bookings module is source of truth for reservation states.
- Availability never writes booking state; it only computes read models.
- Notifications never decides booking rules; it reacts to booking events.

## Core Flows
1. Search and reserve
- Client calls Rooms + Availability endpoints.
- Client submits Booking create command.
- Booking module validates conflicts and writes booking.
- BookingCreated event is emitted.
- Notifications module stores confirmation notification.

2. Cancel booking
- Client calls booking cancel endpoint.
- Booking status transitions to cancelled.
- BookingCancelled event is emitted.
- Availability projection updates automatically.

## Cross-Cutting Standards
- Auth: JWT bearer token
- Validation: request DTO validation at controller boundary
- Error model: RFC7807-style problem response
- Observability: request id + structured logs + metrics
- Idempotency: `Idempotency-Key` required on booking creation

## Access Control (RBAC)
- Roles: `student`, `staff`, `admin`
- Default policy: all `/api/v1` endpoints require authenticated users unless explicitly marked public (`/auth/login`, `/auth/refresh`).
- Permission model:
  - `student`: self-profile, room search, availability, own bookings, notifications
  - `staff`: student permissions + booking confirmation
  - `admin`: full user and room administration + all booking actions
- Enforcement points:
  - API layer enforces JWT authentication
  - Controller guards enforce role checks
  - Service layer enforces ownership checks (for example booking owner)

## Evolution Path
- Step 1: Keep single database with table ownership by module.
- Step 2: Introduce message broker for events when real-time features grow.
- Step 3: Split modules into services only when team/scale requires it.

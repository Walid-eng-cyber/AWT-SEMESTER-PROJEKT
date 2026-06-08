# Resource Model and Versioned Endpoints (v1)

## Versioning Approach
- All public endpoints are namespaced under `/api/v1`.
- Non-breaking changes are additive inside v1 (for example: new optional fields, new query filters, new endpoints).
- Breaking changes require a new major path (for example `/api/v2`).

## Authentication and Authorization
- Authentication mechanism: JWT bearer access token.
- Token refresh flow: short-lived access token + refresh token rotation.
- API default: authenticated endpoints under `/api/v1`.
- Public endpoints:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`

### Roles
- `student`: creates and manages own appointments, reads rooms and availability.
- `staff`: has student capabilities plus appointment confirmation operations.
- `admin`: full access including user and room administration.

### RBAC Matrix (v1)
- Users
  - `GET /users/me`, `PATCH /users/me`: student, staff, admin
  - `GET /users`, `GET /users/{userId}`, `PATCH /users/{userId}`: admin
- Rooms
  - `GET /rooms`, `GET /rooms/{roomId}`, `GET /rooms/available`: student, staff, admin
  - `POST /rooms`, `PATCH /rooms/{roomId}`: admin
- Appointments
  - `GET /appointments`, `GET /appointments/{appointmentId}`, `POST /appointments`, `POST /appointments/{appointmentId}/cancel`: student, staff, admin
  - `POST /appointments/{appointmentId}/confirm`: staff, admin
- Availability
  - `GET /availability`: student, staff, admin
- Notifications
  - `GET /notifications`, `POST /notifications/{notificationId}/read`: student, staff, admin

## Resource Model

### User
Represents a person account in the system.
- Identity fields: `id`, `email`, `universityId`
- Profile fields: `fullName`
- Access fields: `role`, `status`
- Relationships:
  - One user can own many appointments.
  - One user can receive many notifications.

### Room
Represents a bookable physical space.
- Identity fields: `id`, `name`
- Location fields: `building`, `floor`
- Capacity fields: `seats`
- Classification fields: `type`, `equipment`, `status`
- Relationships:
  - One room can have many appointments over time.
  - Availability is derived from room + appointments.

### Appointment
Represents a reservation of a room for a time range.
- Identity fields: `id`
- Foreign keys: `roomId`, `userId`
- Schedule fields: `startsAt`, `endsAt`
- Business fields: `purpose`, `status`, `createdAt`
- Relationships:
  - Each appointment belongs to one room and one user.

#### Appointment lifecycle rules
- Create:
  - Initial status is `pending`.
  - `endsAt` must be strictly greater than `startsAt`.
  - Create request is idempotent via `Idempotency-Key`.
- Confirm:
  - Allowed only for `staff` and `admin`.
  - Transition allowed only from `pending` to `confirmed`.
- Cancel:
  - Allowed for appointment owner, `staff`, or `admin`.
  - Transitions allowed from `pending` or `confirmed` to `cancelled`.
- Conflict checks:
  - Appointment is rejected when same room has overlapping non-cancelled appointment.
  - Overlap rule: `[a.start, a.end)` overlaps `[b.start, b.end)` iff `a.start < b.end` and `b.start < a.end`.

### AvailabilityWindow
Read-model resource for scheduling decisions.
- Identity fields: `roomId`
- Window fields: `from`, `to`
- Projection fields: `slots[]` with `state` in `free|occupied|maintenance`
- Relationships:
  - Computed from room status and appointments.

### Notification
Represents an in-app user message.
- Identity fields: `id`, `userId`
- Content fields: `type`, `title`, `message`
- State fields: `read`, `createdAt`
- Relationships:
  - Each notification belongs to exactly one user.

### AuthTokens
Represents login/refresh response payload.
- Security fields: `accessToken`, `refreshToken`, `expiresIn`, `tokenType`
- Context fields: embedded `user`

## Endpoint Design by Resource (v1)

### Users
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users`
- `GET /api/v1/users/{userId}`
- `PATCH /api/v1/users/{userId}`

### Rooms
- `GET /api/v1/rooms`
- `POST /api/v1/rooms`
- `GET /api/v1/rooms/{roomId}`
- `PATCH /api/v1/rooms/{roomId}`
- `GET /api/v1/rooms/available`

### Appointments
- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `GET /api/v1/appointments/{appointmentId}`
- `POST /api/v1/appointments/{appointmentId}/confirm`
- `POST /api/v1/appointments/{appointmentId}/cancel`

### Availability
- `GET /api/v1/availability`

### Notifications
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{notificationId}/read`

## Endpoint Conventions
- Pagination: `page`, `pageSize`
- Filtering: query params per resource (`building`, `type`, `status`, time window)
- Error model: RFC7807-like `ProblemDetails`
- Idempotency: required `Idempotency-Key` for appointment creation

## State Transitions
- Appointment transitions:
  - `pending -> confirmed`
  - `pending|confirmed -> cancelled`
- Notification transitions:
  - `read: false -> true`

## Appointment Error Semantics
- `400 Bad Request`: invalid time range (`endsAt <= startsAt`) or malformed timestamps.
- `403 Forbidden`: role/ownership violation (for example student confirms appointment not allowed).
- `409 Conflict`: overlapping appointment or invalid lifecycle transition.

## Compatibility Rules
- Do not remove or rename fields in v1 once released.
- Do not change field data types in v1.
- Add only optional fields/endpoints in v1.
- Introduce `/api/v2` for breaking redesign.

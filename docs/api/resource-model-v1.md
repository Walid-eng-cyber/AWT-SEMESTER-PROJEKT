# Resource Model and Versioned Endpoints (v1)

## Versioning Approach
- All public endpoints are namespaced under `/api/v1`.
- Non-breaking changes are additive inside v1 (for example: new optional fields, new query filters, new endpoints).
- Breaking changes require a new major path (for example `/api/v2`).

## Resource Model

### User
Represents a person account in the system.
- Identity fields: `id`, `email`, `universityId`
- Profile fields: `fullName`
- Access fields: `role`, `status`
- Relationships:
  - One user can own many bookings.
  - One user can receive many notifications.

### Room
Represents a bookable physical space.
- Identity fields: `id`, `name`
- Location fields: `building`, `floor`
- Capacity fields: `seats`
- Classification fields: `type`, `equipment`, `status`
- Relationships:
  - One room can have many bookings over time.
  - Availability is derived from room + bookings.

### Booking
Represents a reservation of a room for a time range.
- Identity fields: `id`
- Foreign keys: `roomId`, `userId`
- Schedule fields: `startsAt`, `endsAt`
- Business fields: `purpose`, `status`, `createdAt`
- Relationships:
  - Each booking belongs to one room and one user.

### AvailabilityWindow
Read-model resource for scheduling decisions.
- Identity fields: `roomId`
- Window fields: `from`, `to`
- Projection fields: `slots[]` with `state` in `free|occupied|maintenance`
- Relationships:
  - Computed from room status and bookings.

### Notification
Represents an in-app user message.
- Identity fields: `id`, `userId`
- Content fields: `type`, `title`, `message`
- State fields: `read`, `createdAt`
- Relationships:
  - Each notification belongs to exactly one user.

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

### Bookings
- `GET /api/v1/bookings`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings/{bookingId}`
- `POST /api/v1/bookings/{bookingId}/confirm`
- `POST /api/v1/bookings/{bookingId}/cancel`

### Availability
- `GET /api/v1/availability`

### Notifications
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{notificationId}/read`

## Endpoint Conventions
- Pagination: `page`, `pageSize`
- Filtering: query params per resource (`building`, `type`, `status`, time window)
- Error model: RFC7807-like `ProblemDetails`
- Idempotency: required `Idempotency-Key` for booking creation

## State Transitions
- Booking transitions:
  - `pending -> confirmed`
  - `pending|confirmed -> cancelled`
- Notification transitions:
  - `read: false -> true`

## Compatibility Rules
- Do not remove or rename fields in v1 once released.
- Do not change field data types in v1.
- Add only optional fields/endpoints in v1.
- Introduce `/api/v2` for breaking redesign.

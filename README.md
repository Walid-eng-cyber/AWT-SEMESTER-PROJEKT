# AWT Room Booking

Frontend SPA for room discovery and booking at Hochschule Mainz, now documented for a REST-first modular monolith backend.

## Current Status
- Frontend SPA is implemented with React + Vite + TypeScript + Tailwind.
- Backend implementation is starting with explicit domain boundaries.
- REST v1 contract is defined and ready for backend endpoint development.

## Architecture Decision
We use a modular monolith architecture.

Why:
- Fast delivery for a small team.
- Clear domain ownership without early microservice complexity.
- Easy migration path to microservices if scale requires it.

Architecture document:
- docs/architecture/monolith-rest.md

## Domain Boundaries (v1)
- Users: identity profile and role context.
- Rooms: room metadata, location, equipment, lifecycle status.
- Bookings: reservation lifecycle and conflict validation.
- Availability: computed free/occupied windows and search views.
- Notifications: user-facing messages triggered by booking events.

REST contract:
- docs/api/openapi.v1.yaml

## REST Client Scaffolding (Frontend)
Typed API contracts and services are created under:
- src/api/contracts.ts
- src/api/endpoints.ts
- src/api/http.ts
- src/api/services/
- src/api/index.ts

This gives the SPA a stable integration layer while backend endpoints are implemented.

## Run the Frontend
1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

## Next Backend Steps
1. Implement Users, Rooms, Bookings, Availability, Notifications modules in one backend app.
2. Follow the OpenAPI contract for controllers and DTO validation.
3. Add booking conflict checks and idempotency for create booking.
4. Emit booking events and persist notifications.

## Project Objective
Deliver a reliable room booking platform with a strong monolith foundation, then evolve into GraphQL gateway and realtime messaging when core REST flows are stable.

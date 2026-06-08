# Backend Basis (Express + Prisma + PostgreSQL)

Dieser Ordner enthaelt die Backend-Basis fuer das Semesterprojekt.

## Enthalten
- Express-Server (TypeScript)
- Prisma-Setup mit PostgreSQL
- Initiales Datenbankschema (Room, Appointment)
- Erste SQL-Migration
- Docker-Compose fuer lokale PostgreSQL-Instanz

## Schnellstart
1. Abhaengigkeiten installieren
```bash
cd backend
npm install
```

2. Umgebungsvariablen setzen
```bash
cp .env.example .env
```

3. PostgreSQL starten
```bash
docker compose up -d
```

4. Prisma Client generieren
```bash
npm run prisma:generate
```

5. Migration anwenden
```bash
npm run prisma:deploy
```

6. Backend starten
```bash
npm run dev
```

## API Check
Health-Endpunkt:
- GET http://localhost:4000/api/v1/health

## GraphQL Gateway
GraphQL Endpoint:
- POST http://localhost:4000/graphql

## Realtime (WebSocket)
WebSocket Endpoint:
- ws://localhost:4000/ws

Eventtypen:
- room.status.changed
- appointment.created
- appointment.updated
- appointment.deleted

Payload-Metadaten (alle Events):
- eventVersion: 1
- schemaVersion: v1

Hinweis:
- Bei Verbindung sendet der Server einmalig `system.connected`.

Beispiel-Query: freie Raeume im Zeitfenster

```graphql
query FreeRooms($from: String!, $to: String!) {
	freeRooms(from: $from, to: $to) {
		id
		name
		location
		status
	}
}
```

Beispiel-Query: alle Raeume mit naechsten Terminen

```graphql
query RoomsWithNext {
	roomsWithNextAppointments(limitPerRoom: 1) {
		room {
			id
			name
		}
		nextAppointments {
			id
			title
			startsAt
			endsAt
		}
	}
}
```

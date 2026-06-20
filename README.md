# AWT Roombooking Plattform

## Überblick
Die Anwendung ist eine Campus-Plattform zur Raumverwaltung und Buchung an der Hochschule Mainz.

Hauptfunktionen:
- Raumübersicht mit Filterung und Details
- Erstellen, Bestätigen und Stornieren von Buchungen
- Rollenbasierter Zugriff (Student, Staff, Admin)
- Realtime-Updates für Raum- und Buchungsänderungen
- GraphQL-Abfragen für zusammengesetzte Datenansichten
- Event- und Support-Seiten im Frontend

## Architektur in Kurzform
- Frontend: SPA im Ordner src
- Backend: Express-Server im Ordner backend/src
- Datenbank: PostgreSQL mit Prisma-Migrationen im Ordner backend/prisma
- Messaging: RabbitMQ-basierte Event-Verarbeitung im Ordner backend/src/messaging und backend/src/notifications

## Verwendete Technologien und Einsatzorte

### TypeScript
- Durchgehend in Frontend und Backend verwendet.
- Frontend-Beispiele: src/App.tsx, src/pages, src/components
- Backend-Beispiele: backend/src/server.ts, backend/src/routes, backend/src/services

### React
- Basis des Frontends als Single Page Application.
- Verwendet für Routing, Seiten, Komponenten und State-Handling.
- Einsatzorte: src/App.tsx, src/pages, src/components

### Vite
- Build-Tool und Dev-Server für das Frontend.
- Einsatzort: vite.config.ts und npm-Skript dev im Root package.json

### Tailwind CSS
- Styling-System für UI-Komponenten und Seitenlayout.
- Einsatzorte: src/index.css sowie Klassen direkt in TSX-Komponenten

### React Router
- Clientseitiges Routing innerhalb der SPA.
- Einsatzort: src/App.tsx und Link/Navigate-Nutzung in Seiten und Layout-Komponenten

### Node.js + Express
- HTTP-API und zentrale Backend-Laufzeit.
- Einsatzorte: backend/src/app.ts, backend/src/server.ts, backend/src/routes

### Prisma ORM
- Datenzugriff, Schema-Verwaltung und Migrationen.
- Einsatzorte: backend/prisma/schema.prisma, backend/prisma/migrations, backend/src/db/client.ts

### PostgreSQL
- Persistente relationale Datenbank für Räume, Nutzer, Buchungen und Benachrichtigungen.
- Infrastruktur: backend/docker-compose.yml
- Verbindung über DATABASE_URL in backend/.env

### REST API
- Standardisierte Endpunkte unter /api/v1 für Auth, Räume, Buchungen, Verfügbarkeit und Benachrichtigungen.
- Einsatzorte: backend/src/routes und backend/src/services

### GraphQL
- Zusätzliche flexible Abfrageschicht für kombinierte Datenansichten.
- Einsatzort: backend/src/graphql/gateway.ts
- Endpoint: /graphql

### WebSocket
- Echtzeit-Kommunikation für Live-Events im Frontend.
- Einsatzorte: backend/src/realtime/ws-server.ts und frontendseitige Realtime-Integration in src/realtime

### RabbitMQ Messaging
- Event-Driven-Kommunikation für entkoppelte Nebenprozesse (z. B. Notifications).
- Einsatzorte: backend/src/messaging, backend/src/notifications, backend/src/workers/notifications-consumer.ts
- Infrastruktur: backend/docker-compose.yml

### JWT + Auth/RBAC
- Authentifizierung per Token und Autorisierung per Rollen.
- Einsatzorte: backend/src/auth, backend/src/middleware/auth.ts, geschützte Frontend-Routen in src/App.tsx

### Zod
- Laufzeitvalidierung von Requests und Konfiguration.
- Einsatzorte: backend/src/config/env.ts, backend/src/services und Routen-Validierungen

### Vitest
- Integrationstests für Backend-Flows.
- Einsatzorte: backend/tests/integration, backend/vitest.config.ts

### Docker Compose
- Lokale Infrastruktur für PostgreSQL und RabbitMQ.
- Einsatzort: backend/docker-compose.yml

## Start der Anwendung

### Frontend
1. Im Projektroot Abhängigkeiten installieren: npm install
2. Dev-Server starten: npm run dev

### Backend
1. In backend wechseln und Abhängigkeiten installieren: npm install
2. Infrastruktur starten: docker compose up -d
3. Prisma-Client generieren: npm run prisma:generate
4. Migrationen anwenden: npm run prisma:deploy
5. Backend starten: npm run dev

Optional für Messaging-Consumer:
- npm run notifications:consumer

# Semesterprojekt Campus Interaction Platform
## Arbeitsbericht und Detailerklärung
### Stand vom 04.06.2026

---

# Ziel der heutigen Arbeit

- Von einer reinen Vertrags- und Frontend-Basis zu einer echten lauffähigen Backend-Basis wechseln.
- PostgreSQL und Migrationen real aufsetzen.
- Room und Appointment serverseitig als REST implementieren.
- Konfliktprüfung bei Terminüberschneidungen produktiv umsetzen.
- Direkt danach ein GraphQL-Gateway auf die REST-Endpunkte setzen.
- API-Dokumentation auf den real implementierten Stand bringen.

Warum:
- Damit das Projekt nicht nur auf Papier existiert, sondern technisch nachweisbar ausführbar ist.
- Damit die späteren Teile (WebSocket, Messaging, Tests) auf einer stabilen Basis aufbauen.

---

# Ausgangslage vor dem Start

Vorhanden war:
- Frontend-SPA.
- API-Design und Architektur-Dokumentation.
- Client-seitige Service-Struktur.

Nicht vorhanden war:
- Laufender Backend-Server für Room und Appointment.
- Reale Datenpersistenz mit Migrationen.
- Reale Konfliktprüfung gegen eine Datenbank.
- GraphQL-Layer, der echte REST-Daten aggregiert.

Wichtige Referenzen vor der Umsetzung:
- [docs/api/openapi.v1.yaml](docs/api/openapi.v1.yaml)
- [docs/api/resource-model-v1.md](docs/api/resource-model-v1.md)
- [docs/architecture/monolith-rest.md](docs/architecture/monolith-rest.md)

---

# Architekturansatz heute

Entscheidung:
- Backend als eigenständiges Modul im selben Repository unter [backend](backend).

Warum genau so:
- Das bestehende Frontend bleibt stabil und wird nicht durch Backend-Tooling beeinflusst.
- Klare Trennung zwischen UI-Code und Server-Code.
- Schneller Start Richtung modularer Monolith ohne sofortige Repo-Aufspaltung.

Ergebnis:
- Vollständiges Backend-Basisscaffold inklusive Build, Runtime, DB, Migration und API-Routen.

---

# Schritt 1: Backend-Basis erstellt

Neu angelegt:
- [backend/package.json](backend/package.json)
- [backend/tsconfig.json](backend/tsconfig.json)
- [backend/src/server.ts](backend/src/server.ts)
- [backend/src/app.ts](backend/src/app.ts)
- [backend/src/routes/index.ts](backend/src/routes/index.ts)
- [backend/src/routes/health.ts](backend/src/routes/health.ts)
- [backend/src/config/env.ts](backend/src/config/env.ts)
- [backend/src/db/client.ts](backend/src/db/client.ts)

Wie es funktioniert:
- Express startet unter Port 4000.
- Prisma-Client verbindet zur Datenbank.
- API hängt unter /api/v1.
- Health-Endpoint prüft Grundfunktionalität.

Warum wichtig:
- Ohne stabile Serverbasis kann keine REST- oder GraphQL-Logik verlässlich implementiert werden.

---

# Schritt 2: PostgreSQL + Migrationen umgesetzt

Neu angelegt:
- [backend/docker-compose.yml](backend/docker-compose.yml)
- [backend/.env.example](backend/.env.example)
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/prisma/migrations/202606040001_init/migration.sql](backend/prisma/migrations/202606040001_init/migration.sql)

Datenmodell heute:
- Room mit Feldern für Name, Location, Capacity, Equipment, Status.
- Appointment mit Feldern für Titel, Zeitfenster, Teilnehmer, Status, Room-Relation.
- Enums für RoomStatus und AppointmentStatus.

Wichtiger technischer Fix:
- Host-Port für Postgres auf 5433 gelegt, weil lokal bereits ein anderer Dienst 5432 belegte.

Warum wichtig:
- Persistenz ist Pflicht in der Aufgabenstellung.
- Migrationen machen das Schema reproduzierbar und versionierbar.

---

# Schritt 3: Fehler- und Request-Grundlagen

Neu angelegt:
- [backend/src/lib/api-error.ts](backend/src/lib/api-error.ts)
- [backend/src/lib/async-handler.ts](backend/src/lib/async-handler.ts)
- [backend/src/middleware/error-handler.ts](backend/src/middleware/error-handler.ts)

Wie es funktioniert:
- Einheitliche API-Fehler mit Statuscodes.
- Asynchrone Routen werfen Fehler sauber in zentrale Middleware.
- Zod-Validierungsfehler werden als 400 zurückgegeben.

Warum wichtig:
- Konsistentes Fehlerverhalten ist Kern von robusten REST-Services.
- Vereinfacht Debugging und spätere Integrationstests.

---

# Schritt 4: Room REST serverseitig implementiert

Neu angelegt:
- [backend/src/services/room-service.ts](backend/src/services/room-service.ts)
- [backend/src/routes/rooms.ts](backend/src/routes/rooms.ts)

Implementierte Endpunkte:
- GET /api/v1/rooms
- GET /api/v1/rooms/:id
- POST /api/v1/rooms
- PATCH /api/v1/rooms/:id
- PATCH /api/v1/rooms/:id/status
- DELETE /api/v1/rooms/:id

Wie es funktioniert:
- Validierung über Zod.
- Persistenz über Prisma.
- Filter für location, status, minCapacity.

Warum wichtig:
- Deckt den Kernteil Raumverwaltung aus der Aufgabenstellung ab.
- Statuspflege ist Basis für spätere Live-Updates.

---

# Schritt 5: Appointment REST serverseitig implementiert

Neu angelegt:
- [backend/src/services/appointment-service.ts](backend/src/services/appointment-service.ts)
- [backend/src/routes/appointments.ts](backend/src/routes/appointments.ts)

Implementierte Endpunkte:
- GET /api/v1/appointments
- GET /api/v1/appointments/:id
- POST /api/v1/appointments
- PATCH /api/v1/appointments/:id
- DELETE /api/v1/appointments/:id

Wie es funktioniert:
- Zeitbereich wird validiert: endsAt muss größer als startsAt sein.
- Room-Existenz wird vor Terminoperationen geprüft.
- Update darf partielle Felder enthalten.

Warum wichtig:
- Terminverwaltung ist der zweite Pflicht-REST-Service.
- Serverlogik ist jetzt real und nicht nur dokumentiert.

---

# Schritt 6: Konfliktprüfung umgesetzt

Konfliktregel:
- Zwei nicht-cancelled Termine im selben Raum dürfen sich zeitlich nicht überschneiden.

Overlap-Logik:
- Konflikt liegt vor, wenn startsAt alt kleiner endsAt neu und startsAt neu kleiner endsAt alt.

Wo umgesetzt:
- [backend/src/services/appointment-service.ts](backend/src/services/appointment-service.ts)

Wichtiger Detailpunkt:
- Für Filterung und Verfügbarkeitsberechnung wurde die Zeitfensterlogik korrigiert, damit echte Überlappungen korrekt gefunden werden.

Warum wichtig:
- Das ist ein zentrales Bewertungskriterium und fachlich essenziell für Buchungssysteme.

---

# Schritt 7: GraphQL-Gateway auf REST gesetzt

Neu angelegt:
- [backend/src/graphql/gateway.ts](backend/src/graphql/gateway.ts)

An Server angebunden in:
- [backend/src/server.ts](backend/src/server.ts)

GraphQL-Endpunkt:
- POST /graphql auf Port 4000

Implementierte Query-Beispiele:
- rooms
- room
- appointments
- appointment
- roomsWithNextAppointments
- appointmentsByRoom
- freeRooms

Implementierte Mutations:
- createRoom
- createAppointment

Wie es funktioniert:
- Resolver rufen intern die REST-Endpunkte auf.
- Aggregation passiert im Gateway.
- Dadurch bleiben REST-Services klar getrennt und GraphQL liefert zusammengesetzte Sichten.

Warum wichtig:
- Erfüllt den geforderten GraphQL-Teil in einer sauberen, nachvollziehbaren Integrationsform.

---

# Schritt 8: API-Vertrag auf Realität abgeglichen

Aktualisiert:
- [docs/api/openapi.v1.yaml](docs/api/openapi.v1.yaml)

Was angepasst wurde:
- Dokumentiert sind jetzt die tatsächlich implementierten Endpunkte.
- Health, Rooms, Appointments und GraphQL-Bridge sind abgebildet.
- Fehlerfälle für Bad Request, Not Found, Conflict sind enthalten.

Warum wichtig:
- Doku und Code dürfen nicht auseinanderlaufen.
- Für Demo, Tests und Teamarbeit ist ein realitätsnaher Vertrag entscheidend.

---

# Laufende Verifikation heute

Durchgeführt:
- Build-Validierung Backend erfolgreich.
- Prisma-Schema validiert.
- Migration erfolgreich deployed.
- REST Smoke-Tests erfolgreich (Health, Room anlegen, Appointment anlegen).
- Konflikttest erfolgreich (überlappender Termin wird nicht akzeptiert).
- GraphQL Smoke-Tests erfolgreich (inklusive aggregierter Queries).

Wozu diese Checks:
- Sicherstellen, dass nicht nur Dateien existieren, sondern die Funktionalität wirklich läuft.

---

# Wesentliche Entscheidungen und Gründe

Warum Express + Prisma + PostgreSQL:
- Sehr schneller Start mit klarer TypeScript-Integration.
- Prisma reduziert Boilerplate für Datenzugriffe und Migrationen.
- PostgreSQL passt fachlich und technisch gut zum Projekt.

Warum GraphQL als Gateway statt direkt DB:
- Entkoppelt GraphQL von Persistenzdetails.
- Aggregation bleibt auf API-Ebene nachvollziehbar.
- REST bleibt als stabile Service-Schnittstelle bestehen.

Warum zuerst Backend-Basis und DB:
- Folgeschritte wie WebSocket, Messaging und Integrationstests benötigen stabile Persistenz und verlässliche Domänenlogik.

---

# Was noch offen ist

Nächste technische Schritte:
- WebSocket-Echtzeitupdates bei Raumstatus- und Terminänderungen.
- Messaging-Integration (RabbitMQ oder Kafka) plus Notification-Consumer.
- Integrationstests End-to-End über REST, GraphQL und später WebSocket/Messaging.
- Feinschliff von Auth/Rollen als echte Runtime-Guards im Backend.

Dokumentation offen:
- ADRs finalisieren.
- Architekturdiagramm ergänzen.
- Testdokumentation und Deployment-Guide erweitern.

---

# Relevante Dateien für Review

Backend Kern:
- [backend/src/server.ts](backend/src/server.ts)
- [backend/src/app.ts](backend/src/app.ts)
- [backend/src/routes/index.ts](backend/src/routes/index.ts)

REST Services:
- [backend/src/routes/rooms.ts](backend/src/routes/rooms.ts)
- [backend/src/routes/appointments.ts](backend/src/routes/appointments.ts)
- [backend/src/services/room-service.ts](backend/src/services/room-service.ts)
- [backend/src/services/appointment-service.ts](backend/src/services/appointment-service.ts)

GraphQL:
- [backend/src/graphql/gateway.ts](backend/src/graphql/gateway.ts)

Datenbank:
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/prisma/migrations/202606040001_init/migration.sql](backend/prisma/migrations/202606040001_init/migration.sql)
- [backend/docker-compose.yml](backend/docker-compose.yml)

Vertrag und Architektur:
- [docs/api/openapi.v1.yaml](docs/api/openapi.v1.yaml)
- [docs/api/resource-model-v1.md](docs/api/resource-model-v1.md)
- [docs/architecture/monolith-rest.md](docs/architecture/monolith-rest.md)

---

# Abschluss

Heute wurde der entscheidende Sprung von Design zu ausführbarer Plattform gemacht:
- Persistenz ist real.
- REST ist real.
- Konfliktprüfung ist real.
- GraphQL-Aggregation ist real.

Damit ist die Basis gelegt, um im nächsten Schritt Echtzeit und Messaging sauber zu integrieren.

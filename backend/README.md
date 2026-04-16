# Campus Interaction Platform - Backend

Express.js + TypeScript + PostgreSQL + Prisma

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                     # Express server entry point
│   ├── middleware/
│   │   └── errorHandler.ts         # Error handling & 404 middleware
│   ├── services/
│   │   ├── room/
│   │   │   └── controller.ts       # Room CRUD endpoints
│   │   └── appointment/
│   │       └── controller.ts       # Appointment CRUD endpoints
│   └── utils/
│       └── errors.ts               # Custom error classes
├── prisma/
│   ├── schema.prisma               # Prisma database schema
│   └── migrations/                 # Database migrations
├── .env                            # Environment variables
├── docker-compose.yml              # Docker services (PostgreSQL, RabbitMQ)
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running
- PostgreSQL and RabbitMQ running (via docker-compose)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Start Services
```bash
# In one terminal, start PostgreSQL and RabbitMQ
docker-compose up -d

# Verify services are running
docker ps
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:4000`

## 📚 Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Build for production
npm build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🔌 Available Endpoints

### Health Check
```
GET /health
```

### Room Service
```
GET    /api/v1/rooms              # List all rooms
POST   /api/v1/rooms              # Create room
GET    /api/v1/rooms/:id          # Get room details
PATCH  /api/v1/rooms/:id          # Update room
DELETE /api/v1/rooms/:id          # Delete room
```

### Appointment Service
```
GET    /api/v1/appointments       # List all appointments
POST   /api/v1/appointments       # Create appointment
GET    /api/v1/appointments/:id   # Get appointment details
PATCH  /api/v1/appointments/:id   # Update appointment
DELETE /api/v1/appointments/:id   # Delete appointment
```

## 📋 Environment Variables

See `.env` file:
```
DATABASE_URL="postgresql://campus_user:campus_password@localhost:5432/campus_db"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
NODE_ENV="development"
PORT="4000"
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (clears data)
docker-compose down -v

# View logs
docker-compose logs postgres
docker-compose logs rabbitmq

# Access PostgreSQL
docker-compose exec postgres psql -U campus_user -d campus_db
```

## 🧪 Testing Endpoints

### Using cURL
```bash
# Get all rooms
curl http://localhost:4000/api/v1/rooms

# Create room
curl -X POST http://localhost:4000/api/v1/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Room A","capacity":30}'

# Create appointment
curl -X POST http://localhost:4000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Meeting",
    "roomId":"<room-id>",
    "userId":"user-123",
    "startTime":"2024-01-15T10:00:00Z",
    "endTime":"2024-01-15T11:00:00Z"
  }'
```

### Using Postman
1. Import the endpoints into Postman
2. Set `{{BASE_URL}}` to `http://localhost:4000`
3. Test each endpoint

## 🛠️ Prisma Commands

```bash
# Create new migration
npx prisma migrate dev --name add_new_field

# Reset database (DEV ONLY)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
npx prisma studio

# Generate Prisma Client (auto-run after migrations)
npx prisma generate

# View migration history
npx prisma migrate status
```

## 📚 Database Schema

### Rooms Table
- `id` UUID (primary key)
- `name` String (unique)
- `location` String
- `capacity` Integer
- `equipment` String[] (JSON array)
- `status` Enum: AVAILABLE | OCCUPIED
- `createdAt` Timestamp
- `updatedAt` Timestamp

### Appointments Table
- `id` UUID (primary key)
- `title` String
- `description` String
- `roomId` UUID (foreign key)
- `userId` String
- `startTime` Timestamp
- `endTime` Timestamp
- `participants` String[] (JSON array)
- `status` Enum: PENDING | CONFIRMED | CANCELLED
- `createdAt` Timestamp
- `updatedAt` Timestamp

## 🔒 Error Handling

All errors return consistent JSON format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional */ },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

Status codes:
- `200/201`: Success
- `400`: Validation error
- `404`: Not found
- `409`: Conflict (e.g., double-booking)
- `500`: Server error

## 🧬 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Messaging**: RabbitMQ (upcoming)
- **Real-time**: Socket.IO (upcoming)
- **GraphQL**: Apollo Server (upcoming)

## 📖 Next Steps

- [ ] Implement messaging/events (RabbitMQ)
- [ ] Add GraphQL Gateway (Apollo Server)
- [ ] Add WebSocket support (Socket.IO)
- [ ] Implement Notifications Service
- [ ] Add authentication/authorization
- [ ] Write unit and integration tests
- [ ] Set up CI/CD pipeline

## 🤝 Contributing

Follow the existing code style and structure. Each new feature should have:
- TypeScript types
- Error handling
- Input validation
- Database migrations (if schema changes)

## 📝 License

Part of Campus Interaction Platform project

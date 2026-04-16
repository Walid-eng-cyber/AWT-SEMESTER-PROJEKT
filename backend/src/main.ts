import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { PrismaClient } from '@prisma/client';
import roomRouter from './services/room/controller';
import appointmentRouter from './services/appointment/controller';

/**
 * Campus Interaction Platform - Backend Server
 * Express.js + TypeScript + Prisma
 */

const app = express();
const prisma = new PrismaClient();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend (Vite dev server on 5173)
app.use(
  cors({
    origin: [
      'http://localhost:5173',   // Vite dev server
      'http://localhost:3000',   // Alternative frontend
      'http://127.0.0.1:5173'
    ],
    credentials: true
  })
);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API v1 routes
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/appointments', appointmentRouter);

// Temporary: list available routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Campus Interaction Platform - Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      rooms: {
        list: 'GET /api/v1/rooms',
        create: 'POST /api/v1/rooms',
        detail: 'GET /api/v1/rooms/:id',
        update: 'PATCH /api/v1/rooms/:id',
        delete: 'DELETE /api/v1/rooms/:id'
      },
      appointments: {
        list: 'GET /api/v1/appointments',
        create: 'POST /api/v1/appointments',
        detail: 'GET /api/v1/appointments/:id',
        update: 'PATCH /api/v1/appointments/:id',
        delete: 'DELETE /api/v1/appointments/:id'
      },
      graphql: 'GET /graphql (coming soon)'
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║   Campus Interaction Platform - Backend Server            ║
╚════════════════════════════════════════════════════════════╝

  🚀 Server is running on http://localhost:${PORT}
  📊 Health check: http://localhost:${PORT}/health
  🔗 Environment: ${process.env.NODE_ENV || 'development'}

  📚 Next Steps:
     - Implement Room Service REST API
     - Implement Appointment Service REST API
     - Set up GraphQL Gateway
     - Add WebSocket support

      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;

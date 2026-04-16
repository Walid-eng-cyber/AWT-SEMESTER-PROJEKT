import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * Appointment Service API Routes
 * Base URL: /api/v1/appointments
 * 
 * Endpoints:
 * - GET  /              List all appointments
 * - POST /              Create new appointment
 * - GET  /:id           Get specific appointment
 * - PATCH /:id          Update appointment
 * - DELETE /:id         Delete appointment
 */

// ============================================================================
// GET /api/v1/appointments - List all appointments
// ============================================================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, userId, status, limit = '10', offset = '0' } = req.query;

    // Build filter
    const where: any = {};
    if (roomId) where.roomId = roomId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // Count total
    const total = await prisma.appointment.count({ where });

    // Fetch with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      skip: Number(offset),
      take: Number(limit),
      include: { room: true },
      orderBy: { startTime: 'asc' }
    });

    res.json({
      data: appointments,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/v1/appointments - Create new appointment
// ============================================================================
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, roomId, userId, startTime, endTime, participants } = req.body;

    // Validation
    const errors: Record<string, string[]> = {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = ['Title is required'];
    }

    if (!roomId) {
      errors.roomId = ['Room ID is required'];
    }

    if (!userId) {
      errors.userId = ['User ID is required'];
    }

    if (!startTime || !endTime) {
      errors.time = ['Start time and end time are required'];
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

    // Check availability (prevent double-booking)
    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflict = await prisma.appointment.findFirst({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Room is not available during this time',
        code: 'ROOM_NOT_AVAILABLE',
        conflictingAppointment: {
          id: conflict.id,
          title: conflict.title,
          startTime: conflict.startTime,
          endTime: conflict.endTime
        }
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
        status: 'CONFIRMED'
      },
      include: { room: true }
    });

    // TODO: Publish event to RabbitMQ
    // await publishEvent('appointment.created', appointment);

    // TODO: Update room status if all appointments at this time
    // await updateRoomStatus(roomId);

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/v1/appointments/:id - Get specific appointment
// ============================================================================
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND'
      });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PATCH /api/v1/appointments/:id - Update appointment
// ============================================================================
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, startTime, endTime, status } = req.body;

    // Check appointment exists
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND'
      });
    }

    // Validate updates
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;

    if (startTime !== undefined || endTime !== undefined) {
      const start = new Date(startTime || existing.startTime);
      const end = new Date(endTime || existing.endTime);

      if (start >= end) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { time: ['Start time must be before end time'] }
        });
      }

      // Check availability (if changing time)
      const conflict = await prisma.appointment.findFirst({
        where: {
          roomId: existing.roomId,
          id: { not: id },
          status: { not: 'CANCELLED' },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } }
          ]
        }
      });

      if (conflict) {
        return res.status(409).json({
          error: 'Room is not available during this time',
          code: 'ROOM_NOT_AVAILABLE',
          conflictingAppointment: {
            id: conflict.id,
            title: conflict.title,
            startTime: conflict.startTime,
            endTime: conflict.endTime
          }
        });
      }

      if (startTime !== undefined) updateData.startTime = start;
      if (endTime !== undefined) updateData.endTime = end;
    }

    if (status !== undefined) updateData.status = status;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { room: true }
    });

    // TODO: Publish event to RabbitMQ

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE /api/v1/appointments/:id - Delete appointment
// ============================================================================
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check exists
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'Appointment not found',
        code: 'APPOINTMENT_NOT_FOUND'
      });
    }

    // Delete appointment
    await prisma.appointment.delete({ where: { id } });

    // TODO: Publish event to RabbitMQ
    // await publishEvent('appointment.cancelled', { appointmentId: id });

    // TODO: Update room status

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

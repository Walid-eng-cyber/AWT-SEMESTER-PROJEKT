import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * Room Service API Routes
 * Base URL: /api/v1/rooms
 * 
 * Endpoints:
 * - GET  /              List all rooms
 * - POST /              Create new room
 * - GET  /:id           Get specific room
 * - PATCH /:id          Update room
 * - DELETE /:id         Delete room
 */

// ============================================================================
// GET /api/v1/rooms - List all rooms
// ============================================================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, capacity, location, limit = '10', offset = '0' } = req.query;

    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (capacity) where.capacity = { gte: Number(capacity) };
    if (location) where.location = { contains: location as string, mode: 'insensitive' };

    // Count total
    const total = await prisma.room.count({ where });

    // Fetch with pagination
    const rooms = await prisma.room.findMany({
      where,
      skip: Number(offset),
      take: Number(limit),
      include: { appointments: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      data: rooms,
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
// POST /api/v1/rooms - Create new room
// ============================================================================
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, location, capacity, equipment } = req.body;

    // Validation
    const errors: Record<string, string[]> = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = ['Name is required and must be a non-empty string'];
    }

    if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
      errors.capacity = ['Capacity is required and must be a positive number'];
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Check for duplicate name
    const existing = await prisma.room.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          name: ['Room name already exists. Please use a unique name.']
        }
      });
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        name,
        location: location || null,
        capacity,
        equipment: equipment || [],
        status: 'AVAILABLE'
      },
      include: { appointments: true }
    });

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/v1/rooms/:id - Get specific room
// ============================================================================
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: { appointments: true }
    });

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PATCH /api/v1/rooms/:id - Update room
// ============================================================================
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, equipment, status } = req.body;

    // Check room exists
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Validate updates
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { name: ['Name must be a non-empty string'] }
        });
      }
      // Check for duplicate (excluding current room)
      const duplicate = await prisma.room.findFirst({
        where: { name, id: { not: id } }
      });
      if (duplicate) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { name: ['Room name already exists'] }
        });
      }
      updateData.name = name;
    }

    if (location !== undefined) updateData.location = location;

    if (capacity !== undefined) {
      if (typeof capacity !== 'number' || capacity <= 0) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { capacity: ['Capacity must be a positive number'] }
        });
      }
      updateData.capacity = capacity;
    }

    if (equipment !== undefined) updateData.equipment = equipment;
    if (status !== undefined) updateData.status = status;

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
      include: { appointments: true }
    });

    res.json(room);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE /api/v1/rooms/:id - Delete room
// ============================================================================
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check exists
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND'
      });
    }

    // Delete
    await prisma.room.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

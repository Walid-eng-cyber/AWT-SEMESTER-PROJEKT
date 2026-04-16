/**
 * Custom Error Classes for Campus Interaction Platform
 */

export class ValidationError extends Error {
  constructor(public details: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(public resourceType: string, public resourceId: string) {
    super(`${resourceType} not found`);
    this.name = 'NotFoundError';
  }
}

export class RoomNotAvailableError extends Error {
  constructor(public conflictingAppointment?: any) {
    super('Room is not available at this time');
    this.name = 'RoomNotAvailableError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

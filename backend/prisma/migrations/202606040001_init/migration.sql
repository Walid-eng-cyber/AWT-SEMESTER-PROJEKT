-- Create enums
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');
CREATE TYPE "AppointmentStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- Create rooms
CREATE TABLE "Room" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create appointments
CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "roomId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "participants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "AppointmentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "Room_location_idx" ON "Room"("location");
CREATE INDEX "Room_status_idx" ON "Room"("status");
CREATE INDEX "Appointment_roomId_idx" ON "Appointment"("roomId");
CREATE INDEX "Appointment_startsAt_endsAt_idx" ON "Appointment"("startsAt", "endsAt");

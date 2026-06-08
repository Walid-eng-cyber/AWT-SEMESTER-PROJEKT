-- Add appointment ownership for runtime authorization checks.
ALTER TABLE "Appointment" ADD COLUMN "ownerUserId" TEXT;

UPDATE "Appointment"
SET "ownerUserId" = 'legacy-user'
WHERE "ownerUserId" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "ownerUserId" SET NOT NULL;

CREATE INDEX "Appointment_ownerUserId_idx" ON "Appointment"("ownerUserId");

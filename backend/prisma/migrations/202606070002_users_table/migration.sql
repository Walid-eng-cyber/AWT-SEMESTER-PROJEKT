CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

INSERT INTO "User" ("id", "email", "fullName", "role", "status")
SELECT DISTINCT
  a."ownerUserId" AS "id",
  CONCAT(a."ownerUserId", '@local.invalid') AS "email",
  'Imported User' AS "fullName",
  'student' AS "role",
  'active' AS "status"
FROM "Appointment" a
WHERE NOT EXISTS (
  SELECT 1
  FROM "User" u
  WHERE u."id" = a."ownerUserId"
);

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

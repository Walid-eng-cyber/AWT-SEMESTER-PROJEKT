-- Add persistent password hash support for user signup/login.
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT;

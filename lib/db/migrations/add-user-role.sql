-- Add role column to user table
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user' CHECK ("role" IN ('user', 'admin'));

-- Create an index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"("role");

-- Update specific users to admin (you'll need to manually set the email addresses)
-- Example: UPDATE "user" SET "role" = 'admin' WHERE "email" = 'admin@onco.bot';
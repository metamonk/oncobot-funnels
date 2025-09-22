-- Add role column to user table with default value 'user'
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' CHECK ("role" IN ('user', 'admin'));

-- Create an index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"("role");
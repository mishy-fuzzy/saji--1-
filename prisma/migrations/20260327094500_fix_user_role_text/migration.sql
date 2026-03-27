-- Ensure User.role is TEXT to match prisma/schema.prisma and avoid enum decode errors.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
      AND udt_name = 'UserRole'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'customer';
  END IF;
END
$$;

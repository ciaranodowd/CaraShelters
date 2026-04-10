-- ============================================================
-- Cara — Schema sync for application fields
-- ============================================================
--
-- IMPORTANT: The recommended way to apply this is via Prisma:
--
--   npx prisma db push
--
-- This syncs the full schema.prisma to your Supabase database.
-- It handles table creation, column additions, and enum creation
-- automatically and correctly.
--
-- ──────────────────────────────────────────────────────────
-- Why prisma db push is preferred here
-- ──────────────────────────────────────────────────────────
-- Prisma uses the exact model names as table names in PostgreSQL
-- (PascalCase, stored with double-quote identifiers).
-- The tables it creates are:
--   "AdoptionApplication", "AnimalPhoto", "Animal", etc.
--
-- If your database was created by Prisma, the table names match
-- the schema exactly. prisma db push will add only the missing
-- columns without touching existing data.
--
-- ──────────────────────────────────────────────────────────
-- If you prefer to run raw SQL manually
-- ──────────────────────────────────────────────────────────
-- First verify the table exists in your Supabase SQL editor:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
--
-- If "AdoptionApplication" is listed, run the statements below.
-- If it is NOT listed, run prisma db push instead — it will create
-- all tables from scratch including these columns.
-- ──────────────────────────────────────────────────────────

ALTER TABLE "AdoptionApplication"
  ADD COLUMN IF NOT EXISTS "applicationType"    TEXT    DEFAULT 'ADOPT',
  ADD COLUMN IF NOT EXISTS "rentOrOwn"          TEXT,
  ADD COLUMN IF NOT EXISTS "landlordPermission" BOOLEAN;

-- Backfill existing rows
UPDATE "AdoptionApplication"
  SET "applicationType" = 'ADOPT'
  WHERE "applicationType" IS NULL;

-- ──────────────────────────────────────────────────────────
-- AnimalPhoto: no schema change needed.
-- The "key" column now stores Supabase Storage paths instead
-- of UploadThing keys — the column definition is unchanged.
-- ──────────────────────────────────────────────────────────

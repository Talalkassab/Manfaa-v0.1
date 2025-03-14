-- Add the missing slug column to businesses table
ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a unique index on the slug column
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- Comment on column for documentation
COMMENT ON COLUMN public.businesses.slug IS 'Unique slug for business URLs, auto-generated from title'; 
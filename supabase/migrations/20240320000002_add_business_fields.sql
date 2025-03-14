-- Add missing columns to businesses table
ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS asking_price DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS reason_for_selling TEXT,
  ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'nda', 'private')),
  ADD COLUMN IF NOT EXISTS financial_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS general_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS operational_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses(location);
CREATE INDEX IF NOT EXISTS idx_businesses_asking_price ON public.businesses(asking_price);
CREATE INDEX IF NOT EXISTS idx_businesses_privacy_level ON public.businesses(privacy_level);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Comment on columns for documentation
COMMENT ON COLUMN public.businesses.location IS 'Business location (city, country)';
COMMENT ON COLUMN public.businesses.asking_price IS 'Asking price for the business in local currency';
COMMENT ON COLUMN public.businesses.reason_for_selling IS 'Reason for selling the business';
COMMENT ON COLUMN public.businesses.privacy_level IS 'Privacy level for business listing (public, nda, private)';
COMMENT ON COLUMN public.businesses.financial_info IS 'Financial information as JSONB (revenue, profit, etc.)';
COMMENT ON COLUMN public.businesses.general_info IS 'General information as JSONB (established year, etc.)';
COMMENT ON COLUMN public.businesses.operational_info IS 'Operational information as JSONB (employees, etc.)';
COMMENT ON COLUMN public.businesses.user_id IS 'User ID of the business owner (for auth)'; 
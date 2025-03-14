-- Create NDAs table for the NDA signing and tracking system
CREATE TABLE IF NOT EXISTS "public"."ndas" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "signed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "approved_at" TIMESTAMPTZ,
    "approved_by" UUID,
    "expires_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    "terms" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "validity_period" INTEGER DEFAULT 90,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_ndas_business_id" ON "public"."ndas" ("business_id");
CREATE INDEX IF NOT EXISTS "idx_ndas_user_id" ON "public"."ndas" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ndas_status" ON "public"."ndas" ("status");

-- Add RLS policies
ALTER TABLE "public"."ndas" ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own NDAs and NDAs for businesses they own
CREATE POLICY "Users can view their own NDAs" 
ON "public"."ndas" 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = business_id AND businesses.owner_id = auth.uid()
  )
);

-- Allow users to insert NDAs for businesses (with a check that they are not the business owner)
CREATE POLICY "Users can sign NDAs"
ON "public"."ndas"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only business owners can approve NDAs
CREATE POLICY "Business owners can approve NDAs"
ON "public"."ndas"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = business_id AND businesses.owner_id = auth.uid()
  )
);

-- Create business_interests table for tracking user interest in businesses
CREATE TABLE IF NOT EXISTS "public"."business_interests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'nda_signed', 'negotiating', 'purchased')),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(business_id, user_id)
);

-- Create indexes for business_interests
CREATE INDEX IF NOT EXISTS "idx_business_interests_business_id" ON "public"."business_interests" ("business_id");
CREATE INDEX IF NOT EXISTS "idx_business_interests_user_id" ON "public"."business_interests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_business_interests_status" ON "public"."business_interests" ("status");

-- Add RLS policies for business_interests
ALTER TABLE "public"."business_interests" ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own interests
CREATE POLICY "Users can view their own interests" 
ON "public"."business_interests" 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow business owners to see interests in their businesses
CREATE POLICY "Business owners can view interests in their businesses" 
ON "public"."business_interests" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = business_id AND businesses.owner_id = auth.uid()
  )
);

-- Allow users to insert/update their own interests
CREATE POLICY "Users can manage their own interests"
ON "public"."business_interests"
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE "public"."ndas" IS 'Stores non-disclosure agreements between users and businesses';
COMMENT ON TABLE "public"."business_interests" IS 'Tracks user interest in businesses'; 
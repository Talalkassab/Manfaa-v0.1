-- Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    address TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own businesses"
    ON public.businesses
    FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create businesses"
    ON public.businesses
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own businesses"
    ON public.businesses
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own businesses"
    ON public.businesses
    FOR DELETE
    USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all businesses"
    ON public.businesses
    FOR ALL
    USING (auth.jwt()->>'role' = 'admin');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 
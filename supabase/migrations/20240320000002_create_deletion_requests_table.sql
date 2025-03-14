-- Create deletion_requests table
CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_business_id ON public.deletion_requests(business_id);

-- Enable RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own deletion requests" ON public.deletion_requests;
    DROP POLICY IF EXISTS "Users can create deletion requests for their own businesses" ON public.deletion_requests;
    DROP POLICY IF EXISTS "Admins can view all deletion requests" ON public.deletion_requests;
EXCEPTION
    WHEN undefined_object THEN
END $$;

-- Create policies
CREATE POLICY "Users can view their own deletion requests"
    ON public.deletion_requests
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.businesses 
            WHERE id = business_id
        )
    );

CREATE POLICY "Users can create deletion requests for their own businesses"
    ON public.deletion_requests
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id 
            FROM public.businesses 
            WHERE id = business_id
        )
    );

CREATE POLICY "Admins can view all deletion requests"
    ON public.deletion_requests
    FOR ALL
    USING (
        auth.jwt()->>'role' = 'admin'
    );

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_deletion_requests_updated_at ON public.deletion_requests;
CREATE TRIGGER handle_deletion_requests_updated_at
    BEFORE UPDATE ON public.deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 
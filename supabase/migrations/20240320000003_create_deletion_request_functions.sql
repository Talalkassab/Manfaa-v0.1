-- Function to approve a deletion request and delete the associated business
CREATE OR REPLACE FUNCTION public.approve_deletion_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    business_id UUID;
BEGIN
    -- Get the business_id from the deletion request
    SELECT dr.business_id INTO business_id
    FROM public.deletion_requests dr
    WHERE dr.id = request_id
    AND dr.status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deletion request not found or not pending';
    END IF;

    -- Update the deletion request status
    UPDATE public.deletion_requests
    SET status = 'approved',
        updated_at = now()
    WHERE id = request_id;

    -- Delete the business
    DELETE FROM public.businesses
    WHERE id = business_id;

    -- Note: The deletion of related records will be handled by ON DELETE CASCADE
END;
$$; 
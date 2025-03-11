-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndas ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (is_admin());

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
USING (is_admin());

-- Business policies
CREATE POLICY "Public approved businesses are viewable by everyone"
ON businesses FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view their own businesses"
ON businesses FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own businesses"
ON businesses FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own businesses"
ON businesses FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all businesses"
ON businesses FOR ALL
USING (is_admin());

-- Business files policies
CREATE POLICY "Public files are viewable by everyone"
ON business_files FOR SELECT
USING (
  visibility = 'public' AND
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.status = 'approved'
  )
);

CREATE POLICY "NDA-protected files require signed NDA"
ON business_files FOR SELECT
USING (
  (visibility = 'nda' AND
  EXISTS (
    SELECT 1 FROM ndas
    WHERE ndas.business_id = business_files.business_id
    AND ndas.user_id = auth.uid()
    AND ndas.status = 'approved'
  )) OR
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Private files are only viewable by business owner"
ON business_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can upload files to their businesses"
ON business_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own files"
ON business_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own files"
ON business_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_files.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all files"
ON business_files FOR ALL
USING (is_admin());

-- Business interests policies
CREATE POLICY "Users can view interests for their businesses"
ON business_interests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_interests.business_id
    AND businesses.owner_id = auth.uid()
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Users can express interest in businesses"
ON business_interests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interests"
ON business_interests FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can update interests in their businesses"
ON business_interests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_interests.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_interests.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all interests"
ON business_interests FOR ALL
USING (is_admin());

-- NDA policies
CREATE POLICY "Users can view NDAs they've signed"
ON ndas FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Business owners can view NDAs for their businesses"
ON ndas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = ndas.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can request NDAs"
ON ndas FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can approve/reject NDAs"
ON ndas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = ndas.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = ndas.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all NDAs"
ON ndas FOR ALL
USING (is_admin());

-- Messages policies
CREATE POLICY "Users can view messages they've sent or received"
ON messages FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they've sent"
ON messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
ON messages FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid() AND (read_at IS NULL OR read_at IS NOT NULL));

CREATE POLICY "Admins can manage all messages"
ON messages FOR ALL
USING (is_admin()); 
-- Users Table
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('buyer', 'seller', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT,
  last_active TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::JSONB,
  CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Businesses Table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  location TEXT NOT NULL,
  city TEXT,
  region TEXT,
  asking_price DECIMAL,
  currency TEXT DEFAULT 'SAR',
  general_info JSONB NOT NULL DEFAULT '{}'::JSONB,
  financial_info JSONB NOT NULL DEFAULT '{}'::JSONB,
  operational_info JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'sold', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0
);

-- Business Files Table
CREATE TABLE business_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'nda', 'private')),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) NOT NULL
);

-- Business Interests Table
CREATE TABLE business_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'pending_nda', 'nda_signed', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, business_id)
);

-- NDAs Table
CREATE TABLE ndas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  terms JSONB NOT NULL,
  validity_period INTEGER DEFAULT 90, -- days
  expires_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  UNIQUE (business_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) NOT NULL,
  recipient_id UUID REFERENCES users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id),
  conversation_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_system_message BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX business_owner_idx ON businesses(owner_id);
CREATE INDEX business_status_idx ON businesses(status);
CREATE INDEX business_category_idx ON businesses(category);
CREATE INDEX business_files_business_idx ON business_files(business_id);
CREATE INDEX business_interests_business_idx ON business_interests(business_id);
CREATE INDEX business_interests_user_idx ON business_interests(user_id);
CREATE INDEX ndas_business_idx ON ndas(business_id);
CREATE INDEX ndas_user_idx ON ndas(user_id);
CREATE INDEX messages_conversation_idx ON messages(conversation_id);
CREATE INDEX messages_recipient_idx ON messages(recipient_id); 
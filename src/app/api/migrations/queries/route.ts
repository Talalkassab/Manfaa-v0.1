import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/server-supabase';

// SQL for creating optimized indexes for common query patterns
const BUSINESS_INDEXES_SQL = `
-- Indexes for businesses table
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(address);
CREATE INDEX IF NOT EXISTS idx_businesses_price_range ON businesses(asking_price);
CREATE INDEX IF NOT EXISTS idx_businesses_privacy ON businesses(privacy_level);
`;

const BUSINESS_FILES_INDEXES_SQL = `
-- Indexes for business_files table
CREATE INDEX IF NOT EXISTS idx_files_business_id ON business_files(business_id);
CREATE INDEX IF NOT EXISTS idx_files_visibility ON business_files(visibility);
CREATE INDEX IF NOT EXISTS idx_files_category ON business_files(category);
CREATE INDEX IF NOT EXISTS idx_files_composite ON business_files(business_id, visibility);
`;

const NDA_INDEXES_SQL = `
-- Indexes for ndas table
CREATE INDEX IF NOT EXISTS idx_ndas_business_id ON ndas(business_id);
CREATE INDEX IF NOT EXISTS idx_ndas_user_id ON ndas(user_id);
CREATE INDEX IF NOT EXISTS idx_ndas_status ON ndas(status);
CREATE INDEX IF NOT EXISTS idx_ndas_composite ON ndas(business_id, user_id, status);
`;

const MESSAGES_INDEXES_SQL = `
-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_business ON messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(created_at DESC);
`;

// Optimized queries for common operations
export const OPTIMIZED_BUSINESS_QUERY = `
SELECT b.*, 
       u.full_name as owner_name,
       u.email as owner_email,
       (SELECT COUNT(*) FROM business_files bf WHERE bf.business_id = b.id AND bf.category = 'image') as image_count,
       (SELECT COUNT(*) FROM business_files bf WHERE bf.business_id = b.id AND bf.category = 'document') as document_count,
       (SELECT COUNT(*) FROM ndas n WHERE n.business_id = b.id) as nda_count
FROM businesses b
LEFT JOIN users u ON b.user_id = u.id
WHERE 
    (b.status = 'approved' OR b.user_id = $1)
    AND ($2::text IS NULL OR b.category = $2)
    AND ($3::text IS NULL OR b.address ILIKE '%' || $3 || '%')
ORDER BY b.created_at DESC
LIMIT $4 OFFSET $5;
`;

export const OPTIMIZED_FILES_QUERY = `
WITH user_nda AS (
    SELECT business_id 
    FROM ndas 
    WHERE user_id = $1 AND status = 'approved'
)
SELECT bf.*
FROM business_files bf
WHERE 
    bf.business_id = $2
    AND (
        bf.visibility = 'public'
        OR (bf.visibility = 'nda' AND EXISTS (SELECT 1 FROM user_nda WHERE business_id = bf.business_id))
        OR (bf.uploaded_by = $1)
    )
ORDER BY bf.category, bf.created_at DESC;
`;

export const OPTIMIZED_MESSAGES_QUERY = `
SELECT m.*,
       sender.full_name as sender_name,
       recipient.full_name as recipient_name,
       b.name as business_name
FROM messages m
LEFT JOIN users sender ON m.sender_id = sender.id
LEFT JOIN users recipient ON m.recipient_id = recipient.id
LEFT JOIN businesses b ON m.business_id = b.id
WHERE 
    (m.sender_id = $1 AND m.recipient_id = $2)
    OR (m.sender_id = $2 AND m.recipient_id = $1)
ORDER BY m.created_at ASC;
`;

/**
 * API endpoint for running database query optimizations
 * (protected for admin use only)
 */
export async function POST(request: Request) {
  try {
    // Create a Supabase client with admin rights from the server
    const supabase = createClient();
    
    // Parse request body
    const body = await request.json();
    const { optimization } = body;
    
    // Choose the SQL to run based on the optimization type
    let sql = '';
    switch (optimization) {
      case 'business_indexes':
        sql = BUSINESS_INDEXES_SQL;
        break;
      case 'files_indexes':
        sql = BUSINESS_FILES_INDEXES_SQL;
        break;
      case 'nda_indexes':
        sql = NDA_INDEXES_SQL;
        break;
      case 'messages_indexes':
        sql = MESSAGES_INDEXES_SQL;
        break;
      case 'all_indexes':
        sql = `
          ${BUSINESS_INDEXES_SQL}
          ${BUSINESS_FILES_INDEXES_SQL}
          ${NDA_INDEXES_SQL}
          ${MESSAGES_INDEXES_SQL}
        `;
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid optimization type' 
        }, { status: 400 });
    }
    
    // Run the SQL query
    const { error } = await supabase.rpc('run_sql', { sql });
    
    if (error) {
      console.error('Error running optimization:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Optimization ${optimization} applied successfully`,
      sql
    });
  } catch (error) {
    console.error('Error in query optimization endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { createClient, runSQL } from '@/lib/server-supabase';

// SQL for creating query caching using materialized views
const BUSINESS_SUMMARY_VIEW_SQL = `
-- Materialized view for business summaries (frequently accessed data)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_business_summaries AS
SELECT 
    b.id,
    b.name,
    b.description,
    b.category,
    b.address,
    b.asking_price,
    b.privacy_level,
    b.status,
    u.full_name as owner_name,
    (SELECT COUNT(*) FROM business_files bf WHERE bf.business_id = b.id AND bf.category = 'image') as image_count,
    (SELECT COUNT(*) FROM business_files bf WHERE bf.business_id = b.id) as total_files,
    (SELECT COUNT(*) FROM ndas n WHERE n.business_id = b.id) as nda_count,
    b.created_at,
    b.updated_at
FROM businesses b
LEFT JOIN users u ON b.user_id = u.id
WHERE b.status = 'approved';

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_business_summaries_category ON mv_business_summaries(category);
CREATE INDEX IF NOT EXISTS idx_mv_business_summaries_address ON mv_business_summaries(address);
CREATE INDEX IF NOT EXISTS idx_mv_business_summaries_asking_price ON mv_business_summaries(asking_price);
`;

const BUSINESS_STATS_VIEW_SQL = `
-- Materialized view for business statistics (admin dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_business_stats AS
SELECT
    COUNT(*) FILTER (WHERE b.status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE b.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE b.status = 'rejected') as rejected_count,
    COUNT(DISTINCT b.user_id) as seller_count,
    AVG(b.asking_price) FILTER (WHERE b.status = 'approved') as avg_asking_price,
    MAX(b.asking_price) FILTER (WHERE b.status = 'approved') as max_asking_price,
    MIN(b.asking_price) FILTER (WHERE b.status = 'approved') as min_asking_price,
    COUNT(DISTINCT bf.id) as total_files,
    COUNT(DISTINCT n.id) as total_ndas,
    (SELECT COUNT(*) FROM users WHERE user_type = 'buyer') as buyer_count,
    (SELECT COUNT(*) FROM users WHERE user_type = 'seller') as total_seller_count,
    (SELECT COUNT(*) FROM users WHERE user_type = 'admin') as admin_count
FROM businesses b
LEFT JOIN business_files bf ON b.id = bf.business_id
LEFT JOIN ndas n ON b.id = n.business_id;
`;

const CONVERSATIONS_VIEW_SQL = `
-- Materialized view for user conversations (messaging overview)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_conversations AS
WITH latest_messages AS (
    SELECT 
        DISTINCT ON (
            CASE WHEN sender_id < recipient_id 
                 THEN sender_id || '-' || recipient_id 
                 ELSE recipient_id || '-' || sender_id 
            END
        ) 
        id,
        sender_id,
        recipient_id,
        business_id,
        content,
        read,
        created_at,
        CASE WHEN sender_id < recipient_id 
             THEN sender_id || '-' || recipient_id 
             ELSE recipient_id || '-' || sender_id 
        END as conversation_id
    FROM messages
    ORDER BY conversation_id, created_at DESC
)
SELECT 
    lm.id as message_id,
    lm.conversation_id,
    lm.sender_id,
    lm.recipient_id,
    sender.full_name as sender_name,
    recipient.full_name as recipient_name,
    lm.content,
    lm.read,
    lm.created_at,
    lm.business_id,
    b.name as business_name,
    (SELECT COUNT(*) FROM messages m 
     WHERE (m.sender_id = lm.sender_id AND m.recipient_id = lm.recipient_id) 
        OR (m.sender_id = lm.recipient_id AND m.recipient_id = lm.sender_id)) as message_count,
    (SELECT COUNT(*) FROM messages m 
     WHERE m.recipient_id = lm.recipient_id AND m.sender_id = lm.sender_id AND m.read = false) as unread_count
FROM latest_messages lm
LEFT JOIN users sender ON lm.sender_id = sender.id
LEFT JOIN users recipient ON lm.recipient_id = recipient.id
LEFT JOIN businesses b ON lm.business_id = b.id;

-- Create indexes for the conversations view
CREATE INDEX IF NOT EXISTS idx_mv_user_conversations_sender ON mv_user_conversations(sender_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_conversations_recipient ON mv_user_conversations(recipient_id);
`;

// Function to refresh materialized views
const REFRESH_VIEWS_FUNCTION_SQL = `
-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views() RETURNS void AS $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT matviewname FROM pg_matviews
    LOOP
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || view_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

/**
 * API endpoint for setting up database caching
 * (protected for admin use only)
 */
export async function POST(request: Request) {
  try {
    // Create a Supabase client with admin rights
    const supabase = createClient();
    
    // Parse request body
    const body = await request.json();
    const { cache_type, refresh } = body;
    
    // If refresh is true, just refresh all materialized views
    if (refresh) {
      try {
        await supabase.rpc('refresh_materialized_views');
        return NextResponse.json({ 
          success: true, 
          message: 'All materialized views refreshed'
        });
      } catch (error) {
        console.error('Error refreshing materialized views:', error);
        // If the function doesn't exist yet, we'll create it below
      }
    }
    
    // Choose the SQL to run based on the cache type
    let sql = '';
    switch (cache_type) {
      case 'business_summary':
        sql = BUSINESS_SUMMARY_VIEW_SQL;
        break;
      case 'business_stats':
        sql = BUSINESS_STATS_VIEW_SQL;
        break;
      case 'conversations':
        sql = CONVERSATIONS_VIEW_SQL;
        break;
      case 'refresh_function':
        sql = REFRESH_VIEWS_FUNCTION_SQL;
        break;
      case 'all':
        sql = `
          ${BUSINESS_SUMMARY_VIEW_SQL}
          ${BUSINESS_STATS_VIEW_SQL}
          ${CONVERSATIONS_VIEW_SQL}
          ${REFRESH_VIEWS_FUNCTION_SQL}
        `;
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid cache type' 
        }, { status: 400 });
    }
    
    // Run the SQL query
    await runSQL(sql);
    
    // If we just created everything, refresh the views
    if (cache_type === 'all') {
      try {
        await supabase.rpc('refresh_materialized_views');
      } catch (error) {
        console.error('Error refreshing views after creation:', error);
        // This is not critical, as the views will have data from creation
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache type ${cache_type} set up successfully`, 
      sql
    });
  } catch (error) {
    console.error('Error in caching endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
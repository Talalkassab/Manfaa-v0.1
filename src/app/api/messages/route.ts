import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authResult.error || 'You must be logged in'}` },
        { status: 401 }
      );
    }
    
    // Create a Supabase client for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    // Check if the messages table exists
    const { error: tableCheckError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'messages')
      .single();
    
    // If the table doesn't exist, return placeholder data
    if (tableCheckError) {
      console.log('The messages table does not exist in the database. Returning empty data.');
      
      if (conversationId) {
        // Return empty messages array for specific conversation
        return NextResponse.json([]);
      } else {
        // Return empty conversations array
        return NextResponse.json([]);
      }
    }
    
    if (conversationId) {
      // Get messages for a specific conversation
      console.log(`Fetching messages for conversation: ${conversationId}`);
      
      // Use a simpler query that doesn't rely on foreign key relationships
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        // Check if error is about table not existing
        if (error.code === '42P01') { // PostgreSQL error code for undefined table
          console.log('Messages table does not exist. Returning empty array.');
          return NextResponse.json([]);
        }
        return NextResponse.json(
          { error: 'Failed to fetch messages' },
          { status: 500 }
        );
      }
      
      // Get unique user IDs from the messages
      const userIds = [...new Set(
        messages.flatMap(msg => [msg.sender_id, msg.recipient_id].filter(Boolean))
      )];
      
      // Fetch user data in a separate query
      let userData = {};
      try {
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('profiles') // Try profiles table instead of users
            .select('id, email, full_name, avatar_url')
            .in('id', userIds);
            
          if (!usersError && users) {
            userData = Object.fromEntries(users.map(user => [user.id, user]));
          } else {
            console.log("Could not fetch user data from profiles table, trying auth.users");
            
            // Fallback to auth.users if profiles doesn't work
            const { data: authUsers, error: authUsersError } = await supabase
              .from('auth.users') // Try auth.users as a fallback
              .select('id, email')
              .in('id', userIds);
              
            if (!authUsersError && authUsers) {
              userData = Object.fromEntries(authUsers.map(user => [user.id, user]));
            } else {
              console.error("Failed to fetch user data:", usersError || authUsersError);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
      
      // Attach user data to messages
      const enrichedMessages = messages.map(msg => ({
        ...msg,
        sender: userData[msg.sender_id] || { id: msg.sender_id, email: 'Unknown User' },
        recipient: userData[msg.recipient_id] || { id: msg.recipient_id, email: 'Unknown User' },
      }));
      
      // Mark messages as read
      try {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('recipient_id', authResult.user.id)
          .is('read_at', null);
      } catch (markReadError) {
        console.error("Error marking messages as read:", markReadError);
      }
      
      return NextResponse.json(enrichedMessages);
    } else {
      // Get all conversations for the user
      console.log(`Fetching conversations for user: ${authResult.user.id}`);
      
      try {
        // Use a simpler query that doesn't rely on foreign key relationships
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${authResult.user.id},recipient_id.eq.${authResult.user.id}`)
          .order('sent_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching conversations:', error);
          // Check if error is about table not existing
          if (error.code === '42P01') { // PostgreSQL error code for undefined table
            console.log('Messages table does not exist. Returning placeholder conversations.');
            // Return empty array instead of error when table doesn't exist
            return NextResponse.json([]);
          }
          return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
          );
        }
        
        // Group by conversation_id and get the latest message for each
        const conversationMap = new Map();
        
        messages.forEach(message => {
          if (!conversationMap.has(message.conversation_id) || 
              new Date(message.sent_at) > new Date(conversationMap.get(message.conversation_id).sent_at)) {
            conversationMap.set(message.conversation_id, message);
          }
        });
        
        // Count unread messages for each conversation
        const unreadCounts = await Promise.all(
          Array.from(conversationMap.keys()).map(async (convId) => {
            try {
              const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact' })
                .eq('conversation_id', convId)
                .eq('recipient_id', authResult.user.id)
                .is('read_at', null);
              
              return { conversationId: convId, unreadCount: count || 0 };
            } catch (err) {
              console.error(`Error counting unread messages for conversation ${convId}:`, err);
              return { conversationId: convId, unreadCount: 0 };
            }
          })
        );
        
        // Create a map of conversation IDs to unread counts
        const unreadCountMap = Object.fromEntries(
          unreadCounts.map(({ conversationId, unreadCount }) => [conversationId, unreadCount])
        );
        
        // Get unique user IDs from all messages
        const userIds = [...new Set(
          messages.flatMap(msg => [msg.sender_id, msg.recipient_id].filter(Boolean))
        )];
        
        // Fetch user data in a separate query
        let userData = {};
        try {
          if (userIds.length > 0) {
            const { data: users, error: usersError } = await supabase
              .from('profiles') // Try profiles table instead of users
              .select('id, email, full_name, avatar_url')
              .in('id', userIds);
              
            if (!usersError && users) {
              userData = Object.fromEntries(users.map(user => [user.id, user]));
            } else {
              console.log("Could not fetch user data from profiles table, trying auth.users");
              
              // Fallback to auth.users if profiles doesn't work
              const { data: authUsers, error: authUsersError } = await supabase
                .from('auth.users') // Try auth.users as a fallback
                .select('id, email')
                .in('id', userIds);
                
              if (!authUsersError && authUsers) {
                userData = Object.fromEntries(authUsers.map(user => [user.id, user]));
              } else {
                console.error("Failed to fetch user data:", usersError || authUsersError);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
        
        // Get business data if needed
        let businessData = {};
        const businessIds = [...new Set(
          messages.flatMap(msg => msg.business_id).filter(Boolean))
        ];
        
        try {
          if (businessIds.length > 0) {
            const { data: businesses, error: businessError } = await supabase
              .from('businesses')
              .select('id, name')
              .in('id', businessIds);
              
            if (!businessError && businesses) {
              businessData = Object.fromEntries(businesses.map(business => [business.id, business]));
            } else {
              console.error("Error fetching business data:", businessError);
            }
          }
        } catch (err) {
          console.error("Error fetching business data:", err);
        }
        
        // Format the response
        const formattedConversations = Array.from(conversationMap.values()).map(message => {
          // Determine if the current user is the sender or recipient
          const isCurrentUserSender = message.sender_id === authResult.user.id;
          
          // Get the other participant's ID
          const otherParticipantId = isCurrentUserSender ? message.recipient_id : message.sender_id;
          
          // Get the other participant's info
          const otherParticipant = userData[otherParticipantId] || { 
            id: otherParticipantId, 
            email: 'Unknown User',
            full_name: 'Unknown User'
          };
          
          // Get business info if available
          const business = message.business_id ? 
            businessData[message.business_id] || { id: message.business_id, name: 'Unknown Business' } 
            : null;
          
          return {
            id: message.conversation_id,
            lastMessage: message.content,
            updatedAt: message.sent_at,
            hasUnreadMessages: (unreadCountMap[message.conversation_id] || 0) > 0,
            participants: [
              {
                id: authResult.user.id,
                name: userData[authResult.user.id]?.full_name || userData[authResult.user.id]?.email || 'You',
                role: isCurrentUserSender ? 'sender' : 'recipient'
              },
              {
                id: otherParticipantId,
                name: otherParticipant.full_name || otherParticipant.email || 'Unknown User',
                avatar: otherParticipant.avatar_url,
                role: isCurrentUserSender ? 'recipient' : 'sender'
              }
            ],
            business: business,
            unreadCount: unreadCountMap[message.conversation_id] || 0
          };
        });
        
        return NextResponse.json(formattedConversations);
      } catch (error) {
        console.error('Unexpected error fetching conversations:', error);
        return NextResponse.json(
          { error: 'An unexpected error occurred while fetching conversations' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authResult.error || 'You must be logged in'}` },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const requestData = await request.json();
    const businessId = requestData.businessId;
    
    // Handle both direct message and business contact scenarios
    let recipientId, message;
    
    if (requestData.conversationId && requestData.message) {
      // Case: Sending a message in an existing conversation
      message = requestData.message;
      
      // Extract recipient from conversationId (format: user1_user2)
      const participants = requestData.conversationId.split('_');
      recipientId = participants[0] === authResult.user.id ? participants[1] : participants[0];
    } else if (requestData.recipientId && requestData.content) {
      // Case: Direct messaging API format
      recipientId = requestData.recipientId;
      message = requestData.content;
    } else if (businessId && requestData.message) {
      // Case: Contacting a business owner
      message = requestData.message;
      
      // Fetch the business owner's ID
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      try {
        const { data: business, error } = await supabase
          .from('businesses')
          .select('user_id') // Using user_id instead of owner_id based on previous fixes
          .eq('id', businessId)
          .single();
          
        if (error || !business) {
          console.error('Error fetching business:', error);
          return NextResponse.json(
            { error: 'Business not found' },
            { status: 404 }
          );
        }
        
        recipientId = business.user_id;
        
        if (!recipientId) {
          return NextResponse.json(
            { error: 'Business owner not found' },
            { status: 404 }
          );
        }
      } catch (err) {
        console.error('Error getting business owner:', err);
        return NextResponse.json(
          { error: 'Failed to identify business owner' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters. Please provide either conversationId + message, recipientId + content, or businessId + message' },
        { status: 400 }
      );
    }
    
    if (!recipientId || !message?.trim()) {
      return NextResponse.json(
        { error: 'Recipient ID and message content are required' },
        { status: 400 }
      );
    }
    
    // Create a Supabase client for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create a unique conversation ID by sorting participant IDs
    const participants = [authResult.user.id, recipientId].sort();
    const conversationId = `${participants[0]}_${participants[1]}`;
    
    console.log(`Sending message from ${authResult.user.id} to ${recipientId} in conversation ${conversationId}`);
    
    // Insert the message
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        sender_id: authResult.user.id,
        recipient_id: recipientId,
        business_id: businessId || null,
        conversation_id: conversationId,
        content: message,
        attachments: requestData.attachments?.length > 0 ? requestData.attachments : [],
        sent_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
    
    // Return the created message
    return NextResponse.json(newMessage[0] || { success: true });
  } catch (error) {
    console.error('Unexpected error in messages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
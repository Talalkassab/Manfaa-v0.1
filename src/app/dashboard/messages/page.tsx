"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUser } from '../../../lib/auth';

// Conversation card component
const ConversationCard = ({ 
  id,
  name, 
  lastMessage, 
  time, 
  unread, 
  avatar 
}: { 
  id: string;
  name: string; 
  lastMessage: string; 
  time: string; 
  unread: boolean;
  avatar?: string;
}) => {
  return (
    <Link href={`/dashboard/messages/${id}`}>
      <div className={`p-4 border-b hover:bg-gray-50 flex items-center space-x-4 ${unread ? 'bg-blue-50' : ''}`}>
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img 
              src={avatar} 
              alt={name} 
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {unread && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <h3 className={`truncate font-medium ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
              {name}
            </h3>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {lastMessage}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Function to format date
const formatMessageTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user
        const { data } = await getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Fetch conversations from API
          const response = await fetch('/api/messages');
          
          if (!response.ok) {
            throw new Error(`Error fetching conversations: ${response.statusText}`);
          }
          
          const conversationsData = await response.json();
          setConversations(conversationsData);
        }
      } catch (error: any) {
        console.error('Error fetching conversations:', error);
        setError(error.message || 'An error occurred while fetching conversations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter conversations by search term
  const filteredConversations = searchTerm.trim() ? 
    conversations.filter(conv => 
      conv.participants.some((p: any) => 
        p.id !== user?.id && p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (conv.businessTitle && conv.businessTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : 
    conversations;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const userRole = user?.user_metadata?.role || 'buyer';
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredConversations.map((conversation: any) => {
            const otherParticipant = conversation.participants.find((p: any) => p.id !== user?.id);
            const lastMessage = conversation.lastMessage || 'No messages yet';
            const lastMessageTime = conversation.updatedAt ? formatMessageTime(conversation.updatedAt) : '';
            const hasUnread = conversation.hasUnreadMessages || false;
            
            return (
              <ConversationCard 
                key={conversation.id}
                id={conversation.id}
                name={otherParticipant?.name || 'Unknown User'}
                lastMessage={lastMessage}
                time={lastMessageTime}
                unread={hasUnread}
                avatar={otherParticipant?.avatar}
              />
            );
          })}
        </div>
        
        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No messages yet</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm.trim() 
                ? `No conversations found matching "${searchTerm}"`
                : userRole === 'seller' 
                  ? 'When buyers contact you about your businesses, conversations will appear here.' 
                  : 'Start a conversation by viewing a business and contacting the seller.'}
            </p>
            {!searchTerm.trim() && userRole === 'buyer' && (
              <div className="mt-4">
                <Link href="/dashboard/businesses" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Browse Businesses
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Tips for effective communication</h2>
        <div className="bg-blue-50 rounded-lg p-4 text-blue-800">
          <ul className="list-disc list-inside space-y-2">
            <li>Be clear and concise in your messages</li>
            <li>Ask specific questions about the business</li>
            <li>Respond promptly to maintain momentum</li>
            <li>Schedule video calls for more detailed discussions</li>
            <li>Keep all communication within the platform for security</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
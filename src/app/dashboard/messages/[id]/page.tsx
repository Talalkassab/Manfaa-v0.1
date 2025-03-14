"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '../../../../lib/auth';

// Message interface
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date | string;
  isRead: boolean;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
}

// Conversation interface
interface Conversation {
  id: string;
  title?: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: 'buyer' | 'seller';
  }[];
  businessId?: string;
  businessTitle?: string;
  messages: Message[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch user and conversation data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user
        const { data } = await getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Fetch conversation data from API
          const response = await fetch(`/api/messages?conversationId=${conversationId}`);
          
          if (!response.ok) {
            throw new Error(`Error fetching conversation: ${response.statusText}`);
          }
          
          const conversationData = await response.json();
          if (!conversationData || (Array.isArray(conversationData) && conversationData.length === 0)) {
            throw new Error('Conversation not found');
          }
          
          // If we get an array (all conversations), find the right one
          const targetConversation = Array.isArray(conversationData) 
            ? conversationData.find((c: any) => c.id === conversationId)
            : conversationData;
            
          if (!targetConversation) {
            throw new Error('Conversation not found');
          }
          
          setConversation(targetConversation);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [conversationId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);
  
  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !attachment) || !conversation) return;
    
    try {
      setSendingMessage(true);
      
      // Send message to API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          message: newMessage.trim(),
          // In a full implementation, handle attachment upload separately
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to send message: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // If we get a full conversation back, update the state
      if (result && result.id === conversation.id) {
        setConversation(result);
      } else {
        // Otherwise, append the new message to our local state
        const newMsg: Message = {
          id: result.id || `temp-${Date.now()}`,
          senderId: user.id,
          text: newMessage.trim(),
          timestamp: new Date().toISOString(),
          isRead: false,
          ...(attachment ? {
            attachments: [{
              id: `attachment-${Date.now()}`,
              name: attachment.name,
              type: attachment.type.split('/')[1].toUpperCase(),
              url: '#'
            }]
          } : {})
        };
        
        setConversation({
          ...conversation,
          messages: [...conversation.messages, newMsg],
          updatedAt: new Date().toISOString()
        });
      }
      
      setNewMessage('');
      setAttachment(null);
      setAttaching(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };
  
  // Format timestamp
  const formatMessageTime = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric', 
      hour12: true
    }) + ' · ' + date.toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Conversation Not Found</h3>
          <p className="text-gray-500 mb-6">{error || 'This conversation may have been deleted or you don\'t have permission to view it.'}</p>
          <Link 
            href="/dashboard/messages" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Messages
          </Link>
        </div>
      </div>
    );
  }
  
  const currentUserRole = user?.user_metadata?.role || 'buyer';
  const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
  
  return (
    <div className="container mx-auto max-w-5xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/messages" className="mr-4">
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </Link>
            <div className="flex items-center">
              {otherParticipant?.avatar ? (
                <img 
                  src={otherParticipant.avatar} 
                  alt={otherParticipant.name} 
                  className="h-10 w-10 rounded-full mr-3"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold mr-3">
                  {otherParticipant?.name.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-medium text-gray-900">{otherParticipant?.name || 'Unknown User'}</h2>
                {conversation.businessTitle && (
                  <p className="text-sm text-gray-500">
                    Regarding: <Link href={`/dashboard/businesses/${conversation.businessId}`} className="text-blue-600 hover:text-blue-800">
                      {conversation.businessTitle}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md m-4">
          <p>{error}</p>
          <button 
            className="text-red-700 font-medium underline ml-2"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Messages */}
      <div className="p-4 bg-gray-50 flex-1 overflow-y-auto min-h-[60vh] max-h-[70vh]">
        <div className="space-y-4">
          {conversation.messages.map((message) => {
            const isCurrentUser = message.senderId === user?.id;
            
            return (
              <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'} rounded-lg p-3 shadow-sm`}>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </div>
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <a href={attachment.url} className="hover:underline" target="_blank" rel="noopener noreferrer">
                            {attachment.name}
                          </a>
                          <span className="ml-1 text-gray-500">({attachment.type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea 
              className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Type your message..."
              rows={2}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sendingMessage}
            />
            
            {attachment && (
              <div className="absolute bottom-2 left-2 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-xs flex items-center">
                <span className="truncate max-w-[150px]">{attachment.name}</span>
                <button 
                  type="button" 
                  className="ml-1 text-gray-500 hover:text-gray-700" 
                  onClick={() => setAttachment(null)}
                >
                  &times;
                </button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              type="button" 
              className="bg-gray-200 text-gray-600 rounded-full p-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={sendingMessage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <input 
                id="file-input" 
                type="file" 
                className="hidden" 
                onChange={handleFileSelect}
                disabled={sendingMessage}
              />
            </button>
            
            <button 
              type="submit" 
              className={`bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${sendingMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={(!newMessage.trim() && !attachment) || sendingMessage}
            >
              {sendingMessage ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
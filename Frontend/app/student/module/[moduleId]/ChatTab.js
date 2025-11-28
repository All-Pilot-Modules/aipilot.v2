'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, User, MessageSquare, Send } from "lucide-react";
import { apiClient } from "@/lib/auth";


export default function ChatTab({ moduleId, moduleAccess }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = useCallback(async (conversationId) => {
    try {
      setCurrentConversationId(conversationId);
      const response = await apiClient.get(`/api/chat/conversations/${conversationId}`);
      const conv = response?.data || response;
      setMessages(conv.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const response = await apiClient.get(
        `/api/chat/conversations?student_id=${moduleAccess.studentId}&module_id=${moduleId}`
      );

      const convs = response?.data || response || [];
      setConversations(convs);

      // If there are conversations, load the most recent one
      if (convs.length > 0 && !currentConversationId) {
        loadConversation(convs[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [moduleAccess, moduleId, currentConversationId, loadConversation]);

  // Load conversations on mount
  useEffect(() => {
    if (moduleAccess?.studentId) {
      loadConversations();
    }
  }, [moduleAccess, loadConversations]);

  const createNewConversation = async (firstMessage) => {
    try {
      // Create conversation with title from first message
      const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage;

      const response = await apiClient.post('/api/chat/conversations', {
        student_id: moduleAccess.studentId,
        module_id: moduleId,
        title: title
      });

      const newConv = response?.data || response;
      setCurrentConversationId(newConv.id);
      setConversations([newConv, ...conversations]);
      return newConv.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Immediately add student message to UI (optimistic update)
    const tempStudentMsg = {
      role: "student",
      content: message,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempStudentMsg]);

    try {
      let convId = currentConversationId;

      // Create new conversation if this is the first message
      if (!convId) {
        convId = await createNewConversation(message);
        if (!convId) {
          setIsSending(false);
          // Remove the optimistic message if conversation creation fails
          setMessages(prev => prev.slice(0, -1));
          return;
        }
      }

      // Send message and get AI response
      console.log('📤 Sending to AI:', {
        conversationId: convId,
        message: message,
        endpoint: `/api/chat/conversations/${convId}/message`
      });

      const response = await apiClient.post(`/api/chat/conversations/${convId}/message`, {
        message: message
      });

      const result = response?.data || response;
      console.log('📥 AI Response:', result);

      // Add AI response to the UI
      setMessages(prev => [...prev, result.assistant_message]);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loadingConversations) {
    return (
      <div className="h-[700px] flex gap-4">
        {/* Conversations sidebar skeleton */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-700 p-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'} rounded-lg p-4`}>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-[700px] flex flex-col">
     
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Tutor Chat</CardTitle>
              <CardDescription>Ask me anything about the course materials</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to AI Tutor!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                I am here to help you understand the course materials. Ask me anything about the topics covered in this module!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${msg.role === 'student' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`flex-1 ${msg.role === 'student' ? 'flex flex-col items-end' : ''}`}>
                  <div className={`${
                    msg.role === 'student'
                      ? 'bg-blue-600 rounded-2xl rounded-tr-none text-white'
                      : 'bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none text-gray-900 dark:text-gray-100'
                  } p-4 max-w-[80%]`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                {msg.role === 'student' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Chat Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about course materials..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          AI responses are based on your course materials
        </p>
      </div>
    </Card>
  );
}

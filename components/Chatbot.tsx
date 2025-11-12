import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { createChat } from '../services/geminiService';
import type { Chat } from '@google/genai';

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createChat();
    setMessages([{ role: 'model', text: 'Hello! How can I help you with your creative project today?' }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (chatRef.current) {
        const result = await chatRef.current.sendMessage({ message: input });
        const modelMessage: ChatMessage = { role: 'model', text: result.text };
        setMessages(prev => [...prev, modelMessage]);
      }
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
       <header className="mb-6 flex-shrink-0">
          <h2 className="text-3xl font-bold text-dark-text">AI Chatbot</h2>
          <p className="text-dark-text-secondary mt-1">Your creative assistant for ideas and inspiration.</p>
      </header>
      <div className="flex-grow flex flex-col bg-dark-900 rounded-lg shadow-md overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-dark-700 text-dark-text'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                   <div className="max-w-lg px-4 py-2 rounded-2xl bg-dark-700 text-dark-text">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-dark-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-dark-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-dark-text-secondary rounded-full animate-bounce"></div>
                        </div>
                   </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="border-t border-dark-600 p-4 bg-dark-900">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for branding ideas..."
              className="flex-1 p-3 bg-dark-700 border border-dark-600 rounded-full focus:ring-brand-blue focus:border-brand-blue transition text-dark-text placeholder:text-dark-text-secondary"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-brand-blue text-white rounded-full p-3 hover:bg-blue-700 transition disabled:bg-blue-800 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
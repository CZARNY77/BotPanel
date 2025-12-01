import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateBotAdvice } from '../services/geminiService';

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your AI Copilot. How can I help you today? I can generate welcome messages, draft server rules, or help with JSON configuration.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const responseText = await generateBotAdvice(input);

    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Write a funny welcome message",
    "Create rules for a gaming server",
    "How to setup anti-spam?",
    "Generate JSON for economy module"
  ];

  return (
    <div className="flex flex-col h-full bg-theme-bg">
      {/* Header */}
      <div className="p-6 border-b border-theme-border bg-theme-card">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-lg shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              AI Copilot 
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary border border-theme-primary/20">Gemini 2.5</span>
            </h2>
            <p className="text-sm text-gray-400">Your personal server management assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-theme-border shadow-sm ${
                msg.role === 'user' ? 'bg-gray-700 ml-3' : 'bg-theme-primary mr-3'
              }`}>
                {msg.role === 'user' ? <div className="text-xs font-bold text-white">YOU</div> : <Bot className="w-5 h-5 text-white" />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                msg.role === 'user' 
                  ? 'bg-theme-primary text-white rounded-tr-none' 
                  : 'bg-theme-card text-gray-100 rounded-tl-none border border-theme-border'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-center space-x-2 bg-theme-card px-4 py-3 rounded-2xl rounded-tl-none border border-theme-border ml-11 shadow-md">
               <div className="w-2 h-2 bg-theme-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-theme-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-theme-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-theme-card border-t border-theme-border">
        {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInput(s); }}
                  className="whitespace-nowrap px-3 py-1.5 bg-theme-bg hover:bg-theme-hover border border-theme-border rounded-full text-xs text-gray-300 transition-colors flex items-center"
                >
                  <Sparkles className="w-3 h-3 mr-1.5 text-theme-primary" />
                  {s}
                </button>
              ))}
            </div>
        )}

        {!process.env.API_KEY && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Warning: No API Key. The assistant will not function correctly without environment configuration.
            </div>
        )}

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about config, server ideas..."
            className="w-full bg-theme-bg text-gray-100 placeholder-gray-500 rounded-xl pl-4 pr-12 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary transition-all border border-theme-border"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">
          Gemini may produce inaccurate information. Verify important configurations.
        </p>
      </div>
    </div>
  );
};
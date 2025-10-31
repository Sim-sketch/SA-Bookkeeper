import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { getAiChatResponse } from '../services/geminiService';
import Spinner from './Spinner';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiChatView: React.FC<{ transactions: Transaction[]; checkApiKey: () => boolean; }> = ({ transactions, checkApiKey }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !checkApiKey()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const aiResponse = await getAiChatResponse(input, transactions);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (e: any) {
            setError(e.message);
            const errorMessage: Message = { sender: 'ai', text: `Sorry, I encountered an error: ${e.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[70vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300">AI Financial Chat</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ask questions about your transactions.</p>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                     <div className="text-center text-slate-500 dark:text-slate-400 pt-16">
                        <p className="text-lg">Ask me anything about your finances!</p>
                        <p className="text-sm mt-2">Examples: "What were my top 3 expenses last month?" or "How much did I earn from sales?"</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-teal-500 dark:bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                            <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-lg p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                           <Spinner />
                           <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g., What was my biggest expense?"
                        className="flex-grow bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:opacity-50 transition"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="inline-flex justify-center items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Send
                    </button>
                </form>
                {error && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>}
            </div>
        </div>
    );
};

export default AiChatView;
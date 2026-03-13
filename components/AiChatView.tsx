import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Transaction, AiChatToolCall } from '../types.ts';
import { getAiChatResponse } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import MarkdownRenderer from './MarkdownRenderer.tsx';
import { XIcon } from './icons/XIcon.tsx';
import { ChatIcon } from './icons/ChatIcon.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';
import { WandIcon } from './icons/WandIcon.tsx';

interface Message {
    sender: 'user' | 'ai';
    text: string;
    toolCall?: AiChatToolCall; 
}

interface AiChatViewProps {
    transactions: Transaction[];
    checkApiKey: () => boolean;
    onClose: () => void;
    onBulkUpdate?: (ids: string[], updateData: Partial<Omit<Transaction, 'id'>>) => void;
}

const AiChatView: React.FC<AiChatViewProps> = ({ transactions, checkApiKey, onClose, onBulkUpdate }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // Send an automated warm greeting when the component mounts if no messages exist
    useEffect(() => {
        if (messages.length === 0 && user) {
            const name = user.displayName ? user.displayName.split(' ')[0] : 'there';
            const greeting: Message = {
                sender: 'ai',
                text: `Sawubona ${name}! 👋\n\nI'm your SA Bookkeeper AI assistant. I can help you analyze your transaction data or update your records.\n\nTry asking: "Change all Uber transactions to Travel category"`
            };
            setMessages([greeting]);
        }
    }, [user, messages.length]); 

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !checkApiKey()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getAiChatResponse(input, transactions);
            
            const aiMessage: Message = { 
                sender: 'ai', 
                text: response.text,
                toolCall: response.toolCall 
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (e: any) {
            const errorMessage: Message = { sender: 'ai', text: `Sorry, I encountered an error: ${e.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Component to render the "Proposed Action" card
    const ActionCard = ({ toolCall, onApply }: { toolCall: AiChatToolCall, onApply: () => void }) => {
        const matchingTransactions = useMemo(() => {
            if (!toolCall.searchText) return [];
            const lowerSearch = toolCall.searchText.toLowerCase();
            return transactions.filter(t => t.description.toLowerCase().includes(lowerSearch));
        }, [toolCall.searchText]);

        const [applied, setApplied] = useState(false);

        const handleApply = () => {
            if (matchingTransactions.length === 0) return;
            const ids = matchingTransactions.map(t => t.id);
            if (onBulkUpdate) {
                onBulkUpdate(ids, toolCall.updates);
                setApplied(true);
                onApply(); // Callback if needed
            }
        };

        if (applied) {
            return (
                <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-800 p-1 rounded-full text-green-600 dark:text-green-300">
                        <CheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Success!</p>
                        <p className="text-xs text-green-700 dark:text-green-400">Updated {matchingTransactions.length} transactions.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-3 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-teal-50 dark:bg-teal-900/30 px-4 py-2 border-b border-teal-100 dark:border-teal-800/50 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400 flex items-center gap-1">
                        <WandIcon className="w-3 h-3" /> Proposed Action
                    </span>
                    <span className="text-xs text-teal-600 dark:text-teal-500 bg-teal-100 dark:bg-teal-800/50 px-2 py-0.5 rounded-full">
                        {matchingTransactions.length} Matches
                    </span>
                </div>
                <div className="p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                        I found <strong>{matchingTransactions.length}</strong> transactions matching <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-200">"{toolCall.searchText}"</span>.
                    </p>
                    
                    <div className="space-y-2 mb-4">
                        {Object.entries(toolCall.updates).map(([key, value]) => (
                            <div key={key} className="flex text-sm">
                                <span className="w-24 font-medium text-slate-500 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{value as string}</span>
                            </div>
                        ))}
                    </div>

                    {matchingTransactions.length > 0 && (
                        <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                            <p className="font-semibold mb-1.5 uppercase text-[10px]">Preview Matches:</p>
                            <ul className="space-y-1">
                                {matchingTransactions.slice(0, 3).map(t => (
                                    <li key={t.id} className="truncate flex justify-between">
                                        <span>{t.description}</span>
                                        <span className="font-mono">{t.date}</span>
                                    </li>
                                ))}
                                {matchingTransactions.length > 3 && <li className="italic pt-1 text-center">...and {matchingTransactions.length - 3} more</li>}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button 
                            onClick={handleApply}
                            disabled={matchingTransactions.length === 0}
                            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm & Apply
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[80vh] relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 z-10">
                <div className="flex gap-3 items-center">
                    <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full">
                        <ChatIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Financial Assistant</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Google Gemini</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label="Close Chat"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-xl p-3.5 rounded-2xl shadow-sm ${
                            msg.sender === 'user' 
                                ? 'bg-teal-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                        }`}>
                            {msg.sender === 'ai' ? (
                                <>
                                    <MarkdownRenderer content={msg.text} />
                                    {msg.toolCall && (
                                        <ActionCard 
                                            toolCall={msg.toolCall} 
                                            onApply={() => { /* Optional: Add follow up message */ }} 
                                        />
                                    )}
                                </>
                            ) : (
                                <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] p-4 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-3 shadow-sm">
                           <Spinner />
                           <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="E.g., 'Change description of all Wesbank items to Vehicle Finance'"
                        className="flex-grow bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:opacity-50 transition"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="inline-flex justify-center items-center rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiChatView;
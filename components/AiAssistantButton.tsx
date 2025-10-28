import React from 'react';
import { ChatIcon } from './icons/ChatIcon';

interface AiAssistantButtonProps {
    onClick: () => void;
}

const AiAssistantButton: React.FC<AiAssistantButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
            aria-label="Open AI Assistant"
            title="AI Assistant"
        >
            <ChatIcon className="w-8 h-8" />
        </button>
    );
};

export default AiAssistantButton;

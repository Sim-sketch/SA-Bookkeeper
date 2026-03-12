
import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`flex space-x-2 justify-center items-center ${className}`}>
            <span className="sr-only">Loading...</span>
            <div className="h-2 w-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-teal-400 rounded-full animate-bounce"></div>
        </div>
    );
};

export default Spinner;
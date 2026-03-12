import React from 'react';

// This component expects the 'animate-grow-bar' utility class to be defined
// in a global CSS file, which is handled in index.html's <style> tag.
export const ProcessingIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
    <div className="flex items-end justify-center h-20 w-24 gap-2" {...props} aria-label="Processing data animation">
        <div className="w-4 bg-teal-400 rounded-lg animate-grow-bar" style={{ animationDelay: '0s', height: '60%' }}></div>
        <div className="w-4 bg-teal-400 rounded-lg animate-grow-bar" style={{ animationDelay: '0.15s', height: '80%' }}></div>
        <div className="w-4 bg-teal-400 rounded-lg animate-grow-bar" style={{ animationDelay: '0.3s', height: '100%' }}></div>
        <div className="w-4 bg-teal-400 rounded-lg animate-grow-bar" style={{ animationDelay: '0.45s', height: '80%' }}></div>
        <div className="w-4 bg-teal-400 rounded-lg animate-grow-bar" style={{ animationDelay: '0.6s', height: '60%' }}></div>
    </div>
);

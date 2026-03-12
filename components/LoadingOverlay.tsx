import React from 'react';
import { ProcessingIcon } from './icons/ProcessingIcon.tsx';

interface LoadingOverlayProps {
    isActive: boolean;
    message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isActive, message }) => {
    // Using CSS for transitions, so we render the component but control visibility with classes
    return (
        <div
            className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-center items-center z-50 transition-opacity duration-300 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            role="alert"
            aria-live="assertive"
            aria-busy={isActive}
        >
            <ProcessingIcon />
            <p className="mt-8 text-xl font-semibold text-teal-300 text-center px-4">
                {message || 'Loading...'}
            </p>
        </div>
    );
};

export default LoadingOverlay;
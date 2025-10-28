import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <ThemeProvider>
            <SupabaseProvider>
                <App />
            </SupabaseProvider>
        </ThemeProvider>
    </React.StrictMode>
);
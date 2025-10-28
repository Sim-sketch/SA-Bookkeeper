import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import SupabaseConnectForm from '../components/SupabaseConnectForm';
import Spinner from '../components/Spinner';

interface SupabaseContextType {
    client: SupabaseClient;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
    const [client, setClient] = useState<SupabaseClient | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const url = localStorage.getItem('SUPABASE_URL');
        const key = localStorage.getItem('SUPABASE_ANON_KEY');
        if (url && key) {
            try {
                const supabaseClient = createClient(url, key);
                setClient(supabaseClient);
            } catch (error) {
                console.error("Failed to initialize Supabase client:", error);
                // Clear bad credentials
                localStorage.removeItem('SUPABASE_URL');
                localStorage.removeItem('SUPABASE_ANON_KEY');
            }
        }
        setIsInitializing(false);
    }, []);

    const handleConnect = (url: string, key: string) => {
        try {
            const supabaseClient = createClient(url, key);
            localStorage.setItem('SUPABASE_URL', url);
            localStorage.setItem('SUPABASE_ANON_KEY', key);
            setClient(supabaseClient);
        } catch (error) {
            console.error("Failed to connect to Supabase:", error);
            // The form component will handle displaying this error to the user
        }
    };

    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
                <Spinner />
                <p className="mt-4 text-teal-400">Initializing connection...</p>
            </div>
        );
    }

    if (!client) {
        return <SupabaseConnectForm onConnect={handleConnect} />;
    }

    return (
        <SupabaseContext.Provider value={{ client }}>
            {children}
        </SupabaseContext.Provider>
    );
};

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (!context) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};

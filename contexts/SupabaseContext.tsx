import React, { createContext, useContext, ReactNode, useState, useMemo, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The context will now provide the client or null, plus a loading state
// to indicate that initialization is in progress.
interface SupabaseContextType {
    client: SupabaseClient | null;
    isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({ client: null, isLoading: true });

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
    const [client, setClient] = useState<SupabaseClient | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // This effect runs once on mount to initialize the client from localStorage.
    useEffect(() => {
        try {
            const supabaseUrl = localStorage.getItem('supabase_url') || process.env.SUPABASE_URL;
            const supabaseAnonKey = localStorage.getItem('supabase_anon_key') || process.env.SUPABASE_ANON_KEY;
    
            if (supabaseUrl && supabaseAnonKey) {
                // Only create a client if we have the credentials.
                setClient(createClient(supabaseUrl, supabaseAnonKey));
            } else {
                setClient(null);
            }
        } catch (error) {
             console.error("Failed to create Supabase client:", error);
             setClient(null);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array ensures this runs once after initial render.

    const value = useMemo(() => ({
        client,
        isLoading,
    }), [client, isLoading]);

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    );
};

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};
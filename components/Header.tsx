import React from 'react';
import { Session } from '@supabase/supabase-js';
import { useSupabase } from '../contexts/SupabaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface HeaderProps {
    session: Session | null;
}

const Header: React.FC<HeaderProps> = ({ session }) => {
    const { client: supabase } = useSupabase();
    const { theme, toggleTheme } = useTheme();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        SA <span className="text-teal-500 dark:text-teal-400">Bookkeeper AI</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Your Automated Accounting Partner</p>
                </div>
                <div className="flex items-center gap-4">
                     <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                    {session && (
                        <>
                            <span className="text-sm text-gray-600 dark:text-slate-300 hidden md:block">{session.user.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
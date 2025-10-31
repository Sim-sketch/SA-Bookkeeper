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
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20">
            <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                        SA <span className="text-teal-500 dark:text-teal-400">Bookkeeper AI</span>
                    </h1>
                    <p className="text-sm text-slate-500">Your Automated Accounting Partner</p>
                </div>
                <div className="flex items-center gap-4">
                     <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                    {session && (
                        <>
                            <span className="text-sm text-slate-600 dark:text-slate-300 hidden md:block">{session.user.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 focus:ring-teal-500"
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
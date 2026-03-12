import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { SunIcon } from './icons/SunIcon.tsx';
import { MoonIcon } from './icons/MoonIcon.tsx';
import { SearchIcon } from './icons/SearchIcon.tsx';

interface HeaderProps {
    searchQuery?: string;
    onSearch?: (query: string) => void;
    logoUrl?: string;
    companyName?: string;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearch, logoUrl, companyName }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20">
            <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                    {logoUrl ? (
                        <img src={logoUrl} alt={companyName || "Company Logo"} className="h-10 w-auto object-contain rounded-md" />
                    ) : null}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white leading-tight">
                            {companyName || "SA Bookkeeper AI"}
                        </h1>
                        {!companyName && <p className="text-xs text-slate-500 hidden sm:block">Your Automated Accounting Partner</p>}
                    </div>
                </div>

                {user && onSearch && (
                    <div className="flex-1 max-w-md mx-2 lg:mx-8 hidden sm:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full p-2 pl-10 text-sm text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-all"
                                placeholder="Search transactions..."
                                value={searchQuery || ''}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 flex-shrink-0">
                     <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 hidden lg:flex">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.displayName || 'User'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                </div>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold">
                                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={logout}
                                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 focus:ring-teal-500"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
             {/* Mobile Search Bar - Visible only on small screens */}
             {user && onSearch && (
                <div className="sm:hidden px-4 pb-4">
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full p-2 pl-10 text-sm text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-all"
                            placeholder="Search transactions..."
                            value={searchQuery || ''}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
             )}
        </header>
    );
};

export default Header;
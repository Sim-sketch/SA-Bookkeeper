

import React from 'react';
import { View } from '../types';
import { BookIcon } from './icons/BookIcon';
import { ChartIcon } from './icons/ChartIcon';
import { AnalysisIcon } from './icons/AnalysisIcon';
import { RulesIcon } from './icons/RulesIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ChatIcon } from './icons/ChatIcon';

interface NavigationProps {
    activeView: View;
    setView: (view: View) => void;
}

const NavButton: React.FC<{
    label: string;
    view: View;
    activeView: View;
    setView: (view: View) => void;
    icon: React.ReactNode;
}> = ({ label, view, activeView, setView, icon }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => setView(view)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500
                ${isActive
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-white'
                }`}
        >
            {icon}
            {label}
        </button>
    );
};

const Navigation: React.FC<NavigationProps> = ({ activeView, setView }) => {
    return (
        <nav className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg flex flex-wrap gap-2 justify-center md:justify-start">
            <NavButton label="AI Chat" view={View.AI_CHAT} activeView={activeView} setView={setView} icon={<ChatIcon className="w-4 h-4" />}/>
            <NavButton label="Journal" view={View.JOURNAL} activeView={activeView} setView={setView} icon={<BookIcon className="w-4 h-4" />}/>
            <NavButton label="Trial Balance" view={View.TRIAL_BALANCE} activeView={activeView} setView={setView} icon={<BookIcon className="w-4 h-4" />}/>
            <NavButton label="Profit & Loss" view={View.PROFIT_LOSS} activeView={activeView} setView={setView} icon={<ChartIcon className="w-4 h-4" />}/>
            <NavButton label="Cash Flow" view={View.CASH_FLOW} activeView={activeView} setView={setView} icon={<TrendingUpIcon className="w-4 h-4" />}/>
            <NavButton label="Financial Statements" view={View.STATEMENTS} activeView={activeView} setView={setView} icon={<ChartIcon className="w-4 h-4" />}/>
            <NavButton label="AI Analysis" view={View.ANALYSIS} activeView={activeView} setView={setView} icon={<AnalysisIcon className="w-4 h-4" />}/>
            <NavButton label="Categorization Rules" view={View.RULES} activeView={activeView} setView={setView} icon={<RulesIcon className="w-4 h-4" />}/>
        </nav>
    );
};

export default Navigation;
import React from 'react';
import { View } from '../types';
import { BookIcon } from './icons/BookIcon';
import { ChartIcon } from './icons/ChartIcon';
import { AnalysisIcon } from './icons/AnalysisIcon';
import { RulesIcon } from './icons/RulesIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ChatIcon } from './icons/ChatIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { DashboardIcon } from './icons/DashboardIcon';

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
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-teal-500
                ${isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300'
                    : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200'
                }`}
        >
            {icon}
            {label}
        </button>
    );
};

const Navigation: React.FC<NavigationProps> = ({ activeView, setView }) => {
    return (
        <nav className="p-2 bg-slate-100 dark:bg-slate-800/60 rounded-lg flex flex-wrap gap-2 justify-center md:justify-start">
            <NavButton label="Dashboard" view={View.DASHBOARD} activeView={activeView} setView={setView} icon={<DashboardIcon className="w-4 h-4" />}/>
            <NavButton label="Journal" view={View.JOURNAL} activeView={activeView} setView={setView} icon={<BookIcon className="w-4 h-4" />}/>
            <NavButton label="Trial Balance" view={View.TRIAL_BALANCE} activeView={activeView} setView={setView} icon={<BookIcon className="w-4 h-4" />}/>
            <NavButton label="Profit & Loss" view={View.PROFIT_LOSS} activeView={activeView} setView={setView} icon={<ChartIcon className="w-4 h-4" />}/>
            <NavButton label="Cash Flow" view={View.CASH_FLOW} activeView={activeView} setView={setView} icon={<TrendingUpIcon className="w-4 h-4" />}/>
            <NavButton label="Financial Statements" view={View.STATEMENTS} activeView={activeView} setView={setView} icon={<ChartIcon className="w-4 h-4" />}/>
            <NavButton label="AI Analysis" view={View.ANALYSIS} activeView={activeView} setView={setView} icon={<AnalysisIcon className="w-4 h-4" />}/>
            <NavButton label="Categorization Rules" view={View.RULES} activeView={activeView} setView={setView} icon={<RulesIcon className="w-4 h-4" />}/>
            <NavButton label="Settings" view={View.SETTINGS} activeView={activeView} setView={setView} icon={<SettingsIcon className="w-4 h-4" />}/>
        </nav>
    );
};

export default Navigation;
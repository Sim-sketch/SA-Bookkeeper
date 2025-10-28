

import React, { useState } from 'react';
import { CategorizationRule } from '../types';
import { XIcon } from './icons/XIcon';

interface RulesViewProps {
    rules: CategorizationRule[];
    onAddRule: (rule: Omit<CategorizationRule, 'id'>) => void;
    onDeleteRule: (id: string) => void;
}

const CATEGORY_OPTIONS: CategorizationRule['category'][] = [
    'Operating Expense',
    'Revenue',
    'Personal',
    'Financing',
    'Investing'
];

const RulesView: React.FC<RulesViewProps> = ({ rules, onAddRule, onDeleteRule }) => {
    const [keyword, setKeyword] = useState('');
    const [account, setAccount] = useState('');
    const [category, setCategory] = useState<CategorizationRule['category']>('Operating Expense');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim() || !account.trim()) {
            alert('Please fill in all fields.');
            return;
        }
        onAddRule({ keyword, account, category });
        setKeyword('');
        setAccount('');
        setCategory('Operating Expense');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-4 md:p-6">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Add New Rule</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            If description contains...
                        </label>
                        <input
                            id="keyword"
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="e.g., Shoprite, Eskom"
                            className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                    </div>
                     <div>
                        <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Assign this account
                        </label>
                        <input
                            id="account"
                            type="text"
                            value={account}
                            onChange={(e) => setAccount(e.target.value)}
                            placeholder="e.g., Groceries Expense, Electricity"
                             className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                           Set category to
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as CategorizationRule['category'])}
                             className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        >
                            {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-sm font-medium rounded-md transition-colors bg-teal-500 text-white shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
                    >
                        Add Rule
                    </button>
                </form>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-4 md:p-6">
                 <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Existing Rules</h2>
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                     {rules.length === 0 && (
                        <p className="text-gray-500 dark:text-slate-400 text-center py-4">You have no custom rules yet.</p>
                     )}
                     {rules.map(rule => (
                        <div key={rule.id} className="flex justify-between items-center bg-gray-100 dark:bg-slate-700/50 p-3 rounded-md">
                            <div className="text-sm">
                                <span className="text-gray-500 dark:text-slate-400">If text contains </span>
                                <span className="font-semibold text-teal-600 dark:text-teal-400">"{rule.keyword}"</span>,
                                <span className="text-gray-500 dark:text-slate-400"> assign </span>
                                <span className="font-semibold text-gray-800 dark:text-white">{rule.account}</span>
                                <span className="text-gray-400 dark:text-slate-500 text-xs"> ({rule.category})</span>
                            </div>
                            <button onClick={() => onDeleteRule(rule.id)} className="text-red-500 hover:text-red-400" aria-label="Delete rule">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default RulesView;
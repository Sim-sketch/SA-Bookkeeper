import React, { useState, useMemo } from 'react';
import { CategorizationRule, TRANSACTION_CATEGORIES } from '../types.ts';
import { WandIcon } from './icons/WandIcon.tsx';
import { SearchIcon } from './icons/SearchIcon.tsx';
import { EditIcon } from './icons/EditIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { SaveIcon } from './icons/SaveIcon.tsx';

interface RulesViewProps {
    rules: CategorizationRule[];
    onAddRule: (rule: Omit<CategorizationRule, 'id'>) => void;
    onUpdateRule?: (rule: CategorizationRule) => void;
    onDeleteRule: (id: string) => void;
    onApplyRules?: () => void;
    knownAccounts?: string[];
}

const RulesView: React.FC<RulesViewProps> = ({ rules, onAddRule, onUpdateRule, onDeleteRule, onApplyRules, knownAccounts = [] }) => {
    // Form State
    const [keyword, setKeyword] = useState('');
    const [account, setAccount] = useState('');
    const [category, setCategory] = useState<CategorizationRule['category']>('Operating Expense');
    const [editingId, setEditingId] = useState<string | null>(null);

    // List State
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim() || !account.trim()) {
            alert('Please fill in all fields.');
            return;
        }

        if (editingId && onUpdateRule) {
            onUpdateRule({ id: editingId, keyword, account, category });
            setEditingId(null);
        } else {
            onAddRule({ keyword, account, category });
        }
        
        resetForm();
    };

    const handleEdit = (rule: CategorizationRule) => {
        setKeyword(rule.keyword);
        setAccount(rule.account);
        setCategory(rule.category);
        setEditingId(rule.id);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setKeyword('');
        setAccount('');
        setCategory('Operating Expense');
        setEditingId(null);
    };

    const filteredRules = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return rules.filter(r => 
            r.keyword.toLowerCase().includes(lowerSearch) || 
            r.account.toLowerCase().includes(lowerSearch) ||
            r.category.toLowerCase().includes(lowerSearch)
        );
    }, [rules, searchTerm]);

    const formInputClasses = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition";
    const labelClasses = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <WandIcon className="w-8 h-8 text-teal-300" />
                        Automation Rules
                    </h1>
                    <p className="text-teal-100 mt-2 max-w-xl">
                        Create rules to automatically categorize transactions based on description keywords. 
                        This saves time and ensures consistency in your books.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="text-4xl font-bold text-teal-300">{rules.length}</div>
                    <div className="text-sm font-medium opacity-80">Active Rules</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Rule Editor Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sticky top-24">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingId ? 'Edit Rule' : 'New Rule'}
                            </h2>
                            {editingId && (
                                <button onClick={resetForm} className="text-xs text-red-500 hover:underline">Cancel Edit</button>
                            )}
                        </div>
                        
                        <datalist id="known-accounts-rules">
                            {knownAccounts.map(acc => <option key={acc} value={acc} />)}
                        </datalist>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="keyword" className={labelClasses}>Trigger Keyword</label>
                                <div className="relative">
                                    <input
                                        id="keyword"
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="e.g. Uber, Adobe, Monthly Fee"
                                        className={formInputClasses}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 pl-1">If description contains this text...</p>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="account" className={labelClasses}>Assign To Account</label>
                                <input
                                    id="account"
                                    type="text"
                                    value={account}
                                    onChange={(e) => setAccount(e.target.value)}
                                    placeholder="e.g. Travel, Software Subs"
                                    className={formInputClasses}
                                    list="known-accounts-rules"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="category" className={labelClasses}>Set Category</label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as CategorizationRule['category'])}
                                    className={formInputClasses}
                                >
                                    {TRANSACTION_CATEGORIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm mt-2"
                            >
                                {editingId ? <SaveIcon className="w-4 h-4" /> : <div className="text-lg font-bold leading-none mb-0.5">+</div>}
                                {editingId ? 'Update Rule' : 'Add Rule'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Rules List */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                                placeholder="Search rules..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {onApplyRules && (
                            <button
                                onClick={onApplyRules}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-full sm:w-auto justify-center"
                            >
                                <WandIcon className="w-4 h-4" />
                                Run Automation Now
                            </button>
                        )}
                    </div>

                    {/* Rules Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">If Description Contains</th>
                                        <th className="px-6 py-4">Set Account</th>
                                        <th className="px-6 py-4">Set Category</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredRules.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <WandIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                                    <p className="font-medium">No rules found.</p>
                                                    <p className="text-sm mt-1">Create a rule to automate your bookkeeping.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRules.map((rule) => (
                                            <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                    "{rule.keyword}"
                                                </td>
                                                <td className="px-6 py-4 font-medium text-teal-600 dark:text-teal-400">
                                                    {rule.account}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                        {rule.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleEdit(rule)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Edit Rule"
                                                        >
                                                            <EditIcon className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => onDeleteRule(rule.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Delete Rule"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RulesView;
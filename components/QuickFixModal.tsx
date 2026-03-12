import React, { useState, useMemo } from 'react';
import { Transaction, TAX_CATEGORIES, TRANSACTION_CATEGORIES } from '../types.ts';
import { WandIcon } from './icons/WandIcon.tsx';
import { XIcon } from './icons/XIcon.tsx';

interface QuickFixModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    onApply: (ids: string[], updates: any) => void;
    knownAccounts: string[];
}

const formInputClasses = "w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition";

const QuickFixModal: React.FC<QuickFixModalProps> = ({ isOpen, onClose, transactions, onApply, knownAccounts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchUncategorizedOnly, setSearchUncategorizedOnly] = useState(true); // Default to safer option
    const [updates, setUpdates] = useState({
        debitAccount: '',
        creditAccount: '',
        category: '',
        taxCategory: ''
    });

    // Find matches
    const matchingTransactions = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        
        let pool = transactions;
        if (searchUncategorizedOnly) {
            pool = transactions.filter(t => 
                !t.category || t.category === 'Uncategorized' || 
                !t.debitAccount || t.debitAccount === 'Uncategorized'
            );
        }

        return pool.filter(t => t.description.toLowerCase().includes(term));
    }, [transactions, searchTerm, searchUncategorizedOnly]);

    if (!isOpen) return null;

    const handleApply = () => {
        if (matchingTransactions.length === 0) return;
        
        // Filter out empty fields
        const validUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => (v as string).trim() !== '')
        );

        if (Object.keys(validUpdates).length === 0) {
            alert("Please specify at least one field to update.");
            return;
        }

        onApply(matchingTransactions.map(t => t.id), validUpdates);
        onClose();
        setSearchTerm('');
        setUpdates({ debitAccount: '', creditAccount: '', category: '', taxCategory: '' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <WandIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Quick Fix Tool
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Search Step */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold uppercase text-slate-500">1. Find Transactions</label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-600 dark:text-slate-400">
                                <input 
                                    type="checkbox" 
                                    checked={searchUncategorizedOnly} 
                                    onChange={(e) => setSearchUncategorizedOnly(e.target.checked)}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                Search Uncategorized Only
                            </label>
                        </div>
                        <input 
                            className={formInputClasses} 
                            placeholder="Search description (e.g., 'Wesbank', 'Uber')"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-slate-500">
                            Found: <strong className="text-teal-600">{matchingTransactions.length}</strong> matching transactions.
                        </p>
                        
                        {matchingTransactions.length > 0 && (
                            <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                {matchingTransactions.map(t => (
                                    <div key={t.id} className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-1 last:border-0 last:pb-0">
                                        <span className="truncate">{t.description}</span>
                                        <span className="font-mono flex-shrink-0 text-slate-400">{t.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Update Step */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase text-slate-500">2. Set Values To</label>
                        <datalist id="quick-fix-accounts">
                            {knownAccounts.map(acc => <option key={acc} value={acc} />)}
                        </datalist>

                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                className={formInputClasses} 
                                placeholder="Debit Account"
                                list="quick-fix-accounts"
                                value={updates.debitAccount}
                                onChange={e => setUpdates({...updates, debitAccount: e.target.value})}
                            />
                            <input 
                                className={formInputClasses} 
                                placeholder="Credit Account"
                                list="quick-fix-accounts"
                                value={updates.creditAccount}
                                onChange={e => setUpdates({...updates, creditAccount: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select 
                                className={formInputClasses}
                                value={updates.category}
                                onChange={e => setUpdates({...updates, category: e.target.value})}
                            >
                                <option value="">No Category Change</option>
                                {TRANSACTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select 
                                className={formInputClasses}
                                value={updates.taxCategory}
                                onChange={e => setUpdates({...updates, taxCategory: e.target.value})}
                            >
                                <option value="">No Tax Change</option>
                                {TAX_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">Cancel</button>
                    <button 
                        onClick={handleApply} 
                        disabled={matchingTransactions.length === 0}
                        className="px-6 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                    >
                        Apply Fix
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickFixModal;
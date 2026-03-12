import React, { useState } from 'react';
import { Transaction, TAX_CATEGORIES, TRANSACTION_CATEGORIES } from '../types.ts';
import { suggestCategorization } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';
import { WandIcon } from './icons/WandIcon.tsx';

interface ManualTransactionFormProps {
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    knownAccounts?: string[];
}

const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'Debit' as 'Debit' | 'Credit',
    debitAccount: '',
    creditAccount: '',
    category: 'Operating Expense',
    taxCategory: 'VAT Standard Rate (15%)',
};

const formInputClasses = "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition shadow-sm";
const labelClasses = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5";

const ManualTransactionForm: React.FC<ManualTransactionFormProps> = ({ onAddTransaction, knownAccounts = [] }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSuggest = async () => {
        if (!formData.description) {
            setError("Please enter a description (e.g. 'Checkers Groceries') first.");
            return;
        }
        setIsSuggesting(true);
        setError(null);
        try {
            const suggestion = await suggestCategorization(
                formData.description, 
                parseFloat(formData.amount) || 0, 
                formData.type
            );
            setFormData(prev => ({ ...prev, ...suggestion }));
        } catch (e: any) {
            setError("AI could not suggest categories. Please fill manually.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { date, description, amount, type, debitAccount, creditAccount, category, taxCategory } = formData;
        if (!date || !description || !amount || !debitAccount || !creditAccount) {
            setError("Please fill all mandatory fields.");
            return;
        }
        onAddTransaction({
            date,
            description,
            amount: parseFloat(amount),
            type,
            debitAccount,
            creditAccount,
            category,
            taxCategory: taxCategory as any,
        });
        setFormData({ ...initialFormState, date: new Date().toISOString().split('T')[0] });
        setError(null);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Record Transaction</h3>
                <button 
                    type="button" 
                    onClick={handleSuggest} 
                    disabled={isSuggesting || !formData.description} 
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full hover:bg-teal-100 transition-colors disabled:opacity-50"
                >
                    {isSuggesting ? <Spinner className="w-3 h-3" /> : <WandIcon className="w-3.5 h-3.5" />}
                    {isSuggesting ? 'Analyzing...' : 'AI Categorize'}
                </button>
            </div>
            
            <datalist id="known-accounts">
                {knownAccounts.map(acc => <option key={acc} value={acc} />)}
            </datalist>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-2">
                        <label className={labelClasses}>Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className={formInputClasses} required />
                    </div>
                    <div className="lg:col-span-5">
                        <label className={labelClasses}>Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., FNB Monthly Fee" className={formInputClasses} required />
                    </div>
                    <div className="lg:col-span-3">
                        <label className={labelClasses}>Amount (ZAR)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R</span>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" className={`${formInputClasses} pl-8`} required step="0.01" />
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <label className={labelClasses}>Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className={formInputClasses}>
                            <option value="Debit">Money Out</option>
                            <option value="Credit">Money In</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClasses}>Debit Account</label>
                        <input type="text" name="debitAccount" value={formData.debitAccount} onChange={handleChange} placeholder="e.g. Bank Charges" className={formInputClasses} required list="known-accounts" />
                    </div>
                    <div>
                        <label className={labelClasses}>Credit Account</label>
                        <input type="text" name="creditAccount" value={formData.creditAccount} onChange={handleChange} placeholder="e.g. Bank" className={formInputClasses} required list="known-accounts" />
                    </div>
                    <div>
                        <label className={labelClasses}>Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className={formInputClasses}>
                            {TRANSACTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Tax Code</label>
                        <select name="taxCategory" value={formData.taxCategory} onChange={handleChange} className={formInputClasses}>
                            {TAX_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {error && <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">{error}</p>}

                <div className="flex justify-end pt-2">
                    <button type="submit" className="px-8 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all transform active:scale-95">
                        Add Entry
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManualTransactionForm;
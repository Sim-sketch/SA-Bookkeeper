import React, { useState } from 'react';
import { Transaction } from '../types';
import { suggestCategorization } from '../services/geminiService';
import Spinner from './Spinner';
import { WandIcon } from './icons/WandIcon';

interface ManualTransactionFormProps {
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'Debit' as 'Debit' | 'Credit',
    debitAccount: '',
    creditAccount: '',
    category: '',
};

const formInputClasses = "w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition";
const btnPrimaryClasses = "inline-flex justify-center items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const btnSecondaryClasses = "inline-flex justify-center items-center rounded-md bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const ManualTransactionForm: React.FC<ManualTransactionFormProps> = ({ onAddTransaction }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSuggest = async () => {
        if (!formData.description || !formData.amount) {
            setError("Please enter a description and amount first.");
            return;
        }
        setIsSuggesting(true);
        setError(null);
        try {
            const suggestion = await suggestCategorization(
                formData.description, 
                parseFloat(formData.amount), 
                formData.type
            );
            setFormData(prev => ({ ...prev, ...suggestion }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { date, description, amount, type, debitAccount, creditAccount, category } = formData;
        if (!date || !description || !amount || !debitAccount || !creditAccount || !category) {
            setError("Please fill all fields before adding.");
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
        });
        setFormData(initialFormState); // Reset form
        setError(null);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-bold text-teal-600 dark:text-teal-300 mb-4">Add Manual Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={formInputClasses} required />
                    <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Description (e.g., Office supplies from CNA)" className={`${formInputClasses} md:col-span-2`} required />
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="Amount (R)" className={formInputClasses} required step="0.01" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <select name="type" value={formData.type} onChange={handleChange} className={formInputClasses}>
                        <option value="Debit">Money Out</option>
                        <option value="Credit">Money In</option>
                    </select>
                    <input type="text" name="debitAccount" value={formData.debitAccount} onChange={handleChange} placeholder="Debit Account" className={formInputClasses} required />
                    <input type="text" name="creditAccount" value={formData.creditAccount} onChange={handleChange} placeholder="Credit Account" className={formInputClasses} required />
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" className={formInputClasses} required />
                </div>
                 {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                     <button type="submit" className={`${btnPrimaryClasses} flex-grow`}>Add Transaction</button>
                     <button type="button" onClick={handleSuggest} disabled={isSuggesting} className={`${btnSecondaryClasses} flex-grow flex items-center justify-center gap-2`}>
                        {isSuggesting ? <Spinner /> : <WandIcon className="w-4 h-4" />}
                        {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                     </button>
                </div>
            </form>
        </div>
    );
};

export default ManualTransactionForm;
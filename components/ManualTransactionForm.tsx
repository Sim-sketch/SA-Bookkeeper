

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
        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 dark:text-teal-300 mb-4">Add Manual Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" required />
                    <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Description (e.g., Office supplies from CNA)" className="form-input md:col-span-2" required />
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="Amount (R)" className="form-input" required step="0.01" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <select name="type" value={formData.type} onChange={handleChange} className="form-input">
                        <option value="Debit">Money Out</option>
                        <option value="Credit">Money In</option>
                    </select>
                    <input type="text" name="debitAccount" value={formData.debitAccount} onChange={handleChange} placeholder="Debit Account" className="form-input" required />
                    <input type="text" name="creditAccount" value={formData.creditAccount} onChange={handleChange} placeholder="Credit Account" className="form-input" required />
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="form-input" required />
                </div>
                 {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                     <button type="submit" className="btn-primary flex-grow">Add Transaction</button>
                     <button type="button" onClick={handleSuggest} disabled={isSuggesting} className="btn-secondary flex-grow flex items-center justify-center gap-2">
                        {isSuggesting ? <Spinner /> : <WandIcon className="w-4 h-4" />}
                        {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                     </button>
                </div>
            </form>
            {/* FIX: Removed unsupported `jsx` prop from style tag. */}
            <style>{`
                .dark .form-input {
                    background-color: #334155; /* slate-700 */
                    border-color: #475569; /* slate-600 */
                    color: white;
                }
                .form-input {
                    background-color: #f1f5f9; /* slate-100 */
                    border: 1px solid #cbd5e1; /* slate-300 */
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    color: #1e293b; /* slate-800 */
                    width: 100%;
                }
                .form-input:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #14b8a6; /* ring-2 ring-teal-500 */
                    border-color: #14b8a6;
                }
                .btn-primary {
                     background-color: #14b8a6; /* teal-500 */
                     color: white;
                     padding: 0.5rem 1rem;
                     border-radius: 0.375rem;
                     font-weight: 500;
                     transition: background-color 0.2s;
                }
                .btn-primary:hover {
                    background-color: #0d9488; /* teal-600 */
                }
                .dark .btn-secondary {
                    background-color: #475569; /* slate-600 */
                }
                .dark .btn-secondary:hover {
                    background-color: #64748b; /* slate-500 */
                }
                .btn-secondary {
                     background-color: #e2e8f0; /* slate-200 */
                     color: #334155; /* slate-700 */
                     padding: 0.5rem 1rem;
                     border-radius: 0.375rem;
                     font-weight: 500;
                     transition: background-color 0.2s;
                }
                .btn-secondary:hover {
                    background-color: #cbd5e1; /* slate-300 */
                }
                .btn-secondary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ManualTransactionForm;
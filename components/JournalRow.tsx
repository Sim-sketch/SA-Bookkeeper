import React, { useState, useEffect } from 'react';
import { Transaction, TAX_CATEGORIES, TRANSACTION_CATEGORIES } from '../types.ts';
import { EditIcon } from './icons/EditIcon.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';
import { XIcon } from './icons/XIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';

interface JournalRowProps {
    transaction: Transaction;
    isEditing: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onEdit: (id: string) => void;
    onSave: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    onCancel: () => void;
    knownAccounts?: string[];
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-2 py-1 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition min-w-[100px]"
    />
);

const JournalRow: React.FC<JournalRowProps> = ({ transaction, isEditing, isSelected, onSelect, onEdit, onSave, onDelete, onCancel, knownAccounts = [] }) => {
    const [editData, setEditData] = useState<Transaction>(transaction);

    useEffect(() => {
        setEditData(transaction);
    }, [transaction]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };
    
    const handleSave = () => {
        onSave(editData);
    };

    if (isEditing) {
        return (
            <tr className="bg-slate-100 dark:bg-slate-800/50">
                <td className="px-6 py-4">
                    {/* Disable checkbox while editing */}
                    <input type="checkbox" checked={isSelected} onChange={() => onSelect(transaction.id)} disabled
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-slate-200 dark:bg-slate-600"
                    />
                </td>
                <td className="px-2 py-2"><InputField type="date" name="date" value={editData.date} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField name="description" value={editData.description} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField name="debitAccount" value={editData.debitAccount} onChange={handleChange} list="known-accounts" /></td>
                <td className="px-2 py-2"><InputField name="creditAccount" value={editData.creditAccount} onChange={handleChange} list="known-accounts" /></td>
                <td className="px-2 py-2">
                     <select 
                        name="category" 
                        value={editData.category} 
                        onChange={handleChange} 
                        className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-2 py-1 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition min-w-[120px]"
                    >
                         {TRANSACTION_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </td>
                <td className="px-2 py-2">
                    <select 
                        name="taxCategory" 
                        value={editData.taxCategory} 
                        onChange={handleChange} 
                        className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-2 py-1 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition min-w-[100px]"
                    >
                         {TAX_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </td>
                <td className="px-2 py-2"><InputField type="number" name="amount" value={editData.amount} onChange={handleChange} /></td>
                <td className="px-2 py-2 text-center sticky right-0 bg-slate-100 dark:bg-slate-800/50">
                    <div className="flex justify-center items-center gap-2">
                         <button onClick={handleSave} className="text-green-500 dark:text-green-400 hover:text-green-400 dark:hover:text-green-300" aria-label="Save"><CheckIcon className="w-5 h-5" /></button>
                         <button onClick={onCancel} className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300" aria-label="Cancel"><XIcon className="w-5 h-5" /></button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className={`group ${isSelected ? 'bg-teal-50 dark:bg-teal-900/40' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40'}`}>
            <td className="px-6 py-4">
                <input type="checkbox" checked={isSelected} onChange={() => onSelect(transaction.id)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-slate-100 dark:bg-slate-900"
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
            <td className="px-6 py-4 min-w-[250px]">{transaction.description}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.debitAccount}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.creditAccount}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.category}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.taxCategory}</td>
            <td className="px-6 py-4 text-right font-mono whitespace-nowrap">{transaction.amount.toFixed(2)}</td>
            <td className={`px-6 py-4 text-center sticky right-0 transition-colors ${isSelected ? 'bg-teal-50 dark:bg-teal-900/40' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/40'}`}>
                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(transaction.id)} className="text-teal-500 dark:text-teal-400 hover:text-teal-400 dark:hover:text-teal-300" aria-label="Edit">
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(transaction.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" aria-label="Delete">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default JournalRow;
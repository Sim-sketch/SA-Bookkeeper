import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface JournalRowProps {
    transaction: Transaction;
    isEditing: boolean;
    onEdit: (id: string) => void;
    onSave: (transaction: Transaction) => void;
    onCancel: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none min-w-[100px]"
    />
);

const JournalRow: React.FC<JournalRowProps> = ({ transaction, isEditing, onEdit, onSave, onCancel }) => {
    const [editData, setEditData] = useState<Transaction>(transaction);

    useEffect(() => {
        setEditData(transaction);
    }, [transaction]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <tr className="bg-gray-100 dark:bg-slate-700/50">
                <td className="px-2 py-2"><InputField type="date" name="date" value={editData.date} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField name="description" value={editData.description} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField name="debitAccount" value={editData.debitAccount} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField name="creditAccount" value={editData.creditAccount} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField name="category" value={editData.category} onChange={handleChange} /></td>
                <td className="px-2 py-2"><InputField type="number" name="amount" value={editData.amount} onChange={handleChange} /></td>
                <td className="px-2 py-2 text-center sticky right-0 bg-gray-100 dark:bg-slate-700/50">
                    <div className="flex justify-center items-center gap-2">
                         <button onClick={handleSave} className="text-green-500 dark:text-green-400 hover:text-green-400 dark:hover:text-green-300" aria-label="Save"><CheckIcon className="w-5 h-5" /></button>
                         <button onClick={onCancel} className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300" aria-label="Cancel"><XIcon className="w-5 h-5" /></button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/30 group">
            <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
            <td className="px-6 py-4 min-w-[250px]">{transaction.description}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.debitAccount}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.creditAccount}</td>
            <td className="px-6 py-4 whitespace-nowrap">{transaction.category}</td>
            <td className="px-6 py-4 text-right font-mono whitespace-nowrap">{transaction.amount.toFixed(2)}</td>
            <td className="px-6 py-4 text-center sticky right-0 bg-white dark:bg-slate-800/50 group-hover:bg-gray-100 dark:group-hover:bg-slate-700/30 transition-colors">
                <button onClick={() => onEdit(transaction.id)} className="text-teal-500 dark:text-teal-400 hover:text-teal-400 dark:hover:text-teal-300" aria-label="Edit">
                    <EditIcon className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

export default JournalRow;
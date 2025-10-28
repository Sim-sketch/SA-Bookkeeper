import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import JournalRow from './JournalRow';
import ManualTransactionForm from './ManualTransactionForm';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface JournalViewProps {
    transactions: Transaction[];
    onUpdateTransaction: (transaction: Transaction) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ transactions, onUpdateTransaction, onAddTransaction }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleEdit = (id: string) => {
        setEditingId(id);
    };

    const handleSave = (transaction: Transaction) => {
        onUpdateTransaction(transaction);
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const { totalDebit, totalCredit } = useMemo(() => {
        const totals = transactions.reduce((acc, tx) => {
            acc.totalDebit += tx.amount; // In journal context, every amount is both a debit and a credit
            acc.totalCredit += tx.amount;
            return acc;
        }, { totalDebit: 0, totalCredit: 0 });
        return totals;
    }, [transactions]);
    
    const isBalanced = totalDebit.toFixed(2) === totalCredit.toFixed(2);

    return (
        <div>
            <ManualTransactionForm onAddTransaction={onAddTransaction} />
            <div className="mt-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300">General Journal</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600 dark:text-slate-300">
                        <thead className="text-xs text-teal-700 dark:text-teal-400 uppercase bg-gray-100 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Debit Account</th>
                                <th scope="col" className="px-6 py-3">Credit Account</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount (R)</th>
                                <th scope="col" className="px-6 py-3 text-center sticky right-0 bg-gray-100 dark:bg-slate-700/50">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                               <JournalRow
                                    key={tx.id}
                                    transaction={tx}
                                    isEditing={editingId === tx.id}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                               />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-slate-700">
                                <td colSpan={5} className="px-6 py-4 text-lg text-right">Totals</td>
                                <td className="px-6 py-4 text-right text-lg font-mono">{totalDebit.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center sticky right-0 bg-gray-100 dark:bg-slate-700">
                                    {isBalanced ? (
                                        <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                                            <CheckIcon className="w-5 h-5" />
                                            <span>Balanced</span>
                                        </div>
                                     ) : (
                                        <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                                            <XIcon className="w-5 h-5" />
                                            <span>Unbalanced</span>
                                        </div>
                                     )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 {transactions.length === 0 && <p className="p-6 text-center text-gray-500 dark:text-slate-400">No transactions to display.</p>}
            </div>
        </div>
    );
};

export default JournalView;
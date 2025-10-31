import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import JournalRow from './JournalRow';
import ManualTransactionForm from './ManualTransactionForm';
import BulkActionsToolbar from './BulkActionsToolbar';
import BulkCategorizeModal, { BulkUpdateData } from './BulkCategorizeModal';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface JournalViewProps {
    transactions: Transaction[];
    onUpdateTransaction: (transaction: Transaction) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onBulkDelete: (ids: string[]) => void;
    onBulkUpdate: (ids: string[], updateData: Partial<Omit<Transaction, 'id'>>) => void;
}

const JournalView: React.FC<JournalViewProps> = ({ transactions, onUpdateTransaction, onAddTransaction, onBulkDelete, onBulkUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);

    const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length;

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
    
    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map(tx => tx.id)));
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} transactions? This action cannot be undone.`)) {
            onBulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    const handleApplyBulkCategorize = (updateData: BulkUpdateData) => {
        onBulkUpdate(Array.from(selectedIds), updateData);
        setIsCategorizeModalOpen(false);
        setSelectedIds(new Set());
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
        <div className="space-y-6">
            <ManualTransactionForm onAddTransaction={onAddTransaction} />
            <BulkCategorizeModal 
                isOpen={isCategorizeModalOpen}
                onClose={() => setIsCategorizeModalOpen(false)}
                onApply={handleApplyBulkCategorize}
            />

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300">General Journal</h2>
                </div>
                {selectedIds.size > 0 && (
                     <div className="p-4">
                        <BulkActionsToolbar selectedCount={selectedIds.size} onDelete={handleBulkDelete} onCategorize={() => setIsCategorizeModalOpen(true)} onClear={() => setSelectedIds(new Set())} />
                     </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} disabled={transactions.length === 0}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 bg-slate-100 dark:bg-slate-900"
                                        aria-label="Select all transactions"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3 font-medium">Date</th>
                                <th scope="col" className="px-6 py-3 font-medium">Description</th>
                                <th scope="col" className="px-6 py-3 font-medium">Debit Account</th>
                                <th scope="col" className="px-6 py-3 font-medium">Credit Account</th>
                                <th scope="col" className="px-6 py-3 font-medium">Category</th>
                                <th scope="col" className="px-6 py-3 text-right font-medium">Amount (R)</th>
                                <th scope="col" className="px-6 py-3 text-center sticky right-0 bg-slate-50 dark:bg-slate-800/50 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                            {transactions.map((tx) => (
                               <JournalRow
                                    key={tx.id}
                                    transaction={tx}
                                    isSelected={selectedIds.has(tx.id)}
                                    onSelect={handleSelectOne}
                                    isEditing={editingId === tx.id}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                               />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50">
                                <td colSpan={6} className="px-6 py-4 text-lg text-right">Totals</td>
                                <td className="px-6 py-4 text-right text-lg font-mono">{totalDebit.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center sticky right-0 bg-slate-50 dark:bg-slate-800/50">
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
                 {transactions.length === 0 && <p className="p-6 text-center text-slate-500 dark:text-slate-400">No transactions to display.</p>}
            </div>
        </div>
    );
};

export default JournalView;
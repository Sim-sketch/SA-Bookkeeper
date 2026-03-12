import React, { useState, useMemo } from 'react';
import { Transaction } from '../types.ts';
import JournalRow from './JournalRow.tsx';
import ManualTransactionForm from './ManualTransactionForm.tsx';
import BulkActionsToolbar from './BulkActionsToolbar.tsx';
import BulkCategorizeModal, { BulkUpdateData } from './BulkCategorizeModal.tsx';
import QuickFixModal from './QuickFixModal.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';
import { XIcon } from './icons/XIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { WandIcon } from './icons/WandIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { convertToCSV, downloadCSV } from '../utils/csv.ts';

interface JournalViewProps {
    transactions: Transaction[];
    onUpdateTransaction: (transaction: Transaction) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onBulkDelete: (ids: string[]) => void;
    onBulkUpdate: (ids: string[], updateData: Partial<Omit<Transaction, 'id'>>) => void;
    knownAccounts?: string[];
    onRefreshRules?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    allTransactionsCount?: number;
    onRefreshData?: () => void;
    onClearFilters?: () => void;
    onDeleteAll?: () => void;
}

const JournalView: React.FC<JournalViewProps> = ({ 
    transactions, 
    onUpdateTransaction, 
    onAddTransaction, 
    onBulkDelete, 
    onBulkUpdate,
    knownAccounts = [],
    onRefreshRules,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    allTransactionsCount,
    onRefreshData,
    onClearFilters,
    onDeleteAll
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
    const [isQuickFixModalOpen, setIsQuickFixModalOpen] = useState(false);
    const [showUncategorizedOnly, setShowUncategorizedOnly] = useState(false);
    
    // Duplicate Management State
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [idsToDelete, setIdsToDelete] = useState<Set<string>>(new Set());

    const displayedTransactions = useMemo(() => {
        if (!showUncategorizedOnly) return transactions;
        return transactions.filter(t => !t.category || t.category === 'Uncategorized' || !t.debitAccount || t.debitAccount === 'Uncategorized');
    }, [transactions, showUncategorizedOnly]);

    const isAllSelected = displayedTransactions.length > 0 && selectedIds.size === displayedTransactions.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(displayedTransactions.map(tx => tx.id)));
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Delete ${selectedIds.size} transactions?`)) {
            onBulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    const handleApplyBulkCategorize = (updateData: BulkUpdateData) => {
        onBulkUpdate(Array.from(selectedIds), updateData);
        setIsCategorizeModalOpen(false);
        setSelectedIds(new Set());
    };

    const handleExportView = () => {
        const csv = convertToCSV(displayedTransactions);
        downloadCSV(csv, `journal-export.csv`);
    };

    const duplicateGroups = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};
        transactions.forEach(tx => {
            const key = `${tx.date}|${tx.amount.toFixed(2)}|${tx.description.trim().toLowerCase()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });
        return Object.values(groups).filter(group => group.length > 1);
    }, [transactions]);

    const handleRemoveDuplicatesClick = () => {
        if (duplicateGroups.length === 0) {
            alert("No duplicates found.");
            return;
        }
        const toDelete = new Set<string>();
        duplicateGroups.forEach(group => {
            for (let i = 1; i < group.length; i++) toDelete.add(group[i].id);
        });
        setIdsToDelete(toDelete);
        setIsDuplicateModalOpen(true);
    };

    const totalDebit = useMemo(() => displayedTransactions.reduce((acc, tx) => acc + tx.amount, 0), [displayedTransactions]);
    
    return (
        <div className="space-y-6">
            <ManualTransactionForm onAddTransaction={onAddTransaction} knownAccounts={knownAccounts} />
            
            <div className="flex flex-wrap items-center justify-end gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {onRefreshData && <button onClick={onRefreshData} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">↻ Refresh</button>}
                <button onClick={() => setShowUncategorizedOnly(!showUncategorizedOnly)} className={`px-3 py-1.5 text-xs border rounded-lg ${showUncategorizedOnly ? 'bg-amber-100 border-amber-200 text-amber-800' : ''}`}>
                    {showUncategorizedOnly ? 'Show All' : 'Uncategorized'}
                </button>
                <div className="flex gap-1 border-r pr-3 mr-1 border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo} 
                        className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        ⟲ Undo
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo} 
                        className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        ⟳ Redo
                    </button>
                </div>
                <button onClick={() => setIsQuickFixModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100">
                    <WandIcon className="w-3.5 h-3.5" /> Quick Fix
                </button>
                <button onClick={handleRemoveDuplicatesClick} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-red-50 text-red-600">
                    <TrashIcon className="w-3.5 h-3.5" /> Duplicates
                </button>
                <button onClick={handleExportView} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg text-teal-700 bg-teal-50">
                    <DownloadIcon className="w-3.5 h-3.5" /> Export
                </button>
                {onDeleteAll && <button onClick={onDeleteAll} className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Clear Journal</button>}
            </div>

            <BulkCategorizeModal isOpen={isCategorizeModalOpen} onClose={() => setIsCategorizeModalOpen(false)} onApply={handleApplyBulkCategorize} />
            <QuickFixModal isOpen={isQuickFixModalOpen} onClose={() => setIsQuickFixModalOpen(false)} transactions={transactions} onApply={onBulkUpdate} knownAccounts={knownAccounts} />

            {isDuplicateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-xl">
                        <h3 className="text-lg font-bold mb-4">Clean Duplicates</h3>
                        <p className="text-sm mb-6">Found {duplicateGroups.length} sets. We will keep one original for each.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsDuplicateModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={() => { onBulkDelete(Array.from(idsToDelete)); setIsDuplicateModalOpen(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Purge {idsToDelete.size} Duplicates</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300">Journal</h2>
                    {allTransactionsCount !== undefined && transactions.length < allTransactionsCount && <button onClick={onClearFilters} className="text-xs text-teal-600 hover:underline">Clear Filters</button>}
                </div>
                {selectedIds.size > 0 && <div className="p-4"><BulkActionsToolbar selectedCount={selectedIds.size} onDelete={handleBulkDelete} onCategorize={() => setIsCategorizeModalOpen(true)} onClear={() => setSelectedIds(new Set())} /></div>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-slate-300" /></th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Debit</th>
                                <th className="px-6 py-3">Credit</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {displayedTransactions.map((tx) => (
                               <JournalRow key={tx.id} transaction={tx} isSelected={selectedIds.has(tx.id)} onSelect={(id) => setSelectedIds(prev => {const next = new Set(prev); if(next.has(id)) next.delete(id); else next.add(id); return next; })} isEditing={editingId === tx.id} onEdit={setEditingId} onSave={(t) => { onUpdateTransaction(t); setEditingId(null); }} onDelete={(id) => confirm('Delete?') && onBulkDelete([id])} onCancel={() => setEditingId(null)} knownAccounts={knownAccounts} />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-slate-50 dark:bg-slate-800/50">
                                <td colSpan={6} className="px-6 py-4 text-right">Journal Total</td>
                                <td className="px-6 py-4 text-right font-mono">R {totalDebit.toFixed(2)}</td>
                                <td className="px-6 py-4"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default JournalView;
import React, { useState } from 'react';

export interface BulkUpdateData {
    debitAccount: string;
    creditAccount: string;
    category: string;
}

interface BulkCategorizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (updateData: BulkUpdateData) => void;
}

const formInputClasses = "w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition";
const btnPrimaryClasses = "inline-flex justify-center items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const btnSecondaryClasses = "inline-flex justify-center items-center rounded-md bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const BulkCategorizeModal: React.FC<BulkCategorizeModalProps> = ({ isOpen, onClose, onApply }) => {
    const [updateData, setUpdateData] = useState<BulkUpdateData>({
        debitAccount: '',
        creditAccount: '',
        category: '',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdateData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleApply = () => {
        if (!updateData.debitAccount || !updateData.creditAccount || !updateData.category) {
            alert('Please fill all fields to apply changes.');
            return;
        }
        onApply(updateData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-teal-600 dark:text-teal-300 mb-4">Bulk Categorize Transactions</h3>
                <div className="space-y-4">
                    <input type="text" name="debitAccount" value={updateData.debitAccount} onChange={handleChange} placeholder="New Debit Account" className={formInputClasses} />
                    <input type="text" name="creditAccount" value={updateData.creditAccount} onChange={handleChange} placeholder="New Credit Account" className={formInputClasses} />
                    <input type="text" name="category" value={updateData.category} onChange={handleChange} placeholder="New Category" className={formInputClasses} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className={btnSecondaryClasses}>Cancel</button>
                    <button onClick={handleApply} className={btnPrimaryClasses}>Apply Changes</button>
                </div>
            </div>
        </div>
    );
};

export default BulkCategorizeModal;
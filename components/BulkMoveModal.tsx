
import React, { useState } from 'react';
import { StoredFile } from '../types';

interface BulkMoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (fileId: string) => void;
    files: StoredFile[];
}

const btnPrimaryClasses = "inline-flex justify-center items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const btnSecondaryClasses = "inline-flex justify-center items-center rounded-md bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const BulkMoveModal: React.FC<BulkMoveModalProps> = ({ isOpen, onClose, onApply, files }) => {
    const [selectedFileId, setSelectedFileId] = useState<string>('');

    if (!isOpen) return null;

    const handleApply = () => {
        // We allow empty string to mean "Detach from file" (No Source)
        onApply(selectedFileId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-teal-600 dark:text-teal-300 mb-4">Move Transactions to File</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Select a bank statement file to associate with the selected transactions.
                </p>
                
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target File</label>
                    <select 
                        value={selectedFileId} 
                        onChange={(e) => setSelectedFileId(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                    >
                        <option value="">(No Source File)</option>
                        {files.map(file => (
                            <option key={file.id} value={file.id}>
                                {file.name} ({new Date(file.uploadDate).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className={btnSecondaryClasses}>Cancel</button>
                    <button onClick={handleApply} className={btnPrimaryClasses}>Move Transactions</button>
                </div>
            </div>
        </div>
    );
};

export default BulkMoveModal;

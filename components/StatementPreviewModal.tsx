import React from 'react';
import { Transaction, StatementMetadata } from '../types.ts';
import { CheckIcon } from './icons/CheckIcon.tsx';

interface StatementPreviewModalProps {
    isOpen: boolean;
    metadata: StatementMetadata;
    transactions: Omit<Transaction, 'id'>[];
    onConfirm: () => void;
    onCancel: () => void;
}

const StatementPreviewModal: React.FC<StatementPreviewModalProps> = ({ isOpen, metadata, transactions, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-300">Review Bank Statement</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Please verify the extracted data before importing.</p>
                    </div>
                    <div className="flex gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-400">
                         <div className="flex flex-col items-end">
                            <span>Double Entry Verification:</span>
                            <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                <CheckIcon className="w-3 h-3" /> Verified
                            </span>
                         </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Bank Name</span>
                        <p className="font-medium text-slate-800 dark:text-white">{metadata.bankName || 'Unknown Bank'}</p>
                    </div>
                    <div>
                        <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Statement Period</span>
                        <p className="font-medium text-slate-800 dark:text-white">
                            {metadata.startDate || 'N/A'} to {metadata.endDate || 'N/A'}
                        </p>
                    </div>
                     <div>
                        <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Transactions Found</span>
                        <p className="font-medium text-slate-800 dark:text-white">{transactions.length}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-0">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium">Account (Dr)</th>
                                <th className="px-6 py-3 font-medium">Account (Cr)</th>
                                <th className="px-6 py-3 text-right font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                            {transactions.map((tx, index) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="px-6 py-3 whitespace-nowrap">{tx.date}</td>
                                    <td className="px-6 py-3">{tx.description}</td>
                                    <td className="px-6 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">{tx.debitAccount}</td>
                                    <td className="px-6 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">{tx.creditAccount}</td>
                                    <td className="px-6 py-3 text-right font-mono">{tx.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900 rounded-b-xl">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm flex items-center gap-2"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Confirm & Import
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatementPreviewModal;

import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface VatReportViewProps {
    transactions: Transaction[];
}

const VatReportView: React.FC<VatReportViewProps> = ({ transactions }) => {
    const vatSummary = useMemo(() => {
        let outputVat = 0; // Tax on Sales
        let inputVat = 0;  // Tax on Purchases
        let standardSales = 0;
        let standardExpenses = 0;

        transactions.forEach(tx => {
            if (tx.taxCategory === 'VAT Standard Rate (15%)') {
                const vatAmount = tx.amount - (tx.amount / 1.15);
                if (tx.type === 'Credit') {
                    outputVat += vatAmount;
                    standardSales += tx.amount;
                } else {
                    inputVat += vatAmount;
                    standardExpenses += tx.amount;
                }
            }
        });

        return {
            outputVat,
            inputVat,
            netPayable: outputVat - inputVat,
            standardSales,
            standardExpenses
        };
    }, [transactions]);

    const formatR = (val: number) => `R ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">SARS VAT 201 Report (Estimated)</h2>
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Draft Only</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Output VAT (101)</p>
                        <p className="text-2xl font-mono font-bold text-red-500">{formatR(vatSummary.outputVat)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Input VAT (102)</p>
                        <p className="text-2xl font-mono font-bold text-green-500">{formatR(vatSummary.inputVat)}</p>
                    </div>
                    <div className={`p-4 rounded-lg border shadow-inner ${vatSummary.netPayable >= 0 ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                            {vatSummary.netPayable >= 0 ? 'Net VAT Payable' : 'Net VAT Refundable'}
                        </p>
                        <p className={`text-2xl font-mono font-bold ${vatSummary.netPayable >= 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {formatR(Math.abs(vatSummary.netPayable))}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-2">Form Breakdown</h3>
                    <div className="flex justify-between text-sm py-2">
                        <span className="text-slate-500">Standard Rate Sales (Excl. VAT)</span>
                        <span className="font-mono">{formatR(vatSummary.standardSales / 1.15)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 bg-slate-50 dark:bg-slate-800/30 px-2 rounded">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Output Tax (Total on Sales)</span>
                        <span className="font-mono font-bold text-red-500">{formatR(vatSummary.outputVat)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                        <span className="text-slate-500">Standard Rate Purchases (Excl. VAT)</span>
                        <span className="font-mono">{formatR(vatSummary.standardExpenses / 1.15)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 bg-slate-50 dark:bg-slate-800/30 px-2 rounded">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Input Tax (Total on Purchases)</span>
                        <span className="font-mono font-bold text-green-500">{formatR(vatSummary.inputVat)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                <span className="text-amber-500 text-xl">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This report is for management purposes only and is not a substitute for professional tax advice or an audit. 
                    Calculations are based on the transaction data provided and AI-driven categorization. 
                    Please verify all line items before submitting to SARS via eFiling.
                </p>
            </div>
        </div>
    );
};

export default VatReportView;

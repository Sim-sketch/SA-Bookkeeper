import React from 'react';
import { Transaction, View, CategorizationRule, PnlData, BalanceSheetData, TrialBalance, CashFlowData } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { SaveIcon } from './icons/SaveIcon';
import { PdfIcon } from './icons/PdfIcon';
import { FileJsonIcon } from './icons/FileJsonIcon';
import { convertToCSV, downloadCSV } from '../utils/csv';
import { exportJournalAsPDF, exportPnlAndBalanceSheetAsPDF, exportTrialBalanceAsPDF, exportCashFlowAsPDF } from '../utils/pdf';

interface ActionToolbarProps {
    transactions: Transaction[];
    rules: CategorizationRule[];
    onSync: () => void;
    activeView: View;
    pnlData: PnlData;
    balanceSheetData: BalanceSheetData;
    trialBalanceData: TrialBalance;
    cashFlowData: CashFlowData;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ transactions, rules, onSync, activeView, pnlData, balanceSheetData, trialBalanceData, cashFlowData }) => {
    
    const handleDownloadCSV = () => {
        const csv = convertToCSV(transactions);
        downloadCSV(csv, `bookkeeping-export-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleDownloadSession = () => {
        const sessionData = {
            transactions,
            rules,
        };
        const jsonString = JSON.stringify(sessionData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sa-bookkeeper-session-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        switch(activeView) {
            case View.JOURNAL:
                exportJournalAsPDF(transactions);
                break;
            case View.TRIAL_BALANCE:
                exportTrialBalanceAsPDF(trialBalanceData);
                break;
            case View.PROFIT_LOSS:
            case View.STATEMENTS:
                exportPnlAndBalanceSheetAsPDF(pnlData, balanceSheetData);
                break;
            case View.CASH_FLOW:
                exportCashFlowAsPDF(cashFlowData);
                break;
        }
    };
    
    const isPdfExportable = [View.JOURNAL, View.PROFIT_LOSS, View.STATEMENTS, View.TRIAL_BALANCE, View.CASH_FLOW].includes(activeView);

    return (
        <div className="mt-4 p-2 bg-gray-100/60 dark:bg-slate-800/60 rounded-lg flex flex-wrap items-center justify-end gap-3">
             <button
                onClick={handleDownloadPdf}
                disabled={!isPdfExportable}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-red-600/80 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isPdfExportable ? "Export current view as PDF" : "PDF export not available for this view"}
            >
                <PdfIcon className="w-4 h-4" />
                Export PDF
            </button>
            <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-blue-600/80 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-blue-500"
            >
                <DownloadIcon className="w-4 h-4" />
                Export CSV
            </button>
             <button
                onClick={handleDownloadSession}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-purple-600/80 text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-purple-500"
            >
                <FileJsonIcon className="w-4 h-4" />
                Export Session
            </button>
            <button
                 onClick={onSync}
                 title={"Save all transactions to the database"}
                 className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-teal-600/80 text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
            >
                <SaveIcon className="w-4 h-4" />
                Save All
            </button>
        </div>
    );
};

export default ActionToolbar;
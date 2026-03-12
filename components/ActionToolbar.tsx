import React from 'react';
import { Transaction, View, CategorizationRule, PnlData, BalanceSheetData, TrialBalance, CashFlowData } from '../types.ts';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { SaveIcon } from './icons/SaveIcon.tsx';
import { PdfIcon } from './icons/PdfIcon.tsx';
import { FileJsonIcon } from './icons/FileJsonIcon.tsx';
import { EyeIcon } from './icons/EyeIcon.tsx';
import { EyeOffIcon } from './icons/EyeOffIcon.tsx';
import { convertToCSV, downloadCSV } from '../utils/csv.ts';
import { exportJournalAsPDF, exportPnlAndBalanceSheetAsPDF, exportTrialBalanceAsPDF, exportCashFlowAsPDF } from '../utils/pdf.ts';
import { sanitizeTransactions } from '../utils/dataUtils.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ActionToolbarProps {
    transactions: Transaction[];
    rules: CategorizationRule[];
    onSync: () => void;
    activeView: View;
    pnlData: PnlData;
    balanceSheetData: BalanceSheetData;
    trialBalanceData: TrialBalance;
    cashFlowData: CashFlowData;
    showAmounts?: boolean;
    onToggleAmounts?: () => void;
    dateRange?: { start: string; end: string };
    onDateRangeChange?: (range: { start: string; end: string }) => void;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ transactions, rules, onSync, activeView, pnlData, balanceSheetData, trialBalanceData, cashFlowData, showAmounts, onToggleAmounts, dateRange, onDateRangeChange }) => {
    const { user } = useAuth();
    
    const handleDownloadCSV = () => {
        const csv = convertToCSV(transactions);
        downloadCSV(csv, `bookkeeping-export-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleDownloadSession = () => {
        const sessionData = {
            transactions: sanitizeTransactions(transactions),
            rules,
        };
        try {
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
        } catch (e) {
            console.error("Failed to generate session backup:", e);
            alert("Failed to generate backup file due to a data error.");
        }
    };

    const handleDownloadPdf = async () => {
        switch(activeView) {
            case View.JOURNAL:
                await exportJournalAsPDF(transactions, user);
                break;
            case View.TRIAL_BALANCE:
                await exportTrialBalanceAsPDF(trialBalanceData, user);
                break;
            case View.PROFIT_LOSS:
            case View.STATEMENTS:
                await exportPnlAndBalanceSheetAsPDF(pnlData, balanceSheetData, user);
                break;
            case View.CASH_FLOW:
                await exportCashFlowAsPDF(cashFlowData, user);
                break;
        }
    };
    
    const isPdfExportable = [View.JOURNAL, View.PROFIT_LOSS, View.STATEMENTS, View.TRIAL_BALANCE, View.CASH_FLOW].includes(activeView);

    // Preset Date Filters
    const setPreset = (type: 'thisYear' | 'lastYear' | 'all') => {
        if (!onDateRangeChange) return;
        const now = new Date();
        const currentYear = now.getFullYear();

        if (type === 'thisYear') {
            onDateRangeChange({ start: `${currentYear}-01-01`, end: `${currentYear}-12-31` });
        } else if (type === 'lastYear') {
            onDateRangeChange({ start: `${currentYear - 1}-01-01`, end: `${currentYear - 1}-12-31` });
        } else {
            onDateRangeChange({ start: '', end: '' });
        }
    };

    return (
        <div className="mt-4 p-3 bg-gray-100/60 dark:bg-slate-800/60 rounded-lg flex flex-col xl:flex-row items-center justify-between gap-4">
            
            {/* Date Filter Controls */}
            {onDateRangeChange && dateRange && (
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-center xl:justify-start">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-700 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 px-1">Filter:</span>
                        <input 
                            type="date" 
                            value={dateRange.start} 
                            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                            className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-800 dark:text-white"
                            aria-label="Start Date"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                            type="date" 
                            value={dateRange.end} 
                            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                            className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-800 dark:text-white"
                            aria-label="End Date"
                        />
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setPreset('thisYear')} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors dark:text-white">This Year</button>
                        <button onClick={() => setPreset('lastYear')} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors dark:text-white">Last Year</button>
                        <button onClick={() => setPreset('all')} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors dark:text-white">All Time</button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 justify-center xl:justify-end">
                 {onToggleAmounts && (
                    <button
                        onClick={onToggleAmounts}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
                        title={showAmounts ? "Hide Amounts" : "Show Amounts"}
                    >
                        {showAmounts ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                        <span className="hidden sm:inline">{showAmounts ? 'Hide' : 'Show'}</span>
                    </button>
                )}

                 <button
                    onClick={onSync}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
                    title="Sync Data"
                >
                    <SaveIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Sync</span>
                </button>

                 <button
                    onClick={handleDownloadPdf}
                    disabled={!isPdfExportable}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-red-600/80 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isPdfExportable ? "Export to PDF" : "PDF Export Unavailable for this view"}
                >
                    <PdfIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                </button>

                <button
                    onClick={handleDownloadCSV}
                    disabled={transactions.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download CSV"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                    onClick={handleDownloadSession}
                    disabled={transactions.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Backup Session (JSON)"
                >
                    <FileJsonIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Backup</span>
                </button>
            </div>
        </div>
    );
};

export default ActionToolbar;
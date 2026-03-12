import React from 'react';
import { Transaction, PnlData, BalanceSheetData, TrialBalance, CashFlowData, FinancialAnalysis } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
    exportJournalAsPDF, 
    exportTrialBalanceAsPDF, 
    exportIncomeStatementAsPDF, 
    exportBalanceSheetAsPDF, 
    exportCashFlowAsPDF,
    exportAnalysisAsPDF,
    exportManagementReportAsPDF
} from '../utils/pdf.ts';
import { PdfIcon } from './icons/PdfIcon.tsx';
import { ChartIcon } from './icons/ChartIcon.tsx';
import { BookIcon } from './icons/BookIcon.tsx';
import { TrendingUpIcon } from './icons/TrendingUpIcon.tsx';
import { AnalysisIcon } from './icons/AnalysisIcon.tsx';
import { DocumentTextIcon } from './icons/DocumentTextIcon.tsx';
import Spinner from './Spinner.tsx';

interface ReportsViewProps {
    transactions: Transaction[];
    pnlData: PnlData;
    balanceSheetData: BalanceSheetData;
    trialBalanceData: TrialBalance;
    cashFlowData: CashFlowData;
    analysisData: FinancialAnalysis | null;
    onGenerateAnalysis?: () => void;
    isAnalysisLoading?: boolean;
}

const ReportCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onAction: () => void;
    colorClass: string;
    disabled?: boolean;
    actionLabel: string;
    isLoading?: boolean;
}> = ({ title, description, icon, onAction, colorClass, disabled, actionLabel, isLoading }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300 ${disabled && !isLoading ? 'opacity-70' : 'hover:-translate-y-1'}`}>
        <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center mb-4`}>
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow leading-relaxed">{description}</p>
        <button 
            onClick={onAction}
            disabled={disabled || isLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                ${disabled || isLoading
                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500'}`}
        >
            {isLoading ? <Spinner className="w-4 h-4" /> : <PdfIcon className={`w-4 h-4 ${disabled ? '' : 'text-red-500'}`} />}
            {isLoading ? 'Generating...' : actionLabel}
        </button>
    </div>
);

const ReportsView: React.FC<ReportsViewProps> = ({ 
    transactions, 
    pnlData, 
    balanceSheetData, 
    trialBalanceData, 
    cashFlowData, 
    analysisData,
    onGenerateAnalysis,
    isAnalysisLoading
}) => {
    const { user } = useAuth();
    const hasData = transactions.length > 0;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-4 mb-2">
                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
                        <DocumentTextIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Financial Reports Center</h1>
                        <p className="text-slate-300 mt-1">Generate professional financial documents for your business, banks, and stakeholders.</p>
                    </div>
                </div>
            </div>

            {!hasData && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 rounded-lg text-center">
                    <p>No transaction data available. Upload a bank statement to generate reports.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Management Report Pack */}
                <div className="md:col-span-2 xl:col-span-3">
                    <div className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/20 dark:to-slate-900 rounded-xl border border-teal-100 dark:border-teal-800/50 shadow-sm p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all">
                        <div className="w-16 h-16 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-grow text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Full Management Report Pack</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                A comprehensive PDF document combining your Income Statement, Balance Sheet, Cash Flow Statement, and Executive Summary (if available) into a single professional package. Ideal for monthly reporting to stakeholders.
                            </p>
                        </div>
                        <button 
                            onClick={() => exportManagementReportAsPDF(pnlData, balanceSheetData, cashFlowData, analysisData, user)}
                            disabled={!hasData}
                            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 text-base font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PdfIcon className="w-5 h-5" />
                            Download Pack
                        </button>
                    </div>
                </div>

                <ReportCard 
                    title="Income Statement"
                    description="Also known as Profit & Loss. Shows revenue, expenses, and net profit for the period."
                    icon={<ChartIcon className="w-6 h-6" />}
                    colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    onAction={() => exportIncomeStatementAsPDF(pnlData, user)}
                    disabled={!hasData}
                    actionLabel="Download PDF"
                />

                <ReportCard 
                    title="Balance Sheet"
                    description="Statement of Financial Position showing assets, liabilities, and equity at a specific point in time."
                    icon={<ChartIcon className="w-6 h-6" />}
                    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    onAction={() => exportBalanceSheetAsPDF(balanceSheetData, user)}
                    disabled={!hasData}
                    actionLabel="Download PDF"
                />

                <ReportCard 
                    title="Cash Flow Statement"
                    description="Breakdown of cash inflows and outflows from operating, investing, and financing activities."
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    onAction={() => exportCashFlowAsPDF(cashFlowData, user)}
                    disabled={!hasData}
                    actionLabel="Download PDF"
                />

                <ReportCard 
                    title="Trial Balance"
                    description="List of all general ledger accounts and their balances (Debit/Credit) to ensure books are balanced."
                    icon={<BookIcon className="w-6 h-6" />}
                    colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    onAction={() => exportTrialBalanceAsPDF(trialBalanceData, user)}
                    disabled={!hasData}
                    actionLabel="Download PDF"
                />

                <ReportCard 
                    title="General Journal"
                    description="Detailed chronological record of all financial transactions with double-entry bookkeeping."
                    icon={<BookIcon className="w-6 h-6" />}
                    colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    onAction={() => exportJournalAsPDF(transactions, user)}
                    disabled={!hasData}
                    actionLabel="Download PDF"
                />

                <ReportCard 
                    title="AI Analysis Report"
                    description="AI-generated insights, spending trends, forecasting, and actionable tips for your business."
                    icon={<AnalysisIcon className="w-6 h-6" />}
                    colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    onAction={() => {
                        if (analysisData) {
                            exportAnalysisAsPDF(analysisData, user);
                        } else if (onGenerateAnalysis) {
                            onGenerateAnalysis();
                        }
                    }}
                    disabled={!hasData}
                    isLoading={isAnalysisLoading}
                    actionLabel={analysisData ? "Download PDF" : "Generate Report"}
                />
            </div>
        </div>
    );
};

export default ReportsView;
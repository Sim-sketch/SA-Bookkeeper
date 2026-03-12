import React from 'react';
import { PnlData, BalanceSheetData } from '../types.ts';
import { exportIncomeStatementAsPDF, exportBalanceSheetAsPDF } from '../utils/pdf.ts';
import { PdfIcon } from './icons/PdfIcon.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

interface FinancialStatementsViewProps {
    pnlData: PnlData;
    balanceSheetData: BalanceSheetData;
    showAmounts?: boolean;
}

const Section: React.FC<{title: string, data: {[key: string]: number}, total: number, titleClass: string, showAmounts: boolean}> = ({title, data, total, titleClass, showAmounts}) => (
     <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-2 ${titleClass}`}>{title}</h3>
        {Object.entries(data).map(([account, amount]) => (
            <div key={account} className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
                <span>{account}</span>
                <span className="font-mono">
                    {showAmounts ? `R ${(amount as number).toFixed(2)}` : '****'}
                </span>
            </div>
        ))}
        <div className="flex justify-between py-2 font-bold mt-2">
            <span>Total {title}</span>
            <span className="font-mono">
                {showAmounts ? `R ${total.toFixed(2)}` : '****'}
            </span>
        </div>
    </div>
);

const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({ pnlData, balanceSheetData, showAmounts = true }) => {
    const { assets, liabilities, equity, totals } = balanceSheetData;
    const { user } = useAuth();
    const isBalanced = totals.assets.toFixed(2) === totals.liabilitiesAndEquity.toFixed(2);

    const formatAmount = (amount: number) => {
        return showAmounts ? `R ${amount.toFixed(2)}` : '****';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <button 
                    onClick={() => exportIncomeStatementAsPDF(pnlData, user)}
                    className="absolute top-6 right-6 p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                    title="Download Income Statement PDF"
                >
                    <PdfIcon className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-2">Statement of Comprehensive Income (Profit & Loss)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">For the period ending [Date]</p>
                
                <Section title="Revenue" data={pnlData.revenues} total={pnlData.totalRevenue} titleClass="text-green-600 dark:text-green-400" showAmounts={showAmounts} />
                <Section title="Cost of Sales" data={pnlData.costOfSales} total={pnlData.totalCostOfSales} titleClass="text-orange-600 dark:text-orange-400" showAmounts={showAmounts} />
                
                <div className="flex justify-between py-3 font-bold text-lg rounded-md px-3 mb-6 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                    <span>Gross Profit</span>
                    <span className="font-mono">{formatAmount(pnlData.grossProfit)}</span>
                </div>

                <Section title="Operating Expenses" data={pnlData.operatingExpenses} total={pnlData.totalOperatingExpenses} titleClass="text-red-600 dark:text-red-400" showAmounts={showAmounts} />
                
                <div className={`flex justify-between py-3 font-bold text-lg rounded-md px-3 mt-4 ${pnlData.netProfit >= 0 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                    <span>Net Profit / (Loss) for the period</span>
                    <span className="font-mono">{formatAmount(pnlData.netProfit)}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                 <button 
                    onClick={() => exportBalanceSheetAsPDF(balanceSheetData, user)}
                    className="absolute top-6 right-6 p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                    title="Download Balance Sheet PDF"
                >
                    <PdfIcon className="w-5 h-5" />
                </button>

                 <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-2">Statement of Financial Position (Balance Sheet)</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">As at [Date]</p>
                 
                 <Section title="Assets" data={assets} total={totals.assets} titleClass="text-blue-600 dark:text-blue-400" showAmounts={showAmounts} />
                 {/* FIX: Explicitly cast Object.values result to number[] to ensure type safety in reduce. */}
                 <Section title="Liabilities" data={liabilities} total={(Object.values(liabilities) as number[]).reduce((a, b) => a + b, 0)} titleClass="text-orange-600 dark:text-orange-400" showAmounts={showAmounts} />
                 {/* FIX: Explicitly cast Object.values result to number[] to ensure type safety in reduce. */}
                 <Section title="Equity" data={equity} total={(Object.values(equity) as number[]).reduce((a, b) => a + b, 0)} titleClass="text-purple-600 dark:text-purple-400" showAmounts={showAmounts} />

                 <div className={`flex justify-between py-3 font-bold text-lg rounded-md px-3 mt-4 ${isBalanced ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                    <span>Total Liabilities & Equity</span>
                    <span className="font-mono">{formatAmount(totals.liabilitiesAndEquity)}</span>
                </div>

                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">*Disclaimer: This is a simplified financial statement generated by AI. Please consult a professional accountant for official SARS submissions.</p>
            </div>
        </div>
    );
};

export default FinancialStatementsView;
import React from 'react';
import { PnlData, BalanceSheetData, TrialBalance, CashFlowData } from '../types.ts';
import { motion } from 'motion/react';

interface FinancialSummaryPanelProps {
    pnlData: PnlData;
    balanceSheetData: BalanceSheetData;
    trialBalanceData: TrialBalance;
    cashFlowData: CashFlowData;
    showAmounts?: boolean;
}

const FinancialSummaryPanel: React.FC<FinancialSummaryPanelProps> = ({
    pnlData,
    balanceSheetData,
    trialBalanceData,
    cashFlowData,
    showAmounts = true
}) => {
    const isBalanced = trialBalanceData.totals.debit.toFixed(2) === trialBalanceData.totals.credit.toFixed(2);
    
    const formatAmount = (amount: number) => {
        if (!showAmounts) return '****';
        return `R ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const stats = [
        {
            label: 'Net Profit',
            value: pnlData.netProfit,
            color: pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
            bg: pnlData.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50',
            darkBg: pnlData.netProfit >= 0 ? 'dark:bg-emerald-900/20' : 'dark:bg-red-900/20',
            description: 'Income Statement'
        },
        {
            label: 'Total Assets',
            value: balanceSheetData.totals.assets,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            darkBg: 'dark:bg-blue-900/20',
            description: 'Balance Sheet'
        },
        {
            label: 'Net Cash Flow',
            value: cashFlowData.netCashFlow,
            color: cashFlowData.netCashFlow >= 0 ? 'text-teal-600' : 'text-orange-600',
            bg: cashFlowData.netCashFlow >= 0 ? 'bg-teal-50' : 'bg-orange-50',
            darkBg: cashFlowData.netCashFlow >= 0 ? 'dark:bg-teal-900/20' : 'dark:bg-orange-900/20',
            description: 'Cash Flow'
        },
        {
            label: 'TB Status',
            value: isBalanced ? 'Balanced' : 'Out of Balance',
            color: isBalanced ? 'text-emerald-600' : 'text-red-600',
            bg: isBalanced ? 'bg-emerald-50' : 'bg-red-50',
            darkBg: isBalanced ? 'dark:bg-emerald-900/20' : 'dark:bg-red-900/20',
            description: `Diff: R ${Math.abs(trialBalanceData.totals.debit - trialBalanceData.totals.credit).toFixed(2)}`,
            isStatus: true
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${stat.bg} ${stat.darkBg} flex flex-col justify-between`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20 text-slate-400">{stat.description}</span>
                    </div>
                    <div className={`mt-2 text-xl font-bold font-mono ${stat.color}`}>
                        {stat.isStatus ? stat.value : formatAmount(stat.value as number)}
                    </div>
                    {!stat.isStatus && (
                        <div className="mt-1 text-[10px] text-slate-400">
                            Updated from Journal
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default FinancialSummaryPanel;

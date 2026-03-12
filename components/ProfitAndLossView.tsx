import React from 'react';
import { PnlData } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { EyeOffIcon } from './icons/EyeOffIcon.tsx';

interface ProfitAndLossViewProps {
    data: PnlData;
    showAmounts?: boolean;
}

const ProfitAndLossView: React.FC<ProfitAndLossViewProps> = ({ data, showAmounts = true }) => {
    const { revenues, costOfSales, operatingExpenses, totalRevenue, totalCostOfSales, grossProfit, totalOperatingExpenses, netProfit } = data;
    const { theme } = useTheme();
    
    const chartData = [
        { name: 'Summary', Revenue: totalRevenue, COGS: totalCostOfSales, 'Gross Profit': grossProfit, 'Op. Expenses': totalOperatingExpenses, 'Net Profit': netProfit },
    ];
    
    const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
    };
    const legendStyle = {
        color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
    };

    const formatAmount = (amount: number) => {
        return showAmounts ? `R ${amount.toFixed(2)}` : '****';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Profit & Loss Statement</h2>
                
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Revenue</h3>
                    {Object.entries(revenues).map(([account, amount]) => (
                        <div key={account} className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
                            <span>{account}</span>
                            <span className="font-mono">{formatAmount(amount as number)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold mt-2">
                        <span>Total Revenue</span>
                        <span className="font-mono">{formatAmount(totalRevenue)}</span>
                    </div>
                </div>

                {/* Cost of Sales Section */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-2">Cost of Sales</h3>
                     {Object.keys(costOfSales).length === 0 && <p className="text-sm text-slate-400 italic">No Cost of Sales recorded.</p>}
                    {Object.entries(costOfSales).map(([account, amount]) => (
                        <div key={account} className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
                            <span>{account}</span>
                            <span className="font-mono">{formatAmount(amount as number)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold mt-2">
                        <span>Total Cost of Sales</span>
                        <span className="font-mono">{formatAmount(totalCostOfSales)}</span>
                    </div>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between py-3 font-bold text-lg rounded-md px-3 mb-6 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                    <span>Gross Profit</span>
                    <span className="font-mono">{formatAmount(grossProfit)}</span>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Operating Expenses</h3>
                    {Object.entries(operatingExpenses).map(([account, amount]) => (
                        <div key={account} className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
                            <span>{account}</span>
                            <span className="font-mono">{formatAmount(amount as number)}</span>
                        </div>
                    ))}
                     <div className="flex justify-between py-2 font-bold mt-2">
                        <span>Total Operating Expenses</span>
                        <span className="font-mono">{formatAmount(totalOperatingExpenses)}</span>
                    </div>
                </div>

                <div className={`flex justify-between py-3 font-bold text-lg rounded-md px-3 mt-4 ${netProfit >= 0 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                    <span>Net Profit / (Loss)</span>
                    <span className="font-mono">{formatAmount(netProfit)}</span>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 min-h-[400px] relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Visual Summary</h2>
                 <div className={`transition-all duration-300 ${!showAmounts ? 'filter blur-lg opacity-50 select-none pointer-events-none' : ''}`}>
                    <ResponsiveContainer width="100%" height="350">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={axisColor} />
                            <YAxis stroke={axisColor} tickFormatter={(value) => `R ${value}`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(30, 41, 59, 0.5)'}}
                                contentStyle={tooltipStyle}
                            />
                            <Legend wrapperStyle={legendStyle}/>
                            <Bar dataKey="Revenue" fill="#2dd4bf" />
                            <Bar dataKey="COGS" fill="#f97316" name="Cost of Sales" />
                            <Bar dataKey="Op. Expenses" fill="#f87171" name="Operating Exp." />
                            <Bar dataKey="Net Profit" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                 {!showAmounts && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2 rounded-full text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                            <EyeOffIcon className="w-4 h-4" />
                            <span>Hidden</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitAndLossView;
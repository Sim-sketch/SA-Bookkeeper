import React from 'react';
import { PnlData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface ProfitAndLossViewProps {
    data: PnlData;
}

const ProfitAndLossView: React.FC<ProfitAndLossViewProps> = ({ data }) => {
    const { revenues, expenses, totalRevenue, totalExpenses, netProfit } = data;
    const { theme } = useTheme();
    
    const chartData = [
        { name: 'Income vs Expenses', Revenue: totalRevenue, Expenses: totalExpenses },
    ];
    
    const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = theme === 'dark' ? '#475569' : '#e2e8f0';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
    };
    const legendStyle = {
        color: theme === 'dark' ? '#cbd5e1' : '#1e293b'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-4 md:p-6">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Profit & Loss Statement</h2>
                
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Revenue</h3>
                    {Object.entries(revenues).map(([account, amount]) => (
                        <div key={account} className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-700/50">
                            <span>{account}</span>
                            {/* FIX: Cast amount to number because Object.entries can produce 'unknown' values from indexed types. */}
                            <span className="font-mono">R {(amount as number).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold mt-2">
                        <span>Total Revenue</span>
                        <span className="font-mono">R {totalRevenue.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Expenses</h3>
                    {Object.entries(expenses).map(([account, amount]) => (
                        <div key={account} className="flex justify-between py-1 border-b border-gray-200 dark:border-slate-700/50">
                            <span>{account}</span>
                            {/* FIX: Cast amount to number because Object.entries can produce 'unknown' values from indexed types. */}
                            <span className="font-mono">R {(amount as number).toFixed(2)}</span>
                        </div>
                    ))}
                     <div className="flex justify-between py-2 font-bold mt-2">
                        <span>Total Expenses</span>
                        <span className="font-mono">R {totalExpenses.toFixed(2)}</span>
                    </div>
                </div>

                <div className={`flex justify-between py-3 font-bold text-lg rounded-md px-3 mt-4 ${netProfit >= 0 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                    <span>Net Profit / (Loss)</span>
                    <span className="font-mono">R {netProfit.toFixed(2)}</span>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-lg p-4 md:p-6 min-h-[400px]">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">Visual Summary</h2>
                 <ResponsiveContainer width="100%" height={350}>
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
                        <Bar dataKey="Expenses" fill="#f87171" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProfitAndLossView;
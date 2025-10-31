import React, { useMemo } from 'react';
import { Transaction, PnlData, BalanceSheetData } from '../types';
import FileUpload from './FileUpload';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { IncomeIcon } from './icons/IncomeIcon';
import { ExpenseIcon } from './icons/ExpenseIcon';
import { AnalysisIcon } from './icons/AnalysisIcon';
import { CashIcon } from './icons/CashIcon';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardViewProps {
    onFileAnalysis: (file: File) => void;
    transactions: Transaction[];
    pnlData: PnlData;
    balanceSheetData: BalanceSheetData;
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6 min-h-[400px]">
        <h3 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-4">{title}</h3>
        {children}
    </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ onFileAnalysis, transactions, pnlData, balanceSheetData }) => {
    const { theme } = useTheme();

    if (transactions.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center max-w-2xl mx-auto">
                <AnalysisIcon className="w-16 h-16 mx-auto text-teal-400 mb-4" />
                <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-300 mb-4">Welcome to SA Bookkeeper AI</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    You have no transactions yet.
                    <br />
                    Upload your first bank statement to get started.
                </p>
                <FileUpload onFileSelect={onFileAnalysis} disabled={false} />
            </div>
        );
    }
    
    const cashBalance = useMemo(() => Object.entries(balanceSheetData.assets)
        .filter(([account]) => account.toLowerCase().includes('bank'))
        .reduce((sum, [, balance]) => sum + (balance as number), 0), [balanceSheetData.assets]);

    const expensePieData = useMemo(() => {
        const expenseData = Object.entries(pnlData.expenses)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const MAX_SLICES = 6;
        const chartData = expenseData.slice(0, MAX_SLICES);
        if (expenseData.length > MAX_SLICES) {
            const otherValue = expenseData.slice(MAX_SLICES).reduce((acc, curr) => acc + curr.value, 0);
            chartData.push({ name: 'Other Expenses', value: otherValue });
        }
        return chartData;
    }, [pnlData.expenses]);

    const trendChartData = useMemo(() => {
        const monthlyData = transactions.reduce((acc, tx) => {
            const month = tx.date.substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { name: month, Revenue: 0, Expenses: 0 };
            }
            if (tx.category.toLowerCase() === 'revenue') {
                acc[month].Revenue += tx.amount;
            } else if (tx.category.toLowerCase() === 'operating expense') {
                acc[month].Expenses += tx.amount;
            }
            return acc;
        }, {} as { [key: string]: { name: string; Revenue: number; Expenses: number } });

        return Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name));
    }, [transactions]);

    const PIE_COLORS = ['#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80', '#38bdf8', '#818cf8'];

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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Revenue" value={`R ${pnlData.totalRevenue.toFixed(2)}`} icon={<IncomeIcon className="w-6 h-6" />} colorClass="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400" />
                <KpiCard title="Total Expenses" value={`R ${pnlData.totalExpenses.toFixed(2)}`} icon={<ExpenseIcon className="w-6 h-6" />} colorClass="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400" />
                <KpiCard title="Net Profit / (Loss)" value={`R ${pnlData.netProfit.toFixed(2)}`} icon={<AnalysisIcon className="w-6 h-6" />} colorClass="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" />
                <KpiCard title="Cash Balance" value={`R ${cashBalance.toFixed(2)}`} icon={<CashIcon className="w-6 h-6" />} colorClass="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                     <ChartContainer title="Expense Breakdown">
                        <ResponsiveContainer width="100%" height={350}>
                             <PieChart>
                                <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
                 <div className="lg:col-span-3">
                     <ChartContainer title="Income vs Expense Trend">
                         <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={trendChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="name" stroke={axisColor} />
                                <YAxis stroke={axisColor} tickFormatter={(value) => `R${value/1000}k`} />
                                <Tooltip cursor={{ fill: 'rgba(30, 41, 59, 0.5)'}} contentStyle={tooltipStyle}/>
                                <Legend wrapperStyle={legendStyle}/>
                                <Bar dataKey="Revenue" fill="#2dd4bf" />
                                <Bar dataKey="Expenses" fill="#f87171" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
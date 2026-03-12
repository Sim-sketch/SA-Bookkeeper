
import React, { useMemo } from 'react';
import { Transaction, PnlData } from '../types.ts';
import FileUpload from './FileUpload.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
    onFileAnalysis: (files: File[]) => void;
    transactions: Transaction[];
    pnlData: PnlData;
    showAmounts: boolean;
    onLaunchScanner: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onFileAnalysis, transactions, pnlData, showAmounts, onLaunchScanner }) => {
    const vatLiability = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (tx.taxCategory === 'VAT Standard Rate (15%)') {
                const vat = tx.amount - (tx.amount / 1.15);
                return tx.type === 'Credit' ? acc + vat : acc - vat;
            }
            return acc;
        }, 0);
    }, [transactions]);

    // South African specific logic: VAT registration threshold is R1 million
    const totalSales = pnlData.totalRevenue;
    const vatProgress = Math.min((totalSales / 1000000) * 100, 100);

    const stats = [
        { label: 'Net Profit', value: pnlData.netProfit, color: 'text-teal-600', icon: '📈' },
        { label: 'Total Revenue', value: pnlData.totalRevenue, color: 'text-green-600', icon: '💰' },
        { label: 'VAT Liability', value: vatLiability, color: vatLiability > 0 ? 'text-orange-600' : 'text-blue-600', icon: '🇿🇦' },
    ];

    const formatCurrency = (val: number) => `R ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header / Intro */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="text-9xl">🇿🇦</span>
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold mb-2">Sawubona! 👋</h1>
                    <p className="text-slate-400 max-w-md">Welcome back to your SA Bookkeeper AI dashboard. All your financial data is stored locally and securely.</p>
                    
                    <div className="mt-8 flex flex-wrap gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 min-w-[200px] hover:bg-white/10 transition-colors">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-2xl font-mono font-bold ${showAmounts ? stat.color : 'blur-md'}`}>
                                    {showAmounts ? formatCurrency(stat.value) : 'R 88,888.88'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Card */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📄</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Import Records</h3>
                                <p className="text-xs text-slate-500">PDF Bank Statements</p>
                            </div>
                        </div>
                        <FileUpload onFileSelect={onFileAnalysis} disabled={false} />
                        <p className="mt-4 text-[10px] text-slate-400 text-center uppercase font-bold tracking-tighter">AI processes local currency (ZAR) only</p>
                    </div>

                    {/* Receipt Scanner AI Feature */}
                    <div 
                        onClick={onLaunchScanner}
                        className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg shadow-teal-500/20 group cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">📸</div>
                            <h3 className="font-bold">AI Receipt Scanner</h3>
                        </div>
                        <p className="text-xs text-teal-100 mb-4 leading-relaxed">Instantly extract data from photos of receipts using your camera. Compliant with SARS record-keeping.</p>
                        <button className="w-full bg-white text-teal-700 py-2 rounded-lg text-sm font-bold opacity-90 group-hover:opacity-100 transition-opacity">Launch Scanner</button>
                    </div>
                </div>

                {/* Cash Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Revenue vs Operating Expenses</h3>
                        <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-600"></span> Revenue</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400"></span> Expenses</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {transactions.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{name: 'Current Period', Revenue: pnlData.totalRevenue, Expenses: pnlData.totalOperatingExpenses}]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R${v >= 1000 ? v/1000 + 'k' : v}`} />
                                    <Tooltip cursor={{fill: 'transparent'}} formatter={(v: number) => formatCurrency(v)} />
                                    <Bar dataKey="Revenue" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={60} />
                                    <Bar dataKey="Expenses" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <span className="text-4xl mb-4 grayscale opacity-50">📊</span>
                                <p className="text-slate-400 italic text-sm">Upload a bank statement to visualize your trends.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* VAT Threshold Monitor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">SARS VAT Registration Monitor</h3>
                        <p className="text-sm text-slate-500">Compulsory registration at R1,000,000 turnover over 12 months.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Turnover</span>
                        <p className="text-xl font-mono font-bold text-teal-600">{formatCurrency(totalSales)}</p>
                    </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${vatProgress > 80 ? 'bg-orange-500' : 'bg-teal-500'}`}
                        style={{ width: `${vatProgress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>R0</span>
                    <span>VAT REGISTRATION THRESHOLD: R1,000,000</span>
                </div>
            </div>

            {/* Quick Actions / Local Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { name: 'SARS eFiling', url: 'https://www.sars.gov.za/' },
                    { name: 'CIPC Annual Returns', url: 'https://www.cipc.co.za/' },
                    { name: 'VAT Guide for SMBs', url: 'https://www.sars.gov.za/tax-types/value-added-tax-vat/' },
                    { name: 'FNB Business Hub', url: 'https://www.fnb.co.za/' },
                ].map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-center transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
                            {link.name} <span className="text-xs text-slate-400">↗</span>
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default DashboardView;

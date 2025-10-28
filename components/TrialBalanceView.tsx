import React from 'react';
import { TrialBalance } from '../types';

interface TrialBalanceViewProps {
    data: TrialBalance;
}

const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({ data }) => {
    const { balances, totals } = data;
    const totalsMatch = totals.debit.toFixed(2) === totals.credit.toFixed(2);

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300">Trial Balance</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-slate-300">
                    <thead className="text-xs text-teal-700 dark:text-teal-400 uppercase bg-gray-100 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">Account</th>
                            <th scope="col" className="px-6 py-3 text-right whitespace-nowrap">Debit (R)</th>
                            <th scope="col" className="px-6 py-3 text-right whitespace-nowrap">Credit (R)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {balances.map((balance, index) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/30">
                                <td className="px-6 py-4 font-medium whitespace-nowrap">{balance.account}</td>
                                <td className="px-6 py-4 text-right font-mono">
                                    {balance.debit > 0 ? balance.debit.toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-mono">
                                    {balance.credit > 0 ? balance.credit.toFixed(2) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className={`font-bold bg-gray-100 dark:bg-slate-700 ${totalsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <td className="px-6 py-4 text-lg whitespace-nowrap">Total</td>
                            <td className="px-6 py-4 text-right text-lg font-mono">{totals.debit.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-lg font-mono">{totals.credit.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             {balances.length === 0 && <p className="p-6 text-center text-gray-500 dark:text-slate-400">No data to display.</p>}
        </div>
    );
};

export default TrialBalanceView;
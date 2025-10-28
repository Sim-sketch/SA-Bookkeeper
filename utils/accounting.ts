
import { Transaction, TrialBalance, PnlData, BalanceSheetData, AccountBalance, CashFlowData } from './types';

const isAssetOrExpense = (account: string): boolean => {
    const lowerAccount = account.toLowerCase();
    return lowerAccount.includes('expense') || lowerAccount.includes('bank') || lowerAccount.includes('drawings') || lowerAccount.includes('assets');
};

const isLiabilityEquityOrRevenue = (account: string): boolean => {
    const lowerAccount = account.toLowerCase();
    return lowerAccount.includes('revenue') || lowerAccount.includes('income') || lowerAccount.includes('capital') || lowerAccount.includes('liabilities');
};

export const generateTrialBalance = (transactions: Transaction[]): TrialBalance => {
    const accountTotals: { [key: string]: { debit: number; credit: number } } = {};

    transactions.forEach(tx => {
        if (!accountTotals[tx.debitAccount]) {
            accountTotals[tx.debitAccount] = { debit: 0, credit: 0 };
        }
        accountTotals[tx.debitAccount].debit += tx.amount;

        if (!accountTotals[tx.creditAccount]) {
            accountTotals[tx.creditAccount] = { debit: 0, credit: 0 };
        }
        accountTotals[tx.creditAccount].credit += tx.amount;
    });

    const balances: AccountBalance[] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    
    Object.keys(accountTotals).sort().forEach(account => {
        const { debit, credit } = accountTotals[account];
        const balance = debit - credit;
        
        let finalDebit = 0;
        let finalCredit = 0;

        if (balance > 0) {
            finalDebit = balance;
        } else {
            finalCredit = -balance;
        }

        // Final check based on account type for presentation
        if (isAssetOrExpense(account)) {
            if (balance < 0) { // Should have debit balance
                finalCredit = -balance;
                finalDebit = 0;
            } else {
                finalDebit = balance;
                finalCredit = 0;
            }
        } else if (isLiabilityEquityOrRevenue(account)) {
             if (balance > 0) { // Should have credit balance
                finalDebit = balance;
                finalCredit = 0;
            } else {
                finalCredit = -balance;
                finalDebit = 0;
            }
        }

        balances.push({
            account,
            debit: finalDebit,
            credit: finalCredit,
        });

        totalDebit += finalDebit;
        totalCredit += finalCredit;
    });

    return {
        balances,
        totals: {
            debit: totalDebit,
            credit: totalCredit,
        },
    };
};

export const generateProfitAndLoss = (transactions: Transaction[]): PnlData => {
    const revenues: { [key: string]: number } = {};
    const expenses: { [key: string]: number } = {};
    
    transactions.forEach(tx => {
        if (tx.category.toLowerCase() === 'revenue') {
            const revenueAccount = tx.creditAccount;
            if (!revenues[revenueAccount]) revenues[revenueAccount] = 0;
            revenues[revenueAccount] += tx.amount;
        } else if (tx.category.toLowerCase() === 'operating expense') {
            const expenseAccount = tx.debitAccount;
            if (!expenses[expenseAccount]) expenses[expenseAccount] = 0;
            expenses[expenseAccount] += tx.amount;
        }
    });

    const totalRevenue = Object.values(revenues).reduce((sum, amount) => sum + amount, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    return { revenues, expenses, totalRevenue, totalExpenses, netProfit };
};


export const generateBalanceSheet = (transactions: Transaction[], netProfit: number): BalanceSheetData => {
    const assets: { [key: string]: number } = {};
    const liabilities: { [key: string]: number } = {};
    const equity: { [key: string]: number } = { 'Retained Earnings (Profit/Loss)': netProfit };

    const trialBalance = generateTrialBalance(transactions);
    
    trialBalance.balances.forEach(({ account, debit, credit }) => {
        const balance = debit - credit;
        const lowerAccount = account.toLowerCase();

        if (lowerAccount.includes('bank') || lowerAccount.includes('asset')) {
            assets[account] = (assets[account] || 0) + balance;
        } else if (lowerAccount.includes('liability') || lowerAccount.includes('loan')) {
            liabilities[account] = (liabilities[account] || 0) - balance; // Liabilities have credit balances
        } else if (lowerAccount.includes('capital')) {
            equity[account] = (equity[account] || 0) - balance; // Equity has credit balances
        } else if (lowerAccount.includes('drawings')) {
            equity[account] = (equity[account] || 0) + balance; // Drawings reduce equity
        }
    });

    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
    const totalEquity = Object.values(equity).reduce((sum, val) => sum + val, 0);

    return {
        assets,
        liabilities,
        equity,
        totals: {
            assets: totalAssets,
            liabilitiesAndEquity: totalLiabilities + totalEquity,
        },
    };
};

export const generateCashFlowStatement = (transactions: Transaction[], trialBalance: TrialBalance): CashFlowData => {
    const operatingActivities: { [key: string]: number } = {};
    const investingActivities: { [key: string]: number } = {};
    const financingActivities: { [key: string]: number } = {};

    transactions.forEach(tx => {
        const isCashInflow = tx.debitAccount.toLowerCase() === 'bank';
        const cashAmount = isCashInflow ? tx.amount : -tx.amount;
        const account = isCashInflow ? tx.creditAccount : tx.debitAccount;
        const category = tx.category.toLowerCase();

        if (category === 'revenue' || category === 'operating expense') {
            operatingActivities[account] = (operatingActivities[account] || 0) + cashAmount;
        } else if (category === 'investing') {
            investingActivities[account] = (investingActivities[account] || 0) + cashAmount;
        } else if (category === 'financing' || account.toLowerCase().includes('capital') || account.toLowerCase().includes('drawings')) {
            financingActivities[account] = (financingActivities[account] || 0) + cashAmount;
        }
    });

    const totalOperating = Object.values(operatingActivities).reduce((sum, val) => sum + val, 0);
    const totalInvesting = Object.values(investingActivities).reduce((sum, val) => sum + val, 0);
    const totalFinancing = Object.values(financingActivities).reduce((sum, val) => sum + val, 0);
    const netCashFlow = totalOperating + totalInvesting + totalFinancing;

    const bankBalance = trialBalance.balances.find(b => b.account.toLowerCase() === 'bank');
    const endingBankBalance = bankBalance ? bankBalance.debit - bankBalance.credit : 0;
    const startingBankBalance = endingBankBalance - netCashFlow;

    return {
        operatingActivities,
        investingActivities,
        financingActivities,
        totalOperating,
        totalInvesting,
        totalFinancing,
        netCashFlow,
        startingBankBalance,
        endingBankBalance
    };
};

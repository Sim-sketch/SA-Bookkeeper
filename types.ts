
export enum View {
    DASHBOARD = 'DASHBOARD',
    JOURNAL = 'JOURNAL',
    TRIAL_BALANCE = 'TRIAL_BALANCE',
    PROFIT_LOSS = 'PROFIT_LOSS',
    STATEMENTS = 'STATEMENTS',
    CASH_FLOW = 'CASH_FLOW',
    ANALYSIS = 'ANALYSIS',
    RULES = 'RULES',
    AI_CHAT = 'AI_CHAT',
    SETTINGS = 'SETTINGS',
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'Debit' | 'Credit'; // From bank's perspective
    debitAccount: string;
    creditAccount: string;
    category: string;
}

export interface CategorizationRule {
    id: string;
    keyword: string;
    account: string;
    category: 'Revenue' | 'Operating Expense' | 'Financing' | 'Investing' | 'Personal';
}

export interface AccountBalance {
    account: string;
    debit: number;
    credit: number;
}

export interface TrialBalance {
    balances: AccountBalance[];
    totals: {
        debit: number;
        credit: number;
    };
}

export interface PnlData {
    revenues: { [key: string]: number };
    expenses: { [key: string]: number };
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
}

export interface BalanceSheetData {
    assets: { [key: string]: number };
    liabilities: { [key: string]: number };
    equity: { [key: string]: number };
    totals: {
        assets: number;
        liabilitiesAndEquity: number;
    };
}

export interface CashFlowActivity {
    account: string;
    amount: number;
}

export interface CashFlowData {
    operatingActivities: { [key: string]: number };
    investingActivities: { [key: string]: number };
    financingActivities: { [key: string]: number };
    totalOperating: number;
    totalInvesting: number;
    totalFinancing: number;
    netCashFlow: number;
    startingBankBalance: number;
    endingBankBalance: number;
}
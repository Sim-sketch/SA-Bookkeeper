
export enum View {
    DASHBOARD = 'DASHBOARD',
    JOURNAL = 'JOURNAL',
    TRIAL_BALANCE = 'TRIAL_BALANCE',
    PROFIT_LOSS = 'PROFIT_LOSS',
    VAT_201 = 'VAT_201',
    AI_CHAT = 'AI_CHAT',
    SETTINGS = 'SETTINGS',
    HISTORY = 'HISTORY',
    REPORTS = 'REPORTS',
    INVOICES = 'INVOICES',
    PAYROLL = 'PAYROLL',
    CUSTOMERS = 'CUSTOMERS',
    LEAD_SCRAPER = 'LEAD_SCRAPER',
    CALENDAR = 'CALENDAR',
    CASH_FLOW = 'CASH_FLOW',
    STATEMENTS = 'STATEMENTS',
    ANALYSIS = 'ANALYSIS',
    TEAM = 'TEAM',
    RULES = 'RULES',
    PRIVACY = 'PRIVACY',
    TERMS = 'TERMS',
    SUPPORT = 'SUPPORT'
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'Debit' | 'Credit';
    debitAccount: string;
    creditAccount: string;
    category: string;
    taxCategory: SaTaxCategory;
    sourceFileId?: string;
}

export type SaTaxCategory = 
    | 'VAT Standard Rate (15%)' 
    | 'VAT Zero Rated' 
    | 'VAT Exempt' 
    | 'Non-Deductible' 
    | 'Capital Goods' 
    | 'N/A';

export const TAX_CATEGORIES: SaTaxCategory[] = [
    'VAT Standard Rate (15%)',
    'VAT Zero Rated',
    'VAT Exempt',
    'Non-Deductible',
    'Capital Goods',
    'N/A'
];

export const TRANSACTION_CATEGORIES = [
    'Revenue',
    'Operating Expense',
    'Cost of Sales',
    'Other Income',
    'Asset',
    'Liability',
    'Equity',
    'Financing',
    'Investing',
    'Personal'
];

export interface SaAccount {
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
}

export interface AnalyzedStatement {
    metadata: {
        bankName: string;
        startDate: string;
        endDate: string;
        currency: string;
    };
    transactions: Omit<Transaction, 'id'>[];
}

export interface AnalyzedReceipt {
    date: string;
    merchant: string;
    totalAmount: number;
    vatAmount: number;
    suggestedCategory: string;
    suggestedTaxCategory: SaTaxCategory;
    debitAccount: string;
    creditAccount: string;
}

export interface StatementMetadata {
    bankName: string;
    startDate: string;
    endDate: string;
    currency: string;
}

export interface FinancialAnalysis {
    executiveSummary: string;
    keyMetrics: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
        vatPayable: number;
    };
    actionableTips: { title: string; description: string; type: 'Tax' | 'Savings' | 'Growth' }[];
    spendingBreakdown: { category: string; amount: number; percentage: number }[];
    riskAssessment?: { risk: string; severity: 'High' | 'Medium' | 'Low'; mitigation: string }[];
    industryBenchmarks?: { metric: string; yourValue: string; benchmark: string; status: 'Above' | 'Below' | 'On Track' }[];
    futureOutlook: string;
    taxImplications: string;
}

export interface StoredFile {
    id: string;
    name: string;
    uploadDate: string;
    transactionCount: number;
    summary?: string;
    notes?: string;
    size?: number;
    type?: string;
    downloadURL?: string;
    storagePath?: string;
}

export interface CategorizationRule {
    id: string;
    keyword: string;
    account: string;
    category: string;
}

export interface AiChatToolCall {
    searchText: string;
    updates: Partial<Omit<Transaction, 'id'>>;
}

export interface AiChatResponse {
    text: string;
    toolCall?: AiChatToolCall;
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
    costOfSales: { [key: string]: number };
    operatingExpenses: { [key: string]: number };
    totalRevenue: number;
    totalCostOfSales: number;
    grossProfit: number;
    totalOperatingExpenses: number;
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

export type CustomerStatus = 'Lead' | 'Active' | 'Overdue' | 'Inactive';

export interface Customer {
    id: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    status: CustomerStatus;
    balance: number;
    notes?: string;
    address?: string;
    vatNumber?: string;
}

export type UserRole = 'admin' | 'accountant' | 'viewer';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'Active' | 'Pending';
    dateInvited: string;
}

export type TaskStatus = 'todo' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    status: TaskStatus;
    priority: TaskPriority;
}

export interface ScrapedLead {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
    googleMapsUri?: string;
}

export type DocumentType = 'Invoice' | 'Quote' | 'Sales Order' | 'Delivery Note' | 'Purchase Order';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    isTaxable: boolean;
}

export interface Invoice {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Paid' | 'Delivered' | 'Overdue' | 'Declined';
    type: DocumentType;
    customerId: string;
    customerName: string;
    customerAddress?: string;
    customerVatNumber?: string;
    items: InvoiceItem[];
    subtotal: number;
    vatTotal: number;
    total: number;
    notes?: string;
}

export interface Address {
    street: string;
    city: string;
    zip: string;
    country: string;
}

export interface BankingDetails {
    bankName: string;
    accountNumber: string;
    sortCode?: string;
    accountType?: string;
    swiftCode?: string;
    iban?: string;
    routingNumber?: string;
}

export interface CompanySettings {
    companyName: string;
    vatNumber?: string;
    registrationNumber?: string;
    address?: Address;
    bankingDetails?: BankingDetails;
    email?: string;
    phone?: string;
    logoUrl?: string;
    invoiceCounter: number;
    invoicePrefix: string;
    quoteCounter: number;
    quotePrefix: string;
    poCounter: number;
    poPrefix: string;
}

export interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    unit: string;
    imageUrl?: string | null;
    createdAt?: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    hireDate: string;
    salaryType: 'salary' | 'hourly';
    rate: number;
    paymentFrequency: 'monthly' | 'weekly' | 'bi-weekly' | 'annually';
    bankDetails: BankingDetails;
    taxId: string;
    status: 'active' | 'inactive' | 'terminated';
    createdAt: string;
    updatedAt: string;
}

export interface Payslip {
    id: string;
    employeeId: string;
    employeeName: string;
    grossPay: number;
    deductions: {
        tax: number;
        socialSecurity: number;
        pension?: number;
        benefits?: number;
        other?: number;
    };
    netPay: number;
    hoursWorked?: number;
    rateUsed: number;
    generationDate: string;
    status: 'generated' | 'paid';
}

export interface PayrollRun {
    id: string;
    startDate: string;
    endDate: string;
    payDate: string;
    status: 'processed' | 'completed';
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    processedByUserId: string;
    createdAt: string;
    updatedAt: string;
}

export const SA_CHART_OF_ACCOUNTS: SaAccount[] = [
    { code: '1000', name: 'Bank Account', type: 'Asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
    { code: '2000', name: 'Accounts Payable', type: 'Liability' },
    { code: '2100', name: 'VAT Control Account', type: 'Liability' },
    { code: '4000', name: 'Sales Revenue', type: 'Income' },
    { code: '5000', name: 'Cost of Sales', type: 'Expense' },
    { code: '6000', name: 'Rent Expense', type: 'Expense' },
    { code: '6100', name: 'Salaries & Wages', type: 'Expense' },
    { code: '6200', name: 'Electricity & Water', type: 'Expense' },
    { code: '6300', name: 'Bank Charges', type: 'Expense' },
];

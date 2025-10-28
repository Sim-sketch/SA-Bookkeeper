import React, { useState, useMemo, useEffect } from 'react';
import { View, Transaction, CategorizationRule, TrialBalance, PnlData, BalanceSheetData, CashFlowData } from './types';
import Header from './components/Header';
import Navigation from './components/Navigation';
import JournalView from './components/JournalView';
import TrialBalanceView from './components/TrialBalanceView';
import ProfitAndLossView from './components/ProfitAndLossView';
import FinancialStatementsView from './components/FinancialStatementsView';
import AnalysisView from './components/AnalysisView';
import RulesView from './components/RulesView';
import CashFlowView from './components/CashFlowView';
import ActionToolbar from './components/ActionToolbar';
import Spinner from './components/Spinner';
import DashboardView from './components/DashboardView';
import AiChatView from './components/AiChatView';
import AuthView from './components/AuthView';
import DatabaseSetupGuide from './components/DatabaseSetupGuide';
import { analyzeStatement, generateFinancialAnalysis } from './services/geminiService';
import { generateProfitAndLoss, generateTrialBalance, generateBalanceSheet, generateCashFlowStatement } from './utils/accounting';
import { Session } from '@supabase/supabase-js';
import { getTransactions, addTransaction, updateTransaction, getRules, addRule, deleteRule, saveAllTransactions } from './services/databaseService';
import { useSupabase } from './contexts/SupabaseContext';
import AiAssistantButton from './components/AiAssistantButton';


const applyCategorizationRules = (transactions: Transaction[], rules: CategorizationRule[]): Transaction[] => {
    if (rules.length === 0) return transactions;

    return transactions.map(tx => {
        // Find the first matching rule
        const matchingRule = rules.find(rule => tx.description.toLowerCase().includes(rule.keyword.toLowerCase()));
        if (matchingRule) {
            const updatedTx = { ...tx, category: matchingRule.category };
            if (tx.type === 'Debit') {
                updatedTx.debitAccount = matchingRule.account;
                updatedTx.creditAccount = 'Bank';
            } else {
                updatedTx.creditAccount = matchingRule.account;
                updatedTx.debitAccount = 'Bank';
            }
            return updatedTx;
        }
        return tx;
    });
};


const App: React.FC = () => {
    const { client: supabase } = useSupabase();
    const [session, setSession] = useState<Session | null>(null);
    const [view, setView] = useState<View>(View.DASHBOARD);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [rules, setRules] = useState<CategorizationRule[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [dbSetupRequired, setDbSetupRequired] = useState<boolean>(false);

    useEffect(() => {
        const fetchInitialData = async (user_id: string) => {
            setIsLoading(true);
            setLoadingMessage("Loading your financial data...");
            try {
                const [transactionsData, rulesData] = await Promise.all([
                    getTransactions(supabase, user_id),
                    getRules(supabase, user_id)
                ]);
                setTransactions(transactionsData);
                setRules(rulesData);
                // Always default to the dashboard after loading
                setView(View.DASHBOARD);
            } catch (e: any) {
                if (e.message && (e.message.includes("does not exist") || e.message.includes("schema cache"))) {
                    console.warn("Database tables not found. Prompting user for setup.");
                    setDbSetupRequired(true);
                } else {
                    setError(`Failed to load data: ${e.message}`);
                }
            } finally {
                setIsLoading(false);
                setLoadingMessage('');
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchInitialData(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchInitialData(session.user.id);
            } else {
                // Clear data on logout
                setTransactions([]);
                setRules([]);
                setView(View.DASHBOARD);
                setDbSetupRequired(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleFileAnalysis = async (file: File) => {
        if (!session) {
            setError("You must be logged in to analyze a statement.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult('');
        
        try {
            setLoadingMessage('Reading and analyzing your bank statement...');
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const analyzedTransactions = await analyzeStatement(base64String, file.type);
            const transactionsWithRulesApplied = applyCategorizationRules(analyzedTransactions, rules);
            
            setLoadingMessage('Saving new transactions to your database...');
            await saveAllTransactions(supabase, session.user.id, transactionsWithRulesApplied);

            // Fetch all transactions again to have a consolidated view
            const allTransactions = await getTransactions(supabase, session.user.id);
            setTransactions(allTransactions);

            setLoadingMessage('Generating initial financial insights...');
            const analysis = await generateFinancialAnalysis(allTransactions);
            setAnalysisResult(analysis);
            setDbSetupRequired(false); // Data loaded, so setup is complete
            setView(View.ANALYSIS); // Show the analysis first
        } catch (e: any) {
            setError(`Failed to analyze statement: ${e.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        if (!session) return;
        try {
            const newTx = await addTransaction(supabase, session.user.id, transaction);
            setTransactions(prev => [...prev, newTx]);
        } catch (e: any) {
            setError(`Failed to add transaction: ${e.message}`);
        }
    };

    const handleUpdateTransaction = async (updatedTx: Transaction) => {
        if (!session) return;
        try {
            const returnedTx = await updateTransaction(supabase, session.user.id, updatedTx);
            setTransactions(prev => prev.map(tx => tx.id === returnedTx.id ? returnedTx : tx));
        } catch(e: any) {
            setError(`Failed to update transaction: ${e.message}`);
        }
    };

    const handleSync = async () => {
       if (!session) return;
        setIsLoading(true);
        setLoadingMessage("Syncing with database...");
        try {
            await saveAllTransactions(supabase, session.user.id, transactions);
            alert('Transactions synced with the database!');
        } catch(e: any) {
            setError(`Failed to sync: ${e.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleAddRule = async (rule: Omit<CategorizationRule, 'id'>) => {
        if (!session) return;
        try {
            const newRule = await addRule(supabase, session.user.id, rule);
            setRules(prev => [...prev, newRule]);
        } catch (e: any) {
            setError(`Failed to add rule: ${e.message}`);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!session) return;
        try {
            await deleteRule(supabase, session.user.id, id);
            setRules(prev => prev.filter(rule => rule.id !== id));
        } catch (e: any) {
            setError(`Failed to delete rule: ${e.message}`);
        }
    };
    
    const trialBalanceData: TrialBalance = useMemo(() => transactions.length > 0 ? generateTrialBalance(transactions) : { balances: [], totals: { debit: 0, credit: 0 } }, [transactions]);
    const pnlData: PnlData = useMemo(() => transactions.length > 0 ? generateProfitAndLoss(transactions) : { revenues: {}, expenses: {}, totalRevenue: 0, totalExpenses: 0, netProfit: 0 }, [transactions]);
    const balanceSheetData: BalanceSheetData = useMemo(() => transactions.length > 0 ? generateBalanceSheet(transactions, pnlData.netProfit) : { assets: {}, liabilities: {}, equity: {}, totals: { assets: 0, liabilitiesAndEquity: 0 } }, [transactions, pnlData.netProfit]);
    const cashFlowData: CashFlowData = useMemo(() => transactions.length > 0 ? generateCashFlowStatement(transactions, trialBalanceData) : { operatingActivities: {}, investingActivities: {}, financingActivities: {}, totalOperating: 0, totalInvesting: 0, totalFinancing: 0, netCashFlow: 0, startingBankBalance: 0, endingBankBalance: 0 }, [transactions, trialBalanceData]);


    const renderAppContent = () => {
        if (dbSetupRequired) {
            return <DatabaseSetupGuide onUploadClick={handleFileAnalysis} />;
        }

        switch (view) {
            case View.JOURNAL:
                return <JournalView transactions={transactions} onUpdateTransaction={handleUpdateTransaction} onAddTransaction={handleAddTransaction} />;
            case View.TRIAL_BALANCE:
                return <TrialBalanceView data={trialBalanceData} />;
            case View.PROFIT_LOSS:
                return <ProfitAndLossView data={pnlData} />;
            case View.STATEMENTS:
                 return <FinancialStatementsView pnlData={pnlData} balanceSheetData={balanceSheetData} />;
            case View.CASH_FLOW:
                 return <CashFlowView data={cashFlowData} />;
            case View.ANALYSIS:
                return <AnalysisView transactions={transactions} initialAnalysis={analysisResult} />;
            case View.RULES:
                return <RulesView rules={rules} onAddRule={handleAddRule} onDeleteRule={handleDeleteRule} />;
            case View.AI_CHAT:
                return <AiChatView transactions={transactions} />;
            case View.DASHBOARD:
            default:
                return <DashboardView 
                    onFileAnalysis={handleFileAnalysis}
                    transactions={transactions}
                    pnlData={pnlData}
                    balanceSheetData={balanceSheetData}
                />;
        }
    };

    const renderMainLayout = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-screen">
                    <Spinner />
                    <p className="mt-4 text-teal-500 dark:text-teal-400">{loadingMessage || 'Loading...'}</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="m-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            );
        }
        
        return (
            <>
                <Navigation activeView={view} setView={setView} />
                <ActionToolbar
                    activeView={view}
                    transactions={transactions}
                    rules={rules}
                    onSync={handleSync}
                    pnlData={pnlData}
                    balanceSheetData={balanceSheetData}
                    trialBalanceData={trialBalanceData}
                    cashFlowData={cashFlowData}
                />
                <div className="mt-6">
                    {renderAppContent()}
                </div>
                <AiAssistantButton onClick={() => setView(View.AI_CHAT)} />
            </>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
            <Header session={session}/>
            <main className="container mx-auto p-4 md:p-6">
                {!session ? <AuthView /> : renderMainLayout()}
            </main>
        </div>
    );
};

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext.tsx';
import { View, Transaction, CategorizationRule, Customer, Employee, Task, StoredFile, FinancialAnalysis, TeamMember, CompanySettings, AnalyzedStatement, AnalyzedReceipt } from './types.ts';

// Components
import Header from './components/Header.tsx';
import Navigation from './components/Navigation.tsx';
import Footer from './components/Footer.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import AiAssistantButton from './components/AiAssistantButton.tsx';
import AuthView from './components/AuthView.tsx';
import StatementPreviewModal from './components/StatementPreviewModal.tsx';
import ReceiptScannerModal from './components/ReceiptScannerModal.tsx';

// Views
import DashboardView from './components/DashboardView.tsx';
import JournalView from './components/JournalView.tsx';
import ReportsView from './components/ReportsView.tsx';
import VatReportView from './components/VatReportView.tsx';
import TrialBalanceView from './components/TrialBalanceView.tsx';
import ProfitAndLossView from './components/ProfitAndLossView.tsx';
import AiChatView from './components/AiChatView.tsx';
import SettingsView from './components/SettingsView.tsx';
import FinancialStatementsView from './components/FinancialStatementsView.tsx';
import CashFlowView from './components/CashFlowView.tsx';
import HistoryView from './components/HistoryView.tsx';
import InvoicesView from './components/InvoicesView.tsx';
import PayrollView from './components/PayrollView.tsx';
import CustomersView from './components/CustomersView.tsx';
import LeadScraperView from './components/LeadScraperView.tsx';
import CalendarView from './components/CalendarView.tsx';
import AnalysisView from './components/AnalysisView.tsx';
import TeamView from './components/TeamView.tsx';
import RulesView from './components/RulesView.tsx';
import PrivacyView from './components/PrivacyView.tsx';
import TermsView from './components/TermsView.tsx';
import SupportView from './components/SupportView.tsx';

// Services & Utils
import { 
    getTransactions, addTransaction, updateTransaction, deleteTransactions, updateTransactions, bulkAddTransactions,
    getRules, addRule, deleteRule,
    getCustomers, addCustomer, updateCustomer, deleteCustomer,
    getEmployees, addEmployee, updateEmployee, deleteEmployee,
    getTasks, addTask, updateTask, deleteTask,
    getTeamMembers, removeTeamMember, getCompanySettings, updateCompanySettings
} from './services/apiService.ts';
import { getUserFiles, deleteFileRecord, uploadFile } from './services/fileService.ts';
import { analyzeStatement, generateFinancialAnalysis } from './services/geminiService.ts';
import { generateProfitAndLoss, generateTrialBalance, generateBalanceSheet, generateCashFlowStatement } from './utils/accounting.ts';

const App: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [view, setView] = useState<View>(View.DASHBOARD);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Data States
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [rules, setRules] = useState<CategorizationRule[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTaskData] = useState<Task[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [analysisData, setAnalysisData] = useState<FinancialAnalysis | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [companySettings, setCompSettings] = useState<CompanySettings | null>(null);
    
    // Analysis & Scanner State
    const [pendingStatement, setPendingStatement] = useState<AnalyzedStatement | null>(null);
    const [currentAnalysisFiles, setCurrentAnalysisFiles] = useState<File[]>([]);
    const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);

    // Undo/Redo States
    const [past, setPast] = useState<Transaction[][]>([]);
    const [future, setFuture] = useState<Transaction[][]>([]);

    const [showAmounts, setShowAmounts] = useState(true);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        if (user) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const loadData = async () => {
        if (!user) return;
        
        setIsLoading(true);
        setLoadingMessage('Fetching your books...');
        
        try {
            const [txs, rls, custs, emps, tsks, history, team, settings] = await Promise.all([
                getTransactions(user.id).catch(() => []),
                getRules(user.id).catch(() => []),
                getCustomers(user.id).catch(() => []),
                getEmployees(user.id).catch(() => []),
                getTasks(user.id).catch(() => []),
                getUserFiles(user.id).catch(() => []),
                getTeamMembers(user.id).catch(() => []),
                getCompanySettings(user.id).catch(() => null)
            ]);
            
            setTransactions(txs || []);
            setRules(rls || []);
            setCustomers(custs || []);
            setEmployees(emps || []);
            setTaskData(tsks || []);
            setFiles(history || []);
            setTeamMembers(team || []);
            setCompSettings(settings);
            
            setPast([]);
            setFuture([]);
            
        } catch (error: any) {
            console.error("[App] Load Data Error:", error);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    // Mutation Handlers
    const handleUpdateTransaction = async (t: Transaction) => {
        if (!user) return;
        recordAction();
        try {
            setTransactions(prev => prev.map(tx => tx.id === t.id ? t : tx));
            await updateTransaction(user.id, t);
        } catch (e) {
            console.error("Update failed", e);
            loadData();
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        if (!user) return;
        recordAction();
        try {
            setTransactions(prev => prev.filter(tx => !ids.includes(tx.id)));
            await deleteTransactions(user.id, ids);
        } catch (e) {
            console.error("Delete failed", e);
            loadData();
        }
    };

    const handleBulkUpdate = async (ids: string[], data: Partial<Omit<Transaction, 'id'>>) => {
        if (!user) return;
        recordAction();
        try {
            setTransactions(prev => prev.map(tx => ids.includes(tx.id) ? { ...tx, ...data } : tx));
            await updateTransactions(user.id, ids, data);
        } catch (e) {
            console.error("Bulk update failed", e);
            loadData();
        }
    };

    const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
        if (!user) return;
        recordAction();
        try {
            const added = await addTransaction(user.id, t);
            setTransactions(prev => [added, ...prev]);
        } catch (e) {
            console.error("Add failed", e);
            loadData();
        }
    };

    const recordAction = () => {
        setPast(prev => [...prev.slice(-19), [...transactions]]);
        setFuture([]);
    };

    const handleUndo = () => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        setFuture(prev => [[...transactions], ...prev]);
        setTransactions(previous);
        setPast(newPast);
    };

    const handleRedo = () => {
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);
        setPast(prev => [...prev, [...transactions]]);
        setTransactions(next);
        setFuture(newFuture);
    };

    const handleFileAnalysis = async (selectedFiles: File[]) => {
        if (!user) return;
        if (selectedFiles.length === 0) return;
        
        setIsLoading(true);
        setCurrentAnalysisFiles(selectedFiles);
        try {
            const aggregatedTransactions: Omit<Transaction, 'id'>[] = [];
            const bankNames = new Set<string>();
            let minStartDate: string = "";
            let maxEndDate: string = "";

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                setLoadingMessage(`AI Analysis (${i + 1}/${selectedFiles.length}): ${file.name}...`);
                
                let attempts = 0;
                let success = false;
                let result: AnalyzedStatement | null = null;

                while (attempts < 2 && !success) {
                    try {
                        const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                            reader.onerror = () => reject(new Error("File read failed"));
                            reader.readAsDataURL(file);
                        });
                        
                        result = await analyzeStatement(base64, file.type);
                        success = true;
                    } catch (fileError: any) {
                        attempts++;
                        console.error(`[App] Attempt ${attempts} failed for ${file.name}:`, fileError);
                        
                        if (attempts >= 2) {
                            let msg = fileError.message || "Unknown OCR error.";
                            if (msg.includes("500") || msg.includes("xhr")) {
                                msg = "Google AI service is currently busy or the file payload is too large. Try uploading 1 month at a time.";
                            }
                            alert(`Could not process ${file.name}: ${msg}`);
                        } else {
                            setLoadingMessage(`Retrying ${file.name}...`);
                            await new Promise(r => setTimeout(r, 2000)); // Wait before retry
                        }
                    }
                }

                if (success && result && result.transactions && result.transactions.length > 0) {
                    aggregatedTransactions.push(...result.transactions);
                    if (result.metadata?.bankName) bankNames.add(result.metadata.bankName);
                    if (result.metadata?.startDate && (!minStartDate || result.metadata.startDate < minStartDate)) {
                        minStartDate = result.metadata.startDate;
                    }
                    if (result.metadata?.endDate && (!maxEndDate || result.metadata.endDate > maxEndDate)) {
                        maxEndDate = result.metadata.endDate;
                    }
                }
            }
            
            if (aggregatedTransactions.length === 0) {
                throw new Error("No data could be extracted from any of the uploaded documents. Ensure they are clear PDF bank statements (not password protected).");
            }

            // Sort by date before presenting to user
            aggregatedTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setPendingStatement({
                metadata: {
                    bankName: Array.from(bankNames).join(', ') || 'Various Banks',
                    startDate: minStartDate,
                    endDate: maxEndDate,
                    currency: 'ZAR'
                },
                transactions: aggregatedTransactions
            });
        } catch (e: any) {
            console.error("[App] Analysis Fatal Error:", e);
            alert(`Import Failed: ${e.message}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const confirmPendingStatement = async () => {
        if (!user || !pendingStatement || currentAnalysisFiles.length === 0) return;
        
        setIsLoading(true);
        setLoadingMessage('Importing into journal...');
        try {
            const txs = pendingStatement.transactions;
            await bulkAddTransactions(user.id, txs as Omit<Transaction, 'id'>[]);
            
            for (const file of currentAnalysisFiles) {
                await uploadFile(user.id, file, 0, pendingStatement.metadata?.bankName || 'OCR Import');
            }
            
            await loadData();
            setPendingStatement(null);
            setCurrentAnalysisFiles([]);
            setView(View.JOURNAL);
        } catch (e: any) {
            alert(`Import failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceiptConfirmed = async (receipt: AnalyzedReceipt) => {
        if (!user) return;
        setIsLoading(true);
        setLoadingMessage('Recording receipt...');
        try {
            const newTx: Omit<Transaction, 'id'> = {
                date: receipt.date,
                description: `[Scanner] ${receipt.merchant}`,
                amount: receipt.totalAmount,
                type: 'Debit',
                debitAccount: receipt.debitAccount,
                creditAccount: receipt.creditAccount,
                category: receipt.suggestedCategory,
                taxCategory: receipt.suggestedTaxCategory,
            };
            await addTransaction(user.id, newTx);
            await loadData();
            setIsReceiptScannerOpen(false);
            setView(View.JOURNAL);
        } catch (e: any) {
            alert("Failed to save receipt: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAnalysis = async () => {
        if (transactions.length === 0) return;
        setIsAnalysisLoading(true);
        try {
            const result = await generateFinancialAnalysis(transactions);
            setAnalysisData(result);
        } catch (e: any) {
            console.error("Analysis failed", e);
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    // Derived Data
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const lowerQ = searchQuery.toLowerCase();
        return transactions.filter(t => 
            t.description.toLowerCase().includes(lowerQ) || 
            t.debitAccount.toLowerCase().includes(lowerQ) ||
            t.creditAccount.toLowerCase().includes(lowerQ)
        );
    }, [transactions, searchQuery]);

    const approvedTransactions = useMemo(() => transactions.filter(t => t.status === 'Approved'), [transactions]);

    const pnlData = useMemo(() => generateProfitAndLoss(approvedTransactions), [approvedTransactions]);
    const trialBalanceData = useMemo(() => generateTrialBalance(approvedTransactions), [approvedTransactions]);
    const balanceSheetData = useMemo(() => generateBalanceSheet(approvedTransactions, pnlData.netProfit), [approvedTransactions, pnlData]);
    const cashFlowData = useMemo(() => generateCashFlowStatement(approvedTransactions, trialBalanceData), [approvedTransactions, trialBalanceData]);
    const knownAccounts = useMemo(() => Array.from(new Set(transactions.map(t => t.debitAccount))), [transactions]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <LoadingOverlay isActive={true} message="Initializing session..." />
            </div>
        );
    }

    if (!user) {
        return <AuthView />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <Header onSearch={setSearchQuery} searchQuery={searchQuery} companyName={companySettings?.companyName} logoUrl={companySettings?.logoUrl} showAmounts={showAmounts} onToggleShowAmounts={() => setShowAmounts(!showAmounts)} />
            <main className="flex-grow container mx-auto px-4 py-8 space-y-6">
                <Navigation activeView={view} setView={setView} />
                
                {view === View.DASHBOARD && <DashboardView onFileAnalysis={handleFileAnalysis} transactions={approvedTransactions} pnlData={pnlData} showAmounts={showAmounts} onLaunchScanner={() => setIsReceiptScannerOpen(true)} />}
                {view === View.JOURNAL && <JournalView transactions={filteredTransactions} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onBulkDelete={handleBulkDelete} onBulkUpdate={handleBulkUpdate} knownAccounts={knownAccounts} onRefreshData={loadData} onUndo={handleUndo} onRedo={handleRedo} canUndo={past.length > 0} canRedo={future.length > 0} allTransactionsCount={transactions.length} onClearFilters={() => setSearchQuery('')} pnlData={pnlData} balanceSheetData={balanceSheetData} trialBalanceData={trialBalanceData} cashFlowData={cashFlowData} showAmounts={showAmounts} />}
                {view === View.VAT_201 && <VatReportView transactions={approvedTransactions} />}
                {view === View.TRIAL_BALANCE && <TrialBalanceView data={trialBalanceData} showAmounts={showAmounts} />}
                {view === View.PROFIT_LOSS && <ProfitAndLossView data={pnlData} showAmounts={showAmounts} />}
                {view === View.CASH_FLOW && <CashFlowView data={cashFlowData} showAmounts={showAmounts} />}
                {view === View.STATEMENTS && <FinancialStatementsView pnlData={pnlData} balanceSheetData={balanceSheetData} showAmounts={showAmounts} />}
                {view === View.HISTORY && <HistoryView files={files} onDeleteFile={(f) => deleteFileRecord(user!.id, f).then(() => loadData())} onRefresh={loadData} />}
                {view === View.INVOICES && <InvoicesView customers={customers} />}
                {view === View.PAYROLL && <PayrollView employees={employees} onAddEmployee={(e) => addEmployee(user!.id, e).then(() => loadData())} onUpdateEmployee={(e) => updateEmployee(user!.id, e).then(() => loadData())} onDeleteEmployee={(id) => deleteEmployee(user!.id, id).then(() => loadData())} />}
                {view === View.CUSTOMERS && <CustomersView customers={customers} onAddCustomer={(c) => addCustomer(user!.id, c).then(() => loadData())} onUpdateCustomer={(c) => updateCustomer(user!.id, c).then(() => loadData())} onDeleteCustomer={(id) => deleteCustomer(user!.id, id).then(() => loadData())} />}
                {view === View.LEAD_SCRAPER && <LeadScraperView onAddCustomer={(c) => addCustomer(user!.id, c).then(() => loadData())} />}
                {view === View.CALENDAR && <CalendarView tasks={tasks} onAddTask={(t) => addTask(user!.id, t).then(() => loadData())} onUpdateTask={(t) => updateTask(user!.id, t).then(() => loadData())} onDeleteTask={(id) => deleteTask(user!.id, id).then(() => loadData())} />}
                {view === View.ANALYSIS && <AnalysisView analysisData={analysisData} isLoading={isAnalysisLoading} error={null} onGenerateAnalysis={handleGenerateAnalysis} transactions={approvedTransactions} />}
                {view === View.REPORTS && <ReportsView transactions={approvedTransactions} pnlData={pnlData} balanceSheetData={balanceSheetData} trialBalanceData={trialBalanceData} cashFlowData={cashFlowData} analysisData={analysisData} onGenerateAnalysis={handleGenerateAnalysis} isAnalysisLoading={isAnalysisLoading} />}
                {view === View.TEAM && <TeamView members={teamMembers} onInvite={() => Promise.resolve()} onRemove={(id) => removeTeamMember(user!.id, id).then(() => loadData())} />}
                {view === View.RULES && <RulesView rules={rules} onAddRule={(r) => addRule(user!.id, r).then(() => loadData())} onDeleteRule={(id) => deleteRule(user!.id, id).then(() => loadData())} knownAccounts={knownAccounts} />}
                {view === View.SETTINGS && <SettingsView companySettings={companySettings} onUpdateSettings={(s) => { setCompSettings(s); updateCompanySettings(user.id, s); }} />}
                {view === View.PRIVACY && <PrivacyView />}
                {view === View.TERMS && <TermsView />}
                {view === View.SUPPORT && <SupportView />}
                {view === View.AI_CHAT && <AiChatView transactions={transactions} onClose={() => setView(View.DASHBOARD)} checkApiKey={() => !!(process.env.GEMINI_API_KEY || process.env.API_KEY)} />}

            </main>
            <Footer setView={setView} />
            <LoadingOverlay isActive={isLoading} message={loadingMessage} />
            <AiAssistantButton onClick={() => setIsAiChatOpen(true)} />
            
            {isAiChatOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-lg h-[90vh]">
                        <AiChatView transactions={transactions} checkApiKey={() => !!(process.env.GEMINI_API_KEY || process.env.API_KEY)} onClose={() => setIsAiChatOpen(false)} onBulkUpdate={handleBulkUpdate} />
                    </div>
                </div>
            )}

            {pendingStatement && (
                <StatementPreviewModal 
                    isOpen={!!pendingStatement} 
                    metadata={pendingStatement.metadata} 
                    transactions={pendingStatement.transactions} 
                    onConfirm={confirmPendingStatement} 
                    onCancel={() => { setPendingStatement(null); setCurrentAnalysisFiles([]); }} 
                />
            )}

            {isReceiptScannerOpen && (
                <ReceiptScannerModal 
                    isOpen={isReceiptScannerOpen} 
                    onClose={() => setIsReceiptScannerOpen(false)} 
                    onConfirm={handleReceiptConfirmed} 
                />
            )}
        </div>
    );
};

export default App;

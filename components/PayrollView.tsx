import React, { useState, useEffect } from 'react';
import { Employee, Payslip, PayrollRun } from '../types.ts';
import { UsersIcon } from './icons/UsersIcon.tsx';
import { BanknotesIcon } from './icons/BanknotesIcon.tsx';
import { DocumentTextIcon } from './icons/DocumentTextIcon.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';
import { XIcon } from './icons/XIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { EditIcon } from './icons/EditIcon.tsx';
import { calculatePAYE, calculateUIF } from '../utils/payrollUtils.ts';
import { exportPayslipAsPDF } from '../utils/pdf.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { getPayrollRuns, createPayrollRun, getPayslipsForRun } from '../services/apiService.ts';
import Spinner from './Spinner.tsx';

interface PayrollViewProps {
    employees: Employee[];
    onAddEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onUpdateEmployee: (employee: Employee) => void;
    onDeleteEmployee: (id: string) => void;
}

type Tab = 'employees' | 'run' | 'history';

const initialEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
    salaryType: 'salary',
    rate: 0,
    paymentFrequency: 'monthly',
    bankDetails: {
        bankName: '',
        accountNumber: '',
        sortCode: ''
    },
    taxId: '',
    status: 'active'
};

const PayrollView: React.FC<PayrollViewProps> = ({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('employees');
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    
    // Local state for Payroll Runs (fetched internally to keep app state simpler for this specific view logic)
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    
    // Payslips cache: { [runId]: Payslip[] }
    const [runPayslips, setRunPayslips] = useState<{ [runId: string]: Payslip[] }>({});
    const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

    // Form State
    const [empForm, setEmpForm] = useState<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>(initialEmployee);
    
    // Run Payroll State
    const [runStartDate, setRunStartDate] = useState('');
    const [runEndDate, setRunEndDate] = useState('');
    const [runPayDate, setRunPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [generatedPayslips, setGeneratedPayslips] = useState<Omit<Payslip, 'id'>[]>([]);
    
    // History State
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            // Default current month dates
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setRunStartDate(firstDay);
            setRunEndDate(lastDay);

            // Fetch runs
            getPayrollRuns(user.id).then(setPayrollRuns).catch(console.error);
        }
    }, [user]);

    const handleSaveEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!empForm.firstName || !empForm.lastName || empForm.rate < 0) {
            alert("Please fill in all required fields (Name, Rate).");
            return;
        }

        if (editingEmployee) {
            onUpdateEmployee({ ...empForm, id: editingEmployee.id, createdAt: editingEmployee.createdAt, updatedAt: editingEmployee.updatedAt });
        } else {
            onAddEmployee(empForm);
        }
        
        setIsAddingEmployee(false);
        setEditingEmployee(null);
        setEmpForm(initialEmployee);
    };

    const handleEditEmployee = (emp: Employee) => {
        setEditingEmployee(emp);
        setEmpForm(emp);
        setIsAddingEmployee(true);
    };

    const handleCancelEdit = () => {
        setIsAddingEmployee(false);
        setEditingEmployee(null);
        setEmpForm(initialEmployee);
    };

    const calculateMonthlyGross = (emp: Employee): number => {
        // Convert rate to monthly gross based on frequency
        switch (emp.paymentFrequency) {
            case 'annually': return emp.rate / 12;
            case 'monthly': return emp.rate;
            case 'bi-weekly': return emp.rate * 2.165; // Avg 4.33 weeks / 2
            case 'weekly': return emp.rate * 4.33;
            default: return emp.rate; // Fallback
        }
    };

    const handlePreparePayroll = () => {
        if (!runStartDate || !runEndDate || !runPayDate) {
            alert("Please select Start, End, and Pay dates.");
            return;
        }

        const activeEmployees = employees.filter(e => e.status === 'active');
        
        const newPayslips: Omit<Payslip, 'id'>[] = activeEmployees.map(emp => {
            const monthlyGross = calculateMonthlyGross(emp);
            // If hourly, this is an estimate based on 40h week. In real app, ask for hours.
            const hoursEstimated = emp.salaryType === 'hourly' ? 173.33 : undefined;
            const finalGross = emp.salaryType === 'hourly' ? (emp.rate * 173.33) : monthlyGross; 

            const paye = calculatePAYE(finalGross);
            const uif = calculateUIF(finalGross);
            const netPay = finalGross - uif - paye;
            
            return {
                employeeId: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                grossPay: finalGross,
                deductions: {
                    tax: paye,
                    socialSecurity: uif,
                    pension: 0,
                    benefits: 0
                },
                netPay: netPay,
                hoursWorked: hoursEstimated,
                rateUsed: emp.rate,
                generationDate: runPayDate,
                status: 'generated'
            };
        });
        setGeneratedPayslips(newPayslips);
    };

    const handleConfirmPayroll = async () => {
        if (!user) return;
        
        // Calculate Totals
        const totalGrossPay = generatedPayslips.reduce((sum, p) => sum + p.grossPay, 0);
        const totalDeductions = generatedPayslips.reduce((sum, p) => sum + p.deductions.tax + p.deductions.socialSecurity + (p.deductions.pension || 0), 0);
        const totalNetPay = generatedPayslips.reduce((sum, p) => sum + p.netPay, 0);

        const runData: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'> = {
            startDate: runStartDate,
            endDate: runEndDate,
            payDate: runPayDate,
            status: 'processed',
            totalGrossPay,
            totalNetPay,
            totalDeductions,
            processedByUserId: user.id
        };

        try {
            // Create Run and Payslips in one go via API service
            const newRun = await createPayrollRun(
                user.id, 
                runData, 
                generatedPayslips.map(p => ({ ...p, status: 'generated' }))
            );
            
            setPayrollRuns(prev => [newRun, ...prev]);
            setGeneratedPayslips([]);
            setActiveTab('history');
            
        } catch (e) {
            console.error(e);
            alert("Failed to save payroll run.");
        }
    };

    const handleExpandRun = async (runId: string) => {
        if (expandedRunId === runId) {
            setExpandedRunId(null);
            return;
        }

        setExpandedRunId(runId);

        // Fetch payslips if not already cached
        if (!runPayslips[runId] && user) {
            setLoadingRunId(runId);
            try {
                const slips = await getPayslipsForRun(user.id, runId);
                setRunPayslips(prev => ({ ...prev, [runId]: slips }));
            } catch (error) {
                console.error("Failed to load payslips", error);
            } finally {
                setLoadingRunId(null);
            }
        }
    };

    const updateBankDetails = (field: string, value: string) => {
        setEmpForm(prev => ({
            ...prev,
            bankDetails: { ...prev.bankDetails, [field]: value }
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 flex gap-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('employees')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                    <UsersIcon className="w-4 h-4" /> Employees
                </button>
                <button 
                    onClick={() => setActiveTab('run')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'run' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                    <BanknotesIcon className="w-4 h-4" /> Run Payroll
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                    <DocumentTextIcon className="w-4 h-4" /> History
                </button>
            </div>

            {/* Content */}
            {activeTab === 'employees' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employee Directory</h2>
                        {!isAddingEmployee && (
                            <button onClick={() => { setEditingEmployee(null); setEmpForm(initialEmployee); setIsAddingEmployee(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-500 text-sm font-medium">
                                + Add Employee
                            </button>
                        )}
                    </div>

                    {isAddingEmployee && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-slide-up">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-800 dark:text-white">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h3>
                                <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600"><XIcon className="w-5 h-5" /></button>
                            </div>
                            
                            <form onSubmit={handleSaveEmployee} className="space-y-6">
                                {/* Personal Details */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">Personal Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input placeholder="First Name *" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.firstName} onChange={e => setEmpForm({...empForm, firstName: e.target.value})} required />
                                        <input placeholder="Last Name *" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.lastName} onChange={e => setEmpForm({...empForm, lastName: e.target.value})} required />
                                        <input placeholder="Email Address" type="email" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} />
                                        <input placeholder="Tax ID / ID Number" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.taxId} onChange={e => setEmpForm({...empForm, taxId: e.target.value})} />
                                    </div>
                                </div>

                                {/* Job & Compensation */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">Position & Pay</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs mb-1 text-slate-500">Position</label>
                                            <input className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.position} onChange={e => setEmpForm({...empForm, position: e.target.value})} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs mb-1 text-slate-500">Hire Date</label>
                                            <input type="date" className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.hireDate} onChange={e => setEmpForm({...empForm, hireDate: e.target.value})} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs mb-1 text-slate-500">Status</label>
                                            <select className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.status} onChange={e => setEmpForm({...empForm, status: e.target.value as any})}>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="terminated">Terminated</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs mb-1 text-slate-500">Type</label>
                                            <select className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.salaryType} onChange={e => setEmpForm({...empForm, salaryType: e.target.value as any})}>
                                                <option value="salary">Salary</option>
                                                <option value="hourly">Hourly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1 text-slate-500">Rate (R)</label>
                                            <input type="number" className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.rate} onChange={e => setEmpForm({...empForm, rate: parseFloat(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs mb-1 text-slate-500">Frequency</label>
                                            <select className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.paymentFrequency} onChange={e => setEmpForm({...empForm, paymentFrequency: e.target.value as any})}>
                                                <option value="annually">Annually</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="bi-weekly">Bi-Weekly</option>
                                                <option value="weekly">Weekly</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Banking Details */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">Banking Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input placeholder="Bank Name" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.bankDetails.bankName} onChange={e => updateBankDetails('bankName', e.target.value)} />
                                        <input placeholder="Account Number" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.bankDetails.accountNumber} onChange={e => updateBankDetails('accountNumber', e.target.value)} />
                                        <input placeholder="Sort Code / Branch Code" className="p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={empForm.bankDetails.sortCode || ''} onChange={e => updateBankDetails('sortCode', e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 shadow-sm font-medium">Save Employee</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Position</th>
                                    <th className="p-4">Rate/Salary</th>
                                    <th className="p-4">Frequency</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            {emp.firstName} {emp.lastName}
                                            <div className="text-xs text-slate-500">{emp.email}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{emp.position}</td>
                                        <td className="p-4 font-mono text-slate-900 dark:text-white">
                                            R {emp.rate.toLocaleString()} 
                                            {emp.salaryType === 'hourly' && <span className="text-xs text-slate-500 ml-1">/hr</span>}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{emp.paymentFrequency}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs capitalize ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleEditEmployee(emp)} className="text-blue-600 hover:text-blue-500"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => onDeleteEmployee(emp.id)} className="text-red-600 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No employees found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'run' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">New Payroll Run</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">Start Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={runStartDate}
                                    onChange={e => setRunStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">End Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={runEndDate}
                                    onChange={e => setRunEndDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">Pay Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={runPayDate}
                                    onChange={e => setRunPayDate(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handlePreparePayroll}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 font-medium h-10"
                            >
                                Calculate Run
                            </button>
                        </div>
                    </div>

                    {generatedPayslips.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
                            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-teal-800 dark:text-teal-300">Draft Run Preview</h3>
                                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                                        Pay Date: {runPayDate} | Employees: {generatedPayslips.length}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-slate-500">Total Net Pay</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                        R {generatedPayslips.reduce((acc, p) => acc + p.netPay, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                                    <tr>
                                        <th className="p-3">Employee</th>
                                        <th className="p-3 text-right">Gross Pay</th>
                                        <th className="p-3 text-right">Tax (PAYE)</th>
                                        <th className="p-3 text-right">Social Security (UIF)</th>
                                        <th className="p-3 text-right">Net Pay</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {generatedPayslips.map((ps, i) => (
                                        <tr key={i}>
                                            <td className="p-3 font-medium text-slate-900 dark:text-white">{ps.employeeName}</td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-300">R {ps.grossPay.toFixed(2)}</td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-300">R {ps.deductions.tax.toFixed(2)}</td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-300">R {ps.deductions.socialSecurity.toFixed(2)}</td>
                                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">R {ps.netPay.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setGeneratedPayslips([])} className="px-4 py-2 text-slate-600 dark:text-slate-400">Discard</button>
                                <button onClick={handleConfirmPayroll} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4" /> Finalize & Save Run
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payroll History</h2>
                    
                    {payrollRuns.length === 0 && (
                        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
                            No payroll runs processed yet.
                        </div>
                    )}

                    <div className="grid gap-4">
                        {payrollRuns.map(run => (
                            <div key={run.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div 
                                    className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleExpandRun(run.id)}
                                >
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">
                                            Period: {new Date(run.startDate).toLocaleDateString()} - {new Date(run.endDate).toLocaleDateString()}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Pay Date: {new Date(run.payDate).toLocaleDateString()} • Status: <span className="capitalize font-medium text-green-600">{run.status}</span>
                                        </p>
                                    </div>
                                    <div className="text-right mt-2 md:mt-0">
                                        <p className="text-xs text-slate-500 uppercase">Total Net Pay</p>
                                        <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                                            R {run.totalNetPay.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Payslips Details */}
                                {expandedRunId === run.id && (
                                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-4 animate-fade-in">
                                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Payslips in this Run</h4>
                                        
                                        {loadingRunId === run.id ? (
                                            <div className="py-4 flex justify-center"><Spinner /></div>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs text-slate-500 uppercase">
                                                        <th className="pb-2">Employee</th>
                                                        <th className="pb-2 text-right">Gross</th>
                                                        <th className="pb-2 text-right">Deductions</th>
                                                        <th className="pb-2 text-right">Net</th>
                                                        <th className="pb-2 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(runPayslips[run.id] || []).map(ps => (
                                                        <tr key={ps.id} className="border-b border-slate-200 dark:border-slate-800 last:border-0">
                                                            <td className="py-2 text-slate-800 dark:text-white font-medium">{ps.employeeName}</td>
                                                            <td className="py-2 text-right text-slate-600 dark:text-slate-300">R {ps.grossPay.toFixed(2)}</td>
                                                            <td className="py-2 text-right text-slate-600 dark:text-slate-300">R {(ps.deductions.tax + ps.deductions.socialSecurity + (ps.deductions.pension || 0) + (ps.deductions.other || 0)).toFixed(2)}</td>
                                                            <td className="py-2 text-right font-bold text-slate-800 dark:text-white">R {ps.netPay.toFixed(2)}</td>
                                                            <td className="py-2 text-right">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); exportPayslipAsPDF(ps, employees.find(emp => emp.id === ps.employeeId), user); }}
                                                                    className="text-blue-600 hover:text-blue-500 text-xs font-medium"
                                                                >
                                                                    Download PDF
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(runPayslips[run.id] || []).length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                                                                No payslips found for this run.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollView;
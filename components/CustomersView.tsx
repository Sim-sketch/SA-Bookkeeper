
import React, { useState } from 'react';
import { Customer, CustomerStatus } from '../types';
import { XIcon } from './icons/XIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CustomersViewProps {
    customers: Customer[];
    onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
    onUpdateCustomer: (customer: Customer) => void;
    onDeleteCustomer: (id: string) => void;
}

const STATUS_COLUMNS: { id: CustomerStatus; label: string; color: string; bg: string }[] = [
    { id: 'Lead', label: 'Leads', color: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'Active', label: 'Active Clients', color: 'border-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { id: 'Overdue', label: 'Payment Overdue', color: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { id: 'Inactive', label: 'Inactive / Closed', color: 'border-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/40' },
];

const CustomersView: React.FC<CustomersViewProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [draggedCustomerId, setDraggedCustomerId] = useState<string | null>(null);
    
    // New Customer Form State
    const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ status: 'Lead', balance: 0 });

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedCustomerId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: CustomerStatus) => {
        e.preventDefault();
        if (draggedCustomerId) {
            const customer = customers.find(c => c.id === draggedCustomerId);
            if (customer && customer.status !== status) {
                onUpdateCustomer({ ...customer, status });
            }
            setDraggedCustomerId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCustomer.name) {
            onAddCustomer({
                name: newCustomer.name,
                companyName: newCustomer.companyName || '',
                email: newCustomer.email || '',
                phone: newCustomer.phone || '',
                status: newCustomer.status || 'Lead',
                balance: Number(newCustomer.balance) || 0,
                notes: newCustomer.notes || ''
            });
            setIsAdding(false);
            setNewCustomer({ status: 'Lead', balance: 0 });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300">Customer Pipeline</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Drag and drop cards to update status.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 shadow-sm transition-colors font-medium"
                >
                    + New Customer
                </button>
            </div>

            {/* Add Customer Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={() => setIsAdding(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add New Customer</h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input 
                                placeholder="Full Name *" 
                                required 
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                            />
                            <input 
                                placeholder="Company Name" 
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                                onChange={e => setNewCustomer({...newCustomer, companyName: e.target.value})}
                            />
                             <div className="grid grid-cols-2 gap-3">
                                <input 
                                    placeholder="Email" 
                                    type="email"
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                                />
                                <input 
                                    placeholder="Phone" 
                                    type="tel"
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                                />
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                                <select 
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                                    onChange={e => setNewCustomer({...newCustomer, status: e.target.value as CustomerStatus})}
                                    value={newCustomer.status}
                                >
                                    {STATUS_COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                                </select>
                                <input 
                                    placeholder="Opening Balance (R)" 
                                    type="number"
                                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                                    onChange={e => setNewCustomer({...newCustomer, balance: parseFloat(e.target.value)})}
                                />
                            </div>
                            <button type="submit" className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 font-medium mt-2">
                                Save Customer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex-grow overflow-x-auto">
                <div className="flex gap-4 min-w-[1000px] h-full pb-4">
                    {STATUS_COLUMNS.map(col => (
                        <div 
                            key={col.id} 
                            className={`flex-1 min-w-[250px] rounded-xl ${col.bg} p-3 border-t-4 ${col.color} flex flex-col`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex justify-between items-center">
                                {col.label}
                                <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs shadow-sm">
                                    {customers.filter(c => c.status === col.id).length}
                                </span>
                            </h3>
                            <div className="space-y-3 overflow-y-auto flex-grow">
                                {customers.filter(c => c.status === col.id).map(customer => (
                                    <div
                                        key={customer.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, customer.id)}
                                        className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{customer.name}</h4>
                                            <button onClick={() => onDeleteCustomer(customer.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {customer.companyName && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{customer.companyName}</p>}
                                        
                                        <div className="flex justify-between items-end mt-3">
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                {customer.email && <p className="truncate max-w-[120px]">{customer.email}</p>}
                                                {customer.phone && <p>{customer.phone}</p>}
                                            </div>
                                            <div className="text-right">
                                                 <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${customer.balance > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                    R {customer.balance.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomersView;

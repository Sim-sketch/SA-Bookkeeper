import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, InvoiceItem, Customer, DocumentType, Product, CompanySettings } from '../types.ts';
import { getInvoices, addInvoice, updateInvoice, deleteInvoice, getProducts, getCompanySettings } from '../services/apiService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { exportInvoiceAsPDF } from '../utils/pdf.ts';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon.tsx';
import { PdfIcon } from './icons/PdfIcon.tsx';
import { EditIcon } from './icons/EditIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon.tsx';
import Spinner from './Spinner.tsx';

interface InvoicesViewProps {
    customers: Customer[];
}

const initialItem: InvoiceItem = { description: '', quantity: 1, unitPrice: 0, isTaxable: true };

const InvoicesView: React.FC<InvoicesViewProps> = ({ customers }) => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [companySettings, setCompanySettings] = useState<CompanySettings>();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({ items: [{ ...initialItem }] });
    const [permissionError, setPermissionError] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<DocumentType | 'All'>('Invoice');

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            setPermissionError(false);
            
            // Use allSettled to handle partial failures (e.g. permission denied on invoices but not settings)
            Promise.allSettled([
                getInvoices(user.id),
                getProducts(user.id),
                getCompanySettings(user.id)
            ]).then(([invResult, prodResult, settingsResult]) => {
                
                if (invResult.status === 'fulfilled') {
                    setInvoices(invResult.value);
                } else {
                    console.error("Failed to load invoices", invResult.reason);
                    if (invResult.reason?.code === 'permission-denied' || invResult.reason?.message?.includes('permission')) {
                        setPermissionError(true);
                    }
                }

                if (prodResult.status === 'fulfilled') {
                    setProducts(prodResult.value);
                }

                if (settingsResult.status === 'fulfilled') {
                    setCompanySettings(settingsResult.value);
                }
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [user]);

    const filteredDocuments = useMemo(() => {
        if (activeTab === 'All') return invoices;
        return invoices.filter(doc => doc.type === activeTab);
    }, [invoices, activeTab]);

    const handleCreateNew = () => {
        const type = activeTab === 'All' ? 'Invoice' : activeTab;
        setCurrentInvoice({
            // Number is now assigned by API on save, but we show placeholder
            number: '(Auto)', 
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Draft',
            type: type,
            items: [{ ...initialItem }],
            subtotal: 0,
            vatTotal: 0,
            total: 0
        });
        setIsEditing(true);
    };

    const handleAddItem = () => {
        setCurrentInvoice(prev => ({
            ...prev,
            items: [...(prev.items || []), { ...initialItem }]
        }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...(currentInvoice.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        recalcTotals(newItems);
    };

    const handleProductSelect = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            const newItems = [...(currentInvoice.items || [])];
            newItems[index] = {
                description: product.name,
                quantity: 1,
                unitPrice: product.price, // Updated mapping from 'unitPrice' to 'price'
                isTaxable: true // Defaulting to taxable as product schema doesn't have it
            };
            recalcTotals(newItems);
        }
    };

    const recalcTotals = (items: InvoiceItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const vatTotal = items.reduce((sum, item) => sum + (item.isTaxable ? (item.quantity * item.unitPrice * 0.15) : 0), 0);
        
        setCurrentInvoice(prev => ({
            ...prev,
            items,
            subtotal,
            vatTotal,
            total: subtotal + vatTotal
        }));
    };

    const handleRemoveItem = (index: number) => {
        const newItems = (currentInvoice.items || []).filter((_, i) => i !== index);
        recalcTotals(newItems);
    };

    const handleSave = async () => {
        if (!user || !currentInvoice.customerId) {
            alert("Please select a customer/supplier.");
            return;
        }
        
        try {
            const customer = customers.find(c => c.id === currentInvoice.customerId);
            const invoiceData = {
                ...currentInvoice,
                customerName: customer?.name || 'Unknown',
                customerAddress: customer?.address,
                customerVatNumber: customer?.vatNumber,
            } as Invoice;

            if (currentInvoice.id) {
                await updateInvoice(user.id, invoiceData);
                setInvoices(prev => prev.map(inv => inv.id === invoiceData.id ? invoiceData : inv));
            } else {
                // Remove placeholder number to let API generate it
                const { number, ...newInvoicePayload } = invoiceData;
                const newInv = await addInvoice(user.id, newInvoicePayload, currentInvoice.type);
                setInvoices(prev => [newInv, ...prev]);
            }
            setIsEditing(false);
        } catch (e: any) {
            if (e.code === 'permission-denied') {
                alert("Permission denied. You do not have access to save documents.");
            } else {
                alert("Failed to save document: " + e.message);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !window.confirm("Delete this document?")) return;
        try {
            await deleteInvoice(user.id, id);
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } catch(e: any) {
            if (e.code === 'permission-denied') {
                alert("Permission denied. You cannot delete this document.");
            } else {
                alert("Failed to delete.");
            }
        }
    };

    const handleCustomerSelect = (custId: string) => {
        const customer = customers.find(c => c.id === custId);
        setCurrentInvoice(prev => ({
            ...prev,
            customerId: custId,
            customerName: customer?.name || '',
            customerAddress: customer?.address,
            customerVatNumber: customer?.vatNumber
        }));
    };

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {currentInvoice.id ? `Edit ${currentInvoice.type}` : `New ${currentInvoice.type}`}
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors font-medium shadow-sm">Save Document</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {currentInvoice.type === 'Purchase Order' ? 'Supplier' : 'Customer'}
                            </label>
                            <select 
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                value={currentInvoice.customerId || ''}
                                onChange={e => handleCustomerSelect(e.target.value)}
                            >
                                <option value="">Select...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Number</label>
                            <input 
                                disabled // Auto-generated
                                className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                                value={currentInvoice.number}
                            />
                            <p className="text-xs text-slate-400 mt-1">Generated automatically on save.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Date</label>
                            <input type="date" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={currentInvoice.date} onChange={e => setCurrentInvoice({...currentInvoice, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due / Delivery Date</label>
                            <input type="date" className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={currentInvoice.dueDate} onChange={e => setCurrentInvoice({...currentInvoice, dueDate: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={currentInvoice.status} onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value as any})}>
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Approved">Approved</option>
                                <option value="Paid">Paid</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Declined">Declined</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Type</label>
                            <select className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={currentInvoice.type} onChange={e => setCurrentInvoice({...currentInvoice, type: e.target.value as DocumentType})}>
                                <option value="Invoice">Tax Invoice</option>
                                <option value="Quote">Quote / Estimate</option>
                                <option value="Sales Order">Sales Order</option>
                                <option value="Delivery Note">Delivery Note</option>
                                <option value="Purchase Order">Purchase Order</option>
                            </select>
                        </div>
                    </div>
                </div>

                <table className="w-full text-sm text-left mb-6">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Product (Optional)</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 w-24">Qty</th>
                            <th className="px-4 py-3 w-32">Price (R)</th>
                            <th className="px-4 py-3 w-20 text-center">Tax</th>
                            <th className="px-4 py-3 w-32 text-right">Total</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {currentInvoice.items?.map((item, idx) => (
                            <tr key={idx}>
                                <td className="px-4 py-2 w-40">
                                    <select className="w-full bg-transparent outline-none text-slate-500 text-xs" onChange={e => handleProductSelect(idx, e.target.value)}>
                                        <option value="">Custom Item</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-2"><input className="w-full bg-transparent outline-none" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Item description" /></td>
                                <td className="px-4 py-2"><input type="number" className="w-full bg-transparent outline-none" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} /></td>
                                <td className="px-4 py-2"><input type="number" className="w-full bg-transparent outline-none" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value))} /></td>
                                <td className="px-4 py-2 text-center"><input type="checkbox" checked={item.isTaxable} onChange={e => handleItemChange(idx, 'isTaxable', e.target.checked)} /></td>
                                <td className="px-4 py-2 text-right font-mono">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                <td className="px-4 py-2 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <button onClick={handleAddItem} className="text-sm text-teal-600 font-medium hover:underline mb-6">+ Add Line Item</button>

                <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Subtotal</span>
                            <span>R {currentInvoice.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>VAT (15%)</span>
                            <span>R {currentInvoice.vatTotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white border-t pt-2 border-slate-200 dark:border-slate-700">
                            <span>Total</span>
                            <span>R {currentInvoice.total?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DocumentDuplicateIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                    Trade Documents
                </h1>
                <button onClick={handleCreateNew} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm font-medium transition-colors">
                    + Create New
                </button>
            </div>

            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
                {['All', 'Invoice', 'Quote', 'Sales Order', 'Delivery Note', 'Purchase Order'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type as DocumentType | 'All')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === type ? 'bg-teal-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {permissionError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">Access Restricted</h4>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                            You do not have permission to view invoices. Please ensure <code>firestore.rules</code> are deployed.
                        </p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
            ) : filteredDocuments.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                    <p className="text-slate-500 mb-4">No documents found.</p>
                    <button onClick={handleCreateNew} className="text-teal-600 font-medium hover:underline">Create your first one</button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase text-xs font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Number</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredDocuments.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-6 py-4"><span className="text-xs font-bold px-2 py-1 rounded border bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{doc.type}</span></td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{doc.number}</td>
                                    <td className="px-6 py-4">{doc.customerName}</td>
                                    <td className="px-6 py-4">{doc.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">R {doc.total.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => exportInvoiceAsPDF(doc, user, companySettings)} className="text-slate-400 hover:text-teal-600" title="PDF"><PdfIcon className="w-5 h-5" /></button>
                                        <button onClick={() => { setCurrentInvoice(doc); setIsEditing(true); }} className="text-slate-400 hover:text-blue-600" title="Edit"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-600" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicesView;
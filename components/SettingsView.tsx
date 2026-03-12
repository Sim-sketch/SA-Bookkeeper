import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { updateCompanySettings, getProducts, addProduct, updateProduct, deleteProduct } from '../services/apiService';
import { CompanySettings, Product } from '../types';

interface SettingsViewProps {
    companySettings?: CompanySettings | null;
    onUpdateSettings: (settings: CompanySettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ companySettings: initialSettings, onUpdateSettings }) => {
    const { user, updateUserProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'products'>('profile');
    
    // Profile State
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    
    // Company Settings State
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        companyName: '',
        vatNumber: '',
        registrationNumber: '',
        address: { street: '', city: '', zip: '', country: '' },
        bankingDetails: { bankName: '', accountNumber: '', sortCode: '', accountType: '', iban: '', routingNumber: '' },
        email: '',
        phone: '',
        logoUrl: '',
        invoiceCounter: 1000,
        invoicePrefix: 'INV-',
        quoteCounter: 1000,
        quotePrefix: 'QTE-',
        poCounter: 1000,
        poPrefix: 'PO-'
    });

    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [productForm, setProductForm] = useState<Partial<Product>>({ price: 0, unit: '' });
    const [editingProductId, setEditingProductId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(prev => (prev === '' && user.displayName ? user.displayName : prev));
            setPhotoURL(prev => (user.photoURL ? user.photoURL : prev));
            getProducts(user.id).then(setProducts).catch(err => console.error(err));
        }
    }, [user]);

    useEffect(() => {
        if (initialSettings) {
            setCompanySettings(prev => ({
                ...prev,
                ...initialSettings,
                address: initialSettings.address || { street: '', city: '', zip: '', country: '' },
                bankingDetails: initialSettings.bankingDetails || { bankName: '', accountNumber: '', sortCode: '', accountType: '' }
            }));
        }
    }, [initialSettings]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            await updateUserProfile({ displayName, photoURL: photoURL || null });
            setMessage('Profile updated successfully.');
        } catch (e: any) {
            setError(e.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            await updateCompanySettings(user.id, companySettings);
            onUpdateSettings(companySettings);
            setMessage('Company settings saved.');
        } catch (e: any) {
            setError(e.message || "Failed to save company settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !productForm.name) return;
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (editingProductId) {
                const updatedProduct: Product = {
                    id: editingProductId,
                    name: productForm.name,
                    description: productForm.description || '',
                    price: Number(productForm.price) || 0,
                    unit: productForm.unit || 'each',
                    imageUrl: productForm.imageUrl || null,
                    createdAt: productForm.createdAt
                };
                await updateProduct(user.id, updatedProduct);
                setProducts(prev => prev.map(p => p.id === editingProductId ? { ...updatedProduct, id: editingProductId } : p));
                setMessage("Product updated successfully.");
            } else {
                const added = await addProduct(user.id, {
                    name: productForm.name,
                    description: productForm.description || '',
                    price: Number(productForm.price) || 0,
                    unit: productForm.unit || 'each',
                    imageUrl: productForm.imageUrl || null
                });
                setProducts(prev => [...prev, added]);
                setMessage("Product added successfully.");
            }
            setProductForm({ price: 0, unit: '' });
            setEditingProductId(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProductClick = (product: Product) => {
        setProductForm(product);
        setEditingProductId(product.id || null);
        document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setProductForm({ price: 0, unit: '' });
        setEditingProductId(null);
        setError(null);
        setMessage(null);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!user || !confirm("Delete this product?")) return;
        try {
            await deleteProduct(user.id, id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (e: any) {
            setError("Failed to delete product.");
        }
    };

    const updateAddress = (field: string, value: string) => {
        setCompanySettings(prev => ({
            ...prev,
            address: { ...prev.address!, [field]: value }
        }));
    };

    const updateBanking = (field: string, value: string) => {
        setCompanySettings(prev => ({
            ...prev,
            bankingDetails: { ...prev.bankingDetails!, [field]: value }
        }));
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-300 mb-6">Settings</h2>

            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
                <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('profile')}
                >
                    User Profile
                </button>
                <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'company' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('company')}
                >
                    Company Details
                </button>
                <button 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'products' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('products')}
                >
                    Products & Services
                </button>
            </div>

            {message && <div className="p-3 mb-4 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm animate-fade-in">{message}</div>}
            {error && <div className="p-3 mb-4 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm animate-fade-in">{error}</div>}

            {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profile Photo URL</label>
                        <input type="text" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input type="email" value={user?.email || ''} disabled className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-500 cursor-not-allowed" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">{isLoading && <Spinner className="w-4 h-4" />} Save Profile</button>
                    </div>
                </form>
            )}

            {activeTab === 'company' && (
                <form onSubmit={handleSaveCompany} className="space-y-8 animate-fade-in">
                    <section>
                        <h3 className="text-md font-semibold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Logo URL</label>
                                <input type="text" value={companySettings.logoUrl || ''} onChange={e => setCompanySettings({...companySettings, logoUrl: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registered Company Name</label>
                                <input type="text" value={companySettings.companyName} onChange={e => setCompanySettings({...companySettings, companyName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Number</label>
                                <input type="text" value={companySettings.registrationNumber} onChange={e => setCompanySettings({...companySettings, registrationNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">VAT Number</label>
                                <input type="text" value={companySettings.vatNumber} onChange={e => setCompanySettings({...companySettings, vatNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-md font-semibold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Business Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                                <input type="text" value={companySettings.address?.street} onChange={e => updateAddress('street', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                                <input type="text" value={companySettings.address?.city} onChange={e => updateAddress('city', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                                <input type="text" value={companySettings.address?.zip} onChange={e => updateAddress('zip', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-md font-semibold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Banking Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                                <input type="text" value={companySettings.bankingDetails?.bankName} onChange={e => updateBanking('bankName', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                                <input type="text" value={companySettings.bankingDetails?.accountNumber} onChange={e => updateBanking('accountNumber', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 dark:text-white" />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">{isLoading && <Spinner className="w-4 h-4" />} Save Company Details</button>
                    </div>
                </form>
            )}

            {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700" id="product-form">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                {editingProductId ? 'Edit Product / Service' : 'Add New Product / Service'}
                            </h3>
                            {editingProductId && (
                                <button onClick={handleCancelEdit} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Name</label>
                                <input placeholder="Product Name" value={productForm.name || ''} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Price (R)</label>
                                <input placeholder="0.00" type="number" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm dark:text-white" required />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">Product Image URL</label>
                                <input placeholder="https://..." value={productForm.imageUrl || ''} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm dark:text-white" />
                            </div>
                            <div className="sm:col-span-2 flex justify-end gap-2">
                                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm disabled:opacity-50 flex items-center gap-2">
                                    {isLoading && <Spinner className="w-3 h-3" />}
                                    {editingProductId ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3 text-right">Price</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {products.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center">No products added yet.</td></tr>
                                ) : products.map((product) => (
                                    <tr key={product.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{product.name}</td>
                                        <td className="px-6 py-4 text-right font-mono">R {product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEditProductClick(product)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-3">Edit</button>
                                            <button onClick={() => handleDeleteProduct(product.id!)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
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

export default SettingsView;
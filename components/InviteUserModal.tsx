
import React, { useState } from 'react';
import { UserRole } from '../types';
import { XIcon } from './icons/XIcon';
import Spinner from './Spinner';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, role: UserRole, name: string) => Promise<void>;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onInvite }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('accountant');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await onInvite(email, role, name);
            setEmail('');
            setName('');
            setRole('accountant');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to invite user');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Invite Team Member</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input 
                            type="text"
                            required 
                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Sarah Smith"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input 
                            type="email"
                            required 
                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                        <select 
                            className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            value={role}
                            onChange={e => setRole(e.target.value as UserRole)}
                        >
                            <option value="accountant">Accountant (Full Access)</option>
                            <option value="admin">Admin (Manage Settings)</option>
                            <option value="viewer">Viewer (Read Only)</option>
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Accountants can view, edit, and categorize transactions.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 font-medium flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Spinner className="w-4 h-4 text-white" /> : 'Send Invitation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;


import React, { useState } from 'react';
import { TeamMember, UserRole } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import InviteUserModal from './InviteUserModal';

interface TeamViewProps {
    members: TeamMember[];
    onInvite: (email: string, role: UserRole, name: string) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}

const TeamView: React.FC<TeamViewProps> = ({ members, onInvite, onRemove }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);

    const handleRemove = async (id: string) => {
        if (confirm('Are you sure you want to remove this user? They will lose access immediately.')) {
            setIsRemoving(id);
            try {
                await onRemove(id);
            } finally {
                setIsRemoving(null);
            }
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'accountant': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    // Helper to capitalize role for display since we store it as lowercase
    const formatRole = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        Team Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Invite accountants and admins to collaborate on your books.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <ShieldCheckIcon className="w-5 h-5" />
                    Invite User
                </button>
            </div>

            <InviteUserModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onInvite={onInvite}
            />

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date Added</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <UsersIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="font-medium">No team members yet.</p>
                                            <p className="text-sm mt-1">Invite an accountant to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{member.name || 'Unknown Name'}</p>
                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                                {formatRole(member.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {member.status === 'Active' ? (
                                                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {new Date(member.dateInvited).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleRemove(member.id)}
                                                disabled={isRemoving === member.id}
                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                                                title="Remove User"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeamView;

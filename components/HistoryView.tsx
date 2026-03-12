import React, { useState } from 'react';
import { StoredFile } from '../types.ts';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { EditIcon } from './icons/EditIcon.tsx';
import { FileJsonIcon } from './icons/FileJsonIcon.tsx'; 
import { CheckIcon } from './icons/CheckIcon.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { updateFileNotes } from '../services/fileService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import UploadFileModal from './UploadFileModal.tsx';

interface HistoryViewProps {
    files: StoredFile[];
    onDeleteFile: (file: StoredFile) => void;
    onDeleteFiles?: (files: StoredFile[]) => void;
    onDeleteAll?: () => void;
    onLoadSelected?: (fileIds: string[]) => void;
    activeFileIds?: string[];
    onRefresh?: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ files, onDeleteFile, onDeleteFiles, onDeleteAll, onLoadSelected, activeFileIds = [], onRefresh }) => {
    const { user } = useAuth();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [notesBuffer, setNotesBuffer] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set(activeFileIds));
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleStartEdit = (file: StoredFile) => {
        setEditingId(file.id);
        setNotesBuffer(file.notes || '');
    };

    const handleSaveNotes = async (fileId: string) => {
        if (!user) return;
        try {
            await updateFileNotes(user.id, fileId, notesBuffer);
            if (onRefresh) onRefresh();
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update notes", error);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedFileIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedFileIds.size === files.length) {
            setSelectedFileIds(new Set());
        } else {
            setSelectedFileIds(new Set(files.map(f => f.id)));
        }
    };

    const handleDownload = (file: StoredFile) => {
        if (file.downloadURL) {
            window.open(file.downloadURL, '_blank');
        }
    };

    const handleLoadSelected = () => {
        if (onLoadSelected) {
            onLoadSelected(Array.from(selectedFileIds));
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-300">My Files</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your uploaded bank statements and documents.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 text-sm font-bold shadow-sm transition-colors"
                    >
                        + Add File
                    </button>

                    {selectedFileIds.size > 0 && (
                        <button 
                            onClick={handleLoadSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-teal-600 border border-teal-100 rounded-lg hover:bg-teal-50 text-sm font-medium shadow-sm transition-colors"
                        >
                            Apply Filter ({selectedFileIds.size})
                        </button>
                    )}

                    {selectedFileIds.size > 0 && onDeleteFiles && (
                        <button 
                            onClick={() => onDeleteFiles(files.filter(f => selectedFileIds.has(f.id)))}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Delete Selected
                        </button>
                    )}
                </div>
            </div>

            <UploadFileModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                onUploadSuccess={() => onRefresh && onRefresh()} 
            />

            {files.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileJsonIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Files Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                        Upload documents to start organizing your business records in the cloud.
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                        <input 
                            type="checkbox" 
                            id="select-all-history"
                            checked={selectedFileIds.size === files.length && files.length > 0} 
                            onChange={handleSelectAll}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="select-all-history" className="text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                            Select All Files ({files.length})
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {files.map((file) => (
                            <div 
                                key={file.id} 
                                className={`group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 overflow-hidden
                                    ${selectedFileIds.has(file.id) ? 'border-teal-500 ring-1 ring-teal-500 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedFileIds.has(file.id)} 
                                            onChange={() => toggleSelection(file.id)}
                                            className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm" title={file.name}>
                                                {file.name}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                                {file.type?.split('/')[1] || 'Unknown'} • {formatSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDownload(file)} className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors" title="Download">
                                            <DownloadIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDeleteFile(file)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-grow space-y-4">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Uploaded:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {new Date(file.uploadDate).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        {editingId === file.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={notesBuffer}
                                                    onChange={(e) => setNotesBuffer(e.target.value)}
                                                    className="w-full text-xs p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-teal-500"
                                                    rows={2}
                                                    placeholder="Add a note..."
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-700">Cancel</button>
                                                    <button onClick={() => handleSaveNotes(file.id)} className="text-[10px] px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-500 shadow-sm">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start gap-2 cursor-pointer group/note" onClick={() => handleStartEdit(file)}>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                                                    <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[9px] mr-1 not-italic tracking-tighter">Notes:</span>
                                                    {file.notes || 'Click to add notes...'}
                                                </p>
                                                <EditIcon className="w-3 h-3 text-slate-300 opacity-0 group-hover/note:opacity-100 shrink-0 transition-opacity" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HistoryView;
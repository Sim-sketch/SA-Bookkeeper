import React from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onDelete: () => void;
    onCategorize: () => void;
    onClear: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({ selectedCount, onDelete, onCategorize, onClear }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 rounded-lg">
            <div className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                <span>{selectedCount}</span> item(s) selected.
                <button onClick={onClear} className="ml-4 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">Clear selection</button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onCategorize} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-500 shadow-sm">
                    <EditIcon className="w-4 h-4" />
                    Categorize
                </button>
                <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-red-600 text-white hover:bg-red-500 shadow-sm">
                    <TrashIcon className="w-4 h-4" />
                    Delete
                </button>
            </div>
        </div>
    );
};

export default BulkActionsToolbar;
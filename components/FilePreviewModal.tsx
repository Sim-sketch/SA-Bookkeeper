
import React, { useEffect, useState } from 'react';
import { XIcon } from './icons/XIcon';
import { AnalysisIcon } from './icons/AnalysisIcon';
import { FileJsonIcon } from './icons/FileJsonIcon';
import { CheckIcon } from './icons/CheckIcon';

interface FilePreviewModalProps {
    isOpen: boolean;
    files: File[];
    onAnalyze: () => void;
    onCancel: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, files, onAnalyze, onCancel }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (files && files.length === 1 && isOpen) {
            const url = URL.createObjectURL(files[0]);
            setPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setPreviewUrl(null);
        }
        return undefined;
    }, [files, isOpen]);

    if (!isOpen || files.length === 0) return null;

    const isMultiple = files.length > 1;
    
    // Single File Logic
    const singleFile = files[0];
    const isPdf = !isMultiple && singleFile.type === 'application/pdf';
    const isImage = !isMultiple && singleFile.type.startsWith('image/');

    const formatSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            {isMultiple ? `Verify Documents (${files.length} Selected)` : 'Verify Document'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {isMultiple ? 'Review the list of files before batch processing.' : 'Ensure this is the correct bank statement before analyzing.'}
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow bg-slate-100 dark:bg-slate-950/50 relative overflow-hidden flex flex-col">
                    {isMultiple ? (
                        <div className="overflow-y-auto p-6 h-full">
                            <div className="grid grid-cols-1 gap-3">
                                {files.map((file, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                                                <FileJsonIcon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-green-500 dark:text-green-400">
                                            <CheckIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {isPdf && previewUrl && (
                                <iframe 
                                    src={`${previewUrl}#toolbar=0&view=FitH`} 
                                    className="w-full h-full"
                                    title="PDF Preview"
                                />
                            )}
                            
                            {isImage && previewUrl && (
                                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                                    <img 
                                        src={previewUrl} 
                                        alt="Statement Preview" 
                                        className="max-w-full max-h-full object-contain shadow-lg rounded-md" 
                                    />
                                </div>
                            )}

                            {!isPdf && !isImage && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                                    <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                        <FileJsonIcon className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{singleFile.name}</h3>
                                    <p className="text-sm mb-4">{formatSize(singleFile.size)}</p>
                                    <p className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full text-sm">
                                        Preview not available for this file type
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 rounded-b-xl">
                     {!isMultiple && (
                         <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                            <FileJsonIcon className="w-5 h-5 text-teal-500" />
                            <span className="font-medium truncate max-w-[200px] sm:max-w-md">{singleFile.name}</span>
                            <span className="opacity-50">|</span>
                            <span>{formatSize(singleFile.size)}</span>
                         </div>
                     )}
                     {isMultiple && (
                         <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                             Ready to process {files.length} files.
                         </div>
                     )}
                     <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-slate-500"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onAnalyze}
                            className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-500 shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        >
                            <AnalysisIcon className="w-5 h-5" />
                            {isMultiple ? `Analyze All (${files.length})` : 'Analyze with AI'}
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
}

export default FilePreviewModal;

import React, { useState, useRef } from 'react';
import { XIcon } from './icons/XIcon.tsx';
import { UploadIcon } from './icons/UploadIcon.tsx';
import Spinner from './Spinner.tsx';
import { uploadFileWithProgress } from '../services/fileService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface UploadFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            await uploadFileWithProgress(user.id, file, (p) => {
                setProgress(Math.round(p));
            });
            onUploadSuccess();
            handleClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to upload file. Please try again.");
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setUploading(false);
        setProgress(0);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Upload File</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800/30">
                        {error}
                    </div>
                )}

                <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6
                        ${file ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600'}
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        disabled={uploading}
                    />
                    <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-teal-500' : 'text-slate-400'}`} />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {file ? file.name : "Click to select a file"}
                    </p>
                    {file && <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                </div>

                {uploading && (
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                            <span>Uploading...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-teal-500 h-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={handleClose} 
                        disabled={uploading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                    >
                        {uploading ? <Spinner className="w-4 h-4 text-white" /> : "Start Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadFileModal;
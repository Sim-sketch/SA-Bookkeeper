import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect]);

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    return (
        <div className="flex items-center justify-center w-full">
            <label
                htmlFor="dropzone-file"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragging ? 'border-teal-400 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:bg-slate-700'}
                    ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400">
                        <span className="font-semibold text-teal-400">Upload a file</span> or connect to a database
                    </p>
                    <p className="text-xs text-slate-500">PDF Bank Statement or saved .json session file</p>
                </div>
                <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="application/pdf,application/json"
                    disabled={disabled}
                />
            </label>
        </div>
    );
};

export default FileUpload;
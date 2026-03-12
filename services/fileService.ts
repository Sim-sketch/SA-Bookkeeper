import { StoredFile } from "../types.ts";

export interface UploadProgressCallback {
    (progress: number): void;
}

const STORAGE_KEY = (userId: string) => `sa_bk_files_${userId}`;

export const uploadFileWithProgress = async (
    userId: string, 
    file: File, 
    onProgress: UploadProgressCallback
): Promise<StoredFile> => {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 20) {
        onProgress(i);
        await new Promise(r => setTimeout(r, 100));
    }

    const fileMetadata: StoredFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        uploadDate: new Date().toISOString(),
        size: file.size,
        type: file.type,
        transactionCount: 0,
        summary: 'Locally Stored',
        notes: ''
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY(userId)) || '[]');
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([fileMetadata, ...existing]));

    return fileMetadata;
};

export const uploadFile = async (
    userId: string, 
    file: File, 
    transactionCount: number, 
    bankName: string
): Promise<StoredFile> => {
    const fileMetadata: StoredFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        uploadDate: new Date().toISOString(),
        size: file.size,
        type: file.type,
        transactionCount: transactionCount,
        summary: bankName,
        notes: ''
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY(userId)) || '[]');
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify([fileMetadata, ...existing]));
    
    return fileMetadata;
};

export const getUserFiles = async (userId: string): Promise<StoredFile[]> => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(userId)) || '[]');
};

export const deleteFileRecord = async (userId: string, file: StoredFile): Promise<void> => {
    const existing = await getUserFiles(userId);
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(existing.filter(f => f.id !== file.id)));
};

export const updateFileNotes = async (userId: string, fileId: string, notes: string): Promise<void> => {
    const existing = await getUserFiles(userId);
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(existing.map(f => f.id === fileId ? { ...f, notes } : f)));
};
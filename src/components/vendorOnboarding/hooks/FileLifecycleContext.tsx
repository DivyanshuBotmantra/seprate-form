import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export interface DeletedFileInfo {
    fieldName: string;
    file_name: string;
    file_type: string;
    file_url: string;
}

interface FileLifecycleContextType {
    deletionBuffer: DeletedFileInfo[];
    newlyUploadedKeys: string[];
    isProcessing: boolean;
    setDeletionBuffer: React.Dispatch<React.SetStateAction<DeletedFileInfo[]>>;
    setNewlyUploadedKeys: React.Dispatch<React.SetStateAction<string[]>>;
    setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
    addNewlyUploadedKey: (key: string) => void;
    addDeletedFile: (file: DeletedFileInfo) => void;
    clearUploadedKeys: () => void;
    clearDeletionBuffer: () => void;
}

const FileLifecycleContext = createContext<FileLifecycleContextType | undefined>(undefined);

export const FileLifecycleProvider = ({ children }: { children: ReactNode }) => {
    const [deletionBuffer, setDeletionBuffer] = useState<DeletedFileInfo[]>([]);
    const [newlyUploadedKeys, setNewlyUploadedKeys] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const addNewlyUploadedKey = useCallback((key: string) => {
        setNewlyUploadedKeys(prev => {
            if (prev.includes(key)) return prev;
            return [...prev, key];
        });
    }, []);

    const addDeletedFile = useCallback((file: DeletedFileInfo) => {
        setDeletionBuffer(prev => [...prev, file]);
    }, []);

    const clearUploadedKeys = useCallback(() => setNewlyUploadedKeys([]), []);
    const clearDeletionBuffer = useCallback(() => setDeletionBuffer([]), []);

    return (
        <FileLifecycleContext.Provider value={{
            deletionBuffer,
            newlyUploadedKeys,
            isProcessing,
            setDeletionBuffer,
            setNewlyUploadedKeys,
            setIsProcessing,
            addNewlyUploadedKey,
            addDeletedFile,
            clearUploadedKeys,
            clearDeletionBuffer
        }}>
            {children}
        </FileLifecycleContext.Provider>
    );
};

export const useFileLifecycleContext = () => {
    const context = useContext(FileLifecycleContext);
    if (!context) {
        throw new Error("useFileLifecycleContext must be used within a FileLifecycleProvider");
    }
    return context;
};

import { createContext, useContext, type ReactNode } from 'react';
import type { LOVData } from '../utils/types';

interface LOVContextType {
    lovData: LOVData | null;
    isLoading: boolean;
}

const LOVContext = createContext<LOVContextType | undefined>(undefined);

export const LOVProvider = ({ children, lovData, isLoading }: { children: ReactNode; lovData: LOVData | null; isLoading: boolean }) => {
    return (
        <LOVContext.Provider value={{ lovData, isLoading }}>
            {children}
        </LOVContext.Provider>
    );
};

export const useLOVData = () => {
    const context = useContext(LOVContext);
    if (!context) {
        throw new Error('useLOVData must be used within an LOVProvider');
    }
    return context;
};

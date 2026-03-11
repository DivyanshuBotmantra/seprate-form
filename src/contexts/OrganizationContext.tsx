import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OrganizationContextType {
  isOrgSwitcherOpen: boolean;
  openOrgSwitcher: () => void;
  closeOrgSwitcher: () => void;
  toggleOrgSwitcher: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganizationSwitcher = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationSwitcher must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);

  const openOrgSwitcher = () => setIsOrgSwitcherOpen(true);
  const closeOrgSwitcher = () => setIsOrgSwitcherOpen(false);
  const toggleOrgSwitcher = () => setIsOrgSwitcherOpen(prev => !prev);

  const value: OrganizationContextType = {
    isOrgSwitcherOpen,
    openOrgSwitcher,
    closeOrgSwitcher,
    toggleOrgSwitcher,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}; 
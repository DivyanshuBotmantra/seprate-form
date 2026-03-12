// useOrgSelection.ts
import { useOrgStore } from "@/lib/stores/orgStore";
import { getOrgMapping, getOrgDetails, getOrgIcon } from "@/lib/org-mapping";

/**
 * Custom hook for accessing organization selection functionality
 * Provides easy access to selected org data and utilities
 */
export const useOrgSelection = () => {
    const { getSelectedOrgFromStorage, getOrgIconPath } = useOrgStore();

    const selectedOrgName = getSelectedOrgFromStorage();
    const orgIconPath = getOrgIconPath();
    const orgMapping = getOrgMapping();
    const orgDetails = selectedOrgName ? getOrgDetails(selectedOrgName) : null;

    return {
        // Selected organization data
        selectedOrgName,
        orgIconPath,
        orgDetails,
        orgMapping,

        // Utility functions
        getOrgIcon: (orgName?: string) => getOrgIcon(orgName || selectedOrgName || ""),
        getOrgDetails: (orgName?: string) => getOrgDetails(orgName || selectedOrgName || ""),
        hasOrgSelected: !!selectedOrgName,

        // Organization mapping utilities
        getAllOrgMappings: () => orgMapping,
        getOrgEncryptedKey: (orgName?: string) => {
            const targetOrgName = orgName || selectedOrgName;
            return targetOrgName ? getOrgDetails(targetOrgName)?.encryptedKey || null : null;
        }
    };
};

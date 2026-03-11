import { useEffect, useCallback, useState } from "react";
export function getOrgNameFromSession() {
    try {
        const selectedOrg = JSON.parse(
            sessionStorage.getItem("SelectedOrg") || "{}"
        );

        if (selectedOrg?.org_name) {
            return selectedOrg.org_name;
        }

        const userDetails = JSON.parse(
            sessionStorage.getItem("userDetail") || "{}"
        );

        if (
            Array.isArray(userDetails?.org_name) &&
            userDetails.org_name.length > 0
        ) {
            return userDetails.org_name[0]; // fallback only
        }

        return "";
    } catch {
        return "";
    }
}


export function useOrgData(fetchFn: (orgName: string) => void) {
    const [orgName, setOrgName] = useState(getOrgNameFromSession());

    // Whenever org changes in sessionStorage, update state
    const refreshOrg = useCallback(() => {
        const newOrg = getOrgNameFromSession();
        setOrgName(newOrg);
        fetchFn(newOrg);
    }, [fetchFn]);

    // Initial fetch
    useEffect(() => {
        fetchFn(orgName);
    }, [orgName, fetchFn]);

    // Listen for org change event
    useEffect(() => {
        window.addEventListener("organizationChanged", refreshOrg);
        return () => window.removeEventListener("organizationChanged", refreshOrg);
    }, [refreshOrg]);

    return orgName;
}

/**
 * Custom hook for handling organization changes in vendor form
 * Manages organization switching and data reloading
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ORG_CONFIG } from "@/config/vendor-form-config";
import type { VendorFormData } from "@/components/vendor";

interface UseVendorOrganizationSyncProps {
    editMode: boolean;
    viewMode: boolean;
    transId: string;
    reloadDataForOrg: (
        orgName: string,
        transId: string
    ) => Promise<Partial<VendorFormData> | null>;
    onDataReloaded: (data: Partial<VendorFormData>) => void;
}

export const useVendorOrganizationSync = ({
    editMode,
    viewMode,
    transId,
    reloadDataForOrg,
    onDataReloaded,
}: UseVendorOrganizationSyncProps) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleOrganizationChange = async (event: CustomEvent) => {
            console.log("🔄 Organization changed in vendor form, updating context");

            const newOrgName = event.detail?.orgName;
            if (!newOrgName) {
                console.warn("⚠️ No organization name in event detail");
                return;
            }

            // Update URL parameters to reflect the new organization
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("orgName", newOrgName);

            // Update browser URL without triggering navigation
            window.history.replaceState({}, "", currentUrl.toString());

            // Check if vendor form is available in the new organization
            const isVendorFormAvailable =
                ORG_CONFIG.VENDOR_ONBOARDING_ORGS.includes(newOrgName);

            if (!isVendorFormAvailable) {
                console.log(
                    "❌ Vendor Onboarding not available in new organization, redirecting to home"
                );
                toast.info(
                    `Vendor Onboarding is only available for ${ORG_CONFIG.VENDOR_ONBOARDING_ORGS.join(", ")} organization${ORG_CONFIG.VENDOR_ONBOARDING_ORGS.length > 1 ? "s" : ""}. Redirecting to home.`
                );
                navigate("/");
                return;
            }

            // Show success notification
            toast.success(
                `Switched to organization "${newOrgName}". Form context updated.`
            );

            // If in edit or view mode, reload the data for the new organization
            if ((editMode || viewMode) && transId) {
                const reloadedData = await reloadDataForOrg(newOrgName, transId);
                if (reloadedData) {
                    onDataReloaded(reloadedData);
                }
            }
        };

        // Listen for custom organization change event
        window.addEventListener(
            "organizationChanged",
            handleOrganizationChange as unknown as EventListener
        );

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener(
                "organizationChanged",
                handleOrganizationChange as unknown as EventListener
            );
        };
    }, [editMode, viewMode, transId, navigate, reloadDataForOrg, onDataReloaded]);
};

import { useState, useCallback } from "react";
import { getFormDetails } from "@/services/form";
import { getOrgFormDetails } from "@/services/form-master";
import { toast } from "sonner";

export interface FormDetailsResponse {
    org_name: string;
    form_name: string;
    form_template: Record<string, unknown>;
    storage_type: string;
    credentials: Record<string, unknown>;
    mail_server: string;
    mail_credentials: Record<string, unknown>;
    form_status: string;
    form_description: string;
}

export const useFormData = () => {
    const [formDetails, setFormDetails] = useState<FormDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFormSelection, setShowFormSelection] = useState(false);

    const getOrgNameFromSession = useCallback(() => {
        try {
            const userDetails = JSON.parse(sessionStorage.getItem("userDetail") || "{}");
            const selectedOrg = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}");

            const userRole = userDetails?.role || "";
            let orgName = "";

            if (userRole === "USER") {
                if (userDetails?.org_name) {
                    // Handle both array and string formats for org_name
                    orgName = Array.isArray(userDetails.org_name)
                        ? userDetails.org_name[0]
                        : userDetails.org_name;
                }
            } else if (userRole === "ADMIN" || userRole === "SUPER ADMIN") {
                if (selectedOrg?.org_name) {
                    orgName = selectedOrg.org_name;
                }
            }

            return orgName;
        } catch (error) {
            console.error("Error getting org name from session:", error);
            return "";
        }
    }, []);

    const fetchAvailableForms = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const orgName = getOrgNameFromSession();

            if (!orgName) {
                setError("Organization not found. Please select an organization.");
                setLoading(false);
                return;
            }

            const userId = JSON.parse(sessionStorage.getItem("userDetail") || "{}")?.user_id || "";

            const payload = {
                user_id: userId,
                org_name: orgName,
            };

            const { data, error: apiError } = await getOrgFormDetails(payload);

            if (apiError) {
                console.error("API Error:", apiError);
                setError(apiError);
                toast.error(apiError);
            } else if (data && data.length > 0) {
                setShowFormSelection(true);
                toast.success("Available forms loaded successfully");
            } else {
                setError("No forms available for this organization");
                toast.error("No forms available for this organization");
            }
        } catch (err) {
            console.error("Error fetching available forms:", err);
            const errorMessage = "Failed to fetch available forms";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [getOrgNameFromSession]);

    const fetchFormDetails = useCallback(async (formName: string, orgName?: string) => {
        if (!formName) {
            await fetchAvailableForms();
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const orgNameFromSession = orgName || getOrgNameFromSession();

            if (!orgNameFromSession) {
                setError("Organization not found. Please select an organization.");
                setLoading(false);
                return;
            }

            const payload = {
                org_name: orgNameFromSession,
                form_name: formName,
                form_template: "",
                storage_type: "",
                credentials: "",
                mail_server: "",
                mail_credentials: "",
                form_status: "",
                form_description: "",
            };

            const { data, error: apiError } = await getFormDetails(payload);

            if (apiError) {
                console.error("API Error:", apiError);
                setError(apiError);
                toast.error(apiError);
            } else if (data && data.length > 0) {
                setFormDetails(data[0] as unknown as FormDetailsResponse);
                // toast.success("Form details loaded successfully");
            } else {
                setError("No form found with the given name");
                toast.error("No form found with the given name");
            }
        } catch (err) {
            console.error("Error fetching form details:", err);
            const errorMessage = "Failed to fetch form details";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [getOrgNameFromSession, fetchAvailableForms]);

    return {
        formDetails,
        loading,
        error,
        showFormSelection,
        fetchFormDetails,
        setError
    };
};

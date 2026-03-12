import { useFileUpload } from "./useFileUpload";
import { getSessionData } from "@/lib/session-utils";
import { toast } from "sonner";

/**
 * Hook for uploading files immediately when they are selected
 * This can be used in file input components to upload files as soon as they're chosen
 */
export const useFileUploadOnSelect = () => {
    const { uploadFile, uploading } = useFileUpload();

    const handleFileSelect = async (
        file: File,
        fieldName: string,
        orgName?: string,
        formName?: string
    ) => {
        try {
            // Get org_name and form_name from session if not provided
            let finalOrgName = orgName;
            let finalFormName = formName;

            if (!finalOrgName || !finalFormName) {
                const sessionData = getSessionData();
                finalOrgName = finalOrgName || sessionData.orgName;
                finalFormName = finalFormName || "default_form"; // You might want to get this from context
            }

            if (!finalOrgName || !finalFormName) {
                toast.error("Organization or form name not found");
                return null;
            }

            const result = await uploadFile(file, fieldName, finalOrgName, finalFormName);
            return result;
        } catch (error) {
            console.error("Error in handleFileSelect:", error);
            return null;
        }
    };

    return {
        handleFileSelect,
        uploading
    };
};

import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { uploadFileApi, deleteFileApi, getFormData } from "@/services/vendor-onboarding/form-data";
import { FORMDATA_CONFIG } from "../form/config";
import type { VendorFormValues } from "../form/schema";
import { useFileLifecycleContext } from "./FileLifecycleContext";
import type { DeletedFileInfo } from "./FileLifecycleContext";

export type { DeletedFileInfo };

export const useFileLifecycle = (externalMethods?: UseFormReturn<VendorFormValues>) => {
    const contextMethods = useFormContext<VendorFormValues>();
    const methods = externalMethods || contextMethods;
    
    // Shared state from context
    const { 
        deletionBuffer, 
        newlyUploadedKeys, 
        isProcessing, 
        setIsProcessing,
        addNewlyUploadedKey,
        addDeletedFile,
        clearUploadedKeys,
        clearDeletionBuffer 
    } = useFileLifecycleContext();

    if (!methods) {
        return {
            uploadSingleFile: async () => {},
            markForDeletion: () => {},
            processPhysicalDeletions: async () => {},
            refreshPermanentUrls: async () => {},
            isProcessing: false,
            setIsProcessing: () => {},
            newlyUploadedKeys: [],
            clearUploadedKeys: () => {}
        };
    }

    const { setValue, getValues } = methods;

    /**
     * Converts a File object to base64
     */
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    /**
     * Uploads a single file and updates form state
     */
    const uploadSingleFile = async (
        file: File, 
        attachmentName: string, 
        orgName: string = FORMDATA_CONFIG.ORG_NAME,
        formName: string = FORMDATA_CONFIG.FORM_NAME
    ) => {
        // Enforce 2MB limit
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_SIZE) {
            toast.error(`File "${file.name}" exceeds the 2MB limit.`);
            throw new Error("File too large");
        }

        try {
            const base64 = await fileToBase64(file);
            const { data, error } = await uploadFileApi({
                org_name: orgName,
                form_name: formName,
                file_name: file.name,
                file_type: file.type,
                file_base64: base64
            });

            if (error) throw new Error(error);

            const fileInfo = data?.response_body;
            if (fileInfo) {
                setValue(`attachments.${attachmentName as any}` as any, {
                    file_name: fileInfo.file_name,
                    file_type: fileInfo.file_type,
                    file_url: fileInfo.file_url,
                }, { shouldValidate: true });

                // Update shared state
                addNewlyUploadedKey(attachmentName);

                return fileInfo;
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error(`Failed to upload ${file.name}`);
            throw err;
        }
    };

    /**
     * Adds a file to the deletion buffer and removes from form state
     */
    const markForDeletion = (attachmentName: string) => {
        const currentFile = getValues(`attachments.${attachmentName as any}` as any);
        if (currentFile && currentFile.file_url) {
            addDeletedFile({
                fieldName: attachmentName,
                ...currentFile
            });
            console.log(`🗑️ Added to deletion buffer: ${attachmentName}`);
        }
        setValue(`attachments.${attachmentName as any}` as any, null, { shouldValidate: true });
    };

    /**
     * Physically deletes buffered files from storage
     */
    const processPhysicalDeletions = async (transId: string, orgName: string = FORMDATA_CONFIG.ORG_NAME) => {
        if (deletionBuffer.length === 0) return;

        console.log(`Starting storage purge for ${deletionBuffer.length} files...`);
        for (const file of deletionBuffer) {
            try {
                await deleteFileApi({
                    org_name: orgName,
                    form_name: FORMDATA_CONFIG.FORM_NAME,
                    file_name: file.file_name,
                    file_type: file.file_type,
                    file_url: file.file_url,
                    transaction_id: transId
                });
                console.log(`✅ Deleted from storage: ${file.file_name}`);
            } catch (err) {
                console.warn(`⚠️ Failed to purge ${file.file_name}:`, err);
            }
        }
        clearDeletionBuffer();
    };

    /**
     * Re-fetches data from server to replace temporary SAS URLs with permanent URLs
     */
    const refreshPermanentUrls = useCallback(async (transId: string) => {
        console.log("🔄 Syncing permanent URLs...");
        const { data } = await getFormData({
            org_name: FORMDATA_CONFIG.ORG_NAME,
            form_name: FORMDATA_CONFIG.FORM_NAME,
            search_params: { trans_id: transId }
        });

        if (data?.response_body?.[0]?.form_data?.attachments) {
            const serverAttachments = data.response_body[0].form_data.attachments;
            // Iterate and update local state with stable URLs
            Object.keys(serverAttachments).forEach(key => {
                if (serverAttachments[key]?.file_url) {
                    setValue(`attachments.${key as any}` as any, serverAttachments[key]);
                }
            });
            console.log("✅ State synced with stable URLs");
        }
    }, [setValue]);

    return {
        uploadSingleFile,
        markForDeletion,
        processPhysicalDeletions,
        refreshPermanentUrls,
        isProcessing,
        setIsProcessing,
        newlyUploadedKeys,
        clearUploadedKeys
    };
};

import { useState } from "react";
import { uploadFileApi, type UploadFilePayload, type UploadFileResponse } from "@/services/Upload-download";
// import { getSessionData } from "@/lib/session-utils"; // Not used in this hook
import { toast } from "sonner";

export interface UploadedFile {
    fieldName: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    isUploaded: boolean;
    isUploading: boolean;
    error?: string;
}

export const useFileUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});

    const uploadFile = async (
        file: File,
        fieldName: string,
        orgName: string,
        formName: string
    ): Promise<UploadedFile | null> => {
        // Set uploading state for this specific file
        setUploadedFiles(prev => ({
            ...prev,
            [fieldName]: {
                fieldName,
                fileName: file.name,
                fileType: file.type,
                fileUrl: '',
                isUploaded: false,
                isUploading: true,
                error: undefined
            }
        }));

        try {
            setUploading(true);

            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Prepare upload payload
            const uploadPayload: UploadFilePayload = {
                org_name: orgName,
                form_name: formName,
                file_name: file.name,
                file_type: file.type,
                file_base64: base64
            };

            // Call upload API
            console.log('Uploading file with payload:', uploadPayload);
            console.log('Upload API endpoint:', import.meta.env.VITE_UPLOAD_FILE_API_ENDPOINT);
            
            const response: UploadFileResponse = await uploadFileApi(uploadPayload);
            console.log('Upload API response:', response);
            console.log('Status code type:', typeof response.status_code, 'Value:', response.status_code);
            
            // Check if response has the expected structure
            if (!response.response_body || !response.response_body.file_url) {
                console.error('Upload API response missing file_url:', response);
                throw new Error('Upload API response missing file_url');
            }

            if ((response.status_code === 200 || response.status_code === "200") && response.response_body) {
                const uploadedFile: UploadedFile = {
                    fieldName,
                    fileName: response.response_body.file_name,
                    fileType: response.response_body.file_type,
                    fileUrl: response.response_body.file_url,
                    isUploaded: true,
                    isUploading: false,
                    error: undefined
                };

                // Update uploaded files state
                setUploadedFiles(prev => ({
                    ...prev,
                    [fieldName]: uploadedFile
                }));
                
                console.log(`File "${file.name}" uploaded successfully with URL: ${response.response_body.file_url}`);
                toast.success(`File "${file.name}" uploaded successfully!`);
                return uploadedFile;
            } else {
                console.error('Upload API failed:', response);
                const errorMsg = response.error_message || `Upload failed with status: ${response.status_code}`;
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            
            // Update state with error
            setUploadedFiles(prev => ({
                ...prev,
                [fieldName]: {
                    fieldName,
                    fileName: file.name,
                    fileType: file.type,
                    fileUrl: '',
                    isUploaded: false,
                    isUploading: false,
                    error: errorMessage
                }
            }));
            
            toast.error(`Failed to upload file "${file.name}": ${errorMessage}`);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const uploadMultipleFiles = async (
        files: Record<string, File>,
        orgName: string,
        formName: string
    ): Promise<Record<string, UploadedFile>> => {
        const results: Record<string, UploadedFile> = {};
        
        setUploading(true);

        try {
            const uploadPromises = Object.entries(files).map(async ([fieldName, file]) => {
                const result = await uploadFile(file, fieldName, orgName, formName);
                if (result) {
                    results[fieldName] = result;
                }
                return result;
            });

            await Promise.all(uploadPromises);
            
            if (Object.keys(results).length > 0) {
                toast.success(`Successfully uploaded ${Object.keys(results).length} file(s)!`);
            }
        } catch (error) {
            console.error("Error uploading multiple files:", error);
            toast.error("Failed to upload some files");
        } finally {
            setUploading(false);
        }

        return results;
    };

    const removeFile = (fieldName: string) => {
        setUploadedFiles(prev => {
            const newState = { ...prev };
            delete newState[fieldName];
            return newState;
        });
    };

    const clearUploadedFiles = () => {
        setUploadedFiles({});
    };

    const getUploadedFile = (fieldName: string): UploadedFile | null => {
        return uploadedFiles[fieldName] || null;
    };

    const getSuccessfullyUploadedFiles = (): Record<string, UploadedFile> => {
        const successful: Record<string, UploadedFile> = {};
        Object.entries(uploadedFiles).forEach(([fieldName, file]) => {
            if (file.isUploaded && file.fileUrl) {
                successful[fieldName] = file;
            }
        });
        return successful;
    };

    return {
        uploading,
        uploadedFiles,
        uploadFile,
        uploadMultipleFiles,
        removeFile,
        clearUploadedFiles,
        getUploadedFile,
        getSuccessfullyUploadedFiles
    };
};

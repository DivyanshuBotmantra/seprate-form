import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import botExecutionService from "@/services/bot/bot-execution";
import { createFormExecutionLog } from "@/services/bot/form-execution";
import sendMailService from "@/services/Dashboard/send-mail";
import { directFileUpload } from "@/services/upload-files/direct-file-upload";
import { deleteFile } from "@/services/upload-files/delete-api";
import { getUserDetails } from "@/lib/auth";
import botConfigService from "@/services/botConfig";
import { downloadTemplate } from "@/services/download";

// Sub-components
import { TriggerHeader } from "@/components/bot-trigger/trigger-header";
import { FileUploadSection } from "@/components/bot-trigger/file-upload-section";
import { ExecutionFooter } from "@/components/bot-trigger/execution-footer";
import { LoadingOverlay } from "@/components/bot-trigger/loading-overlay";
import { ConfirmationDialog } from "@/components/bot-trigger/confirmation-dialog";

interface Template {
    id: number;
    name: string;
    link: string;
    filename: string;
    description: string;
}

interface UploadedFile {
    file_name: string;
    file_path: string;
    file_url: string;
    file_type: string;
}

export default function StaticTrigger() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // URL Parameters
    const bot_code = searchParams.get("bot_code") || "";
    const bot_name = searchParams.get("bot_name") || "";
    const bot_category = searchParams.get("bot_category") || "";
    const form_code = searchParams.get("form_code") || "STATIC_001";
    const form_name = searchParams.get("form_name") || searchParams.get("bot_name") || "Static Form";
    const email_name = searchParams.get("email_name") || "";
    const email_flag = searchParams.get("email_flag") === "true";
    // bot_trigger: true = call createBotExecution, false = call createFormExecutionLog
    const bot_trigger = searchParams.get("bot_trigger") !== "false"; // default true

    // State
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Templates
    useEffect(() => {
        const fetchBotTemplates = async () => {
            try {
                const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

                const payload = {
                    org_name: orgName,
                    bot_code: bot_code,
                    bot_name: bot_name,
                    bot_category: bot_category,
                    bot_status: "ACTIVE"
                };

                const response = await botConfigService.getBotConfig(payload);

                if (response.data?.status_code === 200 && response.data?.response_body?.length > 0) {
                    const botConfig = response.data.response_body[0];
                    const templateFiles = botConfig?.master_files?.template_files || [];

                    const mappedTemplates: Template[] = templateFiles.map((t: any, index: number) => ({
                        id: index + 1,
                        name: t.template_name || "Template",
                        link: t.template_path || "",
                        filename: t.template_name || "template.xlsx",
                        description: `Template for ${t.template_name || "automation"}`
                    }));

                    setTemplates(mappedTemplates);
                }
            } catch (error) {
                console.error("[Templates] Error fetching:", error);
            }
        };

        if (bot_code) {
            fetchBotTemplates();
        }
    }, [bot_code, bot_name, bot_category]);

    // Handlers
    const handleBackClick = () => {
        navigate(`/bot-dashboard?bot_code=${encodeURIComponent(bot_code)}&bot_name=${encodeURIComponent(bot_name)}&bot_category=${encodeURIComponent(bot_category)}`);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        console.log(`[Upload] Received batch of ${files.length} files`);
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "Default Org";
        setIsUploading(true);

        let successCount = 0;
        let failCount = 0;
        const newUploadedFiles: UploadedFile[] = [];

        // Sequential upload to avoid browser/network throttling and maintain order
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`[Upload] Processing ${i + 1}/${files.length}: ${file.name}`);

            // Validation
            const validTypes = ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx", ".xls"];
            const fileExtension = file.name.split(".").pop()?.toLowerCase();
            const isValidType = validTypes.includes(file.type) || fileExtension === "xlsx" || fileExtension === "xls";
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!isValidType) {
                console.warn(`[Upload] Invalid type for ${file.name}: ${file.type}`);
                toast.error(`Invalid file type: ${file.name}`, { description: `${file.name} must be an Excel file (.xlsx or .xls).` });
                failCount++;
                continue;
            }

            if (file.size > maxSize) {
                console.warn(`[Upload] File too large: ${file.name} (${file.size} bytes)`);
                toast.error(`File too large: ${file.name}`, { description: `${file.name} exceeds the 10MB limit. Please upload a smaller file.` });
                failCount++;
                continue;
            }

            try {
                const fileBase64 = await convertFileToBase64(file);
                const uploadPayload = {
                    org_name: orgName,
                    file_name: file.name,
                    file_type: fileExtension || "xlsx",
                    file_base64: fileBase64,
                    form_code: form_code,
                };

                const response = await directFileUpload(uploadPayload);
                console.log(`[Upload] API Response for ${file.name}:`, response);

                if (response.data?.status_code === 200 && response.data?.response_body) {
                    const { file_path, file_name, file_url } = response.data.response_body;
                    newUploadedFiles.push({
                        file_path,
                        file_name,
                        file_url,
                        file_type: fileExtension || "xlsx"
                    });
                    successCount++;
                    console.log(`[Upload] Successfully uploaded: ${file.name}`);
                } else {
                    const errorMessage = response.error || response.data?.status_description || "Unknown error";
                    console.error(`[Upload] Failed to upload ${file.name}:`, errorMessage);
                    toast.error(`Upload failed: ${file.name}`, { description: `${file.name} could not be uploaded. Please try again.` });
                    failCount++;
                }
            } catch (error) {
                console.error(`[Upload] Exception for ${file.name}:`, error);
                toast.error(`Error uploading ${file.name}`, { description: `${file.name} could not be uploaded. Please try again.` });
                failCount++;
            }
        }

        if (newUploadedFiles.length > 0) {
            setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
        }

        // Summary toast
        if (successCount > 0 && files.length > 1) {
            toast.success(`Upload Complete`, {
                description: `${successCount} of ${files.length} files uploaded successfully.`
            });
        } else if (successCount === 1 && files.length === 1) {
            toast.success(`File uploaded successfully`, {
                description: `Successfully uploaded ${files.length} file.`
            });
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveFile = async (index: number) => {
        const fileToRemove = uploadedFiles[index];
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "Default Org";

        console.log(`[Delete] Requesting deletion for: ${fileToRemove.file_name}`);

        // Optimistic UI update
        const previousFiles = [...uploadedFiles];
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

        try {
            const deletePayload = {
                org_name: orgName,
                form_code: form_code,
                file_name: fileToRemove.file_name,
                file_type: fileToRemove.file_type,
                file_url: fileToRemove.file_url,
                bot_code: null,
            };

            const response = await deleteFile(deletePayload);
            console.log(`[Delete] API Response for ${fileToRemove.file_name}:`, response);

            if (response.data?.status_code === 200) {
                console.log(`[Delete] Successfully deleted: ${fileToRemove.file_name}`);
                // Success - keep UI updated
            } else {
                const errorMsg = response.error || response.data?.status_description || "Unknown error";
                console.error(`[Delete] Failed to delete ${fileToRemove.file_name}:`, errorMsg);
                toast.error("File removal incomplete", {
                    description: `${fileToRemove.file_name} was removed from the list but could not be fully deleted. Please try again later.`
                });
                // Revert state if critical
                setUploadedFiles(previousFiles);
            }
        } catch (error) {
            console.error(`[Delete] Exception for ${fileToRemove.file_name}:`, error);
            toast.error(`Error deleting file`);
            setUploadedFiles(previousFiles);
        }
    };

    const handleRemoveAllFiles = async () => {
        if (uploadedFiles.length === 0) return;

        console.log(`[Delete] Batch deleting ${uploadedFiles.length} files`);
        const filesToClear = [...uploadedFiles];
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "Default Org";

        setUploadedFiles([]); // Optimistic clear

        try {
            const deletePromises = filesToClear.map(file => {
                const deletePayload = {
                    org_name: orgName,
                    form_code: form_code,
                    file_name: file.file_name,
                    file_type: file.file_type,
                    file_url: file.file_url,
                    bot_code: null,
                };
                return deleteFile(deletePayload);
            });

            const results = await Promise.all(deletePromises);
            const successfulDeletes = results.filter(r => r.data?.status_code === 200).length;

            console.log(`[Delete] Batch complete. Success: ${successfulDeletes}/${filesToClear.length}`);

            if (successfulDeletes === filesToClear.length) {
                toast.success("Ready for fresh upload", { description: "All files cleared successfully." });
            } else if (successfulDeletes > 0) {
                toast.info("Some files may remain", {
                    description: `${successfulDeletes} files were cleared successfully.`
                });
            }
        } catch (error) {
            console.error("[Delete] Batch exception:", error);
            toast.error("Cleanup incomplete", {
                description: "Network issue while clearing files. Some files may still exist."
            });
        }
    };


    const confirmSubmit = async () => {
        setShowConfirmDialog(false);
        setIsSubmitting(true);
        setLoadingMessage("Initiating independent executions...");

        try {
            const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "Default Org";
            const currentUser = getUserDetails();
            const createdBy = currentUser?.user_id || "";
            let successCount = 0;

            for (let i = 0; i < uploadedFiles.length; i++) {
                const file = uploadedFiles[i];
                setLoadingMessage(`Creating execution ${i + 1} of ${uploadedFiles.length}: ${file.file_name}...`);

                // ─── BRANCH: bot_trigger false → Form Execution Log flow ───
                if (!bot_trigger) {
                    const formPayload = {
                        org_name: orgName,
                        form_code: form_code,
                        form_status: "INITIATED",
                        input_data: {
                            input_files: [
                                {
                                    file_category: "Input Files",
                                    file_display_name: form_name,
                                    files: [{
                                        file_name: file.file_name,
                                        file_path: file.file_path,
                                        file_url: file.file_url,
                                    }],
                                },
                            ],
                        },
                        created_by: createdBy,
                    };

                    const formRes = await createFormExecutionLog(formPayload);
                    console.log(`[FormExecution] Response for ${file.file_name}:`, formRes);

                    if (formRes.data?.status_code === 200 || (!formRes.error && formRes.data)) {
                        successCount++;
                    } else {
                        const errorMsg = formRes.error || "Unknown error";
                        console.error(`[FormExecution] Failed for ${file.file_name}:`, errorMsg);
                        toast.error("Form execution failed", {
                            description: `${file.file_name} could not be processed. Please try again.`
                        });
                    }
                    continue; // skip bot execution for this file
                }

                // ─── BRANCH: bot_trigger true → Bot Execution flow (existing) ───
                const botExecutionPayload = {
                    org_name: orgName,
                    bot_code: bot_code,
                    bot_status: "INITIATED",
                    list_param: {
                        "File Name": file.file_name,
                    },
                    input_data: {
                        input_files: [
                            {
                                file_category: "Input Files",
                                file_display_name: bot_name || form_name || "Input File",
                                files: [{
                                    file_name: file.file_name,
                                    file_path: file.file_path,
                                    file_url: file.file_url
                                }]
                            }
                        ]
                    }
                };

                const executionResponse = await botExecutionService.createBotExecution(botExecutionPayload);
                console.log(`[Execution] Response for ${file.file_name}:`, executionResponse);

                if (executionResponse.data?.status_code === 200 || (!executionResponse.error && executionResponse.data)) {
                    successCount++;
                    const executionId = executionResponse.data?.response_body?.bot_execution_id;
                    console.log(`[Execution] Successfully created: ID ${executionId}`);

                    // If email_flag is true, send email for this specific execution
                    if (email_flag && executionId) {
                        try {
                            const emailPayload = {
                                org_name: orgName,
                                email_name: email_name,
                                input_params: {
                                    form_execution_id: executionId,
                                },
                                attachment_params: [
                                    {
                                        file_name: file.file_name,
                                        file_path: file.file_path,
                                    }
                                ],
                            };
                            const emailRes = await sendMailService.sendMail(emailPayload);
                            console.log(`[Email] Sent for ${file.file_name}:`, emailRes);
                        } catch (emailError) {
                            console.error(`[Email] Failed for ${file.file_name}:`, emailError);
                        }
                    }
                } else {
                    const errorMsg = executionResponse.error || executionResponse.data?.status_description || "Unknown error";
                    console.error(`[Execution] Failed for ${file.file_name}:`, errorMsg);
                    toast.error("Execution failed", {
                        description: `${file.file_name} could not be processed. Please try again.`
                    });
                }
            }

            if (successCount > 0)
                toast.success("Execution started", {
                    description: `${successCount} file${successCount > 1 ? "s" : ""} submitted successfully.`
                });

            setUploadedFiles([]);
            setTimeout(() => {
                setLoadingMessage("");
                // Navigate based on trigger type
                if (!bot_trigger) {
                    navigate(`/form-log?form_code=${encodeURIComponent(form_code)}&form_name=${encodeURIComponent(form_name)}`);
                } else {
                    navigate(`/bot?bot_name=${encodeURIComponent(bot_name)}&bot_code=${encodeURIComponent(bot_code)}&bot_category=${encodeURIComponent(bot_category)}`);
                }
            }, 1500);
        } catch (error) {
            setIsSubmitting(false);
            setLoadingMessage("");
        }
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
        });
    };

    const handleTemplateToggle = (templateId: number) => {
        setSelectedTemplates(prev => prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]);
    };

    const handleSelectAllTemplates = () => {
        setSelectedTemplates(selectedTemplates.length === templates.length ? [] : templates.map(t => t.id));
    };

    const handleDownloadSelected = async () => {
        if (selectedTemplates.length === 0) return toast.error("No templates selected");

        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

        for (const templateId of selectedTemplates) {
            const template = templates.find(t => t.id === templateId);
            if (!template) continue;

            const payload = {
                org_name: orgName,
                bot_code: bot_code,
                template_name: template.filename
            };

            try {
                const response = await downloadTemplate(payload);
                // response_body is an array; take the first item
                const responseItem = Array.isArray(response.data?.response_body)
                    ? response.data.response_body[0]
                    : response.data?.response_body;

                const base64Data = responseItem?.file_base64;
                const fileName = responseItem?.file_name || template.filename || "template.xlsx";

                if (base64Data) {
                    // Derive MIME type from file extension
                    const ext = fileName.split(".").pop()?.toLowerCase();
                    const mimeTypes: Record<string, string> = {
                        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        xls: "application/vnd.ms-excel",
                        pdf: "application/pdf",
                        csv: "text/csv",
                    };
                    const mimeType = mimeTypes[ext || ""] || "application/octet-stream";

                    // Convert base64 to blob and download
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType });

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);

                    toast.success(`Downloading ${fileName}...`);
                } else {
                    toast.error(`Failed to download ${template.name}`, {
                        description: response.error || "Template data not available"
                    });
                }
            } catch (error) {
                console.error(`[Download] Error for ${template.name}:`, error);
                toast.error(`Error downloading ${template.name}`);
            }
        }

        setSelectedTemplates([]);
        setShowTemplateDropdown(false);
    };



    return (
        <div className="h-screen flex flex-col bg-sidebar rounded-2xl p-4 overflow-hidden">
            {/* Header with Back Button and Templates */}
            <TriggerHeader
                formName={form_name}
                onBack={handleBackClick}
                templates={templates}
                selectedTemplates={selectedTemplates}
                showTemplateDropdown={showTemplateDropdown}
                setShowTemplateDropdown={setShowTemplateDropdown}
                handleTemplateToggle={handleTemplateToggle}
                handleSelectAllTemplates={handleSelectAllTemplates}
                handleDownloadSelected={handleDownloadSelected}
                setSelectedTemplates={setSelectedTemplates}
            />

            {/* Main Content Area - Fixed Height */}
            <div className="flex-1 flex flex-col bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm mt-4 overflow-hidden">
                {/* Execution Trigger Header - Fixed at Top */}
                <div className="px-8 pt-6 pb-4 border-b border-border/30">
                    <h2 className="text-2xl font-bold text-foreground">Execution Trigger</h2>
                    <p className="text-sm text-muted-foreground mt-1">Submit execution for {form_name} by uploading files.</p>
                </div>

                {/* Scrollable Upload Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                        <FileUploadSection
                            uploadedFiles={uploadedFiles}
                            isUploading={isUploading}
                            isSubmitting={isSubmitting}
                            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                            handleFileChange={handleFileChange}
                            handleRemoveFile={handleRemoveFile}
                            handleRemoveAllFiles={handleRemoveAllFiles}
                        />
                    </div>
                </div>

                {/* Fixed Footer with Action Buttons */}
                <div className="px-8 py-4 border-t border-border/30 bg-card/60 backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={(e) => { e.preventDefault(); if (uploadedFiles.length > 0) setShowConfirmDialog(true); else toast.error("No files uploaded"); }}>
                            <ExecutionFooter
                                isUploading={isUploading}
                                isSubmitting={isSubmitting}
                                uploadedFilesCount={uploadedFiles.length}
                                handleRemoveAllFiles={handleRemoveAllFiles}
                            />
                        </form>
                    </div>
                </div>

                {/* Loading Overlay */}
                <LoadingOverlay isVisible={isSubmitting} message={loadingMessage} />
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={confirmSubmit}
                formName={form_name}
                filesCount={uploadedFiles.length}
            />
        </div>
    );
}
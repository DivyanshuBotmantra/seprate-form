import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, FileSpreadsheet, ArrowLeft } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import botExecutionService from "@/services/bot/bot-execution";
import { createFormExecutionLog } from "@/services/bot/form-execution";
import sendMailService from "@/services/Dashboard/send-mail";
import { directFileUpload } from "@/services/upload-files/direct-file-upload";
import { getUserDetails } from "@/lib/auth";
import { cn } from "@/lib/utils";
import OrbitLoader from "@/components/loader";

export default function BotTrigger() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Read URL parameters — bot_code and form_code are separate concerns
    const bot_code = searchParams.get("bot_code") || "";
    const bot_name = searchParams.get("bot_name") || searchParams.get("form_name") || "Form";
    const bot_category = searchParams.get("bot_category") || searchParams.get("form_category") || "";
    const form_code = searchParams.get("form_code") || bot_code; // form_code takes priority; fall back to bot_code for bot trigger flow
    const form_name = searchParams.get("form_name") || bot_name;
    const email_name = searchParams.get("email_name") || "";
    const email_flag = searchParams.get("email_flag") === "true";
    const file_trigger_flag = searchParams.get("file_trigger_flag") === "true";
    // bot_trigger: true = call createBotExecution, false = call createFormExecutionLog
    const bot_trigger = searchParams.get("bot_trigger") !== "false"; // default true

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>("");

    // No longer needed - bot info comes from URL parameters

    const handleBackClick = () => {
        // Navigate back to dashboard view
        navigate(
            `/bot-dashboard?bot_code=${encodeURIComponent(bot_code)}&bot_name=${encodeURIComponent(bot_name)}&bot_category=${encodeURIComponent(bot_category)}`
        );
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type - only Excel files
        const validTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".xlsx",

        ];

        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        const isValidType =
            validTypes.includes(file.type) ||
            fileExtension === "xlsx" ||
            fileExtension === "xls";

        if (!isValidType) {
            toast.error("Invalid file type", {
                description: "Please upload an Excel file (.xlsx or .xls)",
            });
            event.target.value = "";
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error("File too large", {
                description: "File size must be less than 10MB",
            });
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
        toast.success("File selected successfully");

        // Auto-focus the submit button so user can hit Enter
        setTimeout(() => {
            const submitBtn = document.getElementById("brandix-submit-btn");
            if (submitBtn) {
                submitBtn.focus();
            }
        }, 100);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleReset = (showToast: boolean = true) => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (showToast) {
            toast.info("Form reset");
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedFile) {
            toast.error("No file selected", {
                description: "Please select an Excel file to upload",
            });
            return;
        }

        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmDialog(false);
        setIsSubmitting(true);
        setLoadingMessage("Initiating execution...");

        try {
            if (!selectedFile) {
                toast.error("No file selected");
                return;
            }

            const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "Default Org";
            const currentUser = getUserDetails();
            const createdBy = currentUser?.user_id || "";

            // ─── BRANCH: bot_trigger false → Form Execution Log flow ───
            if (!bot_trigger) {
                setLoadingMessage("Creating form execution...");
                const fileBase64 = await convertFileToBase64(selectedFile);

                // Optional: upload file first if file_trigger_flag is set
                let uploadedFilePath = "";
                let uploadedFileUrl = "";
                if (file_trigger_flag) {
                    setLoadingMessage(`Uploading ${selectedFile.name}...`);
                    const uploadPayload = {
                        org_name: orgName,
                        file_name: selectedFile.name,
                        file_type: selectedFile.name.split(".").pop()?.toLowerCase() || "xlsx",
                        file_base64: fileBase64,
                        form_code: form_code,
                    };
                    const uploadResponse = await directFileUpload(uploadPayload);
                    if (uploadResponse.error) {
                        toast.error(`Failed to upload ${selectedFile.name}`, { description: uploadResponse.error });
                        throw new Error(uploadResponse.error);
                    }
                    uploadedFilePath = uploadResponse.data?.response_body?.file_path || "";
                    uploadedFileUrl = uploadResponse.data?.response_body?.file_url || "";
                    toast.success("File uploaded to server");
                }

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
                                    file_name: selectedFile.name,
                                    file_path: uploadedFilePath,
                                    file_url: uploadedFileUrl,
                                }],
                            },
                        ],
                    },
                    created_by: createdBy,
                };

                const formRes = await createFormExecutionLog(formPayload);
                if (formRes.error || !formRes.data) {
                    throw new Error(formRes.error || "Failed to create form execution");
                }

                setLoadingMessage("Process completed!");
                toast.success("Form execution created successfully");
                handleReset(false);
                setTimeout(() => {
                    setLoadingMessage("");
                    navigate(`/form-log?form_code=${encodeURIComponent(form_code)}&form_name=${encodeURIComponent(form_name)}`);
                }, 1000);
                return;
            }

            // ─── BRANCH: bot_trigger true → Bot Execution flow (existing) ───
            // Step 1: Create bot execution
            const botExecutionPayload = {
                org_name: orgName,
                bot_code: bot_code,
                bot_status: "INITIATED",
                list_param: {
                    ETA: ""
                },
            };

            const executionResponse = await botExecutionService.createBotExecution(
                botExecutionPayload
            );

            if (executionResponse.error || !executionResponse.data) {
                throw new Error(executionResponse.error || "Failed to create bot execution");
            }

            const botExecutionId = executionResponse.data?.response_body?.bot_execution_id;

            if (!botExecutionId) {
                throw new Error("Execution ID not received from server");
            }

            // Step 2: Convert to Base64
            setLoadingMessage("Processing file...");
            const fileBase64 = await convertFileToBase64(selectedFile);

            // Step 3: Direct Upload flow (Scenario: file_trigger_flag is true)
            if (file_trigger_flag) {
                setLoadingMessage(`Uploading ${selectedFile.name}...`);
                const uploadPayload = {
                    org_name: orgName,
                    file_name: selectedFile.name,
                    file_type: selectedFile.name.split(".").pop()?.toLowerCase() || "xlsx",
                    file_base64: fileBase64,
                    form_code: form_code,
                };

                const uploadResponse = await directFileUpload(uploadPayload);

                if (uploadResponse.error) {
                    toast.error(`Failed to upload ${selectedFile.name}`, {
                        description: uploadResponse.error
                    });
                    throw new Error(uploadResponse.error);
                } else {
                    toast.success("File uploaded to server");
                }
            }

            // Step 4: Email Flow
            if (email_flag) {
                setLoadingMessage("Sending email notification...");

                const emailPayload = {
                    org_name: orgName,
                    email_name: email_name,
                    input_params: {
                        bot_execution_id: botExecutionId,
                    },
                    attachment_params: [{
                        file_name: selectedFile.name,
                        input_file: fileBase64,
                    }],
                };

                const emailResponse = await sendMailService.sendMail(emailPayload);

                if (emailResponse.error || !emailResponse.data) {
                    toast.error("Email sending failed", {
                        description: emailResponse.error || "Unknown error occurred",
                    });
                } else {
                    toast.success("Email sent successfully");
                }
            }

            setLoadingMessage("Process completed!");
            handleReset(false);

            setTimeout(() => {
                setLoadingMessage("");
                navigate(
                    `/bot?bot_code=${encodeURIComponent(bot_code)}&bot_name=${encodeURIComponent(bot_name)}&bot_category=${encodeURIComponent(bot_category)}`
                );
            }, 1000);
        } catch (error: any) {
            setLoadingMessage("");
            toast.error("Execution failed", {
                description: error.message || "An error occurred",
            });
            console.error("Trigger error:", error);
        } finally {
            setTimeout(() => {
                setIsSubmitting(false);
            }, 1000);
        }
    };

    // Helper function to convert file to base64
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the data:*/*;base64, prefix
                const base64 = result.split(",")[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
        <div className="h-screen flex flex-col bg-sidebar rounded-2xl p-4 overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 gap-4">
                {/* ========== HEADER ========== */}
                <div className="relative z-30 bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        {/* Left: Back Button + Title */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackClick}
                                className="h-7 w-7 hover:bg-muted"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                                {form_name}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* ========== MAIN CONTAINER - Form ========== */}
                <div className="flex-1 bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm overflow-auto p-10 relative custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Title + Description */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Execution Trigger</h2>
                            <p className="text-sm text-muted-foreground">
                                Submit execution for {form_name} by uploading the required Excel worksheet.
                            </p>
                        </div>

                        {/* Upload Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* File Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-16 transition-all duration-500 flex flex-col items-center justify-center gap-4 text-center overflow-hidden",
                                    selectedFile
                                        ? "border-btn-primary/50 bg-btn-primary/5 shadow-inner"
                                        : "border-border/60 hover:border-btn-primary/50 hover:bg-muted/40 hover:shadow-xl hover:shadow-btn-primary/5"
                                )}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".xlsx,.xls"
                                />

                                {/* Animated Background Glow */}
                                <div className="absolute -inset-1 bg-linear-to-r from-btn-primary/0 via-btn-primary/5 to-btn-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-2xl pointer-events-none" />

                                {selectedFile ? (
                                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                                        <div className="relative">
                                            <div className="p-6 bg-btn-primary/10 rounded-2xl shadow-sm border border-btn-primary/20">
                                                <FileSpreadsheet className="size-12 text-btn-primary" />
                                            </div>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="destructive"
                                                className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg border-2 border-background p-1.5 hover:scale-110 active:scale-90 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFile();
                                                }}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-base text-foreground truncate max-w-md tracking-tight">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {formatFileSize(selectedFile.size)}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative p-5 bg-background/80 rounded-2xl border border-border/50 shadow-sm group-hover:border-btn-primary/30 group-hover:scale-110 transition-all duration-500">
                                            <Upload className="size-12 text-muted-foreground group-hover:text-btn-primary transition-colors duration-300" />
                                        </div>
                                        <div className="relative">
                                            <p className="font-bold text-lg text-foreground tracking-tight">
                                                Click or drop Excel file
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                                                Support files: .xlsx, .xls (Max 10MB)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer with Info + Buttons */}
                            <div className="flex items-center justify-between pt-6 border-t border-border/30">
                                <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                                    <div className="w-2 h-2 bg-btn-primary/60 rounded-full animate-pulse"></div>
                                    Ensure columns match the standard template
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleReset()}
                                        disabled={isSubmitting || !selectedFile}
                                        className="h-10 px-6 text-sm font-semibold rounded-xl hover:bg-muted border-border/50 transition-all"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        id="brandix-submit-btn"
                                        type="submit"
                                        disabled={isSubmitting || !selectedFile}
                                        className="h-10 px-10 bg-btn-primary hover:bg-btn-primary/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-btn-primary/25 hover:shadow-btn-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            "Run Execution"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Premium Loading Overlay */}
                    {isSubmitting && loadingMessage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-md z-50 rounded-2xl transition-all duration-500">
                            <div className="flex flex-col items-center gap-6 bg-card/90 backdrop-blur-xl p-12 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-border/50 scale-100 animate-in zoom-in-95 duration-300">
                                <OrbitLoader size={16} outerColor="border-btn-primary" />
                                <div className="text-center space-y-1">
                                    <p className="text-base font-bold text-foreground tracking-tight">Bot Operating</p>
                                    <p className="text-xs font-medium text-muted-foreground">{loadingMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent
                    className="max-w-md bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        document.getElementById("brandix-confirm-btn")?.focus();
                    }}
                >
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                            Confirm Execution
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground font-medium">
                            You are about to initiate <span className="text-foreground font-bold">{form_name}</span> execution for the file
                            <span className="text-btn-primary font-bold ml-1">{selectedFile?.name}</span>.
                            <br /><br />
                            This operation will be audited, and execution performance will be monitored in real-time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-8">
                        <AlertDialogCancel className="h-11 px-6 rounded-xl font-bold border-border/50 hover:bg-muted transition-all">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            id="brandix-confirm-btn"
                            onClick={confirmSubmit}
                            className="h-11 px-10 bg-btn-primary hover:bg-btn-primary/90 text-white rounded-xl font-bold shadow-lg shadow-btn-primary/25 hover:shadow-btn-primary/40 transition-all active:scale-95"
                        >
                            Proceed Execution
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

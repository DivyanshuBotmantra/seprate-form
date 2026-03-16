import { useEffect, useState } from "react";
import * as RHF from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Save, Send, ChevronLeft } from "lucide-react";

import { vendorFormSchema, type VendorFormValues } from "./schema";
import { VENDOR_FORM_DEFAULTS, FORMDATA_CONFIG } from "./config";
import { getFormData, updateFormData } from "@/services/vendor-onboarding/form-data";
import { useVendorDataLoader } from "../hooks/useVendorDataLoader";
import { prepareUpdatePayload } from "./mapper";

import TypeOfVendor from "./sections/TypeOfVendor";
import VendorDetails from "./sections/VendorDetails";
import KeyDetails from "./sections/KeyDetails";
import AddressDetails from "./sections/AddressDetails";
import BankDetails from "./sections/BankDetails";
import InternalDetails from "./sections/InternalDetails";
import SystemFields from "./sections/SystemFields";
import Attachments from "./sections/Attachments";
import ViewModeAttachments from "./sections/ViewModeAttachments";
import { Badge } from "@/components/ui/badge";
import { LOVProvider } from "./LOVContext";
import { FileLifecycleProvider } from "../hooks/FileLifecycleContext";
import { useFormDependencies } from "../hooks/useFormDependencies";
import { useFileLifecycle } from "../hooks/useFileLifecycle";

interface VendorMetadata {
    transactionId: string;
    formStatus: string;
    createdBy: string;
    createdOn: string;
    updatedBy?: string;
    updatedOn?: string;
    submittedBy?: string;
    submittedOn?: string;
}

const FormLogic = () => {
    useFormDependencies();
    return null;
};

const VendorFormContainer = () => {
    const [searchParams] = useSearchParams();
    const transId = searchParams.get("transId");

    const { lovData, isLoadingLov } = useVendorDataLoader();

    const methods = RHF.useForm<VendorFormValues>({
        resolver: zodResolver(vendorFormSchema),
        defaultValues: VENDOR_FORM_DEFAULTS as VendorFormValues,
        mode: "onBlur",
    });

    if (isLoadingLov) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">Fetching form options...</p>
            </div>
        );
    }

    return (
        <LOVProvider lovData={lovData} isLoading={isLoadingLov}>
            <FileLifecycleProvider>
                <RHF.FormProvider {...methods}>
                    <FormLogic />
                    <FormContent transId={transId} />
                </RHF.FormProvider>
            </FileLifecycleProvider>
        </LOVProvider>
    );
};

const FormContent = ({ transId }: { transId: string | null }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") || "edit";

    const { reset, formState, getValues, handleSubmit } = RHF.useFormContext<VendorFormValues>();
    const { isSubmitting, isValid } = formState;

    const [loading, setLoading] = useState(!!transId);
    const [metadata, setMetadata] = useState<VendorMetadata | null>(null);
    const [formId, setFormId] = useState<string>("");

    const {
        processPhysicalDeletions,
        refreshPermanentUrls,
        isProcessing,
        newlyUploadedKeys,
        clearUploadedKeys
    } = useFileLifecycle();

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case "submitted": return "default";
            case "draft": return "secondary";
            case "approved": return "default";
            case "rejected": return "destructive";
            default: return "outline";
        }
    };

    useEffect(() => {
        if (transId) {
            const loadData = async () => {
                setLoading(true);
                const { data, error } = await getFormData({
                    org_name: FORMDATA_CONFIG.ORG_NAME,
                    form_name: FORMDATA_CONFIG.FORM_NAME,
                    search_params: { trans_id: transId }
                });

                if (data && data.response_body?.[0]) {
                    const record = data.response_body[0];
                    setFormId(record.id || record.trans_id || "");
                    reset(record.form_data);
                    setMetadata({
                        transactionId: record.trans_id,
                        formStatus: record.form_status,
                        createdBy: record.created_by,
                        createdOn: record.created_on,
                        updatedBy: record.updated_by,
                        updatedOn: record.updated_on,
                        submittedBy: record.form_submitted_by || record.form_data?.form_submitted_by,
                        submittedOn: record.form_submitted_on || record.form_data?.form_submitted_on,
                    });
                } else if (error) {
                    toast.error("Failed to load vendor data");
                }
                setLoading(false);
            };
            loadData();
        }
    }, [transId, reset]);

    const onSubmit = async (values: VendorFormValues, status: "Submitted" | "Draft" = "Submitted") => {
        try {
            const userDetailStr = sessionStorage.getItem("userDetail");
            let userId = "unknown";
            if (userDetailStr) {
                const userDetail = JSON.parse(userDetailStr);
                userId = userDetail.user_id || userDetail.userId || "unknown";
            }

            const payload = prepareUpdatePayload(
                values,
                status,
                transId || "",
                userId,
                formId || transId || "",
                newlyUploadedKeys
            );

            const { error } = await updateFormData(payload);

            if (error) {
                toast.error(`Failed to ${status === "Draft" ? "save" : "submit"}: ${error}`);
            } else {
                toast.success(`Form ${status === "Draft" ? "saved" : "submitted"} successfully!`);
                if (transId) {
                    await processPhysicalDeletions(transId);
                    if (status === "Draft") {
                        await refreshPermanentUrls(transId);
                    }
                }
                if (status === "Submitted") {
                    navigate("/vendor-onboarding");
                }
                clearUploadedKeys();
            }
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("An unexpected error occurred during submission");
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading vendor data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-sidebar overflow-hidden">
            <div className="h-full bg-sidebar rounded-lg border overflow-hidden shadow-sm flex flex-col">
                <div className="bg-primary px-6 py-3 flex-shrink-0 border-b border-primary-foreground/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div onClick={() => navigate(-1)} className="hover:cursor-pointer transition-colors">
                                <ChevronLeft className="h-6 w-6 text-muted hover:text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg text-muted font-semibold uppercase tracking-wider">
                                    VENDOR ONBOARDING FORM {mode === "view" ? "- VIEW MODE" : ""}
                                </h1>
                                {mode === "view" && metadata && (
                                    <p className="text-[11px] text-muted opacity-80 font-medium -mt-1">
                                        Transaction ID: {metadata.transactionId}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {mode === "view" ? (
                                <div className="text-white/80 text-[13px] font-bold bg-white/10 px-3 py-1 rounded-md border border-white/20 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    READ ONLY
                                </div>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="px-4 h-9 font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all flex items-center gap-2"
                                        onClick={() => onSubmit(getValues(), "Draft")}
                                        disabled={isSubmitting || loading || isProcessing}
                                    >
                                        <Save className="h-4 w-4" /> Save Draft
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={`px-6 h-9 border-none font-bold tracking-wide shadow-none transition-all duration-300 ${(isValid && !loading && !isProcessing) ? "bg-[#e5a060] hover:bg-[#d48d4c] text-black" : "bg-[#FFD1A6] opacity-50 cursor-not-allowed text-black/60"}`}
                                        onClick={handleSubmit((val) => onSubmit(val, "Submitted"))}
                                        disabled={isSubmitting || !isValid || loading || isProcessing}
                                    >
                                        {isSubmitting || isProcessing ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Submit Form
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {mode === "view" && metadata && (
                    <div className="bg-[#f8f9fa] dark:bg-muted/30 border-b border-border px-6 py-2.5 flex-shrink-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-tight">Status:</span>
                                <Badge
                                    variant={getStatusBadgeVariant(metadata.formStatus) as any}
                                    className={`${metadata.formStatus?.toLowerCase() === 'submitted' ? 'bg-[#98D8AA] hover:bg-[#98D8AA] text-[#0A5C36] border-none px-3 font-bold' : ''}`}
                                >
                                    {metadata.formStatus}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px]">
                                {metadata.submittedBy && metadata.submittedOn ? (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground font-medium">Submitted:</span>
                                            <span className="text-foreground font-bold">{new Date(metadata.submittedOn).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground font-medium">By:</span>
                                            <span className="text-foreground font-bold">{metadata.submittedBy}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground font-medium">Created:</span>
                                            <span className="text-foreground font-bold">{new Date(metadata.createdOn).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground font-medium">By:</span>
                                            <span className="text-foreground font-bold">{metadata.createdBy}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-sidebar">
                    <div className="p-4 md:p-6 pb-8">
                        <div className="max-w-7xl mx-auto space-y-6 mb-2">
                            <Card><TypeOfVendor isReadOnly={mode === "view" || !!transId} /></Card>
                            <Card><VendorDetails isReadOnly={mode === "view"} isStep1ReadOnly={mode === "view" || !!transId} /></Card>
                            <Card><KeyDetails isReadOnly={mode === "view"} isStep1ReadOnly={mode === "view" || !!transId} /></Card>
                            <Card><AddressDetails isReadOnly={mode === "view"} /></Card>
                            <Card><BankDetails isReadOnly={mode === "view"} /></Card>
                            <Card><InternalDetails isReadOnly={mode === "view"} /></Card>
                            <Card><SystemFields isReadOnly={mode === "view"} /></Card>

                            {mode === "view" ? (
                                <ViewModeAttachments attachments={getValues("attachments") as any} />
                            ) : (
                                mode !== "edit" && (
                                    <Card><Attachments isReadOnly={mode === "view"} /></Card>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorFormContainer;

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
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


import { LOVProvider } from "./LOVContext";

import { useFormDependencies } from "../hooks/useFormDependencies";

const FormLogic = () => {
    useFormDependencies();
    return null;
};

const VendorFormContainer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const transId = searchParams.get("transId");
    const mode = searchParams.get("mode") || "edit";

    // Load LOVs and form metadata
    const { lovData, isLoadingLov } = useVendorDataLoader();

    const methods = useForm<VendorFormValues>({
        resolver: zodResolver(vendorFormSchema),
        defaultValues: VENDOR_FORM_DEFAULTS as VendorFormValues,
        mode: "onBlur",
    });

    const { reset, formState } = methods;
    const { errors, isSubmitting, isValid } = formState;

    const [loading, setLoading] = useState(!!transId);
    const [formId, setFormId] = useState<string>("");

    // Load existing data if transId is present
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
            // Get user ID from session
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
                formId || transId || ""
            );

            const { error } = await updateFormData(payload);

            if (error) {
                toast.error(`Failed to ${status === "Draft" ? "save" : "submit"}: ${error}`);
            } else {
                toast.success(`Form ${status === "Draft" ? "saved" : "submitted"} successfully!`);
                if (status === "Submitted") {
                    navigate("/vendor-onboarding");
                }
            }
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("An unexpected error occurred during submission");
        }
    };

    // Error Focus Protocol
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            toast.error("Please fix errors in the form before submitting.");
        }
    }, [errors]);

    if (loading || isLoadingLov) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-muted-foreground animate-pulse">
                    {isLoadingLov ? "Fetching form options..." : "Loading vendor data..."}
                </p>
            </div>
        );
    }

    return (
        <LOVProvider lovData={lovData} isLoading={isLoadingLov}>
            <FormProvider {...methods}>
                <FormLogic />
                <div className="h-full bg-sidebar rounded-lg border overflow-hidden shadow-sm flex flex-col">
                    {/* Sticky Main Header */}
                    <div className="bg-primary px-6 py-3 flex-shrink-0 border-b border-primary-foreground/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div onClick={() => navigate(-1)} className="hover:cursor-pointer transition-colors">
                                    <ChevronLeft className="h-6 w-6 text-muted hover:text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg text-muted font-semibold uppercase tracking-wider">
                                        VENDOR ONBOARDING FORM
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {mode === "view" ? (
                                    <div className="text-white text-sm font-medium pr-4">View Mode - Read Only</div>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="px-4 h-9 font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all flex items-center gap-2"
                                            onClick={() => onSubmit(methods.getValues(), "Draft")}
                                            disabled={isSubmitting || loading}
                                        >
                                            <Save className="h-4 w-4" /> Save Draft
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className={`px-6 h-9 border-none font-bold tracking-wide shadow-none transition-all duration-300 ${(isValid && !loading) ? "bg-[#e5a060] hover:bg-[#d48d4c] text-black" : "bg-[#FFD1A6] opacity-50 cursor-not-allowed text-black/60"}`}
                                            onClick={methods.handleSubmit((val) => onSubmit(val, "Submitted"))}
                                            disabled={isSubmitting || !isValid || loading}
                                        >
                                            {isSubmitting ? (
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

                    {/* Scrollable Form Body using individual floated cards exactly like v1 */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-sidebar">
                        <div className="p-4 md:p-6 pb-8">
                            <div className="max-w-7xl mx-auto space-y-6 mb-2">
                                <Card><TypeOfVendor isReadOnly={mode === "view" || !!transId} /></Card>
                                <Card><VendorDetails isReadOnly={mode === "view"} isStep1ReadOnly={mode === "view" || !!transId} /></Card>
                                <Card><KeyDetails isReadOnly={mode === "view"} isStep1ReadOnly={mode === "view" || !!transId} /></Card>
                                <Card><AddressDetails isReadOnly={mode === "view"} /></Card>
                                <Card><BankDetails isReadOnly={mode === "view"} /></Card>
                                <Card><InternalDetails isReadOnly={mode === "view"} /></Card>
                                <Card><SystemFields /></Card>
                                {mode !== "edit" && (
                                    <Card><Attachments isReadOnly={mode === "view"} /></Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </FormProvider>
        </LOVProvider>
    );
};

export default VendorFormContainer;

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Save, Send } from "lucide-react";

import { vendorFormSchema, type VendorFormValues } from "./schema";
import { VENDOR_FORM_DEFAULTS } from "./config";
import { getFormData, updateFormData } from "@/services/vendor-onboarding/form-data";

import TypeOfVendor from "./sections/TypeOfVendor";
import VendorDetails from "./sections/VendorDetails";
import KeyDetails from "./sections/KeyDetails";
import AddressDetails from "./sections/AddressDetails";
import BankDetails from "./sections/BankDetails";
import InternalDetails from "./sections/InternalDetails";
import SystemFields from "./sections/SystemFields";

const VendorFormContainer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const transId = searchParams.get("transId");
    const mode = searchParams.get("mode") || "edit";
    const [loading, setLoading] = useState(!!transId);
    const [activeTab, setActiveTab] = useState("type");

    const methods = useForm<VendorFormValues>({
        resolver: zodResolver(vendorFormSchema),
        defaultValues: VENDOR_FORM_DEFAULTS as VendorFormValues,
        mode: "onBlur",
    });

    const { handleSubmit, reset, formState: { errors, isSubmitting } } = methods;

    // Load existing data if transId is present
    useEffect(() => {
        if (transId) {
            const loadData = async () => {
                setLoading(true);
                const { data, error } = await getFormData({
                    org_name: "Rustomjee",
                    form_name: "Vendor Onboarding",
                    search_params: { trans_id: transId }
                });

                if (data && data.response_body?.[0]) {
                    const record = data.response_body[0];
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
            const payload = {
                search_fields: {
                    transaction_id: transId,
                    org_name: "Rustomjee"
                },
                update_fields: {
                    form_status: status,
                    form_data: values,
                    updated_attachment_fields: [] // TODO: Track changed attachments
                }
            };

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
            toast.error("An unexpected error occurred");
        }
    };

    // Error Focus Protocol
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstErrorField = Object.keys(errors)[0];
            toast.error("Please fix errors in the form before submitting.");
            console.log("First error in:", firstErrorField);
            // logic to scroll and focus can go here or inside tab content
        }
    }, [errors]);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading form data...</p>
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            <div className="max-w-7xl mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between px-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {mode === "view" ? "View Vendor Details" : transId ? "Edit Vendor Registration" : "New Vendor Registration"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {transId ? `Transaction ID: ${transId}` : "Fill out the details to register a new vendor"}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handleSubmit((val) => onSubmit(val, "Draft"))()} disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> Save Draft
                        </Button>
                        <Button onClick={handleSubmit((val) => onSubmit(val, "Submitted"))} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Form
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-7 h-12 bg-muted/50 p-1">
                        <TabsTrigger value="type" className="rounded-md">1. Vendor Type</TabsTrigger>
                        <TabsTrigger value="details" className="rounded-md">2. Details</TabsTrigger>
                        <TabsTrigger value="key" className="rounded-md">3. Key IDs</TabsTrigger>
                        <TabsTrigger value="address" className="rounded-md">4. Address</TabsTrigger>
                        <TabsTrigger value="bank" className="rounded-md">5. Banking</TabsTrigger>
                        <TabsTrigger value="internal" className="rounded-md">6. Internal</TabsTrigger>
                        <TabsTrigger value="system" className="rounded-md">7. System</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6">
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <TabsContent value="type"><TypeOfVendor /></TabsContent>
                            <TabsContent value="details"><VendorDetails /></TabsContent>
                            <TabsContent value="key"><KeyDetails /></TabsContent>
                            <TabsContent value="address"><AddressDetails /></TabsContent>
                            <TabsContent value="bank"><BankDetails /></TabsContent>
                            <TabsContent value="internal"><InternalDetails /></TabsContent>
                            <TabsContent value="system"><SystemFields /></TabsContent>
                        </Card>
                    </div>
                </Tabs>
            </div>
        </FormProvider>
    );
};

export default VendorFormContainer;

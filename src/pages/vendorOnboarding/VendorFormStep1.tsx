import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createFormData, getFormLovs } from "@/services/vendor-onboarding/form-data";
import { Loader2, ChevronLeft } from "lucide-react";
import { FIELD_DEPENDENCIES, createInitialDraftPayload, REGEX, FORMDATA_CONFIG } from "../../components/vendorOnboarding/form/config";
import FormInputWrapper from "../../components/vendorOnboarding/form/FormInputWrapper";
import { mapAPILOVToDropdown } from "@/components/vendor/lov-utils";
import type { LOVData } from "@/components/vendor/types";

const step1Schema = z.object({
    type_of_vendor: z.enum(["Employee", "XK01", "FK01"]),
    vendor_account_group: z.string().min(1, "Vendor Group is required"),
    name1: z.string().min(1, "Vendor Name is required").max(35, "Only 35 characters are allowed"),
    gstin_requirement: z.string().min(1, "GSTIN Requirement is required"),
    pan_number: z.string().optional().or(z.literal("")),
    gstin: z.string().optional().or(z.literal("")),
    employee_number: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
    const isForeign = data.vendor_account_group.toLowerCase().includes("foreign");
    const isEmployeeType = data.type_of_vendor === "Employee";
    const pan = (data.pan_number || "").trim().toUpperCase();

    // PAN Validation Logic
    if (isForeign) {
        if (pan === "NOT APPLICABLE") {
            // OK
        } else if (!pan) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter PAN or 'NOT APPLICABLE'", path: ["pan_number"] });
        } else if (pan === "NA") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Foreign vendors must enter PAN or 'NOT APPLICABLE'", path: ["pan_number"] });
        } else {
            if (pan.length !== 10) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN must be exactly 10 characters", path: ["pan_number"] });
            } else if (!REGEX.PAN.test(pan)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid PAN format. Please check the format and try again.", path: ["pan_number"] });
            }
        }
    } else if (isEmployeeType) {
        if (pan && !REGEX.PAN.test(pan)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid PAN format. Please check the format and try again.", path: ["pan_number"] });
        }
    } else {
        // Indian Vendor
        if (!pan) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN is required", path: ["pan_number"] });
        } else if (pan === "NA" || pan === "NOT APPLICABLE") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN cannot be NA for Indian vendors", path: ["pan_number"] });
        } else if (pan.length !== 10) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN must be exactly 10 characters", path: ["pan_number"] });
        } else if (!REGEX.PAN.test(pan)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid PAN format. Please check the format and try again.", path: ["pan_number"] });
        }
    }

    // GSTIN Validation
    if (data.gstin_requirement === "Registered" && !isEmployeeType) {
        const gstin = data.gstin?.trim().toUpperCase() || "";
        if (!gstin) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GSTIN is required when GSTIN requirement is set to Registered", path: ["gstin"] });
        } else if (gstin.length !== 15) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GSTIN must be exactly 15 characters", path: ["gstin"] });
        } else if (!REGEX.GSTIN.test(gstin)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid GSTIN format. Please check the format and try again.", path: ["gstin"] });
        }
    }

    // Employee Number Validation
    if (data.vendor_account_group.startsWith("V010")) {
        if (!data.employee_number?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Employee number is required for V010 vendor group", path: ["employee_number"] });
        } else if (!/^[0-9]{1,4}$/.test(data.employee_number)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Employee number must be up to 4 digits", path: ["employee_number"] });
        }
    }
});

type Step1Values = z.infer<typeof step1Schema>;

const VendorFormStep1 = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [lovData, setLovData] = useState<LOVData | null>(null);
    const [isLoadingLov, setIsLoadingLov] = useState(true);

    const form = useForm<Step1Values>({
        resolver: zodResolver(step1Schema),
        mode: "onSubmit", // Validation only triggers on "Next" click
        reValidateMode: "onChange",
        defaultValues: {
            type_of_vendor: "XK01",
            vendor_account_group: "",
            name1: "",
            gstin_requirement: "Registered",
            gstin: "",
            pan_number: "",
            employee_number: ""
        }
    });

    const { watch, setValue, formState: { isValid } } = form;
    const typeOfVendor = watch("type_of_vendor");
    const gstinValue = watch("gstin");
    const gstinReq = watch("gstin_requirement");

    // Load LOVs on mount
    useEffect(() => {
        const loadLOVs = async () => {
            setIsLoadingLov(true);
            try {
                const { data } = await getFormLovs({
                    form_name: FORMDATA_CONFIG.FORM_NAME,
                    org_name: FORMDATA_CONFIG.ORG_NAME
                });
                if (data) setLovData(mapAPILOVToDropdown(data));
            } catch (err) {
                toast.error("Failed to load options");
            } finally {
                setIsLoadingLov(false);
            }
        };
        loadLOVs();
    }, []);

    // Logic: Default settings based on Vendor Type (Group, GSTIN Requirement, etc.)
    useEffect(() => {
        if (!typeOfVendor) return;

        // Instantly clear ALL validation errors when type changes to reset form state
        form.clearErrors();

        // Use a small timeout to let form state stabilize and conditional renders complete
        const timer = setTimeout(() => {
            if (typeOfVendor === "Employee") {
                // 1. Set Employee Vendor Group
                const v010 = lovData?.vendorAccountGroup.find(o => o.value.includes("V010"))?.value || "V010";
                if (form.getValues("vendor_account_group") !== v010) {
                    setValue("vendor_account_group", v010, { shouldValidate: false, shouldDirty: true, shouldTouch: true });
                }

                // 2. Set GSTIN Requirement to Not Registered
                setValue("gstin_requirement", "Not Registered", { shouldValidate: false, shouldDirty: true, shouldTouch: true });

                // 3. Clear name and GSTIN for a clean start
                setValue("name1", "", { shouldValidate: false, shouldDirty: false });
                setValue("gstin", "", { shouldValidate: false, shouldDirty: false });
            } else if (typeOfVendor === "XK01" || typeOfVendor === "FK01") {
                // 1. Set GSTIN Requirement to Registered
                setValue("gstin_requirement", "Registered", { shouldValidate: false, shouldDirty: true, shouldTouch: true });

                // 2. Reset fields to ensure a clean state
                setValue("vendor_account_group", "", { shouldValidate: false, shouldDirty: false });
                setValue("name1", "", { shouldValidate: false, shouldDirty: false });
                setValue("gstin", "", { shouldValidate: false, shouldDirty: false });
                setValue("pan_number", "", { shouldValidate: false, shouldDirty: false });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [typeOfVendor, lovData, setValue, form]);




    // Logic: Auto-extract PAN from GSTIN
    useEffect(() => {
        if (gstinValue && gstinValue.length >= FIELD_DEPENDENCIES.GSTIN_TO_PAN.end && REGEX.GSTIN.test(gstinValue)) {
            const extractedPan = gstinValue.substring(
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.start,
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.end
            ).toUpperCase();
            setValue("pan_number", extractedPan, { shouldValidate: true });
        }
    }, [gstinValue, setValue]);

    // Logic: If Not Registered -> Clear GSTIN
    useEffect(() => {
        if (gstinReq === "Not Registered") {
            setValue("gstin", "");
        }
    }, [gstinReq, setValue]);

    // Logic: If Vendor Group is not V010 -> Clear Employee Number
    useEffect(() => {
        const group = watch("vendor_account_group");
        if (!group.startsWith("V010")) {
            setValue("employee_number", "");
        }
    }, [watch("vendor_account_group"), setValue]);

    const onSubmit = async (values: Step1Values) => {
        setLoading(true);
        try {
            const payload = createInitialDraftPayload({
                ...values,
                pan_number: values.pan_number || "",
                type_of_vendor: values.type_of_vendor,
                employee_number: values.employee_number || ""
            });
            const { data, error } = await createFormData(payload);

            if (data && data.response_body?.transaction_id) {
                toast.success("Primary details saved. Proceeding...");
                navigate(`/vendor-form?transId=${data.response_body.transaction_id}&formName=Vendor Onboarding`);
            } else {
                toast.error(error || "Failed to initiate transaction");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (isLoadingLov) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-background overflow-hidden relative">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} id="vendor-step1-form" className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary border-b border-border px-4 md:px-6 py-3 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div onClick={() => navigate(-1)} className="text-muted-foreground hover:cursor-pointer transition-colors">
                                    <ChevronLeft className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-sm md:text-lg lg:text-xl text-primary-foreground uppercase tracking-widest font-semibold">
                                        STEP 1: PRIMARY VENDOR DETAILS
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                        <div className="p-4 md:p-6 pb-20 max-w-7xl mx-auto space-y-6">
                            <div className="bg-card rounded-lg border shadow-sm p-4 md:p-6">
                                <div className="mb-8">
                                    <h2 className="text-base md:text-lg font-bold text-card-foreground mb-1">
                                        Primary Vendor Information
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground opacity-80">
                                        Enter the essential vendor details to get started. All fields are required.
                                    </p>
                                </div>

                                <div className="space-y-6 flex flex-col">
                                    {/* Type of Vendor - Radio Buttons */}
                                    <FormField
                                        control={form.control}
                                        name="type_of_vendor"
                                        render={({ field, fieldState }) => (
                                            <FormInputWrapper 
                                                label="Type of Vendor"
                                                required
                                                error={fieldState.error}
                                                className="mb-4"
                                            >
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 w-full justify-start"
                                                    >
                                                        {[
                                                            { id: "employee", label: "Employee", val: "Employee" },
                                                            { id: "purchase", label: "Vendor Purchase Org", val: "XK01" },
                                                            { id: "direct", label: "Direct FI Vendor", val: "FK01" }
                                                        ].map(opt => (
                                                            <div key={opt.id} className="flex">
                                                                <label
                                                                    htmlFor={opt.id}
                                                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg border cursor-pointer w-full transition-all duration-300 ${field.value === opt.val ? "bg-primary/5 border-primary ring-[0.5px] ring-primary shadow-sm scale-[1.01]" : "bg-card border-border hover:border-primary/20"}`}
                                                                >
                                                                    <RadioGroupItem value={opt.val} id={opt.id} className="h-4 w-4 border-2 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" />
                                                                    <span className="text-xs sm:text-sm font-semibold cursor-pointer text-foreground opacity-90">{opt.label}</span>
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormInputWrapper>
                                        )}
                                    />

                                    {/* Dual Column Layout EXACTLY like AddressDetails.tsx */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start mt-4">

                                        {/* Row 1, Col 1: Vendor Account Group */}
                                        <FormField
                                            control={form.control}
                                            name="vendor_account_group"
                                            render={({ field, fieldState }) => (
                                                <FormInputWrapper 
                                                    label="Vendor Account Group"
                                                    required
                                                    error={fieldState.error}
                                                >
                                                    <Select onValueChange={(val) => {
                                                        field.onChange(val);
                                                        form.clearErrors("vendor_account_group");
                                                    }} value={field.value} disabled={typeOfVendor === "Employee"}>
                                                        <FormControl>
                                                            <SelectTrigger className={`w-full h-10 text-[13px] font-semibold ${typeOfVendor === "Employee" ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`}>
                                                                <SelectValue placeholder="Choose vendor group" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {(lovData?.vendorAccountGroup || [])
                                                                .filter(opt => typeOfVendor === "Employee" ? opt.value.includes("V010") : !opt.value.includes("V010"))
                                                                .map(opt => (
                                                                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormInputWrapper>
                                            )}
                                        />

                                        {/* Row 1, Col 2: Vendor Name / Employee Name */}
                                        <FormField
                                            control={form.control}
                                            name="name1"
                                            render={({ field, fieldState }) => (
                                                <FormInputWrapper 
                                                    label={typeOfVendor === "Employee" ? "Employee Name" : "Vendor Name (Name1)"}
                                                    required
                                                    error={fieldState.error}
                                                    helperText="Max 35 characters. Name 2 available details screens."
                                                >
                                                    <FormControl>
                                                        <Input 
                                                            className="h-10 border-border bg-background text-[13px] font-semibold" 
                                                            placeholder={`Enter ${typeOfVendor === "Employee" ? "employee" : "vendor"} name`} 
                                                            {...field} 
                                                            maxLength={35} 
                                                        />
                                                    </FormControl>
                                                </FormInputWrapper>
                                            )}
                                        />

                                        {/* Row 2, Col 1: GSTIN Requirement (Non-Employee Only) */}
                                        {typeOfVendor !== "Employee" ? (
                                            <FormField
                                                control={form.control}
                                                name="gstin_requirement"
                                                render={({ field, fieldState }) => (
                                                    <FormInputWrapper 
                                                        label="GSTIN Requirement"
                                                        required
                                                        error={fieldState.error}
                                                    >
                                                        <Select onValueChange={(val) => {
                                                            field.onChange(val);
                                                            form.clearErrors("gstin_requirement");
                                                        }} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="w-full h-10 border-border bg-background text-[13px] font-semibold">
                                                                    <SelectValue placeholder="Select requirement" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Registered" className="text-[13px]">Registered</SelectItem>
                                                                <SelectItem value="Not Registered" className="text-[13px]">Not Registered</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormInputWrapper>
                                                )}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="employee_number"
                                                render={({ field, fieldState }) => (
                                                    <FormInputWrapper 
                                                        label="Employee Number"
                                                        required
                                                        error={fieldState.error}
                                                    >
                                                        <FormControl>
                                                            <Input
                                                                className="h-10 border-border bg-background text-[13px] font-semibold"
                                                                placeholder="Enter 4-digit number"
                                                                {...field}
                                                                maxLength={4}
                                                                onChange={e => field.onChange(e.target.value.replace(/[^0-9]/g, ""))}
                                                            />
                                                        </FormControl>
                                                    </FormInputWrapper>
                                                )}
                                            />
                                        )}

                                        {/* Row 2, Col 2: PAN Number (Non-Employee Only) / Spacer for Employee */}
                                        {typeOfVendor !== "Employee" ? (
                                            <FormField
                                                control={form.control}
                                                name="pan_number"
                                                render={({ field, fieldState }) => (
                                                    <FormInputWrapper 
                                                        label="PAN Number"
                                                        required
                                                        error={fieldState.error}
                                                    >
                                                        <FormControl>
                                                            <Input
                                                                className={`h-10 font-mono text-[13px] uppercase font-bold ${gstinReq === "Registered" ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`}
                                                                placeholder="Enter 10 character PAN"
                                                                {...field}
                                                                maxLength={10}
                                                                onChange={e => field.onChange(e.target.value.toUpperCase())}
                                                                readOnly={gstinReq === "Registered"}
                                                            />
                                                        </FormControl>
                                                    </FormInputWrapper>
                                                )}
                                            />
                                        ) : (
                                            /* Spacer div to ensure grid stability when employee fields are present */
                                            <div className="hidden lg:block h-[64px]"></div>
                                        )}

                                        {/* Extra Row for GSTIN when Registered - Always occupies space on right if registered */}
                                        <div className="md:col-start-2">
                                            {typeOfVendor !== "Employee" && gstinReq === "Registered" && (
                                                <FormField
                                                    control={form.control}
                                                    name="gstin"
                                                    render={({ field, fieldState }) => (
                                                        <FormInputWrapper 
                                                            label="Tax Number 3 (GSTIN)"
                                                            required
                                                            error={fieldState.error}
                                                        >
                                                            <FormControl>
                                                                <Input
                                                                    className="h-10 border-border bg-background font-mono text-[13px] uppercase font-bold"
                                                                    placeholder="Enter 15 character GSTIN"
                                                                    {...field}
                                                                    maxLength={15}
                                                                    onChange={e => field.onChange(e.target.value.toUpperCase())}
                                                                />
                                                            </FormControl>
                                                        </FormInputWrapper>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Action Buttons */}
                    <div className="flex-shrink-0 bg-background border-t border-border p-4 w-full">
                        <div className="w-full max-w-7xl mx-auto flex justify-end gap-3 md:gap-4">
                            <Button type="button" variant="outline" className="px-8 h-10 font-bold w-full sm:w-auto" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="vendor-step1-form"
                                className={`px-10 h-10 border-none font-bold tracking-wide w-full sm:w-auto shadow-none transition-all duration-300 ${isValid ? "bg-[#e5a060] hover:bg-[#d48d4c] text-black" : "bg-[#e5a060] hover:bg-[#d48d4c] text-black"}`}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Next"}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default VendorFormStep1;
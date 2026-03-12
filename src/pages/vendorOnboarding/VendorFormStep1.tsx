import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { createFormData, getFormLovs } from "@/services/vendor-onboarding/form-data";
import { Loader2, ChevronLeft } from "lucide-react";
import { FIELD_DEPENDENCIES, createInitialDraftPayload, REGEX, FORMDATA_CONFIG } from "../../components/vendorOnboarding/form/config";
import { mapAPILOVToDropdown } from "../../components/vendorOnboarding/utils/lov-utils";
import type { LOVData } from "../../components/vendorOnboarding/utils/types";

const step1Schema = z.object({
    type_of_vendor: z.enum(["Employee", "XK01", "FK01"]),
    vendor_account_group: z.string().min(1, "Vendor Group is required"),
    name1: z.string().min(1, "Vendor Name is required").max(35, "Only 35 characters are allowed"),
    gstin_requirement: z.string().min(1, "GSTIN Requirement is required"),
    pan_number: z.string().min(1, "PAN is required"),
    gstin: z.string().optional().or(z.literal("")),
    employee_number: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
    const isForeign = data.vendor_account_group.toLowerCase().includes("foreign");
    const isEmployeeType = data.type_of_vendor === "Employee";
    const pan = data.pan_number.trim().toUpperCase();

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

    const { watch, setValue } = form;
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

    // Logic: If Vendor Type is Employee -> Auto-select V010 and set Not Registered
    useEffect(() => {
        if (typeOfVendor === "Employee") {
            const v010 = lovData?.vendorAccountGroup.find(o => o.value.includes("V010"))?.value || "V010";
            setValue("vendor_account_group", v010, { shouldValidate: true });
            setValue("gstin_requirement", "Not Registered", { shouldValidate: true });
            setValue("gstin", "");
        } else {
            setValue("gstin_requirement", "Registered", { shouldValidate: true });
        }
    }, [typeOfVendor, lovData, setValue]);

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
                type_of_vendor: values.type_of_vendor,
                employee_number: values.employee_number
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
        <div className="h-full w-full bg-background overflow-hidden flex flex-col pt-4 px-6">
            <div className="w-full max-w-[1280px] mx-auto flex flex-col h-full shrink-0">
                {/* Header: Dark banner with semantic bg-primary */}
                <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-t-lg flex items-center gap-3">
                    <ChevronLeft className="h-4 w-4 cursor-pointer opacity-80 hover:opacity-100" onClick={() => navigate(-1)} />
                    <h1 className="text-[11px] font-bold tracking-widest uppercase">STEP 1: PRIMARY VENDOR DETAILS</h1>
                </div>

                {/* Main Form Container: bg-card from theme */}
                <div className="bg-card border-x border-b border-border rounded-b-lg shadow-sm p-5 md:p-6 transition-all duration-300">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-card-foreground leading-tight">Primary Vendor Information</h2>
                        <p className="text-[11px] text-muted-foreground">Enter the essential vendor details to get started. All fields are required.</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Type of Vendor - Compact Single Row */}
                            <FormField
                                control={form.control}
                                name="type_of_vendor"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Type of Vendor <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={(val) => field.onChange(val as "Employee" | "XK01" | "FK01")}
                                                value={field.value}
                                                className="flex flex-wrap gap-4"
                                            >
                                                {[
                                                    { id: "employee", label: "Employee", val: "Employee" },
                                                    { id: "purchase", label: "Vendor Purchase Org", val: "XK01" },
                                                    { id: "direct", label: "Direct FI Vendor", val: "FK01" }
                                                ].map(opt => (
                                                    <div
                                                        key={opt.id}
                                                        className={`flex items-center space-x-3 rounded-lg border-2 px-5 py-2.5 cursor-pointer transition-all duration-300 ${field.value === opt.val ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-md scale-[1.02]" : "bg-card border-border hover:border-primary/20"}`}
                                                        onClick={() => field.onChange(opt.val)}
                                                    >
                                                        <RadioGroupItem value={opt.val} id={opt.id} className="h-4 w-4 border-2" />
                                                        <Label htmlFor={opt.id} className="cursor-pointer text-[13px] font-bold text-foreground/90">{opt.label}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Dual Column Layout: Unified Widths */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-5">
                                {/* Column 1 */}
                                <div className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="vendor_account_group"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Vendor Account Group <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={typeOfVendor === "Employee"}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full h-10 border-border bg-muted/30 focus:ring-1 focus:ring-primary text-[13px] font-semibold">
                                                            <SelectValue placeholder="Choose vendor group" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {(lovData?.vendorAccountGroup || []).map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    {typeOfVendor !== "Employee" && (
                                        <FormField
                                            control={form.control}
                                            name="gstin_requirement"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">GSTIN Requirement <span className="text-destructive">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={typeOfVendor === "Employee"}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full h-10 border-border bg-muted/30 focus:ring-1 focus:ring-primary text-[13px] font-semibold">
                                                                <SelectValue placeholder="Select requirement" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Registered" className="text-[13px]">Registered</SelectItem>
                                                            <SelectItem value="Not Registered" className="text-[13px]">Not Registered</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name1"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Vendor Name (Name1) <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input className="h-10 border-border bg-muted/30 focus:ring-1 focus:ring-primary text-[13px] font-semibold" placeholder="Enter vendor name" {...field} maxLength={35} />
                                                </FormControl>
                                                <FormDescription className="text-[10px] text-muted-foreground italic leading-none pt-1">
                                                    Max 35 chars. Rest can be filled in the next screen.
                                                </FormDescription>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="pan_number"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">PAN Number <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input className="h-10 border-border bg-muted/30 font-mono text-[13px] uppercase font-bold" placeholder="ENTER 10 DIGIT PAN" {...field} maxLength={10} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    {gstinReq === "Registered" && typeOfVendor !== "Employee" && (
                                        <FormField
                                            control={form.control}
                                            name="gstin"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tax Number 3 (GSTIN) <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className="h-10 border-border bg-muted/30 font-mono text-[13px] uppercase font-bold"
                                                            placeholder="ENTER 15 DIGIT GSTIN"
                                                            {...field}
                                                            maxLength={15}
                                                            onChange={e => field.onChange(e.target.value.toUpperCase())}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {watch("vendor_account_group").startsWith("V010") && (
                                        <FormField
                                            control={form.control}
                                            name="employee_number"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Employee Number <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className="h-10 border-border bg-muted/30 text-[13px] font-bold"
                                                            placeholder="ENTER EMPLOYEE NUMBER"
                                                            {...field}
                                                            maxLength={4}
                                                            onChange={e => field.onChange(e.target.value.replace(/[^0-9]/g, ""))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Footer Buttons: Clean and Compact */}
                            <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                                <Button type="button" variant="ghost" className="px-10 h-9 transition-colors hover:bg-muted font-bold text-xs opacity-70 hover:opacity-100" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="px-14 h-9 bg-btn-primary hover:bg-btn-primary/90 text-white font-bold text-xs uppercase tracking-widest shadow-none" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "NEXT STEP"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default VendorFormStep1;

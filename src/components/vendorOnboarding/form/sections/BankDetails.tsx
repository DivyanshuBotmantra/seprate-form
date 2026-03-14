import { useFormContext } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import FormInputWrapper from "../FormInputWrapper";
import { useEffect, useState } from "react";
import { isBankDetailsMandatory } from "@/components/vendor/lov-utils";

const BankDetails = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { control, watch, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();
    const [showWarnings, setShowWarnings] = useState(false);

    // Watch fields for conditional logic
    const vendorAccountGroup = watch("vendor_details.vendor_account_group");
    const ifscCode = watch("bank_details.bank_key_ifsc_code");

    // Determine if bank details are mandatory for this group
    const isBankMandatory = isBankDetailsMandatory(
        vendorAccountGroup || "",
        lovData?.vendorAccPlanningGroup || []
    );

    // Derived mandatory status for child fields
    const isChildFieldMandatory = !!ifscCode || isBankMandatory;
    const isChildFieldDisabled = !ifscCode && !isBankMandatory;

    // Auto-fill effects
    useEffect(() => {
        if (ifscCode && ifscCode.length > 0) {
            setValue("bank_details.bank_country_key", "IN", { shouldValidate: true });
            setValue("bank_details.partner_bank_type", "0000", { shouldValidate: true });
            setShowWarnings(false);
        } else {
            setValue("bank_details.bank_country_key", "", { shouldValidate: true });
            setValue("bank_details.partner_bank_type", "", { shouldValidate: true });
        }
    }, [ifscCode, setValue]);

    // Formatters
    const formatAccountHolderName = (val: string) => {
        // Alphanumeric, spaces, and dots
        const sanitized = val.replace(/[^a-zA-Z0-9\s.]/g, "");
        // Title Case
        return sanitized.replace(/\b([a-zA-Z])(\w*)/g, (_, first, rest) =>
            first.toUpperCase() + rest.toLowerCase()
        );
    };

    const formatAccountNumber = (val: string) => val.replace(/[^a-zA-Z0-9]/g, "");

    const handleDisabledClick = () => {
        if (isChildFieldDisabled) setShowWarnings(true);
    };

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Banking Information</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                    {/* IFSC Code */}
                    <FormField 
                        control={control} 
                        name="bank_details.bank_key_ifsc_code" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Bank Key (IFSC Code)"
                                required={isBankMandatory}
                                error={fieldState.error}
                                helperText={isBankMandatory ? "⚓ Bank details are mandatory for this group" : "11 characters (e.g., SBIN0005943)"}
                            >
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Enter IFSC code" 
                                        readOnly={isReadOnly}
                                        className={`h-10 font-bold font-mono text-[13px] uppercase ${isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`} 
                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                                        maxLength={11} 
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Account Number */}
                    <FormField 
                        control={control} 
                        name="bank_details.bank_account_number" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Bank Account Number"
                                required={isChildFieldMandatory}
                                error={fieldState.error}
                                helperText={!ifscCode && !isBankMandatory && showWarnings ? "⚠️ Enter IFSC Code first to enable this field" : undefined}
                            >
                                <FormControl onClick={handleDisabledClick}>
                                    <Input 
                                        {...field} 
                                        placeholder={isChildFieldDisabled ? "Enter IFSC first" : "Enter account number"} 
                                        disabled={isChildFieldDisabled || isReadOnly}
                                        className={`h-10 font-bold text-[13px] ${isChildFieldDisabled || isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`} 
                                        onChange={(e) => field.onChange(formatAccountNumber(e.target.value))}
                                        maxLength={18}
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Account Holder Name */}
                    <FormField 
                        control={control} 
                        name="bank_details.account_holder_name" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Account Holder Name"
                                required={isChildFieldMandatory}
                                error={fieldState.error}
                            >
                                <FormControl onClick={handleDisabledClick}>
                                    <Input 
                                        {...field} 
                                        placeholder={isChildFieldDisabled ? "Enter IFSC first" : "Name as per bank records"} 
                                        disabled={isChildFieldDisabled || isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isChildFieldDisabled || isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`} 
                                        onChange={(e) => field.onChange(formatAccountHolderName(e.target.value))}
                                        maxLength={60}
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Bank Country (ReadOnly Auto-fill) */}
                    <FormField 
                        control={control} 
                        name="bank_details.bank_country_key" 
                        render={({ field }) => (
                            <FormInputWrapper 
                                label="Bank Country"
                                helperText="Auto-filled 'IN' for Indian Banking"
                            >
                                <FormControl>
                                    <Input 
                                        {...field}
                                        value={field.value || ""}
                                        readOnly
                                        placeholder="Auto-fills 'IN'"
                                        className="h-10 font-semibold text-[13px] bg-muted cursor-not-allowed border-dashed"
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Partner Bank Type (ReadOnly Auto-fill) */}
                    <FormField 
                        control={control} 
                        name="bank_details.partner_bank_type" 
                        render={({ field }) => (
                            <FormInputWrapper 
                                label="Partner Bank Type"
                                helperText="Standard bank type '0000'"
                            >
                                <FormControl>
                                    <Input 
                                        {...field}
                                        value={field.value || ""}
                                        readOnly
                                        placeholder="Auto-fills '0000'"
                                        className="h-10 font-semibold text-[13px] bg-muted cursor-not-allowed border-dashed"
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />
                </div>
            </CardContent>
        </>
    );
};
export default BankDetails;

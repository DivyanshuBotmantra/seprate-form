import { useFormContext } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import FormInputWrapper from "../FormInputWrapper";
import { useEffect, useState, useRef } from "react";
import { isBankDetailsMandatory } from "@/components/vendor/lov-utils";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    const FileInputWrapper = ({ 
        attachmentName,
        children, 
        isDisabled,
        label,
        isRequired,
        error,
        attachmentError
    }: { 
        attachmentName: keyof VendorFormValues['attachments'], 
        children: React.ReactNode,
        isDisabled: boolean,
        label: string,
        isRequired?: boolean,
        error?: any,
        attachmentError?: any
    }) => {
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [isUploading, setIsUploading] = useState(false);
        const attachment = watch(`attachments.${attachmentName}` as any);
        const ifscValue = watch("bank_details.bank_key_ifsc_code");
        
        const isMandatory = isBankMandatory || (!!ifscValue && ifscValue.length >= 11);
        const showUploadIcon = isMandatory || !!ifscValue;

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
                // Mock upload
                await new Promise(resolve => setTimeout(resolve, 800));
                const mockUrl = URL.createObjectURL(file);
                
                setValue(`attachments.${attachmentName}` as any, {
                    file_name: file.name,
                    file_type: file.type,
                    file_url: mockUrl,
                }, { shouldValidate: true });
                
                toast.success("Bank document attached successfully");
            } catch (error) {
                toast.error("Upload failed");
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };

        const removeFile = () => {
            setValue(`attachments.${attachmentName}` as any, null, { shouldValidate: true });
        };

        return (
            <FormInputWrapper 
                label={label}
                required={isRequired}
                error={attachmentError || error}
                fileName={attachment?.file_name}
                fileUrl={attachment?.file_url}
                helperText={!attachment?.file_name && showUploadIcon && !isDisabled && !isReadOnly ? 
                    (isMandatory ? "⚓ Bank details document is mandatory" : "📎 File upload optional") : undefined}
            >
                <div className="relative">
                    {children}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf" 
                            onChange={handleFileChange}
                        />
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            showUploadIcon && (
                                <Upload 
                                    className={`h-4 w-4 cursor-pointer transition-colors ${
                                        isDisabled ? "opacity-30 cursor-not-allowed" : 
                                        isMandatory && !attachment?.file_name ? "text-red-500 hover:text-red-600" : "text-primary hover:text-primary/80"
                                    }`}
                                    onClick={() => !isDisabled && fileInputRef.current?.click()}
                                />
                            )
                        )}
                        {attachment?.file_name && !isReadOnly && !isDisabled && (
                            <X 
                                className="h-3.5 w-3.5 cursor-pointer text-red-500 hover:text-red-600 transition-colors ml-1" 
                                onClick={removeFile}
                            />
                        )}
                    </div>
                </div>
            </FormInputWrapper>
        );
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
                        render={({ field, fieldState }) => {
                            const { formState: { errors } } = useFormContext<VendorFormValues>();
                            return (
                                <FileInputWrapper 
                                    attachmentName="bank_details_attachment" 
                                    isDisabled={isReadOnly}
                                    label="Bank Key (IFSC Code)"
                                    isRequired={isBankMandatory}
                                    error={fieldState.error}
                                    attachmentError={errors.attachments?.bank_details_attachment}
                                >
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            placeholder="Enter IFSC Code (e.g., SBIN0005943)" 
                                            readOnly={isReadOnly}
                                            className={`h-10 font-bold font-mono text-[13px] uppercase pr-10 ${isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`} 
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                                            maxLength={11} 
                                        />
                                    </FormControl>
                                </FileInputWrapper>
                            );
                        }} 
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
                                        placeholder={isChildFieldDisabled ? "Enter IFSC Code first" : "Enter Bank Account Number"} 
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
                                        placeholder={isChildFieldDisabled ? "Enter IFSC Code first" : "Enter Account Holder Name"} 
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
                                        placeholder={ifscCode ? "IN (auto-filled)" : "Auto-fills when IFSC entered"}
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
                                        placeholder={ifscCode ? "0000 (auto-filled)" : "Auto-fills when IFSC entered"}
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

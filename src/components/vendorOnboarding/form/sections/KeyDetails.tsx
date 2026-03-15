import { useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import FormInputWrapper from "../FormInputWrapper";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { toast } from "sonner";
import SearchableSelect from "@/components/common/search-select";

// Validation helper logic derived from KeyDetailsSection.tsx
const validatePAN = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
const validateGSTIN = (gstin: string) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(gstin);
const validateMSME = (msme: string) => /^[A-Za-z]{2}-\d{2}-\d{7}$/i.test(msme);
const validateCIN = (cin: string, pan: string) => {
    const fourthChar = pan?.[3]?.toUpperCase();
    if (fourthChar === 'C') return /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin);
    if (fourthChar === 'F') return /^[A-Z]{3}-[0-9]{1,5}$/.test(cin);
    return false;
};

const isFileUploadMandatory = (field: string, value: string, panNumber?: string): boolean => {
    if (!value || value.trim() === "" || value.toUpperCase() === "NA") return false;
    if (field === "pan_aadhar_linked_status") return value === "1";
    
    switch (field) {
        case "gstin": return validateGSTIN(value);
        case "pan_number": return validatePAN(value);
        case "msme_number": return validateMSME(value);
        case "cin_number": return panNumber ? validateCIN(value, panNumber) : false;
        default: return false;
    }
};

const shouldShowFileUpload = (value: string): boolean => {
    if (!value || value.trim() === "" || value.toUpperCase() === "NA") return false;
    return true;
};

const KeyDetails = ({ isReadOnly = false, isStep1ReadOnly = false }: { isReadOnly?: boolean; isStep1ReadOnly?: boolean }) => {
    const { control, watch, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();
    
    // Watch relevant fields for logic
    const panNumber = watch("key_details.pan_number");
    const gstin = watch("key_details.gstin");
    const typeOfVendor = watch("type_of_vendor");
    const gstinRequirement = watch("key_details.gstin_requirement");
    const name1 = watch("vendor_details.name1");
    const name2 = watch("vendor_details.name2");

    const fourthChar = panNumber?.[3]?.toUpperCase();
    const isCompany = fourthChar === 'C';
    const isFirm = fourthChar === 'F';
    const isPerson = fourthChar === 'P';
    const isEmployee = typeOfVendor === "Employee" || typeOfVendor === "FK01";

    const hasLLP = `${name1 || ""} ${name2 || ""}`.toLowerCase().includes("llp");
    const isCinMandatory = isCompany || (isFirm && hasLLP);

    // Auto-calculate PAN from GSTIN
    useEffect(() => {
        if (isStep1ReadOnly) return;
        if (gstin && gstin.length >= 12) {
            const extractedPan = gstin.substring(2, 12).toUpperCase();
            if (extractedPan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
                setValue("key_details.pan_number", extractedPan, { shouldValidate: true });
            }
        }
    }, [gstin, isStep1ReadOnly, setValue]);

    // Auto-calculate PAN Aadhar Linked Status
    useEffect(() => {
        if (isReadOnly) return;
        
        let status = "2"; // Not Applicable
        if (isEmployee || isPerson) {
            status = "1"; // Linked
        }
        
        setValue("key_details.pan_aadhar_linked_status", status);
    }, [panNumber, isEmployee, isPerson, isReadOnly, setValue]);

    // Auto-select MSME Status and CIN for Employees
    useEffect(() => {
        if (isReadOnly) return;
        if (isEmployee) {
            // Find Z002 (Non-MSME)
            const nonMsmeValue = lovData?.reMSMEStatus?.find(opt => opt.value.startsWith("Z002"))?.value || "Z002-Non-MSMED";
            setValue("key_details.msme_status", nonMsmeValue);
            setValue("key_details.credit_information_number_msme", "NA");
            setValue("key_details.cin_number", "NA");
        }
    }, [isEmployee, lovData, isReadOnly, setValue]);

    // Handle CIN formatting for LLP
    const handleCINChange = (val: string) => {
        if (isFirm) {
            // Format: AAG-12345
            const cleaned = val.replace(/[^A-Z0-9]/gi, "").toUpperCase();
            let letters = cleaned.slice(0, 3).replace(/[^A-Z]/g, "");
            let digits = cleaned.slice(letters.length).replace(/[^0-9]/g, "").slice(0, 5);
            
            let formatted = letters;
            if (letters.length === 3 && digits.length > 0) {
                formatted += "-" + digits;
            } else if (letters.length === 3 && val.includes("-")) {
                formatted += "-";
            }
            setValue("key_details.cin_number", formatted);
        } else {
            setValue("key_details.cin_number", val.toUpperCase());
        }
    };

    const FileInputWrapper = ({ 
        attachmentName,
        fieldName,
        children, 
        isDisabled,
        label,
        isRequired,
        error,
        attachmentError
    }: { 
        attachmentName: keyof VendorFormValues['attachments'], 
        fieldName: string,
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
        const fieldValue = watch(`key_details.${fieldName}` as any) || "";

        const isMandatory = isFileUploadMandatory(fieldName, fieldValue, panNumber);
        const showUploadIcon = shouldShowFileUpload(fieldValue);

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
                
                toast.success("File attached successfully");
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
                    (isMandatory ? "⚓ File upload required" : "📎 File upload optional") : undefined}
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
                <CardTitle className="text-base font-bold">Key Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                    {/* Row 1: GSTIN & PAN */}
                    <FormField
                        control={control}
                        name="key_details.gstin"
                        render={({ field, fieldState }) => {
                            const { formState: { errors } } = useFormContext<VendorFormValues>();
                            return (
                                <FileInputWrapper 
                                    attachmentName="gstin_attachment" 
                                    fieldName="gstin" 
                                    isDisabled={isStep1ReadOnly}
                                    label="Tax Number 3 (GSTIN)"
                                    isRequired={gstinRequirement === "Registered"}
                                    error={fieldState.error}
                                    attachmentError={errors.attachments?.gstin_attachment}
                                >
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter GSTIN Number" 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isStep1ReadOnly} 
                                            className={`h-10 font-bold font-mono text-[13px] pr-10 ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={15} 
                                        />
                                    </FormControl>
                                </FileInputWrapper>
                            );
                        }}
                    />

                    <FormField
                        control={control}
                        name="key_details.pan_number"
                        render={({ field, fieldState }) => {
                            const { formState: { errors } } = useFormContext<VendorFormValues>();
                            return (
                                <FileInputWrapper 
                                    attachmentName="pan_attachment" 
                                    fieldName="pan_number" 
                                    isDisabled={isStep1ReadOnly}
                                    label="PAN Number"
                                    isRequired={true}
                                    error={fieldState.error}
                                    attachmentError={errors.attachments?.pan_attachment}
                                >
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter PAN Number" 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isStep1ReadOnly} 
                                            className={`h-10 font-bold font-mono text-[13px] pr-10 ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={10} 
                                        />
                                    </FormControl>
                                </FileInputWrapper>
                            );
                        }}
                    />

                    {/* Row 2: CIN Number & MSME Status */}
                    <FormField
                        control={control}
                        name="key_details.cin_number"
                        render={({ field, fieldState }) => {
                            const { formState: { errors } } = useFormContext<VendorFormValues>();
                            return (
                                <FileInputWrapper 
                                    attachmentName="cin_attachment" 
                                    fieldName="cin_number" 
                                    isDisabled={isReadOnly || isEmployee}
                                    label="CIN Number"
                                    isRequired={isCinMandatory}
                                    error={fieldState.error}
                                    attachmentError={errors.attachments?.cin_attachment}
                                >
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter CIN Number" 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isReadOnly || isEmployee}
                                            onChange={(e) => handleCINChange(e.target.value)}
                                            className={`h-10 font-bold font-mono text-[13px] pr-10 ${(isReadOnly || isEmployee) ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={isCompany ? 21 : (isFirm ? 9 : 21)}
                                        />
                                    </FormControl>
                                </FileInputWrapper>
                            );
                        }}
                    />

                    <FormField
                        control={control}
                        name="key_details.msme_status"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="MSME Status"
                                required
                                error={fieldState.error}
                            >
                                <SearchableSelect
                                    options={lovData?.reMSMEStatus || []}
                                    value={field.value || ""}
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        if (val.startsWith("Z002")) setValue("key_details.credit_information_number_msme", "NA");
                                    }}
                                    disabled={isReadOnly}
                                    placeholder="Choose MSME status"
                                    searchPlaceholder="Search MSME status..."
                                />
                            </FormInputWrapper>
                        )}
                    />

                    {/* Row 3: PAN Aadhar Linked Status & MSME Number */}
                    <FormField
                        control={control}
                        name="key_details.pan_aadhar_linked_status"
                        render={({ field, fieldState }) => {
                            const { formState: { errors } } = useFormContext<VendorFormValues>();
                            return (
                                <FileInputWrapper 
                                    attachmentName="pan_aadhar_linkage_attachment" 
                                    fieldName="pan_aadhar_linked_status" 
                                    isDisabled={isReadOnly || isEmployee}
                                    label="PAN Aadhar Linked Status"
                                    isRequired={true}
                                    error={fieldState.error}
                                    attachmentError={errors.attachments?.pan_aadhar_linkage_attachment}
                                >
                                    <FormControl>
                                        <Input 
                                            value={field.value === "1" ? "1 - Pan and Aadhar Linked" : (field.value === "2" ? "2 - Not Applicable" : "")} 
                                            readOnly 
                                            placeholder="Auto-calculated"
                                            className={`h-10 font-semibold text-[13px] pr-10 bg-muted cursor-not-allowed`} 
                                        />
                                    </FormControl>
                                </FileInputWrapper>
                            );
                        }}
                    />

                    <FormField
                        control={control}
                        name="key_details.credit_information_number_msme"
                        render={({ field, fieldState }) => {
                            const { formState: { errors } } = useFormContext<VendorFormValues>();
                            const currentMsmeStatus = watch("key_details.msme_status");
                            const isNonMsme = currentMsmeStatus?.startsWith("Z002");
                            return (
                                <FileInputWrapper 
                                    attachmentName="msme_attachment" 
                                    fieldName="msme_number" 
                                    isDisabled={!!(isReadOnly || isNonMsme)}
                                    label="Credit Information Number (MSME)"
                                    isRequired={!isNonMsme}
                                    error={fieldState.error}
                                    attachmentError={errors.attachments?.msme_attachment}
                                >
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter MSME Certificate Number" 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isReadOnly || isNonMsme}
                                            className={`h-10 font-bold font-mono text-[13px] pr-10 ${(isReadOnly || isNonMsme) ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={13}
                                        />
                                    </FormControl>
                                </FileInputWrapper>
                            );
                        }}
                    />
                </div>
            </CardContent>
        </>
    );
};

export default KeyDetails;

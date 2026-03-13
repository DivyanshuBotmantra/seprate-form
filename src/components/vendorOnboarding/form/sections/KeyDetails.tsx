import { useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2, Paperclip, CheckCircle2 } from "lucide-react";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { toast } from "sonner";

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
    const msmeStatus = watch("key_details.msme_status");
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

    // Helper for Inline File Field
    const FileInputWrapper = ({ 
        attachmentName,
        fieldName,
        children, 
        isDisabled 
    }: { 
        attachmentName: keyof VendorFormValues['attachments'], 
        fieldName: string,
        children: React.ReactNode,
        isDisabled: boolean
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
            <div className="space-y-1">
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
                    </div>
                </div>
                
                {/* File Status / Display Area */}
                <div className="min-h-[20px] flex items-center mt-1">
                    {attachment?.file_name ? (
                        <div className="flex items-center gap-2 group">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-[12px] text-green-600 font-medium truncate max-w-[200px]">{attachment.file_name}</span>
                            {!isReadOnly && !isDisabled && (
                                <X 
                                    className="h-3.5 w-3.5 cursor-pointer text-red-500 hover:text-red-600 transition-colors ml-1" 
                                    onClick={removeFile}
                                />
                            )}
                        </div>
                    ) : (
                        showUploadIcon && !isDisabled && !isReadOnly && (
                            <div className="flex items-center gap-1.5 text-muted-foreground/80">
                                <Paperclip className="h-3 w-3" />
                                <p className="text-[11px] italic">
                                    {isMandatory ? "File upload required" : "File upload optional"}
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Key Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start">
                    {/* Top Row: GSTIN (Left) & PAN Number (Right) */}
                    <FormField
                        control={control}
                        name="key_details.gstin"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                <FormLabel className="text-[13px] font-semibold text-foreground">
                                    Tax Number 3 (GSTIN) 
                                    {gstinRequirement === "Registered" && <span className="text-red-500 ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                    <FileInputWrapper attachmentName="gstin_attachment" fieldName="gstin" isDisabled={isStep1ReadOnly}>
                                        <Input 
                                            placeholder="Enter GSTIN Number" 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isStep1ReadOnly} 
                                            className={`h-10 font-semibold text-[13px] pr-10 ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={15} 
                                        />
                                    </FileInputWrapper>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.pan_number"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                <FormLabel className="text-[13px] font-semibold text-foreground">
                                    PAN Number <span className="text-red-500 ml-1">*</span>
                                </FormLabel>
                                <FormControl>
                                    <FileInputWrapper attachmentName="pan_attachment" fieldName="pan_number" isDisabled={isStep1ReadOnly}>
                                        <Input 
                                            placeholder="Enter PAN Number" 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isStep1ReadOnly} 
                                            className={`h-10 font-semibold text-[13px] pr-10 ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={10} 
                                        />
                                    </FileInputWrapper>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    {/* Middle Row: CIN Number (Left) & MSME Status (Right) */}
                    <FormField
                        control={control}
                        name="key_details.cin_number"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                <FormLabel className="text-[13px] font-semibold text-foreground">
                                    CIN Number {isCinMandatory && <span className="text-red-500 ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                    <FileInputWrapper attachmentName="cin_attachment" fieldName="cin_number" isDisabled={isReadOnly || isEmployee}>
                                        <Input 
                                            placeholder={isFirm ? "AAG-12345" : (isCompany ? "L12345MH2024PLC123456" : "NA")} 
                                            {...field} 
                                            value={field.value || ""}
                                            readOnly={isReadOnly || isEmployee}
                                            onChange={(e) => handleCINChange(e.target.value)}
                                            className={`h-10 font-semibold text-[13px] pr-10 ${(isReadOnly || isEmployee) ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                            maxLength={isCompany ? 21 : (isFirm ? 9 : 21)}
                                        />
                                    </FileInputWrapper>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.msme_status"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                <FormLabel className="text-[13px] font-semibold text-foreground">MSME Status <span className="text-red-500 ml-1">*</span></FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    if (val.startsWith("Z002")) setValue("key_details.credit_information_number_msme", "NA");
                                }} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.reMSMEStatus || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    {/* Bottom Row: PAN Aadhar Linked Status (Left) & MSME Number (Right) */}
                    <FormField
                        control={control}
                        name="key_details.pan_aadhar_linked_status"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                <FormLabel className="text-[13px] font-semibold text-foreground">PAN Aadhar Linked Status <span className="text-red-500 ml-1">*</span></FormLabel>
                                <FormControl>
                                    <FileInputWrapper attachmentName="pan_aadhar_linkage_attachment" fieldName="pan_aadhar_linked_status" isDisabled={isReadOnly}>
                                        <Input 
                                            value={field.value === "1" ? "1 - Pan and Aadhar Linked" : (field.value === "2" ? "2 - Not Applicable" : "")} 
                                            readOnly 
                                            placeholder="Auto-calculated"
                                            className="h-10 font-semibold text-[13px] bg-muted cursor-not-allowed" 
                                        />
                                    </FileInputWrapper>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.credit_information_number_msme"
                        render={({ field }) => {
                            const isNonMsme = msmeStatus?.startsWith("Z002");
                            return (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">
                                        Credit Information Number (MSME) {!isNonMsme && <span className="text-red-500 ml-1">*</span>}
                                    </FormLabel>
                                    <FormControl>
                                        <FileInputWrapper attachmentName="msme_attachment" fieldName="msme_number" isDisabled={!!(isReadOnly || isNonMsme)}>
                                            <Input 
                                                placeholder={isNonMsme ? "NA" : "Enter 13 digits MSME number (eg. XY-12-5643256)"} 
                                                {...field} 
                                                value={field.value || ""}
                                                readOnly={isReadOnly || isNonMsme}
                                                className={`h-10 font-semibold text-[13px] pr-10 ${(isReadOnly || isNonMsme) ? "bg-muted cursor-not-allowed" : ""} uppercase`} 
                                                maxLength={13}
                                            />
                                        </FileInputWrapper>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            );
                        }}
                    />
                </div>
            </CardContent>
        </>
    );
};

export default KeyDetails;

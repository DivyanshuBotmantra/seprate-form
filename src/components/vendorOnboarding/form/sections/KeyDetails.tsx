import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";

const KeyDetails = ({ isReadOnly = false, isStep1ReadOnly = false }: { isReadOnly?: boolean; isStep1ReadOnly?: boolean }) => {
    const { control, watch } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();
    
    const pan = watch("key_details.pan_number");
    const fourthChar = pan?.[3]?.toUpperCase();
    const isCompany = fourthChar === 'C';

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Key Identifiers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 items-start">
                    <FormField
                        control={control}
                        name="key_details.pan_number"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">PAN Number <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="ABCDE1234F" 
                                        {...field} 
                                        readOnly={isStep1ReadOnly} 
                                        className={`h-10 font-semibold text-[13px] ${isStep1ReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""} uppercase`} 
                                        maxLength={10} 
                                    />
                                </FormControl>
                                <FormDescription className="text-[10px] text-muted-foreground mt-0">Format: 5 letters, 4 numbers, 1 letter (Auto-filled from Step 1)</FormDescription>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.gstin"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">GSTIN</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="27AAAAA0000A1Z5" 
                                        {...field} 
                                        readOnly={isStep1ReadOnly} 
                                        className={`h-10 font-semibold text-[13px] ${isStep1ReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""} uppercase`} 
                                        maxLength={15} 
                                    />
                                </FormControl>
                                <FormDescription className="text-[10px] text-muted-foreground mt-0">(Auto-filled from Step 1)</FormDescription>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.cin_number"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">CIN Number {isCompany && <span className="text-red-500">*</span>}</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="L12345MH2024PLC123456" 
                                        {...field} 
                                        readOnly={isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""}`} 
                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                                    />
                                </FormControl>
                                {isCompany && <FormDescription className="text-[10px] text-amber-600 font-medium mt-0">Mandatory for Companies (PAN 4th char is C)</FormDescription>}
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.msme_status"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">MSME Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.reMSMEStatus || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                        <SelectItem value="NA" className="text-[13px]">Non-MSME</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="key_details.credit_information_number_msme"
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">MSME Udyam Number</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="UDYAM-XX-00-0000000" 
                                        {...field} 
                                        readOnly={isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""}`} 
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </>
    );
};

export default KeyDetails;

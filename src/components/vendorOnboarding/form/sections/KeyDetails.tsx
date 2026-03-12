import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";

const KeyDetails = () => {
    const { control, watch } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();
    
    const pan = watch("key_details.pan_number");
    const fourthChar = pan?.[3]?.toUpperCase();
    const isCompany = fourthChar === 'C';

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Key Identifiers</h3>
            
            <FormField
                control={control}
                name="key_details.pan_number"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>PAN Number *</FormLabel>
                        <FormControl>
                            <Input placeholder="ABCDE1234F" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={10} />
                        </FormControl>
                        <FormDescription>Format: 5 letters, 4 totals, 1 letter</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="key_details.gstin"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                            <Input placeholder="27AAAAA0000A1Z5" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={15} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="key_details.cin_number"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>CIN Number {isCompany && "*"}</FormLabel>
                        <FormControl>
                            <Input placeholder="L12345MH2024PLC123456" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        {isCompany && <FormDescription className="text-amber-600 font-medium">Mandatory for Companies (PAN 4th char is C)</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="key_details.msme_status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>MSME Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {(lovData?.reMSMEStatus || []).map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                                <SelectItem value="NA">Non-MSME</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="key_details.credit_information_number_msme"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>MSME Udyam Number</FormLabel>
                        <FormControl>
                            <Input placeholder="UDYAM-XX-00-0000000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

export default KeyDetails;

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";

const BankDetails = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { control } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Banking Information</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 items-start">
                    <FormField 
                        control={control} 
                        name="bank_details.bank_key_ifsc_code" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">IFSC Code</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="ABCD0123456" 
                                        readOnly={isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""}`} 
                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                                        maxLength={11} 
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="bank_details.bank_account_number" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Account Number</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Enter account number" 
                                        readOnly={isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""}`} 
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="bank_details.account_holder_name" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Account Holder Name</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Name as per bank records" 
                                        readOnly={isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed pointer-events-none" : ""}`} 
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="bank_details.bank_country_key" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Bank Country</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.countryOptions || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] absolute bottom-0 left-0" />
                            </FormItem>
                        )} 
                    />
                </div>
            </CardContent>
        </>
    );
};
export default BankDetails;

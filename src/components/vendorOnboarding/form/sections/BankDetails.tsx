import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";

const BankDetails = () => {
    const { control } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Banking Information</h3>
            
            <FormField 
                control={control} 
                name="bank_details.bank_key_ifsc_code" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="ABCD0123456" onChange={(e) => field.onChange(e.target.value.toUpperCase())} maxLength={11} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} 
            />

            <FormField 
                control={control} 
                name="bank_details.bank_account_number" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Enter account number" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} 
            />

             <FormField 
                control={control} 
                name="bank_details.account_holder_name" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Name as per bank records" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} 
            />

            <FormField 
                control={control} 
                name="bank_details.bank_country_key" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bank Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {(lovData?.countryOptions || []).map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} 
            />
        </div>
    );
};
export default BankDetails;

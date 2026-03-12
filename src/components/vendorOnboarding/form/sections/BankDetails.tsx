import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { VendorFormValues } from "../schema";

const BankDetails = () => {
    const { control } = useFormContext<VendorFormValues>();
    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Banking Information</h3>
            <FormField control={control} name="bank_details.bank_key_ifsc_code" render={({ field }) => (
                <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} placeholder="ABCD0123456" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="bank_details.bank_account_number" render={({ field }) => (
                <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={control} name="bank_details.account_holder_name" render={({ field }) => (
                <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
    );
};
export default BankDetails;

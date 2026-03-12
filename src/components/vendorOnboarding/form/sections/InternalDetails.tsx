import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { VendorFormValues } from "../schema";

const InternalDetails = () => {
    const { control } = useFormContext<VendorFormValues>();
    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Internal Finance Details</h3>
            <FormField control={control} name="internal_details.purchase_order_currency" render={({ field }) => (
                <FormItem><FormLabel>Purchase Order Currency *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="internal_details.reconciliation_account_in_general_ledger" render={({ field }) => (
                <FormItem><FormLabel>GL Recon Account *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={control} name="internal_details.purchasing_organization" render={({ field }) => (
                <FormItem><FormLabel>Purchasing Organization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
    );
};
export default InternalDetails;

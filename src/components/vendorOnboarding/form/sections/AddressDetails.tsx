import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { VendorFormValues } from "../schema";

const AddressDetails = () => {
    const { control } = useFormContext<VendorFormValues>();
    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Communication Address</h3>
            <FormField control={control} name="address_details.street" render={({ field }) => (
                <FormItem><FormLabel>Street/House No *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="address_details.city" render={({ field }) => (
                <FormItem><FormLabel>City *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="address_details.city_postal_code" render={({ field }) => (
                <FormItem><FormLabel>Post Code *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={control} name="address_details.region" render={({ field }) => (
                <FormItem><FormLabel>Region/State *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
    );
};
export default AddressDetails;

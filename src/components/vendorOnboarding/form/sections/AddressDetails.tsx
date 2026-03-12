import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { getRegionsForCountry } from "../../utils/lov-utils";

const AddressDetails = () => {
    const { control, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    // Watch country to filter regions
    const countryKey = useWatch({ control, name: "address_details.country_key" });

    const filteredRegions = getRegionsForCountry(
        countryKey || "", 
        lovData?.countryRegionMapping || []
    );

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2 text-primary">Communication Address</h3>
            
            <FormField control={control} name="address_details.street" render={({ field }) => (
                <FormItem><FormLabel>Street/House No *</FormLabel><FormControl><Input placeholder="Building, Street name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={control} name="address_details.city" render={({ field }) => (
                <FormItem><FormLabel>City *</FormLabel><FormControl><Input placeholder="City name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={control} name="address_details.city_postal_code" render={({ field }) => (
                <FormItem><FormLabel>Post Code *</FormLabel><FormControl><Input placeholder="6-digit ZIP" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={control} name="address_details.country_key" render={({ field }) => (
                <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select 
                        onValueChange={(val) => {
                            field.onChange(val);
                            setValue("address_details.region", ""); // Reset region on country change
                        }} 
                        value={field.value || ""}
                    >
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
            )} />

            <FormField control={control} name="address_details.region" render={({ field }) => (
                <FormItem>
                    <FormLabel>Region/State *</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        disabled={!countryKey}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={countryKey ? "Select state" : "Select country first"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {filteredRegions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );
};
export default AddressDetails;

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { getRegionsForCountry } from "@/components/vendorOnboarding/utils/lov-utils";

const AddressDetails = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { control, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    // Watch country to filter regions
    const countryKey = useWatch({ control, name: "address_details.country_key" });

    const filteredRegions = getRegionsForCountry(
        countryKey || "", 
        lovData?.countryRegionMapping || []
    );

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Communication Address</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 items-start">
                    <FormField 
                        control={control} 
                        name="address_details.street" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Street/House No *</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Building, Street name" 
                                        {...field} 
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
                        name="address_details.city" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">City *</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="City name" 
                                        {...field} 
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
                        name="address_details.city_postal_code" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Post Code *</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="6-digit ZIP" 
                                        {...field} 
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
                        name="address_details.country_key" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Country *</FormLabel>
                                <Select 
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        setValue("address_details.region", ""); // Reset region on country change
                                    }} 
                                    value={field.value || ""}
                                    disabled={isReadOnly}
                                >
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

                    <FormField 
                        control={control} 
                        name="address_details.region" 
                        render={({ field }) => (
                            <FormItem className="w-full flex flex-col justify-start gap-1.5 relative pb-4">
                                <FormLabel className="text-sm font-medium text-foreground">Region/State *</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value || ""}
                                    disabled={isReadOnly || !countryKey}
                                >
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly || !countryKey ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder={countryKey ? "Select state" : "Select country first"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredRegions.map(opt => (
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
export default AddressDetails;

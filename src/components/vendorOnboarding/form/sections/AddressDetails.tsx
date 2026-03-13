import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { getRegionsForCountry } from "@/components/vendorOnboarding/utils/lov-utils";

const AddressDetails = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { control, setValue, trigger } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    // Watch fields for logic
    const countryKey = useWatch({ control, name: "address_details.country_key" });
    const vendorAccountGroup = useWatch({ control, name: "vendor_details.vendor_account_group" });
    const region = useWatch({ control, name: "address_details.region" });

    const isForeign = !!vendorAccountGroup?.toLowerCase().includes("foreign");

    // Filtered regions memo
    const filteredRegions = useMemo(() => {
        return getRegionsForCountry(
            countryKey || "", 
            lovData?.countryRegionMapping || []
        );
    }, [countryKey, lovData?.countryRegionMapping]);

    // 1. Auto-set Country Key logic - Optimized to avoid fighting with manual selection
    useEffect(() => {
        if (isReadOnly || !vendorAccountGroup) return;

        if (!isForeign) {
            // Domestic: Force IN
            if (countryKey !== "IN") {
                setValue("address_details.country_key", "IN", { shouldValidate: true });
            }
        } else if (isForeign && countryKey === "IN") {
            // Foreign: If it was set to IN (default/prev), clear it to allow foreign selection
            // We only do this if it's EXACTLY "IN"
            setValue("address_details.country_key", "", { shouldValidate: true });
        }
    }, [vendorAccountGroup, isForeign, isReadOnly, setValue]); // Removed countryKey from deps to prevent loops

    // 2. Auto-select region if only one exists
    useEffect(() => {
        if (isReadOnly) return;
        if (countryKey && filteredRegions.length === 1) {
            if (region !== filteredRegions[0].value) {
                setValue("address_details.region", filteredRegions[0].value, { shouldValidate: true });
            }
        }
    }, [countryKey, filteredRegions, isReadOnly, region, setValue]);

    // Helper to capitalize first letter of each word
    const formatAddressValue = (value: string) => {
        if (!value) return "";
        return value.replace(/\b([a-zA-Z])(\w*)/g, (_: string, first: string, rest: string) =>
            first.toUpperCase() + rest.toLowerCase()
        );
    };

    const isCountryReadOnly = !!(isReadOnly || (vendorAccountGroup && !isForeign));

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Address Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <FormField 
                            control={control} 
                            name="address_details.street" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Street <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter Street Address" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.street3" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Street 3</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter Street 3 (Optional)" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.street5" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Street 5</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter Street 5 (Optional)" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.city_postal_code" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">City Postal Code <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder={!isForeign ? "Enter 6-digit Postal Code" : "Enter Postal Code"} 
                                            {...field} 
                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            readOnly={isReadOnly}
                                            maxLength={6}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.country_key" 
                            render={({ field }) => {
                                // Find matching value in case API returns full label instead of code
                                const matchingValue = useMemo(() => {
                                    if (!field.value) return "";
                                    const option = lovData?.countryOptions?.find(
                                        opt => opt.value === field.value || opt.label === field.value
                                    );
                                    return option ? option.value : field.value;
                                }, [field.value, lovData?.countryOptions]);

                                return (
                                    <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                        <FormLabel className="text-[13px] font-semibold text-foreground">Country Key <span className="text-red-500">*</span></FormLabel>
                                        <Select 
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                setValue("address_details.region", ""); 
                                                // Explicitly trigger validation to clear any "required" error immediately
                                                trigger("address_details.country_key");
                                            }} 
                                            value={matchingValue || ""}
                                            disabled={isCountryReadOnly}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isCountryReadOnly ? "bg-muted cursor-not-allowed" : ""}`}>
                                                    <SelectValue placeholder="Select Country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(lovData?.countryOptions || []).map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                );
                            }} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.first_mobile_number_dialing_code_plus_number" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">First Mobile No</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter 10-digit mobile number" 
                                            {...field} 
                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            readOnly={isReadOnly}
                                            maxLength={10}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.telephone_dailing" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Telephone Dailing</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter 10-digit telephone number" 
                                            {...field} 
                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            readOnly={isReadOnly}
                                            maxLength={10}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.primary_email" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Primary Email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter primary email address" 
                                            {...field} 
                                            readOnly={isReadOnly}
                                            maxLength={60}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <FormField 
                            control={control} 
                            name="address_details.street2" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Street 2</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter Street 2 (Optional)" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.street4" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Street 4</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter Street 4 (Optional)" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.district" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">District</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter District (Optional)" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.city" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">City <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter City" 
                                            {...field} 
                                            onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                            readOnly={isReadOnly}
                                            maxLength={35}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.region" 
                            render={({ field }) => {
                                const showAsInput = filteredRegions.length === 1 && countryKey;
                                
                                // Find matching value for region
                                const matchingValue = useMemo(() => {
                                    if (!field.value) return "";
                                    const option = filteredRegions.find(
                                        opt => opt.value === field.value || opt.label === field.value
                                    );
                                    return option ? option.value : field.value;
                                }, [field.value, filteredRegions]);

                                return (
                                    <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                        <FormLabel className="text-[13px] font-semibold text-foreground">Region <span className="text-red-500">*</span></FormLabel>
                                        {showAsInput ? (
                                            <FormControl>
                                                <Input 
                                                    value={filteredRegions[0].label}
                                                    readOnly
                                                    className="h-10 font-semibold text-[13px] bg-muted cursor-not-allowed"
                                                />
                                            </FormControl>
                                        ) : (
                                            <Select 
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    trigger("address_details.region");
                                                }} 
                                                value={matchingValue || ""}
                                                disabled={isReadOnly || !countryKey}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly || !countryKey ? "bg-muted cursor-not-allowed" : ""}`}>
                                                        <SelectValue placeholder={countryKey ? "Select Region" : "Select Country first"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {filteredRegions.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                );
                            }} 
                        />

                        <FormField 
                            control={control} 
                            name="address_details.first_telephone" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">First Telephone</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter 10-digit telephone number" 
                                            {...field} 
                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                            readOnly={isReadOnly}
                                            maxLength={10}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />

                        <div className="h-12 hidden md:block"></div>

                        <FormField 
                            control={control} 
                            name="address_details.secondary_email" 
                            render={({ field }) => (
                                <FormItem className="w-full flex flex-col justify-start gap-1.5">
                                    <FormLabel className="text-[13px] font-semibold text-foreground">Secondary Email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter secondary email address" 
                                            {...field} 
                                            readOnly={isReadOnly}
                                            maxLength={60}
                                            className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )} 
                        />
                    </div>
                </div>
            </CardContent>
        </>
    );
};

export default AddressDetails;

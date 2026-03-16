import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { getRegionsForCountry } from "@/components/vendorOnboarding/utils/lov-utils";
import FormInputWrapper from "../FormInputWrapper";
import SearchableSelect from "@/components/common/search-select";

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                    {/* Row 1 */}
                    <FormField 
                        control={control} 
                        name="address_details.street" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Street"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter Street Address" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.street2" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Street 2"
                                error={fieldState.error}
                                helperText="Enter Street 2 (Optional)"
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter Street 2 (Optional)" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 2 */}
                    <FormField 
                        control={control} 
                        name="address_details.street3" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Street 3"
                                error={fieldState.error}
                                helperText="Enter Street 3 (Optional)"
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter Street 3 (Optional)" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.street4" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Street 4"
                                error={fieldState.error}
                                helperText="Enter Street 4 (Optional)"
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter Street 4 (Optional)" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 3 */}
                    <FormField 
                        control={control} 
                        name="address_details.street5" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Street 5"
                                error={fieldState.error}
                                helperText="Enter Street 5 (Optional)"
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter Street 5 (Optional)" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.district" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="District"
                                error={fieldState.error}
                                helperText="Enter District (Optional)"
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter District (Optional)" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 4 */}
                    <FormField 
                        control={control} 
                        name="address_details.city_postal_code" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="City Postal Code"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder={!isForeign ? "Enter 6-digit Postal Code" : "Enter Postal Code"} 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    readOnly={isReadOnly}
                                    maxLength={6}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.city" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="City"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter City" 
                                    {...field} 
                                    onChange={(e) => field.onChange(formatAddressValue(e.target.value))}
                                    readOnly={isReadOnly}
                                    maxLength={35}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 5 */}
                    <FormField 
                        control={control} 
                        name="address_details.country_key" 
                        render={({ field, fieldState }) => {
                            const matchingValue = useMemo(() => {
                                if (!field.value) return "";
                                const option = lovData?.countryOptions?.find(
                                    opt => opt.value === field.value || opt.label === field.value
                                );
                                return option ? option.value : field.value;
                            }, [field.value, lovData?.countryOptions]);

                            return (
                                <FormInputWrapper 
                                    label="Country Key"
                                    required
                                    error={fieldState.error}
                                    isReadOnly={isReadOnly}
                                >
                                    <SearchableSelect
                                        options={lovData?.countryOptions || []}
                                        value={matchingValue || ""}
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            setValue("address_details.region", ""); 
                                            trigger("address_details.country_key");
                                        }}
                                        disabled={isCountryReadOnly}
                                        placeholder="Select Country"
                                        searchPlaceholder="Search countries..."
                                    />
                                </FormInputWrapper>
                            );
                        }} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.region" 
                        render={({ field, fieldState }) => {
                            const showAsInput = filteredRegions.length === 1 && countryKey;
                            const matchingValue = useMemo(() => {
                                if (!field.value) return "";
                                const option = filteredRegions.find(
                                    opt => opt.value === field.value || opt.label === field.value
                                );
                                return option ? option.value : field.value;
                            }, [field.value, filteredRegions]);

                            return (
                                <FormInputWrapper 
                                    label="Region"
                                    required
                                    error={fieldState.error}
                                    isReadOnly={isReadOnly}
                                >
                                    {showAsInput ? (
                                        <FormControl>
                                            <Input 
                                                value={filteredRegions[0]?.label || ""}
                                                readOnly
                                                className="h-10 font-semibold text-[13px] bg-muted cursor-not-allowed"
                                            />
                                        </FormControl>
                                    ) : (
                                        <SearchableSelect
                                            options={filteredRegions}
                                            value={matchingValue || ""}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                trigger("address_details.region");
                                            }}
                                            disabled={isReadOnly || !countryKey}
                                            placeholder={countryKey ? "Select Region" : "Select Country first"}
                                            searchPlaceholder="Search regions..."
                                        />
                                    )}
                                </FormInputWrapper>
                            );
                        }} 
                    />

                    {/* Row 6 */}
                    <FormField 
                        control={control} 
                        name="address_details.first_mobile_number_dialing_code_plus_number" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="First Mobile No"
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter 10-digit mobile number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    readOnly={isReadOnly}
                                    maxLength={10}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.first_telephone" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="First Telephone"
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter 10-digit telephone number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    readOnly={isReadOnly}
                                    maxLength={10}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 7 */}
                    <FormField 
                        control={control} 
                        name="address_details.telephone_dailing" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Telephone Dailing"
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter 10-digit telephone number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    readOnly={isReadOnly}
                                    maxLength={10}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Empty cell for row 7 right alignment */}
                    <div className="hidden md:block"></div>

                    {/* Row 8 */}
                    <FormField 
                        control={control} 
                        name="address_details.primary_email" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Primary Email"
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter primary email address" 
                                    {...field} 
                                    readOnly={isReadOnly}
                                    maxLength={60}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="address_details.secondary_email" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Secondary Email"
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input 
                                    placeholder="Enter secondary email address" 
                                    {...field} 
                                    readOnly={isReadOnly}
                                    maxLength={60}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                />
                            </FormInputWrapper>
                        )} 
                    />
                </div>
            </CardContent>
        </>
    );
};

export default AddressDetails;

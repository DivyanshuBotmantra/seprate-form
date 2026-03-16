import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form";
import FormInputWrapper from "../FormInputWrapper";
import { useFormContext } from "react-hook-form";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { useEffect } from "react";
import { getPlanningGroupFromVendorAccountGroup } from "@/components/vendor/lov-utils";
import SearchableSelect from "@/components/common/search-select";

const VendorDetails = ({ isReadOnly = false, isStep1ReadOnly = false }: { isReadOnly?: boolean; isStep1ReadOnly?: boolean }) => {
    const { control, watch, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    const vendorAccountGroup = watch("vendor_details.vendor_account_group");
    const planningGroup = watch("internal_details.planning_group");

    // Auto-populate planning group based on vendor account group
    useEffect(() => {
        if (vendorAccountGroup && lovData?.vendorAccPlanningGroup && !planningGroup) {
            const group = getPlanningGroupFromVendorAccountGroup(
                vendorAccountGroup,
                lovData.vendorAccPlanningGroup
            );
            if (group) {
                setValue("internal_details.planning_group", group, { shouldValidate: true });
            }
        }
    }, [vendorAccountGroup, lovData, planningGroup, setValue]);

    const toTitleCase = (str: string) => {
        return str.replace(/\b([a-zA-Z])(\w*)/g, (_, first, rest) =>
            first.toUpperCase() + rest.toLowerCase()
        );
    };

    const isV010 = vendorAccountGroup?.startsWith("V010");

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Vendor Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                    {/* Row 1 */}
                    <FormField
                        control={control}
                        name="vendor_details.vendor_account_group"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Vendor Account Group"
                                required
                                error={fieldState.error}
                                isReadOnly={isStep1ReadOnly}
                            >
                                <SearchableSelect
                                    options={lovData?.vendorAccountGroup || []}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isStep1ReadOnly}
                                    placeholder="Choose vendor account group"
                                    searchPlaceholder="Search vendor account groups..."
                                />
                            </FormInputWrapper>
                        )}
                    />

                    <FormField
                        control={control}
                        name="vendor_details.employee_number"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Employee Number"
                                required={isV010}
                                error={fieldState.error}
                                isReadOnly={isStep1ReadOnly}
                            >
                                <Input
                                    placeholder="Enter 4-digit employee number"
                                    {...field}
                                    readOnly={isStep1ReadOnly}
                                    className={`h-10 font-semibold text-[13px] ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                    maxLength={4}
                                />
                            </FormInputWrapper>
                        )}
                    />

                    {/* Row 2 */}
                    <FormField
                        control={control}
                        name="vendor_details.company_code"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Company Code"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <SearchableSelect
                                    options={lovData?.companyCode || []}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isReadOnly}
                                    placeholder="Choose company code"
                                    searchPlaceholder="Search company codes..."
                                />
                            </FormInputWrapper>
                        )}
                    />

                    <FormField
                        control={control}
                        name="vendor_details.title_text"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Title Text"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <SearchableSelect
                                    options={lovData?.titleText || []}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isReadOnly}
                                    placeholder="Choose title"
                                    searchPlaceholder="Search titles..."
                                />
                            </FormInputWrapper>
                        )}
                    />

                    {/* Row 3 */}
                    <FormField
                        control={control}
                        name="vendor_details.name1"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Name 1"
                                required
                                error={fieldState.error}
                                isReadOnly={isStep1ReadOnly}
                            >
                                <Input
                                    placeholder="Enter vendor name"
                                    {...field}
                                    readOnly={isStep1ReadOnly}
                                    className={`h-10 font-semibold text-[13px] ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                    maxLength={35}
                                />
                            </FormInputWrapper>
                        )}
                    />

                    <FormField
                        control={control}
                        name="vendor_details.name2"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Name 2"
                                error={fieldState.error}
                                helperText="Enter additional name (Optional)"
                                isReadOnly={isReadOnly}
                            >
                                <Input
                                    placeholder="Enter additional name (Optional)"
                                    {...field}
                                    maxLength={35}
                                    readOnly={isReadOnly}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                    onChange={(e) => field.onChange(toTitleCase(e.target.value))}
                                />
                            </FormInputWrapper>
                        )}
                    />

                    {/* Row 4 */}
                    <FormField
                        control={control}
                        name="vendor_details.search_term1"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Search Term 1"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <Input
                                    placeholder="Enter search term"
                                    {...field}
                                    maxLength={18}
                                    readOnly={isReadOnly}
                                    className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                                    onChange={(e) => field.onChange(toTitleCase(e.target.value))}
                                />
                            </FormInputWrapper>
                        )}
                    />

                    <FormField
                        control={control}
                        name="vendor_details.terms_of_payment_key"
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Terms of Payment Key"
                                required
                                error={fieldState.error}
                                isReadOnly={isReadOnly}
                            >
                                <SearchableSelect
                                    options={lovData?.termsOfPaymentKey || []}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isReadOnly}
                                    placeholder="Choose payment terms"
                                    searchPlaceholder="Search payment terms..."
                                />
                            </FormInputWrapper>
                        )}
                    />
                </div>
            </CardContent>
        </>
    );
};

export default VendorDetails;

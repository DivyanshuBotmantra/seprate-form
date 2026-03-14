import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormField, FormControl } from "@/components/ui/form";
import FormInputWrapper from "../FormInputWrapper";
import { useFormContext } from "react-hook-form";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import { useEffect } from "react";
import { getPlanningGroupFromVendorAccountGroup } from "@/components/vendor/lov-utils";

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
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isStep1ReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isStep1ReadOnly ? "bg-muted cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select group" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.vendorAccountGroup || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select code" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.companyCode || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select title" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.titleText || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            >
                                <Input
                                    placeholder="Enter legal vendor name"
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
                            >
                                <Input
                                    placeholder="Short identifier"
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
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}>
                                            <SelectValue placeholder="Select terms" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.termsOfPaymentKey || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormInputWrapper>
                        )}
                    />
                </div>
            </CardContent>
        </>
    );
};

export default VendorDetails;

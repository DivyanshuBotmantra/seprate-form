import { useFormContext } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import FormInputWrapper from "../FormInputWrapper";
import { useEffect } from "react";
import { 
    getReconciliationMapping, 
    hasMappedReconciliationAccount,
    getPlanningGroupFromVendorAccountGroup,
    getReceiptTypeFromWithholdingTax
} from "@/components/vendor/lov-utils";

const InternalDetails = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { control, watch, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    // Watch dependencies
    const typeOfVendor = watch("type_of_vendor");
    const vendorAccountGroup = watch("vendor_details.vendor_account_group");
    const companyCode = watch("vendor_details.company_code");
    const panNumber = watch("key_details.pan_number");
    const wtType1 = watch("internal_details.indicator_for_with_holding_tax_type1");
    const wtType2 = watch("internal_details.indicator_for_with_holding_tax_type2");

    const isXK01 = typeOfVendor === "XK01";
    const isForeign = vendorAccountGroup?.toLowerCase().includes("foreign");

    // 1. Reconciliation Account & Planning Group Auto-fill
    useEffect(() => {
        if (!vendorAccountGroup) return;

        const mapping = getReconciliationMapping(vendorAccountGroup);
        if (mapping) {
            setValue("internal_details.reconciliation_account_in_general_ledger", mapping.value, { shouldValidate: true });
        }

        const planningGroup = getPlanningGroupFromVendorAccountGroup(vendorAccountGroup, lovData?.vendorAccPlanningGroup || []);
        if (planningGroup) {
            setValue("internal_details.planning_group", planningGroup, { shouldValidate: true });
        }
    }, [vendorAccountGroup, lovData?.vendorAccPlanningGroup, setValue]);

    // 2. Purchasing Organization & PO Currency Auto-fill (for XK01)
    useEffect(() => {
        if (isXK01 && companyCode) {
            setValue("internal_details.purchasing_organization", companyCode, { shouldValidate: true });
        }
        if (isXK01 && !isForeign) {
            setValue("internal_details.purchase_order_currency", "INR", { shouldValidate: true });
        }
    }, [isXK01, companyCode, isForeign, setValue]);

    // 3. Withholding Tax Auto-selection Logic (Bible Rules)
    useEffect(() => {
        if (!vendorAccountGroup || !panNumber || panNumber.length < 4 || isReadOnly) return;
        
        const code = vendorAccountGroup.split(" - ")[0];
        const fourthLetter = panNumber.charAt(3).toUpperCase();
        
        let autoWT1 = "";
        let autoWT2 = "";

        if (code === "V001") {
            autoWT1 = fourthLetter === "C" ? "F1" : "F2";
            autoWT2 = fourthLetter === "C" ? "FA" : "FB";
        } else if (code === "V003" || code === "V009") {
            if (fourthLetter === "C") {
                autoWT1 = "C1"; autoWT2 = "CA";
            } else if (fourthLetter === "F") {
                autoWT1 = "C4"; autoWT2 = "CD";
            } else {
                autoWT1 = "C2"; autoWT2 = "CB";
            }
        }

        if (autoWT1) setValue("internal_details.indicator_for_with_holding_tax_type1", autoWT1, { shouldValidate: true });
        if (autoWT2) setValue("internal_details.indicator_for_with_holding_tax_type2", autoWT2, { shouldValidate: true });
    }, [vendorAccountGroup, panNumber, setValue, isReadOnly]);

    // 4. Receipt Type Auto-lookups
    useEffect(() => {
        if (wtType1) {
            const receipt1 = getReceiptTypeFromWithholdingTax(wtType1, lovData?.receiptType1 || []);
            setValue("internal_details.receipt_type1", receipt1);
        }
        if (wtType2) {
            const receipt2 = getReceiptTypeFromWithholdingTax(wtType2, lovData?.receiptType2 || []);
            setValue("internal_details.receipt_type2", receipt2);
        }
    }, [wtType1, wtType2, lovData, setValue]);

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Internal Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                    {/* Row 1: Recon Account & Planning Group */}
                    <FormField 
                        control={control} 
                        name="internal_details.reconciliation_account_in_general_ledger" 
                        render={({ field, fieldState }) => {
                            const hasMapping = hasMappedReconciliationAccount(vendorAccountGroup);
                            return (
                                <FormInputWrapper 
                                    label="Reconciliation Account in General Ledger"
                                    required
                                    error={fieldState.error}
                                >
                                    {hasMapping ? (
                                        <FormControl>
                                            <Input 
                                                value={(() => {
                                                    const m = getReconciliationMapping(vendorAccountGroup);
                                                    return m ? m.displayLabel : field.value;
                                                })()}
                                                readOnly
                                                className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed"
                                            />
                                        </FormControl>
                                    ) : (
                                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                            <FormControl>
                                                <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`}>
                                                    <SelectValue placeholder="Choose reconciliation account" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(lovData?.reconciliationAccountInGeneralLedger || []).map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </FormInputWrapper>
                            );
                        }} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.planning_group" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Planning Group"
                                error={fieldState.error}
                            >
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        readOnly 
                                        className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed border-border" 
                                        placeholder="Auto-filled based on vendor group" 
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 2: WHT Indicator 1 & 2 */}
                    <FormField 
                        control={control} 
                        name="internal_details.indicator_for_with_holding_tax_type1" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Indicator for with Holding Tax Type 1"
                                error={fieldState.error}
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`}>
                                            <SelectValue placeholder="Choose withholding tax type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.indicatorForWithHoldingTaxType1 || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.indicator_for_with_holding_tax_type2" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Indicator for with Holding Tax Type 2"
                                error={fieldState.error}
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`}>
                                            <SelectValue placeholder="Choose withholding tax type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.indicatorForWithHoldingTaxType2 || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 3: Purchasing Organization & PO Currency */}
                    <FormField 
                        control={control} 
                        name="internal_details.purchasing_organization" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Purchasing Organization"
                                required={isXK01}
                                error={fieldState.error}
                            >
                                <FormControl>
                                    <Input 
                                        {...field}
                                        readOnly={isXK01 || isReadOnly}
                                        placeholder={isXK01 ? "Auto-filled from company code" : "Select organization"}
                                        className={`h-10 font-semibold text-[13px] ${isXK01 || isReadOnly ? "bg-muted cursor-not-allowed border-dashed" : "bg-background border-border"}`}
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.purchase_order_currency" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Purchase Order Currency"
                                required={isXK01}
                                error={fieldState.error}
                            >
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isReadOnly || (!isForeign && !!field.value)}>
                                    <FormControl>
                                        <SelectTrigger className={`w-full h-10 font-semibold text-[13px] ${isReadOnly || (!isForeign && !!field.value) ? "bg-muted cursor-not-allowed border-dashed" : "bg-background border-border"}`}>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(lovData?.purchaseOrderCurrency || []).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormInputWrapper>
                        )} 
                    />

                    {/* Row 4: Responsible Sales Person & Order Acknowledgment */}
                    <FormField 
                        control={control} 
                        name="internal_details.responsible_sales_person_at_vendor_office" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Responsible Sales Person at Vendor Office"
                                error={fieldState.error}
                            >
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Enter sales person name"
                                        readOnly={isReadOnly}
                                        className={`h-10 font-semibold text-[13px] ${isReadOnly ? "bg-muted cursor-not-allowed" : "bg-background border-border"}`} 
                                        maxLength={29}
                                    />
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />

                    <FormField 
                        control={control} 
                        name="internal_details.order_acknowledgment_requirement" 
                        render={({ field, fieldState }) => (
                            <FormInputWrapper 
                                label="Order Acknowledgment Requirement"
                                required={isXK01}
                                error={fieldState.error}
                            >
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isReadOnly || !isXK01}
                                        className="flex h-10 gap-6 items-center"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Yes" id="internal-ack-yes" />
                                            <Label htmlFor="internal-ack-yes" className="text-[13px] font-medium cursor-pointer">Yes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="No" id="internal-ack-no" />
                                            <Label htmlFor="internal-ack-no" className="text-[13px] font-medium cursor-pointer">No</Label>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                            </FormInputWrapper>
                        )} 
                    />
                </div>
            </CardContent>
        </>
    );
};
export default InternalDetails;

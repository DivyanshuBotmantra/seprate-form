import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import {
    calculateVendorClassificationForGST,
    calculateIndicatorSubjectToWithholdTax,
    getReceiptTypeFromWithholdingTax,
    calculateGRBasedInvoiceVerification,
    calculateServiceBasedInvoiceVerification,
    calculateGroupForCalculationSchema,
    calculateConfirmationControlKey
} from "@/components/vendorOnboarding/utils/lov-utils";

import FormInputWrapper from "../FormInputWrapper";

const SystemFields = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
    const { watch } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    // Watch dependencies for calculations
    const typeOfVendor = watch("type_of_vendor");
    const vendorAccountGroup = watch("vendor_details.vendor_account_group");
    const gstin = watch("key_details.gstin");
    const panNumber = watch("key_details.pan_number");
    const orderAck = watch("internal_details.order_acknowledgment_requirement");
    const wtType1 = watch("internal_details.indicator_for_with_holding_tax_type1");
    const wtType2 = watch("internal_details.indicator_for_with_holding_tax_type2");

    // No local Field component needed, we use FormInputWrapper

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">System Fields</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start">
                    {/* Line 1 */}
                    <FormInputWrapper label="Name 3" required isReadOnly={isReadOnly}>
                        <Input value="." readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <FormInputWrapper label="Name 4" isReadOnly={isReadOnly}>
                        <Input value={panNumber || ""} placeholder="Auto-filled from PAN" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 2 */}
                    <FormInputWrapper label="Language" required isReadOnly={isReadOnly}>
                        <Input value="EN" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <FormInputWrapper label="Address Time Zone" isReadOnly={isReadOnly}>
                        <Input value="INDIA" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 3 */}
                    <FormInputWrapper label="Last Review (External)" isReadOnly={isReadOnly}>
                        <Input value="" placeholder="Auto-filled by system" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <FormInputWrapper label="Vendor Classification for GST" isReadOnly={isReadOnly}>
                        <Input value={calculateVendorClassificationForGST(gstin || "")} placeholder="Auto-calculated from GST" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 4 */}
                    <FormInputWrapper label="Individual PMT Check" required isReadOnly={isReadOnly}>
                        <div className="flex items-center space-x-2 h-10 px-3 bg-muted/30 rounded-md border border-dashed border-border">
                            <Checkbox checked disabled className="opacity-70" />
                            <span className="text-[11px] text-muted-foreground font-medium">Enabled (Default)</span>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="Key for Sorting According to Assignment" required isReadOnly={isReadOnly}>
                        <Input value="001" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 5 */}
                    <FormInputWrapper label="Check Flag for Double Invoices" isReadOnly={isReadOnly}>
                        <div className="flex items-center space-x-2 h-10 px-3 bg-muted/30 rounded-md border border-dashed border-border">
                            <Checkbox checked disabled className="opacity-70" />
                            <span className="text-[11px] text-muted-foreground font-medium">Enabled (Default)</span>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="List of Payment Methods to be Considered" required isReadOnly={isReadOnly}>
                        <Input value="CEMNORT" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 6 */}
                    <FormInputWrapper label="With Holding Tax Country Key" required isReadOnly={isReadOnly}>
                        <Input value="IN" readOnly className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <div />

                    {/* Line 7 */}
                    <FormInputWrapper label="With Holding Tax Code 1" isReadOnly={isReadOnly}>
                        <Input
                            value={wtType1 || ""}
                            placeholder="Auto-filled from W/H 1"
                            readOnly
                            className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed"
                        />
                    </FormInputWrapper>
                    <FormInputWrapper label="With Holding Tax Code 2" isReadOnly={isReadOnly}>
                        <Input
                            value={wtType2 || ""}
                            placeholder="Auto-filled from W/H 2"
                            readOnly
                            className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed"
                        />
                    </FormInputWrapper>

                    {/* Line 8 */}
                    <FormInputWrapper label="Indicator Subject to Withhold Tax?" isReadOnly={isReadOnly}>
                        <div className="flex items-center h-10 px-3 bg-muted/30 rounded-md border border-dashed border-border">
                            <RadioGroup value={calculateIndicatorSubjectToWithholdTax(wtType1 || "")} disabled className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="wt1-sub-yes" />
                                    <Label htmlFor="wt1-sub-yes" className="text-[12px] font-bold cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="wt1-sub-no" />
                                    <Label htmlFor="wt1-sub-no" className="text-[12px] font-bold cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="Indicator Subject to Withhold Tax?" isReadOnly={isReadOnly}>
                        <div className="flex items-center h-10 px-3 bg-muted/30 rounded-md border border-dashed border-border">
                            <RadioGroup value={calculateIndicatorSubjectToWithholdTax(wtType2 || "")} disabled className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="wt2-sub-yes" />
                                    <Label htmlFor="wt2-sub-yes" className="text-[12px] font-bold cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="wt2-sub-no" />
                                    <Label htmlFor="wt2-sub-no" className="text-[12px] font-bold cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>

                    {/* Line 9 */}
                    <FormInputWrapper label="Type of Recipient 1" isReadOnly={isReadOnly}>
                        <Input
                            value={getReceiptTypeFromWithholdingTax(wtType1 || "", lovData?.receiptType1 || [])}
                            placeholder="Auto-calculated from W/H 1"
                            readOnly
                            className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed"
                        />
                    </FormInputWrapper>
                    <FormInputWrapper label="Type of Recipient 2" isReadOnly={isReadOnly}>
                        <Input
                            value={getReceiptTypeFromWithholdingTax(wtType2 || "", lovData?.receiptType2 || [])}
                            placeholder="Auto-calculated from W/H 2"
                            readOnly
                            className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed"
                        />
                    </FormInputWrapper>

                    {/* Line 10 */}
                    <FormInputWrapper label="Indicator:GR-Based Invoice Verification" isReadOnly={isReadOnly}>
                        <div className="flex items-center h-10 px-3 bg-muted/30 rounded-md border border-dashed border-border">
                            <RadioGroup value={calculateGRBasedInvoiceVerification(typeOfVendor)} disabled className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="gr-yes" />
                                    <Label htmlFor="gr-yes" className="text-[12px] font-bold cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="gr-no" />
                                    <Label htmlFor="gr-no" className="text-[12px] font-bold cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="Indicator for Service-Based Verification" isReadOnly={isReadOnly}>
                        <div className="flex items-center h-10 px-3 bg-muted/30 rounded-md border border-dashed border-border">
                            <RadioGroup value={calculateServiceBasedInvoiceVerification(typeOfVendor)} disabled className="flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="service-yes" />
                                    <Label htmlFor="service-yes" className="text-[12px] font-bold cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="service-no" />
                                    <Label htmlFor="service-no" className="text-[12px] font-bold cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>

                    {/* Line 11 */}
                    <FormInputWrapper label="Group for Calculation Schema (Vendor)" isReadOnly={isReadOnly}>
                        <Input
                            value={calculateGroupForCalculationSchema(typeOfVendor, vendorAccountGroup || "")}
                            placeholder="Auto-calculated from vendor group"
                            readOnly
                            className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed"
                        />
                    </FormInputWrapper>
                    <FormInputWrapper label="Confirmation Control Key" isReadOnly={isReadOnly}>
                        <Input
                            value={calculateConfirmationControlKey(typeOfVendor, orderAck || "")}
                            placeholder="Auto-calculated from order acknowledgment"
                            readOnly
                            className="h-10 bg-muted font-bold font-mono text-[13px] border-dashed cursor-not-allowed"
                        />
                    </FormInputWrapper>
                </div>
            </CardContent>
        </>
    );
};

export default SystemFields;

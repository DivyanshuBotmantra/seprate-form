import { useFormContext } from "react-hook-form";
import { FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VendorFormValues } from "../schema";
import { useLOVData } from "../LOVContext";
import FormInputWrapper from "../FormInputWrapper";
import { 
    calculateVendorClassificationForGST,
    calculateIndicatorSubjectToWithholdTax,
    getReceiptTypeFromWithholdingTax,
    calculateGRBasedInvoiceVerification,
    calculateServiceBasedInvoiceVerification,
    calculateGroupForCalculationSchema,
    calculateConfirmationControlKey
} from "@/components/vendor/lov-utils";

const SystemFields = () => {
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

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">System Fields</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 items-start">
                    {/* Line 1 */}
                    <FormInputWrapper label="Name 3" required>
                        <Input value="." readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <FormInputWrapper label="Name 4">
                        <Input value={panNumber || ""} placeholder="Auto-filled from PAN" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 2 */}
                    <FormInputWrapper label="Language" required>
                        <Input value="EN" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <FormInputWrapper label="Address Time Zone">
                        <Input value="INDIA" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 3 */}
                    <FormInputWrapper label="Last Review (External)">
                        <Input value="" placeholder="Auto-filled by system" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <FormInputWrapper label="Vendor Classification for GST">
                        <Input value={calculateVendorClassificationForGST(gstin || "")} placeholder="Auto-calculated from GST" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 4 */}
                    <FormInputWrapper label="Individual PMT Check" required>
                        <div className="flex items-center space-x-2 h-10">
                            <Checkbox checked disabled className="opacity-70" />
                            <span className="text-[12px] text-muted-foreground">Enable Individual PMT Check (Default - Cannot be changed)</span>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="Key for Sorting According to Assignment Number" required>
                        <Input value="001" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 5 */}
                    <FormInputWrapper label="Check Flag for Double Invoices or Credit Memos">
                        <div className="flex items-center space-x-2 h-10">
                            <Checkbox checked disabled className="opacity-70" />
                            <span className="text-[12px] text-muted-foreground">Enable Double Invoice Check (Default - Cannot be changed)</span>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="List of Payment Methods to be Considered" required>
                        <Input value="CEMNORT" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>

                    {/* Line 6 */}
                    <FormInputWrapper label="With Holding Tax Country Key" required>
                        <Input value="IN" readOnly className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" />
                    </FormInputWrapper>
                    <div /> {/* Spacer for alignment, as WH Code 1 and 2 align below */}

                    {/* Line 7 */}
                    <FormInputWrapper label="With Holding Tax Code 1">
                        <Input 
                            value={wtType1 || ""} 
                            placeholder="Auto-filled from W/H 1" 
                            readOnly 
                            className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" 
                        />
                    </FormInputWrapper>
                    <FormInputWrapper label="With Holding Tax Code 2">
                        <Input 
                            value={wtType2 || ""} 
                            placeholder="Auto-filled from W/H 2" 
                            readOnly 
                            className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" 
                        />
                    </FormInputWrapper>

                    {/* Line 8 */}
                    <FormInputWrapper label="Indicator Subject to With hold Tax?">
                        <div className="flex items-center h-10">
                            <RadioGroup value={calculateIndicatorSubjectToWithholdTax(wtType1 || "")} disabled className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="wt1-sub-yes" />
                                    <Label htmlFor="wt1-sub-yes" className="text-[13px] cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="wt1-sub-no" />
                                    <Label htmlFor="wt1-sub-no" className="text-[13px] cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="Indicator Subject to With hold Tax?">
                        <div className="flex items-center h-10">
                            <RadioGroup value={calculateIndicatorSubjectToWithholdTax(wtType2 || "")} disabled className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="wt2-sub-yes" />
                                    <Label htmlFor="wt2-sub-yes" className="text-[13px] cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="wt2-sub-no" />
                                    <Label htmlFor="wt2-sub-no" className="text-[13px] cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>

                    {/* Line 9 */}
                    <FormInputWrapper label="Type of Recipient 1">
                        <Input 
                            value={getReceiptTypeFromWithholdingTax(wtType1 || "", lovData?.receiptType1 || [])} 
                            placeholder="Auto-calculated from W/H 1" 
                            readOnly 
                            className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" 
                        />
                    </FormInputWrapper>
                    <FormInputWrapper label="Type of Recipient 2">
                        <Input 
                            value={getReceiptTypeFromWithholdingTax(wtType2 || "", lovData?.receiptType2 || [])} 
                            placeholder="Auto-calculated from W/H 2" 
                            readOnly 
                            className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" 
                        />
                    </FormInputWrapper>

                    {/* Line 10 */}
                    <FormInputWrapper label="Indicator:GR-Based Invoice Verification">
                        <div className="flex items-center h-10">
                            <RadioGroup value={calculateGRBasedInvoiceVerification(typeOfVendor)} disabled className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="gr-yes" />
                                    <Label htmlFor="gr-yes" className="text-[13px] cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="gr-no" />
                                    <Label htmlFor="gr-no" className="text-[13px] cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>
                    <FormInputWrapper label="Indicator for Service-Based Invoice Verification">
                        <div className="flex items-center h-10">
                            <RadioGroup value={calculateServiceBasedInvoiceVerification(typeOfVendor)} disabled className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Yes" id="service-yes" />
                                    <Label htmlFor="service-yes" className="text-[13px] cursor-not-allowed">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="No" id="service-no" />
                                    <Label htmlFor="service-no" className="text-[13px] cursor-not-allowed">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </FormInputWrapper>

                    {/* Line 11 */}
                    <FormInputWrapper label="Group for Calculation Schema (Vendor)">
                        <Input 
                            value={calculateGroupForCalculationSchema(typeOfVendor, vendorAccountGroup || "")} 
                            placeholder="Auto-calculated from vendor group" 
                            readOnly 
                            className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" 
                        />
                    </FormInputWrapper>
                    <FormInputWrapper label="Confirmation Control Key">
                        <Input 
                            value={calculateConfirmationControlKey(typeOfVendor, orderAck || "")} 
                            placeholder="Auto-calculated from order acknowledgment" 
                            readOnly 
                            className="h-10 bg-muted font-semibold text-[13px] border-dashed cursor-not-allowed" 
                        />
                    </FormInputWrapper>
                </div>
            </CardContent>
        </>
    );
};

export default SystemFields;

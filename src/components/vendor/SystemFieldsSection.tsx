import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { BaseSectionProps } from "./types";
import {
  calculateVendorClassificationForGST,
  calculateIndicatorSubjectToWithholdTax,
  calculateTypeOfRecipient,
  calculateGRBasedInvoiceVerification,
  calculateServiceBasedInvoiceVerification,
  calculateGroupForCalculationSchema,
  calculateConfirmationControlKey,
} from "./validation";

const SystemFieldsSection: React.FC<BaseSectionProps> = ({
  formData,
  setFormData,
  errors,
  lovData,
  handleInputChange,
  handleSaveSection,
  isSaving,
  isReadOnly = false,
  editMode = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="name3">
                Name 3 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name3"
                value="."
                placeholder="Auto-filled with dot (.)"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                Language <span className="text-destructive">*</span>
              </Label>
              <Input
                id="language"
                value={formData.language}
                placeholder="Default: EN"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastReviewExternal">Last Review (External)</Label>
              <Input
                id="lastReviewExternal"
                value={formData.lastReviewExternal}
                placeholder="Auto-filled by system"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="individualPMTCheck">
                Individual PMT Check <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center space-x-1">
                <Checkbox
                  id="individualPMTCheck"
                  checked={true}
                  disabled={true}
                  className="opacity-50 cursor-not-allowed"
                />
                <Label
                  htmlFor="individualPMTCheck"
                  className="text-muted-foreground"
                >
                  Enable Individual PMT Check (Default - Cannot be changed)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkFlagForDoubleInvoicesOrCredit">
                Check Flag for Double Invoices or Credit Memos
              </Label>
              <div className="flex items-center space-x-1">
                <Checkbox
                  id="checkFlagForDoubleInvoicesOrCredit"
                  checked={true}
                  disabled={true}
                  className="opacity-50 cursor-not-allowed"
                />
                <Label
                  htmlFor="checkFlagForDoubleInvoicesOrCredit"
                  className="text-muted-foreground"
                >
                  Enable Double Invoice Check (Default - Cannot be changed)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withHoldingTaxCountryKey">
                With Holding Tax Country Key{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="withHoldingTaxCountryKey"
                value={formData.withHoldingTaxCountryKey}
                placeholder="Default: IN"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withHoldingTaxCode1">
                With Holding Tax Code 1
              </Label>
              <Input
                id="withHoldingTaxCode1"
                value={formData.indicatorForWithHoldingTaxType1 || ""}
                placeholder="Auto-filled from W/H 1"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicatorSubjectToWithholdTax1">
                Indicator Subject to With hold Tax?
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="indicator-subject-1-yes"
                    name="indicatorSubjectToWithholdTax1"
                    checked={
                      calculateIndicatorSubjectToWithholdTax(
                        formData.indicatorForWithHoldingTaxType1
                      ) === "Yes"
                    }
                    disabled
                    className=" cursor-not-allowed"
                  />
                  <Label
                    htmlFor="indicator-subject-1-yes"
                    className="text-foreground cursor-not-allowed"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="indicator-subject-1-no"
                    name="indicatorSubjectToWithholdTax1"
                    checked={
                      calculateIndicatorSubjectToWithholdTax(
                        formData.indicatorForWithHoldingTaxType1
                      ) === "No"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label
                    htmlFor="indicator-subject-1-no"
                    className="text-foreground cursor-not-allowed"
                  >
                    No
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeOfRecipient1">Type of Recipient 1</Label>
              <Input
                id="typeOfRecipient1"
                value={calculateTypeOfRecipient(
                  lovData,
                  formData.indicatorForWithHoldingTaxType1,
                  1
                )}
                placeholder="Auto-calculated from W/H 1"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicatorGRBasedInvoiceVerification">
                Indicator:GR-Based Invoice Verification
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="gr-based-yes"
                    name="indicatorGRBasedInvoiceVerification"
                    checked={
                      calculateGRBasedInvoiceVerification(
                        formData.typeOfVendor
                      ) === "Yes"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label
                    htmlFor="gr-based-yes"
                    className="text-foreground cursor-not-allowed"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="gr-based-no"
                    name="indicatorGRBasedInvoiceVerification"
                    checked={
                      calculateGRBasedInvoiceVerification(
                        formData.typeOfVendor
                      ) === "No"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label
                    htmlFor="gr-based-no"
                    className="text-foreground cursor-not-allowed"
                  >
                    No
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupForCalculationSchemaVendor">
                Group for Calculation Schema (Vendor)
              </Label>
              <Input
                id="groupForCalculationSchemaVendor"
                value={calculateGroupForCalculationSchema(
                  formData.typeOfVendor,
                  formData.vendorAccountGroup
                )}
                placeholder="Auto-calculated from vendor group"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="name4">Name 4</Label>
              <Input
                id="name4"
                value={formData.panNumber}
                placeholder="Auto-filled from PAN"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressTimeZone">Address Time Zone</Label>
              <Input
                id="addressTimeZone"
                value={formData.addressTimeZone}
                placeholder="Default: INDIA"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorClassificationForGST">
                Vendor Classification for GST
              </Label>
              <Input
                id="vendorClassificationForGST"
                value={calculateVendorClassificationForGST(
                  formData.taxNumber3GSTIN
                )}
                placeholder="Auto-calculated from GST"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>
            {/* <div className='h-1'></div> */}

            <div className="space-y-2">
              <Label htmlFor="keyForSortingAccordingToAssignment">
                Key for Sorting According to Assignment Number{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="keyForSortingAccordingToAssignment"
                value="001"
                placeholder="Default: 001"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>
            <div className="h-1.5"></div>
            <div className="space-y-2">
              <Label htmlFor="listOfPaymentMethodsToBeConsider">
                List of Payment Methods to be Considered{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="listOfPaymentMethodsToBeConsider"
                value="CEMNORT"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withHoldingTaxCode2">
                With Holding Tax Code 2
              </Label>
              <Input
                id="withHoldingTaxCode2"
                value={formData.indicatorForWithHoldingTaxType2 || ""}
                placeholder="Auto-filled from W/H 2"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicatorSubjectToWithholdTax2">
                Indicator Subject to With hold Tax?
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="indicator-subject-2-yes"
                    name="indicatorSubjectToWithholdTax2"
                    checked={
                      calculateIndicatorSubjectToWithholdTax(
                        formData.indicatorForWithHoldingTaxType2
                      ) === "Yes"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label
                    htmlFor="indicator-subject-2-yes"
                    className="text-foreground cursor-not-allowed"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="indicator-subject-2-no"
                    name="indicatorSubjectToWithholdTax2"
                    checked={
                      calculateIndicatorSubjectToWithholdTax(
                        formData.indicatorForWithHoldingTaxType2
                      ) === "No"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label
                    htmlFor="indicator-subject-2-no"
                    className="text-foreground cursor-not-allowed"
                  >
                    No
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeOfRecipient2">Type of Recipient 2</Label>
              <Input
                id="typeOfRecipient2"
                value={calculateTypeOfRecipient(
                  lovData,
                  formData.indicatorForWithHoldingTaxType2,
                  2
                )}
                placeholder="Auto-calculated from W/H 2"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicatorServiceBasedInvoiceVerif">
                Indicator for Service-Based Invoice Verification
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="service-based-yes"
                    name="indicatorServiceBasedInvoiceVerif"
                    checked={
                      calculateServiceBasedInvoiceVerification(
                        formData.typeOfVendor
                      ) === "Yes"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label htmlFor="service-based-yes" className="text-foreground cursor-not-allowed">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="radio"
                    id="service-based-no"
                    name="indicatorServiceBasedInvoiceVerif"
                    checked={
                      calculateServiceBasedInvoiceVerification(
                        formData.typeOfVendor
                      ) === "No"
                    }
                    disabled
                    className="cursor-not-allowed"
                  />
                  <Label htmlFor="service-based-no" className="text-foreground cursor-not-allowed">
                    No
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-5">
              <Label htmlFor="confirmationControlKey">
                Confirmation Control Key
              </Label>
              <Input
                id="confirmationControlKey"
                value={calculateConfirmationControlKey(
                  formData.typeOfVendor,
                  formData.orderAcknowledgmentRequirement
                )}
                placeholder="Auto-calculated from order acknowledgment"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemFieldsSection;

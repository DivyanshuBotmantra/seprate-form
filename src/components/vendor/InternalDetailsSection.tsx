import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/common/search-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { BaseSectionProps, VendorFormData } from "./types";
import {
  shouldWithholdingTaxBeReadOnly,
  getWithholdingTaxDisplayText,
  getWithholdingTaxDisplayTextForEmployee,
  isPurchasingOrganizationRequired,
  isPurchasingOrganizationEditable,
  isPurchaseOrderCurrencyRequired,
  isPurchaseOrderCurrencyEditable,
  isResponsibleSalesPersonEditable,
  isOrderAcknowledgmentEditable,
  isForeignVendorAccountGroup,
} from "./validation";

type ReconciliationAccountMapping = {
  value: string;
  displayLabel: string;
};

const RECONCILIATION_ACCOUNT_BY_VENDOR_GROUP: Record<
  string,
  ReconciliationAccountMapping
> = {
  V001: {
    value: "1000090000",
    displayLabel: "1000090000 - DOMESTIC VENDOR- MATERIAL",
  },
  V002: {
    value: "1000090010",
    displayLabel: "1000090010 - FOREIGN VENDOR-MATERIAL",
  },
  V003: {
    value: "1000090020",
    displayLabel: "1000090020 - CONTRACTOR / SUBCONTRACTOR VENDOR",
  },
  V005: {
    value: "1000090040",
    displayLabel: "1000090040 - VENDOR FOREIGN - SERVICES",
  },
  V006: {
    value: "1000090050",
    displayLabel: "1000090050 - VENDOR DOMESTIC - ASSETS",
  },
  V007: {
    value: "1000090060",
    displayLabel: "1000090060 - VENDOR FOREIGN - ASSETS",
  },
  V008: {
    value: "1000090070",
    displayLabel: "1000090070 - VENDOR RELATED PARTY",
  },
  V009: {
    value: "1000090080",
    displayLabel: "1000090080 - VENDOR LABOUR+MATERIAL",
  },
  V010: {
    value: "1000090110",
    displayLabel: "1000090110 - VENDOR - EMPLOYEE",
  },
  V012: {
    value: "1000032299",
    displayLabel: "1000032299 - MOTOR CAR LOANS",
  },
  V013: {
    value: "1000032599",
    displayLabel: "1000032599 - EQUIPMENT FINANCE LOANS",
  },
  V014: {
    value: "1000031999",
    displayLabel: "1000031999 - TERM LOANS",
  },
};

const extractVendorAccountGroupCode = (
  vendorAccountGroup: string
): string | null => {
  if (!vendorAccountGroup) return null;
  const match = vendorAccountGroup.trim().toUpperCase().match(/^([A-Z0-9]+)/);
  return match ? match[1] : null;
};

const getReconciliationMappingForVendorGroup = (
  vendorAccountGroup: string
): ReconciliationAccountMapping | null => {
  const code = extractVendorAccountGroupCode(vendorAccountGroup);
  if (!code) return null;
  return RECONCILIATION_ACCOUNT_BY_VENDOR_GROUP[code] ?? null;
};

const hasMappedReconciliationAccount = (vendorAccountGroup: string): boolean => {
  return getReconciliationMappingForVendorGroup(vendorAccountGroup) !== null;
};

const InternalDetailsSection: React.FC<BaseSectionProps> = ({
  formData,
  errors,
  lovData,
  handleInputChange,
  isReadOnly = false,
}) => {
  // Helper function to get withholding tax options (both Type1 and Type2 use the same data)
  const getWithholdingTaxOptions = () => {
    // Both indicatorForWithHoldingTaxType1 and indicatorForWithHoldingTaxType2
    // contain the same options array, so we use Type1 as the single source of truth
    const options = lovData?.indicatorForWithHoldingTaxType1 || [];

    // Deduplicate options by value to prevent React key conflicts
    // Use a Map to keep track of unique values, keeping the first occurrence
    const uniqueOptions = new Map<string, { value: string; label: string }>();
    options.forEach((opt) => {
      if (opt && opt.value && !uniqueOptions.has(opt.value)) {
        uniqueOptions.set(opt.value, opt);
      }
    });

    return Array.from(uniqueOptions.values());
  };

  // Custom handler to store full descriptive names instead of short codes
  const handleWithholdingTaxChange = (
    field: keyof VendorFormData,
    value: string
  ) => {
    // Find the full descriptive name from the LOV data
    const options = getWithholdingTaxOptions();
    const fullName =
      options.find((option) => option.value === value)?.label || value;
    handleInputChange(field, fullName);
  };

  // Helper function to get the short code from the stored full name
  const getShortCodeFromFullName = (fullName: string): string => {
    if (!fullName) return "";
    const options = getWithholdingTaxOptions();
    const option = options.find((opt) => opt.label === fullName);
    return option ? option.value : fullName.split(" - ")[0] || fullName;
  };

  // Auto-populate Purchase Order Currency for non-foreign vendor account groups
  // Keeps the field editable (not read-only)
  React.useEffect(() => {
    if (isReadOnly) return;
    if (!formData.vendorAccountGroup) return;

    const isForeign = isForeignVendorAccountGroup(
      formData.vendorAccountGroup
    );

    if (!isForeign && !formData.purchaseOrderCurrency) {
      const options = (lovData?.purchaseOrderCurrency || []).filter(
        (o) => o && o.value && o.label
      );
      const inrOption =
        options.find((o) => (o.label || "").startsWith("INR")) ||
        options.find((o) => o.value === "INR");

      const valueToSet = inrOption ? inrOption.value : "INR";
      handleInputChange("purchaseOrderCurrency", valueToSet);
    }
  }, [
    isReadOnly,
    formData.vendorAccountGroup,
    formData.purchaseOrderCurrency,
    lovData?.purchaseOrderCurrency,
    handleInputChange,
  ]);

  // Auto-populate and lock Reconciliation Account based on vendorAccountGroup mapping
  React.useEffect(() => {
    if (isReadOnly) return;
    if (!formData.vendorAccountGroup) return;

    const mapping = getReconciliationMappingForVendorGroup(
      formData.vendorAccountGroup
    );
    if (!mapping) return; // No mapping, let user select from dropdown
    const mappedValue = mapping.value;

    const current = formData.reconciliationAccountInGeneralLedger;
    const normalizedCurrent = current ? current.toUpperCase().trim() : "";
    const normalizedMappedValue = mappedValue.toUpperCase().trim();
    const normalizedDisplayLabel = mapping.displayLabel
      ? mapping.displayLabel.toUpperCase().trim()
      : "";
    if (
      normalizedCurrent &&
      (normalizedCurrent === normalizedMappedValue ||
        normalizedCurrent === normalizedDisplayLabel ||
        normalizedCurrent.startsWith(normalizedMappedValue) ||
        (normalizedDisplayLabel &&
          normalizedCurrent.startsWith(normalizedDisplayLabel)))
    ) {
      return; // already matches mapped value
    }
    const options = (lovData?.reconciliationAccountInGeneralLedger || []).filter(
      (o) => o && o.value && o.label
    );
    // Try to find exact match by value
    const exact = options.find((o) => o.value === mappedValue);
    // Try to find by prefix in value
    const byValuePrefix = options.find((o) => {
      const optionValue = (o.value || "").toUpperCase();
      return (
        optionValue.startsWith(normalizedMappedValue) ||
        (normalizedDisplayLabel && optionValue.startsWith(normalizedDisplayLabel))
      );
    });
    // Try to find by prefix in label
    const byLabelPrefix = options.find((o) =>
      (o.label || "").toUpperCase().startsWith(normalizedMappedValue) ||
      (normalizedDisplayLabel &&
        (o.label || "").toUpperCase().startsWith(normalizedDisplayLabel))
    );

    const valueToSet =
      (exact || byValuePrefix || byLabelPrefix)?.value || mappedValue;
    handleInputChange("reconciliationAccountInGeneralLedger", valueToSet);
  }, [
    isReadOnly,
    formData.vendorAccountGroup,
    formData.reconciliationAccountInGeneralLedger,
    lovData?.reconciliationAccountInGeneralLedger,
    handleInputChange,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - 4 fields */}
          <div className="space-y-6 w-full">
            {/* Row 1 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="reconciliationAccountInGeneralLedger"
                className="text-sm font-medium"
              >
                Reconciliation Account in General Ledger{" "}
                <span className="text-destructive">*</span>
              </Label>
              {hasMappedReconciliationAccount(formData.vendorAccountGroup) ? (
                <Input
                  value={(() => {
                    const options = (lovData?.reconciliationAccountInGeneralLedger || []).filter(
                      (option) => option && option.value && option.label
                    );
                    const match = options.find(
                      (opt) => opt.value === formData.reconciliationAccountInGeneralLedger
                    );
                    // Fall back to mapped value if not found in LOV
                    const mapping = getReconciliationMappingForVendorGroup(
                      formData.vendorAccountGroup
                    );
                    if (match) return match.label;

                    // Try to match by label prefix if values differ
                    const labelMatch = options.find((opt) =>
                      (opt.label || "")
                        .toUpperCase()
                        .startsWith(
                          mapping?.displayLabel
                            ? mapping.displayLabel.toUpperCase()
                            : ""
                        )
                    );
                    if (labelMatch) return labelMatch.label;

                    return mapping?.displayLabel || mapping?.value || "";
                  })()}
                  readOnly
                  className="h-10 w-full field-readonly"
                  placeholder="Auto-selected based on vendor group"
                />
              ) : (
                <SearchableSelect
                  options={lovData?.reconciliationAccountInGeneralLedger || []}
                  value={formData.reconciliationAccountInGeneralLedger}
                  onValueChange={(value) => {
                    if (!isReadOnly) {
                      handleInputChange(
                        "reconciliationAccountInGeneralLedger",
                        value
                      );
                    }
                  }}
                  placeholder="Choose reconciliation account"
                  searchPlaceholder="Search reconciliation accounts..."
                  emptyMessage="No reconciliation accounts found"
                  triggerClassName="h-10 w-full"
                  disabled={isReadOnly}
                />
              )}
              {errors.reconciliationAccountInGeneralLedger && (
                <span className="text-destructive text-sm px-1">
                  {errors.reconciliationAccountInGeneralLedger}
                </span>
              )}
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="indicatorForWithHoldingTaxType1"
                className="text-sm font-medium"
              >
                Indicator for with Holding Tax Type 1
              </Label>
              {shouldWithholdingTaxBeReadOnly(
                formData.vendorAccountGroup,
                lovData,
                formData.typeOfVendor
              ) ? (
                <div className="space-y-1">
                  <Input
                    value={
                      formData.typeOfVendor === "Employee(FK01)"
                        ? getWithholdingTaxDisplayTextForEmployee(
                          formData.typeOfVendor,
                          formData.indicatorForWithHoldingTaxType1
                        )
                        : getWithholdingTaxDisplayText(
                          lovData,
                          formData.indicatorForWithHoldingTaxType1
                        )
                    }
                    readOnly
                    className="h-10 w-full field-readonly cursor-not-allowed"
                    placeholder={
                      formData.typeOfVendor === "Employee(FK01)"
                        ? "Not applicable for employees"
                        : "Auto-selected based on vendor group"
                    }
                  />
                </div>
              ) : (
                <SearchableSelect
                  options={getWithholdingTaxOptions()}
                  value={getShortCodeFromFullName(
                    formData.indicatorForWithHoldingTaxType1
                  )}
                  onValueChange={(value) => {
                    if (!isReadOnly) {
                      handleWithholdingTaxChange(
                        "indicatorForWithHoldingTaxType1",
                        value
                      );
                    }
                  }}
                  placeholder="Choose withholding tax type"
                  searchPlaceholder="Search withholding tax types..."
                  emptyMessage="No withholding tax types found"
                  triggerClassName="h-10 w-full"
                  disabled={isReadOnly}
                />
              )}
              {errors.indicatorForWithHoldingTaxType1 && (
                <span className="text-destructive text-sm px-1">
                  {errors.indicatorForWithHoldingTaxType1}
                </span>
              )}
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="purchasingOrganization"
                className="text-sm font-medium"
              >
                Purchasing Organization
                {isPurchasingOrganizationRequired(formData.typeOfVendor) && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              {(() => {
                // Check if purchasing organization should be readonly (auto-filled from company code for XK01)
                const isXK01 = formData.typeOfVendor && (
                  formData.typeOfVendor.trim().toUpperCase() === "XK01" ||
                  formData.typeOfVendor.trim().toUpperCase().includes("XK01")
                );
                const hasCompanyCode = formData.companyCode && formData.companyCode.trim() !== "";
                const shouldBeReadOnly = isXK01 && hasCompanyCode;

                // If should be readonly, show as Input with calculated value
                if (shouldBeReadOnly) {
                  const calculatedValue = formData.purchasingOrganization || "";
                  return (
                    <Input
                      value={calculatedValue}
                      readOnly
                      className="h-10 w-full field-readonly"
                      placeholder="Auto-filled from company code"
                    />
                  );
                }

                // Otherwise, use existing logic
                if (isPurchasingOrganizationEditable(formData.typeOfVendor)) {
                  return (
                    <SearchableSelect
                      options={lovData?.purchasingOrganization || []}
                      value={formData.purchasingOrganization}
                      onValueChange={(value) => {
                        if (!isReadOnly) {
                          handleInputChange("purchasingOrganization", value);
                        }
                      }}
                      placeholder="Choose purchasing organization"
                      searchPlaceholder="Search purchasing organizations..."
                      emptyMessage="No purchasing organizations found"
                      triggerClassName="h-10 w-full"
                      disabled={isReadOnly}
                    />
                  );
                } else {
                  return (
                    <Input
                      value=""
                      readOnly
                      className="h-10 w-full field-readonly"
                      placeholder="Not applicable for this vendor type"
                    />
                  );
                }
              })()}
              {errors.purchasingOrganization && (
                <span className="text-destructive text-sm px-1">
                  {errors.purchasingOrganization}
                </span>
              )}
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="responsibleSalesPersonAtVendorOffice"
                className="text-sm font-medium"
              >
                Responsible Sales Person at Vendor Office
              </Label>
              {isResponsibleSalesPersonEditable(formData.typeOfVendor) ? (
                <Input
                  id="responsibleSalesPersonAtVendorOffice"
                  value={formData.responsibleSalesPersonAtVendorOffice}
                  onChange={(e) => {
                    if (!isReadOnly) {
                      handleInputChange(
                        "responsibleSalesPersonAtVendorOffice",
                        e.target.value
                      );
                    }
                  }}
                  placeholder="Enter sales person name"
                  maxLength={29}
                  className={`h-10 w-full ${errors.responsibleSalesPersonAtVendorOffice
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${isReadOnly ? "field-readonly" : ""}`}
                  disabled={isReadOnly}
                />
              ) : (
                <Input
                  value=""
                  readOnly
                  className="h-10 w-full field-readonly"
                  placeholder="Not applicable for this vendor type"
                />
              )}
              {errors.responsibleSalesPersonAtVendorOffice && (
                <span className="text-destructive text-sm px-1">
                  {errors.responsibleSalesPersonAtVendorOffice}
                </span>
              )}
            </div>
          </div>

          {/* Right Column - 4 fields */}
          <div className="space-y-6 w-full">
            {/* Row 1 */}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="planningGroup" className="text-sm font-medium">
                Planning Group
              </Label>
              <Input
                id="planningGroup"
                value={formData.planningGroup}
                placeholder="Auto-filled based on vendor group"
                readOnly
                className="h-10 w-full field-readonly"
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="indicatorForWithHoldingTaxType2"
                className="text-sm font-medium"
              >
                Indicator for with Holding Tax Type 2
              </Label>
              {shouldWithholdingTaxBeReadOnly(
                formData.vendorAccountGroup,
                lovData,
                formData.typeOfVendor
              ) ? (
                <div className="space-y-1">
                  <Input
                    value={
                      formData.typeOfVendor === "Employee(FK01)"
                        ? getWithholdingTaxDisplayTextForEmployee(
                          formData.typeOfVendor,
                          formData.indicatorForWithHoldingTaxType2
                        )
                        : getWithholdingTaxDisplayText(
                          lovData,
                          formData.indicatorForWithHoldingTaxType2
                        )
                    }
                    readOnly
                    className="h-10 w-full field-readonly cursor-not-allowed"
                    placeholder={
                      formData.typeOfVendor === "Employee(FK01)"
                        ? "Not applicable for employees"
                        : "Auto-selected based on vendor group"
                    }
                  />
                </div>
              ) : (
                <SearchableSelect
                  options={getWithholdingTaxOptions()}
                  value={getShortCodeFromFullName(
                    formData.indicatorForWithHoldingTaxType2
                  )}
                  onValueChange={(value) => {
                    if (!isReadOnly) {
                      handleWithholdingTaxChange(
                        "indicatorForWithHoldingTaxType2",
                        value
                      );
                    }
                  }}
                  placeholder="Choose withholding tax type"
                  searchPlaceholder="Search withholding tax types..."
                  emptyMessage="No withholding tax types found"
                  triggerClassName="h-10 w-full"
                  disabled={isReadOnly}
                />
              )}
              {errors.indicatorForWithHoldingTaxType2 && (
                <span className="text-destructive text-sm px-1">
                  {errors.indicatorForWithHoldingTaxType2}
                </span>
              )}
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="purchaseOrderCurrency"
                className="text-sm font-medium"
              >
                Purchase Order Currency
                {isPurchaseOrderCurrencyRequired(formData.typeOfVendor) && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              {formData.vendorAccountGroup && !isForeignVendorAccountGroup(formData.vendorAccountGroup) ? (
                <Input
                  value={(() => {
                    const options = (lovData?.purchaseOrderCurrency || []).filter(
                      (option) => option && option.value && option.label
                    );
                    const match = options.find(
                      (opt) => opt.value === formData.purchaseOrderCurrency
                    );
                    return match ? match.label : "INR - Indian Rupee";
                  })()}
                  readOnly
                  className="h-10 w-full field-readonly"
                  placeholder="Auto-selected (INR)"
                />
              ) : (
                isPurchaseOrderCurrencyEditable(formData.typeOfVendor) ? (
                  <SearchableSelect
                    options={(lovData?.purchaseOrderCurrency || []).filter(
                      (option) => option && option.value && option.label
                    )}
                    value={formData.purchaseOrderCurrency}
                    onValueChange={(value) => {
                      if (!isReadOnly) {
                        handleInputChange("purchaseOrderCurrency", value);
                      }
                    }}
                    placeholder="Choose currency"
                    searchPlaceholder="Search currencies..."
                    emptyMessage="No currencies found"
                    triggerClassName="h-10 w-full"
                    disabled={isReadOnly}
                  />
                ) : (
                  <Input
                    value=""
                    readOnly
                    className="h-10 w-full field-readonly"
                    placeholder="Not applicable for this vendor type"
                  />
                )
              )}
              {errors.purchaseOrderCurrency && (
                <span className="text-destructive text-sm px-1">
                  {errors.purchaseOrderCurrency}
                </span>
              )}
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 gap-2">
              <Label
                htmlFor="orderAcknowledgmentRequirement"
                className="text-sm font-medium"
              >
                Order Acknowledgment Requirement
                {isOrderAcknowledgmentEditable(formData.typeOfVendor) && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              {isOrderAcknowledgmentEditable(formData.typeOfVendor) ? (
                <RadioGroup
                  value={formData.orderAcknowledgmentRequirement}
                  onValueChange={(value) => {
                    if (!isReadOnly) {
                      handleInputChange(
                        "orderAcknowledgmentRequirement",
                        value
                      );
                    }
                  }}
                  className="flex gap-4"
                  disabled={isReadOnly}
                >
                  <div
                    className={`flex items-center space-x-1 ${isReadOnly ? "opacity-60" : ""
                      }`}
                  >
                    <RadioGroupItem
                      value="Yes"
                      id="order-ack-yes"
                      disabled={isReadOnly}
                      className="border-muted-foreground"
                    />
                    <Label
                      htmlFor="order-ack-yes"
                      className={
                        isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                      }
                    >
                      Yes
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-1 ${isReadOnly ? "opacity-60" : ""
                      }`}
                  >
                    <RadioGroupItem
                      value="No"
                      id="order-ack-no"
                      disabled={isReadOnly}
                      className="border-muted-foreground"
                    />
                    <Label
                      htmlFor="order-ack-no"
                      className={
                        isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                      }
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
              ) : (
                <div className="flex gap-4">
                  <div className="flex items-center space-x-1 ">
                    <input
                      type="radio"
                      id="order-ack-disabled-yes"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    />
                    <Label
                      htmlFor="order-ack-disabled-yes"
                      className="text-muted-foreground"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="radio"
                      id="order-ack-disabled-no"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    />
                    <Label
                      htmlFor="order-ack-disabled-no"
                      className="text-muted-foreground"
                    >
                      No
                    </Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Not applicable for this vendor type
                  </span>
                </div>
              )}
              {errors.orderAcknowledgmentRequirement && (
                <span className="text-destructive text-sm px-1">
                  {errors.orderAcknowledgmentRequirement}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InternalDetailsSection;

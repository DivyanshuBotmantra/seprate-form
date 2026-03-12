/**
 * Custom hook for managing vendor form state and input changes
 * Consolidates form state, errors, and handles all field dependencies
 */

import { useState, useEffect, useCallback } from "react";
import type { VendorFormData, VendorFormErrors } from "@/components/vendor";
import type { LOVData } from "@/components/vendor";
import { VENDOR_FORM_DEFAULTS } from "@/config/vendor-form-config";
import * as VendorLogic from "@/lib/vendor-form-logic";
import {
  validateMSME,
  validateCIN,
  validatePhoneNumber,
  validateEmail,
  validateIFSC,
  validatePostalCode,
  validatePAN,
  isCINMandatory,
} from "@/components/vendor/validation";

interface UseVendorFormStateProps {
  initialData?: Partial<VendorFormData> | null;
  lovData: LOVData | null;
}

export const useVendorFormState = ({
  initialData,
  lovData,
}: UseVendorFormStateProps) => {
  const [formData, setFormData] =
    useState<VendorFormData>(VENDOR_FORM_DEFAULTS);
  const [errors, setErrors] = useState<VendorFormErrors>({});

  // Load initial data when available
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Calculate Type of Recipient fields when withholding tax types are loaded/changed
  useEffect(() => {
    if (!lovData) {
      console.log("⚠️ [TYPE_OF_RECIPIENT] LOV data not available yet");
      return;
    }

    if (
      !formData.indicatorForWithHoldingTaxType1 &&
      !formData.indicatorForWithHoldingTaxType2
    ) {
      console.log("⚠️ [TYPE_OF_RECIPIENT] No withholding tax types set");
      return;
    }

    console.log("🔍 [TYPE_OF_RECIPIENT] Calculating recipient types...");
    console.log(
      "  - WithholdingTax1:",
      formData.indicatorForWithHoldingTaxType1
    );
    console.log(
      "  - WithholdingTax2:",
      formData.indicatorForWithHoldingTaxType2
    );
    console.log("  - Current Recipient1:", formData.typeOfRecipient1);
    console.log("  - Current Recipient2:", formData.typeOfRecipient2);
    console.log("  - LOV receiptType1 available:", !!lovData.receiptType1);
    console.log("  - LOV receiptType2 available:", !!lovData.receiptType2);

    const recipientFields = VendorLogic.calculateTypeOfRecipientFields(
      formData.indicatorForWithHoldingTaxType1,
      formData.indicatorForWithHoldingTaxType2,
      lovData
    );

    console.log("✅ [TYPE_OF_RECIPIENT] Calculated values:");
    console.log("  - Recipient1:", recipientFields.typeOfRecipient1);
    console.log("  - Recipient2:", recipientFields.typeOfRecipient2);

    // Only update if the calculated values are different from current values
    if (
      recipientFields.typeOfRecipient1 !== formData.typeOfRecipient1 ||
      recipientFields.typeOfRecipient2 !== formData.typeOfRecipient2
    ) {
      console.log("🔄 [TYPE_OF_RECIPIENT] Updating form data with new values");
      setFormData((prev) => ({ ...prev, ...recipientFields }));
    } else {
      console.log(
        "✓ [TYPE_OF_RECIPIENT] Values already match, no update needed"
      );
    }
  }, [
    formData.indicatorForWithHoldingTaxType1,
    formData.indicatorForWithHoldingTaxType2,
    formData.typeOfRecipient1,
    formData.typeOfRecipient2,
    lovData,
  ]);

  // BUSINESS LOGIC: Auto-populate Purchasing Organization from Company Code on initial load (only for XK01)
  useEffect(() => {
    if (
      formData.typeOfVendor === "Non Emp - Purchase Org (XK01)" &&
      formData.companyCode &&
      formData.companyCode.trim() !== ""
    ) {
      const purchasingOrg =
        VendorLogic.calculatePurchasingOrganizationFromCompanyCode(
          formData.companyCode
        );
      // Only update if the calculated value is different from current value
      if (purchasingOrg) {
        setFormData((prev) => {
          // Check if value is already set correctly to avoid unnecessary updates
          if (prev.purchasingOrganization === purchasingOrg) {
            return prev;
          }
          return {
            ...prev,
            purchasingOrganization: purchasingOrg,
          };
        });
      }
    }
  }, [formData.typeOfVendor, formData.companyCode]);

  /**
   * Main input change handler with all business logic
   */
  const handleInputChange = useCallback(
    (field: keyof VendorFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // BUSINESS LOGIC: Clear employee number when vendor account group changes from V010
      if (field === "vendorAccountGroup") {
        if (
          VendorLogic.shouldClearEmployeeNumber(
            value,
            formData.vendorAccountGroup
          )
        ) {
          setFormData((prev) => ({ ...prev, employeeNumber: "" }));
          setErrors((prev) => ({ ...prev, employeeNumber: undefined }));
        }
      }

      // BUSINESS LOGIC: Clear Internal Details fields when Type of Vendor changes
      if (field === "typeOfVendor") {
        const fieldsToClear = VendorLogic.getInternalDetailsFieldsToClear();
        setFormData((prev) => ({ ...prev, ...fieldsToClear }));
        setErrors((prev) => ({
          ...prev,
          purchasingOrganization: undefined,
          purchaseOrderCurrency: undefined,
          responsibleSalesPersonAtVendorOffice: undefined,
          orderAcknowledgmentRequirement: undefined,
        }));
      }

      // BUSINESS LOGIC: Clear region when country changes
      if (field === "countryKey" && value !== formData.countryKey) {
        setFormData((prev) => ({ ...prev, region: "" }));
        setErrors((prev) => ({ ...prev, region: undefined }));
        console.log(
          `🔍 Cleared region selection (Country changed to: ${value})`
        );
      }

      // BUSINESS LOGIC: Auto-extract PAN from GSTIN
      if (field === "taxNumber3GSTIN" && value) {
        const extractedPAN = VendorLogic.extractPANFromGSTIN(value);
        if (extractedPAN) {
          setFormData((prev) => ({ ...prev, panNumber: extractedPAN }));

          // Reset withholding tax fields when PAN is extracted
          setFormData((prev) => ({
            ...prev,
            indicatorForWithHoldingTaxType1: "",
            indicatorForWithHoldingTaxType2: "",
          }));

          // Trigger withholding tax auto-selection
          if (formData.vendorAccountGroup) {
            const taxFields = VendorLogic.calculateWithholdingTaxFields(
              formData.vendorAccountGroup,
              extractedPAN,
              lovData
            );
            setFormData((prev) => ({ ...prev, ...taxFields }));
          }
        }
      }

      // BUSINESS LOGIC: Auto-select PAN Aadhar Linked Status based on PAN
      if (field === "panNumber" && value) {
        const aadharStatus = VendorLogic.determinePANAadharStatus(value);
        setFormData((prev) => ({
          ...prev,
          panAadharLinkedStatus: aadharStatus,
        }));

        // Reset withholding tax fields when PAN changes
        setFormData((prev) => ({
          ...prev,
          indicatorForWithHoldingTaxType1: "",
          indicatorForWithHoldingTaxType2: "",
        }));

        // Auto-select withholding tax types when PAN changes
        if (formData.vendorAccountGroup && value.length >= 4) {
          const taxFields = VendorLogic.calculateWithholdingTaxFields(
            formData.vendorAccountGroup,
            value,
            lovData
          );
          setFormData((prev) => ({ ...prev, ...taxFields }));
        }
      }

      // BUSINESS LOGIC: Auto-select withholding tax types when vendor account group changes
      if (field === "vendorAccountGroup" && value) {
        // Reset withholding tax fields
        setFormData((prev) => ({
          ...prev,
          indicatorForWithHoldingTaxType1: "",
          indicatorForWithHoldingTaxType2: "",
        }));

        // Auto-select if PAN is set
        if (formData.panNumber && formData.panNumber.length >= 4) {
          const taxFields = VendorLogic.calculateWithholdingTaxFields(
            value,
            formData.panNumber,
            lovData
          );
          setFormData((prev) => ({ ...prev, ...taxFields }));
        }
      }

      // BUSINESS LOGIC: Check if CIN is mandatory based on Name1, Name2, or PAN
      // Only applies to non-employee vendor types
      if (field === "name1" || field === "name2" || field === "panNumber") {
        const isEmployeeType =
          formData.typeOfVendor === "Employee" ||
          formData.typeOfVendor === "Employee(FK01)";

        if (!isEmployeeType) {
          const updatedFormData = { ...formData, [field]: value };
          // Use combined logic: old name-based + new PAN-based
          const isCinMandatory = isCINMandatory(
            updatedFormData.panNumber || "",
            updatedFormData.name1 || "",
            updatedFormData.name2 || ""
          );

          if (isCinMandatory && !updatedFormData.cinNumber) {
            setErrors((prev) => ({
              ...prev,
              cinNumber:
                "CIN Number is mandatory for company registration",
            }));
          } else if (!isCinMandatory) {
            setErrors((prev) => ({ ...prev, cinNumber: undefined }));
          }
        }
      }

      // BUSINESS LOGIC: Bank Details - IFSC Code logic
      if (field === "bankKeyIFSCCode") {
        if (value && value.length >= 4) {
          const bankDefaults = VendorLogic.getBankFieldDefaults(value);
          if (bankDefaults) {
            setFormData((prev) => ({ ...prev, ...bankDefaults }));
          }
        } else if (!value) {
          // Clear dependent fields when IFSC is removed
          const fieldsToClear = VendorLogic.getBankFieldsToClear();
          setFormData((prev) => ({ ...prev, ...fieldsToClear }));
          setErrors((prev) => ({
            ...prev,
            bankAccountNumber: undefined,
            accountHolderName: undefined,
          }));
        }
      }

      // BUSINESS LOGIC: Purchasing Organization and Currency based on Type of Vendor
      if (field === "typeOfVendor") {
        const purchasingDefaults = VendorLogic.getPurchasingDefaults(value);
        if (purchasingDefaults) {
          setFormData((prev) => ({ ...prev, ...purchasingDefaults }));
        } else {
          const fieldsToClear = VendorLogic.getInternalDetailsFieldsToClear();
          setFormData((prev) => ({ ...prev, ...fieldsToClear }));
        }

        // If changing to XK01 and companyCode is already set, auto-populate purchasingOrganization
        if (value === "Non Emp - Purchase Org (XK01)" && formData.companyCode) {
          const purchasingOrg = VendorLogic.calculatePurchasingOrganizationFromCompanyCode(
            formData.companyCode
          );
          if (purchasingOrg) {
            setFormData((prev) => ({
              ...prev,
              purchasingOrganization: purchasingOrg,
            }));
          }
        }
      }

      // BUSINESS LOGIC: Auto-populate Purchasing Organization from Company Code (only for XK01)
      if (field === "companyCode") {
        if (
          formData.typeOfVendor === "Non Emp - Purchase Org (XK01)" &&
          value
        ) {
          const purchasingOrg =
            VendorLogic.calculatePurchasingOrganizationFromCompanyCode(value);
          if (purchasingOrg) {
            setFormData((prev) => ({
              ...prev,
              purchasingOrganization: purchasingOrg,
            }));
          }
        }
      }

      // BUSINESS LOGIC: Calculate Type of Recipient when withholding tax types change
      if (
        field === "indicatorForWithHoldingTaxType1" ||
        field === "indicatorForWithHoldingTaxType2"
      ) {
        // Get the updated withholding tax values
        const updatedWithHoldingTax1 =
          field === "indicatorForWithHoldingTaxType1"
            ? value
            : formData.indicatorForWithHoldingTaxType1;
        const updatedWithHoldingTax2 =
          field === "indicatorForWithHoldingTaxType2"
            ? value
            : formData.indicatorForWithHoldingTaxType2;

        // Calculate Type of Recipient fields
        const recipientFields = VendorLogic.calculateTypeOfRecipientFields(
          updatedWithHoldingTax1,
          updatedWithHoldingTax2,
          lovData
        );

        setFormData((prev) => ({ ...prev, ...recipientFields }));
      }
    },
    [formData, errors, lovData]
  );

  /**
   * Validate a specific field
   */
  const validateField = useCallback(
    (field: keyof VendorFormData, value: string) => {
      let validationError: string | null = null;

      switch (field) {
      case "panNumber": {
        const valueLower = (value || "").toLowerCase();
        const isNA = valueLower.includes("na") || valueLower.includes("not applicable");
        const isEmployee =
          formData.typeOfVendor === "Employee" || formData.typeOfVendor === "Employee(FK01)";

        if (isEmployee) {
          // Optional for Employee(FK01); if provided and not NA, must match regex
          if (value && !isNA && !validatePAN(value)) {
            validationError = "Invalid PAN format. Please check and try again";
          }
        } else {
          // Non-employee: required unless NA; if provided and not NA, must match regex
          if (!value) {
            validationError = "Please enter PAN number";
          } else if (!isNA && !validatePAN(value)) {
            validationError = "Invalid PAN format. Please check and try again";
          }
        } 
        break;
      }
      case "creditInformationNumberMSME":
          if (value && value.trim()) {
            if (value.toLowerCase().includes("na")) {
              // Allow "NA" values - no error
              validationError = null;
            } else if (value.length !== 13) {
              validationError = "MSME number must be exactly 13 characters";
            } else if (!validateMSME(value)) {
              validationError =
                "MSME number must contain only letters, numbers, and hyphens";
            }
          }
          break;

        case "cinNumber": {
          // For Employee types: Skip CIN validation entirely (always NA)
          const isEmployeeTypeForCin =
            formData.typeOfVendor === "Employee" ||
            formData.typeOfVendor === "Employee(FK01)";

          if (isEmployeeTypeForCin) {
            validationError = null; // No validation for employees
          } else if (value && value.trim()) {
            // Validate CIN length and format based on PAN 4th character
            const panFourthChar = formData.panNumber?.charAt(3)?.toUpperCase();
            
            if (panFourthChar === "C") {
              // For PAN='C', CIN must be 21 characters (original format)
              if (value.length > 21) {
                validationError = "CIN number cannot exceed 21 characters";
              } else if (!validateCIN(value, formData.panNumber)) {
                validationError =
                  "Invalid format. CIN must be 21 characters starting with L or U (e.g., L12345AB1234ABC123456)";
              }
            } else if (panFourthChar === "F") {
              // For PAN='F', CIN must be 5-9 characters (new format: 3 letters + hyphen + 1-5 digits)
              if (value.length > 9) {
                validationError = "CIN number cannot exceed 9 characters";
              } else if (!validateCIN(value, formData.panNumber)) {
                validationError =
                  "Invalid format. CIN must be 3 letters, hyphen, then 1-5 digits (e.g., AAG-12345)";
              }
            } else {
              // For other cases, check both formats (backward compatibility)
              if (value.length > 21) {
                validationError = "CIN number cannot exceed 21 characters";
              } else if (!validateCIN(value, formData.panNumber)) {
                validationError =
                  "Invalid CIN format. Please check the format and try again";
              }
            }
          }
          break;
        }

        // Address section validations
        case "firstMobileNo":
          if (value && value.trim()) {
            if (!validatePhoneNumber(value)) {
              validationError = "Mobile number must be exactly 10 digits";
            }
          }
          break;

        case "firstTelephone":
          if (value && value.trim()) {
            if (!validatePhoneNumber(value)) {
              validationError = "Telephone number must be exactly 10 digits";
            }
          }
          break;

        case "telephoneDailing":
          if (value && value.trim()) {
            if (!validatePhoneNumber(value)) {
              validationError = "Telephone number must be exactly 10 digits";
            }
          }
          break;

        case "primaryEmail":
          if (value && value.trim()) {
            if (value.length > 60) {
              validationError = "Primary Email cannot exceed 60 characters";
            } else if (!validateEmail(value)) {
              validationError = "Please enter a valid email address";
            }
          }
          break;

        case "secondaryEmail":
          if (value && value.trim()) {
            if (value.length > 60) {
              validationError = "Secondary Email cannot exceed 60 characters";
            } else if (!validateEmail(value)) {
              validationError = "Please enter a valid email address";
            }
          }
          break;

        case "cityPostalCode":
          if (value && value.trim()) {
            // Check if vendor account group is Indian (non-foreign)
            const isIndianVendor =
              formData.vendorAccountGroup &&
              !formData.vendorAccountGroup.toLowerCase().includes("foreign");

            if (isIndianVendor) {
              // For Indian vendors, postal code must be exactly 6 digits
              if (value.length < 6) {
                validationError =
                  "Postal code must be exactly 6 digits for Indian vendors";
              } else if (!validatePostalCode(value, formData.countryKey)) {
                validationError =
                  "Postal code must be exactly 6 digits for Indian vendors";
              }
            } else if (!validatePostalCode(value, formData.countryKey)) {
              // For foreign vendors, use general validation
              validationError = "Please enter a valid postal code";
            }
          }
          break;

        // Bank section validations
        case "bankKeyIFSCCode":
          if (value && value.trim()) {
            if (!validateIFSC(value)) {
              validationError =
                "Invalid IFSC format. Please check and try again";
            }
          }
          break;

        case "bankAccountNumber":
          if (value && value.trim()) {
              if (value && value.length > 18) {
              validationError = "Bank Account Number cannot exceed 18 characters";
  }
            else if (!/^[a-zA-Z0-9\s.]+$/.test(value)) {
              validationError = "Bank account number can only contain alphanumeric characters, spaces, and dots";
            }
          }
          break;

        case "accountHolderName":
          if (value && value.trim()) {
            if (value.length > 60) {
              validationError =
                "Account holder name cannot exceed 60 characters";
            }
          }
          break;
      }

      if (validationError) {
        setErrors((prev) => ({ ...prev, [field]: validationError }));
      } else {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formData, lovData]
  );

  /**
   * Update form data directly (for bulk updates)
   */
  const updateFormData = useCallback((updates: Partial<VendorFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Set errors
   */
  const updateErrors = useCallback((newErrors: VendorFormErrors) => {
    setErrors(newErrors);
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    handleInputChange,
    updateFormData,
    updateErrors,
    validateField,
  };
};

// Validation utilities for vendor form

import type { VendorFormData, VendorFormErrors } from "./types";

// Regex validation functions
export const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
};

export const validateGSTIN = (gstin: string): boolean => {
    const gstinRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
    return gstinRegex.test(gstin);
};

export const validateMSME = (msme: string): boolean => {
    // Format: AA-00-0000000 (2 letters, hyphen, 2 digits, hyphen, 7 digits)
    const msmeRegex = /^[A-Za-z]{2}-\d{2}-\d{7}$/i;
    return msmeRegex.test(msme);
};

export const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
};

// Validate CIN based on PAN 4th character
// NEW LOGIC ONLY:
// 1. PAN 4th char = 'C': 21-character format (L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits)
// 2. PAN 4th char = 'F' AND LLP in names: 5-9 character format (3 letters + hyphen + 1-5 digits)
// 3. Other cases: CIN is not applicable (return false if provided)
export const validateCIN = (cin: string, panNumber?: string): boolean => {
    if (!cin || cin.trim() === "") return false;

    // PAN must be provided and have at least 4 characters for validation
    if (!panNumber || panNumber.length < 4) {
        return false;
    }

    const fourthChar = panNumber.charAt(3).toUpperCase();

    if (fourthChar === "C") {
        // PAN 4th char = 'C': Use original 21-character format
        // Format: L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits
        // Example: L12345AB1234ABC123456
        const cinRegex1 = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
        return cinRegex1.test(cin);
    } else if (fourthChar === "F") {
        // PAN 4th char = 'F': Use new format (3 letters + hyphen + 1-5 digits)
        // Format: 3 uppercase letters + hyphen + 1 to 5 digits (max 5)
        // Example: AAG-1, AAG-12, AAG-123, AAG-1234, AAG-12345 (max)
        const cinRegex2 = /^[A-Z]{3}-[0-9]{1,5}$/;
        return cinRegex2.test(cin);
    }

    // For other PAN 4th characters, CIN should not be provided (return false)
    return false;
};

// CIN mandatory check based on PAN 4th character + LLP in names
// NEW LOGIC ONLY (old name-based logic removed):
// 1. If PAN 4th char = 'C': CIN is mandatory (21-character format)
// 2. If PAN 4th char = 'F' AND "LLP" exists in name1/name2: CIN is mandatory (5-9 character format)
// 3. For other cases: CIN is "NA" (not mandatory)
export const isCINMandatory = (
    panNumber: string,
    name1: string,
    name2: string
): boolean => {
    // Check if PAN exists and has at least 4 characters
    if (!panNumber || panNumber.trim() === "" || panNumber.length < 4) {
        return false;
    }

    const fourthChar = panNumber.charAt(3).toUpperCase();

    // If PAN 4th char = 'C': CIN is mandatory (no name check needed)
    if (fourthChar === "C") {
        return true;
    }

    // If PAN 4th char = 'F': CIN is mandatory only if "LLP" exists in names
    if (fourthChar === "F") {
        const combined = `${name1 || ""} ${name2 || ""}`.toLowerCase();
        const hasLLP = combined.includes("llp");
        return hasLLP;
    }

    // For other PAN 4th characters, CIN is not mandatory (NA)
    return false;
};

export const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/; // Exactly 10 digits
    return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePostalCode = (
    postalCode: string,
    countryKey: string
): boolean => {
    if (!postalCode || !countryKey) return true; // Allow empty values

    // For Indian vendors (Country Key = 'IN'), postal code must be exactly 6 digits
    if (countryKey === "IN") {
        const postalRegex = /^\d{6}$/;
        return postalRegex.test(postalCode);
    }

    // For other countries, allow any format (no specific validation)
    return true;
};

// Helper function to check if field should show file upload
export const shouldShowFileUpload = (field: string, value: string): boolean => {
    if (!value || value.trim() === "") return false;

    const lowerValue = value.toLowerCase();
    if (
        lowerValue.includes("not registered") ||
        lowerValue.includes("not applicable") ||
        lowerValue.includes("na")
    ) {
        return false;
    }

    // Only show upload icon for complete, valid entries that match regex patterns
    switch (field) {
        case "taxNumber3GSTIN":
            return validateGSTIN(value); // Must match GSTIN regex pattern
        case "panNumber":
            return validatePAN(value); // Must match PAN regex pattern
        case "creditInformationNumberMSME":
            return validateMSME(value); // Must match MSME regex pattern
        case "cinNumber":
            return validateCIN(value); // Must match CIN regex pattern
        default:
            return false;
    }
};

// Helper function to check if PAN Aadhar Linked Status should be auto-selected and read-only
export const shouldAutoSelectPanAadhar = (panNumber: string): boolean => {
    if (!panNumber || panNumber.trim() === "") return false;

    // Check if PAN matches regex pattern and 4th character is 'P'
    return (
        validatePAN(panNumber) &&
        panNumber.length >= 4 &&
        panNumber.charAt(3) === "P"
    );
};

// Helper function to get PAN Aadhar Linked Status value based on vendor type and PAN number
export const getPanAadharLinkedStatusValue = (
    typeOfVendor: string,
    panNumber: string
): string => {
    // If type of vendor is Employee(FK01), always return "1"
    if (typeOfVendor === "Employee(FK01)") {
        return "1";
    }

    // For other vendor types, check 4th character of PAN number
    if (!panNumber || panNumber.trim() === "" || panNumber.length < 4) {
        return ""; // Return empty if PAN is not yet entered or too short
    }

    const fourthChar = panNumber.charAt(3).toUpperCase();
    // If 4th character is 'P', return "1" (PAN-Aadhaar linked)
    // Otherwise, return "2" (Not Applicable)
    return fourthChar === "P" ? "1" : "2";
};

// Helper function to check if PAN Aadhar Linked Status field should be read-only
export const shouldPanAadharLinkedStatusBeReadOnly = (
    typeOfVendor: string,
    panNumber: string
): boolean => {
    // Field is always read-only for Employee(FK01)
    if (typeOfVendor === "Employee(FK01)") {
        return true;
    }

    // For other vendor types, check if PAN number is valid and has 4 characters
    // Field should be read-only when PAN is entered and valid
    if (!panNumber || panNumber.trim() === "" || panNumber.length < 4) {
        return false; // Allow editing if PAN is not yet entered
    }

    return true; // Read-only when PAN is entered
};

// Helper function to get withholding tax type based on vendor group and PAN
export const getWithholdingTaxType = (
    vendorGroup: string,
    panNumber: string,
    taxType: 1 | 2
): string => {
    if (!vendorGroup || !panNumber || panNumber.length < 4) return "";

    const fourthLetter = panNumber.charAt(3).toUpperCase();

    // Check if vendor group is in the special list
    if (["V001", "V003", "V009"].includes(vendorGroup)) {
        if (vendorGroup === "V001") {
            // V001 logic: C→F1,FA | F→F2,FB | Other→F2,FB
            if (fourthLetter === "C") {
                const result = taxType === 1 ? "F1" : "FA";
                return result;
            } else if (fourthLetter === "F") {
                const result = taxType === 1 ? "F2" : "FB";
                return result;
            } else {
                // Other than C or F
                const result = taxType === 1 ? "F2" : "FB";
                return result;
            }
        } else if (vendorGroup === "V003") {
            if (fourthLetter === "C") {
                const result = taxType === 1 ? "C1" : "CA";
                return result;
            } else if (fourthLetter === "F") {
                const result = taxType === 1 ? "C4" : "CD";
                return result;
            } else {
                // Other than C or F
                const result = taxType === 1 ? "C2" : "CB";
                return result;
            }
        } else if (vendorGroup === "V009") {
            // V009 logic: C→C1,CA | F→C4,CD | Other→C2,CB
            if (fourthLetter === "C") {
                const result = taxType === 1 ? "C1" : "CA";
                return result;
            } else if (fourthLetter === "F") {
                const result = taxType === 1 ? "C4" : "CD";
                return result;
            } else {
                // Other than C or F
                const result = taxType === 1 ? "C2" : "CB";
                return result;
            }
        }
    }

    return ""; // For other groups, return empty (manual selection)
};

// Helper function to find the full withholding tax option from API data
export const findWithholdingTaxOption = (
    lovData: {
        indicatorForWithHoldingTaxType1?: Array<{ value: string; label: string }>;
    } | null,
    targetValue: string
): string => {
    if (!lovData?.indicatorForWithHoldingTaxType1 || !targetValue) return "";

    // Look for the option that starts with the target value
    const option = lovData.indicatorForWithHoldingTaxType1.find(
        (item: { value: string; label: string }) =>
            item.value === targetValue ||
            item.label?.startsWith(targetValue + " -") ||
            item.value?.startsWith(targetValue) ||
            item.label?.startsWith(targetValue)
    );

    if (option) {
        return option.value;
    } else {
        return targetValue;
    }
};

// Helper function to get the display text for withholding tax option
export const getWithholdingTaxDisplayText = (
    lovData: {
        indicatorForWithHoldingTaxType1?: Array<{ value: string; label: string }>;
    } | null,
    value: string
): string => {
    if (!lovData?.indicatorForWithHoldingTaxType1 || !value) return value;

    // Look for the option that matches the value
    const option = lovData.indicatorForWithHoldingTaxType1.find(
        (item: { value: string; label: string }) => item.value === value
    );

    return option ? option.label : value;
};

// Helper function to get display text for withholding tax (blank for Employee FK01)
export const getWithholdingTaxDisplayTextForEmployee = (
    typeOfVendor: string,
    currentValue: string
): string => {
    // For Employee(FK01), always return blank
    if (typeOfVendor === "Employee(FK01)") {
        return "";
    }
    return currentValue;
};

// Helper function to check if vendor account group is for foreign vendors
export const isForeignVendorAccountGroup = (
    vendorAccountGroup: string
): boolean => {
    if (!vendorAccountGroup) return false;
    return vendorAccountGroup.toLowerCase().includes("foreign");
};

// Helper function to check if withholding tax should be read-only
export const shouldWithholdingTaxBeReadOnly = (
    vendorGroup: string,
    lovData: {
        vendorAccPlanningGroup?: Array<{
            vendor_account_group: string;
            planning_group: string;
            bank_details_mandatory: string;
        }>;
    } | null,
    typeOfVendor?: string
): boolean => {
    // For Employee(FK01), always make withholding tax fields read-only
    if (typeOfVendor === "Employee(FK01)") {
        return true;
    }

    if (!vendorGroup || !lovData?.vendorAccPlanningGroup) return false;

    // Try exact match first
    const exactMatch = lovData.vendorAccPlanningGroup.find(
        (item) => item.vendor_account_group === vendorGroup
    );

    if (exactMatch) {
        // Check if this vendor group has special withholding tax rules
        // For now, we'll use the same logic but make it dynamic based on data
        const vendorGroupCode = vendorGroup.split(" - ")[0];
        return ["V001", "V003", "V009"].includes(vendorGroupCode);
    }

    // If no exact match, try to extract the code from the full name
    if (vendorGroup.includes(" - ")) {
        const code = vendorGroup.split(" - ")[0];
        const codeMatch = lovData.vendorAccPlanningGroup.find(
            (item) => item.vendor_account_group === code
        );

        if (codeMatch) {
            return ["V001", "V003", "V009"].includes(code);
        }
    }

    return false;
};

// Helper function to check if bank details are mandatory based on vendor account group
export const isBankDetailsMandatory = (
    vendorAccountGroup: string,
    lovData: {
        vendorAccPlanningGroup?: Array<{
            vendor_account_group: string;
            planning_group: string;
            bank_details_mandatory: string;
        }>;
    } | null
): boolean => {
    if (!vendorAccountGroup || !lovData?.vendorAccPlanningGroup) return false;

    // Try exact match first
    const exactMatch = lovData.vendorAccPlanningGroup.find(
        (item) => item.vendor_account_group === vendorAccountGroup
    );

    if (exactMatch) {
        return exactMatch.bank_details_mandatory === "Yes";
    }

    // If no exact match, try to extract the code from the full name (e.g., "V001 - RUSTM-Domestic Vendor-Material" -> "V001")
    if (vendorAccountGroup.includes(" - ")) {
        const code = vendorAccountGroup.split(" - ")[0];
        const codeMatch = lovData.vendorAccPlanningGroup.find(
            (item) => item.vendor_account_group === code
        );

        if (codeMatch) {
            return codeMatch.bank_details_mandatory === "Yes";
        }
    }

    return false;
};

// Helper function to check if vendor type is XK01 (handles both short code and full label)
const isXK01VendorType = (typeOfVendor: string): boolean => {
    if (!typeOfVendor) return false;
    const normalized = typeOfVendor.trim().toUpperCase();
    return normalized === "XK01" || normalized.includes("XK01");
};

// Helper functions for Internal Details conditional logic based on Type of Vendor
export const isPurchasingOrganizationRequired = (
    typeOfVendor: string
): boolean => {
    return isXK01VendorType(typeOfVendor);
};

export const isPurchasingOrganizationEditable = (
    typeOfVendor: string
): boolean => {
    return isXK01VendorType(typeOfVendor);
};

export const isPurchaseOrderCurrencyRequired = (
    typeOfVendor: string
): boolean => {
    return isXK01VendorType(typeOfVendor);
};

export const isPurchaseOrderCurrencyEditable = (
    typeOfVendor: string
): boolean => {
    return isXK01VendorType(typeOfVendor);
};

export const isResponsibleSalesPersonEditable = (
    typeOfVendor: string
): boolean => {
    return isXK01VendorType(typeOfVendor);
};

export const isOrderAcknowledgmentEditable = (
    typeOfVendor: string
): boolean => {
    return isXK01VendorType(typeOfVendor);
};

// System Fields calculation functions
export const calculateVendorClassificationForGST = (gstin: string): string => {
    if (!gstin || gstin.toLowerCase().includes("not registered")) {
        return "0";
    }
    return "";
};

export const calculateWithHoldingTaxCode = (
    withholdingTaxType: string
): string => {
    if (!withholdingTaxType) return "";

    // Return the full descriptive name instead of just the short code
    return withholdingTaxType;
};

export const calculateIndicatorSubjectToWithholdTax = (
    withholdingTaxType: string
): string => {
    return withholdingTaxType ? "Yes" : "No";
};

export const calculateTypeOfRecipient = (
    lovData: { receiptType1?: Array<{ value: string; label: string }> } | null,
    withholdingTaxType: string,
    type: 1 | 2
): string => {
    if (!lovData?.receiptType1 || !withholdingTaxType) {
        return "";
    }

    const receiptTypeKey = type === 1 ? "receiptType1" : "receiptType2";
    const receiptData = lovData[receiptTypeKey as keyof typeof lovData] as
        | Array<{ value: string; label: string }>
        | undefined;

    if (!receiptData) {
        return "";
    }

    // Find the mapping for the withholding tax type
    const mapping = receiptData.find((item) => item.value === withholdingTaxType);

    const result = mapping ? mapping.label : "";
    return result;
};

export const calculateGRBasedInvoiceVerification = (
    typeOfVendor: string
): string => {
    return isXK01VendorType(typeOfVendor) ? "Yes" : "No";
};

export const calculateServiceBasedInvoiceVerification = (
    typeOfVendor: string
): string => {
    return isXK01VendorType(typeOfVendor) ? "Yes" : "No";
};

export const calculateGroupForCalculationSchema = (
    typeOfVendor: string,
    vendorGroup: string
): string => {
    // If Type of Vendor is XK01 then calculate else Blank
    if (!isXK01VendorType(typeOfVendor)) {
        return "";
    }

    // Extract the short code from the full vendor group text (e.g., "V005 - RUSTM-Foreign Vendor-Service" -> "V005")
    const vendorGroupCode = vendorGroup ? vendorGroup.split(" - ")[0] : "";

    // Calculation: If Vendor Group is V002 or V005 or V007 then value is 04 else 03
    if (["V002", "V005", "V007"].includes(vendorGroupCode)) {
        return "04";
    }
    return "03";
};

export const calculateConfirmationControlKey = (
    typeOfVendor: string,
    orderAcknowledgment: string
): string => {
    // If Type of Vendor is XK01 then calculate else Blank
    if (!isXK01VendorType(typeOfVendor)) {
        return "";
    }

    // Calculation: If Order Acknowledgment Requirement is Yes then "0001" else Blank
    return orderAcknowledgment === "Yes" ? "0001" : "";
};

// Section validation functions
export const validateSection = (
    section:
        | "type"
        | "vendor"
        | "key"
        | "address"
        | "bank"
        | "internal"
        | "system",
    formData: VendorFormData,
    lovData?: {
        vendorAccPlanningGroup?: Array<{
            vendor_account_group: string;
            planning_group: string;
            bank_details_mandatory: string;
        }>;
    } | null
): { isValid: boolean; errors: VendorFormErrors } => {
    const newErrors: VendorFormErrors = {};

    if (section === "type") {
        if (!formData.typeOfVendor) {
            newErrors.typeOfVendor = "Please select a vendor type";
        }
    }

    if (section === "vendor") {
        if (!formData.vendorAccountGroup)
            newErrors.vendorAccountGroup = "Please select a vendor account group";
        if (!formData.termsOfPaymentKey)
            newErrors.termsOfPaymentKey = "Please select terms of payment";
        if (!formData.companyCode)
            newErrors.companyCode = "Please enter company code";
        if (!formData.titleText) newErrors.titleText = "Please enter title text";
        if (!formData.searchTerm1)
            newErrors.searchTerm1 = "Please enter search term";
        if (!formData.name1) newErrors.name1 = "Please enter vendor name";

        // Employee Number is mandatory only if Vendor Account Group is V010
        const vendorGroupCode = formData.vendorAccountGroup
            ? formData.vendorAccountGroup.split(" - ")[0]
            : "";
        if (vendorGroupCode === "V010" && !formData.employeeNumber) {
            newErrors.employeeNumber =
                "Employee number is required for this vendor group";
        }
    }

    if (section === "key") {
        // Tax Number 3 (GSTIN) - Validation based on gstinRequirement from Step 1
        const isEmployeeType =
            formData.typeOfVendor === "Employee" ||
            formData.typeOfVendor === "Employee(FK01)";
        const isGstinNotRequired = formData.gstinRequirement === "Not Registered";

        // Only validate GSTIN if it has a value
        if (formData.taxNumber3GSTIN) {
            if (
                formData.taxNumber3GSTIN.toLowerCase().includes("not registered") ||
                formData.taxNumber3GSTIN.toLowerCase().includes("na")
            ) {
                // Allow "Not Registered" or "NA" values
            } else if (!validateGSTIN(formData.taxNumber3GSTIN)) {
                newErrors.taxNumber3GSTIN =
                    "Invalid GSTIN format. Please check and try again";
            }
        } else if (!isEmployeeType && !isGstinNotRequired) {
            // GSTIN is required only for non-Employee types AND when gstinRequirement is not "Not Required"
            newErrors.taxNumber3GSTIN = "Please enter GSTIN number";
        }

        // PAN VALIDATION (final rules)
        /* The above TypeScript code is performing validation checks on a form data object related to
        vendor information. Here is a summary of what the code is doing: */
        /* ---------------------- PAN VALIDATION ---------------------- */

        const isEmployee =
            formData.typeOfVendor === "Employee" ||
            formData.typeOfVendor === "Employee(FK01)";

        const isForeign = formData.vendorAccountGroup
            ?.toLowerCase()
            .includes("foreign");

        const gstRegistered = formData.gstinRequirement === "Registered";

        const pan = formData.panNumber?.trim().toUpperCase();

        /* ------------ 1. FOREIGN VENDOR LOGIC ------------ */
        if (isForeign) {
            if (!pan) {
                newErrors.panNumber = "For foreign vendors, PAN must be 'NOT APPLICABLE'";
            } else if (pan === "NA") {
                newErrors.panNumber = "PAN cannot be NA for foreign vendors";
            } else if (pan !== "NOT APPLICABLE" && !validatePAN(pan)) {
                newErrors.panNumber =
                    "Foreign vendors must enter ONLY 'NOT APPLICABLE' or valid PAN";
            }
        }

        /* ------------ 2. EMPLOYEE LOGIC ------------ */
        else if (isEmployee) {
            if (pan && pan !== "NOT APPLICABLE" && !validatePAN(pan)) {
                newErrors.panNumber = "Invalid PAN format. Please check and try again";
            }
        }

        /* ------------ 3. INDIAN VENDOR LOGIC ------------ */
        else {
            if (!gstRegistered) {
                if (!pan) {
                    newErrors.panNumber = "PAN is required";
                } else if (pan === "NA" || pan === "NOT APPLICABLE") {
                    newErrors.panNumber = "PAN cannot be NA for Indian vendors";
                } else if (!validatePAN(pan)) {
                    newErrors.panNumber = "Invalid PAN format. Please check and try again";
                }
            }

            if (gstRegistered && pan) {
                if (pan !== "NA" && !validatePAN(pan)) {
                    newErrors.panNumber = "Invalid PAN format. Please check and try again";
                }
            }
        }

        /* ------------ 4. PAN FILE VALIDATION (ALWAYS RUNS) ------------ */

        const isPanAutoExtractedFromGstin =
            !!formData.taxNumber3GSTIN &&
            validateGSTIN(formData.taxNumber3GSTIN) &&
            pan === formData.taxNumber3GSTIN.substring(2, 12);

        if (
            pan &&
            pan !== "NOT APPLICABLE" &&
            !formData.panNumberFile &&
            !isPanAutoExtractedFromGstin
        ) {
            newErrors.panNumberFile = "Please upload PAN document";
        }



        // Credit Information Number (MSME)
        const isNonMSMEDStatus = (formData.reMSMEStatus || "").startsWith("Z002");

        if (isNonMSMEDStatus) {
            // For NON-MSMED, value must be NA (set by UI) and no numeric check
            if (
                formData.creditInformationNumberMSME &&
                formData.creditInformationNumberMSME.toUpperCase() !== "NA"
            ) {
                newErrors.creditInformationNumberMSME =
                    "For NON-MSMED, MSME number must be NA";
            }
        } else {
            // For other statuses: required and must be exactly 13 characters (letters, numbers, and hyphens)
            if (!formData.creditInformationNumberMSME) {
                newErrors.creditInformationNumberMSME = "Please enter MSME number";
            } else if (
                formData.creditInformationNumberMSME.length !== 13 ||
                !validateMSME(formData.creditInformationNumberMSME)
            ) {
                newErrors.creditInformationNumberMSME =
                    "MSME number must be exactly 13 characters (letters, numbers, and hyphens only)";
            }
        }

        // PAN Aadhar Linked Status - Required (but auto-selected based on vendor type and PAN)
        const panAadharValue = getPanAadharLinkedStatusValue(
            formData.typeOfVendor,
            formData.panNumber
        );
        if (!formData.panAadharLinkedStatus && !panAadharValue) {
            newErrors.panAadharLinkedStatus =
                "Please select PAN Aadhar linked status";
        }

        // MSME Status - Required
        if (!formData.reMSMEStatus) {
            newErrors.reMSMEStatus = "Please select MSME status";
        }

        // CIN Number rules (NEW LOGIC ONLY - old name-based logic removed):
        // - Not applicable for Employee types (Employee or Employee(FK01))
        // - For non-employees: Mandatory only if:
        //   1. PAN 4th char = 'C': CIN is mandatory (21-character format)
        //   2. PAN 4th char = 'F' AND "LLP" exists in name1/name2: CIN is mandatory (5-9 character format)
        //   3. Other cases: CIN is "NA" (not mandatory)
        const isEmployeeTypeKey =
            formData.typeOfVendor === "Employee" ||
            formData.typeOfVendor === "Employee(FK01)";

        // For Employee types: Skip CIN validation entirely (always NA)
        if (!isEmployeeTypeKey) {
            // Use new PAN-based logic only
            const isCinMandatory = isCINMandatory(
                formData.panNumber || "",
                formData.name1 || "",
                formData.name2 || ""
            );

            const panFourthChar = formData.panNumber?.charAt(3)?.toUpperCase();

            if (isCinMandatory && !formData.cinNumber) {
                // CIN is mandatory but not provided
                if (panFourthChar === "C") {
                    newErrors.cinNumber =
                        "Please enter CIN number (21-character format required)";
                } else if (panFourthChar === "F") {
                    newErrors.cinNumber =
                        "Please enter CIN number (5-9 character format required for LLP)";
                } else {
                    newErrors.cinNumber =
                        "Please enter CIN number for company registration";
                }
            } else if (formData.cinNumber) {
                // CIN is provided - validate format based on PAN 4th character
                if (panFourthChar === "C") {
                    // For PAN='C', CIN must be 21 characters (original format)
                    if (formData.cinNumber.length > 21) {
                        newErrors.cinNumber = "CIN number cannot exceed 21 characters";
                    } else if (!validateCIN(formData.cinNumber, formData.panNumber)) {
                        newErrors.cinNumber = "Invalid format. CIN must be 21 characters starting with L or U (e.g., L12345AB1234ABC123456)";
                    }
                } else if (panFourthChar === "F") {
                    // For PAN='F', CIN is only valid if LLP is in names (checked by isCINMandatory)
                    // Validate 5-9 character format: 3 letters + hyphen + 1-5 digits
                    if (formData.cinNumber.length > 9) {
                        newErrors.cinNumber = "CIN number cannot exceed 9 characters";
                    } else if (!validateCIN(formData.cinNumber, formData.panNumber)) {
                        newErrors.cinNumber = "Invalid format. CIN must be 3 letters, hyphen, then 1-5 digits (e.g., AAG-12345)";
                    }
                } else {
                    // For other PAN 4th characters, CIN should be "NA" (not applicable)
                    // If CIN is provided when it shouldn't be, show error
                    newErrors.cinNumber = "CIN is not applicable for this PAN type. Please leave this field empty (NA)";
                }
            } else if (!isCinMandatory) {
                // CIN is not mandatory (should be NA) - no error
                // Clear any existing CIN errors
                delete newErrors.cinNumber;
            }
        }

        // File validation - files are mandatory when details are filled
        if (
            formData.taxNumber3GSTIN &&
            !formData.taxNumber3GSTIN.toLowerCase().includes("not registered") &&
            !formData.taxNumber3GSTINFile
        ) {
            newErrors.taxNumber3GSTINFile = "Please upload GSTIN document";
        }

        if (
            formData.creditInformationNumberMSME &&
            !formData.creditInformationNumberMSME.toLowerCase().includes("na") &&
            !formData.creditInformationNumberMSMEFile
        ) {
            newErrors.creditInformationNumberMSMEFile =
                "Please upload MSME certificate";
        }

        // CIN file upload is mandatory only if CIN matches the regex pattern
        if (
            formData.cinNumber &&
            validateCIN(formData.cinNumber, formData.panNumber) &&
            !formData.cinNumberFile
        ) {
            newErrors.cinNumberFile = "Please upload CIN document";
        }

        // PAN Aadhar Linked Status File - Not required for Employee(FK01)
        if (formData.typeOfVendor !== "Employee(FK01)") {
            const panAadharValue = getPanAadharLinkedStatusValue(
                formData.typeOfVendor,
                formData.panNumber
            );
            if (panAadharValue === "1" && !formData.panAadharLinkedStatusFile) {
                newErrors.panAadharLinkedStatusFile =
                    "Please upload PAN Aadhar Linked Status document";
            }
        }
    }

    if (section === "address") {
        // Required fields according to specification
        if (!formData.street1) newErrors.street1 = "Please enter street address";
        if (!formData.cityPostalCode)
            newErrors.cityPostalCode = "Please enter postal code";
        if (!formData.city) newErrors.city = "Please enter city name";
        if (!formData.countryKey) newErrors.countryKey = "Please select country";
        if (!formData.region) newErrors.region = "Please select region";

        // Length validations
        if (formData.street1 && formData.street1.length > 35)
            newErrors.street1 = "Street 1 cannot exceed 35 characters";
        if (formData.street2 && formData.street2.length > 35)
            newErrors.street2 = "Street 2 cannot exceed 35 characters";
        if (formData.street3 && formData.street3.length > 35)
            newErrors.street3 = "Street 3 cannot exceed 35 characters";
        if (formData.street4 && formData.street4.length > 35)
            newErrors.street4 = "Street 4 cannot exceed 35 characters";
        if (formData.street5 && formData.street5.length > 35)
            newErrors.street5 = "Street 5 cannot exceed 35 characters";
        if (formData.district && formData.district.length > 35)
            newErrors.district = "District cannot exceed 35 characters";
        if (formData.city && formData.city.length > 35)
            newErrors.city = "City cannot exceed 35 characters";
        if (formData.cityPostalCode && formData.cityPostalCode.length > 6)
            newErrors.cityPostalCode = "City Postal Code cannot exceed 6 characters";

        // Postal code format validation - exactly 6 digits for Indian vendors
        if (formData.cityPostalCode && formData.cityPostalCode.length > 0) {
            // Check if vendor account group is Indian (non-foreign)
            const isIndianVendor =
                formData.vendorAccountGroup &&
                !formData.vendorAccountGroup.toLowerCase().includes("foreign");

            if (isIndianVendor) {
                // For Indian vendors, postal code must be exactly 6 digits
                if (formData.cityPostalCode.length < 6) {
                    newErrors.cityPostalCode =
                        "Postal code must be exactly 6 digits for Indian vendors";
                } else if (
                    !validatePostalCode(formData.cityPostalCode, formData.countryKey)
                ) {
                    newErrors.cityPostalCode =
                        "Postal code must be exactly 6 digits for Indian vendors";
                }
            } else if (
                !validatePostalCode(formData.cityPostalCode, formData.countryKey)
            ) {
                // For foreign vendors, use general validation
                newErrors.cityPostalCode = "Please enter a valid postal code";
            }
        }
        // Phone number validation - must be exactly 10 digits
        if (formData.firstMobileNo && formData.firstMobileNo.length > 0) {
            if (!validatePhoneNumber(formData.firstMobileNo)) {
                newErrors.firstMobileNo = "Mobile number must be exactly 10 digits";
            }
        }
        if (formData.firstTelephone && formData.firstTelephone.length > 0) {
            if (!validatePhoneNumber(formData.firstTelephone)) {
                newErrors.firstTelephone = "Telephone number must be exactly 10 digits";
            }
        }
        if (formData.telephoneDailing && formData.telephoneDailing.length > 0) {
            if (!validatePhoneNumber(formData.telephoneDailing)) {
                newErrors.telephoneDailing =
                    "Telephone number must be exactly 10 digits";
            }
        }

        // Email length validation
        if (formData.primaryEmail && formData.primaryEmail.length > 60)
            newErrors.primaryEmail = "Primary Email cannot exceed 60 characters";
        if (formData.secondaryEmail && formData.secondaryEmail.length > 60)
            newErrors.secondaryEmail = "Secondary Email cannot exceed 60 characters";

        // Email format validation
        if (formData.primaryEmail && formData.primaryEmail.length > 0) {
            if (!validateEmail(formData.primaryEmail)) {
                newErrors.primaryEmail = "Please enter a valid email address";
            }
        }
        if (formData.secondaryEmail && formData.secondaryEmail.length > 0) {
            if (!validateEmail(formData.secondaryEmail)) {
                newErrors.secondaryEmail = "Please enter a valid email address";
            }
        }
    }

    if (section === "bank") {
        // Check if bank details are mandatory based on vendor account group
        const isBankMandatory = isBankDetailsMandatory(
            formData.vendorAccountGroup,
            lovData || null
        );

        // IFSC Code validation
        if (formData.bankKeyIFSCCode && !validateIFSC(formData.bankKeyIFSCCode)) {
            newErrors.bankKeyIFSCCode =
                "Invalid IFSC format. Please check and try again";
        }

        // Bank details are mandatory if vendor account group requires it
        if (isBankMandatory) {
            if (!formData.bankKeyIFSCCode) {
                newErrors.bankKeyIFSCCode =
                    "Bank details are mandatory for this vendor account group";
            }
            if (!formData.bankAccountNumber) {
                newErrors.bankAccountNumber =
                    "Bank account number is mandatory for this vendor account group";
            }
            if (!formData.accountHolderName) {
                newErrors.accountHolderName =
                    "Account holder name is mandatory for this vendor account group";
            }
            if (!formData.bankKeyIFSCCodeFile) {
                newErrors.bankKeyIFSCCodeFile =
                    "Bank details document is mandatory for this vendor account group";
            }
        } else {
            // Bank Account Number, Account Holder Name, and File Upload are mandatory if IFSC is provided (existing logic)
            if (formData.bankKeyIFSCCode && !formData.bankAccountNumber) {
                newErrors.bankAccountNumber = "Please enter bank account number";
            }
            if (formData.bankKeyIFSCCode && !formData.accountHolderName) {
                newErrors.accountHolderName = "Please enter account holder name";
            }
            if (formData.bankKeyIFSCCode && !formData.bankKeyIFSCCodeFile) {
                newErrors.bankKeyIFSCCodeFile = "Please upload bank details document";
            }
        }

        // Length validations
        if (formData.bankKeyIFSCCode && formData.bankKeyIFSCCode.length > 11) {
            newErrors.bankKeyIFSCCode = "IFSC Code cannot exceed 11 characters";
        }
        if (formData.bankAccountNumber && formData.bankAccountNumber.length > 18) {
            newErrors.bankAccountNumber =
                "Bank Account Number cannot exceed 18 characters";
        }
        if (formData.accountHolderName && formData.accountHolderName.length > 60) {
            newErrors.accountHolderName =
                "Account Holder Name cannot exceed 60 characters";
        }
    }

    if (section === "internal") {
        // Required fields
        if (!formData.reconciliationAccountInGeneralLedger) {
            newErrors.reconciliationAccountInGeneralLedger =
                "Please select reconciliation account";
        }

        // Conditional requirements based on Type of Vendor
        if (
            isPurchasingOrganizationRequired(formData.typeOfVendor) &&
            !formData.purchasingOrganization
        ) {
            newErrors.purchasingOrganization =
                "Please select purchasing organization";
        }

        if (
            isPurchaseOrderCurrencyRequired(formData.typeOfVendor) &&
            !formData.purchaseOrderCurrency
        ) {
            newErrors.purchaseOrderCurrency = "Please select purchase order currency";
        }

        if (
            isOrderAcknowledgmentEditable(formData.typeOfVendor) &&
            !formData.orderAcknowledgmentRequirement
        ) {
            newErrors.orderAcknowledgmentRequirement =
                "Please select order acknowledgment requirement";
        }

        // Length validations
        // Reconciliation account is selected from a dropdown and may include
        // descriptive text (e.g., "1000090110 - VENDOR - EMPLOYEE").
        // Do not enforce a max-length constraint here.
        if (formData.planningGroup && formData.planningGroup.length > 3) {
            newErrors.planningGroup = "Planning Group cannot exceed 3 characters";
        }
        // if (formData.indicatorForWithHoldingTaxType1 && formData.indicatorForWithHoldingTaxType1.length > 2) {
        //     newErrors.indicatorForWithHoldingTaxType1 = 'Withholding Tax Type 1 cannot exceed 2 characters';
        // }
        // if (formData.indicatorForWithHoldingTaxType2 && formData.indicatorForWithHoldingTaxType2.length > 2) {
        //     newErrors.indicatorForWithHoldingTaxType2 = 'Withholding Tax Type 2 cannot exceed 2 characters';
        // }
        if (
            formData.purchasingOrganization &&
            formData.purchasingOrganization.length > 4
        ) {
            newErrors.purchasingOrganization =
                "Purchasing Organization cannot exceed 4 characters";
        }
        if (
            formData.responsibleSalesPersonAtVendorOffice &&
            formData.responsibleSalesPersonAtVendorOffice.length > 29
        ) {
            newErrors.responsibleSalesPersonAtVendorOffice =
                "Responsible Sales Person cannot exceed 29 characters";
        }
    }

    if (section === "system") {
        // Required fields
        if (!formData.name3) {
            newErrors.name3 = "Name 3 is required";
        }
        if (!formData.individualPMTCheck) {
            newErrors.individualPMTCheck = "Individual PMT Check is required";
        }
        if (!formData.keyForSortingAccordingToAssignment) {
            newErrors.keyForSortingAccordingToAssignment =
                "Key for Sorting According to Assignment is required";
        }
        if (!formData.listOfPaymentMethodsToBeConsider) {
            newErrors.listOfPaymentMethodsToBeConsider =
                "List of Payment Methods to be Consider is required";
        }
        if (!formData.withHoldingTaxCountryKey) {
            newErrors.withHoldingTaxCountryKey =
                "With Holding Tax Country Key is required";
        }

        // Length validations
        if (formData.name3 && formData.name3.length > 1) {
            newErrors.name3 = "Name 3 cannot exceed 1 character";
        }
        if (formData.name4 && formData.name4.length > 14) {
            newErrors.name4 = "Name 4 cannot exceed 14 characters";
        }
        if (
            formData.keyForSortingAccordingToAssignment &&
            formData.keyForSortingAccordingToAssignment.length > 7
        ) {
            newErrors.keyForSortingAccordingToAssignment =
                "Key for Sorting According to Assignment cannot exceed 7 characters";
        }
        if (
            formData.listOfPaymentMethodsToBeConsider &&
            formData.listOfPaymentMethodsToBeConsider.length > 7
        ) {
            newErrors.listOfPaymentMethodsToBeConsider =
                "List of Payment Methods to be Consider cannot exceed 7 characters";
        }
    }

    return {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
    };
};

// Helper function to check if file upload is mandatory for a field
export const isFileUploadMandatory = (
    field: string,
    value: string,
    typeOfVendor?: string,
    panNumber?: string // Optional PAN number for CIN validation
): boolean => {
    if (!value || value.trim() === "") return false;

    // For PAN-Aadhar Linked Status, mandatory if value is "1" BUT not for Employee(FK01)
    if (field === "panAadharLinkedStatus") {
        if (typeOfVendor === "Employee(FK01)") {
            return false; // File upload not required for Employee(FK01)
        }
        return value === "1";
    }

    // For other fields, mandatory if value matches regex pattern
    const lowerValue = value.toLowerCase();
    if (
        lowerValue.includes("not registered") ||
        lowerValue.includes("not applicable") ||
        lowerValue.includes("na")
    ) {
        return false;
    }

    switch (field) {
        case "taxNumber3GSTIN":
            return validateGSTIN(value);
        case "panNumber":
            return validatePAN(value);
        case "creditInformationNumberMSME":
            return validateMSME(value);
        case "cinNumber":
            // CIN validation requires PAN number to determine format
            return panNumber ? validateCIN(value, panNumber) : false;
        default:
            return false;
    }
};

// Helper function to check if file upload should be shown (mandatory or optional)
export const shouldShowFileUploadForKeyDetails = (
    field: string,
    value: string,
    typeOfVendor?: string
): boolean => {
    if (!value || value.trim() === "") return false;

    // For PAN-Aadhar Linked Status, don't show file upload for Employee(FK01)
    if (field === "panAadharLinkedStatus" && typeOfVendor === "Employee(FK01)") {
        return false;
    }

    // Always show upload for key detail fields when value is present
    const keyDetailFields = [
        "taxNumber3GSTIN",
        "panNumber",
        "cinNumber",
        "creditInformationNumberMSME",
        "panAadharLinkedStatus",
    ];
    return keyDetailFields.includes(field);
};

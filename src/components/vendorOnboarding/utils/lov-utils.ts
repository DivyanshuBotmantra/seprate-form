/**
 * LOV (List of Values) Utility Functions
 * Handles parsing, mapping, and lookup logic for vendor form dropdowns.
 */

import type { 
    LOVData, 
    APILOVResponse, 
    APILOVItem, 
    DropdownOption, 
    VendorPlanningGroupMapping,
    CountryRegionMapping
} from './types';

/**
 * Maps the raw API LOV response into a structured object for UI components.
 */
export const mapAPILOVToDropdown = (apiResponse: APILOVResponse): LOVData => {
    const mappedLOV: LOVData = {
        vendorAccountGroup: [],
        termsOfPaymentKey: [],
        companyCode: [],
        titleText: [],
        reMSMEStatus: [],
        reconciliationAccountInGeneralLedger: [],
        indicatorForWithHoldingTaxType1: [],
        indicatorForWithHoldingTaxType2: [],
        purchasingOrganization: [],
        planningGroup: [],
        receiptType1: [],
        receiptType2: [],
        vendorAccPlanningGroup: [],
        countryRegionMapping: [],
        countryOptions: [],
        purchaseOrderCurrency: []
    };

    if (!apiResponse?.response_body || !Array.isArray(apiResponse.response_body)) {
        return mappedLOV;
    }

    apiResponse.response_body.forEach((item: APILOVItem) => {
        const { lov_type, lov_json } = item;

        switch (lov_type) {
            case 'company_code':
                mappedLOV.companyCode = mapStandardOptions(lov_json.company_code);
                break;
            
            case 'payment_terms':
                mappedLOV.termsOfPaymentKey = mapStandardOptions(lov_json.payment_terms);
                break;
            
            case 'title':
                mappedLOV.titleText = mapStandardOptions(lov_json.title);
                break;
            
            case 'recon_account':
                mappedLOV.reconciliationAccountInGeneralLedger = mapStandardOptions(lov_json.recon_account);
                break;
            
            case 'purchassing_organization':
                mappedLOV.purchasingOrganization = mapStandardOptions(lov_json.purchassing_organization);
                break;
            
            case 'planning_group':
                mappedLOV.planningGroup = mapStandardOptions(lov_json.planning_group);
                break;
            
            case 'msmestatus_industrykey':
                mappedLOV.reMSMEStatus = mapStandardOptions(lov_json.msmestatus_industrykey);
                break;

            case 'withholding_tax_receipt_type': {
                const data = lov_json.withholding_tax_receipt_type;
                if (Array.isArray(data)) {
                    const options = data.map(i => ({ value: i.withholding_tax_type, label: i.withholding_tax_type }));
                    mappedLOV.indicatorForWithHoldingTaxType1 = options;
                    mappedLOV.indicatorForWithHoldingTaxType2 = options;
                    
                    const receiptMappings = data.map(i => ({ value: i.withholding_tax_type, label: i.receipt_type }));
                    mappedLOV.receiptType1 = receiptMappings;
                    mappedLOV.receiptType2 = receiptMappings;
                }
                break;
            }

            case 'vendor_acc_planning_group': {
                const data = lov_json.vendor_acc_planning_group;
                if (Array.isArray(data)) {
                    mappedLOV.vendorAccPlanningGroup = data.map(i => ({
                        vendor_account_group: i.vendor_account_group,
                        planning_group: i.planning_group,
                        bank_details_mandatory: i.bank_details_mandatory
                    }));
                    mappedLOV.vendorAccountGroup = data.map(i => ({
                        value: i.vendor_account_group,
                        label: i.vendor_account_group
                    }));
                }
                break;
            }

            case 'country_region_mapping': {
                const data = lov_json.country_region_mapping;
                if (Array.isArray(data)) {
                    const mappings: CountryRegionMapping[] = [];
                    const countryMap = new Map<string, string>();

                    data.forEach(item => {
                        if (!item.country_key || !item.region) return;
                        
                        const countryCode = item.country_key.split(' - ')[0].trim();
                        countryMap.set(countryCode, item.country_key);

                        if (Array.isArray(item.region)) {
                            item.region.forEach((r: string) => mappings.push({ country_key: countryCode, region: r.trim() }));
                        } else {
                            mappings.push({ country_key: countryCode, region: item.region.trim() });
                        }
                    });

                    mappedLOV.countryRegionMapping = mappings;
                    mappedLOV.countryOptions = Array.from(countryMap.entries()).map(([value, label]) => ({ value, label }));
                }
                break;
            }

            case 'purchase_order_currency': {
                const data = lov_json.purchase_order_currency;
                if (Array.isArray(data)) {
                    mappedLOV.purchaseOrderCurrency = data.map(c => ({ value: c.trim(), label: c.trim() }));
                } else if (data && typeof data === 'object') {
                    mappedLOV.purchaseOrderCurrency = Object.entries(data as Record<string, string>).map(([code, name]) => ({
                        value: code.trim(),
                        label: `${code.trim()} - ${name.trim()}`
                    })).sort((a, b) => a.label.localeCompare(b.label));
                }
                break;
            }
        }
    });

    return mappedLOV;
};

/**
 * Standard mapper for simple string arrays to dropdown options
 */
const mapStandardOptions = (options: any): DropdownOption[] => {
    if (!Array.isArray(options)) return [];
    return options.map(option => {
        const parts = option.split(' - ');
        return {
            value: parts.length >= 2 ? parts[0].trim() : option.trim(),
            label: option.trim()
        };
    });
};

/**
 * Extracts numeric region code from string (e.g., "17" from "17 - Nagaland")
 */
export const extractRegionCode = (regionStr: string): string => {
    if (!regionStr) return '';
    const trimmed = regionStr.trim();
    if (trimmed.includes(' - ')) {
        const code = trimmed.split(' - ')[0].trim();
        if (/^\d+$/.test(code)) return code;
    }
    return trimmed;
};

/**
 * Returns filtered regions for a specific country
 */
export const getRegionsForCountry = (
    countryKey: string, 
    countryRegionMapping: CountryRegionMapping[]
): DropdownOption[] => {
    if (!countryKey || !countryRegionMapping) return [];

    return countryRegionMapping
        .filter(m => m.country_key === countryKey)
        .map(m => ({
            value: extractRegionCode(m.region),
            label: m.region
        }));
};

/**
 * Lookups the planning group associated with a vendor account group
 */
export const getPlanningGroupFromVendorAccountGroup = (
    accountGroup: string, 
    mappings: VendorPlanningGroupMapping[]
): string => {
    if (!accountGroup || !mappings) return '';
    const target = accountGroup.split(' - ')[0].trim();
    const match = mappings.find(m => m.vendor_account_group === target);
    return match?.planning_group || '';
};

/**
 * Lookups the receipt type for a withholding tax type
 */
export const getReceiptTypeFromWithholdingTax = (
    taxType: string, 
    receiptMappings: DropdownOption[]
): string => {
    if (!taxType || !receiptMappings) return '';
    const match = receiptMappings.find(m => m.value === taxType);
    return match?.label || '';
};

/**
 * Helper function to check if bank details are mandatory based on vendor account group
 * Uses the vendorAccPlanningGroup mapping data from LOVs
 */
export const isBankDetailsMandatory = (
    vendorAccountGroup: string,
    vendorAccPlanningGroup: VendorPlanningGroupMapping[]
): boolean => {
    if (!vendorAccountGroup || !vendorAccPlanningGroup || vendorAccPlanningGroup.length === 0) return false;

    // Try exact match first
    const exactMatch = vendorAccPlanningGroup.find(
        (item) => item.vendor_account_group === vendorAccountGroup
    );

    if (exactMatch) {
        return exactMatch.bank_details_mandatory === "Yes";
    }

    // Try extracting code (V001 from V001 - Name)
    if (vendorAccountGroup.includes(" - ")) {
        const code = vendorAccountGroup.split(" - ")[0];
        const codeMatch = vendorAccPlanningGroup.find(
            (item) => item.vendor_account_group === code
        );
        if (codeMatch) return codeMatch.bank_details_mandatory === "Yes";
    }

    return false;
};

/**
 * Reconciliation Account Mappings by Vendor Group Code
 */
export const RECONCILIATION_ACCOUNT_BY_VENDOR_GROUP: Record<string, { value: string; displayLabel: string }> = {
    V001: { value: "1000090000", displayLabel: "1000090000 - DOMESTIC VENDOR- MATERIAL" },
    V002: { value: "1000090010", displayLabel: "1000090010 - FOREIGN VENDOR-MATERIAL" },
    V003: { value: "1000090020", displayLabel: "1000090020 - CONTRACTOR / SUBCONTRACTOR VENDOR" },
    V005: { value: "1000090040", displayLabel: "1000090040 - VENDOR FOREIGN - SERVICES" },
    V006: { value: "1000090050", displayLabel: "1000090050 - VENDOR DOMESTIC - ASSETS" },
    V007: { value: "1000090060", displayLabel: "1000090060 - VENDOR FOREIGN - ASSETS" },
    V008: { value: "1000090070", displayLabel: "1000090070 - VENDOR RELATED PARTY" },
    V009: { value: "1000090080", displayLabel: "1000090080 - VENDOR LABOUR+MATERIAL" },
    V010: { value: "1000090110", displayLabel: "1000090110 - VENDOR - EMPLOYEE" },
    V012: { value: "1000032299", displayLabel: "1000032299 - MOTOR CAR LOANS" },
    V013: { value: "1000032599", displayLabel: "1000032599 - EQUIPMENT FINANCE LOANS" },
    V014: { value: "1000031999", displayLabel: "1000031999 - TERM LOANS" },
};

/**
 * Returns the mapped reconciliation account for a vendor group
 */
export const getReconciliationMapping = (vendorAccountGroup: string) => {
    if (!vendorAccountGroup) return null;
    const code = vendorAccountGroup.split(" - ")[0];
    return RECONCILIATION_ACCOUNT_BY_VENDOR_GROUP[code] || null;
};

/**
 * Checks if a reconciliation account mapping exists for a given vendor group
 */
export const hasMappedReconciliationAccount = (vendorAccountGroup: string) => {
    return !!getReconciliationMapping(vendorAccountGroup);
};

/**
 * Calculation helper for System Fields
 */
export const calculateIndicatorSubjectToWithholdTax = (withholdingTaxType: string): string => {
    return withholdingTaxType ? "Yes" : "No";
};

export const calculateGroupForCalculationSchema = (
    typeOfVendor: string,
    vendorGroup: string
): string => {
    if (typeOfVendor !== "XK01") return "";
    const code = vendorGroup ? vendorGroup.split(" - ")[0] : "";
    return ["V002", "V005", "V007"].includes(code) ? "04" : "03";
};

export const calculateVendorClassificationForGST = (gstin: string): string => {
    if (!gstin || gstin.toLowerCase().includes("not registered") || gstin.toLowerCase().includes("na")) {
        return "0";
    }
    return "";
};

export const calculateGRBasedInvoiceVerification = (typeOfVendor: string): string => {
    return typeOfVendor === "XK01" ? "Yes" : "No";
};

export const calculateServiceBasedInvoiceVerification = (typeOfVendor: string): string => {
    return typeOfVendor === "XK01" ? "Yes" : "No";
};

export const calculateConfirmationControlKey = (
    typeOfVendor: string,
    orderAcknowledgment: string
): string => {
    if (typeOfVendor !== "XK01") return "";
    return orderAcknowledgment === "Yes" ? "0001" : "";
};

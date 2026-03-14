// LOV (List of Values) utility functions for vendor form

import type { LOVData, APILOVResponse, APILOVItem } from './types';

// Type definitions for LOV data structures
interface WithholdingTaxItem {
    withholding_tax_type: string;
    receipt_type: string;
}

interface VendorPlanningGroupItem {
    vendor_account_group: string;
    planning_group: string;
    bank_details_mandatory: string;
}

interface CountryRegionMappingItem {
    country_key: string;
    region: string | string[]; // Can be either a single string or array of strings
}

// Helper function to map API LOV data to our dropdown format
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
        receiptType: [],
        receiptType1: [],
        receiptType2: [],
        vendorAccPlanningGroup: [],
        countryRegionMapping: [],
        countryOptions: [],
        purchaseOrderCurrency: []
    };

    if (apiResponse && apiResponse.response_body && Array.isArray(apiResponse.response_body)) {
        // console.log(`📋 Processing ${apiResponse.response_body.length} LOV items from API response`);
        
        apiResponse.response_body.forEach((item: APILOVItem) => {
            const { lov_type, lov_json } = item;
            // console.log(`🔍 Processing lov_type: ${lov_type}`, {
            //     form_name: item.form_name,
            //     lov_status: item.lov_status,
            //     lov_json_keys: Object.keys(lov_json),
            //     lov_json: lov_json
            // });

            // Map each lov_type to our corresponding field
            let fieldKey: keyof LOVData | null = null;
            let jsonKey: string | null = null;

            switch (lov_type) {
                case 'company_code':
                    fieldKey = 'companyCode';
                    jsonKey = 'company_code';
                    break;
                case 'payment_terms':
                    fieldKey = 'termsOfPaymentKey';
                    jsonKey = 'payment_terms';
                    break;
                case 'title':
                    fieldKey = 'titleText';
                    jsonKey = 'title';
                    break;
                case 'recon_account':
                    fieldKey = 'reconciliationAccountInGeneralLedger';
                    jsonKey = 'recon_account';
                    break;
                case 'withholding_tax_receipt_type': {
                    // Handle withholding tax type with receipt type mapping
                    const mappingKey = 'withholding_tax_receipt_type';
                    if (lov_json[mappingKey] && Array.isArray(lov_json[mappingKey])) {
                        // Extract withholding tax type options for dropdowns
                        
                        const withholdingTaxOptions = (lov_json[mappingKey] as unknown as WithholdingTaxItem[]).map((item: WithholdingTaxItem) => ({
                            value: item.withholding_tax_type,
                            label: item.withholding_tax_type
                        }));
                        
                        // Map to both withholding tax type fields
                        mappedLOV.indicatorForWithHoldingTaxType1 = withholdingTaxOptions;
                        mappedLOV.indicatorForWithHoldingTaxType2 = withholdingTaxOptions;
                        
                        // Store the mapping data for receipt type lookup
                        mappedLOV.receiptType1 = (lov_json[mappingKey] as unknown as WithholdingTaxItem[]).map((item: WithholdingTaxItem) => ({
                            value: item.withholding_tax_type,
                            label: item.receipt_type
                        }));

                        mappedLOV.receiptType2 = (lov_json[mappingKey] as unknown as WithholdingTaxItem[]).map((item: WithholdingTaxItem) => ({
                            value: item.withholding_tax_type,
                            label: item.receipt_type
                        }));
                        
                        // console.log(`✅ Mapped ${lov_type} to withholding tax type fields:`, withholdingTaxOptions);
                        // console.log(`✅ Mapped ${lov_type} to receipt type mapping:`, mappedLOV.receiptType1);
                    }
                    break;
                } 
                case 'purchassing_organization':
                    fieldKey = 'purchasingOrganization';
                    jsonKey = 'purchassing_organization';
                    break;
                case 'planning_group':
                    fieldKey = 'planningGroup';
                    jsonKey = 'planning_group';
                    break;
                case 'receipt_type':
                    fieldKey = 'receiptType';
                    jsonKey = 'receipt_type';
                    break;
                case 'msmestatus_industrykey':
                    fieldKey = 'reMSMEStatus';
                    jsonKey = 'msmestatus_industrykey';
                    break;
                case 'vendor_acc_planning_group': {
                    // Handle vendor account group to planning group mapping
                    const mappingKey = 'vendor_acc_planning_group';
                    // console.log(`🔍 Processing vendor_acc_planning_group, raw data:`, lov_json[mappingKey]);
                    if (lov_json[mappingKey] && Array.isArray(lov_json[mappingKey])) {
                        // Store the mapping data with bank details mandatory field
                        mappedLOV.vendorAccPlanningGroup = (lov_json[mappingKey] as unknown as VendorPlanningGroupItem[]).map((item: VendorPlanningGroupItem) => ({
                            vendor_account_group: item.vendor_account_group,
                            planning_group: item.planning_group,
                            bank_details_mandatory: item.bank_details_mandatory
                        }));
                        
                        // Also extract vendor account group options for the dropdown
                        mappedLOV.vendorAccountGroup = (lov_json[mappingKey] as unknown as VendorPlanningGroupItem[]).map((item: VendorPlanningGroupItem) => ({
                            value: item.vendor_account_group,
                            label: item.vendor_account_group
                        }));
                        
                        // console.log(`✅ Mapped ${lov_type} to vendorAccPlanningGroup:`, mappedLOV.vendorAccPlanningGroup);
                        // console.log(`✅ Mapped ${lov_type} to vendorAccountGroup:`, mappedLOV.vendorAccountGroup);
                    } else {
                        console.log(`❌ No vendor_acc_planning_group data found or not an array:`, lov_json[mappingKey]);
                    }
                    break;
                }
                case 'country_region_mapping': {
                    // Handle country region mapping
                    const mappingKey = 'country_region_mapping';
                    // console.log(`🔍 Processing country_region_mapping, raw data:`, lov_json[mappingKey]);
                    if (lov_json[mappingKey] && Array.isArray(lov_json[mappingKey])) {
                        // Store the mapping data - handle both single string and array patterns
                        const processedMappings: Array<{ country_key: string; region: string }> = [];
                        
                        (lov_json[mappingKey] as unknown as CountryRegionMappingItem[]).forEach((item: CountryRegionMappingItem) => {
                            if (!item.country_key || !item.region) return;
                            
                            const countryKeyRaw = item.country_key.trim();
                            if (!countryKeyRaw) return;
                            
                            // Extract country code (e.g., "AL" from "AL - Albania")
                            const countryKey = countryKeyRaw.includes(' - ') 
                                ? countryKeyRaw.split(' - ')[0].trim()
                                : countryKeyRaw;
                            
                            // Store the full region string (e.g., "17 - Nagaland") to preserve for display
                            // We'll extract the code when creating dropdown options
                            // Handle both single string and array patterns
                            if (Array.isArray(item.region)) {
                                // Nested pattern: region is an array

                                item.region.forEach(regionItem => {
                                    if (regionItem && regionItem.trim()) {
                                        processedMappings.push({
                                            country_key: countryKey,
                                            region: regionItem.trim() // Store full string (e.g., "17 - Nagaland")
                                        });
                                    }
                                });
                            } else {
                                // Normal pattern: region is a single string
                                const regionRaw = item.region.trim();
                                if (regionRaw) {
                                    processedMappings.push({
                                        country_key: countryKey,
                                        region: regionRaw // Store full string (e.g., "17 - Nagaland")
                                    });
                                }
                            }
                        });
                        
                        mappedLOV.countryRegionMapping = processedMappings;
                        
                        // Extract unique country options for the dropdown
                        const uniqueCountries = new Map<string, string>();
                        (lov_json[mappingKey] as unknown as CountryRegionMappingItem[]).forEach((item: CountryRegionMappingItem) => {
                            if (item.country_key && item.country_key.trim()) {
                                const countryKeyRaw = item.country_key.trim();
                                // Extract country code (e.g., "AL" from "AL - Albania")
                                const countryCode = countryKeyRaw.includes(' - ') 
                                    ? countryKeyRaw.split(' - ')[0].trim()
                                    : countryKeyRaw;
                                // Store code as key, full string as value (for label)
                                uniqueCountries.set(countryCode, countryKeyRaw);
                            }
                        });
                        
                        mappedLOV.countryOptions = Array.from(uniqueCountries.entries())
                            .filter(([key, value]) => key && value && key.trim() && value.trim())
                            .map(([key, value]) => ({
                                value: key,  // Only the code (e.g., "AL")
                                label: value // Full label (e.g., "AL - Albania")
                            }));
                        
                        // console.log(`✅ Mapped ${lov_type} to countryRegionMapping:`, mappedLOV.countryRegionMapping);
                        // console.log(`✅ Mapped ${lov_type} to countryOptions:`, mappedLOV.countryOptions);
                        // console.log(`📊 Country-Region Mapping Summary:`, {
                        //     totalMappings: mappedLOV.countryRegionMapping.length,
                        //     uniqueCountries: mappedLOV.countryOptions.length,
                        //     sampleMapping: mappedLOV.countryRegionMapping[0],
                        //     sampleCountry: mappedLOV.countryOptions[0],
                        //     patternAnalysis: {
                        //         nestedPatterns: (lov_json[mappingKey] as unknown as CountryRegionMappingItem[]).filter(item => Array.isArray(item.region)).length,
                        //         normalPatterns: (lov_json[mappingKey] as unknown as CountryRegionMappingItem[]).filter(item => !Array.isArray(item.region)).length
                        //     }
                        // });
                    } else {
                        console.log(`❌ No country_region_mapping data found or not an array:`, lov_json[mappingKey]);
                    }
                    break;
                }
                case 'purchase_order_currency': {
                    // Handle purchase order currency
                    const currencyKey = 'purchase_order_currency';
                    // console.log(`🔍 Processing purchase_order_currency, raw data:`, lov_json[currencyKey]);
                    
                    if (lov_json[currencyKey]) {
                        // Check if it's an array (old format)
                        if (Array.isArray(lov_json[currencyKey])) {
                            mappedLOV.purchaseOrderCurrency = (lov_json[currencyKey] as unknown as string[])
                                .filter(currency => currency && currency.trim())
                                .map(currency => ({
                                    value: currency.trim(),
                                    label: currency.trim()
                                }));
                        } 
                        // Check if it's an object (new format with currency codes as keys)
                        else if (typeof lov_json[currencyKey] === 'object') {
                            const currencyObject = lov_json[currencyKey] as Record<string, string>;
                            mappedLOV.purchaseOrderCurrency = Object.entries(currencyObject)
                                .filter(([code, name]) => code && code.trim() && name && name.trim())
                                .map(([code, name]) => ({
                                    value: code.trim(),
                                    label: `${code.trim()} - ${name.trim()}`
                                }))
                                .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
                        }
                        
                        // console.log(`✅ Mapped ${lov_type} to purchaseOrderCurrency:`, mappedLOV.purchaseOrderCurrency);
                    } else {
                        console.log(`❌ No purchase_order_currency data found:`, lov_json[currencyKey]);
                    }
                    break;
                }
                default: {
                    console.warn(`⚠️ Unknown lov_type: ${lov_type}. Available keys in lov_json:`, Object.keys(lov_json));
                    // Log the structure for debugging
                    // console.log(`🔍 Unknown lov_type structure:`, {
                    //     lov_type,
                    //     lov_json,
                    //     available_keys: Object.keys(lov_json)
                    // });
                    break;
                }
            }

            if (fieldKey && jsonKey && lov_json[jsonKey]) {
                // Check if the value is an array before calling map
                const lovValue = lov_json[jsonKey];
                if (Array.isArray(lovValue)) {
                    // Convert string array to label-value pairs
                    mappedLOV[fieldKey] = lovValue.map((option: string) => {
                        // Handle options like "1 - SAP A.G." by splitting on " - "
                        const parts = option.split(' - ');
                        const value = parts.length >= 2 ? parts[0].trim() : option;
                        return {
                            value: value,
                            label: option // Show full string as label
                        };
                    });
                    // console.log(`✅ Mapped ${lov_type} to ${fieldKey}:`, mappedLOV[fieldKey]);
                } else {
                    console.warn(`⚠️ ${lov_type} lov_json[${jsonKey}] is not an array:`, lovValue);
                }
            }
        });
    }
    // console.log('mappedLOV', mappedLOV);
    return mappedLOV;
};

// Helper function to create optimized vendor account group to planning group mapping
export const createVendorPlanningGroupMap = (vendorAccPlanningGroup: Array<{ vendor_account_group: string; planning_group: string; bank_details_mandatory: string }>): Record<string, string> => {
    const map: Record<string, string> = {};
    vendorAccPlanningGroup.forEach(item => {
        map[item.vendor_account_group] = item.planning_group;
    });
    return map;
};

// Helper function to get planning group from vendor account group
export const getPlanningGroupFromVendorAccountGroup = (
    vendorAccountGroup: string, 
    vendorAccPlanningGroup: Array<{ vendor_account_group: string; planning_group: string; bank_details_mandatory: string }>
): string => {
    console.log('🔍 getPlanningGroupFromVendorAccountGroup called with:');
    console.log('  - vendorAccountGroup:', vendorAccountGroup);
    console.log('  - vendorAccPlanningGroup:', vendorAccPlanningGroup);
    
    const mapping = createVendorPlanningGroupMap(vendorAccPlanningGroup);
    console.log('  - Created mapping:', mapping);
    
    // Try exact match first
    let result = mapping[vendorAccountGroup] || '';
    
    // If no exact match, try to extract the code from the full name (e.g., "V005 - RUSTM-Foreign Vendor-Service" -> "V005")
    if (!result && vendorAccountGroup.includes(' - ')) {
        const code = vendorAccountGroup.split(' - ')[0];
        result = mapping[code] || '';
        console.log('  - Tried with extracted code:', code, 'Result:', result);
    }
    
    console.log('  - Final result:', result);
    
    return result;
};

// Helper function to create optimized withholding tax to receipt type mapping
export const createWithholdingTaxReceiptTypeMap = (receiptTypeData: Array<{ value: string; label: string }>): Record<string, string> => {
    const map: Record<string, string> = {};
    receiptTypeData.forEach(item => {
        map[item.value] = item.label;
    });
    return map;
};

// Helper function to get receipt type from withholding tax type
export const getReceiptTypeFromWithholdingTax = (
    withholdingTaxType: string, 
    receiptTypeData: Array<{ value: string; label: string }>
): string => {
    const mapping = createWithholdingTaxReceiptTypeMap(receiptTypeData);
    return mapping[withholdingTaxType] || '';
};

/**
 * Helper function to extract region code from region string
 * Extracts numeric code from format "NUMBER - NAME" (e.g., "17" from "17 - Nagaland")
 * If format doesn't match, returns the original string
 * 
 * @param regionStr - Region string in format "CODE - Name" or just the code
 * @returns The extracted region code (e.g., "17") or original string if format doesn't match
 * 
 * @example
 * extractRegionCode("17 - Nagaland") // Returns "17"
 * extractRegionCode("17") // Returns "17"
 * extractRegionCode("Nagaland") // Returns "Nagaland"
 */
export const extractRegionCode = (regionStr: string): string => {
    if (!regionStr || typeof regionStr !== 'string') {
        return regionStr || '';
    }
    
    const trimmed = regionStr.trim();
    // Check if format is "NUMBER - NAME" (e.g., "17 - Nagaland")
    if (trimmed.includes(' - ')) {
        const parts = trimmed.split(' - ');
        const code = parts[0].trim();
        // Check if first part is a number
        if (/^\d+$/.test(code)) {
            return code;
        }
    }
    // If not in expected format, return as-is
    return trimmed;
};

// Helper function to create optimized country to region mapping
export const createCountryRegionMap = (countryRegionMapping: Array<{ country_key: string; region: string }>): Record<string, Array<{ value: string; label: string }>> => {
    const map: Record<string, Array<{ value: string; label: string }>> = {};
    
    countryRegionMapping.forEach(item => {
        if (!map[item.country_key]) {
            map[item.country_key] = [];
        }
        // Extract code from region string (e.g., "17" from "17 - Nagaland")
        const regionCode = extractRegionCode(item.region);
        map[item.country_key].push({
            value: regionCode,  // Only the code (e.g., "17")
            label: item.region   // Full label (e.g., "17 - Nagaland")
        });
    });
    return map;
};

// Helper function to get regions for a specific country
export const getRegionsForCountry = (
    countryKey: string, 
    countryRegionMapping: Array<{ country_key: string; region: string }>
): Array<{ value: string; label: string }> => {
    // console.log('🔍 getRegionsForCountry called with:');
    // console.log('  - countryKey:', countryKey);
    // console.log('  - countryRegionMapping:', countryRegionMapping);
    
    if (!countryKey || !countryRegionMapping || countryRegionMapping.length === 0) {
        console.log('  - No country key or mapping data, returning empty array');
        return [];
    }
    
    const mapping = createCountryRegionMap(countryRegionMapping);
    // console.log('  - Created mapping:', mapping);
    // console.log('  - Available country keys in mapping:', Object.keys(mapping));
    
    // Try exact match first
    let regions = mapping[countryKey] || [];
    // console.log('  - Exact match regions:', regions);
    
    // If no exact match, try to find by partial match (in case of formatting differences)
    if (regions.length === 0) {
        // console.log('  - No exact match found, trying partial match...');
        const matchingKey = Object.keys(mapping).find(key => {
            // Try different matching strategies
            return key === countryKey || 
                   key.includes(countryKey) || 
                   countryKey.includes(key) ||
                   key.split(' - ')[0] === countryKey.split(' - ')[0] ||
                   key.split(' - ')[1] === countryKey.split(' - ')[1];
        });
        
        if (matchingKey) {
            regions = mapping[matchingKey] || [];
            // console.log('  - Found partial match with key:', matchingKey, 'regions:', regions);
        }
    }
    
    // console.log('  - Final regions returned:', regions);
    
    return regions;
};

/**
 * Helper function to check if bank details are mandatory based on vendor account group
 * Uses the vendorAccPlanningGroup mapping data from LOVs
 */
export const isBankDetailsMandatory = (
    vendorAccountGroup: string,
    vendorAccPlanningGroup: Array<{
        vendor_account_group: string;
        planning_group: string;
        bank_details_mandatory: string;
    }>
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

export const getReconciliationMapping = (vendorAccountGroup: string) => {
    if (!vendorAccountGroup) return null;
    const code = vendorAccountGroup.split(" - ")[0];
    return RECONCILIATION_ACCOUNT_BY_VENDOR_GROUP[code] || null;
};

export const hasMappedReconciliationAccount = (vendorAccountGroup: string) => {
    return !!getReconciliationMapping(vendorAccountGroup);
};

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

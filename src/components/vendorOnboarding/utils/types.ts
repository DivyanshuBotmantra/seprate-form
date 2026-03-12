/**
 * Types for LOV (List of Values) data
 */

export interface DropdownOption {
    value: string;
    label: string;
}

export interface VendorPlanningGroupMapping {
    vendor_account_group: string;
    planning_group: string;
    bank_details_mandatory: string;
}

export interface CountryRegionMapping {
    country_key: string;
    region: string;
}

export interface LOVData {
    // Basic Details
    vendorAccountGroup: DropdownOption[];
    termsOfPaymentKey: DropdownOption[];
    companyCode: DropdownOption[];
    titleText: DropdownOption[];
    reMSMEStatus: DropdownOption[];

    // Internal Details
    reconciliationAccountInGeneralLedger: DropdownOption[];
    indicatorForWithHoldingTaxType1: DropdownOption[];
    indicatorForWithHoldingTaxType2: DropdownOption[];
    purchasingOrganization: DropdownOption[];
    planningGroup: DropdownOption[];
    
    // Mappings & Special Logic
    receiptType1: DropdownOption[]; // Withholding tax type -> Receipt type
    receiptType2: DropdownOption[];
    vendorAccPlanningGroup: VendorPlanningGroupMapping[];
    countryRegionMapping: CountryRegionMapping[];
    countryOptions: DropdownOption[];
    purchaseOrderCurrency: DropdownOption[];
}

export interface APILOVItem {
    form_name: string;
    lov_type: string;
    lov_json: {
        [key: string]: any;
    };
    lov_status: string;
}

export interface APILOVResponse {
    status_code: number | string;
    status_description: string;
    error_message: string;
    response_body: APILOVItem[];
}

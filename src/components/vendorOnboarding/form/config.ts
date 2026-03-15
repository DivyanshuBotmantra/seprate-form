/**
 * Vendor Form Configuration
 * Centralized constants, default values, and field dependency logic
 */

import type { VendorFormValues } from "./schema";

/**
 * Default form values matching the Zod schema structure
 */
export const VENDOR_FORM_DEFAULTS: Partial<VendorFormValues> = {
    type_of_vendor: "XK01",
    vendor_details: {
        vendor_account_group: "",
        company_code: "",
        title_text: "",
        name1: "",
        name2: "",
        terms_of_payment_key: "",
        employee_number: "",
        search_term1: "",
    },
    key_details: {
        gstin: "",
        pan_number: "",
        cin_number: "",
        pan_aadhar_linked_status: "",
        credit_information_number_msme: "",
        msme_status: "",
        gstin_requirement: "Registered",
    },
    address_details: {
        street: "",
        street2: "",
        street3: "",
        street4: "",
        street5: "",
        district: "",
        city_postal_code: "",
        city: "",
        country_key: "IN",
        region: "",
        first_mobile_number_dialing_code_plus_number: "",
        primary_email: "",
    },
    internal_details: {
        reconciliation_account_in_general_ledger: "",
        indicator_for_with_holding_tax_type1: "",
        receipt_type1: "",
        indicator_for_with_holding_tax_type2: "",
        receipt_type2: "",
        planning_group: "",
        purchasing_organization: "",
        purchase_order_currency: "INR",
        order_acknowledgment_requirement: "No",
    },
    system_fields: {
        name3: ".",
        name4: "",
        language: "EN",
        address_time_zone: "INDIA",
        individual_pmt_check: "Yes",
        key_for_sorting_according_to_assignment: "001",
        list_of_payment_methods_to_be_consider: "CEMNORT",
        with_holding_tax_country_key: "IN",
        check_flag_for_double_invoices_or_credit: "Yes",
        individual_payment_check: "Yes",
        sorting_key: "001",
        payment_methods: "CEMNORT",
        withholding_tax_country: "IN",
        status: "Draft",
    },
    attachments: {
        gstin_attachment: undefined,
        pan_attachment: undefined,
        cin_attachment: undefined,
        msme_attachment: undefined,
        pan_aadhar_linkage_attachment: undefined,
        bank_details_attachment: undefined,
        other_attachments: [],
    },
};

/**
 * Session storage keys unified for Step 1 and Step 2
 */
export const SESSION_KEYS = {
    STEP1_DATA: "VendorStep1Data",
    TRANSACTION_ID: "VendorTransactionId",
    FORM_ID: "VendorFormId",
    CURRENT_ORG: "VendorCurrentOrg",
} as const;

/**
 * Field Dependencies & Business Logic Configuration
 * Used for both real-time updates and schema validation
 */
export const FIELD_DEPENDENCIES = {
    // GSTIN -> PAN derivation (Chars 3-12)
    GSTIN_TO_PAN: {
        start: 2,
        end: 12,
    },
    // PAN 4th Character -> Entity Type Mapping
    PAN_ENTITY_TYPE: {
        'C': 'Company', // Mandatory CIN (21 chars)
        'F': 'Firm/LLP', // Mandatory CIN (LLP format)
        'P': 'Individual',
    },
    // Vendor Groups requiring Withholding Tax
    WITHHOLDING_TAX_GROUPS: ["V001", "V003", "V009"],
    // Domestic vs Foreign detection
    DOMESTIC_GROUPS: ["V001", "V003", "V010"],
} as const;

/**
 * Organization and Form Metadata
 */
export const FORMDATA_CONFIG = {
    ORG_NAME: "Rustomjee",
    FORM_NAME: "Vendor Onboarding",
    STATUS_DRAFT: "Draft",
    STATUS_SUBMITTED: "Submitted",
} as const;

/**
 * Helper to create the initial payload for Step 1
 */
export const createInitialDraftPayload = (data: {
    type_of_vendor: "XK01" | "FK01" | "Employee";
    name1: string;
    gstin?: string;
    pan_number: string;
    vendor_account_group: string;
    gstin_requirement: string;
    employee_number?: string;
}) => ({
    org_name: FORMDATA_CONFIG.ORG_NAME,
    form_name: FORMDATA_CONFIG.FORM_NAME,
    form_status: FORMDATA_CONFIG.STATUS_DRAFT,
    form_data: {
        ...VENDOR_FORM_DEFAULTS,
        type_of_vendor: data.type_of_vendor === 'Employee' ? 'FK01' : data.type_of_vendor,
        vendor_details: {
            ...VENDOR_FORM_DEFAULTS.vendor_details,
            name1: data.name1,
            vendor_account_group: data.vendor_account_group,
            employee_number: data.employee_number || "",
        },
        key_details: {
            ...VENDOR_FORM_DEFAULTS.key_details,
            gstin: data.gstin || "",
            pan_number: data.pan_number,
            gstin_requirement: data.gstin_requirement,
        },
    },
});

/**
 * Common Regex Patterns (The Bible)
 */
export const REGEX = {
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
    IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    MSME: /^[A-Za-z]{2}-\d{2}-\d{7}$/,
    CIN_COMPANY: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    CIN_LLP: /^[A-Z]{3}-[0-9]{1,5}$/,
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^\d{10}$/,
    POSTAL_CODE: /^\d{6}$/,
};

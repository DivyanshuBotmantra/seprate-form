/**
 * Vendor Form Configuration
 * Contains default values, constants, and field dependencies
 */

import type { VendorFormData } from "@/components/vendor";

/**
 * Default form values
 */
export const VENDOR_FORM_DEFAULTS: VendorFormData = {
  typeOfVendor: "",
  vendorAccountGroup: "",
  termsOfPaymentKey: "",
  companyCode: "",
  employeeNumber: "",
  titleText: "",
  searchTerm1: "",
  name1: "",
  name2: "",
  taxNumber3GSTIN: "",
  panNumber: "",
  cinNumber: "",
  creditInformationNumberMSME: "",
  panAadharLinkedStatus: "",
  reMSMEStatus: "",
  street1: "",
  street2: "",
  street3: "",
  street4: "",
  street5: "",
  district: "",
  cityPostalCode: "",
  city: "",
  countryKey: "",
  region: "",
  firstMobileNo: "",
  firstTelephone: "",
  telephoneDailing: "",
  msmeStatus: "",
  primaryEmail: "",
  secondaryEmail: "",
  // Bank Details
  bankKeyIFSCCode: "",
  bankAccountNumber: "",
  accountHolderName: "",
  bankCountryKey: "",
  partnerBankType: "",
  // Internal Details
  reconciliationAccountInGeneralLedger: "",
  planningGroup: "",
  indicatorForWithHoldingTaxType1: "",
  indicatorForWithHoldingTaxType2: "",
  purchasingOrganization: "",
  purchaseOrderCurrency: "",
  responsibleSalesPersonAtVendorOffice: "",
  orderAcknowledgmentRequirement: "",

  // System Fields
  name3: ".",
  name4: "",
  language: "EN",
  addressTimeZone: "INDIA",
  lastReviewExternal: "",
  vendorClassificationForGST: "",
  individualPMTCheck: "Yes",
  keyForSortingAccordingToAssignment: "001",
  listOfPaymentMethodsToBeConsider: "CEMNORT",
  withHoldingTaxCode1: "",
  withHoldingTaxCode2: "",
  indicatorSubjectToWithholdTax1: "",
  indicatorSubjectToWithholdTax2: "",
  typeOfRecipient1: "",
  typeOfRecipient2: "",
  indicatorGRBasedInvoiceVerification: "",
  indicatorServiceBasedInvoiceVerif: "",
  checkFlagForDoubleInvoicesOrCredit: "Yes",
  withHoldingTaxCountryKey: "IN",
  groupForCalculationSchemaVendor: "",
  confirmationControlKey: "",

  // File attachments
  taxNumber3GSTINFile: null,
  panNumberFile: null,
  creditInformationNumberMSMEFile: null,
  cinNumberFile: null,
  panAadharLinkedStatusFile: null,
  bankKeyIFSCCodeFile: null,
};

/**
 * Form sections for validation
 */
export const FORM_SECTIONS = [
  "type",
  "vendor",
  "key",
  "address",
  "bank",
  "internal",
  "system",
] as const;

/**
 * Organization-specific configuration only for Rustom Jee
 */
export const ORG_CONFIG = {
  VENDOR_ONBOARDING_ORGS: ["Rustomjee"], // Organizations where vendor onboarding is available
  DEFAULT_ORG: "Rustomjee",
} as const;

/**
 * Vendor type options
 */
export const VENDOR_TYPES = {
  EMPLOYEE: "Employee(FK01)",
  NON_EMP_PURCHASE: "Non Emp - Purchase Org (XK01)",
  NON_EMP_NON_PURCHASE: "Non Emp - Non Purchase Org (FK01)",
} as const;

/**
 * Field dependencies configuration
 * Defines which fields trigger changes in other fields
 */
export const FIELD_DEPENDENCIES = {
  // When GSTIN changes, extract PAN
  taxNumber3GSTIN: {
    affects: ["panNumber"],
    minLength: 12,
  },
  // When PAN changes, update PAN Aadhar status and withholding tax
  panNumber: {
    affects: [
      "panAadharLinkedStatus",
      "indicatorForWithHoldingTaxType1",
      "indicatorForWithHoldingTaxType2",
    ],
    minLength: 4,
  },
  // When vendor account group changes, clear employee number if not V010
  vendorAccountGroup: {
    affects: [
      "employeeNumber",
      "indicatorForWithHoldingTaxType1",
      "indicatorForWithHoldingTaxType2",
    ],
  },
  // When type of vendor changes, clear internal details
  typeOfVendor: {
    affects: [
      "purchasingOrganization",
      "purchaseOrderCurrency",
      "responsibleSalesPersonAtVendorOffice",
      "orderAcknowledgmentRequirement",
    ],
  },
  // When country changes, clear region
  countryKey: {
    affects: ["region"],
  },
  // When IFSC changes, auto-populate bank fields
  bankKeyIFSCCode: {
    affects: ["bankCountryKey", "partnerBankType"],
    minLength: 4,
  },
  // When name1 or name2 changes, check CIN requirement
  name1: {
    affects: ["cinNumber"],
  },
  name2: {
    affects: ["cinNumber"],
  },
} as const;

/**
 * Vendor groups that require withholding tax configuration
 */
export const WITHHOLDING_TAX_VENDOR_GROUPS = ["V001", "V003", "V009"] as const;

/**
 * Session storage keys
 */
export const SESSION_KEYS = {
  STEP1_DATA: "Step1FormData",
  TRANSACTION_ID: "VendorTransactionId",
  FORM_ID: "VendorFormId",
} as const;

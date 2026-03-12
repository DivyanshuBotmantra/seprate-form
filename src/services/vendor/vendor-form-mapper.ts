/**
 * Vendor Form Data Mapper Service
 * Handles transformation between API format and form data format
 * Eliminates duplicate mapping code across the application
 */

import {
  calculateConfirmationControlKey,
  calculateGRBasedInvoiceVerification,
  calculateGroupForCalculationSchema,
  calculateIndicatorSubjectToWithholdTax,
  calculateServiceBasedInvoiceVerification,
  calculateVendorClassificationForGST,
  type VendorFormData,
} from "@/components/vendor";
import { extractRegionCode } from "@/components/vendor/lov-utils";
import { VENDOR_FORM_DEFAULTS } from "@/config/vendor-form-config";

/**
 * Helper function to map vendor type display names to short codes
 * This ensures consistency between Step 1 creation and update operations
 */
const getVendorTypeShortCode = (vendorType: string): string => {
  switch (vendorType) {
    case "Employee(FK01)":
      return "Employee";
    case "Non Emp - Purchase Org (XK01)":
      return "XK01";
    case "Non Emp - Non Purchase Org (FK01)":
      return "FK01";
    default:
      return vendorType; // Return as-is if no mapping found
  }
};

/**
 * Helper function to map vendor type short codes back to full display names
 * This ensures form validation works correctly when loading data from API
 */
const getVendorTypeFullValue = (shortCode: string): string => {
  switch (shortCode) {
    case "Employee":
      return "Employee(FK01)";
    case "XK01":
      return "Non Emp - Purchase Org (XK01)";
    case "FK01":
      return "Non Emp - Non Purchase Org (FK01)";
    default:
      return shortCode; // Return as-is if no mapping found
  }
};

/**
 * Maps API response data to form data structure
 * Used in: edit mode, view mode, organization switching
 * Uses VENDOR_FORM_DEFAULTS as single source of truth for fallback values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapAPIToFormData = (apiFormData: any): VendorFormData => {
  return {
    // Start with all default values
    ...VENDOR_FORM_DEFAULTS,

    // Override with API values (if they exist)
    // Convert API short code back to full form value for validation compatibility
    typeOfVendor:
      getVendorTypeFullValue(apiFormData.type_of_vendor) ||
      VENDOR_FORM_DEFAULTS.typeOfVendor,
    vendorAccountGroup:
      apiFormData.vendor_details?.vendor_account_group ||
      VENDOR_FORM_DEFAULTS.vendorAccountGroup,
    termsOfPaymentKey:
      apiFormData.vendor_details?.terms_of_payment_key ||
      VENDOR_FORM_DEFAULTS.termsOfPaymentKey,
    companyCode:
      apiFormData.vendor_details?.company_code ||
      VENDOR_FORM_DEFAULTS.companyCode,
    employeeNumber:
      apiFormData.vendor_details?.employee_number ||
      VENDOR_FORM_DEFAULTS.employeeNumber,
    titleText:
      apiFormData.vendor_details?.title_text || VENDOR_FORM_DEFAULTS.titleText,
    searchTerm1:
      apiFormData.vendor_details?.search_term1 ||
      VENDOR_FORM_DEFAULTS.searchTerm1,
    name1: apiFormData.vendor_details?.name1 || VENDOR_FORM_DEFAULTS.name1,
    name2: apiFormData.vendor_details?.name2 || VENDOR_FORM_DEFAULTS.name2,
    taxNumber3GSTIN:
      apiFormData.key_details?.gstin || VENDOR_FORM_DEFAULTS.taxNumber3GSTIN,
    panNumber:
      apiFormData.key_details?.pan_number || VENDOR_FORM_DEFAULTS.panNumber,
    cinNumber:
      apiFormData.key_details?.cin_number || VENDOR_FORM_DEFAULTS.cinNumber,
    creditInformationNumberMSME:
      apiFormData.key_details?.credit_information_number_msme ||
      VENDOR_FORM_DEFAULTS.creditInformationNumberMSME,
    panAadharLinkedStatus:
      apiFormData.key_details?.pan_aadhar_linked_status ||
      VENDOR_FORM_DEFAULTS.panAadharLinkedStatus,
    reMSMEStatus:
      apiFormData.key_details?.msme_status || VENDOR_FORM_DEFAULTS.reMSMEStatus,
    gstinRequirement:
      apiFormData.key_details?.gstin_requirement ||
      VENDOR_FORM_DEFAULTS.gstinRequirement,
    street1:
      apiFormData.address_details?.street || VENDOR_FORM_DEFAULTS.street1,
    street2:
      apiFormData.address_details?.street2 || VENDOR_FORM_DEFAULTS.street2,
    street3:
      apiFormData.address_details?.street3 || VENDOR_FORM_DEFAULTS.street3,
    street4:
      apiFormData.address_details?.street4 || VENDOR_FORM_DEFAULTS.street4,
    street5:
      apiFormData.address_details?.street5 || VENDOR_FORM_DEFAULTS.street5,
    district:
      apiFormData.address_details?.district || VENDOR_FORM_DEFAULTS.district,
    cityPostalCode:
      apiFormData.address_details?.city_postal_code ||
      VENDOR_FORM_DEFAULTS.cityPostalCode,
    city: apiFormData.address_details?.city || VENDOR_FORM_DEFAULTS.city,
    countryKey:
      apiFormData.address_details?.country_key ||
      VENDOR_FORM_DEFAULTS.countryKey,
    region: extractRegionCode(
      apiFormData.address_details?.region || VENDOR_FORM_DEFAULTS.region
    ),
    firstMobileNo:
      apiFormData.address_details
        ?.first_mobile_number_dialing_code_plus_number ||
      VENDOR_FORM_DEFAULTS.firstMobileNo,
    firstTelephone:
      apiFormData.address_details?.first_telephone_dialing_code_plus_number ||
      VENDOR_FORM_DEFAULTS.firstTelephone,
    telephoneDailing:
      apiFormData.address_details?.telephone_dialing_code_plus_number ||
      VENDOR_FORM_DEFAULTS.telephoneDailing,
    msmeStatus:
      apiFormData.key_details?.msme_status || VENDOR_FORM_DEFAULTS.msmeStatus,
    primaryEmail:
      apiFormData.address_details?.primary_email ||
      VENDOR_FORM_DEFAULTS.primaryEmail,
    secondaryEmail:
      apiFormData.address_details?.secondary_email ||
      VENDOR_FORM_DEFAULTS.secondaryEmail,

    // Bank Details
    bankKeyIFSCCode:
      apiFormData.bank_details?.bank_key_ifsc_code ||
      VENDOR_FORM_DEFAULTS.bankKeyIFSCCode,
    bankAccountNumber:
      apiFormData.bank_details?.bank_account_number ||
      VENDOR_FORM_DEFAULTS.bankAccountNumber,
    accountHolderName:
      apiFormData.bank_details?.account_holder_name ||
      VENDOR_FORM_DEFAULTS.accountHolderName,
    bankCountryKey:
      apiFormData.bank_details?.bank_country_key ||
      VENDOR_FORM_DEFAULTS.bankCountryKey,
    partnerBankType:
      apiFormData.bank_details?.partner_bank_type ||
      VENDOR_FORM_DEFAULTS.partnerBankType,

    // Internal Details
    reconciliationAccountInGeneralLedger:
      apiFormData.internal_details?.reconciliation_account_in_general_ledger ||
      VENDOR_FORM_DEFAULTS.reconciliationAccountInGeneralLedger,
    planningGroup:
      apiFormData.internal_details?.planning_group ||
      VENDOR_FORM_DEFAULTS.planningGroup,
    indicatorForWithHoldingTaxType1:
      apiFormData.internal_details?.indicator_for_with_holding_tax_type1 ||
      VENDOR_FORM_DEFAULTS.indicatorForWithHoldingTaxType1,
    indicatorForWithHoldingTaxType2:
      apiFormData.internal_details?.indicator_for_with_holding_tax_type2 ||
      VENDOR_FORM_DEFAULTS.indicatorForWithHoldingTaxType2,
    purchasingOrganization:
      apiFormData.internal_details?.purchasing_organization ||
      VENDOR_FORM_DEFAULTS.purchasingOrganization,
    purchaseOrderCurrency:
      apiFormData.internal_details?.purchase_order_currency ||
      VENDOR_FORM_DEFAULTS.purchaseOrderCurrency,
    responsibleSalesPersonAtVendorOffice:
      apiFormData.internal_details?.responsible_sales_person_at_vendor_office ||
      VENDOR_FORM_DEFAULTS.responsibleSalesPersonAtVendorOffice,
    orderAcknowledgmentRequirement:
      apiFormData.internal_details?.order_acknowledgment_requirement ||
      VENDOR_FORM_DEFAULTS.orderAcknowledgmentRequirement,

    // System Fields - Now using consistent defaults from config!
    name3: apiFormData.system_fields?.name3 || VENDOR_FORM_DEFAULTS.name3, // ✅ Now uses "." default
    name4: apiFormData.system_fields?.name4 || VENDOR_FORM_DEFAULTS.name4,
    language:
      apiFormData.system_fields?.language || VENDOR_FORM_DEFAULTS.language,
    addressTimeZone:
      apiFormData.system_fields?.address_time_zone ||
      VENDOR_FORM_DEFAULTS.addressTimeZone,
    lastReviewExternal:
      apiFormData.system_fields?.last_review_external ||
      VENDOR_FORM_DEFAULTS.lastReviewExternal,
    vendorClassificationForGST:
      apiFormData.system_fields?.vendor_classification_for_gst ||
      VENDOR_FORM_DEFAULTS.vendorClassificationForGST,
    individualPMTCheck:
      apiFormData.system_fields?.individual_pmt_check ||
      VENDOR_FORM_DEFAULTS.individualPMTCheck, // ✅ Now uses "Yes" default
    keyForSortingAccordingToAssignment:
      apiFormData.system_fields
        ?.key_for_sorting_according_to_assignment_number ||
      VENDOR_FORM_DEFAULTS.keyForSortingAccordingToAssignment, // ✅ Now uses "001" default
    listOfPaymentMethodsToBeConsider:
      apiFormData.system_fields?.list_of_payment_methods_to_be_considered ||
      VENDOR_FORM_DEFAULTS.listOfPaymentMethodsToBeConsider, // ✅ Now uses "CEMNORT" default
    withHoldingTaxCode1:
      apiFormData.system_fields?.with_holding_tax_code1 ||
      VENDOR_FORM_DEFAULTS.withHoldingTaxCode1,
    withHoldingTaxCode2:
      apiFormData.system_fields?.with_holding_tax_code2 ||
      VENDOR_FORM_DEFAULTS.withHoldingTaxCode2,
    indicatorSubjectToWithholdTax1:
      apiFormData.system_fields?.indicator_subject_to_with_hold_tax1 ||
      VENDOR_FORM_DEFAULTS.indicatorSubjectToWithholdTax1,
    indicatorSubjectToWithholdTax2:
      apiFormData.system_fields?.indicator_subject_to_with_hold_tax2 ||
      VENDOR_FORM_DEFAULTS.indicatorSubjectToWithholdTax2,
    typeOfRecipient1:
      apiFormData.system_fields?.type_of_recipient1 ||
      VENDOR_FORM_DEFAULTS.typeOfRecipient1,
    typeOfRecipient2:
      apiFormData.system_fields?.type_of_recipient2 ||
      VENDOR_FORM_DEFAULTS.typeOfRecipient2,
    indicatorGRBasedInvoiceVerification:
      apiFormData.system_fields?.indicator_gr_based_invoice_verification ||
      VENDOR_FORM_DEFAULTS.indicatorGRBasedInvoiceVerification,
    indicatorServiceBasedInvoiceVerif:
      apiFormData.system_fields
        ?.indicator_for_service_based_invoice_verification ||
      VENDOR_FORM_DEFAULTS.indicatorServiceBasedInvoiceVerif,
    checkFlagForDoubleInvoicesOrCredit:
      apiFormData.system_fields
        ?.check_flag_for_double_invoices_or_credit_memos ||
      VENDOR_FORM_DEFAULTS.checkFlagForDoubleInvoicesOrCredit, // ✅ Now uses "Yes" default
    withHoldingTaxCountryKey:
      apiFormData.system_fields?.with_holding_tax_country_key ||
      VENDOR_FORM_DEFAULTS.withHoldingTaxCountryKey,
    groupForCalculationSchemaVendor:
      apiFormData.system_fields?.group_for_calculation_schema_vendor ||
      VENDOR_FORM_DEFAULTS.groupForCalculationSchemaVendor,
    confirmationControlKey:
      apiFormData.system_fields?.confirmation_control_key ||
      VENDOR_FORM_DEFAULTS.confirmationControlKey,

    // File attachments (transform API format to UI format)
    taxNumber3GSTINFile: apiFormData.attachments?.gstin_attachment?.file_name
      ? {
          file_name: apiFormData.attachments.gstin_attachment.file_name,
          file_type: apiFormData.attachments.gstin_attachment.file_type,
          file_url: apiFormData.attachments.gstin_attachment.file_url,
        }
      : null,
    panNumberFile: apiFormData.attachments?.pan_attachment?.file_name
      ? {
          file_name: apiFormData.attachments.pan_attachment.file_name,
          file_type: apiFormData.attachments.pan_attachment.file_type,
          file_url: apiFormData.attachments.pan_attachment.file_url,
        }
      : null,
    creditInformationNumberMSMEFile: apiFormData.attachments?.msme_attachment
      ?.file_name
      ? {
          file_name: apiFormData.attachments.msme_attachment.file_name,
          file_type: apiFormData.attachments.msme_attachment.file_type,
          file_url: apiFormData.attachments.msme_attachment.file_url,
        }
      : null,
    cinNumberFile: apiFormData.attachments?.cin_attachment?.file_name
      ? {
          file_name: apiFormData.attachments.cin_attachment.file_name,
          file_type: apiFormData.attachments.cin_attachment.file_type,
          file_url: apiFormData.attachments.cin_attachment.file_url,
        }
      : null,
    panAadharLinkedStatusFile: apiFormData.attachments
      ?.pan_aadhar_linkage_attachment?.file_name
      ? {
          file_name:
            apiFormData.attachments.pan_aadhar_linkage_attachment.file_name,
          file_type:
            apiFormData.attachments.pan_aadhar_linkage_attachment.file_type,
          file_url:
            apiFormData.attachments.pan_aadhar_linkage_attachment.file_url,
        }
      : null,
    bankKeyIFSCCodeFile: apiFormData.attachments?.bank_details_attachment
      ?.file_name
      ? {
          file_name: apiFormData.attachments.bank_details_attachment.file_name,
          file_type: apiFormData.attachments.bank_details_attachment.file_type,
          file_url: apiFormData.attachments.bank_details_attachment.file_url,
        }
      : null,
  };
};

/**
 * Maps form data to API payload format (simplified - data goes in exact format)
 */

export const mapFormDataToAPI = (
  formData: VendorFormData,
  existingAttachments?: Record<string, any>,
  deletedFilesList?: Array<{
    fieldKey: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  }>
) => {
  return {
    type_of_vendor: getVendorTypeShortCode(formData.typeOfVendor),
    vendor_details: {
      vendor_account_group: formData.vendorAccountGroup,
      company_code: formData.companyCode,
      title_text: formData.titleText,
      name1: formData.name1,
      terms_of_payment_key: formData.termsOfPaymentKey,
      employee_number: formData.employeeNumber,
      search_term1: formData.searchTerm1,
      name2: formData.name2,
    },
    key_details: {
      gstin: formData.taxNumber3GSTIN,
      pan_number: formData.panNumber,
      cin_number: formData.cinNumber,
      pan_aadhar_linked_status: formData.panAadharLinkedStatus,
      credit_information_number_msme: formData.creditInformationNumberMSME,
      msme_status: formData.reMSMEStatus,
      gstin_requirement: formData.gstinRequirement,
    },
    bank_details: {
      bank_key_ifsc_code: formData.bankKeyIFSCCode,
      bank_account_number: formData.bankAccountNumber,
      bank_country_key: formData.bankCountryKey,
      account_holder_name: formData.accountHolderName,
      partner_bank_type: formData.partnerBankType,
    },
    address_details: {
      street: formData.street1,
      street2: formData.street2,
      street3: formData.street3,
      street4: formData.street4,
      street5: formData.street5,
      district: formData.district,
      city_postal_code: formData.cityPostalCode,
      city: formData.city,
      country_key: formData.countryKey,
      region: formData.region,
      first_mobile_number_dialing_code_plus_number: formData.firstMobileNo,
      first_telephone_dialing_code_plus_number: formData.firstTelephone,
      telephone_dialing_code_plus_number: formData.telephoneDailing,
      primary_email: formData.primaryEmail,
      secondary_email: formData.secondaryEmail,
    },
    internal_details: {
      reconciliation_account_in_general_ledger:
        formData.reconciliationAccountInGeneralLedger,
      indicator_for_with_holding_tax_type1:
        formData.indicatorForWithHoldingTaxType1,
      planning_group: formData.planningGroup,
      indicator_for_with_holding_tax_type2:
        formData.indicatorForWithHoldingTaxType2,
      purchasing_organization: formData.purchasingOrganization,
      purchase_order_currency: formData.purchaseOrderCurrency,
      responsible_sales_person_at_vendor_office:
        formData.responsibleSalesPersonAtVendorOffice,
      order_acknowledgment_requirement: formData.orderAcknowledgmentRequirement,
    },
    system_fields: {
      name3: formData.name3,
      name4: formData.panNumber,
      language: formData.language,
      address_time_zone: formData.addressTimeZone, // Always blank as per requirements
      last_review_external: formData.lastReviewExternal,
      vendor_classification_for_gst: calculateVendorClassificationForGST(
        formData.taxNumber3GSTIN
      ),
      individual_pmt_check: formData.individualPMTCheck,
      check_flag_for_double_invoices_or_credit_memos:
        formData.checkFlagForDoubleInvoicesOrCredit,
      with_holding_tax_country_key: formData.withHoldingTaxCountryKey,
      with_holding_tax_code1: formData.indicatorForWithHoldingTaxType1,
      indicator_subject_to_with_hold_tax1:
        calculateIndicatorSubjectToWithholdTax(
          formData.indicatorForWithHoldingTaxType1
        ),

      // formData.indicatorSubjectToWithholdTax1,
      type_of_recipient1: formData.typeOfRecipient1,
      with_holding_tax_code2: formData.indicatorForWithHoldingTaxType2,
      indicator_subject_to_with_hold_tax2:
        calculateIndicatorSubjectToWithholdTax(
          formData.indicatorForWithHoldingTaxType2
        ),
      // formData.indicatorSubjectToWithholdTax2,
      type_of_recipient2: formData.typeOfRecipient2,
      indicator_gr_based_invoice_verification:
        calculateGRBasedInvoiceVerification(formData.typeOfVendor),
      indicator_for_service_based_invoice_verification:
        calculateServiceBasedInvoiceVerification(formData.typeOfVendor),
      // formData.indicatorServiceBasedInvoiceVerif,
      key_for_sorting_according_to_assignment_number:
        formData.keyForSortingAccordingToAssignment,
      list_of_payment_methods_to_be_considered:
        formData.listOfPaymentMethodsToBeConsider,
      group_for_calculation_schema_vendor: calculateGroupForCalculationSchema(
        formData.typeOfVendor,
        formData.vendorAccountGroup
      ),
      // formData.groupForCalculationSchemaVendor,
      confirmation_control_key: calculateConfirmationControlKey(
        formData.typeOfVendor,
        formData.orderAcknowledgmentRequirement
      ),
    },
    attachments: {
      gstin_attachment: getAttachmentValue(
        formData.taxNumber3GSTINFile,
        existingAttachments?.gstin_attachment,
        deletedFilesList,
        "gstin_attachment"
      ),
      pan_attachment: getAttachmentValue(
        formData.panNumberFile,
        existingAttachments?.pan_attachment,
        deletedFilesList,
        "pan_attachment"
      ),
      cin_attachment: getAttachmentValue(
        formData.cinNumberFile,
        existingAttachments?.cin_attachment,
        deletedFilesList,
        "cin_attachment"
      ),
      msme_attachment: getAttachmentValue(
        formData.creditInformationNumberMSMEFile,
        existingAttachments?.msme_attachment,
        deletedFilesList,
        "msme_attachment"
      ),
      pan_aadhar_linkage_attachment: getAttachmentValue(
        formData.panAadharLinkedStatusFile,
        existingAttachments?.pan_aadhar_linkage_attachment,
        deletedFilesList,
        "pan_aadhar_linkage_attachment"
      ),
      bank_details_attachment: getAttachmentValue(
        formData.bankKeyIFSCCodeFile,
        existingAttachments?.bank_details_attachment,
        deletedFilesList,
        "bank_details_attachment"
      ),
      other_attachments: existingAttachments?.other_attachments || [],
    },
  };
};

/**
 * Load Step 1 data from session storage
 */
export const loadStep1Data = (): Partial<VendorFormData> | null => {
  try {
    const step1Data = JSON.parse(
      sessionStorage.getItem("Step1FormData") || "{}"
    );

    const transactionId = sessionStorage.getItem("VendorTransactionId");

    if (step1Data && transactionId) {
      return {
        typeOfVendor: step1Data.typeOfVendor || "",
        vendorAccountGroup: step1Data.vendorAccountGroup || "",
        name1: step1Data.name1 || "",
        taxNumber3GSTIN: step1Data.taxNumber3GSTIN || "",
        panNumber: step1Data.panNumber || "",
        employeeNumber: step1Data.employeeNumber || "",
        gstinRequirement: step1Data.gstinRequirement || "",
      };
    }
    return null;
  } catch (error) {
    console.error("Error loading Step 1 data:", error);
    return null;
  }
};

/**
 * Helper function to get attachment value considering deleted files
 * If a file is in the deleted files list, return empty values UNLESS a new file has been uploaded
 */
const getAttachmentValue = (
  formDataFile: any,
  existingAttachment: any,
  deletedFilesList?: Array<{
    fieldKey: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  }>,
  attachmentFieldKey?: string
) => {
  // Check if this attachment field is in the deleted files list
  if (deletedFilesList && attachmentFieldKey) {
    const isDeleted = deletedFilesList.some(
      (deletedFile) => deletedFile.fieldKey === attachmentFieldKey
    );
    if (isDeleted) {
      // 🔥 NEW LOGIC: Check if there's a new file uploaded for this field
      const hasValidNewFile =
        formDataFile !== null &&
        formDataFile.file_name &&
        formDataFile.file_name.trim() !== "" &&
        formDataFile.file_url &&
        formDataFile.file_url.trim() !== "";

      if (hasValidNewFile) {
        // New file uploaded - return new file details (don't nullify)
        console.log(
          `🔄 Field ${attachmentFieldKey} is marked for deletion BUT has new file uploaded, returning new file details instead of null`
        );
        console.log(`📁 New file details:`, {
          file_name: formDataFile.file_name,
          file_type: formDataFile.file_type,
          file_url: formDataFile.file_url,
        });
        return formDataFile;
      } else {
        // No new file - return empty values (old file deleted, no replacement)
        console.log(
          `🗑️ Field ${attachmentFieldKey} is marked for deletion with no replacement, returning empty values`
        );
        return {
          file_url: "",
          file_name: "",
          file_type: "",
        };
      }
    }
  }

  // Return form data file if it exists, otherwise existing attachment, otherwise empty values
  return formDataFile !== null
    ? formDataFile
    : existingAttachment || {
        file_url: "",
        file_name: "",
        file_type: "",
      };
};

/**
 * Helper function to map form field names to attachment field names
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAttachmentFieldNames = (
  uploadedFiles: Record<string, { name: string; type: string; url: string }>
): string[] => {
  const fieldMapping: Record<string, string> = {
    taxNumber3GSTINFile: "gstin_attachment",
    panNumberFile: "pan_attachment",
    creditInformationNumberMSMEFile: "msme_attachment",
    cinNumberFile: "cin_attachment",
    panAadharLinkedStatusFile: "pan_aadhar_linkage_attachment",
    bankKeyIFSCCodeFile: "bank_details_attachment",
  };

  return Object.keys(uploadedFiles)
    .filter((key) => uploadedFiles[key])
    .map((key) => fieldMapping[key] || key);
};

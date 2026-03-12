// Shared interfaces and types for vendor components

export interface UploadedFile {
  file_name: string;
  file_type: string;
  file_url: string;
}

export interface VendorFormData {
  // Type of Vendor
  typeOfVendor: string;

  // Vendor Details
  vendorAccountGroup: string;
  termsOfPaymentKey: string;
  companyCode: string;
  employeeNumber: string;
  titleText: string;
  searchTerm1: string;
  name1: string;
  name2: string;

  // Key Details
  taxNumber3GSTIN: string;
  panNumber: string;
  cinNumber: string;
  creditInformationNumberMSME: string;
  panAadharLinkedStatus: string;
  reMSMEStatus: string;
  gstinRequirement: string;

  // Address Details
  street1: string;
  street2: string;
  street3: string;
  street4: string;
  street5: string;
  district: string;
  cityPostalCode: string;
  city: string;
  countryKey: string;
  region: string;
  firstMobileNo: string;
  firstTelephone: string;
  telephoneDailing: string;
  msmeStatus: string;
  primaryEmail: string;
  secondaryEmail: string;

  // Bank Details
  bankKeyIFSCCode: string;
  bankAccountNumber: string;
  accountHolderName: string;
  bankCountryKey: string;
  partnerBankType: string;

  // Internal Details
  reconciliationAccountInGeneralLedger: string;
  planningGroup: string;
  indicatorForWithHoldingTaxType1: string;
  indicatorForWithHoldingTaxType2: string;
  purchasingOrganization: string;
  purchaseOrderCurrency: string;
  responsibleSalesPersonAtVendorOffice: string;
  orderAcknowledgmentRequirement: string;

  // System Fields
  name3: string;
  name4: string;
  language: string;
  addressTimeZone: string;
  lastReviewExternal: string;
  vendorClassificationForGST: string;
  individualPMTCheck: string;
  keyForSortingAccordingToAssignment: string;
  listOfPaymentMethodsToBeConsider: string;
  withHoldingTaxCode1: string;
  withHoldingTaxCode2: string;
  indicatorSubjectToWithholdTax1: string;
  indicatorSubjectToWithholdTax2: string;
  typeOfRecipient1: string;
  typeOfRecipient2: string;
  indicatorGRBasedInvoiceVerification: string;
  indicatorServiceBasedInvoiceVerif: string;
  checkFlagForDoubleInvoicesOrCredit: string;
  withHoldingTaxCountryKey: string;
  groupForCalculationSchemaVendor: string;
  confirmationControlKey: string;

  // File attachments
  taxNumber3GSTINFile: File | UploadedFile | null;
  panNumberFile: File | UploadedFile | null;
  creditInformationNumberMSMEFile: File | UploadedFile | null;
  cinNumberFile: File | UploadedFile | null;
  panAadharLinkedStatusFile: File | UploadedFile | null;
  bankKeyIFSCCodeFile: File | UploadedFile | null;
}

export interface LOVData {
  vendorAccountGroup: Array<{ value: string; label: string }>;
  termsOfPaymentKey: Array<{ value: string; label: string }>;
  companyCode: Array<{ value: string; label: string }>;
  titleText: Array<{ value: string; label: string }>;
  reMSMEStatus: Array<{ value: string; label: string }>;
  reconciliationAccountInGeneralLedger: Array<{ value: string; label: string }>;
  indicatorForWithHoldingTaxType1: Array<{ value: string; label: string }>;
  indicatorForWithHoldingTaxType2: Array<{ value: string; label: string }>;
  purchasingOrganization: Array<{ value: string; label: string }>;
  planningGroup: Array<{ value: string; label: string }>;
  receiptType: Array<{ value: string; label: string }>;
  receiptType1: Array<{ value: string; label: string }>;
  receiptType2: Array<{ value: string; label: string }>;
  vendorAccPlanningGroup: Array<{
    vendor_account_group: string;
    planning_group: string;
    bank_details_mandatory: string;
  }>;
  countryRegionMapping: Array<{ country_key: string; region: string }>;
  countryOptions: Array<{ value: string; label: string }>;
  purchaseOrderCurrency: Array<{ value: string; label: string }>;
}

export interface APILOVItem {
  form_name: string;
  lov_type: string;
  lov_json: {
    [key: string]: string[];
  };
  lov_status: string;
}

export interface APILOVResponse {
  status_code: number;
  status_description: string;
  error_message: string;
  response_body: APILOVItem[];
}

export type FormSection =
  | "type"
  | "vendor"
  | "key"
  | "address"
  | "bank"
  | "internal"
  | "system";

// Error type that allows string error messages for all fields
export type VendorFormErrors = {
  [K in keyof VendorFormData]?: string;
};

export interface BaseSectionProps {
  formData: VendorFormData;
  setFormData: React.Dispatch<React.SetStateAction<VendorFormData>>;
  errors: VendorFormErrors;
  lovData: LOVData | null;
  handleInputChange: (field: keyof VendorFormData, value: string) => void;
  handleSaveSection: (section: FormSection) => Promise<void>;
  isSaving: boolean;
  isReadOnly?: boolean;
  editMode?: boolean; // Add editMode prop for granular control
  hasStep1Data?: boolean; // Add hasStep1Data prop to identify Step 1 fields
  validateField?: (field: keyof VendorFormData, value: string) => void;
  updateErrors?: (errors: VendorFormErrors) => void; // Add updateErrors prop for clearing errors
  markFileAsUploaded?: (fieldName: string) => void; // Track file upload actions
  markFileAsDeleted?: (fieldName: string) => void; // Track file deletion actions
  formName?: string; // Add formName prop for dynamic form name
  // 🔥 NEW: Add refreshFileURLs and related props for URL refresh before delete
  refreshFileURLs?: (
    formData: VendorFormData,
    orgName: string,
    transactionId: string
  ) => Promise<VendorFormData>;
  currentFormData?: VendorFormData;
  orgName?: string;
  transactionId?: string;
  // 🔥 NEW: Add deleted files tracking props
  addDeletedFile?: (fileInfo: {
    fieldKey: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    formFieldName?: string;
  }) => void;
  useTrackingMode?: boolean; // If true, track deletions instead of immediate deletion
}

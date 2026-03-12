import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Check, ChevronLeft } from "lucide-react";
import { getFormLov } from "@/services/form-lov";
import { createFormData } from "@/services/form-data";
import { mapAPILOVToDropdown } from "./lov-utils";
import { getSessionData } from "@/lib/session-utils";
import { getAttachmentFieldNames } from "@/services/vendor-form-mapper";
import { convertUTCtoIST } from "@/lib/date-converter";
import { isCINMandatory } from "./validation";

interface Step1FormData {
  typeOfVendor: string;
  vendorAccountGroup: string;
  name1: string;
  gstinRequirement: string; // New field for GSTIN requirement dropdown
  taxNumber3GSTIN: string;
  panNumber: string;
  employeeNumber: string;
}

interface LOVData {
  vendorAccountGroup?: Array<{ value: string; label: string }>;
}

interface VendorFormProps {
  orgName?: string;
}

const VendorForm: React.FC<VendorFormProps> = ({ orgName: propOrgName }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get org_name and form_name from URL parameters, with fallbacks
  const orgName = searchParams.get("orgName") || propOrgName || "Rustomjee";
  const formName = searchParams.get("formName") || "Vendor Onboarding";
  const [formData, setFormData] = useState<Step1FormData>({
    typeOfVendor: "",
    vendorAccountGroup: "",
    name1: "",
    gstinRequirement: "",
    taxNumber3GSTIN: "",
    panNumber: "",
    employeeNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Step1FormData>>({});
  const [lovData, setLovData] = useState<LOVData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [vendorGroupOpen, setVendorGroupOpen] = useState(false);
  const [gstinRequirementOpen, setGstinRequirementOpen] = useState(false);
  const [autoSelectedType, setAutoSelectedType] = useState<string>("");
  const isEmployeeType = formData.typeOfVendor === "Employee(FK01)";
  // Use new PAN-based logic only (old name-based logic removed)
  const cinMandatoryForName = !isEmployeeType
    ? isCINMandatory(
      formData.panNumber || "",
      formData.name1 || "",
      ""
    )
    : false;


  // Field references for auto-focus
  const vendorAccountGroupRef = useRef<HTMLButtonElement>(null);
  const vendorNameRef = useRef<HTMLInputElement>(null);
  const gstinRequirementRef = useRef<HTMLButtonElement>(null);
  const gstinRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const employeeNumberRef = useRef<HTMLInputElement>(null);
  const istTimestamp = convertUTCtoIST(new Date());
  // Fetch LOV data
  useEffect(() => {
    const fetchLOVData = async () => {
      try {
        const { data, error } = await getFormLov({
          form_name: "Vendor Onboarding",
          org_name: "Rustomjee",
        });

        if (error) {
          console.error("Error fetching LOV data:", error);
          toast.error("Failed to load form options");
        } else if (data) {
          const mappedLOV = mapAPILOVToDropdown(data);
          setLovData(mappedLOV);
          // console.log("📋 LOV data loaded:", mappedLOV);
        }
      } catch (error) {
        console.error("Error fetching LOV data:", error);
        toast.error("Failed to load form options");
      }
    };

    fetchLOVData();
  }, [orgName, formName]);

  // Helper function to determine which vendor type to auto-select
  const getAutoSelectedVendorType = (): string => {
    // Business logic for auto-selection
    // You can modify this logic based on your requirements

    // Example logic - you can customize this based on your business rules:

    // 1. Check user role from session
    const userDetails = JSON.parse(
      sessionStorage.getItem("userDetail") || "{}"
    );
    const userRole = userDetails?.role || "";

    // 2. Check organization
    const selectedOrg = JSON.parse(
      sessionStorage.getItem("SelectedOrg") || "{}"
    );
    const orgName = selectedOrg?.org_name || "";

    // 3. Auto-selection logic based on role and organization
    if (userRole === "USER" && orgName === "Rustomjee") {
      // For regular users in Rustom Jee, default to Employee
      return "Employee(FK01)";
    } else if (userRole === "ADMIN" || userRole === "SUPER ADMIN") {
      // For admins, default to Non-Emp Purchase Org (XK01)
      return "Non Emp - Purchase Org (XK01)";
    } else {
      // Default fallback - auto-select XK01 as requested
      return "Non Emp - Purchase Org (XK01)";
    }
  };

  // Auto-select vendor type when component loads
  useEffect(() => {
    // Auto-select vendor type based on business logic
    if (!formData.typeOfVendor) {
      const selectedType = getAutoSelectedVendorType();
      // console.log("🔄 Auto-selecting vendor type:", selectedType);
      setAutoSelectedType(selectedType); // Store the auto-selected type
      setFormData((prev) => ({
        ...prev,
        typeOfVendor: selectedType,
      }));
    }
  }, [formData.typeOfVendor]);

  // Auto-select vendor account group and set defaults when LOV data is loaded
  useEffect(() => {
    if (
      lovData?.vendorAccountGroup &&
      formData.typeOfVendor &&
      !formData.vendorAccountGroup
    ) {
      if (formData.typeOfVendor === "Employee(FK01)") {
        // Try to find V010 option - check both value and label (searching for V010, not F010)
        const v010Option = lovData.vendorAccountGroup.find(
          (option) =>
            option.value.startsWith("V010") ||
            option.label.startsWith("V010") ||
            option.value.includes("V010") ||
            option.label.includes("V010")
        );

        if (v010Option) {
          console.log(
            // "🔄 Auto-selecting V010 after LOV data loaded:",
            v010Option
          );
          setFormData((prev) => ({
            ...prev,
            vendorAccountGroup: v010Option.value,
            gstinRequirement: "Not Registered", // Set GSTIN as not registered for FK01
            taxNumber3GSTIN: "", // Clear GSTIN
            panNumber: "", // Clear PAN
          }));

          // Auto-focus on vendor name since vendor group is auto-selected
          setTimeout(() => {
            vendorNameRef.current?.focus();
          }, 100);
        } else {
          console.log("❌ V010 option not found in LOV data during useEffect");
          console.log(
            "🔍 Available options:",
            lovData.vendorAccountGroup.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))
          );
        }
      } else if (formData.typeOfVendor === "Non Emp - Purchase Org (XK01)") {
        // Set default GSTIN requirement for XK01 - Default to "Registered"
        setFormData((prev) => ({
          ...prev,
          gstinRequirement: "Registered",
        }));

        // Auto-focus on vendor account group dropdown for XK01
        setTimeout(() => {
          vendorAccountGroupRef.current?.focus();
        }, 100);
      } else if (
        formData.typeOfVendor === "Non Emp - Non Purchase Org (FK01)"
      ) {
        // Set default GSTIN requirement for FK01 - Default to "Registered"
        setFormData((prev) => ({
          ...prev,
          gstinRequirement: "Registered",
        }));

        // Auto-focus on vendor account group dropdown for FK01
        setTimeout(() => {
          vendorAccountGroupRef.current?.focus();
        }, 100);
      }
    }
  }, [lovData, formData.typeOfVendor, formData.vendorAccountGroup]);

  // Validation functions
  const validateGSTIN = (gstin: string): string | null => {
    if (!gstin.trim()) return "GSTIN is required";

    // GSTIN format: 2 digits state code + 10 digits PAN + 2 digits entity code + 1 digit check digit
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

    if (gstin.length !== 15) {
      return "GSTIN must be exactly 15 characters";
    }

    if (!gstinRegex.test(gstin)) {
      return "Invalid GSTIN format. Please check the format and try again.";
    }

    return null;
  };

  // Helper function to check if GSTIN format is valid (without error message)
  const isGSTINFormatValid = (gstin: string): boolean => {
    if (!gstin.trim() || gstin.length !== 15) return false;

    // GSTIN format: 2 digits state code + 10 digits PAN + 2 digits entity code + 1 digit check digit
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validatePAN = (pan: string): string | null => {
    const value = pan.trim().toUpperCase();

    // Allowed special values
    if (value === "NA" || value === "NOT APPLICABLE") {
      return null;
    }

    if (!value) return "PAN is required";

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    if (value.length !== 10) {
      return "PAN must be exactly 10 characters";
    }

    if (!panRegex.test(value)) {
      return "Invalid PAN format. Please check the format and try again.";
    }

    return null;
  };



  const validateEmployeeNumber = (
    empNumber: string,
    vendorGroup: string
  ): string | null => {
    if (!vendorGroup.startsWith("V010")) {
      return null; // Employee number is optional for non-V010 groups
    }

    if (!empNumber.trim()) {
      return "Employee number is required for V010 vendor group";
    }

    // Employee number should be up to 4 digits
    const empRegex = /^[0-9]{1,4}$/;

    if (!empRegex.test(empNumber)) {
      return "Employee number must be up to 4 digits";
    }

    return null;
  };

  const handleInputChange = (field: keyof Step1FormData, value: string) => {
    let processedValue = value;

    // Apply input filtering based on field type
    if (field === "taxNumber3GSTIN") {
      // Only allow alphanumeric characters, max 15 characters
      processedValue = value
        .replace(/[^0-9A-Za-z]/g, "")
        .toUpperCase()
        .slice(0, 15);
    }
    else if (field === "panNumber") {
      const isForeign = isForeignVendorAccountGroup(formData.vendorAccountGroup);

      if (isForeign) {
        // Allow NA or full text like NOT APPLICABLE
        processedValue = value.toUpperCase().slice(0, 20);
      } else {
        // Domestic vendors → allow typing anything, sanitize only invalid characters
        processedValue = value
          .replace(/[^A-Za-z0-9]/g, "")  // keep alphanumeric
          .toUpperCase()
          .slice(0, 20); // allow up to 20 chars, validation will restrict later
      }
    }


    else if (field === "name1") {
      // Title case each word: first letter uppercase, remaining letters lowercase
      processedValue = value.replace(/\b([a-zA-Z])(\w*)/g, (_, first: string, rest: string) =>
        first.toUpperCase() + rest.toLowerCase()
      );
    } else if (field === "employeeNumber") {
      // Only allow digits, max 4 characters
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    // Only clear errors when user starts typing, don't validate yet
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Note: Auto-focus is now handled by Enter key press, not automatic field changes

    // Handle vendor type selection logic
    if (field === "typeOfVendor") {
      if (processedValue === "Employee(FK01)") {
        // Auto-select V010 for Employee type
        // Try to find V010 option - check both value and label (searching for V010, not F010)
        const v010Option = lovData?.vendorAccountGroup?.find(
          (option) =>
            option.value.startsWith("V010") ||
            option.label.startsWith("V010") ||
            option.value.includes("V010") ||
            option.label.includes("V010")
        );

        console.log("🔍 Found V010 option:", v010Option);

        if (v010Option) {
          setFormData((prev) => ({
            ...prev,
            vendorAccountGroup: v010Option.value,
            employeeNumber: "", // Clear employee number
            gstinRequirement: "Not Registered", // Set GSTIN as not registered for FK01
            taxNumber3GSTIN: "", // Clear GSTIN
            panNumber: "", // Clear PAN
          }));
          setErrors((prev) => ({
            ...prev,
            vendorAccountGroup: undefined,
            employeeNumber: undefined,
            gstinRequirement: undefined,
            taxNumber3GSTIN: undefined,
            panNumber: undefined,
          }));
          console.log("✅ Auto-selected V010:", v010Option.value);

          // Auto-focus on vendor name since vendor group is auto-selected
          setTimeout(() => {
            vendorNameRef.current?.focus();
          }, 100);
        } else {
          console.log("❌ V010 option not found in LOV data");
          console.log(
            "🔍 Available options:",
            lovData?.vendorAccountGroup?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))
          );
        }
      } else {
        // For non-Employee types, default GSTIN requirement to "Registered"
        setFormData((prev) => ({
          ...prev,
          vendorAccountGroup: "",
          employeeNumber: "",
          gstinRequirement: "Registered",
          taxNumber3GSTIN: "",
          panNumber: "",
        }));
        setErrors((prev) => ({
          ...prev,
          vendorAccountGroup: undefined,
          employeeNumber: undefined,
          gstinRequirement: undefined,
          taxNumber3GSTIN: undefined,
          panNumber: undefined,
        }));

        // Auto-focus on vendor account group for non-employee types
        setTimeout(() => {
          vendorAccountGroupRef.current?.focus();
        }, 100);
      }
    }

    // Auto-extract PAN from GSTIN if GSTIN is provided and format is valid
    if (field === "taxNumber3GSTIN" && processedValue) {
      // Only extract PAN if GSTIN format is valid
      if (isGSTINFormatValid(processedValue)) {
        // GSTIN format: 2 digits state code + 10 digits PAN + 2 digits entity code + 1 digit check digit
        // Extract PAN from GSTIN (positions 2-11, total 10 characters)
        const extractedPAN = processedValue.substring(2, 12); // Extract 10-character PAN from GSTIN
        setFormData((prev) => ({ ...prev, panNumber: extractedPAN }));
        console.log(`✅ Auto-extracted PAN from valid GSTIN: ${extractedPAN}`);
      } else {
        // Clear PAN if GSTIN format is invalid
        setFormData((prev) => ({ ...prev, panNumber: "" }));
        console.log(`❌ GSTIN format invalid, cleared PAN field`);
      }
    }

    // Clear employee number when vendor account group changes from V010
    if (field === "vendorAccountGroup" && !processedValue.startsWith("V010")) {
      setFormData((prev) => ({ ...prev, employeeNumber: "" }));
      setErrors((prev) => ({ ...prev, employeeNumber: undefined }));
    }

    // Handle GSTIN requirement changes
    if (field === "gstinRequirement") {
      if (processedValue === "Not Registered") {
        // Clear GSTIN and PAN when GSTIN is not registered
        setFormData((prev) => ({
          ...prev,
          taxNumber3GSTIN: "",
          panNumber: "",
        }));
        setErrors((prev) => ({
          ...prev,
          taxNumber3GSTIN: undefined,
          panNumber: undefined,
        }));
      } else if (processedValue === "Registered") {
        // Clear PAN when GSTIN becomes registered (will be auto-populated from GSTIN)
        setFormData((prev) => ({ ...prev, panNumber: "" }));
        setErrors((prev) => ({ ...prev, panNumber: undefined }));

        // Auto-focus on GSTIN field when "Registered" is selected
        setTimeout(() => {
          gstinRef.current?.focus();
        }, 100);
      }
    }
  };

  // Handle field blur (when user leaves the field) - validate here
  const handleFieldBlur = (field: keyof Step1FormData) => {
    const value = formData[field];
    let validationError: string | null = null;

    // Only validate if there's a value
    if (value && value.trim()) {
      if (field === "taxNumber3GSTIN") {
        validationError = validateGSTIN(value);
      } else if (field === "panNumber") {
        validationError = validatePAN(value);
      } else if (field === "employeeNumber") {
        validationError = validateEmployeeNumber(
          value,
          formData.vendorAccountGroup
        );
      }
    }

    // Update errors state
    if (validationError) {
      setErrors((prev) => ({ ...prev, [field]: validationError }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Step1FormData> = {};

    // Basic required field validation
    if (!formData.typeOfVendor.trim()) {
      newErrors.typeOfVendor = "Type of Vendor is required";
    }
    if (!formData.vendorAccountGroup.trim()) {
      newErrors.vendorAccountGroup = "Vendor Group is required";
    }
    if (!formData.name1.trim()) {
      newErrors.name1 =
        formData.typeOfVendor === "Employee(FK01)"
          ? "Employee Name is required"
          : "Vendor Name is required";
    }

    // GSTIN requirement validation (only for non-employee types)
    if (formData.typeOfVendor !== "Employee(FK01)") {
      if (!formData.gstinRequirement.trim()) {
        newErrors.gstinRequirement = "GSTIN requirement is required";
      }
    }

    // GSTIN validation with proper format checking
    // Only validate GSTIN if gstinRequirement is 'Registered' or if it's provided
    if (formData.gstinRequirement === "Registered") {
      if (!formData.taxNumber3GSTIN.trim()) {
        newErrors.taxNumber3GSTIN =
          "GSTIN is required when GSTIN requirement is set to Registered";
      } else {
        const gstinError = validateGSTIN(formData.taxNumber3GSTIN);
        if (gstinError) {
          newErrors.taxNumber3GSTIN = gstinError;
        }
      }
    } else if (formData.taxNumber3GSTIN.trim()) {
      // If GSTIN is provided even when not registered, validate its format
      const gstinError = validateGSTIN(formData.taxNumber3GSTIN);
      if (gstinError) {
        newErrors.taxNumber3GSTIN = gstinError;
      }
    }


    // pan section
    const isForeign = isForeignVendorAccountGroup(formData.vendorAccountGroup);
    const isEmployee = formData.typeOfVendor === "Employee(FK01)";
    const value = formData.panNumber.trim().toUpperCase();

    // EMPLOYEE → PAN optional; validate only if given
    if (isEmployee) {
      if (value && !validatePAN(value)) {
        newErrors.panNumber = validatePAN(value);
      }
    }

    // FOREIGN → only NOT APPLICABLE or valid PAN
    else if (isForeign) {
      if (value === "NOT APPLICABLE") {
        // OK
      } else if (!value) {
        newErrors.panNumber = "Enter PAN or 'NOT APPLICABLE'";
      } else {
        const panError = validatePAN(value);
        if (panError) newErrors.panNumber = panError;
      }
    }

    // INDIAN VENDOR → PAN mandatory, NA not allowed
    else {
      if (!value) {
        newErrors.panNumber = "PAN is required";
      } else if (value === "NA" || value === "NOT APPLICABLE") {
        newErrors.panNumber = "PAN cannot be NA for Indian vendors";
      } else {
        const panError = validatePAN(value);
        if (panError) newErrors.panNumber = panError;
      }
    }



    // Employee number validation (conditional based on vendor group)
    console.log("🔍 Validating employee number:", {
      employeeNumber: formData.employeeNumber,
      vendorAccountGroup: formData.vendorAccountGroup,
      typeOfVendor: formData.typeOfVendor,
    });
    const empError = validateEmployeeNumber(
      formData.employeeNumber,
      formData.vendorAccountGroup
    );
    console.log("🔍 Employee number validation result:", empError);
    if (empError) {
      newErrors.employeeNumber = empError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to map vendor type to short code
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

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsCreating(true);
      try {
        const sessionData = getSessionData();

        const step1FormData = {
          form_id: "", // Will be set from API response
          form_submitted_by: sessionData.userId,
          form_submitted_on: istTimestamp,
          type_of_vendor: getVendorTypeShortCode(formData.typeOfVendor),
          vendor_details: {
            vendor_account_group: formData.vendorAccountGroup,
            company_code: "",
            title_text: "",
            name1: formData.name1,
            terms_of_payment_key: "",
            employee_number: formData.employeeNumber,
            search_term1: "",
            name2: "",
          },
          key_details: {
            gstin: formData.taxNumber3GSTIN,
            pan_number: formData.panNumber,
            cin_number: "",
            pan_aadhar_linked_status: "",
            credit_information_number_msme: "",
            msme_status: "",
            gstin_requirement: formData.gstinRequirement,
          },
          bank_details: {
            bank_key_ifsc_code: "",
            bank_account_number: "",
            bank_country_key: "",
            account_holder_name: "",
            partner_bank_type: "",
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
            country_key: "",
            region: "",
            first_mobile_number_dialing_code_plus_number: "",
            first_telephone_dialing_code_plus_number: "",
            telephone_dialing_code_plus_number: "",
            primary_email: "",
            secondary_email: "",
          },
          internal_details: {
            reconciliation_account_in_general_ledger: "",
            indicator_for_with_holding_tax_type1: "",
            planning_group: "",
            indicator_for_with_holding_tax_type2: "",
            purchasing_organization: "",
            purchase_order_currency: "",
            responsible_sales_person_at_vendor_office: "",
            order_acknowledgment_requirement: "",
          },
          system_fields: {
            name3: ".",
            name4: "",
            language: "EN",
            address_time_zone: "",
            last_review_external: "",
            vendor_classification_for_gst: "",
            individual_pmt_check: "Yes",
            check_flag_for_double_invoices_or_credit_memos: "Yes",
            with_holding_tax_country_key: "IN",
            with_holding_tax_code1: "",
            indicator_subject_to_with_hold_tax1: "",
            type_of_recipient1: "",
            with_holding_tax_code2: "",
            indicator_subject_to_with_hold_tax2: "",
            type_of_recipient2: "",
            indicator_gr_based_invoice_verification: "",
            indicator_for_service_based_invoice_verification: "",
            key_for_sorting_according_to_assignment_number: "001",
            list_of_payment_methods_to_be_considered: "CEMNORT",
            group_for_calculation_schema_vendor: "",
            confirmation_control_key: "",
          },
          attachments: {
            gstin_attachment: {
              file_url: "",
              file_name: "",
              file_type: "",
            },
            pan_attachment: {
              file_url: "",
              file_name: "",
              file_type: "",
            },
            cin_attachment: {
              file_url: "",
              file_name: "",
              file_type: "",
            },
            msme_attachment: {
              file_url: "",
              file_name: "",
              file_type: "",
            },
            pan_aadhar_linkage_attachment: {
              file_url: "",
              file_name: "",
              file_type: "",
            },
            bank_details_attachment: {
              file_url: "",
              file_name: "",
              file_type: "",
            },
            other_attachments: [],
          },
        };

        // Call createFormData API
        const createPayload = {
          form_status: "Draft",
          created_by: sessionData.userId,
          form_data: step1FormData,
          org_name: orgName,
          form_name: formName,
          attachment_fields: getAttachmentFieldNames({}),
        };

        const { data, error } = await createFormData(createPayload);

        if (error) {
          console.error("❌ Error creating vendor record:", error);
          toast.error(`Failed to create vendor record: ${error}`);
          return;
        }

        if (data?.transaction_id) {
          const transactionId = data.transaction_id;
          // Use id from response if available, otherwise fall back to transaction_id
          const formId = data.id || data.transaction_id;

          // Store Step 1 data in session storage
          sessionStorage.setItem("Step1FormData", JSON.stringify(formData));
          sessionStorage.setItem("VendorTransactionId", transactionId);
          sessionStorage.setItem("VendorFormId", formId);

          // Navigate to main form with transaction_id
          const params = new URLSearchParams({
            formName: formName,
            orgName: orgName,
            transId: transactionId,
            step1Data: "true",
          });

          navigate(`/vendor-form?${params.toString()}`);
        } else {
          console.error("❌ Invalid response from createFormData:", data);
          const errorMessage = "Transaction ID not found in response";
          toast.error(`Failed to create vendor record: ${errorMessage}`);
        }
      } catch (error) {
        console.error("❌ Error proceeding to next step:", error);
        toast.error("Failed to proceed to next step");
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Get filtered vendor account group options based on vendor type
  const getFilteredVendorAccountGroupOptions = () => {
    if (!lovData?.vendorAccountGroup) {
      // console.log("🔍 No LOV data available for vendor account group");
      return [];
    }

    if (formData.typeOfVendor === "Employee(FK01)") {
      // For Employee type, only show V010 options
      const v010Options = lovData.vendorAccountGroup.filter((option) =>
        option.value.startsWith("V010")
      );
      // console.log("🔍 V010 options for Employee type:", v010Options);
      return v010Options;
    } else {
      // For non-Employee types, show all options except V010
      const nonV010Options = lovData.vendorAccountGroup.filter(
        (option) => !option.value.startsWith("V010")
      );
      // console.log("🔍 Non-V010 options for other types:", nonV010Options);
      return nonV010Options;
    }
  };

  // Check if vendor account group should be read-only
  const isVendorAccountGroupReadOnly = () => {
    return formData.typeOfVendor === "Employee(FK01)";
  };

  // Check if employee number field should be visible
  const isEmployeeNumberVisible = () => {
    const isVisible = formData.typeOfVendor === "Employee(FK01)";
    // console.log("🔍 Employee number field visibility:", {
    //   typeOfVendor: formData.typeOfVendor,
    //   isVisible: isVisible,
    // });
    return isVisible;
  };

  // Check if GSTIN requirement field should be visible
  const isGstinRequirementVisible = () => {
    return formData.typeOfVendor !== "Employee(FK01)";
  };

  // Check if GSTIN field should be visible
  const isGstinFieldVisible = () => {
    return (
      formData.typeOfVendor !== "Employee(FK01)" &&
      formData.gstinRequirement === "Registered"
    );
  };

  // Check if PAN field should be enabled
  const isPanFieldEnabled = () => {
    // PAN is disabled when GSTIN is registered (will be auto-populated from GSTIN)
    // PAN is enabled when GSTIN is not registered (user can enter manually)
    return formData.gstinRequirement !== "Registered";
  };

  const isForeignVendorAccountGroup = (vendorAccountGroup: string): boolean => {
    if (!vendorAccountGroup) return false;
    return vendorAccountGroup.toLowerCase().includes("foreign");
  };


  // Check if GSTIN requirement dropdown should be read-only
  const isGstinRequirementReadOnly = () => {
    // Dropdown is always enabled as per Excel specification
    return false;
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    if (!formData.typeOfVendor.trim()) return false;
    if (!formData.vendorAccountGroup.trim()) return false;
    if (!formData.name1.trim()) return false;

    const isForeign = isForeignVendorAccountGroup(formData.vendorAccountGroup);
    const isEmployee = formData.typeOfVendor === "Employee(FK01)";
    const pan = formData.panNumber.trim().toUpperCase();

    // GSTIN requirement check
    if (!isEmployee && !formData.gstinRequirement.trim()) return false;

    // -----------------------------
    // FOREIGN VENDOR PAN RULE HERE
    // -----------------------------
    if (isForeign) {
      if (pan === "NOT APPLICABLE") {
        // ok
      } else if (!pan) {
        return false;
      } else if (pan === "NA") {
        return false;
      } else if (validatePAN(pan)) {
        return false; // invalid PAN
      }
    }

    // -----------------------------
    // EMPLOYEE → PAN optional
    // -----------------------------
    else if (isEmployee) {
      if (pan && validatePAN(pan)) return false;
    }

    // -----------------------------
    // INDIAN VENDOR → PAN mandatory
    // -----------------------------
    else {
      if (!pan) return false;
      if (pan === "NA" || pan === "NOT APPLICABLE") return false;
      if (validatePAN(pan)) return false;
    }

    // GSTIN required when registered
    if (formData.gstinRequirement === "Registered") {
      if (!formData.taxNumber3GSTIN.trim()) return false;
    }

    // Employee number mandatory for V010
    if (formData.vendorAccountGroup.startsWith("V010")) {
      if (!formData.employeeNumber.trim()) return false;
    }

    return true;
  };


  // Helper function to focus on the next logical field
  const focusNextField = (currentField: string) => {
    setTimeout(() => {
      switch (currentField) {
        case "typeOfVendor":
          // After selecting vendor type, focus on vendor account group
          if (formData.typeOfVendor === "Employee(FK01)") {
            // For Employee, vendor group is auto-selected, so focus on vendor name
            vendorNameRef.current?.focus();
          } else {
            // For non-employee, focus on vendor account group
            vendorAccountGroupRef.current?.focus();
          }
          break;
        case "vendorAccountGroup":
          // After selecting vendor group, focus on vendor name
          vendorNameRef.current?.focus();
          break;
        case "name1":
          // After entering vendor name, focus on GSTIN requirement (for non-employee) or employee number (for employee)
          if (formData.typeOfVendor === "Employee(FK01)") {
            employeeNumberRef.current?.focus();
          } else {
            gstinRequirementRef.current?.focus();
          }
          break;
        case "gstinRequirement":
          // After selecting GSTIN requirement, focus on GSTIN field (if registered) or PAN
          if (formData.gstinRequirement === "Registered") {
            gstinRef.current?.focus();
          } else {
            panRef.current?.focus();
          }
          break;
        case "taxNumber3GSTIN":
          // After entering GSTIN, focus on PAN (which will be auto-populated)
          panRef.current?.focus();
          break;
        case "panNumber":
          // After entering PAN, focus on employee number (if visible)
          if (isEmployeeNumberVisible()) {
            employeeNumberRef.current?.focus();
          }
          break;
        case "employeeNumber":
          // This is the last field, no need to focus elsewhere
          break;
      }
    }, 100); // Small delay to ensure the field is ready
  };

  // Handle Enter key press to move to next field
  const handleKeyDown = (e: React.KeyboardEvent, currentField: string) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission

      // Special handling for GSTIN field - validate before moving to next field
      if (currentField === "taxNumber3GSTIN") {
        const gstinValue = formData.taxNumber3GSTIN;

        if (!gstinValue.trim()) {
          // If GSTIN is empty, show error and don't move to next field
          setErrors((prev) => ({
            ...prev,
            taxNumber3GSTIN: "GSTIN is required",
          }));
          return;
        }

        if (!isGSTINFormatValid(gstinValue)) {
          // If GSTIN format is invalid, show error and don't move to next field
          setErrors((prev) => ({
            ...prev,
            taxNumber3GSTIN:
              "Invalid GSTIN format. Please check the format and try again.",
          }));
          return;
        }

        // If GSTIN is valid, clear any errors and move to next field
        setErrors((prev) => ({ ...prev, taxNumber3GSTIN: undefined }));
        focusNextField(currentField);
      }
      // Special handling for PAN field - validate before moving to next field
      else if (currentField === "panNumber") {
        const panValue = formData.panNumber.trim();
        const isForeign = isForeignVendorAccountGroup(formData.vendorAccountGroup);
        const isEmployee = formData.typeOfVendor === "Employee(FK01)";
        const isGstinRegistered = formData.gstinRequirement === "Registered";

        // 1. Skip validation completely
        // 1. Foreign vendors → allow NA or PAN
        if (isForeign) {
          if (panValue === "NOT APPLICABLE") {
            setErrors(prev => ({ ...prev, panNumber: undefined }));
            focusNextField(currentField);
            return;
          }

          if (!panValue) {
            setErrors(prev => ({ ...prev, panNumber: "Enter PAN or 'NOT APPLICABLE'" }));
            return;
          }

          if (panValue === "NA") {
            setErrors(prev => ({ ...prev, panNumber: "Foreign vendors must enter PAN or 'NOT APPLICABLE'" }));
            return;
          }

          const panError = validatePAN(panValue);
          if (panError) {
            setErrors(prev => ({ ...prev, panNumber: panError }));
            return;
          }

          setErrors(prev => ({ ...prev, panNumber: undefined }));
          focusNextField(currentField);
          return;
        }



        // 2. If GSTIN is registered, PAN is optional
        if (isGstinRegistered) {
          if (panValue && validatePAN(panValue)) {
            setErrors(prev => ({ ...prev, panNumber: validatePAN(panValue) }));
            return;
          }
          setErrors(prev => ({ ...prev, panNumber: undefined }));
          focusNextField(currentField);
          return;
        }

        // 3. For Indian vendors + GSTIN Not Registered → PAN mandatory
        if (!panValue) {
          setErrors(prev => ({ ...prev, panNumber: "PAN is required" }));
          return;
        }

        const panError = validatePAN(panValue);
        if (panError) {
          setErrors(prev => ({ ...prev, panNumber: panError }));
          return;
        }

        setErrors(prev => ({ ...prev, panNumber: undefined }));
        focusNextField(currentField);
      }


      else {
        // For other fields, just move to next field
        focusNextField(currentField);
      }
    }
  };
  // Listen for organization changes and redirect to home
  useEffect(() => {
    const handleOrganizationChange = async (event: CustomEvent) => {
      console.log(
        "🔄 Organization changed, redirecting to home to load data based on new organization"
      );

      const newOrgName = event.detail?.orgName;
      if (!newOrgName) {
        console.warn("⚠️ No organization name in event detail");
        return;
      }

      // Clear the current form context since we're changing organizations
      sessionStorage.removeItem("Step1FormData");
      sessionStorage.removeItem("VendorTransactionId");
      sessionStorage.removeItem("VendorFormId");
      sessionStorage.removeItem("SelectedForm");

      // Redirect to home page - this will load the forms list based on the new organization
      navigate("/");
    };

    // Listen for custom organization change event
    window.addEventListener(
      "organizationChanged",
      handleOrganizationChange as unknown as EventListener
    );

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener(
        "organizationChanged",
        handleOrganizationChange as unknown as EventListener
      );
    };
  }, [navigate]);

  return (
    <div className="h-screen bg-background rounded-lg border border-border overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="bg-primary border-b border-border px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div
              onClick={handleCancel}
              className="text-muted hover:cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-lg lg:text-xl text-muted">
                STEP 1: PRIMARY VENDOR DETAILS
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-background custom-scrollbar ">
        <div className="h-full  bg-card">
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-card  p-4 pb-6 px-6">
              <div className="mb-4 md:mb-6">
                <h2 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">
                  Primary Vendor Information
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Enter the essential vendor details to get started. All fields
                  are required.
                </p>
              </div>

              <form id="step1-form" onSubmit={handleNext} className="space-y-3">
                {/* Type of Vendor - Full Width */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Label className="block font-medium text-base text-foreground">
                      Type of Vendor <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <RadioGroup
                    value={formData.typeOfVendor}
                    onValueChange={(value) =>
                      handleInputChange("typeOfVendor", value)
                    }
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 w-full justify-start"
                  >
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${errors.typeOfVendor
                        ? "bg-destructive/10 border-destructive"
                        : formData.typeOfVendor === "Employee(FK01)" &&
                          autoSelectedType === "Employee(FK01)"
                          ? "bg-accent border-accent-foreground/20"
                          : "bg-muted"
                        }`}
                    >
                      <RadioGroupItem value="Employee(FK01)" id="step1-fk01" />
                      <Label
                        htmlFor="step1-fk01"
                        className="text-xs sm:text-sm font-medium cursor-pointer text-foreground"
                      >
                        Employee
                      </Label>
                    </div>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${errors.typeOfVendor
                        ? "bg-destructive/10 border-destructive"
                        : formData.typeOfVendor ===
                          "Non Emp - Purchase Org (XK01)" &&
                          autoSelectedType === "Non Emp - Purchase Org (XK01)"
                          ? "bg-accent border-accent-foreground/20"
                          : "bg-muted"
                        }`}
                    >
                      <RadioGroupItem
                        value="Non Emp - Purchase Org (XK01)"
                        id="step1-xk01"
                      />
                      <Label
                        htmlFor="step1-xk01"
                        className="text-xs sm:text-sm font-medium cursor-pointer text-foreground"
                      >
                        Vendor Purchase Org
                      </Label>
                    </div>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${errors.typeOfVendor
                        ? "bg-destructive/10 border-destructive"
                        : formData.typeOfVendor ===
                          "Non Emp - Non Purchase Org (FK01)" &&
                          autoSelectedType ===
                          "Non Emp - Non Purchase Org (FK01)"
                          ? "bg-accent border-accent-foreground/20"
                          : "bg-muted"
                        }`}
                    >
                      <RadioGroupItem
                        value="Non Emp - Non Purchase Org (FK01)"
                        id="step1-fk01-2"
                      />
                      <Label
                        htmlFor="step1-fk01-2"
                        className="text-xs sm:text-sm font-medium cursor-pointer text-foreground"
                      >
                        Direct FI Vendor
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.typeOfVendor && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-destructive">
                        {errors.typeOfVendor}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Vendor Group */}
                  <div className="space-y-2">
                    <Label className="block font-medium text-foreground">
                      Vendor Account Group{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Popover
                      open={vendorGroupOpen}
                      onOpenChange={setVendorGroupOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          ref={vendorAccountGroupRef}
                          variant="outline"
                          role="combobox"
                          aria-expanded={vendorGroupOpen}
                          className={`w-full justify-between text-foreground bg-background ${errors.vendorAccountGroup
                            ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                            : ""
                            } ${isVendorAccountGroupReadOnly()
                              ? "bg-muted cursor-not-allowed text-muted-foreground"
                              : ""
                            }`}
                          disabled={isVendorAccountGroupReadOnly()}
                        >
                          {formData.vendorAccountGroup
                            ? getFilteredVendorAccountGroupOptions().find(
                              (option) =>
                                option.value === formData.vendorAccountGroup
                            )?.label
                            : "Choose vendor group"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0 border-0 shadow-lg"
                        align="start"
                        style={{ width: "var(--radix-popover-trigger-width)" }}
                      >
                        <Command className="border-0 outline-none focus:border-0 focus:outline-none">
                          <CommandInput
                            placeholder="Search vendor group..."
                            className="border-0 focus:border-0 focus:ring-0 outline-none"
                          />
                          <CommandList className="custom-scrollbar">
                            <CommandEmpty>No vendor group found.</CommandEmpty>
                            <CommandGroup>
                              {getFilteredVendorAccountGroupOptions().map(
                                (option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    className="hover:bg-muted/50 focus:bg-muted/50 data-[selected=true]:bg-muted/50 cursor-pointer"
                                    onSelect={(currentValue) => {
                                      handleInputChange(
                                        "vendorAccountGroup",
                                        currentValue
                                      );
                                      setVendorGroupOpen(false);

                                      // Auto-focus on vendor name after selecting vendor account group
                                      setTimeout(() => {
                                        vendorNameRef.current?.focus();
                                      }, 100);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${formData.vendorAccountGroup ===
                                        option.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                        }`}
                                    />
                                    {option.label}
                                  </CommandItem>
                                )
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.vendorAccountGroup && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive ">
                          {errors.vendorAccountGroup}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name 1 / Employee Name */}
                  <div className="space-y-2">
                    <Label className="block font-medium text-foreground">
                      {formData.typeOfVendor === "Employee(FK01)"
                        ? "Employee Name"
                        : "Vendor Name (Name1)"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={vendorNameRef}
                      value={formData.name1}
                      onChange={(e) =>
                        handleInputChange("name1", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, "name1")}
                      placeholder={
                        formData.typeOfVendor === "Employee(FK01)"
                          ? "Enter employee name"
                          : "Enter vendor name (Name1)"
                      }
                      maxLength={35}
                      className={`w-full text-foreground bg-background placeholder:text-muted-foreground ${errors.name1
                        ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                        : ""
                        }`}
                      required
                    />
                    {!formData.name1 && (
                      <p className="text-xs text-muted-foreground">Only 35 characters are allowed rest can be filled in the next screen Name2</p>
                    )}
                    {cinMandatoryForName && (
                      <p className="text-xs text-muted-foreground">
                        {/* CIN will be required unless the name continues with Co-op, Housing, CHS, or Society. */}
                      </p>
                    )}
                    {errors.name1 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive ">
                          {errors.name1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* GSTIN Requirement - Only for non-employee types */}
                  {isGstinRequirementVisible() && (
                    <div className="space-y-2">
                      <Label className="block font-medium text-foreground">
                        GSTIN Requirement{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Popover
                        open={gstinRequirementOpen}
                        onOpenChange={setGstinRequirementOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            ref={gstinRequirementRef}
                            variant="outline"
                            role="combobox"
                            aria-expanded={gstinRequirementOpen}
                            disabled={isGstinRequirementReadOnly()}
                            className={`w-full justify-between text-foreground bg-background ${errors.gstinRequirement
                              ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                              : ""
                              } ${isGstinRequirementReadOnly()
                                ? "bg-muted cursor-not-allowed text-muted-foreground"
                                : ""
                              }`}
                          >
                            {formData.gstinRequirement ||
                              "Choose GSTIN requirement"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full p-0"
                          align="start"
                          style={{
                            width: "var(--radix-popover-trigger-width)",
                          }}
                        >
                          <Command>
                            <CommandList>
                              <CommandEmpty>
                                No GSTIN requirement found.
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="Registered"
                                  onSelect={() => {
                                    handleInputChange(
                                      "gstinRequirement",
                                      "Registered"
                                    );
                                    setGstinRequirementOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${formData.gstinRequirement === "Registered"
                                      ? "opacity-100"
                                      : "opacity-0"
                                      }`}
                                  />
                                  Registered
                                </CommandItem>
                                <CommandItem
                                  value="Not Registered"
                                  onSelect={() => {
                                    handleInputChange(
                                      "gstinRequirement",
                                      "Not Registered"
                                    );
                                    setGstinRequirementOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${formData.gstinRequirement ===
                                      "Not Registered"
                                      ? "opacity-100"
                                      : "opacity-0"
                                      }`}
                                  />
                                  Not Registered
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {errors.gstinRequirement && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-destructive ">
                            {errors.gstinRequirement}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PAN - hidden for Employee(FK01) */}
                  {formData.typeOfVendor !== "Employee(FK01)" && (
                    <div className="space-y-2">
                      <Label className="block font-medium text-foreground">
                        PAN Number{" "}
                        {!isForeignVendorAccountGroup(formData.vendorAccountGroup) &&
                          formData.typeOfVendor !== "Employee(FK01)" && (
                            <span className="text-destructive">*</span>
                          )}
                      </Label>
                      <Input
                        ref={panRef}
                        value={formData.panNumber}
                        onChange={(e) =>
                          handleInputChange("panNumber", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, "panNumber")}
                        onBlur={() => handleFieldBlur("panNumber")}
                        placeholder={
                          isForeignVendorAccountGroup(formData.vendorAccountGroup)
                            ? "Enter PAN or NOT APPLICABLE"
                            : "Enter PAN Number (10 characters)"
                        }

                        maxLength={
                          isForeignVendorAccountGroup(formData.vendorAccountGroup)
                            ? 20
                            : 10
                        }

                        disabled={!isPanFieldEnabled()}
                        className={`w-full text-foreground bg-background placeholder:text-muted-foreground ${errors.panNumber
                          ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                          : ""
                          } ${!isPanFieldEnabled()
                            ? "bg-muted cursor-not-allowed text-muted-foreground"
                            : ""
                          }`}
                        required={
                          !isForeignVendorAccountGroup(formData.vendorAccountGroup) &&
                          formData.typeOfVendor !== "Employee(FK01)" &&
                          formData.gstinRequirement !== "Registered"
                        }

                      />
                      {errors.panNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-destructive ">
                            {errors.panNumber}
                          </span>
                        </div>
                      )}
                      {!isPanFieldEnabled() && (
                        <p className="text-xs text-muted-foreground">
                          {/* PAN will be automatically extracted from GSTIN */}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Employee Number - Always present but invisible when not required to maintain layout */}
                  <div
                    className={`space-y-2 transition-opacity duration-200 ${isEmployeeNumberVisible()
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                      }`}
                  >
                    <Label className="block font-medium text-foreground">
                      Employee Number{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={employeeNumberRef}
                      value={formData.employeeNumber}
                      onChange={(e) =>
                        handleInputChange("employeeNumber", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, "employeeNumber")}
                      onBlur={() => handleFieldBlur("employeeNumber")}
                      placeholder="Enter employee number"
                      disabled={!isEmployeeNumberVisible()}
                      className={`w-full text-foreground bg-background placeholder:text-muted-foreground ${errors.employeeNumber
                        ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                        : ""
                        } ${!isEmployeeNumberVisible() ? "cursor-not-allowed" : ""
                        }`}
                    />
                    {errors.employeeNumber && isEmployeeNumberVisible() && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive">
                          {errors.employeeNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* GSTIN Field - Always present but invisible when not required to maintain layout */}
                  <div
                    className={`space-y-2 transition-opacity duration-200 ${isGstinFieldVisible()
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                      }`}
                  >
                    <Label className="block font-medium text-foreground">
                      Tax Number 3 (GSTIN){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={gstinRef}
                      value={formData.taxNumber3GSTIN}
                      onChange={(e) =>
                        handleInputChange("taxNumber3GSTIN", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, "taxNumber3GSTIN")}
                      onBlur={() => handleFieldBlur("taxNumber3GSTIN")}
                      placeholder="Enter GSTIN Number (15 characters)"
                      maxLength={15}
                      disabled={!isGstinFieldVisible()}
                      className={`w-full text-foreground bg-background placeholder:text-muted-foreground ${errors.taxNumber3GSTIN
                        ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                        : ""
                        } ${!isGstinFieldVisible() ? "cursor-not-allowed" : ""}`}
                      required
                    />
                    {errors.taxNumber3GSTIN && isGstinFieldVisible() && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive ">
                          {errors.taxNumber3GSTIN}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons */}
      <div className="flex-shrink-0 bg-background border-t border-border p-3">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto sm:min-w-[120px] order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="step1-form"
              disabled={isCreating || !isFormComplete()}
              className="w-full sm:w-auto sm:min-w-[120px] order-1 sm:order-2"
            >
              {isCreating ? "Creating..." : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorForm;

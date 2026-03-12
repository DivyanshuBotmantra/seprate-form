import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getFormLov } from "@/services/form-lov";
import { getVendorDataByTransId } from "@/services/form-data";
import { mapAPILOVToDropdown, extractRegionCode } from "@/components/vendor/lov-utils";
import FormViewMode from "@/components/vendor/form-view-mode";

// Import types
import type { VendorFormData, LOVData } from "@/components/vendor";

const VendorViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [lovData, setLovData] = useState<LOVData | null>(null);
  const [vendorData, setVendorData] = useState<VendorFormData | null>(null);
  const [vendorMetadata, setVendorMetadata] = useState<{
    transactionId: string;
    formStatus: string;
    createdBy: string;
    createdOn: string;
    updatedBy?: string;
    updatedOn?: string;
    submittedBy?: string;
    submittedOn?: string;
  } | null>(null);

  // Get parameters from URL
  const transId = searchParams.get("transId") || "";
  const orgName = searchParams.get("orgName") || "Rustomjee"; // Vendor onboarding is only available for Rustom Jee
  const formName = searchParams.get("formName") || "";

  // Fetch LOV data
  useEffect(() => {
    const fetchLOVData = async () => {
      try {
        const { data, error } = await getFormLov({
          form_name: "Vendor Onboarding",
          org_name: "Rustomjee",
        });

        if (error) {
          toast.error("Failed to load form options");
        } else if (data) {
          const mappedLOV = mapAPILOVToDropdown(data);
          setLovData(mappedLOV);
        }
      } catch (error) {
        console.error("Error loading LOV data in view page:", error);
        toast.error("Failed to load form options");
      }
    };

    fetchLOVData();
  }, [orgName]);

  // Load vendor data
  useEffect(() => {
    const loadVendorData = async () => {
      if (!transId) {
        toast.error("Transaction ID not found");
        navigate(-1);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await getVendorDataByTransId(
          transId,
          orgName,
          formName
        );

        if (error) {
          toast.error(`Failed to load vendor data: ${error}`);
          // navigate('/vendor-onboarding');
          return;
        }

        if (data?.response_body?.[0]) {
          const vendorItem = data.response_body[0];

          // Map API form data to VendorFormData structure
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiFormData = vendorItem.form_data as any;
          console.log(apiFormData, "apiFormData levy");
          // Set metadata
          setVendorMetadata({
            transactionId: vendorItem.trans_id,
            formStatus: vendorItem.form_status,
            createdBy: vendorItem.created_by,
            createdOn: vendorItem.created_on,
            updatedBy: vendorItem.updated_by || undefined,
            updatedOn: vendorItem.updated_on || undefined,
            submittedBy: apiFormData.form_submitted_by || undefined,
            submittedOn: apiFormData.form_submitted_on || undefined,
          });

          // Try multiple possible field names for type of vendor
          const typeOfVendor =
            apiFormData.type_of_vendor ||
            apiFormData.typeOfVendor ||
            apiFormData.vendor_type ||
            "";

          const mappedFormData: VendorFormData = {
            typeOfVendor: typeOfVendor,
            vendorAccountGroup:
              apiFormData.vendor_details?.vendor_account_group || "",
            termsOfPaymentKey:
              apiFormData.vendor_details?.terms_of_payment_key || "",
            companyCode: apiFormData.vendor_details?.company_code || "",
            employeeNumber: apiFormData.vendor_details?.employee_number || "",
            titleText: apiFormData.vendor_details?.title_text || "",
            searchTerm1: apiFormData.vendor_details?.search_term1 || "",
            name1: apiFormData.vendor_details?.name1 || "",
            name2: apiFormData.vendor_details?.name2 || "",
            taxNumber3GSTIN: apiFormData.key_details?.gstin || "",
            panNumber: apiFormData.key_details?.pan_number || "",
            cinNumber: apiFormData.key_details?.cin_number || "",
            creditInformationNumberMSME:
              apiFormData.key_details?.credit_information_number_msme || "",
            panAadharLinkedStatus:
              apiFormData.key_details?.pan_aadhar_linked_status || "",
            gstinRequirement: apiFormData.key_details?.gstin_requirement,
            reMSMEStatus: apiFormData.key_details?.msme_status || "",
            street1: apiFormData.address_details?.street || "",
            street2: apiFormData.address_details?.street2 || "",
            street3: apiFormData.address_details?.street3 || "",
            street4: apiFormData.address_details?.street4 || "",
            street5: apiFormData.address_details?.street5 || "",
            district: apiFormData.address_details?.district || "",
            cityPostalCode: apiFormData.address_details?.city_postal_code || "",
            city: apiFormData.address_details?.city || "",
            countryKey: apiFormData.address_details?.country_key || "",
            region: extractRegionCode(
              apiFormData.address_details?.region || ""
            ),
            firstMobileNo:
              apiFormData.address_details
                ?.first_mobile_number_dialing_code_plus_number || "",
            firstTelephone:
              apiFormData.address_details
                ?.first_telephone_dialing_code_plus_number || "",
            telephoneDailing:
              apiFormData.address_details?.telephone_dialing_code_plus_number ||
              "",
            msmeStatus: apiFormData.key_details?.msme_status || "",
            primaryEmail: apiFormData.address_details?.primary_email || "",
            secondaryEmail: apiFormData.address_details?.secondary_email || "",
            // Bank Details
            bankKeyIFSCCode: apiFormData.bank_details?.bank_key_ifsc_code || "",
            bankAccountNumber:
              apiFormData.bank_details?.bank_account_number || "",
            accountHolderName:
              apiFormData.bank_details?.account_holder_name || "",
            bankCountryKey: apiFormData.bank_details?.bank_country_key || "",
            partnerBankType: apiFormData.bank_details?.partner_bank_type || "",
            // Internal Details
            reconciliationAccountInGeneralLedger:
              apiFormData.internal_details
                ?.reconciliation_account_in_general_ledger || "",
            planningGroup: apiFormData.internal_details?.planning_group || "",
            indicatorForWithHoldingTaxType1:
              apiFormData.internal_details
                ?.indicator_for_with_holding_tax_type1 || "",
            indicatorForWithHoldingTaxType2:
              apiFormData.internal_details
                ?.indicator_for_with_holding_tax_type2 || "",
            purchasingOrganization:
              apiFormData.internal_details?.purchasing_organization || "",
            purchaseOrderCurrency:
              apiFormData.internal_details?.purchase_order_currency || "",
            responsibleSalesPersonAtVendorOffice:
              apiFormData.internal_details
                ?.responsible_sales_person_at_vendor_office || "",
            orderAcknowledgmentRequirement:
              apiFormData.internal_details?.order_acknowledgment_requirement ||
              "",

            // System Fields
            name3: apiFormData.system_fields?.name3 || "",
            name4: apiFormData.system_fields?.name4 || "",
            language: apiFormData.system_fields?.language || "EN",
            addressTimeZone:
              apiFormData.system_fields?.address_time_zone || "INDIA",
            lastReviewExternal:
              apiFormData.system_fields?.last_review_external || "",
            vendorClassificationForGST:
              apiFormData.system_fields?.vendor_classification_for_gst || "",
            individualPMTCheck:
              apiFormData.system_fields?.individual_pmt_check || "No",
            keyForSortingAccordingToAssignment:
              apiFormData.system_fields
                ?.key_for_sorting_according_to_assignment_number || "",
            listOfPaymentMethodsToBeConsider:
              apiFormData.system_fields
                ?.list_of_payment_methods_to_be_considered || "",
            withHoldingTaxCode1:
              apiFormData.system_fields?.with_holding_tax_code1 || "",
            withHoldingTaxCode2:
              apiFormData.system_fields?.with_holding_tax_code2 || "",
            indicatorSubjectToWithholdTax1:
              apiFormData.system_fields?.indicator_subject_to_with_hold_tax1 ||
              "",
            indicatorSubjectToWithholdTax2:
              apiFormData.system_fields?.indicator_subject_to_with_hold_tax2 ||
              "",
            typeOfRecipient1:
              apiFormData.system_fields?.type_of_recipient1 || "",
            typeOfRecipient2:
              apiFormData.system_fields?.type_of_recipient2 || "",
            indicatorGRBasedInvoiceVerification:
              apiFormData.system_fields
                ?.indicator_gr_based_invoice_verification || "",
            indicatorServiceBasedInvoiceVerif:
              apiFormData.system_fields
                ?.indicator_for_service_based_invoice_verification || "",
            checkFlagForDoubleInvoicesOrCredit:
              apiFormData.system_fields
                ?.check_flag_for_double_invoices_or_credit_memos || "No",
            withHoldingTaxCountryKey:
              apiFormData.system_fields?.with_holding_tax_country_key || "IN",
            groupForCalculationSchemaVendor:
              apiFormData.system_fields?.group_for_calculation_schema_vendor ||
              "",
            confirmationControlKey:
              apiFormData.system_fields?.confirmation_control_key || "",

            // File attachments
            taxNumber3GSTINFile:
              apiFormData.attachments?.gstin_attachment || null,
            panNumberFile: apiFormData.attachments?.pan_attachment || null,
            creditInformationNumberMSMEFile:
              apiFormData.attachments?.msme_attachment || null,
            cinNumberFile: apiFormData.attachments?.cin_attachment || null,
            panAadharLinkedStatusFile:
              apiFormData.attachments?.pan_aadhar_linkage_attachment || null,
            bankKeyIFSCCodeFile:
              apiFormData.attachments?.bank_details_attachment || null,
          };

          setVendorData(mappedFormData);
        } else {
          toast.error("Vendor data not found");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error loading vendor data in view page:", error);
        toast.error("Failed to load vendor data");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [transId, orgName, formName, navigate]);

  // Listen for organization changes and redirect to home
  useEffect(() => {
    const handleOrganizationChange = async (event: CustomEvent) => {
      const newOrgName = event.detail?.orgName;
      if (!newOrgName) {
        return;
      }

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

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen bg-sidebar rounded-lg border border-gray-200 overflow-hidden shadow-sm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  // Show error state if no data
  if (!vendorData || !vendorMetadata) {
    return (
      <div className="h-screen bg-sidebar rounded-lg border border-gray-200 overflow-hidden shadow-sm flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Data Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested vendor data could not be found.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Vendor List
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormViewMode
      vendorData={vendorData}
      lovData={lovData}
      transactionId={vendorMetadata.transactionId}
      formStatus={vendorMetadata.formStatus}
      createdBy={vendorMetadata.createdBy}
      createdOn={vendorMetadata.createdOn}
      updatedBy={vendorMetadata.updatedBy}
      updatedOn={vendorMetadata.updatedOn}
      submittedBy={vendorMetadata.submittedBy}
      submittedOn={vendorMetadata.submittedOn}
    />
  );
};

export default VendorViewPage;

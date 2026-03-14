import type { VendorFormValues } from "./schema";
import { FORMDATA_CONFIG } from "./config";
import { 
    calculateVendorClassificationForGST, 
    calculateIndicatorSubjectToWithholdTax, 
    calculateGRBasedInvoiceVerification, 
    calculateServiceBasedInvoiceVerification, 
    calculateGroupForCalculationSchema, 
    calculateConfirmationControlKey 
} from "@/components/vendor/validation";

/**
 * Utility to get current timestamp in IST (UTC+5:30)
 */
export const getISTTimestamp = (): string => {
    const now = new Date();
    const istTime = new Date(now.getTime() + 330 * 60 * 1000);
    return istTime.toISOString().replace("Z", "+05:30");
};

/**
 * Helper to ensure a value is never null, undefined, or missing in the final JSON
 * Rule: if empty/null/undefined, pass "" (empty string)
 */
const e = (val: any) => (val === null || val === undefined || val === "" ? "" : val);

/**
 * Maps form values and context to the final update payload expected by the API.
 * Uses the nested VendorFormValues from the new system.
 * Ensures EVERY field is explicitly present with at least "" to satisfy API "null" requirements.
 */
export const prepareUpdatePayload = (
    values: VendorFormValues,
    status: "Submitted" | "Draft",
    transId: string,
    userId: string,
    formId: string
) => {
    const istTimestamp = getISTTimestamp();

    // Mapping Section by Section manually to ensure NO missing keys
    const completeFormData = {
        form_id: e(formId),
        form_submitted_by: e(userId),
        form_submitted_on: e(istTimestamp),
        type_of_vendor: e(values.type_of_vendor),
        
        vendor_details: {
            vendor_account_group: e(values.vendor_details.vendor_account_group),
            company_code: e(values.vendor_details.company_code),
            title_text: e(values.vendor_details.title_text),
            name1: e(values.vendor_details.name1),
            name2: e(values.vendor_details.name2),
            terms_of_payment_key: e(values.vendor_details.terms_of_payment_key),
            employee_number: e(values.vendor_details.employee_number),
            search_term1: e(values.vendor_details.search_term1),
        },
        
        key_details: {
            gstin: e(values.key_details.gstin),
            pan_number: e(values.key_details.pan_number),
            cin_number: e(values.key_details.cin_number),
            pan_aadhar_linked_status: e(values.key_details.pan_aadhar_linked_status),
            credit_information_number_msme: e(values.key_details.credit_information_number_msme),
            msme_status: e(values.key_details.msme_status),
            gstin_requirement: e(values.key_details.gstin_requirement),
        },

        address_details: {
            street: e(values.address_details.street),
            street2: e(values.address_details.street2),
            street3: e(values.address_details.street3),
            street4: e(values.address_details.street4),
            street5: e(values.address_details.street5),
            district: e(values.address_details.district),
            city_postal_code: e(values.address_details.city_postal_code),
            city: e(values.address_details.city),
            country_key: e(values.address_details.country_key),
            region: e(values.address_details.region),
            first_mobile_number_dialing_code_plus_number: e(values.address_details.first_mobile_number_dialing_code_plus_number),
            first_telephone_dialing_code_plus_number: e(values.address_details.first_telephone),
            telephone_dialing_code_plus_number: e(values.address_details.telephone_dailing),
            primary_email: e(values.address_details.primary_email),
            secondary_email: e(values.address_details.secondary_email),
        },

        bank_details: {
            bank_key_ifsc_code: e(values.bank_details.bank_key_ifsc_code),
            bank_account_number: e(values.bank_details.bank_account_number),
            bank_country_key: e(values.bank_details.bank_country_key),
            account_holder_name: e(values.bank_details.account_holder_name),
            partner_bank_type: e(values.bank_details.partner_bank_type),
        },

        internal_details: {
            reconciliation_account_in_general_ledger: e(values.internal_details.reconciliation_account_in_general_ledger),
            indicator_for_with_holding_tax_type1: e(values.internal_details.indicator_for_with_holding_tax_type1),
            planning_group: e(values.internal_details.planning_group),
            indicator_for_with_holding_tax_type2: e(values.internal_details.indicator_for_with_holding_tax_type2),
            purchasing_organization: e(values.internal_details.purchasing_organization),
            purchase_order_currency: e(values.internal_details.purchase_order_currency),
            responsible_sales_person_at_vendor_office: e(""), // Field not in schema yet
            order_acknowledgment_requirement: e(values.internal_details.order_acknowledgment_requirement),
        },

        system_fields: {
            // Calculated Fields
            vendor_classification_for_gst: calculateVendorClassificationForGST(values.key_details.gstin || ""),
            indicator_subject_to_with_hold_tax1: calculateIndicatorSubjectToWithholdTax(values.internal_details.indicator_for_with_holding_tax_type1 || ""),
            indicator_subject_to_with_hold_tax2: calculateIndicatorSubjectToWithholdTax(values.internal_details.indicator_for_with_holding_tax_type2 || ""),
            indicator_gr_based_invoice_verification: calculateGRBasedInvoiceVerification(values.type_of_vendor),
            indicator_for_service_based_invoice_verification: calculateServiceBasedInvoiceVerification(values.type_of_vendor),
            group_for_calculation_schema_vendor: calculateGroupForCalculationSchema(values.type_of_vendor, values.vendor_details.vendor_account_group),
            confirmation_control_key: calculateConfirmationControlKey(values.type_of_vendor, values.internal_details.order_acknowledgment_requirement || "No"),
            
            // Standard Mappings
            name3: e(values.system_fields?.name3 || "."), 
            name4: e(values.key_details.pan_number), 
            language: e(values.system_fields?.language || "EN"),
            address_time_zone: e("INDIA"), 
            last_review_external: e(""), 
            individual_pmt_check: e(values.system_fields?.individual_pmt_check || "Yes"),
            check_flag_for_double_invoices_or_credit_memos: e(values.system_fields?.check_flag_for_double_invoices_or_credit_memos || "Yes"),
            with_holding_tax_country_key: e(values.system_fields?.with_holding_tax_country_key || "IN"),
            with_holding_tax_code1: e(values.internal_details.indicator_for_with_holding_tax_type1),
            type_of_recipient1: e(values.system_fields?.type_of_recipient1),
            with_holding_tax_code2: e(values.internal_details.indicator_for_with_holding_tax_type2),
            type_of_recipient2: e(values.system_fields?.type_of_recipient2),
            key_for_sorting_according_to_assignment_number: e(values.system_fields?.key_for_sorting_according_to_assignment_number || "001"),
            list_of_payment_methods_to_be_considered: e(values.system_fields?.list_of_payment_methods_to_be_considered || "CEMNORT"),
        },

        attachments: {
            gstin_attachment: values.attachments?.gstin_attachment || { file_url: "", file_name: "", file_type: "" },
            pan_attachment: values.attachments?.pan_attachment || { file_url: "", file_name: "", file_type: "" },
            cin_attachment: values.attachments?.cin_attachment || { file_url: "", file_name: "", file_type: "" },
            msme_attachment: values.attachments?.msme_attachment || { file_url: "", file_name: "", file_type: "" },
            pan_aadhar_linkage_attachment: values.attachments?.pan_aadhar_linkage_attachment || { file_url: "", file_name: "", file_type: "" },
            bank_details_attachment: values.attachments?.bank_details_attachment || { file_url: "", file_name: "", file_type: "" },
            other_attachments: values.attachments?.other_attachments || [],
        }
    };

    const payload: any = {
        search_fields: {
            form_name: FORMDATA_CONFIG.FORM_NAME,
            org_name: FORMDATA_CONFIG.ORG_NAME,
            transaction_id: transId,
        },
        update_fields: {
            form_status: status,
            updated_by: userId,
            form_data: completeFormData,
            updated_attachment_fields: [] 
        },
        trans_history_flag: false,
        trans_data_flag: false,
    };

    if (status === "Submitted") {
        payload.email_type = "Confirmation Mail";
        payload.email_attachments_flag = true;
    }

    return payload;
};

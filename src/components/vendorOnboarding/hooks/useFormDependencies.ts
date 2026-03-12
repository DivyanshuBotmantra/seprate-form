import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { VendorFormValues } from '../form/schema';
import { FIELD_DEPENDENCIES } from '../form/config';
import { useLOVData } from '../form/LOVContext';
import { getPlanningGroupFromAccountGroup, getReceiptTypeForWithholdingTax } from '../utils/lov-utils';

/**
 * Hook to handle automatic field updates based on other field changes.
 * Centralizes the "business brain" of the form logic.
 */
export const useFormDependencies = () => {
    const { control, setValue } = useFormContext<VendorFormValues>();
    const { lovData } = useLOVData();

    // 1. GSTIN -> PAN Dependency
    const gstin = useWatch({ control, name: 'key_details.gstin' });
    useEffect(() => {
        if (gstin && gstin.length >= 12) {
            const panFromGstin = gstin.substring(
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.start, 
                FIELD_DEPENDENCIES.GSTIN_TO_PAN.end
            );
            setValue('key_details.pan_number', panFromGstin, { shouldValidate: true });
        }
    }, [gstin, setValue]);

    // 2. Vendor Account Group -> Planning Group Dependency
    const accountGroup = useWatch({ control, name: 'vendor_details.vendor_account_group' });
    useEffect(() => {
        if (accountGroup && lovData?.vendorAccPlanningGroup) {
            const autoPlanningGroup = getPlanningGroupFromAccountGroup(
                accountGroup, 
                lovData.vendorAccPlanningGroup
            );
            if (autoPlanningGroup) {
                setValue('internal_details.planning_group', autoPlanningGroup, { shouldValidate: true });
            }
        }
    }, [accountGroup, lovData, setValue]);

    // 3. Withholding Tax -> Receipt Type Mappings
    const taxType1 = useWatch({ control, name: 'internal_details.indicator_for_with_holding_tax_type1' });
    const taxType2 = useWatch({ control, name: 'internal_details.indicator_for_with_holding_tax_type2' });

    useEffect(() => {
        if (taxType1 && lovData?.receiptType1) {
            const receipt = getReceiptTypeForWithholdingTax(taxType1, lovData.receiptType1);
            setValue('internal_details.receipt_type1', receipt);
        }
    }, [taxType1, lovData, setValue]);

    useEffect(() => {
        if (taxType2 && lovData?.receiptType2) {
            const receipt = getReceiptTypeForWithholdingTax(taxType2, lovData.receiptType2);
            setValue('internal_details.receipt_type2', receipt);
        }
    }, [taxType2, lovData, setValue]);

    // 4. (Optional) MSME Status reset if NA is selected
    const msmeStatus = useWatch({ control, name: 'key_details.msme_status' });
    useEffect(() => {
        if (msmeStatus === 'NA') {
            setValue('key_details.credit_information_number_msme', '');
        }
    }, [msmeStatus, setValue]);

    return null;
};
